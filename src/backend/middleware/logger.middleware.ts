import { NextFunction, Request as ExpressRequest, Response } from 'express'; // express 4.18+
import * as onFinished from 'on-finished'; // on-finished 2.4.1
import { 
  logger, 
  createCorrelationId, 
  setCorrelationId,
  httpLogger,
  info,
  debug,
  error
} from '../utils/logger';
import { Request } from '../types/request.types';
import { maskSensitiveInfo } from '../utils/logger';

/**
 * Middleware that logs incoming HTTP requests and adds correlation ID and timing information
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLogger = (req: ExpressRequest, res: Response, next: NextFunction): void => {
  // Skip logging for health checks and other non-essential paths
  if (shouldSkipLogging(req.originalUrl)) {
    return next();
  }

  // Generate and assign correlation ID
  const correlationId = createCorrelationId();
  (req as Request).requestId = correlationId;
  setCorrelationId(correlationId);

  // Store start time for performance tracking
  (req as Request).startTime = Date.now();

  // Prepare loggable request data with sensitive information masked
  const sanitizedPath = getLoggablePath(req.originalUrl);
  const loggableHeaders = getLoggableHeaders(req.headers);
  
  // Log the request with appropriate masking
  const requestData = {
    method: req.method,
    url: sanitizedPath,
    headers: loggableHeaders,
    ip: req.ip,
    query: maskSensitiveInfo(req.query),
    params: maskSensitiveInfo(req.params)
  };

  // Add user information if authenticated
  const typedReq = req as Request;
  if (typedReq.user) {
    requestData['userId'] = typedReq.user.id;
    requestData['userRole'] = typedReq.user.roleName;
  }

  logger.info(`HTTP Request: ${req.method} ${sanitizedPath}`, requestData, {
    component: 'http',
    correlationId
  });

  next();
};

/**
 * Middleware that logs HTTP response details after the response is completed
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const responseLogger = (req: ExpressRequest, res: Response, next: NextFunction): void => {
  // Skip logging for health checks and other non-essential paths
  if (shouldSkipLogging(req.originalUrl)) {
    return next();
  }

  // Process the request first
  next();

  // Execute callback when response is completed
  onFinished(res, (err, res) => {
    try {
      const typedReq = req as Request;
      const startTime = typedReq.startTime || Date.now();
      const responseTime = Date.now() - startTime;
      const correlationId = typedReq.requestId;
      const sanitizedPath = getLoggablePath(req.originalUrl);

      // Prepare response data
      const responseData = {
        method: req.method,
        url: sanitizedPath,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('content-length') || 0,
        correlationId
      };

      // Add user information if authenticated
      if (typedReq.user) {
        responseData['userId'] = typedReq.user.id;
        responseData['userRole'] = typedReq.user.roleName;
      }

      // Log at different levels based on status code
      if (res.statusCode >= 500) {
        logger.error(`HTTP Response: ${req.method} ${sanitizedPath} ${res.statusCode} ${responseTime}ms`, 
          responseData, 
          { component: 'http', correlationId }
        );
      } else if (res.statusCode >= 400) {
        logger.warn(`HTTP Response: ${req.method} ${sanitizedPath} ${res.statusCode} ${responseTime}ms`, 
          responseData, 
          { component: 'http', correlationId }
        );
      } else {
        logger.info(`HTTP Response: ${req.method} ${sanitizedPath} ${res.statusCode} ${responseTime}ms`, 
          responseData, 
          { component: 'http', correlationId }
        );
      }
    } catch (error) {
      // Ensure logging errors don't impact the application
      logger.error('Error in response logger', { error }, { component: 'http' });
    }
  });
};

/**
 * Middleware that uses Morgan for HTTP request logging with a standardized format
 * 
 * @returns Morgan middleware configured for HTTP logging
 */
export const morganLogger = () => {
  return httpLogger;
};

/**
 * Helper function to determine if logging should be skipped for certain paths
 * 
 * @param path - Request path
 * @returns True if logging should be skipped, false otherwise
 */
function shouldSkipLogging(path: string): boolean {
  // Skip logging for health check endpoints
  if (path === '/health' || path === '/api/health' || 
      path.startsWith('/health/') || path.startsWith('/api/health/')) {
    return true;
  }

  // Skip logging for static assets
  if (path.startsWith('/static/') || 
      path.startsWith('/assets/') || 
      path.startsWith('/favicon.ico') ||
      path.includes('.js') ||
      path.includes('.css') ||
      path.includes('.png') ||
      path.includes('.jpg') ||
      path.includes('.svg')) {
    return true;
  }

  return false;
}

/**
 * Helper function to sanitize path for logging to prevent sensitive data in URLs
 * 
 * @param originalUrl - Original request URL
 * @returns Sanitized URL safe for logging
 */
function getLoggablePath(originalUrl: string): string {
  // Parse URL to separate path from query string
  const urlParts = originalUrl.split('?');
  const path = urlParts[0];

  // Replace potential sensitive IDs in path with placeholders
  // Example: /api/clients/12345/records -> /api/clients/:id/records
  return path
    // Replace UUIDs with :id
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    // Replace numeric IDs with :id
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    // Replace potential email addresses in URLs
    .replace(/\/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '/:email')
    // Replace potential sensitive identifiers like SSNs
    .replace(/\/\d{3}-\d{2}-\d{4}/g, '/:ssn');
}

/**
 * Helper function to extract and sanitize headers for logging
 * 
 * @param headers - Request headers
 * @returns Object with safe headers for logging
 */
function getLoggableHeaders(headers: any): object {
  const safeHeaders: Record<string, any> = {};
  
  // Include only specific headers that are safe to log
  const headersToCopy = [
    'user-agent',
    'content-type',
    'content-length',
    'accept',
    'accept-encoding',
    'accept-language',
    'host',
    'x-forwarded-for',
    'x-real-ip',
    'x-request-id',
    'referer',
    'origin',
    'x-correlation-id'
  ];

  // Copy only the safe headers to the new object
  for (const header of headersToCopy) {
    if (headers[header]) {
      safeHeaders[header] = headers[header];
    }
  }

  // Explicitly exclude sensitive headers
  ['authorization', 'cookie', 'proxy-authorization', 'set-cookie'].forEach(header => {
    if (headers[header]) {
      safeHeaders[header] = '[REDACTED]';
    }
  });

  return safeHeaders;
}