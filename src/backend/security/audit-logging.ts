import { 
  AuditEventType, 
  AuditResourceType, 
  AuditSeverity,
  CreateAuditLogDto
} from '../models/audit.model';
import { auditRepository } from '../database/repositories/audit.repository';
import { logger, getCorrelationId } from '../utils/logger';
import { maskSensitiveInfo } from '../utils/logger';
import { auditLoggerConfig } from '../config/logger.config';
import * as winston from 'winston'; // winston v3.8.2
import * as DailyRotateFile from 'winston-daily-rotate-file'; // winston-daily-rotate-file v4.7.1

/**
 * Creates a specialized Winston logger instance for audit logs
 * 
 * @returns Configured Winston logger instance for audit logs
 */
const createAuditLogger = (): winston.Logger => {
  // Configure audit log format with timestamp, level, and message
  const auditFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  );

  // Set up file transport with rotation based on auditLoggerConfig
  const fileTransport = new DailyRotateFile({
    filename: auditLoggerConfig.filename,
    datePattern: auditLoggerConfig.datePattern,
    maxFiles: auditLoggerConfig.maxFiles,
    level: 'info',
    format: auditFormat
  });

  // Configure console transport for development environment
  const transports: winston.transport[] = [fileTransport];
  if (process.env.NODE_ENV === 'development') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  // Create and return the configured logger instance
  return winston.createLogger({
    level: 'info',
    format: auditFormat,
    transports,
    defaultMeta: {
      service: process.env.SERVICE_NAME || 'hcbs-revenue-management',
      component: 'audit-logger'
    }
  });
};

// Create the specialized audit logger
const auditWinstonLogger = createAuditLogger();

/**
 * Logs user authentication and authorization activities
 * 
 * @param eventType Type of user activity event (LOGIN, LOGOUT, FAILED_LOGIN, etc.)
 * @param description Human-readable description of the activity
 * @param metadata Additional context about the activity
 * @param options Additional options including user information
 * @returns Promise that resolves when the audit log is created
 */
const logUserActivity = async (
  eventType: AuditEventType,
  description: string,
  metadata: Record<string, any> = {},
  options: {
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> => {
  try {
    // Extract user ID and username from options
    const { userId, userName, ipAddress, userAgent } = options;

    // Create audit log entry with user activity details
    const auditData: CreateAuditLogDto = {
      userId: userId || null,
      userName: userName || null,
      eventType,
      resourceType: AuditResourceType.USER,
      resourceId: userId || null,
      description,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      // Set severity based on event type (LOGIN/LOGOUT = INFO, FAILED_LOGIN = WARNING)
      severity: eventType === AuditEventType.FAILED_LOGIN ? 
        AuditSeverity.WARNING : AuditSeverity.INFO,
      metadata: maskSensitiveInfo(metadata),
      beforeState: null,
      afterState: null
    };

    // Persist audit log using auditRepository
    await createAuditLogEntry(auditData);

    // Log audit event to specialized audit logger
    logger.debug(`User activity logged: ${eventType}`, { 
      userId, 
      eventType, 
      description 
    });
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error logging user activity', { 
      error, 
      eventType, 
      description 
    });
  }
};

/**
 * Logs access to sensitive data, particularly PHI/PII
 * 
 * @param resourceType Type of resource being accessed (CLIENT, SERVICE, etc.)
 * @param resourceId ID of the specific resource being accessed
 * @param description Human-readable description of the access
 * @param metadata Additional context about the access
 * @param options Additional options including user information
 * @returns Promise that resolves when the audit log is created
 */
const logDataAccess = async (
  resourceType: AuditResourceType,
  resourceId: string,
  description: string,
  metadata: Record<string, any> = {},
  options: {
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> => {
  try {
    // Extract user ID and username from options
    const { userId, userName, ipAddress, userAgent } = options;

    // Create audit log entry with data access details
    const auditData: CreateAuditLogDto = {
      userId: userId || null,
      userName: userName || null,
      eventType: AuditEventType.READ,
      resourceType,
      resourceId,
      description,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      // Set severity to INFO for normal access
      severity: AuditSeverity.INFO,
      metadata: maskSensitiveInfo(metadata),
      beforeState: null,
      afterState: null
    };

    // Persist audit log using auditRepository
    await createAuditLogEntry(auditData);

    // Log audit event to specialized audit logger
    logger.debug(`Data access logged: ${resourceType} ${resourceId}`, { 
      userId, 
      resourceType, 
      resourceId, 
      description 
    });
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error logging data access', { 
      error, 
      resourceType, 
      resourceId, 
      description 
    });
  }
};

