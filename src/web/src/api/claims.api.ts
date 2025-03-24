/**
 * Claims API client for HCBS Revenue Management System
 * 
 * Provides functions for managing the entire claim lifecycle including creation,
 * validation, submission, tracking, and reporting. Implements comprehensive
 * claim management capabilities to support the revenue cycle workflow.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client';
import { CLAIM_API_ENDPOINTS } from '../constants/claims.constants';
import { 
  Claim, 
  ClaimWithRelations, 
  ClaimSummary, 
  ClaimQueryParams, 
  CreateClaimDto, 
  UpdateClaimDto, 
  UpdateClaimStatusDto, 
  SubmitClaimDto, 
  BatchSubmitClaimsDto, 
  ClaimValidationResult, 
  ClaimBatchResult, 
  ClaimMetrics, 
  ClaimAgingReport, 
  ClaimTimelineEntry, 
  ClaimLifecycle, 
  AppealClaimDto, 
  VoidClaimDto 
} from '../types/claims.types';
import { ApiResponse, ApiPaginatedResponse } from '../types/api.types';
import { UUID } from '../types/common.types';

/**
 * Retrieves a claim by its ID
 * 
 * @param id - UUID of the claim to retrieve
 * @returns Promise resolving to the claim with its related entities
 */
const getClaim = async (id: UUID): Promise<ApiResponse<ClaimWithRelations>> => {
  const endpoint = CLAIM_API_ENDPOINTS.GET_CLAIM.replace(':id', id);
  return apiClient.get<ClaimWithRelations>(endpoint);
};

/**
 * Retrieves a paginated list of claims with optional filtering
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated claims data
 */
const getAllClaims = async (params: ClaimQueryParams): Promise<ApiPaginatedResponse<ClaimWithRelations[]>> => {
  return apiClient.get<ClaimWithRelations[]>(CLAIM_API_ENDPOINTS.BASE, params);
};

/**
 * Retrieves a paginated list of claim summaries for lists and dashboards
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated claim summaries
 */
const getClaimSummaries = async (params: ClaimQueryParams): Promise<ApiPaginatedResponse<ClaimSummary[]>> => {
  return apiClient.get<ClaimSummary[]>(`${CLAIM_API_ENDPOINTS.BASE}/summaries`, params);
};

/**
 * Creates a new claim
 * 
 * @param claimData - Data for creating the new claim
 * @returns Promise resolving to the created claim
 */
const createClaim = async (claimData: CreateClaimDto): Promise<ApiResponse<Claim>> => {
  return apiClient.post<Claim>(CLAIM_API_ENDPOINTS.CREATE_CLAIM, claimData);
};

/**
 * Updates an existing claim
 * 
 * @param id - UUID of the claim to update
 * @param claimData - Updated claim data
 * @returns Promise resolving to the updated claim
 */
const updateClaim = async (id: UUID, claimData: UpdateClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.UPDATE_CLAIM.replace(':id', id);
  return apiClient.put<Claim>(endpoint, claimData);
};

/**
 * Validates a claim for submission readiness
 * 
 * @param id - UUID of the claim to validate
 * @returns Promise resolving to validation results
 */
const validateClaim = async (id: UUID): Promise<ApiResponse<ClaimValidationResult>> => {
  const endpoint = CLAIM_API_ENDPOINTS.VALIDATE_CLAIM.replace(':id', id);
  return apiClient.post<ClaimValidationResult>(endpoint);
};

/**
 * Validates multiple claims for submission readiness
 * 
 * @param claimIds - Array of claim UUIDs to validate
 * @returns Promise resolving to validation results for multiple claims
 */
const batchValidateClaims = async (claimIds: UUID[]): Promise<ApiResponse<ClaimValidationResult[]>> => {
  return apiClient.post<ClaimValidationResult[]>(CLAIM_API_ENDPOINTS.BATCH_VALIDATE, { claimIds });
};

/**
 * Submits a validated claim to a payer
 * 
 * @param id - UUID of the claim to submit
 * @param submissionData - Data needed for claim submission
 * @returns Promise resolving to the submitted claim
 */
