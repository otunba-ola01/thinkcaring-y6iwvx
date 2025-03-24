import dotenv from 'dotenv'; // dotenv v16.0.3
import { RedisOptions } from 'ioredis'; // ioredis v5.3.2

// Load environment variables
dotenv.config();

// Current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Interface for Redis configuration
 */
interface RedisConfig {
  redisOptions: RedisOptions;
  keyPrefix: string;
  defaultTTL: number;
  sessionTTL: number;
  extendedSessionTTL: number;
}

// Default key prefix for all Redis keys to avoid collisions
const DEFAULT_KEY_PREFIX = 'hcbs:';

// Default TTL for cached items (15 minutes in seconds)
const DEFAULT_TTL = 60 * 15;

// Default session timeout (15 minutes in seconds)
const SESSION_TTL = 60 * 15;

// Extended session timeout for 'remember me' option (7 days in seconds)
const EXTENDED_SESSION_TTL = 60 * 60 * 24 * 7;

// Redis configuration for development environment
const DEVELOPMENT_CONFIG: RedisConfig = {
  redisOptions: {
    host: 'localhost',
    port: 6379
  },
  keyPrefix: DEFAULT_KEY_PREFIX,
  defaultTTL: DEFAULT_TTL,
  sessionTTL: SESSION_TTL,
  extendedSessionTTL: EXTENDED_SESSION_TTL
};

// Redis configuration for test environment with separate database
const TEST_CONFIG: RedisConfig = {
  redisOptions: {
    host: 'localhost',
    port: 6379,
    db: 1 // Use a different database for tests
  },
  keyPrefix: DEFAULT_KEY_PREFIX + 'test:',
  defaultTTL: DEFAULT_TTL,
  sessionTTL: SESSION_TTL,
  extendedSessionTTL: EXTENDED_SESSION_TTL
};

// Redis configuration for staging environment
const STAGING_CONFIG: RedisConfig = {
  redisOptions: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  },
  keyPrefix: DEFAULT_KEY_PREFIX + 'staging:',
  defaultTTL: DEFAULT_TTL,
  sessionTTL: SESSION_TTL,
  extendedSessionTTL: EXTENDED_SESSION_TTL
};

// Redis configuration for production environment with retry strategy
const PRODUCTION_CONFIG: RedisConfig = {
  redisOptions: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000) // Exponential backoff with max 2000ms
  },
  keyPrefix: DEFAULT_KEY_PREFIX,
  defaultTTL: DEFAULT_TTL,
  sessionTTL: SESSION_TTL,
  extendedSessionTTL: EXTENDED_SESSION_TTL
};

/**
 * Returns environment-specific Redis configuration
 * @param env Environment name
 * @returns Environment-specific Redis configuration
 */
export function getRedisConfig(env: string): RedisConfig {
  switch (env) {
    case 'test':
      return TEST_CONFIG;
    case 'staging':
      return STAGING_CONFIG;
    case 'production':
      return PRODUCTION_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CONFIG;
  }
}

// Export Redis configuration for the current environment
export const redisConfig = getRedisConfig(NODE_ENV);