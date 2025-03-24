#!/usr/bin/env node

/**
 * Command-line script for managing database migrations in the HCBS Revenue Management System.
 * This script provides functionality to run, rollback, and list migrations, ensuring proper database schema evolution and version control.
 */

import yargs from 'yargs'; // yargs v17.7.1
import { hideBin } from 'yargs/helpers';
import { Knex } from 'knex'; // knex v2.4.2
import { 
  initializeDatabase, 
  closeDatabase, 
  getKnexInstance 
} from '../database/connection';
import databaseConfig from '../config/database.config';
import { logger } from '../utils/logger';
import migrations from '../database/migrations';

/**
 * Runs pending database migrations to update the schema
 */
async function runMigrations(options: any): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Get Knex instance
    const knex = getKnexInstance();

    // Log migration start message
    logger.info('Running database migrations...');

    // Run migrations using Knex migrate:latest
    const [batch, log] = await knex.migrate.latest({ directory: databaseConfig.migrations.directory });

    // Log completed migrations
    if (log.length === 0) {
      logger.info('No pending migrations to run.');
    } else {
      logger.info(`Batch ${batch} run: ${log.length} migrations complete.`, { migrations: log });
    }
  } catch (error) {
    // Handle errors with appropriate logging
    logger.error('Error running migrations', { 
      error,
      message: error.message,
      stack: error.stack
    });
    process.exit(1); // Exit with a non-zero code to indicate failure
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

/**
 * Rolls back the most recent batch of migrations
 */
async function rollbackMigrations(options: any): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Get Knex instance
    const knex = getKnexInstance();

    // Log rollback start message
    logger.info('Rolling back database migrations...');

    // Determine number of migrations to roll back (all or specific batch)
    const rollbackConfig: any = { directory: databaseConfig.migrations.directory };
    if (options.all) {
      rollbackConfig.all = true;
    }

    // Run rollback using Knex migrate:rollback
    const [batch, log] = await knex.migrate.rollback(rollbackConfig);

    // Log rolled back migrations
    logger.info(`Batch ${batch} rolled back: ${log.length} migrations complete.`, { migrations: log });
  } catch (error) {
    // Handle errors with appropriate logging
    logger.error('Error rolling back migrations', { 
      error,
      message: error.message,
      stack: error.stack
    });
    process.exit(1); // Exit with a non-zero code to indicate failure
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

/**
 * Lists all migrations and their status (completed or pending)
 */
async function listMigrations(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Get Knex instance
    const knex = getKnexInstance();

    // Query migration table to get completed migrations
    const completedMigrations = await knex('knex_migrations').select('name').orderBy('name');

    // Compare with available migrations to determine pending migrations
    const availableMigrations = migrations.map(migration => migration.name);
    const completedMigrationNames = completedMigrations.map(m => m.name);
    const pendingMigrations = availableMigrations.filter(m => !completedMigrationNames.includes(m));

    // Display migration status in a formatted table
    logger.info('Migration Status:');
    if (completedMigrations.length > 0) {
      logger.info('Completed Migrations:');
      completedMigrations.forEach(migration => {
        logger.info(`- ${migration.name}`);
      });
    } else {
      logger.info('No completed migrations found.');
    }

    if (pendingMigrations.length > 0) {
      logger.info('Pending Migrations:');
      pendingMigrations.forEach(migration => {
        logger.info(`- ${migration}`);
      });
    } else {
      logger.info('No pending migrations found.');
    }
  } catch (error) {
    // Handle errors with appropriate logging
    logger.error('Error listing migrations', { 
      error,
      message: error.message,
      stack: error.stack
    });
    process.exit(1); // Exit with a non-zero code to indicate failure
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

/**
 * Creates a new migration file with the given name
 */
async function createMigration(name: string): Promise<void> {
  try {
    // Validate migration name
    if (!name) {
      logger.error('Migration name is required.');
      process.exit(1);
    }

    // Generate timestamp for migration filename
    const timestamp = new Date().toISOString().replace(/[-:]|\.\d+/g, '').slice(0, 14);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.ts`;
    const filepath = `${databaseConfig.migrations.directory}/${filename}`;

    // Create migration file with up and down functions
    const migrationContent = `
import { Knex } from 'knex';

/**
 * Apply the migration changes
 */
export async function up(knex: Knex): Promise<void> {
  // Implement migration logic here
}

/**
 * Revert the migration changes
 */
export async function down(knex: Knex): Promise<void> {
  // Implement rollback logic here
}
`;

    // Write the migration file
    const fs = require('fs').promises;
    await fs.writeFile(filepath, migrationContent);

    // Log migration file creation
    logger.info(`Created migration file: ${filepath}`);
  } catch (error) {
    // Handle errors with appropriate logging
    logger.error('Error creating migration file', { 
      error,
      message: error.message,
      stack: error.stack
    });
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
}

/**
 * Main function that parses command line arguments and executes the appropriate migration command
 */
async function main(): Promise<void> {
  // Set up yargs command line interface
  const argv = yargs(hideBin(process.argv))
    .scriptName('migrate')
    .usage('$0 <command> [options]')
    .command('run', 'Run pending migrations')
    .command('rollback', 'Rollback the last batch of migrations', (yargs) => {
      yargs.option('all', {
        describe: 'Rollback all migrations',
        type: 'boolean',
        default: false
      });
    })
    .command('list', 'List all migrations and their status')
    .command('create <name>', 'Create a new migration file', (yargs) => {
      yargs.positional('name', {
        describe: 'Name of the migration',
        type: 'string'
      });
    })
    .help()
    .alias('help', 'h')
    .parse();

  // Extract the command from the arguments
  const command = argv._[0];

  try {
    // Execute the appropriate command based on user input
    switch (command) {
      case 'run':
        await runMigrations(argv);
        break;
      case 'rollback':
        await rollbackMigrations(argv);
        break;
      case 'list':
        await listMigrations();
        break;
      case 'create':
        await createMigration(argv.name as string);
        break;
      default:
        logger.error(`Invalid command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    // Handle errors with appropriate logging and exit codes
    logger.error('An unexpected error occurred', { 
      error,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Execute the main function
main();