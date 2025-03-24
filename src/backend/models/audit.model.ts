/**
 * Audit Model - Defines the data models and interfaces for the audit logging system
 * 
 * This module provides comprehensive type definitions for audit logs, ensuring
 * proper tracking of user activities, system events, and data changes for
 * HIPAA compliance and security monitoring.
 * 
 * The audit system captures detailed information about each action performed
 * within the system, including who performed it, when, what resource was affected,
 * and what specifically changed. This enables compliance with regulatory
 * requirements and provides a complete audit trail for security investigations.
 */

import { UUID, Timestamp } from '../types/common.types';
import { AuditableEntity } from '../types/common.types';

/**
 * Enum defining the types of events that can be audited within the system
 * These represent the specific actions taken by users or the system itself
 */
export enum AuditEventType {
  CREATE = 'CREATE',       // Creation of a new resource
  READ = 'READ',           // Reading/viewing a resource
  UPDATE = 'UPDATE',       // Modification of an existing resource
  DELETE = 'DELETE',       // Deletion of a resource
  LOGIN = 'LOGIN',         // User login
  LOGOUT = 'LOGOUT',       // User logout
  FAILED_LOGIN = 'FAILED_LOGIN', // Failed login attempt
  PASSWORD_CHANGE = 'PASSWORD_CHANGE', // User changed password
  PASSWORD_RESET = 'PASSWORD_RESET',   // User reset password
  EXPORT = 'EXPORT',       // Data export operation
  IMPORT = 'IMPORT',       // Data import operation
  SUBMIT = 'SUBMIT',       // Submission of a resource (e.g., claim)
  APPROVE = 'APPROVE',     // Approval of a resource
  REJECT = 'REJECT',       // Rejection of a resource
  SYSTEM = 'SYSTEM'        // System-generated event
}

/**
 * Enum defining the types of resources that can be audited
 * These represent the entities within the system that can be tracked
 */
export enum AuditResourceType {
  USER = 'USER',                   // User accounts
  CLIENT = 'CLIENT',               // Client/patient records
  SERVICE = 'SERVICE',             // Service delivery records
  CLAIM = 'CLAIM',                 // Insurance claims
  PAYMENT = 'PAYMENT',             // Payment records
  AUTHORIZATION = 'AUTHORIZATION', // Service authorizations
  PROGRAM = 'PROGRAM',             // Program configurations
  PAYER = 'PAYER',                 // Payer configurations
  FACILITY = 'FACILITY',           // Facility information
  REPORT = 'REPORT',               // Report generation
  SETTING = 'SETTING',             // System settings
  ROLE = 'ROLE',                   // User roles
  PERMISSION = 'PERMISSION',       // Permissions
  DOCUMENT = 'DOCUMENT',           // Uploaded documents
  SYSTEM = 'SYSTEM'                // System-wide changes
}

/**
 * Enum defining the severity levels for audit events
 * Used to categorize the importance of different audit events
 */
export enum AuditSeverity {
  INFO = 'INFO',           // Informational events, normal operations
  WARNING = 'WARNING',     // Events that might indicate a problem
  ERROR = 'ERROR',         // Events that indicate a significant issue
  CRITICAL = 'CRITICAL'    // High-priority events requiring immediate attention
}

/**
 * Interface defining the structure of an audit log entry
 * Captures comprehensive information about an audited event
 */
export interface AuditLog {
  /** Unique identifier for the audit log entry */
  id: UUID;
  
  /** When the event occurred */
  timestamp: Timestamp;
  
  /** ID of the user who performed the action (null for system events) */
  userId: UUID | null;
  
  /** Name of the user who performed the action (for better readability) */
  userName: string | null;
  
  /** Type of event (create, read, update, etc.) */
  eventType: AuditEventType;
  
  /** Type of resource affected (user, client, claim, etc.) */
  resourceType: AuditResourceType;
  
  /** ID of the specific resource instance affected (if applicable) */
  resourceId: UUID | null;
  
  /** Human-readable description of the event */
  description: string;
  
  /** IP address from which the action was performed */
  ipAddress: string | null;
  
  /** User agent (browser/device) from which the action was performed */
  userAgent: string | null;
  
  /** Severity level of the event */
  severity: AuditSeverity;
  
  /** Additional structured metadata related to the event */
  metadata: Record<string, any> | null;
  
  /** State of the resource before the change (for UPDATE events) */
  beforeState: Record<string, any> | null;
  
  /** State of the resource after the change (for CREATE/UPDATE events) */
  afterState: Record<string, any> | null;
}

/**
 * Data transfer object for creating new audit log entries
 * Omits system-generated fields like ID and timestamp
 */
export interface CreateAuditLogDto {
  /** ID of the user who performed the action (null for system events) */
  userId: UUID | null;
  
  /** Name of the user who performed the action (for better readability) */
  userName: string | null;
  
  /** Type of event (create, read, update, etc.) */
  eventType: AuditEventType;
  
  /** Type of resource affected (user, client, claim, etc.) */
  resourceType: AuditResourceType;
  
  /** ID of the specific resource instance affected (if applicable) */
  resourceId: UUID | null;
  
  /** Human-readable description of the event */
  description: string;
  
  /** IP address from which the action was performed */
  ipAddress: string | null;
  
  /** User agent (browser/device) from which the action was performed */
  userAgent: string | null;
  
  /** Severity level of the event */
  severity: AuditSeverity;
  
  /** Additional structured metadata related to the event */
  metadata: Record<string, any> | null;
  
  /** State of the resource before the change (for UPDATE events) */
  beforeState: Record<string, any> | null;
  
  /** State of the resource after the change (for CREATE/UPDATE events) */
  afterState: Record<string, any> | null;
}

/**
 * Interface for filtering audit log queries
 * Provides criteria for searching and filtering audit logs
 */
export interface AuditLogFilter {
  /** Filter by events occurring after this date */
  startDate: string | null;
  
  /** Filter by events occurring before this date */
  endDate: string | null;
  
  /** Filter by specific user who performed actions */
  userId: UUID | null;
  
  /** Filter by event type(s) */
  eventType: AuditEventType | AuditEventType[] | null;
  
  /** Filter by resource type(s) */
  resourceType: AuditResourceType | AuditResourceType[] | null;
  
  /** Filter by specific resource instance */
  resourceId: UUID | null;
  
  /** Filter by severity level(s) */
  severity: AuditSeverity | AuditSeverity[] | null;
  
  /** Text search across description and metadata */
  searchTerm: string | null;
}

/**
 * Interface for resources that can be audited
 * Minimalist approach to identify a resource for auditing purposes
 */
export interface AuditableResource {
  /** Unique identifier of the resource */
  id: UUID;
  
  /** Type of resource */
  resourceType: AuditResourceType;
}

/**
 * Interface for summarized audit log statistics
 * Used for reporting and dashboards
 */
export interface AuditLogSummary {
  /** Total number of audit events in the selected time period */
  totalEvents: number;
  
  /** Count of events grouped by event type */
  eventsByType: Record<AuditEventType, number>;
  
  /** Count of events grouped by resource type */
  eventsByResource: Record<AuditResourceType, number>;
  
  /** Count of events grouped by severity */
  eventsBySeverity: Record<AuditSeverity, number>;
  
  /** Count of events grouped by user */
  eventsByUser: Record<string, number>;
  
  /** Time range for the summary data */
  timeRange: { startDate: string; endDate: string };
}