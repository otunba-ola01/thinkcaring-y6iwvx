import dotenv from 'dotenv'; // v16.0.3
import { resolve } from 'path';
import { existsSync } from 'fs';

// Environment (defaults to development)
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Loads the appropriate .env file based on the current environment
 */
function loadEnvFile(): void {
  // Determine which .env file to use based on the environment
  const envFile = `.env.${NODE_ENV}`;
  const envPath = resolve(process.cwd(), envFile);
  const defaultEnvPath = resolve(process.cwd(), '.env');

  // Try to load the environment-specific .env file first
  if (existsSync(envPath)) {
    console.log(`Loading environment variables from ${envFile}`);
    dotenv.config({ path: envPath });
  } 
  // Fall back to the default .env file
  else if (existsSync(defaultEnvPath)) {
    console.log(`Loading environment variables from .env`);
    dotenv.config({ path: defaultEnvPath });
  } 
  // In containerized environments, env vars might be provided directly
  else {
    console.log('No .env file found. Using environment variables from the system.');
  }
}

/**
 * Validates that all required environment variables are present
 * @returns {boolean} True if all required variables are present, false otherwise
 */
function validateRequiredVariables(): boolean {
  let isValid = true;

  // Application variables
  const appVariables = ['PORT', 'API_PREFIX', 'NODE_ENV'];
  
  // Database variables
  const dbVariables = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  
  // Auth variables
  const authVariables = ['JWT_SECRET', 'JWT_ALGORITHM', 'ACCESS_TOKEN_EXPIRATION', 'REFRESH_TOKEN_EXPIRATION'];
  
  // All required variables
  const requiredVariables = [
    ...appVariables,
    ...dbVariables,
    ...authVariables
  ];

  console.log('Validating required environment variables...');
  
  // Check each required variable
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      console.error(`Missing required environment variable: ${variable}`);
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Validates database configuration variables
 * @returns {boolean} True if database configuration is valid, false otherwise
 */
function validateDatabaseConfig(): boolean {
  let isValid = true;
  console.log('Validating database configuration...');

  // Required database variables
  const requiredDbVariables = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER'];
  
  // Check required database variables
  for (const variable of requiredDbVariables) {
    if (!process.env[variable]) {
      console.error(`Missing required database variable: ${variable}`);
      isValid = false;
    }
  }

  // Validate DB_PORT is a valid port number
  if (!isValidPort(process.env.DB_PORT)) {
    console.error('DB_PORT must be a valid port number between 1 and 65535');
    isValid = false;
  }

  // Validate DB_SSL if defined
  if (process.env.DB_SSL && !isValidBoolean(process.env.DB_SSL)) {
    console.error('DB_SSL must be a valid boolean value (true or false)');
    isValid = false;
  }

  // Validate pool configuration if defined
  if (process.env.DB_POOL_MIN && !isValidNumber(process.env.DB_POOL_MIN)) {
    console.error('DB_POOL_MIN must be a valid number');
    isValid = false;
  }

  if (process.env.DB_POOL_MAX && !isValidNumber(process.env.DB_POOL_MAX)) {
    console.error('DB_POOL_MAX must be a valid number');
    isValid = false;
  }

  // Ensure min is less than max if both are defined
  if (
    process.env.DB_POOL_MIN && 
    process.env.DB_POOL_MAX && 
    Number(process.env.DB_POOL_MIN) >= Number(process.env.DB_POOL_MAX)
  ) {
    console.error('DB_POOL_MIN must be less than DB_POOL_MAX');
    isValid = false;
  }

  return isValid;
}

/**
 * Validates Redis configuration variables
 * @returns {boolean} True if Redis configuration is valid, false otherwise
 */
function validateRedisConfig(): boolean {
  // Skip if Redis is not configured
  if (!process.env.REDIS_HOST) {
    console.log('Redis is not configured, skipping validation');
    return true;
  }

  let isValid = true;
  console.log('Validating Redis configuration...');

  // Required Redis variables
  if (!process.env.REDIS_PORT) {
    console.error('Missing required Redis variable: REDIS_PORT');
    isValid = false;
  }

  // Validate REDIS_PORT is a valid port number
  if (!isValidPort(process.env.REDIS_PORT)) {
    console.error('REDIS_PORT must be a valid port number between 1 and 65535');
    isValid = false;
  }

  // Validate REDIS_DEFAULT_TTL if defined
  if (process.env.REDIS_DEFAULT_TTL && !isValidNumber(process.env.REDIS_DEFAULT_TTL)) {
    console.error('REDIS_DEFAULT_TTL must be a valid number');
    isValid = false;
  }

  return isValid;
}

/**
 * Validates authentication configuration variables
 * @returns {boolean} True if authentication configuration is valid, false otherwise
 */
function validateAuthConfig(): boolean {
  let isValid = true;
  console.log('Validating authentication configuration...');

  // Required auth variables
  const requiredAuthVariables = [
    'JWT_SECRET',
    'JWT_ALGORITHM',
    'ACCESS_TOKEN_EXPIRATION',
    'REFRESH_TOKEN_EXPIRATION'
  ];
  
  // Check required auth variables
  for (const variable of requiredAuthVariables) {
    if (!process.env[variable]) {
      console.error(`Missing required authentication variable: ${variable}`);
      isValid = false;
    }
  }

  // Validate token expirations are valid numbers
  if (!isValidNumber(process.env.ACCESS_TOKEN_EXPIRATION)) {
    console.error('ACCESS_TOKEN_EXPIRATION must be a valid number');
    isValid = false;
  }

  if (!isValidNumber(process.env.REFRESH_TOKEN_EXPIRATION)) {
    console.error('REFRESH_TOKEN_EXPIRATION must be a valid number');
    isValid = false;
  }

  // If using asymmetric encryption, validate key paths
  if (
    (process.env.JWT_ALGORITHM?.includes('RS') || process.env.JWT_ALGORITHM?.includes('ES')) &&
    (!process.env.PRIVATE_KEY_PATH || !process.env.PUBLIC_KEY_PATH)
  ) {
    console.error('PRIVATE_KEY_PATH and PUBLIC_KEY_PATH are required for asymmetric encryption algorithms');
    isValid = false;
  }

  // Check if key files exist
  if (process.env.PRIVATE_KEY_PATH && !existsSync(resolve(process.env.PRIVATE_KEY_PATH))) {
    console.error(`Private key file not found at ${process.env.PRIVATE_KEY_PATH}`);
    isValid = false;
  }

  if (process.env.PUBLIC_KEY_PATH && !existsSync(resolve(process.env.PUBLIC_KEY_PATH))) {
    console.error(`Public key file not found at ${process.env.PUBLIC_KEY_PATH}`);
    isValid = false;
  }

  return isValid;
}

/**
 * Validates CORS configuration variables
 * @returns {boolean} True if CORS configuration is valid, false otherwise
 */
function validateCorsConfig(): boolean {
  let isValid = true;
  console.log('Validating CORS configuration...');

  // ALLOWED_ORIGINS is required
  if (!process.env.ALLOWED_ORIGINS) {
    console.error('Missing required CORS variable: ALLOWED_ORIGINS');
    isValid = false;
  } else {
    // Validate that each origin is a valid URL (except for special values like '*')
    const origins = process.env.ALLOWED_ORIGINS.split(',');
    for (const origin of origins) {
      const trimmedOrigin = origin.trim();
      if (trimmedOrigin !== '*' && !isValidUrl(trimmedOrigin)) {
        console.error(`Invalid origin in ALLOWED_ORIGINS: ${trimmedOrigin}`);
        isValid = false;
      }
    }
  }

  return isValid;
}

/**
 * Validates logger configuration variables
 * @returns {boolean} True if logger configuration is valid, false otherwise
 */
function validateLoggerConfig(): boolean {
  let isValid = true;
  console.log('Validating logger configuration...');

  // Validate LOG_LEVEL if defined
  if (process.env.LOG_LEVEL) {
    const validLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
    if (!validLogLevels.includes(process.env.LOG_LEVEL.toLowerCase())) {
      console.error(`Invalid LOG_LEVEL: ${process.env.LOG_LEVEL}. Must be one of: ${validLogLevels.join(', ')}`);
      isValid = false;
    }
  }

  // Validate LOG_FORMAT if defined
  if (process.env.LOG_FORMAT) {
    const validLogFormats = ['json', 'simple'];
    if (!validLogFormats.includes(process.env.LOG_FORMAT.toLowerCase())) {
      console.error(`Invalid LOG_FORMAT: ${process.env.LOG_FORMAT}. Must be one of: ${validLogFormats.join(', ')}`);
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Validates if a value is a valid port number
 * @param {string | undefined} port - The port to validate
 * @returns {boolean} True if the port is valid, false otherwise
 */
function isValidPort(port: string | undefined): boolean {
  if (!port) return false;
  
  const portNum = Number(port);
  return !isNaN(portNum) && Number.isInteger(portNum) && portNum > 0 && portNum <= 65535;
}

/**
 * Validates if a value is a valid number
 * @param {string | undefined} value - The value to validate
 * @returns {boolean} True if the value is a valid number, false otherwise
 */
function isValidNumber(value: string | undefined): boolean {
  if (!value) return false;
  
  const num = Number(value);
  return !isNaN(num);
}

/**
 * Validates if a value is a valid boolean string
 * @param {string | undefined} value - The value to validate
 * @returns {boolean} True if the value is a valid boolean string, false otherwise
 */
function isValidBoolean(value: string | undefined): boolean {
  if (!value) return false;
  
  return value.toLowerCase() === 'true' || value.toLowerCase() === 'false';
}

/**
 * Validates if a value is a valid URL
 * @param {string} value - The value to validate
 * @returns {boolean} True if the value is a valid URL, false otherwise
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
try {
  // Load environment variables
  loadEnvFile();
  
  let isValid = true;
  
  // Run all validations
  isValid = validateRequiredVariables() && isValid;
  isValid = validateDatabaseConfig() && isValid;
  isValid = validateRedisConfig() && isValid;
  isValid = validateAuthConfig() && isValid;
  isValid = validateCorsConfig() && isValid;
  isValid = validateLoggerConfig() && isValid;
  
  // Exit with error if any validation fails
  if (!isValid) {
    console.error('Environment validation failed. Please fix the issues and try again.');
    process.exit(1);
  }
  
  console.log('Environment validation successful!');
} catch (error) {
  console.error('Error validating environment variables:', error);
  process.exit(1);
}