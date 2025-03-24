/**
 * Defines TypeScript interfaces, types, and enums for the payment processing functionality
 * in the HCBS Revenue Management System. This file provides type definitions for
 * payment data structures, request/response objects, and specialized types used throughout
 * the payment lifecycle from receipt to reconciliation.
 * 
 * @module payments.types
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
  QueryParams,
  PaymentMethod
} from './common.types';

import {
  ClaimSummary,
  ClaimStatus
} from './claims.types';

import {
  PayerSummary
} from './claims.types';

/**
 * Enum defining the possible reconciliation states of a payment
 */
export enum ReconciliationStatus {
  UNRECONCILED = 'unreconciled',         // Payment received but not yet matched to claims
  PARTIALLY_RECONCILED = 'partial',      // Payment partially matched to claims
  RECONCILED = 'reconciled',             // Payment fully matched to claims
  EXCEPTION = 'exception'                // Payment has issues that require manual review
}

/**
 * Enum defining the types of payment adjustments
 */
export enum AdjustmentType {
  CONTRACTUAL = 'contractual',          // Contractual adjustment (negotiated rate)
  DEDUCTIBLE = 'deductible',            // Patient deductible
  COINSURANCE = 'coinsurance',          // Patient coinsurance
  COPAY = 'copay',                      // Patient copay
  NONCOVERED = 'noncovered',            // Service not covered
  TRANSFER = 'transfer',                // Transfer to other responsible party
  OTHER = 'other'                       // Other adjustment type
}

/**
 * Enum defining the supported file types for remittance advice imports
 */
export enum RemittanceFileType {
  EDI_835 = 'edi_835',                  // Standard EDI 835 remittance file
  CSV = 'csv',                          // CSV format
  PDF = 'pdf',                          // PDF format
  EXCEL = 'excel',                      // Excel format
  CUSTOM = 'custom'                     // Custom format requiring mapping
}

/**
 * Main interface for the Payment entity with all properties
 */
export interface Payment {
  id: UUID;                            // Unique identifier
  payerId: UUID;                       // Reference to payer
  paymentDate: ISO8601Date;            // Date payment was received
  paymentAmount: Money;                // Total payment amount
  paymentMethod: PaymentMethod;        // Method of payment (e.g., EFT, check)
  referenceNumber: string | null;      // Payment reference number
  checkNumber: string | null;          // Check number if payment by check
  remittanceId: string | null;         // Reference to remittance advice
  reconciliationStatus: ReconciliationStatus; // Current reconciliation status
  notes: string | null;                // Additional notes about the payment
  status: StatusType;                  // Overall record status
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
  createdBy: UUID | null;              // User who created the record
  updatedBy: UUID | null;              // User who last updated the record
}

/**
 * Extended interface for Payment entity that includes related entities
 */
export interface PaymentWithRelations {
  id: UUID;                            // Unique identifier
  payerId: UUID;                       // Reference to payer
  payer: PayerSummary;                 // Payer information
  paymentDate: ISO8601Date;            // Date payment was received
  paymentAmount: Money;                // Total payment amount
  paymentMethod: PaymentMethod;        // Method of payment (e.g., EFT, check)
  referenceNumber: string | null;      // Payment reference number
  checkNumber: string | null;          // Check number if payment by check
  remittanceId: string | null;         // Reference to remittance advice
  reconciliationStatus: ReconciliationStatus; // Current reconciliation status
  claimPayments: ClaimPayment[];       // Associated claim payment records
  remittanceInfo: RemittanceInfo | null; // Remittance information if available
  notes: string | null;                // Additional notes about the payment
  status: StatusType;                  // Overall record status
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
  createdBy: UUID | null;              // User who created the record
  updatedBy: UUID | null;              // User who last updated the record
}

/**
 * Simplified interface for payment summary information used in lists and dashboards
 */
