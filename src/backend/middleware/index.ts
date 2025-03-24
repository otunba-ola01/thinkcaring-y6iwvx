import { errorMiddleware, notFoundMiddleware } from './error.middleware';
import { requestLogger, responseLogger, morganLogger } from './logger.middleware';
import { corsMiddleware, logCorsRequest } from './cors.middleware';
import { standardRateLimiter, authRateLimiter, reportingRateLimiter, batchOperationRateLimiter, createRateLimiter } from './rateLimiter.middleware';
import { validateParams, validateQuery, validateBody, validateParamsAndQuery, validateParamsAndBody, validateQueryAndBody, validateParamsQueryAndBody, validateFile } from './validation.middleware';
import { authenticate, requireAuth, requirePermission, requirePermissionForAction } from './auth.middleware';
import { auditMiddleware, createAuditMiddleware } from './audit.middleware';
import { withTransaction, transactionMiddleware } from './transaction.middleware';

// Export error handling middleware functions
export { errorMiddleware }; // Express middleware for centralized error handling
export { notFoundMiddleware }; // Express middleware for handling 404 Not Found errors

// Export request and response logging middleware functions
export { requestLogger }; // Express middleware for logging incoming HTTP requests
export { responseLogger }; // Express middleware for logging outgoing HTTP responses
export { morganLogger }; // Morgan-based HTTP request logging middleware

// Export CORS handling middleware functions
export { corsMiddleware }; // Express middleware for handling CORS
export { logCorsRequest }; // Express middleware for logging CORS requests

// Export rate limiting middleware functions for different API categories
export { standardRateLimiter }; // Rate limiter for standard API endpoints (60 requests per minute)
export { authRateLimiter }; // Stricter rate limiter for authentication endpoints (10 requests per minute)
export { reportingRateLimiter }; // Rate limiter for resource-intensive reporting endpoints (30 requests per minute)
export { batchOperationRateLimiter }; // Rate limiter for batch operation endpoints (10 requests per minute)
export { createRateLimiter }; // Factory function to create custom rate limiters with specific configurations

// Export request validation middleware functions
export { validateParams }; // Middleware factory for validating request parameters
export { validateQuery }; // Middleware factory for validating request query parameters
export { validateBody }; // Middleware factory for validating request body
export { validateParamsAndQuery }; // Middleware factory for validating both request parameters and query
export { validateParamsAndBody }; // Middleware factory for validating both request parameters and body
export { validateQueryAndBody }; // Middleware factory for validating both request query and body
export { validateParamsQueryAndBody }; // Middleware factory for validating request parameters, query, and body
export { validateFile }; // Middleware factory for validating file uploads

// Export authentication and authorization middleware functions
export { authenticate }; // Express middleware to authenticate requests using JWT tokens
export { requireAuth }; // Express middleware to require authentication for protected routes
export { requirePermission }; // Middleware factory to require specific permission for a route
export { requirePermissionForAction }; // Middleware factory to require permission for a specific category and action

// Export audit logging middleware functions
export { auditMiddleware }; // Express middleware for automatic audit logging of API requests
export { createAuditMiddleware }; // Factory function to create customized audit middleware

// Export database transaction middleware functions
export { withTransaction }; // Higher-order function for wrapping request handlers with transaction management
export { transactionMiddleware }; // Middleware factory function for creating transaction middleware