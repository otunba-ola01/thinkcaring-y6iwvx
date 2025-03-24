import { ApiError } from './api-error';
import { ErrorCode, ErrorCategory, ErrorSeverity, IntegrationErrorDetail } from '../types/error.types';

/**
 * Specialized error class for handling integration-related errors with external systems.
 * Extends the base ApiError class to provide additional context and details specific to
 * external service integrations, supporting the circuit breaker pattern and comprehensive
 * error logging.
 */
export class IntegrationError extends ApiError {
  /**
   * The name of the external service
   */
  public readonly service: string;

  /**
   * The specific endpoint or operation
   */
  public readonly endpoint: string;

  /**
   * The HTTP status code (if applicable)
   */
  public readonly statusCode: number | null;

  /**
   * The external request ID for tracing
   */
  public readonly requestId: string | null;

  /**
   * The response body from the external service (if available)
   */
  public readonly responseBody: Record<string, any> | null;

  /**
   * Flag indicating if the error can be retried
   */
  public readonly retryable: boolean;

  /**
   * Creates a new IntegrationError instance with integration-specific details
   * 
   * @param options Error options as a string message or object with integration details
   */
  constructor(options: string | {
    message: string;
    service: string;
    endpoint: string;
    statusCode?: number;
    requestId?: string;
    responseBody?: Record<string, any>;
    retryable?: boolean;
  }) {
    let message: string;
    let service: string;
    let endpoint: string;
    let statusCode: number | null = null;
    let requestId: string | null = null;
    let responseBody: Record<string, any> | null = null;
    let retryable: boolean | undefined = undefined;

    // Handle string or object options
    if (typeof options === 'string') {
      message = options;
      service = 'unknown';
      endpoint = 'unknown';
    } else {
      message = options.message;
      service = options.service;
      endpoint = options.endpoint;
      statusCode = options.statusCode || null;
      requestId = options.requestId || null;
      responseBody = options.responseBody || null;
      retryable = options.retryable;
    }

    // Call parent constructor with appropriate error options
    super({
      message,
      code: ErrorCode.INTEGRATION_ERROR,
      status: statusCode || 500,
      category: ErrorCategory.INTEGRATION,
      severity: statusCode && statusCode >= 500 
        ? ErrorSeverity.HIGH 
        : statusCode && statusCode >= 400 
          ? ErrorSeverity.MEDIUM 
          : ErrorSeverity.LOW
    });

    // Set integration-specific properties
    this.service = service;
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.responseBody = responseBody;

    // Determine if error is retryable (if not specified explicitly)
    // 5xx errors are typically retryable, while 4xx errors are not
    this.retryable = retryable !== undefined 
      ? retryable 
      : statusCode ? statusCode >= 500 && statusCode < 600 : false;

    // Add integration error detail
    this.addDetail({
      message: `Integration error with ${service} at endpoint ${endpoint}${statusCode ? ` (status: ${statusCode})` : ''}`,
      code: 'INTEGRATION_ERROR',
      context: {
        service,
        endpoint,
        statusCode,
        requestId,
        responseBody
      }
    });

    // Set the name for better error identification
    this.name = 'IntegrationError';
  }

  /**
   * Determines if the integration error is retryable based on its characteristics
   * 
   * @returns Whether the error can be retried
   */
  public isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Returns the integration-specific details for logging and debugging
   * 
   * @returns Integration error details
   */
  public getIntegrationDetails(): IntegrationErrorDetail {
    return {
      service: this.service,
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      requestId: this.requestId,
      message: this.message,
      responseBody: this.responseBody
    };
  }

  /**
   * Converts the error to a JSON representation for logging
   * 
   * @returns JSON representation of the error
   */
  public toJSON(): Record<string, any> {
    // Create a base object with properties from ApiError
    const baseJson = {
      name: this.name,
      message: this.message,
      stack: this.stack,
      errorId: this.errorId,
      status: this.status,
      code: this.code,
      category: this.category,
      severity: this.severity,
      details: this.details,
      metadata: this.metadata
    };

    // Add integration-specific properties
    return {
      ...baseJson,
      service: this.service,
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      requestId: this.requestId,
      retryable: this.retryable,
      responseBody: this.responseBody
    };
  }
}