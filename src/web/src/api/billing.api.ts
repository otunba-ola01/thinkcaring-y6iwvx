/**
 * Billing API Client
 * 
 * Implements API client functions for the billing workflow in the HCBS Revenue Management System.
 * This module provides methods for validating services for billing, converting services to claims,
 * submitting claims to payers, retrieving the billing queue, and fetching billing dashboard metrics.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client'; // axios-based API client v1.4+
import { API_ENDPOINTS } from '../constants/api.constants';
import { UUID } from '../types/common.types';
import { 
  BillingValidationRequest,
  BillingValidationResponse,
  ServiceToClaimRequest,
  ServiceToClaimResponse,
  BillingSubmissionRequest,
  BillingSubmissionResponse,
  BatchBillingSubmissionRequest,
  BatchBillingSubmissionResponse,
  BillingQueueFilter,
  BillingQueueResponse,
  BillingDashboardMetrics,
  ValidateServicesResponse,
  ConvertToClaimResponse,
  SubmitClaimResponse,
  BatchSubmitResponse,
  BillingQueueApiResponse,
  BillingDashboardApiResponse
} from '../types/billing.types';
import { SubmissionMethod } from '../types/claims.types';

/**
 * Interface for claim validation result
 */
interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string; code: string }>;
  warnings: Array<{ field: string; message: string; code: string }>;
}

/**
 * Validates services against all billing requirements including documentation and authorization
 * 
 * @param {BillingValidationRequest} request - Request containing service IDs to validate
 * @returns {Promise<BillingValidationResponse>} Validation results for the services
 */
const validateServicesForBilling = async (
  request: BillingValidationRequest
): Promise<BillingValidationResponse> => {
  const response = await apiClient.post<ValidateServicesResponse>(
    `${API_ENDPOINTS.BILLING.BASE}${API_ENDPOINTS.BILLING.VALIDATION}`,
    request
  );
  return response.data;
};

/**
 * Converts validated services into a billable claim
 * 
 * @param {ServiceToClaimRequest} request - Request containing service IDs, payer ID, and notes
 * @returns {Promise<ServiceToClaimResponse>} Response containing the created claim or validation errors
 */
const convertServicesToClaim = async (
  request: ServiceToClaimRequest
): Promise<ServiceToClaimResponse> => {
  const response = await apiClient.post<ConvertToClaimResponse>(
    `${API_ENDPOINTS.BILLING.BASE}/convert-to-claim`,
    request
  );
  return response.data;
};

/**
 * Validates services and converts them to a claim if validation is successful
 * 
 * @param {ServiceToClaimRequest} request - Request containing service IDs, payer ID, and notes
 * @returns {Promise<ServiceToClaimResponse>} Response containing the created claim and validation results
 */
const validateAndConvertToClaim = async (
  request: ServiceToClaimRequest
): Promise<ServiceToClaimResponse> => {
  const response = await apiClient.post<ConvertToClaimResponse>(
    `${API_ENDPOINTS.BILLING.BASE}/validate-convert`,
    request
  );
  return response.data;
};

/**
 * Converts multiple sets of services into claims in a batch process
 * 
 * @param {Array<{ serviceIds: UUID[], payerId: UUID, notes?: string }>} batchData - Array of service sets to convert
 * @returns {Promise<{ totalProcessed: number, successCount: number, errorCount: number, errors: Array<{ serviceIds: UUID[], message: string }>, createdClaims: UUID[] }>} Batch processing results
 */
const batchConvertServicesToClaims = async (
  batchData: Array<{ serviceIds: UUID[]; payerId: UUID; notes?: string }>
): Promise<{
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ serviceIds: UUID[]; message: string }>;
  createdClaims: UUID[];
}> => {
  const response = await apiClient.post<{
    data: {
      totalProcessed: number;
      successCount: number;
      errorCount: number;
      errors: Array<{ serviceIds: UUID[]; message: string }>;
      createdClaims: UUID[];
    };
  }>(`${API_ENDPOINTS.BILLING.BASE}/batch-convert`, { batchData });
  return response.data;
};

/**
 * Submits a validated claim to a payer through the specified submission method
 * 
 * @param {BillingSubmissionRequest} request - Request containing claim submission details
 * @returns {Promise<BillingSubmissionResponse>} Response containing submission result, confirmation number, and validation information
 */