export interface PaymentSummary {
  id: UUID;                            // Unique identifier
  payerId: UUID;                       // Reference to payer
  payerName: string;                   // Payer name for display
  paymentDate: ISO8601Date;            // Date payment was received
  paymentAmount: Money;                // Total payment amount
  paymentMethod: PaymentMethod;        // Method of payment
  referenceNumber: string | null;      // Payment reference number
  reconciliationStatus: ReconciliationStatus; // Current reconciliation status
  claimCount: number;                  // Number of claims associated with payment
}

/**
 * Interface for the association between payments and claims
 */
export interface ClaimPayment {
  id: UUID;                            // Unique identifier
  paymentId: UUID;                     // Reference to payment
  claimId: UUID;                       // Reference to claim
  paidAmount: Money;                   // Amount applied to this claim
  claim: ClaimSummary;                 // Claim information
  adjustments: PaymentAdjustment[];    // Adjustments for this claim payment
  status: StatusType;                  // Record status
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
}

/**
 * Interface for payment adjustments such as contractual adjustments, deductibles, etc.
 */
export interface PaymentAdjustment {
  id: UUID;                            // Unique identifier
  claimPaymentId: UUID;                // Reference to claim payment
  adjustmentType: AdjustmentType;      // Type of adjustment
  adjustmentCode: string;              // Adjustment code (from payer)
  adjustmentAmount: Money;             // Amount of adjustment
  description: string | null;          // Description of adjustment
  status: StatusType;                  // Record status
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
}

/**
 * Interface for remittance advice information associated with a payment
 */
export interface RemittanceInfo {
  id: UUID;                            // Unique identifier
  paymentId: UUID;                     // Reference to payment
  remittanceNumber: string;            // Remittance advice number
  remittanceDate: ISO8601Date;         // Date of remittance advice
  payerIdentifier: string;             // Payer identifier from remittance
  payerName: string;                   // Payer name from remittance
  totalAmount: Money;                  // Total amount from remittance
  claimCount: number;                  // Number of claims in remittance
  fileType: RemittanceFileType;        // Type of remittance file
  originalFilename: string | null;     // Original filename
  storageLocation: string | null;      // Where file is stored
  status: StatusType;                  // Record status
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
}

/**
 * Interface for detailed line items within a remittance advice
 */
export interface RemittanceDetail {
  id: UUID;                            // Unique identifier
  remittanceInfoId: UUID;              // Reference to remittance info
  claimNumber: string;                 // Claim number from remittance
  claimId: UUID | null;                // Reference to claim if matched
  serviceDate: ISO8601Date;            // Date of service
  billedAmount: Money;                 // Amount billed
  paidAmount: Money;                   // Amount paid
  adjustmentAmount: Money;             // Total adjustment amount
  adjustmentCodes: Record<string, string> | null; // Adjustment codes and descriptions
  status: StatusType;                  // Record status
  createdAt: ISO8601Date;              // When record was created
  updatedAt: ISO8601Date;              // When record was last updated
}

/**
 * Interface for query parameters when retrieving payments
 */
export interface PaymentQueryParams {
  pagination: PaginationParams;         // Pagination parameters
  sort: SortParams;                     // Sorting parameters
  filter: FilterParams;                 // Filtering parameters
  search: string;                       // Search term
  payerId: UUID;                        // Filter by payer
  reconciliationStatus: ReconciliationStatus | ReconciliationStatus[]; // Filter by status
  paymentMethod: PaymentMethod | PaymentMethod[]; // Filter by payment method
  dateRange: DateRange;                 // Filter by date range
  includeRemittance: boolean;           // Whether to include remittance details
}

/**
 * Data transfer object for creating a new payment
 */
export interface CreatePaymentDto {
  payerId: UUID;                        // Payer ID
  paymentDate: ISO8601Date;             // Date payment was received
  paymentAmount: Money;                 // Total payment amount
  paymentMethod: PaymentMethod;         // Method of payment
  referenceNumber: string | null;       // Payment reference number
  checkNumber: string | null;           // Check number if payment by check
  remittanceId: string | null;          // Reference to remittance advice
  notes: string | null;                 // Additional notes
}

