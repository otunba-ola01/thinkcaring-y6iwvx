/**
 * Database Configuration Module
 * 
 * Provides configuration for PostgreSQL database connections in the HCBS Revenue Management System.
 * Supports environment-specific settings for development, test, staging, and production.
 */

import * as dotenv from 'dotenv'; // dotenv v16.0.3
import * as path from 'path'; // path v0.12.7

// Load environment variables from .env file
dotenv.config();

// Default to development if NODE_ENV is not set
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Get database configuration based on the current environment
 * 
 * @param env - Environment name (development, test, staging, production)
 * @returns Database configuration object for the specified environment
 */
export function getDatabaseConfig(env?: string): any {
  // Use provided env parameter or fallback to NODE_ENV
  const environment = env || NODE_ENV;
  
  // Base configuration (common across all environments)
  const baseConfig = {
    client: 'pg', // PostgreSQL client
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'hcbs_revenue',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      charset: 'utf8',
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: 30000, // How long a connection can be idle before being terminated
      acquireTimeoutMillis: 30000, // How long to wait to acquire a connection
    },
    migrations: {
      directory: path.join(__dirname, '../../migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, '../../seeds'),
      extension: 'ts',
    },
    debug: false,
  };
  
  // Environment-specific configurations
  const configs: { [key: string]: any } = {
    development: {
      ...baseConfig,
      debug: process.env.DB_DEBUG === 'true',
      pool: {
        ...baseConfig.pool,
        min: 2,
        max: 10,
      }
    },
    
    test: {
      ...baseConfig,
      connection: {
        ...baseConfig.connection,
        database: process.env.TEST_DB_NAME || 'hcbs_revenue_test',
      },
      pool: {
        ...baseConfig.pool,
        min: 1,
        max: 5,
      },
      migrations: {
        ...baseConfig.migrations,
        directory: path.join(__dirname, '../../test/migrations'),
      },
      seeds: {
        ...baseConfig.seeds,
        directory: path.join(__dirname, '../../test/seeds'),
      }
    },
    
    staging: {
      ...baseConfig,
      pool: {
        ...baseConfig.pool,
        min: 2,
        max: 15,
      },
      connection: {
        ...baseConfig.connection,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
    },
    
    production: {
      ...baseConfig,
      debug: false,
      pool: {
        ...baseConfig.pool,
        min: 5,
        max: parseInt(process.env.DB_POOL_MAX || '20'),
      },
      connection: {
        ...baseConfig.connection,
        ssl: { 
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      },
    }
  };
  
  // Return the configuration for the current environment
  return configs[environment] || configs.development;
}

// Export the database configuration for the current environment
const databaseConfig = getDatabaseConfig();

export default databaseConfig;