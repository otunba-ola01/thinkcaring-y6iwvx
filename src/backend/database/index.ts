/**
 * Main entry point for the database layer of the HCBS Revenue Management System.
 * This file aggregates and exports all database-related functionality including connection management, repositories, migrations, and seeding operations, providing a unified interface for database interactions throughout the application.
 */

import { db, initializeDatabase, closeDatabase, getTransaction } from './connection'; // Import database connection management functionality
import { repositories } from './repositories'; // Import all repository instances
import migrations from './migrations'; // Import database migrations
import { seedDatabase, seedInitialData, seedTestData, seedDevData } from './seeds'; // Import database seeding function

/**
 * @file Main entry point for the database layer
 */

/**
 * Initializes the database connection and prepares the database for use
 * @param runMigrations - boolean
 * @param environment - string
 * @returns Promise<void> Resolves when database is initialized
 */
async function initialize(runMigrations: boolean, environment: string): Promise<void> {
  // Initialize the database connection
  await initializeDatabase();

  // If runMigrations is true, run database migrations
  if (runMigrations) {
    logger.info('Running database migrations');
    try {
      const knex = db; // Access the Knex instance from the db object
      await knex.migrate.latest({ directory: './src/backend/database/migrations' });
      logger.info('Database migrations completed successfully');
    } catch (migrationError) {
      logger.error('Error running database migrations', { error: migrationError });
      throw migrationError;
    }
  }

  // If environment is provided, seed the database with appropriate data for that environment
  if (environment) {
    logger.info(`Seeding database for environment: ${environment}`);
    try {
      await seedDatabase(environment);
      logger.info(`Database seeding completed for environment: ${environment}`);
    } catch (seedError) {
      logger.error(`Error seeding database for environment: ${environment}`, { error: seedError });
      throw seedError;
    }
  }

  // Return a resolved promise when initialization is complete
  return Promise.resolve();
}

/**
 * Main database module that provides access to all database functionality
 */
const database = {
  initialize,
  close: closeDatabase,
  query: db.query,
  transaction: db.transaction,
  healthCheck: db.healthCheck,
  repositories,
  migrations,
  seedDatabase
};

export default database;

// Re-export database connection interface for direct access
export { db };

// Re-export all repository instances for data access
export { repositories };

// Re-export database migrations for migration execution
export { migrations };

// Re-export database seeding function
export { seedDatabase, seedInitialData, seedTestData, seedDevData };