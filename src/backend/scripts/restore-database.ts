#!/usr/bin/env node
/**
 * Database Restoration Script
 * 
 * Restores the HCBS Revenue Management System database from a backup.
 * Supports restoring from local backup files or S3 storage, with options for
 * different backup formats. Ensures proper validation of backup files before
 * restoration and handles the restoration process with appropriate error
 * handling and logging.
 */

import * as fs from 'fs-extra'; // v11.1.1
import * as path from 'path'; // v0.12.7
import { exec } from 'child_process'; // Node.js built-in
import * as dotenv from 'dotenv'; // v16.0.3
import * as yargs from 'yargs'; // v17.7.2
import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3'; // v3.350.0

import { connection } from '../config/database.config';
import { logger } from '../utils/logger';
import { downloadFileFromS3, ensureDirectoryExists, readFileAsBuffer } from '../utils/file';
import { initializeDatabase, closeDatabase } from '../database/connection';

// Constants
const BACKUP_PREFIX = 'database-backup';
const RESTORE_DIR = path.join(process.cwd(), 'restore');

/**
 * Creates a directory for storing downloaded backup files during restoration
 * @returns Path to the restore directory
 */
async function createRestoreDirectory(): Promise<string> {
  try {
    await ensureDirectoryExists(RESTORE_DIR);
    logger.info(`Restore directory created/confirmed at: ${RESTORE_DIR}`);
    return RESTORE_DIR;
  } catch (error) {
    logger.error('Failed to create restore directory', { error });
    throw new Error(`Failed to create restore directory: ${error.message}`);
  }
}

/**
 * Lists available database backups from S3 storage
 * @returns List of available backups with keys and dates
 */
async function listAvailableBackups(): Promise<Array<{ key: string, lastModified: Date }>> {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const command = new ListObjectsCommand({
      Bucket: process.env.S3_BUCKET || '',
      Prefix: BACKUP_PREFIX
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      logger.info('No backup files found in S3');
      return [];
    }

    const backups = response.Contents
      .filter(obj => obj.Key && obj.LastModified)
      .map(obj => ({
        key: obj.Key!,
        lastModified: obj.LastModified!
      }))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()); // newest first
    
    logger.info(`Found ${backups.length} backup(s) in S3`);
    return backups;
  } catch (error) {
    logger.error('Failed to list backups from S3', { error });
    throw new Error(`Failed to list backups: ${error.message}`);
  }
}

/**
 * Downloads a backup file from S3 storage
 * @param storageKey S3 object key
 * @param outputPath Local path to save the file
 * @returns True if download was successful
 */
async function downloadBackup(storageKey: string, outputPath: string): Promise<boolean> {
  try {
    logger.info(`Downloading backup from S3: ${storageKey}`);
    const file = await downloadFileFromS3(storageKey);
    await fs.writeFile(outputPath, file.content);
    logger.info(`Backup downloaded successfully to: ${outputPath}`, { size: file.content.length });
    return true;
  } catch (error) {
    logger.error('Failed to download backup from S3', { storageKey, error });
    return false;
  }
}

/**
 * Decompresses a gzipped backup file
 * @param inputPath Path to the compressed backup file
 * @returns Path to the decompressed backup file
 */
async function decompressBackup(inputPath: string): Promise<string> {
  // Only decompress if the file has a .gz extension
  if (!inputPath.endsWith('.gz')) {
    return inputPath;
  }

  const outputPath = inputPath.slice(0, -3); // Remove .gz extension
  
  return new Promise<string>((resolve, reject) => {
    exec(`gunzip -c "${inputPath}" > "${outputPath}"`, (error) => {
      if (error) {
        logger.error('Failed to decompress backup file', { inputPath, error });
        reject(new Error(`Failed to decompress backup file: ${error.message}`));
      } else {
        logger.info(`Backup file decompressed successfully: ${outputPath}`);
        resolve(outputPath);
      }
    });
  });
}

