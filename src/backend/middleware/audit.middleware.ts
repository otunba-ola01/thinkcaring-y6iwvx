import { Response, NextFunction } from 'express'; // express 4.18.2
import { Request } from '../types/request.types';
import { 
  AuditEventType, 
  AuditResourceType, 
  AuditSeverity 
} from '../models/audit.model';
import { auditRepository } from '../database/repositories/audit.repository';
import { auditLogger } from '../security/audit-logging';
import { logger, maskSensitiveInfo } from '../utils/logger';

/**
 * Express middleware that automatically logs audit events for API requests
 * in the HCBS Revenue Management System.
 * 
 * This middleware captures user actions, resource access, and system events
 * to maintain a comprehensive audit trail for HIPAA compliance and
 * security monitoring.
 * 
 * @param req Express request object with authentication data
 * @param res Express response object
 * @param next Next middleware function
 */
export const auditMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Skip auditing for certain paths
    if (shouldSkipAuditing(req)) {
      return next();
    }

    // Extract user information from the authenticated request
    const user = req.user;
    const userId = user?.id || null;
    const userName = user ? `${user.firstName} ${user.lastName}`.trim() : null;

    // Determine the resource type based on the request URL
    const resourceType = determineResourceType(req.path);
    
    // Determine the event type based on the HTTP method
    const eventType = determineEventType(req.method);
    
    // Get resource ID from path
    const resourceId = getResourceIdFromPath(req.path);
    
    // Create description of the action being performed
    const description = createAuditDescription(eventType, resourceType, resourceId);
    
    // Capture request metadata
    const metadata = captureRequestMetadata(req);

    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    // Variables to store response data
    let responseBody: any = null;
    let responseStatus: number = 200;

    // Intercept response.send
    res.send = function(body: any): Response {
      responseBody = body;
      responseStatus = res.statusCode;
      return originalSend.apply(res, [body]);
    };

    // Intercept response.json
    res.json = function(body: any): Response {
      responseBody = body;
      responseStatus = res.statusCode;
      return originalJson.apply(res, [body]);
    };

    // Intercept response.end
    res.end = function(chunk?: any, encoding?: string): Response {
      if (chunk) {
        responseBody = chunk;
      }
      responseStatus = res.statusCode;
      
      // Process audit logging after response is sent to avoid blocking
      setTimeout(async () => {
        try {
          // Determine if operation was successful
          const isSuccess = responseStatus >= 200 && responseStatus < 400;
          
          if (!isSuccess) {
            // Log failed requests but don't create audit logs for them
            logger.debug(`Request failed: ${req.method} ${req.path}`, {
              statusCode: responseStatus,
              userId,
              method: req.method
            });
            return;
          }

          // Prepare options for audit logger
          const options = {
            userId: userId || undefined,
            userName: userName || undefined,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || undefined
          };

          // For GET requests (READ operations), log as data access
          if (eventType === AuditEventType.READ) {
            await auditLogger.logDataAccess(
              resourceType,
              resourceId || 'multiple',
              description,
              { 
                ...metadata,
                query: maskSensitiveInfo(req.query),
                responseStatus
              },
              options
            );
          } 
          // For other methods (CREATE, UPDATE, DELETE), log as data change
          else {
            // Determine beforeState and afterState based on method
            let beforeState = null;
            let afterState = null;
            
            if (eventType === AuditEventType.UPDATE) {
              beforeState = {}; // Ideally would be fetched from database
              afterState = maskSensitiveInfo(req.body);
            } else if (eventType === AuditEventType.CREATE) {
              afterState = maskSensitiveInfo(req.body);
            } else if (eventType === AuditEventType.DELETE) {
              beforeState = {}; // Ideally would be fetched from database
            }
            
            await auditLogger.logDataChange(
              eventType,
              resourceType,
              resourceId || 'new',
              description,
              beforeState,
              afterState,
              { 
                ...metadata,
                responseStatus
              },
              options
            );
          }
        } catch (error) {
          logger.error('Error in audit middleware post-processing', { 
            error, 
            path: req.path,
            method: req.method,
            userId
          });
        }
      }, 0);
      
      return originalEnd.apply(res, arguments as any);
    };
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Log error but continue to next middleware
    logger.error('Error in audit middleware', { 
      error, 
      path: req.path,
      method: req.method
    });
    next();
  }
};

/**
 * Factory function that creates an audit middleware with options
 * 
 * @param options Options to customize audit logging behavior
 * @returns Express middleware function for audit logging
 */
