/**
 * CORS Middleware
 * 
 * This file implements Cross-Origin Resource Sharing (CORS) middleware for the HCBS Revenue
 * Management System API. It controls which origins can access the API, logs CORS requests
 * for security monitoring, and applies the CORS configuration from cors.config.ts.
 */

import cors from 'cors'; // cors ^2.8.5
import { Request, Response, NextFunction } from 'express'; // express ^4.18.2
import { corsOptions } from '../config/cors.config';
import { logger } from '../utils/logger';

/**
 * Creates and configures the CORS middleware using the options from cors.config.ts.
 * This middleware enforces the defined origin policy, allows specified HTTP methods, 
 * and controls which headers can be used in requests and responses.
 * 
 * @returns Configured CORS middleware function
 */
export const corsMiddleware = (): ReturnType<typeof cors> => {
  return cors(corsOptions);
};

/**
 * Middleware that logs details about CORS requests for security monitoring.
 * This enables tracking of cross-origin access patterns and helps identify
 * potential security issues or unauthorized access attempts.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const logCorsRequest = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  logger.debug('CORS request received', {
    origin: origin || 'same-origin',
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  // If the origin is present, log additional info at info level for security monitoring
  if (origin) {
    logger.info('Cross-origin request', {
      origin,
      method: req.method,
      path: req.path,
      referer: req.headers.referer || 'not provided',
      userAgent: req.headers['user-agent'] || 'not provided'
    });
  }
  
  next();
};