/**
 * Defines TypeScript interfaces, types, and enums for the claims management functionality
 * in the HCBS Revenue Management System. This file provides type definitions for
 * claim data structures, request/response objects, and specialized types used throughout
 * the claims lifecycle from creation to payment reconciliation.
 * 
 * @module claims.types
 */

import {
  UUID,
  ISO8601Date,
  Money,
  Units,
  AuditableEntity,
  StatusType,
  DateRange,
  PaginationParams,
  SortParams,
  FilterParams,
  QueryParams
} from './common.types';

import {
  ErrorCode,
  ValidationErrorDetail
} from './error.types';

import {
  ServiceSummary
} from './services.types';

import {
  ClientSummary
} from './clients.types';

/**
 * Enum defining the types of payers in the system
 * Used for categorizing and filtering claims by payer source
 */
export enum PayerType {
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE_INSURANCE = 'private_insurance',
  MANAGED_CARE = 'managed_care',
  SELF_PAY = 'self_pay',
  GRANT = 'grant',
  OTHER = 'other'
}

/**
 * Simplified interface for payer summary information used in claim references
 */
export interface PayerSummary {
  id: UUID;
  name: string;
  payerType: PayerType;
  isElectronic: boolean;
  status: StatusType;
}

/**
 * Enum defining the possible states in the claim lifecycle
 * Represents the progression of a claim from creation through adjudication
 */
export enum ClaimStatus {
  DRAFT = 'draft',                // Initial creation state
  VALIDATED = 'validated',        // Passed validation checks
  SUBMITTED = 'submitted',        // Sent to payer
  ACKNOWLEDGED = 'acknowledged',  // Payer acknowledged receipt
  PENDING = 'pending',            // Awaiting adjudication
  PAID = 'paid',                  // Fully paid
  PARTIAL_PAID = 'partial_paid',  // Partially paid
  DENIED = 'denied',              // Denied by payer
  APPEALED = 'appealed',          // Denial appealed
  VOID = 'void',                  // Voided/cancelled
  FINAL_DENIED = 'final_denied'   // Final denial after appeal
}

/**
 * Enum defining the types of claims that can be submitted
 */
export enum ClaimType {
  ORIGINAL = 'original',         // Initial claim submission
  ADJUSTMENT = 'adjustment',     // Adjustment to a previous claim
  REPLACEMENT = 'replacement',   // Replaces a previous claim
  VOID = 'void'                  // Voids a previous claim
}

/**
 * Enum defining the methods by which claims can be submitted to payers
 */
export enum SubmissionMethod {
  ELECTRONIC = 'electronic',     // Electronic submission via system
  PAPER = 'paper',               // Paper claim form
  PORTAL = 'portal',             // Payer web portal entry
  CLEARINGHOUSE = 'clearinghouse', // Via clearinghouse
  DIRECT = 'direct'              // Direct to payer electronically
}

/**
 * Enum defining common reasons for claim denials
 */
export enum DenialReason {
  DUPLICATE_CLAIM = 'duplicate_claim',
  SERVICE_NOT_COVERED = 'service_not_covered',
  AUTHORIZATION_MISSING = 'authorization_missing',
  AUTHORIZATION_INVALID = 'authorization_invalid',
  CLIENT_INELIGIBLE = 'client_ineligible',
  PROVIDER_INELIGIBLE = 'provider_ineligible',
  TIMELY_FILING = 'timely_filing',
  INVALID_CODING = 'invalid_coding',
  MISSING_INFORMATION = 'missing_information',
  OTHER = 'other'
}

/**
 * Main interface for the Claim entity with all properties
 * Represents a billable claim submitted to a payer
 */
export interface Claim {
  id: UUID;
  claimNumber: string;                 // Internal claim tracking number
  externalClaimId: string | null;      // Payer/clearinghouse assigned ID
  clientId: UUID;                      // Reference to the client
  payerId: UUID;                       // Reference to the payer
  claimType: ClaimType;                // Type of claim
  claimStatus: ClaimStatus;            // Current status in lifecycle
  totalAmount: Money;                  // Total monetary amount of the claim
  serviceStartDate: ISO8601Date;       // Start date of service period
  serviceEndDate: ISO8601Date;         // End date of service period
  submissionDate: ISO8601Date | null;  // When claim was submitted
  submissionMethod: SubmissionMethod | null; // How claim was submitted
  adjudicationDate: ISO8601Date | null; // When claim was adjudicated
  denialReason: DenialReason | null;   // Reason for denial if applicable
  denialDetails: string | null;        // Additional details about denial
  adjustmentCodes: Record<string, string> | null; // Adjustment codes from payer
  originalClaimId: UUID | null;        // Reference to original claim if adjustment
  notes: string | null;                // Additional notes about claim
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
  createdBy: UUID | null;              // User who created the record
  updatedBy: UUID | null;              // User who last updated the record
}

