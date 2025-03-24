import { 
  UUID, 
  ISO8601Date, 
  ISO8601DateTime, 
  Money, 
  DateRange,
  PaginationParams, 
  SortParams, 
  FilterParams, 
  QueryParams,
  ResponseError,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EntityBase,
  PaymentMethod
} from './common.types';
import { ClaimSummary, ClaimStatus } from './claims.types';
import { PayerSummary } from './claims.types';
import { ApiPaginatedResponse } from './api.types';

/**
 * Enum defining the possible reconciliation states of a payment
 */
export enum ReconciliationStatus {
  UNRECONCILED = 'unreconciled',
  PARTIALLY_RECONCILED = 'partiallyReconciled',
  RECONCILED = 'reconciled',
  EXCEPTION = 'exception'
}

/**
 * Enum defining the types of payment adjustments
 */
export enum AdjustmentType {
  CONTRACTUAL = 'contractual',
  DEDUCTIBLE = 'deductible',
  COINSURANCE = 'coinsurance',
  COPAY = 'copay',
  NONCOVERED = 'noncovered',
  TRANSFER = 'transfer',
  OTHER = 'other'
}

/**
 * Enum defining the supported file types for remittance advice imports
 */
export enum RemittanceFileType {
  EDI_835 = 'edi835',
  CSV = 'csv',
  PDF = 'pdf',
  EXCEL = 'excel',
  CUSTOM = 'custom'
}

/**
 * Main interface for the Payment entity with all properties
 */