/**
 * Validates a backup file to ensure it's a valid PostgreSQL backup
 * @param filePath Path to the backup file
 * @param format Backup format (custom, plain, etc.)
 * @returns True if backup file is valid
 */
async function validateBackupFile(filePath: string, format: string): Promise<boolean> {
  try {
    // First check if file exists
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      logger.error(`Backup file not found: ${filePath}`);
      return false;
    }

    // Format-specific validation
    if (format === 'custom') {
      // For custom format, we can check the header signature
      const buffer = await readFileAsBuffer(filePath);
      // PostgreSQL custom format files start with 'PGDMP'
      if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== 'PGDMP') {
        logger.error(`Invalid custom format backup file: ${filePath}`);
        return false;
      }
    } else if (format === 'plain') {
      // For plain format, check if it contains SQL statements
      const data = await fs.readFile(filePath, 'utf8');
      if (!data.includes('CREATE') && !data.includes('INSERT')) {
        logger.error(`Invalid plain format backup file: ${filePath}`);
        return false;
      }
    }

    logger.info(`Backup file validated successfully: ${filePath}`, { format });
    return true;
  } catch (error) {
    logger.error('Failed to validate backup file', { filePath, format, error });
    return false;
  }
}

/**
 * Executes pg_restore to restore a database from backup
 * @param inputPath Path to the backup file
 * @param format Backup format (custom, plain, etc.)
 * @returns True if restoration was successful
 */
async function executeRestore(inputPath: string, format: string): Promise<boolean> {
  // Extract connection information from database config
  const { host, port, database, user, password } = connection;
  
  // Construct environment variables for authentication
  const env = {
    ...process.env,
    PGPASSWORD: password
  };

  // Build the base restore command
  let command: string;
  
  if (format === 'plain') {
    // Use psql for plain SQL files
    command = `psql -h ${host} -p ${port} -d ${database} -U ${user} -f "${inputPath}"`;
  } else {
    // Use pg_restore for other formats
    command = `pg_restore -h ${host} -p ${port} -d ${database} -U ${user}`;
    
    // Add format-specific flags
    if (format === 'custom') {
      command += ' -Fc';
    } else if (format === 'directory') {
      command += ' -Fd';
    } else if (format === 'tar') {
      command += ' -Ft';
    }
    
    // Common options
    command += ' --clean --if-exists --no-owner --no-privileges --no-comments';
    
    // Input file
    command += ` "${inputPath}"`;
  }
  
  return new Promise<boolean>((resolve, reject) => {
    logger.info(`Executing database restoration: ${command}`);
    
    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        logger.error('Database restoration failed', { 
          error, 
          stdout, 
          stderr,
          command: command.replace(new RegExp(password, 'g'), '******') // Mask password in logs
        });
        reject(new Error(`Database restoration failed: ${error.message}`));
      } else {
        if (stderr) {
          logger.warn('Database restoration completed with warnings', { stderr });
        }
        logger.info('Database restoration completed successfully');
        resolve(true);
      }
    });
  });
}

/**
 * Removes temporary files created during the restoration process
 * @param filePath Path to the file to remove
 * @returns True if cleanup was successful
 */
async function cleanupRestoreFiles(filePath: string): Promise<boolean> {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.unlink(filePath);
      logger.info(`Temporary file deleted: ${filePath}`);
    }
    return true;
  } catch (error) {
    logger.error('Failed to clean up temporary files', { filePath, error });
    return false;
  }
}

/**
 * Main function that orchestrates the database restoration process
 * @param backupKey S3 storage key of the backup (optional)
 * @param format Backup format (custom, plain, etc.)
 * @param localFilePath Path to a local backup file (optional)
 * @returns True if restoration was successful
 */
