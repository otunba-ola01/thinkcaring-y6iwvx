/**
 * Defines TypeScript interfaces, types, and enums for the billing functionality in the HCBS Revenue Management System frontend.
 * This file provides type definitions for billing workflows, including service validation, service-to-claim conversion,
 * electronic submission, and billing dashboard metrics.
 */

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
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EntityBase 
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

import {
  ApiResponse,
  ApiPaginatedResponse
} from './api.types';

/**
 * Enum defining the supported billing formats for claim submission
 */
export enum BillingFormat {
  X12_837P = 'x12_837p',
  CMS1500 = 'cms1500',
  UB04 = 'ub04',
  CUSTOM = 'custom'
}

/**
 * Enum defining the types of billing rules that can be applied during validation
 */
export enum BillingRuleType {
  DOCUMENTATION = 'documentation',
  AUTHORIZATION = 'authorization',
  ELIGIBILITY = 'eligibility',
  CODING = 'coding',
  BILLING = 'billing',
  SUBMISSION = 'submission'
}

/**
 * Enum defining the severity levels for billing rule validation results
 */
export enum BillingRuleSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Interface for billing rules that define validation requirements for services
 */
export interface BillingRule {
  id: UUID;
  name: string;
  description: string;
  ruleType: BillingRuleType;
  severity: BillingRuleSeverity;
  condition: string;
  message: string;
  serviceTypeId: UUID | null;
  programId: UUID | null;
  payerId: UUID | null;
  isActive: boolean;
}

/**
 * Interface for the result of documentation validation for a service
 */
export interface DocumentationValidationResult {
  isComplete: boolean;
  missingItems: string[];
  serviceId: UUID;
}

/**
 * Interface for the result of authorization validation for a service
 */
export interface AuthorizationValidationResult {
  isAuthorized: boolean;
  authorizationId: UUID | null;
  serviceId: UUID;
  errors: string[];
  authorizedUnits: number | null;
  usedUnits: number | null;
  remainingUnits: number | null;
  expirationDate: ISO8601Date | null;
}

/**
 * Interface for validation errors found during service validation
 */
export interface ServiceValidationError {
  code: string;
  message: string;
  field: string | null;
}

/**
 * Interface for validation warnings found during service validation
 */
export interface ServiceValidationWarning {
  code: string;
  message: string;
  field: string | null;
}

/**
 * Interface for requesting validation of services for billing
 */
export interface BillingValidationRequest {
  serviceIds: UUID[];
}

/**
 * Interface for the comprehensive validation result for a service
 */
export interface BillingValidationResult {
  serviceId: UUID;
  isValid: boolean;
  errors: ServiceValidationError[];
  warnings: ServiceValidationWarning[];
  documentation: DocumentationValidationResult;
  authorization: AuthorizationValidationResult;
}

/**
 * Interface for the response to a billing validation request
 */
export interface BillingValidationResponse {
  results: BillingValidationResult[];
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}

/**
 * Interface for requesting conversion of services to a claim
 */
export interface ServiceToClaimRequest {
  serviceIds: UUID[];
  payerId: UUID;
  notes: string | null;
}

/**
 * Interface for the response to a service-to-claim conversion request
 */
export interface ServiceToClaimResponse {
  claim: ClaimSummary | null;
  validationResult: ValidationResult | null;
  success: boolean;
  message: string;
}

/**
 * Interface for requesting submission of a claim to a payer
 */
export interface BillingSubmissionRequest {
  claimId: UUID;
  submissionMethod: SubmissionMethod;
  submissionDate: ISO8601Date;
  externalClaimId: string | null;
  notes: string | null;
}

/**
 * Interface for the response to a claim submission request
 */
export interface BillingSubmissionResponse {
  success: boolean;
  message: string;
  confirmationNumber: string | null;
  submissionDate: ISO8601Date;
  claimId: UUID;
  validationResult: ValidationResult | null;
}

/**
 * Interface for requesting batch submission of multiple claims
 */
export interface BatchBillingSubmissionRequest {
  claimIds: UUID[];
  submissionMethod: SubmissionMethod;
  submissionDate: ISO8601Date;
  notes: string | null;
}

/**
 * Interface for the response to a batch claim submission request
 */
export interface BatchBillingSubmissionResponse {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ claimId: UUID, message: string }>;
  processedClaims: UUID[];
  submissionDate: ISO8601Date;
}

/**
 * Interface for the result of an electronic claim submission
 */
export interface ElectronicSubmissionResult {
  success: boolean;
  confirmationNumber: string | null;
  externalClaimId: string | null;
  submissionDate: ISO8601Date;
  errors: string[];
}

/**
 * Interface for filtering the billing queue of services ready for billing
 */
export interface BillingQueueFilter {
  clientId: UUID | null;
  programId: UUID | null;
  serviceTypeId: UUID | null;
  payerId: UUID | null;
  dateRange: DateRange | null;
  documentationStatus: DocumentationStatus | null;
  billingStatus: BillingStatus | null;
  search: string | null;
}

/**
 * Interface for the response containing services in the billing queue
 */
export interface BillingQueueResponse {
  services: ServiceSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalAmount: Money;
}

/**
 * Interface for metrics displayed on the billing dashboard
 */
export interface BillingDashboardMetrics {
  unbilledServicesCount: number;
  unbilledServicesAmount: Money;
  incompleteDocumentationCount: number;
  pendingClaimsCount: number;
  pendingClaimsAmount: Money;
  upcomingFilingDeadlines: Array<{ serviceCount: number, daysRemaining: number, amount: Money }>;
  recentBillingActivity: Array<{ date: ISO8601Date, claimsSubmitted: number, amount: Money }>;
}

/**
 * Enum defining the API endpoints for billing operations
 */
export enum BillingApiEndpoints {
  VALIDATE_SERVICES = '/api/billing/validate',
  CONVERT_TO_CLAIM = '/api/billing/convert-to-claim',
  SUBMIT_CLAIM = '/api/billing/submit',
  BATCH_SUBMIT = '/api/billing/batch-submit',
  BILLING_QUEUE = '/api/billing/queue',
  DASHBOARD_METRICS = '/api/billing/dashboard-metrics'
}

/**
 * Interface for API response when validating services
 */
export interface ValidateServicesResponse {
  data: BillingValidationResponse;
}

/**
 * Interface for API response when converting services to a claim
 */
export interface ConvertToClaimResponse {
  data: ServiceToClaimResponse;
}

/**
 * Interface for API response when submitting a claim
 */
export interface SubmitClaimResponse {
  data: BillingSubmissionResponse;
}

/**
 * Interface for API response when batch submitting claims
 */
export interface BatchSubmitResponse {
  data: BatchBillingSubmissionResponse;
}

/**
 * Interface for API response when retrieving the billing queue
 */
export interface BillingQueueApiResponse {
  data: BillingQueueResponse;
}

/**
 * Interface for API response when retrieving billing dashboard metrics
 */
export interface BillingDashboardApiResponse {
  data: BillingDashboardMetrics;
}

/**
 * Interface for the billing state in the Redux store
 */
export interface BillingState {
  billingQueue: ServiceSummary[];
  pagination: { page: number, pageSize: number, totalPages: number, total: number };
  totalAmount: Money;
  filters: BillingQueueFilter;
  selectedServices: UUID[];
  validationResults: BillingValidationResponse | null;
  conversionResult: ServiceToClaimResponse | null;
  submissionResult: BillingSubmissionResponse | null;
  batchSubmissionResult: BatchBillingSubmissionResponse | null;
  dashboardMetrics: BillingDashboardMetrics | null;
  loading: boolean;
  error: string | null;
}