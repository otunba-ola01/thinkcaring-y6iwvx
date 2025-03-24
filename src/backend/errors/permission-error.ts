import { ApiError } from './api-error';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity 
} from '../types/error.types';

/**
 * Specialized error class for permission and authorization-related errors
 * that extends the base ApiError class.
 */
export class PermissionError extends ApiError {
  /**
   * Creates a new PermissionError instance with the provided options
   * 
   * @param options Error options object or error message string
   */
  constructor(options: ErrorOptions | string) {
    super(options);
    this.name = 'PermissionError';
  }

  /**
   * Creates a forbidden error when a user is authenticated but not allowed to access a resource
   * 
   * @param message Error message
   * @param metadata Additional metadata about the error
   * @returns A new PermissionError instance for forbidden access
   */
  public static forbidden(
    message: string,
    metadata: Record<string, any> = {}
  ): PermissionError {
    return new PermissionError({
      message,
      code: ErrorCode.FORBIDDEN,
      status: 403,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      metadata
    });
  }

  /**
   * Creates an insufficient permissions error when a user lacks specific permissions required for an action
   * 
   * @param message Error message
   * @param requiredPermissions Array of permissions that were required
   * @param metadata Additional metadata about the error
   * @returns A new PermissionError instance for insufficient permissions
   */
  public static insufficientPermissions(
    message: string,
    requiredPermissions: string[],
    metadata: Record<string, any> = {}
  ): PermissionError {
    return new PermissionError({
      message,
      code: ErrorCode.INSUFFICIENT_PERMISSIONS,
      status: 403,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      details: [{
        message: `Required permissions: ${requiredPermissions.join(', ')}`,
        code: 'REQUIRED_PERMISSIONS',
        context: { requiredPermissions }
      }],
      metadata
    });
  }

  /**
   * Creates a role required error when a user lacks the required role for an action
   * 
   * @param message Error message
   * @param requiredRoles Array of roles that were required
   * @param metadata Additional metadata about the error
   * @returns A new PermissionError instance for role requirement
   */
  public static roleRequired(
    message: string,
    requiredRoles: string[],
    metadata: Record<string, any> = {}
  ): PermissionError {
    return new PermissionError({
      message,
      code: ErrorCode.ROLE_REQUIRED,
      status: 403,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      details: [{
        message: `Required roles: ${requiredRoles.join(', ')}`,
        code: 'REQUIRED_ROLES',
        context: { requiredRoles }
      }],
      metadata
    });
  }

  /**
   * Creates a resource access denied error when a user attempts to access a specific resource they don't have permission for
   * 
   * @param message Error message
   * @param resourceType Type of resource being accessed
   * @param resourceId Identifier of the resource being accessed
   * @param metadata Additional metadata about the error
   * @returns A new PermissionError instance for resource access denial
   */
  public static resourceAccessDenied(
    message: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any> = {}
  ): PermissionError {
    return new PermissionError({
      message,
      code: ErrorCode.FORBIDDEN,
      status: 403,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.HIGH, // Higher severity as it might indicate a security issue
      details: [{
        message: `Access denied to ${resourceType} with ID ${resourceId}`,
        code: 'RESOURCE_ACCESS_DENIED',
        context: { resourceType, resourceId }
      }],
      metadata
    });
  }
}