export const createAuditMiddleware = (options: {
  excludePaths?: string[];
  resourceTypeMap?: Record<string, AuditResourceType>;
  sensitiveFields?: string[];
} = {}): (req: Request, res: Response, next: NextFunction) => Promise<void> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip auditing for excluded paths
      if (shouldSkipAuditing(req, options.excludePaths)) {
        return next();
      }

      // Extract user information from the authenticated request
      const user = req.user;
      const userId = user?.id || null;
      const userName = user ? `${user.firstName} ${user.lastName}`.trim() : null;

      // Determine the resource type based on the request URL and custom mapping
      const resourceType = options.resourceTypeMap
        ? determineResourceTypeWithMap(req.path, options.resourceTypeMap)
        : determineResourceType(req.path);
      
      // Determine the event type based on the HTTP method
      const eventType = determineEventType(req.method);
      
      // Get resource ID from path
      const resourceId = getResourceIdFromPath(req.path);
      
      // Create description of the action being performed
      const description = createAuditDescription(eventType, resourceType, resourceId);
      
      // Capture request metadata
      const metadata = captureRequestMetadata(req);

      // Store original response methods
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;

      // Variables to store response data
      let responseBody: any = null;
      let responseStatus: number = 200;

      // Intercept response.send
      res.send = function(body: any): Response {
        responseBody = body;
        responseStatus = res.statusCode;
        return originalSend.apply(res, [body]);
      };

      // Intercept response.json
      res.json = function(body: any): Response {
        responseBody = body;
        responseStatus = res.statusCode;
        return originalJson.apply(res, [body]);
      };

      // Intercept response.end
      res.end = function(chunk?: any, encoding?: string): Response {
        if (chunk) {
          responseBody = chunk;
        }
        responseStatus = res.statusCode;
        
        // Process audit logging after response is sent to avoid blocking
        setTimeout(async () => {
          try {
            // Determine if operation was successful
            const isSuccess = responseStatus >= 200 && responseStatus < 400;
            
            if (!isSuccess) {
              // Log failed requests but don't create audit logs for them
              logger.debug(`Request failed: ${req.method} ${req.path}`, {
                statusCode: responseStatus,
                userId,
                method: req.method
              });
              return;
            }

            // Prepare options for audit logger
            const auditOptions = {
              userId: userId || undefined,
              userName: userName || undefined,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'] || undefined
            };

            // For GET requests (READ operations), log as data access
            if (eventType === AuditEventType.READ) {
              await auditLogger.logDataAccess(
                resourceType,
                resourceId || 'multiple',
                description,
                { 
                  ...metadata,
                  query: maskSensitiveInfo(req.query),
                  responseStatus
                },
                auditOptions
              );
            } 
            // For other methods (CREATE, UPDATE, DELETE), log as data change
            else {
              // Determine beforeState and afterState based on method
              let beforeState = null;
              let afterState = null;
              
              if (eventType === AuditEventType.UPDATE) {
                beforeState = {}; // Ideally would be fetched from database
                afterState = maskSensitiveInfo(req.body);
              } else if (eventType === AuditEventType.CREATE) {
                afterState = maskSensitiveInfo(req.body);
              } else if (eventType === AuditEventType.DELETE) {
                beforeState = {}; // Ideally would be fetched from database
              }
              
              await auditLogger.logDataChange(
                eventType,
                resourceType,
                resourceId || 'new',
                description,
                beforeState,
                afterState,
                { 
                  ...metadata,
                  responseStatus
                },
                auditOptions
              );
            }
          } catch (error) {
            logger.error('Error in audit middleware post-processing', { 
              error, 
              path: req.path,
              method: req.method,
              userId
            });
          }
        }, 0);
        
        return originalEnd.apply(res, arguments as any);
      };
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      // Log error but continue to next middleware
      logger.error('Error in audit middleware', { 
        error, 
        path: req.path,
        method: req.method
      });
      next();
    }
  };
};

/**
 * Helper function to determine if auditing should be skipped for a request
 * 
 * @param req Request object
 * @param excludePaths Additional paths to exclude from auditing
 * @returns True if auditing should be skipped, false otherwise
 */
function shouldSkipAuditing(req: Request, excludePaths: string[] = []): boolean {
  // Skip health check endpoints
  if (req.path.startsWith('/health')) {
    return true;
  }
  
  // Skip static asset requests
  if (req.path.startsWith('/static') || 
      req.path.startsWith('/assets') || 
      req.path.startsWith('/favicon')) {
    return true;
  }
  
  // Skip OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return true;
  }
  
  // Skip excluded paths
  if (excludePaths.some(path => req.path.startsWith(path))) {
    return true;
  }
  
  return false;
}

/**
 * Helper function to capture metadata from the request
 * 
 * @param req Request object
 * @returns Object containing request metadata
 */
