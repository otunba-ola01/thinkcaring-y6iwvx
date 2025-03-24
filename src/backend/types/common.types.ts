/**
 * Common TypeScript types and interfaces used throughout the HCBS Revenue Management System backend.
 * This file serves as a central repository for shared type definitions, ensuring
 * consistency and type safety across the application.
 * 
 * @module common.types
 */

// Basic type aliases for common data types

/**
 * Type alias for UUID strings used for entity identifiers throughout the application
 */
export type UUID = string;

/**
 * Type alias for ISO8601 formatted date strings (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export type ISO8601Date = string;

/**
 * Type alias for database timestamp values
 */
export type Timestamp = Date;

/**
 * Type alias for monetary values to ensure consistent handling of currency amounts
 * Always stored as a number representing the amount in the smallest currency unit (e.g., cents)
 */
export type Money = number;

/**
 * Type alias for service units in claims and authorizations
 * Typically represents hours, visits, or other quantifiable service measures
 */
export type Units = number;

/**
 * Type alias for percentage values used in calculations and reporting
 * Stored as a decimal (0.15 for 15%) for calculation accuracy
 */
export type Percentage = number;

// Interfaces for common data structures

/**
 * Interface for date range selections used in reporting and filtering
 */
export interface DateRange {
  startDate: ISO8601Date;
  endDate: ISO8601Date;
}

/**
 * Interface for pagination parameters in list requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Interface for pagination metadata in list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Enum for sort directions in list requests
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for sorting parameters in list requests
 */
export interface SortParams {
  sortBy: string;
  sortDirection: SortDirection;
}

/**
 * Enum for filter operators in query parameters
 */
export enum FilterOperator {
  EQ = 'eq',      // Equal
  NEQ = 'neq',    // Not equal
  GT = 'gt',      // Greater than
  GTE = 'gte',    // Greater than or equal
  LT = 'lt',      // Less than
  LTE = 'lte',    // Less than or equal
  IN = 'in',      // In a list of values
  LIKE = 'like',  // String contains
  BETWEEN = 'between' // Between two values
}

/**
 * Interface for filter conditions in query parameters
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Interface for filter parameters in list requests
 */
export interface FilterParams {
  conditions: FilterCondition[];
  logicalOperator: 'AND' | 'OR';
}

/**
 * Comprehensive interface for query parameters in list requests
 */
export interface QueryParams {
  pagination: PaginationParams;
  sort: SortParams;
  filter: FilterParams;
  search?: string;
}

// Enums for various status types and constants

/**
 * Enum for common status types used across entities
 */
export enum StatusType {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted'
}

/**
 * Enum for claim status values in the claims lifecycle
 */
export enum ClaimStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  PENDING = 'pending',
  PAID = 'paid',
  DENIED = 'denied',
  APPEALED = 'appealed',
  VOID = 'void'
}

/**
 * Enum for payment status values in the payment reconciliation process
 */
export enum PaymentStatus {
  RECEIVED = 'received',
  MATCHED = 'matched',
  RECONCILED = 'reconciled',
  POSTED = 'posted',
  EXCEPTION = 'exception'
}

/**
 * Enum for service status values in the service to billing workflow
 */
export enum ServiceStatus {
  DOCUMENTED = 'documented',
  VALIDATED = 'validated',
  BILLABLE = 'billable',
  BILLED = 'billed',
  REJECTED = 'rejected'
}

/**
 * Enum for authorization status values in the authorization management workflow
 */
export enum AuthorizationStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  DENIED = 'denied',
  CANCELLED = 'cancelled'
}

/**
 * Enum for payment methods used in payment processing
 */
export enum PaymentMethod {
  EFT = 'eft',
  CHECK = 'check',
  CREDIT_CARD = 'credit_card',
  CASH = 'cash',
  OTHER = 'other'
}

/**
 * Enum for report export formats
 */
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

// Common entity interfaces

/**
 * Interface for entity audit fields to track creation and modification
 */
export interface AuditableEntity {
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
}

/**
 * Interface for address information used across multiple entities
 */
export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Interface for contact information used across multiple entities
 */
export interface ContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
  fax?: string;
}

/**
 * Enum for identifier types used across multiple entities
 */
export enum IdentifierType {
  MEDICAID_ID = 'medicaid_id',
  MEDICARE_ID = 'medicare_id',
  SSN = 'ssn',
  TAX_ID = 'tax_id',
  NPI = 'npi',
  OTHER = 'other'
}

/**
 * Interface for identifiers used across multiple entities
 */
export interface Identifier {
  type: IdentifierType;
  value: string;
  issuedBy?: string;
  issuedDate?: ISO8601Date;
  expirationDate?: ISO8601Date;
}

/**
 * Interface for file metadata used for document storage
 */
export interface FileMetadata {
  id: UUID;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Timestamp;
  uploadedBy: UUID;
  storageLocation: string;
}

/**
 * Interface for validation results used across the application
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
  warnings: Array<{ field: string; message: string; code: string }>;
}

// Time and reporting related enums

/**
 * Enum for time intervals used in reporting and scheduling
 */
export enum TimeInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

/**
 * Enum for common date range presets used in filtering and reporting
 */
export enum DateRangePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  LAST_30_DAYS = 'last_30_days',
  LAST_60_DAYS = 'last_60_days',
  LAST_90_DAYS = 'last_90_days',
  CUSTOM = 'custom'
}

/**
 * Enum for aging buckets used in accounts receivable reporting
 */
export enum AgingBucket {
  CURRENT = 'current',
  DAYS_1_30 = '1-30',
  DAYS_31_60 = '31-60',
  DAYS_61_90 = '61-90',
  DAYS_91_PLUS = '91+'
}

// Notification related enums

/**
 * Enum for notification types used in the notification system
 */
export enum NotificationType {
  ALERT = 'alert',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Enum for notification delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms'
}