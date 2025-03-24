import { ApiError } from '../errors/api-error';
import { ErrorCode, ErrorCategory, ErrorSeverity, HttpStatusCodeMap } from '../types/error.types';
import { logger } from './logger';

/**
 * Converts an unknown error to an ApiError instance for consistent error handling
 * 
 * @param error - Any error type to be converted
 * @returns Standardized ApiError instance
 */
export const createErrorFromUnknown = (error: unknown): ApiError => {
  // If it's already an ApiError, return it directly
  if (error instanceof ApiError) {
    return error;
  }
  
  // Convert Error instance to ApiError with original message
  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      cause: error
    });
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return new ApiError({
      message: error,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH
    });
  }
  
  // Handle object errors by converting to string representation
  if (error !== null && typeof error === 'object') {
    return new ApiError({
      message: `Error: ${JSON.stringify(error)}`,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      status: 500,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH
    });
  }
  
  // Default case for any other type
  return new ApiError({
    message: 'An unknown error occurred',
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    status: 500,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH
  });
};

/**
 * Determines if an error is operational (expected) or programming (unexpected)
 * Operational errors are those that we expect and can handle gracefully
 * Programming errors are bugs that should be fixed
 * 
 * @param error - Error to check
 * @returns True if the error is operational, false otherwise
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  // Non-ApiError instances are considered programming errors by default
  return false;
};

/**
 * Maps an error to an appropriate HTTP status code
 * 
 * @param error - Error to map
 * @returns HTTP status code
 */
export const getErrorStatusCode = (error: Error): number => {
  if (error instanceof ApiError) {
    return error.status;
  }
  
  // Map common error types to appropriate status codes
  if (error.name === 'ValidationError') {
    return 400; // Bad Request
  }
  
  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return 500; // Internal Server Error
  }
  
  if (error.name === 'NotFoundError') {
    return 404; // Not Found
  }
  
  if (error.name === 'TimeoutError') {
    return 504; // Gateway Timeout
  }
  
  if (error.name === 'UnauthorizedError') {
    return 401; // Unauthorized
  }
  
  if (error.name === 'ForbiddenError') {
    return 403; // Forbidden
  }
  
  // Default to 500 Internal Server Error
  return 500;
};

/**
 * Logs an error with appropriate context and severity
 * 
 * @param error - Error to log
 * @param context - Additional context for the error
 */
export const logError = (error: Error, context: Record<string, any> = {}): void => {
  const apiError = error instanceof ApiError 
    ? error 
    : createErrorFromUnknown(error);
  
  const errorContext = {
    errorId: apiError.errorId,
    code: apiError.code,
    category: apiError.category,
    severity: apiError.severity,
    isOperational: apiError.isOperational,
    ...apiError.getMetadata(),
    ...context,
    // Include cause if available
    ...(apiError.cause && { cause: apiError.cause.message }),
    // Include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: apiError.stack })
  };
  
  // Log at different levels based on severity
  switch (apiError.severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      logger.error(apiError.message, errorContext);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn(apiError.message, errorContext);
      break;
    case ErrorSeverity.LOW:
      logger.info(`Error: ${apiError.message}`, errorContext);
      break;
    default:
      logger.error(apiError.message, errorContext);
  }
};

/**
 * Sanitizes an error object for safe client response
 * Removes sensitive or internal information before sending to client
 * 
 * @param error - ApiError to sanitize
 * @returns Sanitized error response object
 */
export const sanitizeErrorForResponse = (error: ApiError): object => {
  const response = error.toResponseObject();
  
  // Always remove potentially sensitive information
  const sanitizedResponse = { ...response };
  
  // Remove stack trace in all environments from client responses
  delete (sanitizedResponse as any).stack;
  
  // Remove internal metadata
  delete (sanitizedResponse as any).metadata;
  
  // Remove cause information
  delete (sanitizedResponse as any).cause;
  
  // In production, provide less detailed error messages for certain error types
  if (process.env.NODE_ENV === 'production') {
    if (error.code === ErrorCode.INTERNAL_SERVER_ERROR) {
      sanitizedResponse.message = 'An internal server error occurred';
    }
    
    // Remove detailed error information in production for server errors
    if (error.status >= 500 && sanitizedResponse.details) {
      delete sanitizedResponse.details;
    }
  }
  
  return sanitizedResponse;
};

/**
 * Maps an ErrorCode to the appropriate HTTP status code
 * 
 * @param code - ErrorCode to map
 * @returns HTTP status code
 */
export const mapErrorCodeToHttpStatus = (code: ErrorCode): number => {
  const statusCodeMap: HttpStatusCodeMap = {
    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.INVALID_FORMAT]: 400,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.DUPLICATE_ENTRY]: 409,
    [ErrorCode.RESOURCE_NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.INTEGRATION_ERROR]: 502,
    [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.TIMEOUT]: 504,
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429
  };
  
  return statusCodeMap[code] || 500;
};