/**
 * Logs changes to data including create, update, and delete operations
 * 
 * @param eventType Type of data change event (CREATE, UPDATE, DELETE)
 * @param resourceType Type of resource being changed
 * @param resourceId ID of the specific resource being changed
 * @param description Human-readable description of the change
 * @param beforeState State of the resource before the change (for UPDATE/DELETE)
 * @param afterState State of the resource after the change (for CREATE/UPDATE)
 * @param metadata Additional context about the change
 * @param options Additional options including user information
 * @returns Promise that resolves when the audit log is created
 */
const logDataChange = async (
  eventType: AuditEventType,
  resourceType: AuditResourceType,
  resourceId: string,
  description: string,
  beforeState: Record<string, any> | null = null,
  afterState: Record<string, any> | null = null,
  metadata: Record<string, any> = {},
  options: {
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> => {
  try {
    // Extract user ID and username from options
    const { userId, userName, ipAddress, userAgent } = options;

    // Create audit log entry with data change details
    const auditData: CreateAuditLogDto = {
      userId: userId || null,
      userName: userName || null,
      eventType,
      resourceType,
      resourceId,
      description,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      // Set severity based on event type (CREATE/UPDATE = INFO, DELETE = WARNING)
      severity: eventType === AuditEventType.DELETE ? 
        AuditSeverity.WARNING : AuditSeverity.INFO,
      metadata: maskSensitiveInfo(metadata),
      // Include before and after state for tracking changes
      beforeState: beforeState ? maskSensitiveInfo(beforeState) : null,
      afterState: afterState ? maskSensitiveInfo(afterState) : null
    };

    // Persist audit log using auditRepository
    await createAuditLogEntry(auditData);

    // Log audit event to specialized audit logger
    logger.debug(`Data change logged: ${eventType} ${resourceType} ${resourceId}`, { 
      userId, 
      eventType, 
      resourceType, 
      resourceId, 
      description 
    });
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error logging data change', { 
      error, 
      eventType, 
      resourceType, 
      resourceId, 
      description 
    });
  }
};

/**
 * Logs security-related events such as permission changes, security settings modifications
 * 
 * @param eventType Type of security event
 * @param description Human-readable description of the event
 * @param severity Severity level of the event
 * @param metadata Additional context about the event
 * @param options Additional options including user information
 * @returns Promise that resolves when the audit log is created
 */
const logSecurityEvent = async (
  eventType: AuditEventType,
  description: string,
  severity: AuditSeverity = AuditSeverity.WARNING,
  metadata: Record<string, any> = {},
  options: {
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> => {
  try {
    // Extract user ID and username from options
    const { userId, userName, ipAddress, userAgent } = options;

    // Create audit log entry with security event details
    const auditData: CreateAuditLogDto = {
      userId: userId || null,
      userName: userName || null,
      eventType,
      resourceType: AuditResourceType.SYSTEM,
      resourceId: null,
      description,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      // Use provided severity or default to WARNING for security events
      severity,
      metadata: maskSensitiveInfo(metadata),
      beforeState: null,
      afterState: null
    };

    // Persist audit log using auditRepository
    await createAuditLogEntry(auditData);

    // Log audit event to specialized audit logger
    logger.debug(`Security event logged: ${eventType}`, { 
      userId, 
      eventType, 
      description, 
      severity 
    });
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error logging security event', { 
      error, 
      eventType, 
      description, 
      severity 
    });
  }
};

/**
 * Retrieves audit logs based on specified filter criteria
 * 
 * @param filter Filter criteria for audit logs
 * @param page Page number for pagination
 * @param limit Number of logs per page
 * @returns Paginated list of audit logs matching the filter criteria
 */
const getAuditLogsByFilter = async (
  filter: Record<string, any> = {},
  page: number = 1,
  limit: number = 25
): Promise<{ data: any[], total: number }> => {
  try {
    // Validate filter parameters
    page = Math.max(1, page);
    limit = Math.max(1, Math.min(100, limit));

    // Call auditRepository.getAuditLogs with filter and pagination parameters
    const result = await auditRepository.getAuditLogs(
      filter,
      { page, limit },
      [{ column: 'timestamp', direction: 'DESC' }]
    );
    
    // Return the paginated results
    return {
      data: result.data,
      total: result.total
    };
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error retrieving audit logs', { error, filter, page, limit });
    throw error;
  }
};

