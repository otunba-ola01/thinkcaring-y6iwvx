/**
 * Defines TypeScript interfaces, types, and enums for the billing functionality in the 
 * HCBS Revenue Management System. This file provides type definitions for billing workflows,
 * including service validation, service-to-claim conversion, electronic submission, and 
 * billing dashboard metrics.
 * 
 * @module billing.types
 */

import { 
  UUID, 
  ISO8601Date, 
  Money, 
  Units, 
  DateRange, 
  PaginationParams, 
  SortParams, 
  FilterParams,
  ValidationResult
} from './common.types';

import { 
  ClaimStatus, 
  SubmissionMethod,
  ClaimSummary
} from './claims.types';

import {
  ServiceSummary,
  BillingStatus,
  DocumentationStatus
} from './services.types';

/**
 * Enum defining the supported billing formats for claim submission
 */
export enum BillingFormat {
  X12_837P = 'x12_837p',   // Electronic X12 837P format
  CMS1500 = 'cms1500',     // CMS-1500 paper claim form format
  UB04 = 'ub04',           // UB-04 claim form format
  CUSTOM = 'custom'        // Custom payer-specific format
}

/**
 * Enum defining the types of billing rules that can be applied during validation
 */
export enum BillingRuleType {
  DOCUMENTATION = 'documentation',  // Rules related to service documentation
  AUTHORIZATION = 'authorization',  // Rules related to service authorization
  ELIGIBILITY = 'eligibility',      // Rules related to client eligibility
  CODING = 'coding',                // Rules related to service coding
  BILLING = 'billing',              // Rules related to billing requirements
  SUBMISSION = 'submission'         // Rules related to claim submission
}

/**
 * Enum defining the severity levels for billing rule validation results
 */
export enum BillingRuleSeverity {
  ERROR = 'error',      // Critical issues that prevent billing
  WARNING = 'warning',  // Potential issues that may cause problems
  INFO = 'info'         // Informational messages
}

/**
 * Interface for billing rules that define validation requirements for services
 */
export interface BillingRule {
  id: UUID;                          // Unique identifier for the rule
  name: string;                      // Display name of the rule
  description: string;               // Detailed description of what the rule checks
  ruleType: BillingRuleType;         // The type of billing rule
  severity: BillingRuleSeverity;     // The severity level when this rule is violated
  condition: string;                 // The condition expression to evaluate
  message: string;                   // The message to display when rule is violated
  serviceTypeId: UUID | null;        // Specific service type this rule applies to (null = all)
  programId: UUID | null;            // Specific program this rule applies to (null = all)
  payerId: UUID | null;              // Specific payer this rule applies to (null = all)
  isActive: boolean;                 // Whether the rule is currently active
}

/**
 * Interface for the result of documentation validation for a service
 */
export interface DocumentationValidationResult {
  isComplete: boolean;               // Whether documentation is complete
  missingItems: string[];            // List of missing documentation items
  serviceId: UUID;                   // ID of the service being validated
}

/**
 * Interface for the result of authorization validation for a service
 */
export interface AuthorizationValidationResult {
  isAuthorized: boolean;             // Whether service is properly authorized
  authorizationId: UUID | null;      // ID of the authorization if found
  serviceId: UUID;                   // ID of the service being validated
  errors: string[];                  // List of authorization errors
  authorizedUnits: Units | null;     // Total units authorized
  usedUnits: Units | null;           // Units already used
  remainingUnits: Units | null;      // Units remaining in authorization
  expirationDate: ISO8601Date | null; // When authorization expires
}

/**
 * Interface for validation errors found during service validation
 */
export interface ServiceValidationError {
  code: string;                      // Error code for this validation error
  message: string;                   // Human-readable error message
  field: string | null;              // Field that failed validation, if applicable
}

/**
 * Interface for validation warnings found during service validation
 */
export interface ServiceValidationWarning {
  code: string;                      // Warning code for this validation warning
  message: string;                   // Human-readable warning message
  field: string | null;              // Field that triggered warning, if applicable
}

/**
 * Interface for requesting validation of services for billing
 */
export interface BillingValidationRequest {
  serviceIds: UUID[];                // IDs of services to validate
}

/**
 * Interface for the comprehensive validation result for a service
 */
export interface BillingValidationResult {
  serviceId: UUID;                   // ID of the service that was validated
  isValid: boolean;                  // Whether the service is valid for billing
  errors: ServiceValidationError[];  // Validation errors found
  warnings: ServiceValidationWarning[]; // Validation warnings found
  documentation: DocumentationValidationResult; // Documentation validation results
  authorization: AuthorizationValidationResult; // Authorization validation results
}

/**
 * Interface for the response to a billing validation request
 */
