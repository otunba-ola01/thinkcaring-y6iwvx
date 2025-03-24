/**
 * Central Configuration Module for HCBS Revenue Management System
 * 
 * This module aggregates and exports all configuration settings for the application.
 * It provides a single entry point for accessing application configuration with
 * environment-specific settings to support deployment across different environments.
 */

import dotenv from 'dotenv'; // dotenv ^16.0.3

// Load environment variables from .env file
dotenv.config();

// Import configuration modules
import authConfig from './auth.config';
import corsOptions from './cors.config';
import { databaseConfig, getDatabaseConfig } from './database.config';
import { loggerConfig, httpLoggerConfig, auditLoggerConfig } from './logger.config';
import { redisConfig, getRedisConfig } from './redis.config';
import { swaggerConfig } from './swagger.config';

// Global environment variable
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Returns the current environment name based on NODE_ENV
 * @returns Current environment name (development, test, staging, production)
 */
export function getEnvironment(): string {
  return NODE_ENV.toLowerCase();
}

// Calculate environment flags once for efficiency
const env = getEnvironment();
const isDevelopment = env === 'development';
const isTest = env === 'test';
const isStaging = env === 'staging';
const isProduction = env === 'production';

/**
 * Consolidated configuration object for the application
 * Provides a single access point for all application settings
 */
const config = {
  // Current environment
  env,
  
  // Feature configurations
  auth: authConfig,
  cors: corsOptions,
  database: databaseConfig,
  logger: loggerConfig,
  redis: redisConfig,
  swagger: swaggerConfig,
  
  // Environment flags for conditional logic
  isDevelopment,
  isTest,
  isStaging,
  isProduction,
};

// Default export for the consolidated configuration
export default config;

// Re-export individual configurations for more granular imports
export { authConfig };
export { corsOptions };
export { databaseConfig, getDatabaseConfig };
export { loggerConfig, httpLoggerConfig, auditLoggerConfig };
export { redisConfig, getRedisConfig };
export { swaggerConfig };
export { getEnvironment };