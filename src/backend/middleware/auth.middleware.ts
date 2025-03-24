/**
 * Express middleware for authentication and authorization in the HCBS Revenue Management System.
 * This middleware verifies JWT tokens, attaches authenticated user information to requests,
 * and provides role-based access control for protected routes.
 */

import { Request, Response, NextFunction } from 'express'; // express v4.18+
import {
  Request as ExtendedRequest,
  AuthenticatedUser,
} from '../types/request.types';
import { verifyAccessToken } from '../security/token';
import { AuthError } from '../errors/auth-error';
import { PermissionError } from '../errors/permission-error';
import { logger } from '../utils/logger';
import { config } from '../config';
import { isMfaRequired } from '../security/authentication';
import { hasPermission, hasPermissionForAction } from '../security/authorization';
import { PermissionCategory, PermissionAction } from '../types/users.types';
import { auditLog } from '../security/audit-logging';

/**
 * Helper function to extract JWT token from Authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null if not found
 */
const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  // Check if authorization header exists
  if (!authHeader) {
    return null;
  }

  // Split the header by space to separate 'Bearer' from the token
  const parts = authHeader.split(' ');

  // Verify the header starts with 'Bearer '
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1]; // Return the token portion if format is valid
  }

  return null; // Otherwise return null
};

/**
 * Helper function to extract request information for authentication context
 * @param req Express Request object
 * @returns Request context information
 */
const getRequestInfo = (req: Request): { ipAddress: string; userAgent: string; deviceId: string | null } => {
  // Extract IP address from request (considering X-Forwarded-For header)
  const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';

  // Extract user agent from request headers
  const userAgent = req.headers['user-agent'] || '';

  // Extract device ID from request cookies or headers if available
  const deviceId = req.cookies?.deviceId || req.headers['x-device-id'] as string || null;

  return {
    ipAddress,
    userAgent,
    deviceId,
  };
};

/**
 * Express middleware to authenticate requests using JWT tokens
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 */
export const authenticate = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extract the authorization header from the request
  const authHeader = req.headers.authorization;

  // If no authorization header is present, set req.user to null and call next()
  if (!authHeader) {
    req.user = null;
    return next();
  }

  // Parse the Bearer token from the authorization header
  const token = extractTokenFromHeader(authHeader);

  // If token format is invalid, throw AuthError.unauthorized
  if (!token) {
    logger.warn('Invalid token format in authorization header');
    return next(AuthError.unauthorized('Invalid token format'));
  }

  try {
    // Verify the access token using verifyAccessToken function
    const user = await verifyAccessToken(token);

    // Set the authenticated user information on the request object
    req.user = user;

    // Log successful authentication with user ID and request path
    logger.info('Authentication successful', {
      userId: user.id,
      path: req.path,
    });

    // Call next() to proceed to the next middleware
    next();
  } catch (error) {
    // Log authentication failure with error message and request path
    logger.error('Authentication failed', {
      path: req.path,
      error: error.message,
    });
    next(error); // Pass the error to the next error handling middleware
  }
};

/**
 * Express middleware to require authentication for protected routes
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 */
export const requireAuth = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check if req.user exists (user is authenticated)
  if (!req.user) {
    logger.warn('Unauthorized access attempt', { path: req.path });
    return next(AuthError.unauthorized('Authentication required'));
  }

  try {
    // Get request information (IP, user agent) for MFA check
    const requestInfo = getRequestInfo(req);

    // Check if MFA is required for this user and request using isMfaRequired
    const mfaRequired = await isMfaRequired(req.user, requestInfo);

    // If MFA is required but not completed, throw AuthError.mfaRequired
    if (mfaRequired) {
      logger.warn('MFA required but not completed', {
        userId: req.user.id,
        path: req.path,
      });
      return next(AuthError.mfaRequired('Multi-factor authentication required'));
    }

    // Log successful authorization with user ID and request path
    logger.info('Authorization successful', {
      userId: req.user.id,
      path: req.path,
    });

    // Call next() to proceed to the next middleware
    next();
  } catch (error) {
    // Log authorization failure with error message and request path
    logger.error('Authorization failed', {
      path: req.path,
      error: error.message,
    });
    next(error); // Pass the error to the next error handling middleware
  }
};

/**
 * Express middleware factory to require specific permission for a route
 * @param permission Permission to check
 * @returns Middleware function that checks for the specified permission
 */
export const requirePermission = (permission: string) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated by calling requireAuth middleware
      await requireAuth(req, res, next);

      // Check if the authenticated user has the specified permission
      if (!hasPermission(req.user, permission)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          permission,
          path: req.path,
        });
        return next(
          PermissionError.insufficientPermissions(
            'Insufficient permissions',
            [permission]
          )
        );
      }

      // Log successful permission check with user ID, permission, and request path
      logger.info('Permission check successful', {
        userId: req.user.id,
        permission,
        path: req.path,
      });

      // Call next() to proceed to the next middleware
      next();
    } catch (error) {
      // Log permission check failure with error message and request path
      logger.error('Permission check failed', {
        path: req.path,
        error: error.message,
      });
      next(error); // Pass the error to the next error handling middleware
    }
  };
};

/**
 * Express middleware factory to require permission for a specific category and action
 * @param category Permission category
 * @param action Permission action
 * @param resource Optional resource specifier
 * @returns Middleware function that checks for the specified permission
 */
export const requirePermissionForAction = (
  category: PermissionCategory,
  action: PermissionAction,
  resource: string | null = null
) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated by calling requireAuth middleware
      await requireAuth(req, res, next);

      // Check if the authenticated user has permission for the specified category, action, and resource
      if (!await hasPermissionForAction(req.user, category, action, resource)) {
        const permissionName = `${category}:${action}${resource ? `:${resource}` : ''}`;
        logger.warn('Insufficient permissions for action', {
          userId: req.user.id,
          category,
          action,
          resource,
          path: req.path,
        });
        return next(
          PermissionError.insufficientPermissions(
            'Insufficient permissions for this action',
            [permissionName]
          )
        );
      }

      // Log successful permission check with user ID, category, action, and request path
      logger.info('Permission check successful for action', {
        userId: req.user.id,
        category,
        action,
        resource,
        path: req.path,
      });

      // Call next() to proceed to the next middleware
      next();
    } catch (error) {
      // Log permission check failure with error message and request path
      logger.error('Permission check failed for action', {
        path: req.path,
        error: error.message,
      });
      next(error); // Pass the error to the next error handling middleware
    }
  };
};