/**
 * Common TypeScript types, interfaces, and enums used throughout the HCBS Revenue Management System frontend.
 * This file serves as a central location for shared type definitions that are reused across
 * multiple components, ensuring type consistency and reducing duplication.
 */

/**
 * Type alias for UUID strings used for entity identifiers
 */
export type UUID = string;

/**
 * Type alias for ISO8601 date strings (YYYY-MM-DD)
 */
export type ISO8601Date = string;

/**
 * Type alias for ISO8601 datetime strings (YYYY-MM-DDThh:mm:ss.sssZ)
 */
export type ISO8601DateTime = string;

/**
 * Type alias for monetary values (number)
 */
export type Money = number;

/**
 * Type alias for percentage values (number)
 */
export type Percentage = number;

/**
 * Interface for date range selection used in filters and reports
 */
export interface DateRange {
  startDate: ISO8601Date | null;
  endDate: ISO8601Date | null;
}

/**
 * Interface for pagination parameters used in API requests
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Generic interface for paginated API responses
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Enum for sort directions used in sorting data
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Interface for sort parameters used in API requests
 */
export interface SortParams {
  field: string;
  direction: SortDirection;
}

/**
 * Enum for filter operators used in filtering data
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN_OR_EQUALS = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  BETWEEN = 'between',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull'
}

/**
 * Interface for filter parameters used in API requests
 */
export interface FilterParams {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Interface combining pagination, sorting, and filtering for API requests
 */
export interface QueryParams {
  pagination: PaginationParams;
  sort: SortParams[];
  filters: FilterParams[];
}

/**
 * Interface for standardized error responses from API
 */
export interface ResponseError {
  code: string | number;
  message: string;
  details: Record<string, any> | null;
}

/**
 * Enum for severity levels used in notifications and alerts
 */
export enum Severity {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Enum for component sizes used in UI components
 */
export enum Size {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

/**
 * Enum for theme modes used in UI theming
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

/**
 * Enum for common status values used across entities
 */
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted'
}

/**
 * Enum for claim status values used in claims management
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
  PARTIAL_PAID = 'partialPaid',
  VOIDED = 'voided'
}

/**
 * Enum for payment status values used in payment reconciliation
 */
export enum PaymentStatus {
  RECEIVED = 'received',
  MATCHED = 'matched',
  RECONCILED = 'reconciled',
  POSTED = 'posted',
  EXCEPTION = 'exception'
}

/**
 * Enum for service status values used in service tracking
 */
export enum ServiceStatus {
  DOCUMENTED = 'documented',
  VALIDATED = 'validated',
  BILLABLE = 'billable',
  BILLED = 'billed',
  INCOMPLETE = 'incomplete'
}

/**
 * Enum for payment methods used in payment processing
 */
export enum PaymentMethod {
  EFT = 'eft',
  CHECK = 'check',
  CREDIT_CARD = 'creditCard',
  CASH = 'cash',
  OTHER = 'other'
}

/**
 * Enum for time units used in service duration and reporting
 */
export enum TimeUnit {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

/**
 * Interface for address information used across entities
 */
export interface Address {
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Interface for contact information used across entities
 */
export interface ContactInfo {
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  fax: string | null;
}

/**
 * Base interface for entity objects with common fields
 */
export interface EntityBase {
  id: UUID;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for select options used in dropdown components
 */
export interface SelectOption {
  value: string | number | boolean;
  label: string;
  disabled: boolean;
}

/**
 * Generic interface for key-value pairs used in various contexts
 */
export interface KeyValuePair {
  key: string;
  value: any;
}

/**
 * Interface for validation results used in form and data validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Interface for validation errors used in form and data validation
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Interface for validation warnings used in form and data validation
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}