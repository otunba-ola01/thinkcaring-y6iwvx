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
  EntityBase
} from './common.types';
import { ClientSummary } from './clients.types';
import { ServiceSummary } from './services.types';
import { ApiPaginatedResponse } from './api.types';

/**
 * Enum defining the possible states in the claim lifecycle
 */
export enum ClaimStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL_PAID = 'partialPaid',
  DENIED = 'denied',
  APPEALED = 'appealed',
  VOID = 'void',
  FINAL_DENIED = 'finalDenied'
}

/**
 * Enum defining the types of claims that can be submitted
 */
export enum ClaimType {
  ORIGINAL = 'original',
  ADJUSTMENT = 'adjustment',
  REPLACEMENT = 'replacement',
  VOID = 'void'
}

/**
 * Enum defining the methods by which claims can be submitted to payers
 */
export enum SubmissionMethod {
  ELECTRONIC = 'electronic',
  PAPER = 'paper',
  PORTAL = 'portal',
  CLEARINGHOUSE = 'clearinghouse',
  DIRECT = 'direct'
}

/**
 * Enum defining common reasons for claim denials
 */
export enum DenialReason {
  DUPLICATE_CLAIM = 'duplicateClaim',
  SERVICE_NOT_COVERED = 'serviceNotCovered',
  AUTHORIZATION_MISSING = 'authorizationMissing',
  AUTHORIZATION_INVALID = 'authorizationInvalid',
  CLIENT_INELIGIBLE = 'clientIneligible',
  PROVIDER_INELIGIBLE = 'providerIneligible',
  TIMELY_FILING = 'timelyFiling',
  INVALID_CODING = 'invalidCoding',
  MISSING_INFORMATION = 'missingInformation',
  OTHER = 'other'
}

/**
 * Enum defining the types of payers in the system
 */
export enum PayerType {
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE_INSURANCE = 'privateInsurance',
  MANAGED_CARE = 'managedCare',
  SELF_PAY = 'selfPay',
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
  status: string;
}

/**
 * Main interface for the Claim entity with all properties
 */
export interface Claim {
  id: UUID;
  claimNumber: string;
  externalClaimId: string | null;
  clientId: UUID;
  payerId: UUID;
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
  notes: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  createdBy: UUID | null;
  updatedBy: UUID | null;
}

/**
 * Extended interface for Claim entity that includes related entities
 */
export interface ClaimWithRelations extends Claim {
  client: ClientSummary;
  payer: PayerSummary;
  originalClaim: ClaimSummary | null;
  services: ServiceSummary[];
  statusHistory: ClaimStatusHistory[];
}

/**
 * Simplified interface for claim summary information used in lists and dashboards
 */
export interface ClaimSummary {
  id: UUID;
  claimNumber: string;
  clientId: UUID;
  clientName: string;
  payerId: UUID;
  payerName: string;
  claimStatus: ClaimStatus;
  totalAmount: Money;
  serviceStartDate: ISO8601Date;
  serviceEndDate: ISO8601Date;
  submissionDate: ISO8601Date | null;
  claimAge: number; // In days
}

/**
 * Interface for tracking claim status changes over time
 */
export interface ClaimStatusHistory {
  id: UUID;
  claimId: UUID;
  status: ClaimStatus;
  timestamp: ISO8601DateTime;
  notes: string | null;
  userId: UUID | null;
  userName: string | null;
}

/**
 * Interface for the association between claims and services
 */
export interface ClaimService {
  id: UUID;
  claimId: UUID;
  serviceId: UUID;
  serviceLineNumber: number;
  billedUnits: number;
  billedAmount: Money;
  service: ServiceSummary;
}

/**
 * Interface for query parameters when retrieving claims
 */
export interface ClaimQueryParams {
  pagination: PaginationParams;
  sort: SortParams;
  filters: FilterParams[];
  search: string;
  clientId: UUID;
  payerId: UUID;
  programId: UUID;
  facilityId: UUID;
  claimStatus: ClaimStatus | ClaimStatus[];
  dateRange: DateRange;
  claimType: ClaimType;
  includeServices: boolean;
  includeStatusHistory: boolean;
}

