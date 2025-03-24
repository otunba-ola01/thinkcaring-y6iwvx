import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'; // express 4.18.2
import { 
  ApiError, 
  ValidationError, 
  DatabaseError, 
  NotFoundError, 
  AuthError,
  BusinessError,
  IntegrationError,
  PermissionError
} from '../errors';
import { ErrorResponse } from '../types/error.types';
import { logger } from '../utils/logger';
import { 
  createErrorFromUnknown, 
  isOperationalError, 
  getErrorStatusCode 
} from '../utils/error';

/**
 * Express middleware for handling errors thrown during request processing.
 * This middleware implements a centralized error handling strategy that:
 * - Converts unknown errors to standardized ApiError instances
 * - Logs errors with contextual information and appropriate severity
 * - Returns consistent, well-structured error responses to clients
 * - Handles environment-specific behavior (dev vs prod)
 *
 * @param err - Error that was thrown during request processing
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  try {
    // Convert unknown errors to ApiError instances for consistent handling
    const error = createErrorFromUnknown(err);
    
    // Determine if the error is operational (expected) or programming (unexpected)
    const isOperational = isOperationalError(error);
    
    // Build rich context for logging to aid in troubleshooting
    const logContext = {
      url: req.originalUrl || req.url,
      method: req.method,
      correlationId: req.headers['x-correlation-id'] || req.headers['x-request-id'],
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      clientIp: req.ip || req.connection.remoteAddress,
      isOperational,
      errorId: error.errorId,
      category: error.category,
      code: error.code
    };
    
    // Log with appropriate severity level based on error type
    if (error.severity === 'CRITICAL' || error.severity === 'HIGH' || !isOperational) {
      logger.error(error.message, { ...logContext, error });
    } else if (error.severity === 'MEDIUM') {
      logger.warn(error.message, { ...logContext, error });
    } else {
      logger.info(error.message, { ...logContext, error });
    }
    
    // Update error metadata with request information for comprehensive tracking
    if (error instanceof ApiError) {
      error.setMetadata({
        path: req.originalUrl || req.url,
        method: req.method,
        requestId: (req.headers['x-correlation-id'] || req.headers['x-request-id']) as string,
        userId: req.user?.id || null
      });
    }
    
    // Get appropriate HTTP status code for the error
    const statusCode = getErrorStatusCode(error);
    
    // Convert error to standardized response object
    const errorResponse = error instanceof ApiError
      ? error.toResponseObject()
      : {
          errorId: 'system-error',
          status: statusCode,
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An unexpected error occurred',
          details: null,
          timestamp: new Date().toISOString()
        };
    
    // In development, include stack trace to help with debugging
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).stack = error.stack;
    }
    
    // Send error response if headers haven't been sent already
    if (!res.headersSent) {
      res.status(statusCode).json(errorResponse);
    }
  } catch (processError) {
    // Catch any errors that occur while processing the original error
    logger.error('Error in error middleware', { 
      originalError: err,
      processingError: processError 
    });
    
    // Send a generic error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        errorId: 'system-error',
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing another error',
        details: null,
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Express middleware for handling 404 Not Found errors for undefined routes.
 * This middleware catches requests to routes that don't exist and generates
 * a standardized NotFoundError that is passed to the main error handler.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Create a NotFoundError with appropriate message and context
    const notFoundError = new NotFoundError(
      `Route not found: ${req.method} ${req.originalUrl || req.url}`,
      'route',
      req.originalUrl || req.url
    );
    
    // Add the requested path to the error details for context
    notFoundError.addDetail({
      message: `The requested path '${req.originalUrl || req.url}' does not exist`,
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl || req.url,
      context: {
        method: req.method,
        query: req.query
      }
    });
    
    // Pass to error middleware
    next(notFoundError);
  } catch (error) {
    // If error occurs while creating NotFoundError, pass generic error
    next(createErrorFromUnknown(error));
  }
};

/**
 * Global handler for uncaught exceptions to prevent application crash.
 * This handler logs critical errors, determines their operational status,
 * and can optionally initiate graceful shutdown for severe issues.
 *
 * @param error - Uncaught exception that was thrown
 */
const uncaughtExceptionHandler = (error: Error): void => {
  try {
    // Convert to ApiError if needed for consistent handling
    const apiError = error instanceof ApiError ? error : createErrorFromUnknown(error);
    
    // Log with critical severity since uncaught exceptions are always serious
    logger.error('UNCAUGHT EXCEPTION: Application stability compromised', { 
      error: apiError, 
      stack: apiError.stack,
      processId: process.pid,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
    
    // Determine if operational or programming error
    const isOperational = isOperationalError(apiError);
    
    if (!isOperational) {
      // Programming errors should be fixed by developers
      logger.error('NON-OPERATIONAL ERROR: This requires developer attention', { 
        error: apiError,
        isOperational: false
      });
      
      // In production, notify monitoring and consider graceful shutdown
      if (process.env.NODE_ENV === 'production') {
        // Notify monitoring systems (placeholder - replace with actual implementation)
        console.error('CRITICAL ERROR: Notifying monitoring systems');
        
        // Optionally, initiate graceful shutdown
        // setTimeout(() => process.exit(1), 3000);
      }
    }
  } catch (handlerError) {
    // Last resort if the exception handler itself fails
    console.error('Error in uncaughtExceptionHandler:', handlerError);
    console.error('Original error:', error);
  }
};

/**
 * Global handler for unhandled promise rejections.
 * This handler treats unhandled rejections similarly to uncaught exceptions,
 * logging them with additional promise-specific context.
 *
 * @param reason - Reason for the promise rejection (usually an error)
 * @param promise - The promise that was rejected
 */
const unhandledRejectionHandler = (reason: Error | any, promise: Promise<any>): void => {
  try {
    // Convert to ApiError if needed for consistent handling
    const error = reason instanceof ApiError ? reason : createErrorFromUnknown(reason);
    
    // Log the unhandled rejection with critical severity
    logger.error('UNHANDLED PROMISE REJECTION: Promise chain not properly handled', { 
      error,
      stack: error.stack,
      processId: process.pid,
      nodeVersion: process.version,
      // Safely convert promise to string representation for logging
      promiseInfo: typeof promise.toString === 'function' ? promise.toString() : 'Promise object'
    });
    
    // Determine if operational or programming error
    const isOperational = isOperationalError(error);
    
    if (!isOperational) {
      // Programming errors should be fixed by developers
      logger.error('NON-OPERATIONAL PROMISE ERROR: This requires developer attention', {
        error,
        isOperational: false
      });
      
      // In production, notify monitoring systems
      if (process.env.NODE_ENV === 'production') {
        // Notify monitoring systems (placeholder - replace with actual implementation)
        console.error('CRITICAL ERROR: Notifying monitoring systems');
      }
    }
  } catch (handlerError) {
    // Last resort if the rejection handler itself fails
    console.error('Error in unhandledRejectionHandler:', handlerError);
    console.error('Original rejection reason:', reason);
  }
};

export {
  errorMiddleware,
  notFoundMiddleware,
  uncaughtExceptionHandler,
  unhandledRejectionHandler
};