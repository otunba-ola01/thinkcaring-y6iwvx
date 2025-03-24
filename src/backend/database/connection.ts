/**
 * Database Connection Module
 *
 * Establishes and manages PostgreSQL database connection using Knex.js.
 * Provides connection pooling, transaction management, and health check capabilities.
 * Serves as the foundation for all database operations in the HCBS Revenue Management System.
 */

import { databaseConfig } from '../config/database.config';
import { logger } from '../utils/logger';
import { DatabaseError } from '../errors/database-error';
import { Transaction, TransactionCallback } from '../types/database.types';
import knex, { Knex } from 'knex'; // knex v2.4.2

// Global knex instance
let knexInstance: Knex | null = null;

/**
 * Initializes the database connection using the provided configuration
 * @returns Promise that resolves when the database connection is established
 */
export async function initializeDatabase(): Promise<void> {
  // Check if a connection already exists
  if (knexInstance) {
    logger.info('Database connection already initialized');
    return;
  }

  try {
    logger.info('Initializing database connection', {
      host: databaseConfig.connection.host,
      database: databaseConfig.connection.database,
      pool: {
        min: databaseConfig.pool.min,
        max: databaseConfig.pool.max
      }
    });

    // Create a new Knex instance with the database configuration
    knexInstance = knex(databaseConfig);

    // Test the connection with a simple query
    await knexInstance.raw('SELECT 1');
    
    logger.info('Database connection established successfully', {
      host: databaseConfig.connection.host,
      database: databaseConfig.connection.database
    });
  } catch (error) {
    // Handle connection errors
    logger.error('Failed to establish database connection', { 
      error,
      message: error.message,
      host: databaseConfig.connection.host,
      database: databaseConfig.connection.database
    });
    
    // Clean up any partial connection
    if (knexInstance) {
      try {
        await knexInstance.destroy();
      } catch (destroyError) {
        logger.error('Error destroying partial database connection', { 
          error: destroyError
        });
      }
      knexInstance = null;
    }
    
    // Convert to DatabaseError for consistent error handling
    throw new DatabaseError('Failed to establish database connection', {
      operation: 'connect',
      entity: 'database',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Closes the database connection gracefully
 * @returns Promise that resolves when the database connection is closed
 */
export async function closeDatabase(): Promise<void> {
  if (!knexInstance) {
    logger.debug('No database connection to close');
    return;
  }

  try {
    logger.info('Closing database connection');
    
    // Destroy the Knex instance
    await knexInstance.destroy();
    knexInstance = null;
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection', { 
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Convert to DatabaseError for consistent error handling
    throw new DatabaseError('Failed to close database connection', {
      operation: 'disconnect',
      entity: 'database',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Returns the current Knex instance, initializing it if necessary
 * @returns The Knex instance for database operations
 * @throws DatabaseError if the database connection is not initialized
 */
function getKnexInstance(): Knex {
  if (!knexInstance) {
    throw new DatabaseError('Database connection not initialized', {
      operation: 'query',
      entity: 'database'
    });
  }
  return knexInstance;
}

/**
 * Executes a database query using the Knex instance
 * @param queryBuilder Function that builds and executes a query using the Knex instance
 * @returns Promise that resolves with the query results
 * @throws DatabaseError if the query fails
 */
export async function query<T>(queryBuilder: (knex: Knex) => Promise<T>): Promise<T> {
  try {
    const db = getKnexInstance();
    return await queryBuilder(db);
  } catch (error) {
    // Determine if this is already a DatabaseError to avoid double-wrapping
    if (error instanceof DatabaseError) {
      throw error;
    }
    
    logger.error('Database query error', { 
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Convert to DatabaseError for consistent error handling
    throw new DatabaseError('Database query failed', {
      operation: 'query',
      entity: 'database',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Executes a callback function within a database transaction
 * @param callback Function to execute within the transaction
 * @returns Promise that resolves with the result of the callback function
 * @throws DatabaseError if the transaction fails
 */
export async function transaction<T>(callback: TransactionCallback<T>): Promise<T> {
  try {
    const db = getKnexInstance();
    return await db.transaction(async (trx) => {
      return await callback(trx);
    });
  } catch (error) {
    // Determine if this is already a DatabaseError to avoid double-wrapping
    if (error instanceof DatabaseError) {
      throw error;
    }
    
    logger.error('Transaction error', { 
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Convert to DatabaseError for consistent error handling
    throw new DatabaseError('Database transaction failed', {
      operation: 'transaction',
      entity: 'database',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Creates and returns a new database transaction
 * @returns Promise that resolves with a new database transaction
 * @throws DatabaseError if the transaction creation fails
 */
export async function getTransaction(): Promise<Transaction> {
  try {
    const db = getKnexInstance();
    return await db.transaction();
  } catch (error) {
    logger.error('Error creating transaction', { 
      error,
      message: error.message,
      stack: error.stack
    });
    
    // Convert to DatabaseError for consistent error handling
    throw new DatabaseError('Failed to create database transaction', {
      operation: 'createTransaction',
      entity: 'database',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Checks the health of the database connection
 * @returns Promise that resolves with a boolean indicating if the database connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!knexInstance) {
      logger.debug('Health check failed: Database not initialized');
      return false;
    }
    
    // Execute a simple query to verify the connection
    await knexInstance.raw('SELECT 1');
    logger.debug('Database health check: OK');
    return true;
  } catch (error) {
    logger.error('Database health check failed', { 
      error,
      message: error.message
    });
    return false;
  }
}

/**
 * The main database interface for use throughout the application
 */
export const db = {
  initialize: initializeDatabase,
  close: closeDatabase,
  query,
  transaction,
  healthCheck
};

// Export functions directly for more flexibility in usage
export { initializeDatabase, closeDatabase, getTransaction };