/**
 * Data transfer object for updating an existing payment
 */
export interface UpdatePaymentDto {
  payerId: UUID;                        // Payer ID
  paymentDate: ISO8601Date;             // Date payment was received
  paymentAmount: Money;                 // Total payment amount
  paymentMethod: PaymentMethod;         // Method of payment
  referenceNumber: string | null;       // Payment reference number
  checkNumber: string | null;           // Check number if payment by check
  remittanceId: string | null;          // Reference to remittance advice
  notes: string | null;                 // Additional notes
}

/**
 * Data transfer object for reconciling a payment with claims
 */
export interface ReconcilePaymentDto {
  claimPayments: Array<{               // Claims to reconcile with payment
    claimId: UUID;                     // Claim ID
    amount: Money;                     // Amount to apply to claim
    adjustments?: PaymentAdjustmentDto[]; // Adjustments if any
  }>;
  notes: string | null;                // Notes about the reconciliation
}

/**
 * Data transfer object for creating a claim payment association
 */
export interface ClaimPaymentDto {
  claimId: UUID;                       // Claim ID
  paidAmount: Money;                   // Amount paid for this claim
  adjustments: PaymentAdjustmentDto[]; // Adjustments for this claim
}

/**
 * Data transfer object for creating a payment adjustment
 */
export interface PaymentAdjustmentDto {
  adjustmentType: AdjustmentType;      // Type of adjustment
  adjustmentCode: string;              // Adjustment code
  adjustmentAmount: Money;             // Amount of adjustment
  description: string | null;          // Description of adjustment
}

/**
 * Data transfer object for importing a remittance advice file
 */
export interface ImportRemittanceDto {
  payerId: UUID;                       // Payer ID
  fileContent: string | Buffer;        // File content as string or buffer
  fileType: RemittanceFileType;        // Type of file being imported
  originalFilename: string;            // Original filename
  mappingConfig: Record<string, string> | null; // Field mapping for custom formats
}

/**
 * Interface for the results of processing a remittance advice file
 */
export interface RemittanceProcessingResult {
  payment: PaymentWithRelations;       // Created payment record
  remittanceInfo: RemittanceInfo;      // Created remittance info
  detailsProcessed: number;            // Number of detail records processed
  claimsMatched: number;               // Number of claims successfully matched
  claimsUnmatched: number;             // Number of claims not matched
  totalAmount: Money;                  // Total amount from remittance
  matchedAmount: Money;                // Amount successfully matched to claims
  unmatchedAmount: Money;              // Amount not matched to claims
  errors: Array<{                      // Processing errors if any
    line: number;                      // Line number in file
    message: string;                   // Error message
  }>;
}

/**
 * Interface for the results of reconciling a payment with claims
 */
export interface ReconciliationResult {
  payment: PaymentWithRelations;       // Updated payment record
  claimPayments: ClaimPayment[];       // Created/updated claim payment records
  totalAmount: Money;                  // Total payment amount
  matchedAmount: Money;                // Amount successfully matched to claims
  unmatchedAmount: Money;              // Amount not matched to claims
  reconciliationStatus: ReconciliationStatus; // Updated reconciliation status
  updatedClaims: Array<{               // Claims whose status was updated
    claimId: UUID;                     // Claim ID
    previousStatus: ClaimStatus;       // Previous claim status
    newStatus: ClaimStatus;            // New claim status
  }>;
}

/**
 * Interface for payment metrics used in dashboards and reporting
 */