export interface Payment {
  id: UUID;
  payerId: UUID;
  paymentDate: ISO8601Date;
  paymentAmount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  checkNumber: string | null;
  remittanceId: string | null;
  reconciliationStatus: ReconciliationStatus;
  notes: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Extended interface for Payment entity that includes related entities
 */
export interface PaymentWithRelations {
  id: UUID;
  payerId: UUID;
  payer: PayerSummary;
  paymentDate: ISO8601Date;
  paymentAmount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  checkNumber: string | null;
  remittanceId: string | null;
  reconciliationStatus: ReconciliationStatus;
  claimPayments: ClaimPayment[];
  remittanceInfo: RemittanceInfo | null;
  notes: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Simplified interface for payment summary information used in lists and dashboards
 */
export interface PaymentSummary {
  id: UUID;
  payerId: UUID;
  payerName: string;
  paymentDate: ISO8601Date;
  paymentAmount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  reconciliationStatus: ReconciliationStatus;
  claimCount: number;
}

/**
 * Interface for the association between payments and claims
 */
export interface ClaimPayment {
  id: UUID;
  paymentId: UUID;
  claimId: UUID;
  paidAmount: Money;
  claim: ClaimSummary;
  adjustments: PaymentAdjustment[];
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for payment adjustments such as contractual adjustments, deductibles, etc.
 */
export interface PaymentAdjustment {
  id: UUID;
  claimPaymentId: UUID;
  adjustmentType: AdjustmentType;
  adjustmentCode: string;
  adjustmentAmount: Money;
  description: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for remittance advice information associated with a payment
 */
export interface RemittanceInfo {
  id: UUID;
  paymentId: UUID;
  remittanceNumber: string;
  remittanceDate: ISO8601Date;
  payerIdentifier: string;
  payerName: string;
  totalAmount: Money;
  claimCount: number;
  fileType: RemittanceFileType;
  originalFilename: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for detailed line items within a remittance advice
 */
export interface RemittanceDetail {
  id: UUID;
  remittanceInfoId: UUID;
  claimNumber: string;
  claimId: UUID | null;
  serviceDate: ISO8601Date;
  billedAmount: Money;
  paidAmount: Money;
  adjustmentAmount: Money;
  adjustmentCodes: Record<string, string> | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

/**
 * Interface for query parameters when retrieving payments
 */
export interface PaymentQueryParams {
  pagination: PaginationParams;
  sort: SortParams;
  filters: FilterParams[];
  search: string;
  payerId: UUID;
  reconciliationStatus: ReconciliationStatus | ReconciliationStatus[];
  paymentMethod: PaymentMethod | PaymentMethod[];
  dateRange: DateRange;
  includeRemittance: boolean;
}

/**
 * Data transfer object for creating a new payment
 */
export interface CreatePaymentDto {
  payerId: UUID;
  paymentDate: ISO8601Date;
  paymentAmount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  checkNumber: string | null;
  remittanceId: string | null;
  notes: string | null;
}

/**
 * Data transfer object for updating an existing payment
 */
export interface UpdatePaymentDto {
  payerId: UUID;
  paymentDate: ISO8601Date;
  paymentAmount: Money;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  checkNumber: string | null;
  remittanceId: string | null;
  notes: string | null;
}

/**
 * Data transfer object for reconciling a payment with claims
 */
export interface ReconcilePaymentDto {
  claimPayments: Array<{
    claimId: UUID;
    amount: Money;
    adjustments?: PaymentAdjustmentDto[];
  }>;
  notes: string | null;
}

/**
 * Data transfer object for creating a payment adjustment
 */
export interface PaymentAdjustmentDto {
  adjustmentType: AdjustmentType;
  adjustmentCode: string;
  adjustmentAmount: Money;
  description: string | null;
}

/**
 * Data transfer object for importing a remittance advice file
 */
export interface ImportRemittanceDto {
  payerId: UUID;
  fileType: RemittanceFileType;
  file: File;
  mappingConfig: Record<string, string> | null;
}

/**
 * Interface for the results of processing a remittance advice file
 */
export interface RemittanceProcessingResult {
  payment: PaymentWithRelations;
  remittanceInfo: RemittanceInfo;
  detailsProcessed: number;
  claimsMatched: number;
  claimsUnmatched: number;
  totalAmount: Money;
  matchedAmount: Money;
  unmatchedAmount: Money;
  errors: Array<{ line: number; message: string }>;
}

/**
 * Interface for the results of reconciling a payment with claims
 */
export interface ReconciliationResult {
  payment: PaymentWithRelations;
  claimPayments: ClaimPayment[];
  totalAmount: Money;
  matchedAmount: Money;
  unmatchedAmount: Money;
  reconciliationStatus: ReconciliationStatus;
  updatedClaims: Array<{
    claimId: UUID;
    previousStatus: ClaimStatus;
    newStatus: ClaimStatus;
  }>;
}

/**
 * Interface for payment metrics used in dashboards and reporting
 */
export interface PaymentMetrics {
  totalPayments: number;
  totalAmount: Money;
  reconciliationBreakdown: Array<{
    status: ReconciliationStatus;
    count: number;
    amount: Money;
  }>;
  paymentMethodBreakdown: Array<{
    method: PaymentMethod;
    count: number;
    amount: Money;
  }>;
  paymentsByPayer: Array<{
    payerId: UUID;
    payerName: string;
    count: number;
    amount: Money;
  }>;
  paymentTrend: Array<{
    period: string;
    count: number;
    amount: Money;
  }>;
  averagePaymentAmount: Money;
}

/**
 * Interface for accounts receivable aging report data
 */
export interface AccountsReceivableAging {
  asOfDate: ISO8601Date;
  totalOutstanding: Money;
  current: Money;
  days1to30: Money;
  days31to60: Money;
  days61to90: Money;
  days91Plus: Money;
  agingByPayer: Array<{
    payerId: UUID;
    payerName: string;
    current: Money;
    days1to30: Money;
    days31to60: Money;
    days61to90: Money;
    days91Plus: Money;
    total: Money;
  }>;
  agingByProgram: Array<{
    programId: UUID;
    programName: string;
    current: Money;
    days1to30: Money;
    days31to60: Money;
    days61to90: Money;
    days91Plus: Money;
    total: Money;
  }>;
}

/**
 * Response object for single payment operations
 */
export interface PaymentResponse {
  payment: PaymentWithRelations;
}

/**
 * Response object for paginated payment list operations
 */
export interface PaymentsResponse {
  payments: PaymentWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Response object for paginated payment summary list operations
 */
export interface PaymentSummariesResponse {
  payments: PaymentSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Response object for remittance processing operations
 */
export interface RemittanceProcessingResponse {
  result: RemittanceProcessingResult;
}

/**
 * Response object for payment reconciliation operations
 */
export interface ReconciliationResponse {
  result: ReconciliationResult;
}

/**
 * Response object for batch payment reconciliation operations
 */
export interface BatchReconciliationResponse {
  successful: UUID[];
  failed: Array<{ paymentId: UUID; error: string }>;
  results: ReconciliationResult[];
}

/**
 * Response object for payment metrics operations
 */
export interface PaymentMetricsResponse {
  metrics: PaymentMetrics;
}

/**
 * Response object for accounts receivable operations
 */
export interface AccountsReceivableResponse {
  aging: AccountsReceivableAging;
}

/**
 * Interface for API responses containing paginated payment lists
 */
export interface PaymentListApiResponse {
  data: PaymentSummary[] | PaymentWithRelations[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Interface for API responses containing a single payment with relations
 */
export interface PaymentDetailApiResponse {
  data: PaymentWithRelations;
}