/**
 * Retrieves security-related audit logs for compliance monitoring
 * 
 * @param filter Filter criteria for audit logs
 * @param page Page number for pagination
 * @param limit Number of logs per page
 * @returns Paginated list of security-related audit logs
 */
const getSecurityAuditLogs = async (
  filter: Record<string, any> = {},
  page: number = 1,
  limit: number = 25
): Promise<{ data: any[], total: number }> => {
  try {
    // Enhance filter to focus on security-related events
    const securityFilter = {
      ...filter,
      // Include LOGIN, LOGOUT, FAILED_LOGIN event types
      eventType: filter.eventType || [
        AuditEventType.LOGIN,
        AuditEventType.LOGOUT,
        AuditEventType.FAILED_LOGIN,
        AuditEventType.PASSWORD_CHANGE,
        AuditEventType.PASSWORD_RESET
      ],
      // Include events with WARNING, ERROR, CRITICAL severity
      severity: filter.severity || [
        AuditSeverity.WARNING,
        AuditSeverity.ERROR,
        AuditSeverity.CRITICAL
      ]
    };
    
    // Call auditRepository.getSecurityAuditLogs with enhanced filter
    return await getAuditLogsByFilter(securityFilter, page, limit);
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error retrieving security audit logs', { error, filter, page, limit });
    throw error;
  }
};

/**
 * Retrieves audit logs related to data access, particularly for PHI/PII
 * 
 * @param filter Filter criteria for audit logs
 * @param page Page number for pagination
 * @param limit Number of logs per page
 * @returns Paginated list of data access audit logs
 */
const getDataAccessAuditLogs = async (
  filter: Record<string, any> = {},
  page: number = 1,
  limit: number = 25
): Promise<{ data: any[], total: number }> => {
  try {
    // Enhance filter to focus on data access events
    const dataAccessFilter = {
      ...filter,
      // Include READ event type
      eventType: filter.eventType || AuditEventType.READ,
      // Focus on sensitive resource types (CLIENT, SERVICE, etc.)
      resourceType: filter.resourceType || [
        AuditResourceType.CLIENT,
        AuditResourceType.SERVICE,
        AuditResourceType.CLAIM,
        AuditResourceType.PAYMENT,
        AuditResourceType.AUTHORIZATION,
        AuditResourceType.DOCUMENT
      ]
    };
    
    // Call auditRepository.getDataAccessAuditLogs with enhanced filter
    return await getAuditLogsByFilter(dataAccessFilter, page, limit);
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error retrieving data access audit logs', { error, filter, page, limit });
    throw error;
  }
};

/**
 * Helper function to create a standardized audit log entry
 * 
 * @param auditData Data for the audit log entry
 * @returns Promise that resolves when the audit log is created
 */
const createAuditLogEntry = async (auditData: CreateAuditLogDto): Promise<void> => {
  try {
    // Add correlation ID from current request context
    const correlationId = getCorrelationId();
    const metadata = {
      ...auditData.metadata,
      correlationId
    };

    // Add timestamp if not provided
    const now = new Date();
    
    // Mask sensitive information in metadata, beforeState, and afterState
    const maskedMetadata = maskSensitiveInfo(metadata);
    const maskedBeforeState = auditData.beforeState ? 
      maskSensitiveInfo(auditData.beforeState) : null;
    const maskedAfterState = auditData.afterState ? 
      maskSensitiveInfo(auditData.afterState) : null;

    // Persist audit log using auditRepository
    await auditRepository.createAuditLog({
      ...auditData,
      metadata: maskedMetadata,
      beforeState: maskedBeforeState,
      afterState: maskedAfterState
    });

    // Log audit event to specialized audit logger
    auditWinstonLogger.info(auditData.description, {
      eventType: auditData.eventType,
      resourceType: auditData.resourceType,
      resourceId: auditData.resourceId,
      userId: auditData.userId,
      userName: auditData.userName,
      severity: auditData.severity,
      metadata: maskedMetadata,
      correlationId
    });
  } catch (error) {
    // Handle and log any errors that occur during the process
    logger.error('Error creating audit log entry', { error, auditData });
    throw error;
  }
};

// Export the audit logger with all its functions for use throughout the application
export const auditLogger = {
  logUserActivity,
  logDataAccess,
  logDataChange,
  logSecurityEvent,
  getAuditLogsByFilter,
  getSecurityAuditLogs,
  getDataAccessAuditLogs
};