async function runRestore(backupKey?: string, format?: string, localFilePath?: string): Promise<boolean> {
  try {
    format = format || 'custom';
    logger.info('Starting database restoration process', { backupKey, format, localFilePath });
    
    let restoreFilePath: string;
    
    // If backupKey is provided, download from S3
    if (backupKey) {
      // Create restore directory
      const restoreDir = await createRestoreDirectory();
      const fileName = path.basename(backupKey);
      const outputPath = path.join(restoreDir, fileName);
      
      // Download backup from S3
      const downloaded = await downloadBackup(backupKey, outputPath);
      if (!downloaded) {
        throw new Error(`Failed to download backup from S3: ${backupKey}`);
      }
      
      restoreFilePath = outputPath;
    } 
    // If localFilePath is provided, use it
    else if (localFilePath) {
      // Check if file exists
      const exists = await fs.pathExists(localFilePath);
      if (!exists) {
        throw new Error(`Local backup file not found: ${localFilePath}`);
      }
      
      restoreFilePath = localFilePath;
    } else {
      throw new Error('Either backupKey or localFilePath must be provided');
    }
    
    // Decompress if needed
    if (restoreFilePath.endsWith('.gz')) {
      restoreFilePath = await decompressBackup(restoreFilePath);
    }
    
    // Validate backup file
    const isValid = await validateBackupFile(restoreFilePath, format);
    if (!isValid) {
      throw new Error(`Invalid backup file: ${restoreFilePath}`);
    }
    
    // Close any existing database connections
    logger.info('Closing existing database connections before restoration');
    await closeDatabase();
    
    // Execute restore
    await executeRestore(restoreFilePath, format);
    
    // Re-initialize database connection
    logger.info('Re-initializing database connection after restoration');
    await initializeDatabase();
    
    // Clean up temporary files
    await cleanupRestoreFiles(restoreFilePath);
    
    logger.info('Database restoration process completed successfully');
    return true;
  } catch (error) {
    logger.error('Database restoration process failed', { error });
    return false;
  }
}

/**
 * Prompts the user for confirmation before proceeding with database restoration
 * @returns True if user confirms, false otherwise
 */
async function promptForConfirmation(): Promise<boolean> {
  process.stdout.write('\n\x1b[31mWARNING: This operation will delete all existing data in the database.\x1b[0m\n');
  process.stdout.write('Type \x1b[1mRESTORE\x1b[0m to confirm: ');
  
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      const input = data.toString().trim();
      if (input === 'RESTORE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Entry point for the script that parses arguments and initiates the restoration process
 */
async function main(): Promise<void> {
  // Load environment variables
  dotenv.config();
  
  // Parse command line arguments
  const args = yargs
    .option('list', {
      alias: 'l',
      description: 'List available backups',
      type: 'boolean'
    })
    .option('key', {
      alias: 'k',
      description: 'S3 storage key of the backup to restore',
      type: 'string'
    })
    .option('file', {
      alias: 'f',
      description: 'Path to a local backup file',
      type: 'string'
    })
    .option('format', {
      description: 'Backup format (custom, plain, directory, tar)',
      type: 'string',
      default: 'custom'
    })
    .option('force', {
      description: 'Skip confirmation prompt',
      type: 'boolean',
      default: false
    })
    .help()
    .argv;
  
  // List available backups if requested
  if (args.list) {
    const backups = await listAvailableBackups();
    
    if (backups.length === 0) {
      console.log('No backups found.');
      return;
    }
    
    console.log('Available backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.key} (${backup.lastModified.toISOString()})`);
    });
    
    return;
  }
  
  // Validate input parameters
  if (!args.key && !args.file) {
    console.error('Error: Either --key or --file must be provided');
    process.exit(1);
  }
  
  // Get confirmation unless --force is specified
  if (!args.force) {
    const confirmed = await promptForConfirmation();
    if (!confirmed) {
      console.log('Restoration cancelled.');
      process.exit(0);
    }
  }
  
  // Run the restoration process
  const success = await runRestore(args.key, args.format, args.file);
  
  if (success) {
    logger.info('Database restoration completed successfully');
    process.exit(0);
  } else {
    logger.error('Database restoration failed');
    process.exit(1);
  }
}

// Execute the script when run directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Restoration failed', { error });
    process.exit(1);
  });
}