/**
 * Extended interface for Claim entity that includes related entities
 * Used when retrieving detailed claim information with associated data
 */
export interface ClaimWithRelations {
  id: UUID;
  claimNumber: string;
  externalClaimId: string | null;
  clientId: UUID;
  client: ClientSummary;               // Client information
  payerId: UUID;
  payer: PayerSummary;                 // Payer information
  claimType: ClaimType;
  claimStatus: ClaimStatus;
  totalAmount: Money;
  serviceStartDate: ISO8601Date;
  serviceEndDate: ISO8601Date;
  submissionDate: ISO8601Date | null;
  submissionMethod: SubmissionMethod | null;
  adjudicationDate: ISO8601Date | null;
  denialReason: DenialReason | null;
  denialDetails: string | null;
  adjustmentCodes: Record<string, string> | null;
  originalClaimId: UUID | null;
  originalClaim: ClaimSummary | null;  // Original claim if this is an adjustment
  services: ServiceSummary[];          // Services included in this claim
  statusHistory: ClaimStatusHistory[]; // History of status changes
  notes: string | null;
  createdAt: ISO8601Date;
  updatedAt: ISO8601Date;
  createdBy: UUID | null;
  updatedBy: UUID | null;
}

/**
 * Simplified interface for claim summary information used in lists and dashboards
 */
export interface ClaimSummary {
  id: UUID;
  claimNumber: string;
  clientId: UUID;
  clientName: string;                  // Formatted client name
  payerId: UUID;
  payerName: string;                   // Payer name
  claimStatus: ClaimStatus;
  totalAmount: Money;
  serviceStartDate: ISO8601Date;
  serviceEndDate: ISO8601Date;
  submissionDate: ISO8601Date | null;
  claimAge: number;                    // Age in days since creation or submission
}

/**
 * Interface for tracking claim status changes over time
 * Provides an audit trail of status transitions
 */
export interface ClaimStatusHistory {
  id: UUID;
  claimId: UUID;
  status: ClaimStatus;
  timestamp: ISO8601Date;
  notes: string | null;
  userId: UUID | null;                 // User who made the status change
}

/**
 * Interface for the association between claims and services
 * Represents service line items within a claim
 */
export interface ClaimService {
  id: UUID;
  claimId: UUID;
  serviceId: UUID;
  serviceLineNumber: number;           // Line number on the claim
  billedUnits: Units;                  // Units billed on this claim
  billedAmount: Money;                 // Amount billed on this claim
  service: ServiceSummary;             // Service information
}

/**
 * Interface for query parameters when retrieving claims
 * Extends standard query parameters with claim-specific filters
 */
export interface ClaimQueryParams {
  pagination: PaginationParams;
  sort: SortParams;
  filter: FilterParams;
  search: string;                      // Search term for claim number, client name, etc.
  clientId: UUID;                      // Filter by client
  payerId: UUID;                       // Filter by payer
  claimStatus: ClaimStatus | ClaimStatus[]; // Filter by status
  dateRange: DateRange;                // Filter by service or submission date range
  claimType: ClaimType;                // Filter by claim type
  includeServices: boolean;            // Whether to include services in response
  includeStatusHistory: boolean;       // Whether to include status history in response
}

/**
 * Data transfer object for creating a new claim
 */
export interface CreateClaimDto {
  clientId: UUID;                      // Client for whom the claim is being created
  payerId: UUID;                       // Payer to whom the claim will be submitted
  claimType: ClaimType;                // Type of claim being created
  serviceIds: UUID[];                  // Services to include in this claim
  originalClaimId: UUID | null;        // Original claim ID if this is an adjustment
  notes: string | null;                // Additional notes about the claim
}

/**
 * Data transfer object for updating an existing claim
 */
export interface UpdateClaimDto {
  payerId: UUID;                       // Can change the payer if not yet submitted
  serviceIds: UUID[];                  // Can add/remove services if not yet submitted
  notes: string | null;                // Can update notes
}

/**
 * Data transfer object for updating a claim's status
 */
export interface UpdateClaimStatusDto {
  status: ClaimStatus;                 // New status
  adjudicationDate: ISO8601Date | null; // Date of adjudication if applicable
  denialReason: DenialReason | null;   // Reason if denied
  denialDetails: string | null;        // Additional details if denied
  adjustmentCodes: Record<string, string> | null; // Adjustment codes if any
  notes: string | null;                // Notes about the status change
}