const submitClaim = async (id: UUID, submissionData: SubmitClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.SUBMIT_CLAIM.replace(':id', id);
  return apiClient.post<Claim>(endpoint, submissionData);
};

/**
 * Submits multiple validated claims to payers
 * 
 * @param batchData - Data for batch claim submission
 * @returns Promise resolving to batch submission results
 */
const batchSubmitClaims = async (batchData: BatchSubmitClaimsDto): Promise<ApiResponse<ClaimBatchResult>> => {
  return apiClient.post<ClaimBatchResult>(CLAIM_API_ENDPOINTS.BATCH_SUBMIT, batchData);
};

/**
 * Validates and submits a claim in one operation
 * 
 * @param id - UUID of the claim to validate and submit
 * @param submissionData - Data needed for claim submission
 * @returns Promise resolving to the validated and submitted claim
 */
const validateAndSubmitClaim = async (id: UUID, submissionData: SubmitClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.VALIDATE_AND_SUBMIT.replace(':id', id);
  return apiClient.post<Claim>(endpoint, submissionData);
};

/**
 * Validates and submits multiple claims in one operation
 * 
 * @param batchData - Data for batch validation and submission
 * @returns Promise resolving to batch validation and submission results
 */
const batchValidateAndSubmitClaims = async (batchData: BatchSubmitClaimsDto): Promise<ApiResponse<ClaimBatchResult>> => {
  return apiClient.post<ClaimBatchResult>(CLAIM_API_ENDPOINTS.BATCH_VALIDATE_AND_SUBMIT, batchData);
};

/**
 * Resubmits a previously submitted claim that was rejected or denied
 * 
 * @param id - UUID of the claim to resubmit
 * @param submissionData - Data needed for claim resubmission
 * @returns Promise resolving to the resubmitted claim
 */
const resubmitClaim = async (id: UUID, submissionData: SubmitClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.RESUBMIT_CLAIM.replace(':id', id);
  return apiClient.post<Claim>(endpoint, submissionData);
};

/**
 * Updates the status of a claim
 * 
 * @param id - UUID of the claim to update
 * @param statusData - New status data and related information
 * @returns Promise resolving to the claim with updated status
 */
const updateClaimStatus = async (id: UUID, statusData: UpdateClaimStatusDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.UPDATE_STATUS.replace(':id', id);
  return apiClient.put<Claim>(endpoint, statusData);
};

/**
 * Gets the current status of a claim
 * 
 * @param id - UUID of the claim
 * @returns Promise resolving to the claim status information
 */
const getClaimStatus = async (id: UUID): Promise<ApiResponse<{ status: string, timestamp: string }>> => {
  const endpoint = CLAIM_API_ENDPOINTS.GET_STATUS.replace(':id', id);
  return apiClient.get<{ status: string, timestamp: string }>(endpoint);
};

/**
 * Refreshes the status of a claim by checking with the clearinghouse or payer
 * 
 * @param id - UUID of the claim to refresh
 * @returns Promise resolving to the claim with refreshed status
 */
const refreshClaimStatus = async (id: UUID): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.REFRESH_STATUS.replace(':id', id);
  return apiClient.post<Claim>(endpoint);
};

/**
 * Refreshes the status of multiple claims by checking with clearinghouses or payers
 * 
 * @param claimIds - Array of claim UUIDs to refresh
 * @returns Promise resolving to batch refresh results
 */
const batchRefreshClaimStatus = async (claimIds: UUID[]): Promise<ApiResponse<ClaimBatchResult>> => {
  return apiClient.post<ClaimBatchResult>(CLAIM_API_ENDPOINTS.BATCH_REFRESH_STATUS, { claimIds });
};

/**
 * Gets claims filtered by status
 * 
 * @param status - Status to filter by
 * @param params - Additional query parameters
 * @returns Promise resolving to paginated claims filtered by status
 */
const getClaimsByStatus = async (status: string, params: ClaimQueryParams): Promise<ApiPaginatedResponse<ClaimSummary[]>> => {
  const endpoint = CLAIM_API_ENDPOINTS.GET_BY_STATUS.replace(':status', status);
  return apiClient.get<ClaimSummary[]>(endpoint, params);
};

