import { ApiError } from './api-error';
import { 
  ErrorCode, 
  ErrorCategory, 
  ErrorSeverity,
  DatabaseErrorDetail 
} from '../types/error.types';

/**
 * Specialized error class for database-related errors with additional context
 * about the operation and entity involved in the error.
 */
export class DatabaseError extends ApiError {
  /**
   * The database operation that caused the error (e.g., 'insert', 'update', 'delete', 'query')
   */
  public readonly operation: string;
  
  /**
   * The database entity (table/collection) that was being operated on
   */
  public readonly entity: string;
  
  /**
   * The database-specific error code, if available
   */
  public readonly dbErrorCode: string | null;
  
  /**
   * The constraint that was violated, if applicable
   */
  public readonly constraint: string | null;
  
  /**
   * Creates a new DatabaseError instance with the provided message and details
   * 
   * @param message Error message
   * @param details Details about the database operation and entity
   * @param cause Original error that caused this error, if available
   */
  constructor(message: string, details: Partial<DatabaseErrorDetail> = {}, cause: Error | null = null) {
    // Determine if this is a duplicate entry error
    const isDuplicateEntry = 
      details.constraint?.includes('unique') || 
      details.message?.toLowerCase().includes('duplicate') ||
      details.code?.toLowerCase().includes('duplicate');
    
    // Call parent constructor with appropriate error code
    super({
      message,
      code: isDuplicateEntry ? ErrorCode.DUPLICATE_ENTRY : ErrorCode.DATABASE_ERROR,
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      status: isDuplicateEntry ? 409 : 500,
      cause
    });
    
    // Set class properties
    this.operation = details.operation || 'unknown';
    this.entity = details.entity || 'unknown';
    this.dbErrorCode = details.code || null;
    this.constraint = details.constraint || null;
    
    // Override the name for better identification
    this.name = 'DatabaseError';
    
    // Add detailed error information
    this.addDetail({
      message: `Database error in ${this.operation} operation on ${this.entity}`,
      code: this.code,
      context: {
        operation: this.operation,
        entity: this.entity,
        dbErrorCode: this.dbErrorCode,
        constraint: this.constraint
      }
    });
  }
  
  /**
   * Determines if the error is related to a duplicate key constraint violation
   * 
   * @returns True if the error is a duplicate key error, false otherwise
   */
  public isDuplicateKeyError(): boolean {
    return this.code === ErrorCode.DUPLICATE_ENTRY;
  }
  
  /**
   * Gets the database operation that caused the error
   * 
   * @returns The database operation (e.g., 'insert', 'update', 'delete', 'query')
   */
  public getOperation(): string {
    return this.operation;
  }
  
  /**
   * Gets the database entity (table/collection) that was being operated on
   * 
   * @returns The database entity name
   */
  public getEntity(): string {
    return this.entity;
  }
  
  /**
   * Gets the constraint that was violated, if applicable
   * 
   * @returns The constraint name or null if not applicable
   */
  public getConstraint(): string | null {
    return this.constraint;
  }
}