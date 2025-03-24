/**
 * Central index file for database seeding operations in the HCBS Revenue Management System.
 * This file exports functions for seeding different types of data based on the environment (production, testing, development) and orchestrates the seeding process to ensure data consistency across environments.
 */

import { seedInitialData } from './initial_data.seed'; // Import function to seed initial required data for all environments
import { seedTestData } from './test_data.seed'; // Import function to seed test data for testing environments
import { seedDevData } from './dev_data.seed'; // Import function to seed development data for development environments
import { logger } from '../../utils/logger'; // Import logging seed operations and errors

/**
 * Seeds the database with appropriate data based on the specified environment
 * @param environment The environment to seed the database for (production, testing, development)
 * @returns A promise that resolves when the database seeding is complete
 */
export async function seedDatabase(environment: string): Promise<void> {
  try {
    logger.info(`Starting database seeding for environment: ${environment}`);

    // Always seed initial data required for system functionality
    await seedInitialData();

    // Seed data based on the environment
    if (environment === 'test') {
      // Seed test data for testing environments
      await seedTestData();
    } else if (environment === 'development') {
      // Seed development data for development environments
      await seedDevData();
    } else if (environment === 'production') {
      // In production, only seed initial data
      logger.info('Skipping additional data seeding in production environment');
    }

    logger.info(`Database seeding completed for environment: ${environment}`);
  } catch (error) {
    logger.error('Error during database seeding', { error });
    throw error;
  }
}

// Re-export individual seed functions for flexibility
export { seedInitialData }; // Export function to seed initial required data
export { seedTestData }; // Export function to seed test data
export { seedDevData }; // Export function to seed development data