function captureRequestMetadata(req: Request): Record<string, any> {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.originalUrl || req.url,
    query: maskSensitiveInfo(req.query),
    requestId: req.requestId
  };
}

/**
 * Determines the resource type based on the request path
 * 
 * @param path Request path
 * @returns Appropriate AuditResourceType for the path
 */
function determineResourceType(path: string): AuditResourceType {
  const pathParts = path.split('/').filter(Boolean);
  
  // API paths are typically /api/resource or /api/v1/resource
  const resourcePart = pathParts.length > 1 && pathParts[0] === 'api' 
    ? pathParts.length > 2 && pathParts[1].startsWith('v') 
      ? pathParts[2] // /api/v1/resource
      : pathParts[1] // /api/resource
    : pathParts[0]; // /resource
  
  // Map the resource part to a resource type
  switch (resourcePart) {
    case 'users':
      return AuditResourceType.USER;
    case 'clients':
      return AuditResourceType.CLIENT;
    case 'services':
      return AuditResourceType.SERVICE;
    case 'claims':
      return AuditResourceType.CLAIM;
    case 'payments':
      return AuditResourceType.PAYMENT;
    case 'authorizations':
      return AuditResourceType.AUTHORIZATION;
    case 'programs':
      return AuditResourceType.PROGRAM;
    case 'payers':
      return AuditResourceType.PAYER;
    case 'facilities':
      return AuditResourceType.FACILITY;
    case 'reports':
      return AuditResourceType.REPORT;
    case 'settings':
      return AuditResourceType.SETTING;
    case 'roles':
      return AuditResourceType.ROLE;
    case 'permissions':
      return AuditResourceType.PERMISSION;
    case 'documents':
      return AuditResourceType.DOCUMENT;
    default:
      return AuditResourceType.SYSTEM;
  }
}

/**
 * Determines resource type using a custom mapping
 * 
 * @param path Request path
 * @param mapping Custom mapping of path patterns to resource types
 * @returns Appropriate AuditResourceType for the path
 */
function determineResourceTypeWithMap(
  path: string,
  mapping: Record<string, AuditResourceType>
): AuditResourceType {
  // First check for exact matches in the mapping
  if (mapping[path]) {
    return mapping[path];
  }
  
  // Then check for pattern matches
  for (const [pattern, resourceType] of Object.entries(mapping)) {
    if (path.includes(pattern)) {
      return resourceType;
    }
  }
  
  // Fall back to standard resource type detection
  return determineResourceType(path);
}

/**
 * Determines the event type based on the HTTP method
 * 
 * @param method HTTP method
 * @returns Appropriate AuditEventType for the method
 */
function determineEventType(method: string): AuditEventType {
  switch (method.toUpperCase()) {
    case 'GET':
      return AuditEventType.READ;
    case 'POST':
      return AuditEventType.CREATE;
    case 'PUT':
    case 'PATCH':
      return AuditEventType.UPDATE;
    case 'DELETE':
      return AuditEventType.DELETE;
    default:
      return AuditEventType.SYSTEM;
  }
}

/**
 * Extracts resource ID from a path
 * 
 * @param path Request path
 * @returns Resource ID or null if not found
 */
function getResourceIdFromPath(path: string): string | null {
  // Extract ID from path patterns like /resource/:id or /api/resource/:id
  const pathParts = path.split('/').filter(Boolean);
  
  // Look for UUID or numeric ID in the last path segment
  if (pathParts.length > 0) {
    const lastSegment = pathParts[pathParts.length - 1];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
    const isNumeric = /^\d+$/.test(lastSegment);
    
    if (isUuid || isNumeric) {
      return lastSegment;
    }
  }
  
  return null;
}

/**
 * Creates a human-readable description for the audit log
 * 
 * @param eventType Type of event (CREATE, READ, UPDATE, DELETE)
 * @param resourceType Type of resource being accessed
 * @param resourceId Resource ID or null if not applicable
 * @returns Human-readable description of the action
 */
function createAuditDescription(
  eventType: AuditEventType, 
  resourceType: AuditResourceType, 
  resourceId: string | null
): string {
  const resourceName = resourceType.toString().toLowerCase();
  
  switch (eventType) {
    case AuditEventType.CREATE:
      return `Created new ${resourceName}`;
    case AuditEventType.READ:
      return resourceId 
        ? `Viewed ${resourceName} with ID ${resourceId}` 
        : `Listed ${resourceName} records`;
    case AuditEventType.UPDATE:
      return `Updated ${resourceName} with ID ${resourceId}`;
    case AuditEventType.DELETE:
      return `Deleted ${resourceName} with ID ${resourceId}`;
    default:
      return `Performed ${eventType} operation on ${resourceName}${resourceId ? ` with ID ${resourceId}` : ''}`;
  }
}