export interface BillingValidationResponse {
  results: BillingValidationResult[]; // Validation results for each service
  isValid: boolean;                   // Whether all services are valid
  totalErrors: number;                // Total number of errors found
  totalWarnings: number;              // Total number of warnings found
}

/**
 * Interface for requesting conversion of services to a claim
 */
export interface ServiceToClaimRequest {
  serviceIds: UUID[];                // IDs of services to convert to a claim
  payerId: UUID;                     // ID of the payer for the claim
  notes: string | null;              // Optional notes for the claim
}

/**
 * Interface for the response to a service-to-claim conversion request
 */
export interface ServiceToClaimResponse {
  claim: ClaimSummary | null;        // The created claim, or null if creation failed
  validationResult: ValidationResult | null; // Validation results if validation failed
  success: boolean;                  // Whether the conversion was successful
  message: string;                   // Message describing the result
}

/**
 * Interface for requesting submission of a claim to a payer
 */
export interface BillingSubmissionRequest {
  claimId: UUID;                     // ID of the claim to submit
  submissionMethod: SubmissionMethod; // How the claim will be submitted
  submissionDate: ISO8601Date;       // When the claim is being submitted
  externalClaimId: string | null;    // External ID if assigned during submission
  notes: string | null;              // Optional notes about the submission
}

/**
 * Interface for the response to a claim submission request
 */
export interface BillingSubmissionResponse {
  success: boolean;                  // Whether the submission was successful
  message: string;                   // Message describing the result
  confirmationNumber: string | null; // Confirmation number if provided by payer
  submissionDate: ISO8601Date;       // When the claim was submitted
  claimId: UUID;                     // ID of the submitted claim
  validationResult: ValidationResult | null; // Validation results if submission failed
}

/**
 * Interface for requesting batch submission of multiple claims
 */
export interface BatchBillingSubmissionRequest {
  claimIds: UUID[];                  // IDs of claims to submit
  submissionMethod: SubmissionMethod; // How claims will be submitted
  submissionDate: ISO8601Date;       // When claims are being submitted
  notes: string | null;              // Optional notes about the batch submission
}

/**
 * Interface for the response to a batch claim submission request
 */
export interface BatchBillingSubmissionResponse {
  totalProcessed: number;            // Total number of claims processed
  successCount: number;              // Number of claims successfully submitted
  errorCount: number;                // Number of claims that failed submission
  errors: Array<{ claimId: UUID, message: string }>; // Details of submission errors
  processedClaims: UUID[];           // IDs of claims that were processed
  submissionDate: ISO8601Date;       // When claims were submitted
}

/**
 * Interface for the result of an electronic claim submission
 */
export interface ElectronicSubmissionResult {
  success: boolean;                  // Whether the electronic submission was successful
  confirmationNumber: string | null; // Confirmation number if provided by payer
  externalClaimId: string | null;    // External ID assigned by payer/clearinghouse
  submissionDate: ISO8601Date;       // When the claim was submitted
  errors: string[];                  // List of errors if submission failed
}

/**
 * Interface for filtering the billing queue of services ready for billing
 */
export interface BillingQueueFilter {
  clientId: UUID | null;             // Filter by client
  programId: UUID | null;            // Filter by program
  serviceTypeId: UUID | null;        // Filter by service type
  payerId: UUID | null;              // Filter by payer
  dateRange: DateRange | null;       // Filter by date range
  documentationStatus: DocumentationStatus | null; // Filter by documentation status
  billingStatus: BillingStatus | null; // Filter by billing status
  search: string | null;             // Search term for text search
}

/**
 * Interface for the response containing services in the billing queue
 */
export interface BillingQueueResponse {
  services: ServiceSummary[];        // List of services in the billing queue
  total: number;                     // Total number of matching services
  page: number;                      // Current page number
  limit: number;                     // Page size
  totalPages: number;                // Total number of pages
  totalAmount: Money;                // Total monetary amount of all matching services
}

/**
 * Interface for metrics displayed on the billing dashboard
 */
export interface BillingDashboardMetrics {
  unbilledServicesCount: number;     // Count of services not yet billed
  unbilledServicesAmount: Money;     // Total monetary amount of unbilled services
  incompleteDocumentationCount: number; // Count of services with incomplete documentation
  pendingClaimsCount: number;        // Count of claims pending adjudication
  pendingClaimsAmount: Money;        // Total monetary amount of pending claims
  upcomingFilingDeadlines: Array<{   // Services approaching filing deadlines
    serviceCount: number;            // Count of services in this deadline group
    daysRemaining: number;           // Days remaining until deadline
    amount: Money;                   // Total monetary amount of services in group
  }>;
  recentBillingActivity: Array<{     // Recent billing activity metrics
    date: ISO8601Date;               // Date of activity
    claimsSubmitted: number;         // Number of claims submitted on this date
    amount: Money;                   // Total monetary amount of claims submitted
  }>;
}