import { ApiError } from './api-error';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity,
  BusinessErrorDetail 
} from '../types/error.types';

/**
 * Error class for business rule violations that extends the base ApiError class.
 * Used when business logic constraints are violated, such as invalid claim submissions,
 * authorization limits, or other domain-specific rules.
 */
export class BusinessError extends ApiError {
  /**
   * The specific business rule that was violated
   */
  public readonly rule: string;

  /**
   * Creates a new BusinessError instance with the provided message, context, rule, and cause
   * 
   * @param message Human-readable error message describing the business rule violation
   * @param context Additional contextual data related to the violation, or null if none
   * @param rule Identifier of the business rule that was violated
   * @param cause Original error that caused this error, if any
   */
  constructor(
    message: string,
    context: Record<string, any> | null = null,
    rule: string,
    cause: Error | null = null
  ) {
    // Call the parent ApiError constructor with appropriate options
    super({
      message,
      code: ErrorCode.BUSINESS_RULE_VIOLATION,
      status: 400, // Bad Request - typical for business rule violations
      category: ErrorCategory.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      cause
    });

    // Store the business rule that was violated
    this.rule = rule;
    
    // Set the name property for better error identification
    this.name = 'BusinessError';

    // Add a detail with the rule, message, and context if provided
    this.addDetail({
      code: ErrorCode.BUSINESS_RULE_VIOLATION,
      message: message,
      path: rule,
      context: context
    });
  }

  /**
   * Returns the business rule that was violated
   * 
   * @returns The business rule identifier
   */
  public getRule(): string {
    return this.rule;
  }

  /**
   * Adds additional context data to the error
   * 
   * @param contextData Additional context data to add to the error
   * @returns The current BusinessError instance for chaining
   */
  public addContextData(contextData: Record<string, any>): BusinessError {
    // If there are existing details, merge the new context with the existing context
    const existingContext = this.details && this.details[0]?.context || {};
    
    // Add a new detail with the rule, original message, and merged context data
    this.addDetail({
      code: ErrorCode.BUSINESS_RULE_VIOLATION,
      message: this.message,
      path: this.rule,
      context: { ...existingContext, ...contextData }
    });
    
    return this;
  }
}