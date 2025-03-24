import { v4 as uuidv4 } from 'uuid'; // version 9.0.0
import {
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  ErrorDetail,
  ErrorMetadata,
  ErrorOptions,
  ErrorResponse,
  HttpStatusCodeMap
} from '../types/error.types';
import { UUID } from '../types/common.types';

/**
 * Base error class for all application errors with enhanced properties for error tracking, 
 * categorization, and client responses. This class serves as the foundation for all error
 * handling in the HCBS Revenue Management System.
 * 
 * It extends the native Error class with additional properties needed for comprehensive
 * error handling, logging, and client responses.
 */
export class ApiError extends Error {
  /**
   * Unique identifier for this error instance used for tracking
   */
  public readonly errorId: string;

  /**
   * HTTP status code to be returned to the client
   */
  public readonly status: number;

  /**
   * Error code identifying the specific error type
   */
  public readonly code: ErrorCode;

  /**
   * Error category for grouping errors by their source or domain
   */
  public readonly category: ErrorCategory;

  /**
   * Error severity level for prioritizing errors
   */
  public readonly severity: ErrorSeverity;

  /**
   * Detailed error information with context-specific details
   */
  public details: ErrorDetail[] | null;

  /**
   * Original error that caused this error, useful for error chaining
   */
  public cause: Error | null;

  /**
   * Contextual metadata about the error including timestamps and environment information
   */
  public metadata: ErrorMetadata;

  /**
   * Flag indicating if this is an operational error that can be handled gracefully
   * (true for most application errors, false for programming errors)
   */
  public readonly isOperational: boolean;

  /**
   * Creates a new ApiError instance with the provided options or message
   * 
   * @param options Error options object or error message string
   */
  constructor(options: ErrorOptions | string) {
    // Initialize with default values
    let message = '';
    let code = ErrorCode.INTERNAL_SERVER_ERROR;
    let status = 500;
    let category = ErrorCategory.SYSTEM;
    let severity = ErrorSeverity.MEDIUM;
    let details: ErrorDetail[] | null = null;
    let cause: Error | null = null;
    let metadata: Partial<ErrorMetadata> = {};

    // Process options based on type
    if (typeof options === 'string') {
      message = options;
    } else {
      message = options.message;
      code = options.code || code;
      status = options.status || status;
      category = options.category || category;
      severity = options.severity || severity;
      details = options.details || null;
      cause = options.cause || null;
      metadata = options.metadata || {};
    }

    // Call parent constructor
    super(message);

    // Set error properties
    this.errorId = uuidv4();
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.details = details;
    this.cause = cause;
    this.isOperational = true;

    // Set error metadata with defaults
    this.metadata = {
      timestamp: new Date(),
      requestId: null,
      userId: null,
      path: null,
      method: null,
      component: null,
      environment: process.env.NODE_ENV || 'development',
      ...metadata
    };

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error instance to a standardized response object for API clients
   * 
   * @returns Standardized error response object
   */
  public toResponseObject(): ErrorResponse {
    return {
      errorId: this.errorId,
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.metadata.timestamp.toISOString()
    };
  }

  /**
   * Returns the error metadata for logging and debugging
   * 
   * @returns Error metadata object
   */
  public getMetadata(): ErrorMetadata {
    return this.metadata;
  }

  /**
   * Updates the error metadata with additional information
   * 
   * @param metadata Additional metadata to merge
   * @returns The current ApiError instance for chaining
   */
  public setMetadata(metadata: Partial<ErrorMetadata>): ApiError {
    this.metadata = {
      ...this.metadata,
      ...metadata
    };
    return this;
  }

  /**
   * Adds a detail to the error details array
   * 
   * @param detail Error detail to add
   * @returns The current ApiError instance for chaining
   */
  public addDetail(detail: ErrorDetail): ApiError {
    if (!this.details) {
      this.details = [];
    }
    this.details.push(detail);
    return this;
  }

  /**
   * Sets the cause of this error
   * 
   * @param cause Error that caused this error
   * @returns The current ApiError instance for chaining
   */
  public setCause(cause: Error): ApiError {
    this.cause = cause;
    return this;
  }
}