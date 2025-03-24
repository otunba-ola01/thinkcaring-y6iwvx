/**
 * Redux Toolkit async thunks for claims management in the HCBS Revenue Management System
 * 
 * This file implements async thunks that handle API requests for the claims lifecycle
 * from creation through validation, submission, and tracking. Thunks provide a consistent
 * way to handle asynchronous operations within Redux while maintaining type safety.
 * 
 * @version 1.0.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+

import { claimsApi } from '../../api/claims.api';
import { 
  ClaimSummary, 
  ClaimWithRelations, 
  ClaimQueryParams,
  ClaimValidationResponse,
  ClaimBatchResult,
  ClaimMetrics,
  CreateClaimDto,
  UpdateClaimDto,
  SubmitClaimDto,
  BatchSubmitClaimsDto
} from '../../types/claims.types';
import { ApiResponse, ApiPaginatedResponse } from '../../types/api.types';
import { UUID } from '../../types/common.types';

/**
 * Async thunk for fetching a paginated list of claims with optional filtering
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated claims data
 */
export const fetchClaims = createAsyncThunk<
  ApiPaginatedResponse<ClaimSummary[]>,
  ClaimQueryParams
>('claims/fetchClaims', async (params, { rejectWithValue }) => {
  try {
    const response = await claimsApi.getAllClaims(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to fetch claims');
  }
});

/**
 * Async thunk for fetching a single claim by its ID
 * 
 * @param id - UUID of the claim to retrieve
 * @returns Promise resolving to the claim with its related entities
 */
export const fetchClaimById = createAsyncThunk<
  ApiResponse<ClaimWithRelations>,
  UUID
>('claims/fetchClaimById', async (id, { rejectWithValue }) => {
  try {
    const response = await claimsApi.getClaim(id);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to fetch claim details');
  }
});

/**
 * Async thunk for creating a new claim
 * 
 * @param claimData - Data for creating the new claim
 * @returns Promise resolving to the created claim
 */
export const createClaim = createAsyncThunk<
  ApiResponse<ClaimWithRelations>,
  CreateClaimDto
>('claims/createClaim', async (claimData, { rejectWithValue }) => {
  try {
    const response = await claimsApi.createClaim(claimData);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to create claim');
  }
});

/**
 * Async thunk for updating an existing claim
 * 
 * @param payload - Object containing the claim ID and update data
 * @returns Promise resolving to the updated claim
 */
export const updateClaim = createAsyncThunk<
  ApiResponse<ClaimWithRelations>,
  { id: UUID, data: UpdateClaimDto }
>('claims/updateClaim', async (payload, { rejectWithValue }) => {
  try {
    const { id, data } = payload;
    const response = await claimsApi.updateClaim(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to update claim');
  }
});

/**
 * Async thunk for validating one or more claims for submission readiness
 * 
 * @param claimIds - Array of claim UUIDs to validate
 * @returns Promise resolving to validation results
 */
export const validateClaims = createAsyncThunk<
  ApiResponse<ClaimValidationResponse>,
  UUID[]
>('claims/validateClaims', async (claimIds, { rejectWithValue }) => {
  try {
    // Handle both single and batch validation
    let response;
    if (claimIds.length === 1) {
      response = await claimsApi.validateClaim(claimIds[0]);
    } else {
      response = await claimsApi.batchValidateClaims(claimIds);
    }
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to validate claims');
  }
});

/**
 * Async thunk for submitting a validated claim to a payer
 * 
 * @param payload - Object containing the claim ID and submission data
 * @returns Promise resolving to the submitted claim
 */
export const submitClaim = createAsyncThunk<
  ApiResponse<ClaimWithRelations>,
  { id: UUID, data: SubmitClaimDto }
>('claims/submitClaim', async (payload, { rejectWithValue }) => {
  try {
    const { id, data } = payload;
    const response = await claimsApi.submitClaim(id, data);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to submit claim');
  }
});

/**
 * Async thunk for submitting multiple validated claims to payers
 * 
 * @param batchData - Data for batch claim submission
 * @returns Promise resolving to batch submission results
 */
export const batchSubmitClaims = createAsyncThunk<
  ApiResponse<ClaimBatchResult>,
  BatchSubmitClaimsDto
>('claims/batchSubmitClaims', async (batchData, { rejectWithValue }) => {
  try {
    const response = await claimsApi.batchSubmitClaims(batchData);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to submit batch claims');
  }
});

/**
 * Async thunk for fetching claim metrics for dashboard and reporting
 * 
 * @param params - Query parameters for filtering metrics
 * @returns Promise resolving to claim metrics data
 */
export const fetchClaimMetrics = createAsyncThunk<
  ApiResponse<ClaimMetrics>,
  ClaimQueryParams
>('claims/fetchClaimMetrics', async (params, { rejectWithValue }) => {
  try {
    const response = await claimsApi.getClaimMetrics(params);
    return response;
  } catch (error) {
    return rejectWithValue(error.error?.message || 'Failed to fetch claim metrics');
  }
});