import { ApiError } from './api-error';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity 
} from '../types/error.types';

/**
 * Specialized error class for authentication-related errors that extends the base ApiError class
 */
export class AuthError extends ApiError {
  /**
   * Creates a new AuthError instance with the provided options
   * 
   * @param options Error options object or error message string
   */
  constructor(options: ErrorOptions | string) {
    super(options);
    this.name = 'AuthError';
  }

  /**
   * Creates an unauthorized error when a user attempts to access a resource without proper authentication
   * 
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns A new AuthError instance for unauthorized access
   */
  public static unauthorized(message: string, metadata: Record<string, any> = {}): AuthError {
    return new AuthError({
      message,
      code: ErrorCode.UNAUTHORIZED,
      status: 401,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      metadata
    });
  }

  /**
   * Creates an authentication failed error when login credentials are invalid
   * 
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns A new AuthError instance for authentication failure
   */
  public static authenticationFailed(message: string, metadata: Record<string, any> = {}): AuthError {
    return new AuthError({
      message,
      code: ErrorCode.AUTHENTICATION_FAILED,
      status: 401,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      metadata
    });
  }

  /**
   * Creates an invalid credentials error when username or password is incorrect
   * 
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns A new AuthError instance for invalid credentials
   */
  public static invalidCredentials(message: string, metadata: Record<string, any> = {}): AuthError {
    return new AuthError({
      message,
      code: ErrorCode.INVALID_CREDENTIALS,
      status: 401,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      metadata
    });
  }

  /**
   * Creates an account locked error when a user account is temporarily locked due to too many failed attempts
   * 
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns A new AuthError instance for account locked
   */
  public static accountLocked(message: string, metadata: Record<string, any> = {}): AuthError {
    return new AuthError({
      message,
      code: ErrorCode.ACCOUNT_LOCKED,
      status: 403,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      metadata
    });
  }

  /**
   * Creates an MFA required error when multi-factor authentication is needed to complete login
   * 
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns A new AuthError instance for MFA required
   */
  public static mfaRequired(message: string, metadata: Record<string, any> = {}): AuthError {
    return new AuthError({
      message,
      code: ErrorCode.MFA_REQUIRED,
      status: 401,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      metadata
    });
  }

  /**
   * Creates an MFA failed error when the provided MFA code is invalid or expired
   * 
   * @param message Error message
   * @param metadata Additional error metadata
   * @returns A new AuthError instance for MFA failure
   */
  public static mfaFailed(message: string, metadata: Record<string, any> = {}): AuthError {
    return new AuthError({
      message,
      code: ErrorCode.MFA_FAILED,
      status: 401,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      metadata
    });
  }
}