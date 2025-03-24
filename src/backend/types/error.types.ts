/**
 * Error types and interfaces for the HCBS Revenue Management System.
 * 
 * This file defines the core error handling framework used throughout the application
 * to ensure consistent error categorization, reporting, and handling. It provides
 * standardized error codes, categories, severity levels, and detailed error structures
 * that enable comprehensive error tracking and resolution.
 */

import { UUID } from './common.types';

/**
 * Standardized error codes for categorizing errors throughout the system.
 * These codes help identify the specific error type and enable consistent
 * error handling and reporting.
 */
export enum ErrorCode {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Error categories for grouping errors by their source or domain.
 * This categorization helps in routing errors to appropriate handlers
 * and generating meaningful reports and analytics.
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS = 'BUSINESS',
  INTEGRATION = 'INTEGRATION',
  SYSTEM = 'SYSTEM'
}

/**
 * Error severity levels for prioritizing errors and determining the
 * appropriate response and escalation path.
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL', // Requires immediate attention, affects system availability
  HIGH = 'HIGH',         // Significant impact on business operations
  MEDIUM = 'MEDIUM',     // Limited impact, should be addressed soon
  LOW = 'LOW'            // Minimal impact, can be addressed as part of regular maintenance
}

/**
 * Interface for detailed error information that can be included with errors.
 * This provides context-specific details about what went wrong.
 */
export interface ErrorDetail {
  message: string;                      // Human-readable error message
  code: string;                         // Specific error code
  path?: string | null;                 // Path to the error (e.g., field path)
  context?: Record<string, any> | null; // Additional context for the error
}

/**
 * Interface for validation-specific error details with field information.
 * Used when input data fails validation rules.
 */
export interface ValidationErrorDetail {
  field: string;         // The field that failed validation
  message: string;       // Description of the validation error
  value: any;            // The value that failed validation
  code: string;          // Validation error code
}

/**
 * Interface for database-specific error details with operation and entity information.
 * Used when database operations fail.
 */
export interface DatabaseErrorDetail {
  operation: string;        // The database operation that failed (e.g., INSERT, UPDATE)
  entity: string;           // The entity/table involved
  message: string;          // Description of the database error
  code: string | null;      // Database error code (if available)
  constraint: string | null; // Constraint that was violated (if applicable)
}

/**
 * Interface for integration-specific error details with service and endpoint information.
 * Used when external service integrations fail.
 */
export interface IntegrationErrorDetail {
  service: string;                      // The external service name
  endpoint: string;                     // The specific endpoint/operation
  statusCode: number | null;            // HTTP status code (if applicable)
  requestId: string | null;             // External request ID for tracing
  message: string;                      // Error message
  responseBody: Record<string, any> | null; // Response body (if available)
}

/**
 * Interface for business rule violation error details with rule information.
 * Used when business logic constraints are violated.
 */
export interface BusinessErrorDetail {
  rule: string;                         // The business rule that was violated
  message: string;                      // Description of the violation
  context: Record<string, any> | null;  // Context of the violation
}

/**
 * Interface for error metadata with contextual information about when and where
 * the error occurred. This helps with troubleshooting and analytics.
 */
export interface ErrorMetadata {
  timestamp: Date;          // When the error occurred
  requestId: string | null; // Request ID for tracing across components
  userId: UUID | null;      // User ID if error occurred in an authenticated context
  path: string | null;      // Request path where the error occurred
  method: string | null;    // HTTP method or operation being performed
  component: string | null; // System component where the error originated
  environment: string;      // Environment (development, staging, production)
}

/**
 * Interface for options used when creating error instances.
 * Provides a standardized way to construct errors with all necessary information.
 */
export interface ErrorOptions {
  message: string;                   // Human-readable error message
  code: ErrorCode;                   // Error code from ErrorCode enum
  status: number;                    // HTTP status code
  category: ErrorCategory;           // Error category from ErrorCategory enum
  severity: ErrorSeverity;           // Error severity from ErrorSeverity enum
  details?: ErrorDetail[] | null;    // Detailed error information
  cause?: Error | null;              // Original error that caused this error
  metadata?: Partial<ErrorMetadata>; // Contextual metadata about the error
}

/**
 * Interface for standardized error responses sent to clients.
 * This ensures a consistent error format in API responses.
 */
export interface ErrorResponse {
  errorId: string;                // Unique identifier for this error instance
  status: number;                 // HTTP status code
  code: string;                   // Error code
  message: string;                // User-friendly error message
  details: ErrorDetail[] | null;  // Additional error details (if available)
  timestamp: string;              // When the error occurred (ISO format)
}

/**
 * Type mapping ErrorCode to appropriate HTTP status codes.
 * This ensures consistent status code usage across the application.
 */
export type HttpStatusCodeMap = {
  [key in ErrorCode]: number;
};