/**
 * Data transfer object for submitting a claim to a payer
 */
export interface SubmitClaimDto {
  submissionMethod: SubmissionMethod;  // How the claim is being submitted
  submissionDate: ISO8601Date;         // When the claim is being submitted
  externalClaimId: string | null;      // External ID if assigned during submission
  notes: string | null;                // Notes about the submission
}

/**
 * Data transfer object for submitting multiple claims in a batch
 */
export interface BatchSubmitClaimsDto {
  claimIds: UUID[];                    // Claims to submit
  submissionMethod: SubmissionMethod;  // How claims are being submitted
  submissionDate: ISO8601Date;         // When claims are being submitted
  notes: string | null;                // Notes about the batch submission
}

/**
 * Interface for validation errors found during claim validation
 */
export interface ClaimValidationError {
  code: ErrorCode;                     // Error code for this validation error
  message: string;                     // Human-readable error message
  field: string | null;                // Field that failed validation, if applicable
  context: Record<string, any> | null; // Additional context for the error
}

/**
 * Interface for validation warnings found during claim validation
 * Warnings don't prevent submission but alert users to potential issues
 */
export interface ClaimValidationWarning {
  code: string;                        // Warning code
  message: string;                     // Human-readable warning message
  field: string | null;                // Field that triggered warning, if applicable
  context: Record<string, any> | null; // Additional context for the warning
}

/**
 * Interface for the result of claim validation
 */
export interface ClaimValidationResult {
  claimId: UUID;                       // ID of the validated claim
  isValid: boolean;                    // Whether the claim is valid for submission
  errors: ClaimValidationError[];      // Validation errors found
  warnings: ClaimValidationWarning[];  // Validation warnings found
}

/**
 * Interface for claim metrics used in dashboards and reporting
 */
export interface ClaimMetrics {
  totalClaims: number;                 // Total number of claims
  totalAmount: Money;                  // Total amount of all claims
  statusBreakdown: Array<{            // Breakdown of claims by status
    status: ClaimStatus;
    count: number;
    amount: Money;
  }>;
  agingBreakdown: Array<{             // Breakdown of claims by age
    range: string;                     // Age range (e.g., "0-30 days")
    count: number;
    amount: Money;
  }>;
  denialRate: number;                  // Percentage of claims denied
  averageProcessingTime: number;       // Average days from submission to payment
  claimsByPayer: Array<{              // Breakdown of claims by payer
    payerId: UUID;
    payerName: string;
    count: number;
    amount: Money;
  }>;
}

/**
 * Response object for single claim operations
 */
export interface ClaimResponse {
  claim: ClaimWithRelations;           // The claim with related entities
}

/**
 * Response object for paginated claim list operations
 */
export interface ClaimsResponse {
  claims: ClaimWithRelations[];        // List of claims with related entities
  total: number;                       // Total number of matching claims
  page: number;                        // Current page number
  limit: number;                       // Page size
  totalPages: number;                  // Total number of pages
}

/**
 * Response object for paginated claim summary list operations
 */
export interface ClaimSummariesResponse {
  claims: ClaimSummary[];              // List of claim summaries
  total: number;                       // Total number of matching claims
  page: number;                        // Current page number
  limit: number;                       // Page size
  totalPages: number;                  // Total number of pages
}

/**
 * Response object for claim validation operations
 */
export interface ClaimValidationResponse {
  validationResult: ClaimValidationResult; // Result of validation
}

/**
 * Response object for batch claim validation operations
 */
export interface BatchClaimValidationResponse {
  results: ClaimValidationResult[];    // Validation results for each claim
  isValid: boolean;                    // Whether all claims are valid
  totalErrors: number;                 // Total number of errors across all claims
  totalWarnings: number;               // Total number of warnings across all claims
}

/**
 * Response object for batch claim submission operations
 */
export interface BatchSubmitClaimsResponse {
  totalProcessed: number;              // Total number of claims processed
  successCount: number;                // Number of claims successfully submitted
  errorCount: number;                  // Number of claims that failed submission
  errors: Array<{                      // Details of submission errors
    claimId: UUID;
    message: string;
  }>;
  processedClaims: UUID[];             // IDs of claims that were processed
}

/**
 * Response object for claim status history operations
 */
export interface ClaimStatusHistoryResponse {
  statusHistory: ClaimStatusHistory[]; // List of status history records
}

/**
 * Response object for claim metrics operations
 */
export interface ClaimMetricsResponse {
  metrics: ClaimMetrics;               // Claim metrics for dashboards
}