/**
 * Gets an aging report for claims based on their current status and age
 * 
 * @param params - Query parameters for filtering the aging report
 * @returns Promise resolving to claim aging report data
 */
const getClaimAging = async (params: ClaimQueryParams): Promise<ApiResponse<ClaimAgingReport>> => {
  return apiClient.get<ClaimAgingReport>(CLAIM_API_ENDPOINTS.GET_AGING, params);
};

/**
 * Gets a detailed timeline of a claim's lifecycle
 * 
 * @param id - UUID of the claim
 * @returns Promise resolving to claim timeline entries
 */
const getClaimTimeline = async (id: UUID): Promise<ApiResponse<ClaimTimelineEntry[]>> => {
  const endpoint = CLAIM_API_ENDPOINTS.GET_TIMELINE.replace(':id', id);
  return apiClient.get<ClaimTimelineEntry[]>(endpoint);
};

/**
 * Voids a claim, marking it as no longer valid
 * 
 * @param id - UUID of the claim to void
 * @param voidData - Data with reason for voiding the claim
 * @returns Promise resolving to the voided claim
 */
const voidClaim = async (id: UUID, voidData: VoidClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.VOID_CLAIM.replace(':id', id);
  return apiClient.post<Claim>(endpoint, voidData);
};

/**
 * Creates an appeal for a denied claim
 * 
 * @param id - UUID of the denied claim
 * @param appealData - Data for the appeal
 * @returns Promise resolving to the appealed claim
 */
const appealClaim = async (id: UUID, appealData: AppealClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.APPEAL_CLAIM.replace(':id', id);
  return apiClient.post<Claim>(endpoint, appealData);
};

/**
 * Creates an adjustment claim based on an existing claim
 * 
 * @param id - UUID of the original claim
 * @param adjustmentData - Data for the adjustment claim
 * @returns Promise resolving to the created adjustment claim
 */
const createAdjustmentClaim = async (id: UUID, adjustmentData: CreateClaimDto): Promise<ApiResponse<Claim>> => {
  const endpoint = CLAIM_API_ENDPOINTS.CREATE_ADJUSTMENT.replace(':id', id);
  return apiClient.post<Claim>(endpoint, adjustmentData);
};

/**
 * Gets the complete lifecycle information for a claim
 * 
 * @param id - UUID of the claim
 * @returns Promise resolving to claim lifecycle information
 */
const getClaimLifecycle = async (id: UUID): Promise<ApiResponse<ClaimLifecycle>> => {
  const endpoint = CLAIM_API_ENDPOINTS.GET_LIFECYCLE.replace(':id', id);
  return apiClient.get<ClaimLifecycle>(endpoint);
};

/**
 * Gets claim metrics for dashboard and reporting
 * 
 * @param params - Query parameters for filtering metrics
 * @returns Promise resolving to claim metrics data
 */
const getClaimMetrics = async (params: ClaimQueryParams): Promise<ApiResponse<ClaimMetrics>> => {
  return apiClient.get<ClaimMetrics>(CLAIM_API_ENDPOINTS.GET_METRICS, params);
};

/**
 * Deletes a claim (typically only available for draft claims)
 * 
 * @param id - UUID of the claim to delete
 * @returns Promise resolving to success response
 */
const deleteClaim = async (id: UUID): Promise<ApiResponse<void>> => {
  const endpoint = CLAIM_API_ENDPOINTS.GET_CLAIM.replace(':id', id);
  return apiClient.del<void>(endpoint);
};

/**
 * Claims API client providing methods for interacting with claim-related endpoints
 */
export const claimsApi = {
  getClaim,
  getAllClaims,
  getClaimSummaries,
  createClaim,
  updateClaim,
  validateClaim,
  batchValidateClaims,
  submitClaim,
  batchSubmitClaims,
  validateAndSubmitClaim,
  batchValidateAndSubmitClaims,
  resubmitClaim,
  updateClaimStatus,
  getClaimStatus,
  refreshClaimStatus,
  batchRefreshClaimStatus,
  getClaimsByStatus,
  getClaimAging,
  getClaimTimeline,
  voidClaim,
  appealClaim,
  createAdjustmentClaim,
  getClaimLifecycle,
  getClaimMetrics,
  deleteClaim
};