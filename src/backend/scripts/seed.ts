/**
 * Command-line script for seeding the HCBS Revenue Management System database with initial, test, or development data based on the specified environment.
 * This script provides a convenient way to initialize the database with appropriate data for different environments during setup, testing, or development.
 */

import yargs from 'yargs'; // yargs v17.7.2 - Command-line argument parsing
import { hideBin } from 'yargs/helpers';
import { db, initializeDatabase, closeDatabase } from '../database/connection'; // Database connection for seed operations
import { logger } from '../utils/logger'; // Logging seed operations and errors
import { seedDatabase } from '../database/seeds'; // Main function to seed database based on environment

/**
 * Sets up the command-line interface with yargs
 */
function setupCommandLine(): { env: string } {
  // Configure yargs with options for environment (--env, -e)
  const argv = yargs(hideBin(process.argv))
    .option('env', {
      alias: 'e',
      type: 'string',
      description: 'Specify the environment (development, test, production)',
      default: 'development', // Set default environment to 'development'
    })
    .check((argv) => {
      // Add validation for environment values (development, test, production)
      if (argv.env !== 'development' && argv.env !== 'test' && argv.env !== 'production') {
        throw new Error('The environment must be one of: development, test, production');
      }
      return true; // indicate that the check passed
    })
    .help() // Add help text and usage examples
    .parseSync(); // Parse and return command-line arguments

  return {
    env: argv.env as string,
  };
}

/**
 * Main function that parses command-line arguments and seeds the database
 */
async function main(): Promise<void> {
  try {
    // Set up yargs command-line interface with options for environment
    const { env } = setupCommandLine();

    // Initialize database connection
    await initializeDatabase();

    // Log start of database seeding process
    logger.info(`Starting database seeding for environment: ${env}`);

    // Call seedDatabase function with the specified environment
    await seedDatabase(env);

    // Log successful completion of seeding process
    logger.info('Database seeding completed successfully');
  } catch (error) {
    // Handle and log any errors during the process
    logger.error('Database seeding failed', { error });
    process.exitCode = 1;
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

// Execute the main function
main().catch((error) => {
  // Handle any unhandled errors
  logger.error('Unhandled error during database seeding', { error });
  process.exitCode = 1;
}).finally(() => {
  // Exit process with appropriate exit code
  process.exit(process.exitCode || 0);
});