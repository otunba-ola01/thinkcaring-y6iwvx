#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * This script creates and manages database backups for the HCBS Revenue Management System.
 * It performs PostgreSQL database dumps, compresses them, and uploads them to S3 storage
 * for disaster recovery purposes. The script also supports retention policy enforcement to
 * manage storage usage.
 * 
 * Usage:
 *   npm run backup -- --format=custom --keep-local
 * 
 * Options:
 *   --format     Backup format (custom, plain, directory, tar) [default: "custom"]
 *   --keep-local Keep local backup files after upload [default: false]
 */

import * as fs from 'fs-extra'; // fs-extra ^11.1.1
import * as path from 'path'; // path ^0.12.7
import { exec } from 'child_process'; // child_process ^1.0.2
import * as dotenv from 'dotenv'; // dotenv ^16.0.3
import * as yargs from 'yargs'; // yargs ^17.7.2
import { 
  S3Client, 
  ListObjectsCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3'; // @aws-sdk/client-s3 ^3.350.0

import { connection } from '../config/database.config';
import { logger } from '../utils/logger';
import { 
  uploadFileToS3, 
  ensureDirectoryExists, 
  calculateFileHash 
} from '../utils/file';

// Constants
const BACKUP_PREFIX = 'database-backup';
const BACKUP_RETENTION_DAYS = process.env.BACKUP_RETENTION_DAYS 
  ? parseInt(process.env.BACKUP_RETENTION_DAYS, 10) 
  : 30; // Default to 30 days retention
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * Creates a directory for storing database backups if it doesn't exist
 * 
 * @returns Promise resolving to the path of the backup directory
 */
async function createBackupDirectory(): Promise<string> {
  try {
    await ensureDirectoryExists(BACKUP_DIR);
    logger.info('Backup directory ready', { path: BACKUP_DIR });
    return BACKUP_DIR;
  } catch (error) {
    logger.error('Failed to create backup directory', { error, path: BACKUP_DIR });
    throw error;
  }
}

/**
 * Generates a filename for the database backup based on timestamp and format
 * 
 * @param format Backup format (custom, plain, directory, tar)
 * @returns Generated backup filename
 */
function generateBackupFilename(format: string): string {
  const now = new Date();
  const dateStr = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
  
  // Determine file extension based on format
  let extension: string;
  switch (format) {
    case 'plain':
      extension = 'sql';
      break;
    case 'custom':
      extension = 'dump';
      break;
    case 'directory':
      extension = 'dir';
      break;
    case 'tar':
      extension = 'tar';
      break;
    default:
      extension = 'dump'; // Default to custom format
  }
  
  return `${BACKUP_PREFIX}_${dateStr}.${extension}`;
}

/**
 * Executes pg_dump to create a database backup
 * 
 * @param outputPath Path where the backup file will be stored
 * @param format Backup format (custom, plain, directory, tar)
 * @returns Promise resolving to true if backup was successful, false otherwise
 */
async function executeBackup(outputPath: string, format: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    try {
      // Extract database connection details
      const { host, port, database, user, password } = connection;
      
      // Set environment variables for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: password
      };
      
      // Build pg_dump command
      let command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database}`;
      
      // Add format-specific flags
      switch (format) {
        case 'plain':
          command += ' -F p';
          break;
        case 'custom':
          command += ' -F c';
          break;
        case 'directory':
          command += ' -F d';
          break;
        case 'tar':
          command += ' -F t';
          break;
        default:
          command += ' -F c'; // Default to custom format
      }
      
      // Add additional options for better backups
      if (format === 'custom' || format === 'directory') {
        command += ' -Z 9'; // Maximum compression
      }
      
      command += ' -v'; // Verbose output
      
      // Add output file
      command += ` -f ${outputPath}`;
      
      const startTime = Date.now();
      logger.info('Starting database backup', { format, outputPath });
      
      // Execute pg_dump
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          logger.error('Database backup failed', { error, stderr });
          resolve(false);
          return;
        }
        
        // Check if file was created
        fs.access(outputPath, fs.constants.F_OK, (accessError) => {
          if (accessError) {
            logger.error('Backup file was not created', { accessError, outputPath });
            resolve(false);
            return;
          }
          
          // Get file size for logging
          fs.stat(outputPath, (statError, stats) => {
            const duration = Date.now() - startTime;
            
            if (statError) {
              logger.error('Failed to get backup file stats', { statError, outputPath });
            } else {
              logger.info('Database backup completed successfully', { 
                outputPath, 
                size: stats.size,
                sizeHuman: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                format,
                duration: `${(duration / 1000).toFixed(2)}s`
              });
            }
            resolve(true);
          });
        });
      });
    } catch (error) {
      logger.error('Exception during database backup', { error });
      reject(error);
    }
  });
}

/**
 * Compresses a backup file using gzip
 * 
 * @param inputPath Path to the backup file to compress
 * @returns Promise resolving to the path of the compressed file
 */
async function compressBackup(inputPath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      // If the backup format is directory, tar it first
      if (inputPath.endsWith('.dir')) {
        const tarPath = inputPath.replace(/\.dir$/, '.tar');
        const tarCommand = `tar -cf ${tarPath} -C ${path.dirname(inputPath)} ${path.basename(inputPath)}`;
        
        exec(tarCommand, (tarError) => {
          if (tarError) {
            logger.error('Failed to create tar from directory backup', { error: tarError, inputPath });
            reject(tarError);
            return;
          }
          
          // Now compress the tarball
          compressFile(tarPath).then(resolve).catch(reject);
        });
        return;
      }
      
      // For other formats, compress directly
      compressFile(inputPath).then(resolve).catch(reject);
    } catch (error) {
      logger.error('Exception during backup compression', { error });
      reject(error);
    }
  });
  
  function compressFile(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const outputPath = `${filePath}.gz`;
      const startTime = Date.now();
      
      logger.info('Compressing backup file', { filePath, outputPath });
      
      // Use gzip to compress the file
      exec(`gzip -c ${filePath} > ${outputPath}`, (error, stdout, stderr) => {
        if (error) {
          logger.error('Backup compression failed', { error, stderr });
          reject(error);
          return;
        }
        
        // Check if compressed file was created
        fs.access(outputPath, fs.constants.F_OK, (accessError) => {
          if (accessError) {
            logger.error('Compressed file was not created', { accessError, outputPath });
            reject(new Error('Compressed file was not created'));
            return;
          }
          
          // Get file sizes for logging
          Promise.all([
            fs.stat(filePath),
            fs.stat(outputPath)
          ]).then(([originalStats, compressedStats]) => {
            const duration = Date.now() - startTime;
            const compressionRatio = (originalStats.size / compressedStats.size).toFixed(2);
            
            logger.info('Backup compression completed successfully', { 
              outputPath, 
              originalSize: originalStats.size,
              compressedSize: compressedStats.size,
              compressionRatio,
              duration: `${(duration / 1000).toFixed(2)}s`
            });
            
            resolve(outputPath);
          }).catch(statError => {
            logger.error('Failed to get file stats', { statError });
            resolve(outputPath); // Still return the path even if we can't get stats
          });
        });
      });
    });
  }
}

/**
 * Uploads a backup file to S3 storage
 * 
 * @param filePath Path to the file to upload
 * @returns Promise resolving to the uploaded file information
 */
async function uploadBackup(filePath: string): Promise<{ storageKey: string; etag: string }> {
  try {
    const fileName = path.basename(filePath);
    const fileStats = await fs.stat(filePath);
    const startTime = Date.now();
    
    logger.info('Uploading backup to S3', { 
      filePath, 
      size: fileStats.size,
      sizeHuman: `${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`
    });
    
    // Read file content
    const fileContent = await fs.readFile(filePath);
    
    // Calculate hash for integrity verification
    const fileHash = calculateFileHash(fileContent);
    
    // Generate S3 storage key based on filename
    const storageKey = `backups/${fileName}`;
    
    // Current date for metadata
    const backupDate = new Date().toISOString();
    const dbName = connection.database;
    
    // Upload to S3
    const contentType = 'application/octet-stream';
    const result = await uploadFileToS3(fileContent, storageKey, contentType, {
      'backup-date': backupDate,
      'backup-type': 'database',
      'database-name': dbName,
      'original-filename': fileName,
      'file-hash': fileHash
    });
    
    const duration = Date.now() - startTime;
    const uploadSpeed = ((fileStats.size / 1024 / 1024) / (duration / 1000)).toFixed(2);
    
    logger.info('Backup uploaded successfully', { 
      filePath, 
      storageKey: result.storageKey,
      etag: result.etag,
      duration: `${(duration / 1000).toFixed(2)}s`,
      uploadSpeed: `${uploadSpeed} MB/s`
    });
    
    return result;
  } catch (error) {
    logger.error('Failed to upload backup to S3', { error, filePath });
    throw error;
  }
}

/**
 * Removes backup files older than the retention period from S3
 * 
 * @returns Promise resolving to the number of deleted backup files
 */
async function cleanupOldBackups(): Promise<number> {
  try {
    const s3Bucket = process.env.AWS_S3_BUCKET;
    
    if (!s3Bucket) {
      logger.warn('S3 bucket not configured, skipping old backup cleanup');
      return 0;
    }
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);
    
    logger.info('Cleaning up old backups', { 
      bucket: s3Bucket,
      retentionDays: BACKUP_RETENTION_DAYS,
      cutoffDate: cutoffDate.toISOString()
    });
    
    // List objects in the backup prefix
    const listCommand = new ListObjectsCommand({
      Bucket: s3Bucket,
      Prefix: `backups/${BACKUP_PREFIX}`
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      logger.info('No backups found to clean up');
      return 0;
    }
    
    // Filter for objects older than the cutoff date
    const oldBackups = listResponse.Contents.filter(obj => 
      obj.LastModified && obj.LastModified < cutoffDate
    );
    
    if (oldBackups.length === 0) {
      logger.info('No old backups to delete');
      return 0;
    }
    
    // Delete each old backup
    let deletedCount = 0;
    for (const backup of oldBackups) {
      if (!backup.Key) continue;
      
      const deleteCommand = new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: backup.Key
      });
      
      await s3Client.send(deleteCommand);
      deletedCount++;
      
      logger.info('Deleted old backup', { 
        key: backup.Key, 
        lastModified: backup.LastModified?.toISOString()
      });
    }
    
    logger.info('Old backup cleanup completed', { 
      deletedCount,
      totalBackups: listResponse.Contents.length,
      remainingBackups: listResponse.Contents.length - deletedCount
    });
    
    return deletedCount;
  } catch (error) {
    logger.error('Failed to clean up old backups', { error });
    return 0;
  }
}

/**
 * Removes local backup files after successful upload
 * 
 * @param filePath Path to the file to delete
 * @returns Promise resolving to true if cleanup was successful, false otherwise
 */
async function cleanupLocalBackups(filePath: string): Promise<boolean> {
  try {
    // Check if file exists
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      logger.warn('File not found for cleanup', { filePath });
      return false;
    }
    
    // Delete file
    await fs.unlink(filePath);
    logger.info('Deleted local backup file', { filePath });
    
    // Also delete the original uncompressed file if it exists
    if (filePath.endsWith('.gz')) {
      const originalPath = filePath.slice(0, -3);
      const originalExists = await fs.pathExists(originalPath);
      
      if (originalExists) {
        await fs.unlink(originalPath);
        logger.info('Deleted original uncompressed backup file', { filePath: originalPath });
      }
      
      // If it was a directory backup, check for the directory too
      if (originalPath.endsWith('.tar')) {
        const dirPath = originalPath.replace(/\.tar$/, '.dir');
        const dirExists = await fs.pathExists(dirPath);
        
        if (dirExists) {
          await fs.remove(dirPath); // Use remove for directories
          logger.info('Deleted original directory backup', { filePath: dirPath });
        }
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to delete local backup file', { error, filePath });
    return false;
  }
}

/**
 * Main function that orchestrates the database backup process
 * 
 * @param format Backup format (custom, plain, directory, tar)
 * @param keepLocal Whether to keep local backup files after upload
 * @returns Promise resolving to true if backup was successful, false otherwise
 */
async function runBackup(format: string, keepLocal: boolean): Promise<boolean> {
  const startTime = Date.now();
  logger.info('Starting database backup process', { 
    format, 
    keepLocal,
    database: connection.database,
    retentionDays: BACKUP_RETENTION_DAYS
  });
  
  try {
    // Create backup directory
    const backupDir = await createBackupDirectory();
    
    // Generate backup filename
    const backupFilename = generateBackupFilename(format);
    const backupPath = path.join(backupDir, backupFilename);
    
    // Execute database backup
    const backupSuccess = await executeBackup(backupPath, format);
    if (!backupSuccess) {
      logger.error('Database backup failed');
      return false;
    }
    
    // Compress backup
    const compressedPath = await compressBackup(backupPath);
    
    // Upload to S3
    await uploadBackup(compressedPath);
    
    // Clean up old backups based on retention policy
    await cleanupOldBackups();
    
    // Clean up local files if not keeping them
    if (!keepLocal) {
      await cleanupLocalBackups(compressedPath);
    }
    
    const duration = (Date.now() - startTime) / 1000;
    logger.info('Database backup process completed successfully', {
      duration: `${duration.toFixed(2)}s`,
      format,
      database: connection.database
    });
    
    return true;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.error('Database backup process failed', { 
      error, 
      duration: `${duration.toFixed(2)}s`,
      format,
      database: connection.database
    });
    
    return false;
  }
}

/**
 * Entry point for the script that parses arguments and initiates the backup process
 */
async function main(): Promise<void> {
  // Load environment variables
  dotenv.config();
  
  // Parse command line arguments
  const argv = yargs
    .option('format', {
      alias: 'f',
      description: 'Backup format (custom, plain, directory, tar)',
      type: 'string',
      default: 'custom',
      choices: ['custom', 'plain', 'directory', 'tar']
    })
    .option('keep-local', {
      alias: 'k',
      description: 'Keep local backup files after upload',
      type: 'boolean',
      default: false
    })
    .help()
    .alias('help', 'h')
    .parse();
  
  // Get arguments
  const format = argv.format as string;
  const keepLocal = argv['keep-local'] as boolean;
  
  // Run backup
  const success = await runBackup(format, keepLocal);
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Backup failed', { error });
    process.exit(1);
  });
}

// Export functions for testing or programmatic use
export {
  createBackupDirectory,
  generateBackupFilename,
  executeBackup,
  compressBackup,
  uploadBackup,
  cleanupOldBackups,
  cleanupLocalBackups,
  runBackup
};