export interface PaymentMetrics {
  totalPayments: number;               // Total number of payments
  totalAmount: Money;                  // Total payment amount
  reconciliationBreakdown: Array<{     // Breakdown by reconciliation status
    status: ReconciliationStatus;      // Reconciliation status
    count: number;                     // Number of payments
    amount: Money;                     // Total amount
  }>;
  paymentMethodBreakdown: Array<{      // Breakdown by payment method
    method: PaymentMethod;             // Payment method
    count: number;                     // Number of payments
    amount: Money;                     // Total amount
  }>;
  paymentsByPayer: Array<{             // Breakdown by payer
    payerId: UUID;                     // Payer ID
    payerName: string;                 // Payer name
    count: number;                     // Number of payments
    amount: Money;                     // Total amount
  }>;
  paymentTrend: Array<{                // Payment trend over time
    period: string;                    // Time period (e.g., month)
    count: number;                     // Number of payments
    amount: Money;                     // Total amount
  }>;
  averagePaymentAmount: Money;         // Average payment amount
}

/**
 * Interface for accounts receivable aging report data
 */
export interface AccountsReceivableAging {
  asOfDate: ISO8601Date;               // Date of the aging report
  totalOutstanding: Money;             // Total outstanding amount
  current: Money;                      // Amount not yet due
  days1to30: Money;                    // Amount 1-30 days overdue
  days31to60: Money;                   // Amount 31-60 days overdue
  days61to90: Money;                   // Amount 61-90 days overdue
  days91Plus: Money;                   // Amount 91+ days overdue
  agingByPayer: Array<{                // Breakdown by payer
    payerId: UUID;                     // Payer ID
    payerName: string;                 // Payer name
    current: Money;                    // Amount not yet due
    days1to30: Money;                  // Amount 1-30 days overdue
    days31to60: Money;                 // Amount 31-60 days overdue
    days61to90: Money;                 // Amount 61-90 days overdue
    days91Plus: Money;                 // Amount 91+ days overdue
    total: Money;                      // Total outstanding for this payer
  }>;
  agingByProgram: Array<{              // Breakdown by program
    programId: UUID;                   // Program ID
    programName: string;               // Program name
    current: Money;                    // Amount not yet due
    days1to30: Money;                  // Amount 1-30 days overdue
    days31to60: Money;                 // Amount 31-60 days overdue
    days61to90: Money;                 // Amount 61-90 days overdue
    days91Plus: Money;                 // Amount 91+ days overdue
    total: Money;                      // Total outstanding for this program
  }>;
}

/**
 * Response object for single payment operations
 */
export interface PaymentResponse {
  payment: PaymentWithRelations;       // Payment with related entities
}

/**
 * Response object for paginated payment list operations
 */
export interface PaymentsResponse {
  payments: PaymentWithRelations[];    // List of payments with related entities
  total: number;                       // Total number of matching payments
  page: number;                        // Current page number
  limit: number;                       // Page size
  totalPages: number;                  // Total number of pages
}

/**
 * Response object for paginated payment summary list operations
 */
export interface PaymentSummariesResponse {
  payments: PaymentSummary[];          // List of payment summaries
  total: number;                       // Total number of matching payments
  page: number;                        // Current page number
  limit: number;                       // Page size
  totalPages: number;                  // Total number of pages
}

/**
 * Response object for remittance processing operations
 */
export interface RemittanceProcessingResponse {
  result: RemittanceProcessingResult;  // Results of processing a remittance
}

/**
 * Response object for payment reconciliation operations
 */
export interface ReconciliationResponse {
  result: ReconciliationResult;        // Results of reconciling a payment
}

/**
 * Response object for batch payment reconciliation operations
 */
export interface BatchReconciliationResponse {
  successful: UUID[];                  // IDs of successfully reconciled payments
  failed: Array<{                      // Details of failed reconciliations
    paymentId: UUID;                   // Payment ID
    error: string;                     // Error message
  }>;
  results: ReconciliationResult[];     // Results for successful reconciliations
}

/**
 * Response object for payment metrics operations
 */
export interface PaymentMetricsResponse {
  metrics: PaymentMetrics;             // Payment metrics for dashboards
}

/**
 * Response object for accounts receivable operations
 */
export interface AccountsReceivableResponse {
  aging: AccountsReceivableAging;      // Accounts receivable aging data
}