/**
 * Data transfer object for creating a new claim
 */
export interface CreateClaimDto {
  clientId: UUID;
  payerId: UUID;
  claimType: ClaimType;
  serviceIds: UUID[];
  originalClaimId: UUID | null;
  notes: string | null;
}

/**
 * Data transfer object for updating an existing claim
 */
export interface UpdateClaimDto {
  payerId: UUID;
  serviceIds: UUID[];
  notes: string | null;
}

/**
 * Data transfer object for updating a claim's status
 */
export interface UpdateClaimStatusDto {
  status: ClaimStatus;
  adjudicationDate: ISO8601Date | null;
  denialReason: DenialReason | null;
  denialDetails: string | null;
  adjustmentCodes: Record<string, string> | null;
  notes: string | null;
}

/**
 * Data transfer object for submitting a claim to a payer
 */
export interface SubmitClaimDto {
  submissionMethod: SubmissionMethod;
  submissionDate: ISO8601Date;
  externalClaimId: string | null;
  notes: string | null;
}

/**
 * Data transfer object for submitting multiple claims in a batch
 */
export interface BatchSubmitClaimsDto {
  claimIds: UUID[];
  submissionMethod: SubmissionMethod;
  submissionDate: ISO8601Date;
  notes: string | null;
}

/**
 * Interface for validation errors found during claim validation
 */
export interface ClaimValidationError {
  code: string;
  message: string;
  field: string | null;
  context: Record<string, any> | null;
}

/**
 * Interface for validation warnings found during claim validation
 */
export interface ClaimValidationWarning {
  code: string;
  message: string;
  field: string | null;
  context: Record<string, any> | null;
}

/**
 * Interface for the result of claim validation
 */
export interface ClaimValidationResult {
  claimId: UUID;
  isValid: boolean;
  errors: ClaimValidationError[];
  warnings: ClaimValidationWarning[];
}

/**
 * Interface for claim metrics used in dashboards and reporting
 */
export interface ClaimMetrics {
  totalClaims: number;
  totalAmount: Money;
  statusBreakdown: Array<{ status: ClaimStatus, count: number, amount: Money }>;
  agingBreakdown: Array<{ range: string, count: number, amount: Money }>;
  denialRate: number;
  averageProcessingTime: number; // in days
  claimsByPayer: Array<{ payerId: UUID, payerName: string, count: number, amount: Money }>;
}

/**
 * Interface for paginated claim list responses
 */
export interface ClaimListResponse {
  claims: ClaimWithRelations[] | ClaimSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface for batch claim validation responses
 */
export interface ClaimValidationResponse {
  results: ClaimValidationResult[];
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}

/**
 * Interface for batch claim operation results
 */
export interface ClaimBatchResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ claimId: UUID, message: string }>;
  processedClaims: UUID[];
}

/**
 * Interface for claim timeline entries showing status changes
 */
export interface ClaimTimelineEntry {
  status: ClaimStatus;
  timestamp: ISO8601DateTime;
  notes: string | null;
  userId: UUID | null;
  userName: string | null;
}

/**
 * Interface for complete claim lifecycle information
 */
export interface ClaimLifecycle {
  claim: ClaimWithRelations;
  timeline: ClaimTimelineEntry[];
  relatedClaims: ClaimSummary[];
}

/**
 * Interface for claim aging buckets used in aging reports
 */
export interface ClaimAgingBucket {
  range: string; // e.g., "0-30 days"
  minDays: number;
  maxDays: number | null; // null for the last bucket (e.g., "90+ days")
  count: number;
  amount: Money;
}

/**
 * Interface for claim aging report data
 */
export interface ClaimAgingReport {
  agingBuckets: ClaimAgingBucket[];
  totalAmount: Money;
  totalClaims: number;
  averageAge: number;
}

/**
 * Data transfer object for appealing a denied claim
 */
export interface AppealClaimDto {
  appealReason: string;
  supportingDocuments: UUID[];
  notes: string | null;
}

/**
 * Data transfer object for voiding a claim
 */
export interface VoidClaimDto {
  reason: string;
  notes: string | null;
}