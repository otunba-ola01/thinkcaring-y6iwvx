import { ApiError } from './api-error';
import { ErrorCode, ErrorCategory, ErrorSeverity, ErrorDetail } from '../types/error.types';

/**
 * Specialized error class for resource not found errors with additional context
 * about the resource type and identifier. This class is used for cases where
 * requested resources (clients, claims, services, etc.) cannot be found in the system.
 */
export class NotFoundError extends ApiError {
  /**
   * The type of resource that was not found (e.g., 'client', 'claim', 'service')
   */
  public readonly resourceType: string;

  /**
   * The identifier of the resource that was not found
   */
  public readonly resourceId: string | number;

  /**
   * Creates a new NotFoundError instance with the provided message, resource type, and resource identifier
   * 
   * @param message Error message describing the not found scenario
   * @param resourceType The type of resource that was not found (e.g., 'client', 'claim', 'service')
   * @param resourceId The identifier of the resource that was not found
   * @param cause Optional original error that caused this error
   */
  constructor(message: string, resourceType: string, resourceId: string | number, cause: Error | null = null) {
    // Call the parent constructor with message
    super(message);
    
    // Override error properties with not-found specific values
    this.code = ErrorCode.RESOURCE_NOT_FOUND;
    this.category = ErrorCategory.BUSINESS;
    this.severity = ErrorSeverity.MEDIUM;
    this.status = 404; // HTTP 404 Not Found
    
    // Store resource information
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    
    // Set error cause if provided
    if (cause) {
      this.cause = cause;
    }
    
    // Add detailed error information
    this.addDetail({
      message: `${resourceType} with ID ${resourceId} was not found`,
      code: 'RESOURCE_NOT_FOUND',
      path: null,
      context: {
        resourceType,
        resourceId
      }
    });
    
    // Ensure proper error name
    this.name = 'NotFoundError';
  }

  /**
   * Gets the type of resource that was not found
   * 
   * @returns The resource type (e.g., 'client', 'claim', 'service')
   */
  public getResourceType(): string {
    return this.resourceType;
  }

  /**
   * Gets the identifier of the resource that was not found
   * 
   * @returns The resource identifier
   */
  public getResourceId(): string | number {
    return this.resourceId;
  }
}