const submitClaim = async (
  request: BillingSubmissionRequest
): Promise<BillingSubmissionResponse> => {
  const response = await apiClient.post<SubmitClaimResponse>(
    `${API_ENDPOINTS.BILLING.BASE}${API_ENDPOINTS.BILLING.SUBMISSION}`,
    request
  );
  return response.data;
};

/**
 * Validates a claim and submits it if validation is successful
 * 
 * @param {BillingSubmissionRequest} request - Request containing claim ID, submission method, and other details
 * @returns {Promise<BillingSubmissionResponse>} Response containing validation and submission results
 */
const validateAndSubmitClaim = async (
  request: BillingSubmissionRequest
): Promise<BillingSubmissionResponse> => {
  const response = await apiClient.post<SubmitClaimResponse>(
    `${API_ENDPOINTS.BILLING.BASE}/validate-submit`,
    request
  );
  return response.data;
};

/**
 * Submits multiple validated claims to payers in a batch process
 * 
 * @param {BatchBillingSubmissionRequest} request - Request containing claim IDs and submission details
 * @returns {Promise<BatchBillingSubmissionResponse>} Response containing batch submission results, success/failure counts, and error details
 */
const batchSubmitClaims = async (
  request: BatchBillingSubmissionRequest
): Promise<BatchBillingSubmissionResponse> => {
  const response = await apiClient.post<BatchSubmitResponse>(
    `${API_ENDPOINTS.BILLING.BASE}/batch-submit`,
    request
  );
  return response.data;
};

/**
 * Retrieves services that are ready for billing with optional filtering
 * 
 * @param {BillingQueueFilter} filter - Filter criteria for billing queue
 * @param {number} page - Page number for pagination
 * @param {number} pageSize - Number of items per page
 * @returns {Promise<BillingQueueResponse>} Paginated list of billable services
 */
const getBillingQueue = async (
  filter: BillingQueueFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<BillingQueueResponse> => {
  // Construct query parameters
  const queryParams: Record<string, any> = {
    page,
    pageSize,
    ...filter
  };

  // Handle date range if provided
  if (filter.dateRange) {
    if (filter.dateRange.startDate) {
      queryParams.startDate = filter.dateRange.startDate;
    }
    if (filter.dateRange.endDate) {
      queryParams.endDate = filter.dateRange.endDate;
    }
    // Remove the original dateRange to avoid serialization issues
    delete queryParams.dateRange;
  }

  const response = await apiClient.get<BillingQueueApiResponse>(
    `${API_ENDPOINTS.BILLING.BASE}${API_ENDPOINTS.BILLING.QUEUE}`,
    queryParams
  );
  return response.data;
};

/**
 * Validates that a claim meets all requirements for submission
 * 
 * @param {UUID} claimId - ID of the claim to validate
 * @param {SubmissionMethod} submissionMethod - Method to use for claim submission
 * @returns {Promise<ValidationResult>} Validation results including errors and warnings
 */
const validateSubmissionRequirements = async (
  claimId: UUID,
  submissionMethod: SubmissionMethod
): Promise<ValidationResult> => {
  const response = await apiClient.post<{
    data: ValidationResult;
  }>(
    `${API_ENDPOINTS.CLAIMS.BASE}/${claimId}${API_ENDPOINTS.CLAIMS.VALIDATE}`,
    { submissionMethod }
  );
  return response.data;
};

/**
 * Retrieves metrics for the billing dashboard
 * 
 * @returns {Promise<BillingDashboardMetrics>} Metrics for the billing dashboard
 */
const getBillingDashboardMetrics = async (): Promise<BillingDashboardMetrics> => {
  const response = await apiClient.get<BillingDashboardApiResponse>(
    `${API_ENDPOINTS.BILLING.BASE}/dashboard-metrics`
  );
  return response.data;
};

/**
 * Export all billing API functions for use throughout the application
 */
export const billingApi = {
  validateServicesForBilling,
  convertServicesToClaim,
  validateAndConvertToClaim,
  batchConvertServicesToClaims,
  submitClaim,
  validateAndSubmitClaim,
  batchSubmitClaims,
  getBillingQueue,
  validateSubmissionRequirements,
  getBillingDashboardMetrics
};