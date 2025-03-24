/**
 * Rate Limiting Middleware for HCBS Revenue Management System
 * 
 * This middleware implements configurable rate limiting to protect API endpoints from abuse.
 * Different rate limits are applied to various endpoint categories based on their sensitivity
 * and resource requirements. Rate limits are tracked in Redis for persistence across 
 * application instances and restarts.
 */

import Redis from 'ioredis'; // v5.3.2
import rateLimit from 'express-rate-limit'; // v6.7.0
import RedisStore from 'rate-limit-redis'; // v3.0.0
import { Request, Response, NextFunction } from 'express'; // v4.18.2

import { redisConfig } from '../config';
import logger from '../utils/logger';
import { Request as ExtendedRequest } from '../types/request.types';
import { BusinessError } from '../errors';

// Singleton Redis client instance for rate limiting
let REDIS_CLIENT: Redis | null = null;

// Key prefix for rate limit data in Redis
const RATE_LIMIT_PREFIX = 'rate-limit:';

// Standard time window for rate limiting (1 minute in milliseconds)
const STANDARD_WINDOW_MS = 60 * 1000;

// Default requests per window for different API categories
const STANDARD_MAX_REQUESTS = 60;  // 60 requests per minute
const AUTH_MAX_REQUESTS = 10;      // 10 requests per minute
const REPORTING_MAX_REQUESTS = 30; // 30 requests per minute
const BATCH_MAX_REQUESTS = 10;     // 10 requests per minute

/**
 * Interface for rate limiter configuration options
 */
interface RateLimiterOptions {
  windowMs: number;        // Time window in milliseconds
  max: number;             // Maximum requests per window
  standardHeaders: boolean; // Whether to send standard rate limit headers
  legacyHeaders: boolean;  // Whether to send legacy rate limit headers
  message: string;         // Message to send when rate limit is exceeded
  keyPrefix: string;       // Key prefix for Redis store
  keyGenerator?: (req: Request) => string; // Function to generate unique key for each request
  handler?: (req: Request, res: Response, next: NextFunction, options: any) => void; // Handler for rate limit exceeded
  skip?: (req: Request) => boolean; // Function to skip rate limiting for certain requests
}

/**
 * Extracts a unique identifier for the client from the request
 * @param req Express request object
 * @returns Client identifier (user ID or IP address)
 */
const getClientIdentifier = (req: Request): string => {
  // If user is authenticated, use user ID as identifier
  if ((req as ExtendedRequest).user?.id) {
    return `user:${(req as ExtendedRequest).user!.id}`;
  }

  // Otherwise, use client IP address
  // Handle cases where application might be behind a proxy
  const clientIp = 
    req.ip || 
    (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || 
    req.socket.remoteAddress || 
    'unknown';
  
  return `ip:${clientIp}`;
};

/**
 * Custom handler for when rate limit is exceeded
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @param options Rate limiter options
 */
const handleRateLimitExceeded = (
  req: Request, 
  res: Response, 
  next: NextFunction, 
  options: any
): void => {
  // Get client identifier for logging
  const clientId = getClientIdentifier(req);
  
  // Log rate limit violation
  logger.warn(`Rate limit exceeded for ${clientId} on ${req.method} ${req.originalUrl}`, {
    clientId,
    endpoint: req.originalUrl,
    method: req.method,
    component: 'rateLimiter'
  });
  
  // Set appropriate HTTP headers
  res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
  
  // Add rate limit headers if not already set by the middleware
  if (!res.getHeader('X-RateLimit-Limit')) {
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Date.now() + options.windowMs);
  }
  
  // Create BusinessError with rate limit exceeded message
  const error = new BusinessError(
    'Too many requests, please try again later.',
    { clientId, endpoint: req.originalUrl },
    'RATE_LIMIT_EXCEEDED'
  );
  
  // Pass error to next middleware for consistent error handling
  next(error);
};

/**
 * Factory function to create a rate limiter middleware with custom configuration
 * @param options Rate limiter options
 * @returns Express middleware function for rate limiting
 */
const createRateLimiter = (options: Partial<RateLimiterOptions>) => {
  // Initialize Redis client if not already created
  if (!REDIS_CLIENT) {
    REDIS_CLIENT = new Redis(redisConfig.redisOptions);
    logger.debug('Initialized Redis client for rate limiting', {
      component: 'rateLimiter',
      redis: {
        host: redisConfig.redisOptions.host,
        port: redisConfig.redisOptions.port,
        db: redisConfig.redisOptions.db || 0
      }
    });
    
    REDIS_CLIENT.on('error', (err) => {
      logger.error('Redis rate limiter error', { 
        error: err.message,
        component: 'rateLimiter'
      });
    });
  }
  
  // Create Redis store for rate limiter
  const store = new RedisStore({
    prefix: RATE_LIMIT_PREFIX + (options.keyPrefix || ''),
    // For rate-limit-redis v3.x
    client: REDIS_CLIENT,
    // For older versions
    // @ts-ignore - Different version compatibility
    sendCommand: (...args: any[]) => REDIS_CLIENT!.call(...args),
  });
  
  // Configure rate limiter with provided options and defaults
  const limiter = rateLimit({
    windowMs: options.windowMs || STANDARD_WINDOW_MS,
    max: options.max || STANDARD_MAX_REQUESTS,
    standardHeaders: options.standardHeaders !== undefined ? options.standardHeaders : true,
    legacyHeaders: options.legacyHeaders !== undefined ? options.legacyHeaders : false,
    keyGenerator: options.keyGenerator || getClientIdentifier,
    handler: options.handler || handleRateLimitExceeded,
    skip: options.skip || ((req: Request) => {
      // Skip rate limiting for health check endpoints
      return req.path.startsWith('/health') || req.path.startsWith('/api/health');
    }),
    store
  });
  
  return limiter;
};

// Standard rate limiter for API endpoints (60 requests per minute)
export const standardRateLimiter = createRateLimiter({
  keyPrefix: 'standard:',
  max: STANDARD_MAX_REQUESTS,
  message: 'Too many requests, please try again later.'
});

// Authentication rate limiter (10 requests per minute)
export const authRateLimiter = createRateLimiter({
  keyPrefix: 'auth:',
  max: AUTH_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later.'
});

// Reporting rate limiter (30 requests per minute)
export const reportingRateLimiter = createRateLimiter({
  keyPrefix: 'reporting:',
  max: REPORTING_MAX_REQUESTS,
  message: 'Too many reporting requests, please try again later.'
});

// Batch operation rate limiter (10 requests per minute)
export const batchOperationRateLimiter = createRateLimiter({
  keyPrefix: 'batch:',
  max: BATCH_MAX_REQUESTS,
  message: 'Too many batch operations, please try again later.'
});

// Export factory function for custom rate limiters
export { createRateLimiter };