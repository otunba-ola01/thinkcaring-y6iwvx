import { useState, useCallback, useEffect, useMemo } from 'react'; // react v18.2.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux v8.1.2

import useApiRequest from './useApiRequest';
import useFilter from './useFilter';
import usePagination from './usePagination';
import useSort from './useSort';
import useToast from './useToast';

import { API_ENDPOINTS } from '../constants/api.constants';
import { DEFAULT_CLAIM_FILTERS, CLAIM_STATUS_LABELS, CLAIM_BATCH_SIZE_LIMIT } from '../constants/claims.constants';
import {
  Claim,
  ClaimWithRelations,
  ClaimSummary,
  ClaimStatus,
  ClaimQueryParams,
  ClaimListResponse,
  ClaimValidationResponse,
  ClaimBatchResult,
  CreateClaimDto,
  UpdateClaimDto,
  SubmitClaimDto,
  BatchSubmitClaimsDto,
  UpdateClaimStatusDto,
  ClaimMetrics,
  ClaimLifecycle
} from '../types/claims.types';
import { UUID, PaginationParams, SortParams, FilterParams, LoadingState, ApiResponse } from '../types/common.types';
import { FilterConfig, FilterType } from '../types/ui.types';
import * as claimsApi from '../api/claims.api';
import {
  fetchClaims,
  fetchClaimById,
  createClaim as createClaimAction,
  updateClaim as updateClaimAction,
  validateClaims as validateClaimsAction,
  submitClaim as submitClaimAction,
  batchSubmitClaims as batchSubmitClaimsAction,
  fetchClaimMetrics as fetchClaimMetricsAction
} from '../store/claims/claimsThunks';
import {
  setClaimsFilter,
  resetClaimsFilter,
  clearSelectedClaim,
  clearValidationResults,
  clearBatchResults
} from '../store/claims/claimsSlice';
import {
  selectClaims,
  selectSelectedClaim,
  selectClaimsPagination,
  selectClaimsLoading,
  selectClaimsError,
  selectClaimsFilters,
  selectClaimMetrics,
  selectValidationResults,
  selectBatchResults,
  selectIsClaimsLoading,
  selectHasClaimsError,
  selectClaimStatusCounts,
  selectTotalClaimsAmount
} from '../store/claims/claimsSelectors';

/**
 * Interface for options passed to useClaims hook
 */
export interface UseClaimsOptions {
  initialFilters?: Partial<ClaimQueryParams>;
  initialSort?: SortParams[];
  initialPage?: number;
  initialPageSize?: number;
  syncWithUrl?: boolean;
  autoFetch?: boolean;
  clientId?: UUID | undefined;
  payerId?: UUID | undefined;
}

/**
 * Interface for the result returned by useClaims hook
 */
export interface UseClaimsResult {
  claims: ClaimSummary[];
  selectedClaim: ClaimWithRelations | null;
  loading: LoadingState;
  error: string | null;
  filterState: any; // TODO: Replace 'any' with the correct type from useFilter
  paginationState: any; // TODO: Replace 'any' with the correct type from usePagination
  sortState: any; // TODO: Replace 'any' with the correct type from useSort
  fetchClaims: () => Promise<void>;
  fetchClaimById: (id: UUID) => Promise<ClaimWithRelations | null>;
  createClaim: (data: CreateClaimDto) => Promise<Claim | null>;
  updateClaim: (id: UUID, data: UpdateClaimDto) => Promise<Claim | null>;
  validateClaims: (claimIds: UUID[]) => Promise<ClaimValidationResponse | null>;
  submitClaim: (id: UUID, data: SubmitClaimDto) => Promise<Claim | null>;
  batchSubmitClaims: (data: BatchSubmitClaimsDto) => Promise<ClaimBatchResult | null>;
  updateClaimStatus: (id: UUID, data: UpdateClaimStatusDto) => Promise<Claim | null>;
  fetchClaimLifecycle: (id: UUID) => Promise<ClaimLifecycle | null>;
  fetchClaimMetrics: () => Promise<ClaimMetrics | null>;
  fetchClaimAging: () => Promise<any | null>; // TODO: Replace 'any' with the correct type
  appealClaim: (id: UUID, appealData: { appealReason: string; supportingDocuments?: UUID[] }) => Promise<Claim | null>;
  voidClaim: (id: UUID, notes?: string) => Promise<Claim | null>;
  clearSelectedClaim: () => void;
  clearValidationResults: () => void;
  clearBatchResults: () => void;
  resetFilters: () => void;
  claimMetrics: ClaimMetrics | null;
  validationResults: ClaimValidationResponse | null;
  batchResults: ClaimBatchResult | null;
  totalItems: number;
  totalPages: number;
  statusCounts: Record<ClaimStatus, number>;
  totalAmount: number;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * A custom hook that provides comprehensive functionality for managing claims
 */
export function useClaims(options: UseClaimsOptions): UseClaimsResult {
  // Initialize Redux dispatch and selector hooks
  const dispatch = useDispatch();
  
  // Extract claim state from Redux store using selectors
  const claims = useSelector(selectClaims);
  const selectedClaim = useSelector(selectSelectedClaim);
  const pagination = useSelector(selectClaimsPagination);
  const loading = useSelector(selectClaimsLoading);
  const error = useSelector(selectClaimsError);
  const filters = useSelector(selectClaimsFilters);
  const claimMetrics = useSelector(selectClaimMetrics);
  const validationResults = useSelector(selectValidationResults);
  const batchResults = useSelector(selectBatchResults);
  const isLoading = useSelector(selectIsClaimsLoading);
  const hasError = useSelector(selectHasClaimsError);
  const statusCounts = useSelector(selectClaimStatusCounts);
    const totalAmount = useSelector(selectTotalClaimsAmount);

  // Set up filter configuration for claims filtering
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: FilterType.MULTI_SELECT,
      field: 'claimStatus',
      operator: null,
      options: Object.entries(CLAIM_STATUS_LABELS).map(([key, label]) => ({
        value: key,
        label: label,
      })),
    },
  ], []);

  // Initialize filter state using useFilter hook with default claim filters
  const filterState = useFilter({
    filterConfigs,
    initialFilters: options.initialFilters || DEFAULT_CLAIM_FILTERS,
    onFilterChange: (filterParams: FilterParams[]) => {
      dispatch(setClaimsFilter({ filters: filterParams }));
    },
    syncWithUrl: options.syncWithUrl,
  });

  // Initialize pagination state using usePagination hook
  const paginationState = usePagination({
    initialPage: options.initialPage,
    initialPageSize: options.initialPageSize,
    syncWithUrl: options.syncWithUrl,
  });

  // Initialize sort state using useSort hook
  const sortState = useSort({
    initialSort: options.initialSort,
    syncWithUrl: options.syncWithUrl,
  });

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Set up API request hooks for direct API operations not handled by Redux
  const { execute: executeUpdateClaimStatus } = useApiRequest<Claim>({ url: API_ENDPOINTS.CLAIMS.SUBMIT, method: 'PUT' });
  const { execute: executeFetchClaimLifecycle } = useApiRequest<ClaimLifecycle>({ url: API_ENDPOINTS.CLAIMS.GET_LIFECYCLE, method: 'GET' });
  const { execute: executeFetchClaimAging } = useApiRequest<any>({ url: API_ENDPOINTS.CLAIMS.GET_AGING, method: 'GET' }); // TODO: Replace 'any' with the correct type
  const { execute: executeAppealClaim } = useApiRequest<Claim>({ url: API_ENDPOINTS.CLAIMS.APPEAL, method: 'POST' });
  const { execute: executeVoidClaim } = useApiRequest<Claim>({ url: API_ENDPOINTS.CLAIMS.VOID, method: 'POST' });

  // Define fetchClaims function to dispatch fetchClaims thunk with current filters, pagination, and sorting
  const fetchClaims = useCallback(async () => {
    const params: ClaimQueryParams = {
      pagination: paginationState.paginationParams,
      sort: sortState.getSortParams(),
      filters: filterState.filterParams,
      search: filters.search,
      clientId: options.clientId,
      payerId: options.payerId,
      programId: filters.programId,
      facilityId: filters.facilityId,
      claimStatus: filters.claimStatus,
      dateRange: filters.dateRange,
      claimType: filters.claimType,
      includeServices: filters.includeServices,
      includeStatusHistory: filters.includeStatusHistory,
    };
    dispatch(fetchClaims(params));
  }, [dispatch, paginationState.paginationParams, sortState.getSortParams, filterState.filterParams, filters, options.clientId, options.payerId]);

  // Define fetchClaimById function to dispatch fetchClaimById thunk for a specific claim
  const fetchClaimById = useCallback(async (id: UUID): Promise<ClaimWithRelations | null> => {
    try {
      const response = await dispatch(fetchClaimById(id)).unwrap();
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, toast]);

  // Define createClaim function to dispatch createClaimAction thunk for creating a new claim
  const createClaim = useCallback(async (data: CreateClaimDto): Promise<Claim | null> => {
    try {
      const response = await dispatch(createClaimAction(data)).unwrap();
      toast.success('Claim created successfully');
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, toast]);

  // Define updateClaim function to dispatch updateClaimAction thunk for updating an existing claim
  const updateClaim = useCallback(async (id: UUID, data: UpdateClaimDto): Promise<Claim | null> => {
    try {
      const response = await dispatch(updateClaimAction({ id, data })).unwrap();
      toast.success('Claim updated successfully');
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, toast]);

  // Define validateClaims function to dispatch validateClaimsAction thunk for validating claims
  const validateClaims = useCallback(async (claimIds: UUID[]): Promise<ClaimValidationResponse | null> => {
    try {
      const response = await dispatch(validateClaimsAction(claimIds)).unwrap();
      toast.success('Claims validated successfully');
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, toast]);

  // Define submitClaim function to dispatch submitClaimAction thunk for submitting a claim
  const submitClaim = useCallback(async (id: UUID, data: SubmitClaimDto): Promise<Claim | null> => {
    try {
      const response = await dispatch(submitClaimAction({ id, data })).unwrap();
      toast.success('Claim submitted successfully');
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, toast]);

  // Define batchSubmitClaims function to dispatch batchSubmitClaimsAction thunk for batch submission
  const batchSubmitClaims = useCallback(async (data: BatchSubmitClaimsDto): Promise<ClaimBatchResult | null> => {
    try {
      const response = await dispatch(batchSubmitClaimsAction(data)).unwrap();
      toast.success('Claims submitted successfully');
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, toast]);

  // Define updateClaimStatus function to call API directly for updating claim status
  const updateClaimStatus = useCallback(async (id: UUID, data: UpdateClaimStatusDto): Promise<Claim | null> => {
    try {
      const response = await executeUpdateClaimStatus({ url: API_ENDPOINTS.CLAIMS.SUBMIT.replace(':id', id), method: 'PUT', data });
      toast.success('Claim status updated successfully');
      return response;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [executeUpdateClaimStatus, toast]);

  // Define fetchClaimLifecycle function to call API directly for retrieving claim lifecycle
  const fetchClaimLifecycle = useCallback(async (id: UUID): Promise<ClaimLifecycle | null> => {
    try {
      const response = await executeFetchClaimLifecycle({ url: API_ENDPOINTS.CLAIMS.GET_LIFECYCLE.replace(':id', id), method: 'GET' });
      return response;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [executeFetchClaimLifecycle, toast]);

  // Define fetchClaimMetrics function to dispatch fetchClaimMetricsAction thunk for metrics
  const fetchClaimMetrics = useCallback(async (): Promise<ClaimMetrics | null> => {
    try {
      const response = await dispatch(fetchClaimMetricsAction(filters)).unwrap();
      return response.data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [dispatch, filters, toast]);

  // Define fetchClaimAging function to call API directly for claim aging reports
  const fetchClaimAging = useCallback(async (): Promise<any | null> => { // TODO: Replace 'any' with the correct type
    try {
      const response = await executeFetchClaimAging({ url: API_ENDPOINTS.CLAIMS.GET_AGING, method: 'GET' });
      return response;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [executeFetchClaimAging, toast]);

  // Define appealClaim function to call API directly for appealing a denied claim
  const appealClaim = useCallback(async (id: UUID, appealData: { appealReason: string; supportingDocuments?: UUID[] }): Promise<Claim | null> => {
    try {
      const response = await executeAppealClaim({ url: API_ENDPOINTS.CLAIMS.APPEAL.replace(':id', id), method: 'POST', data: appealData });
      toast.success('Claim appealed successfully');
      return response;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [executeAppealClaim, toast]);

  // Define voidClaim function to call API directly for voiding a claim
  const voidClaim = useCallback(async (id: UUID, notes?: string): Promise<Claim | null> => {
    try {
      const response = await executeVoidClaim({ url: API_ENDPOINTS.CLAIMS.VOID.replace(':id', id), method: 'POST', data: { notes } });
      toast.success('Claim voided successfully');
      return response;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    }
  }, [executeVoidClaim, toast]);

  // Define clearSelectedClaim function to dispatch clearSelectedClaim action
  const clearSelectedClaim = useCallback(() => {
    dispatch(clearSelectedClaim());
  }, [dispatch]);

  // Define clearValidationResults function to dispatch clearValidationResults action
  const clearValidationResults = useCallback(() => {
    dispatch(clearValidationResults());
  }, [dispatch]);

  // Define clearBatchResults function to dispatch clearBatchResults action
  const clearBatchResults = useCallback(() => {
    dispatch(clearBatchResults());
  }, [dispatch]);

  // Define resetFilters function to dispatch resetClaimsFilter action
  const resetFilters = useCallback(() => {
    dispatch(resetClaimsFilter());
  }, [dispatch]);

  // Use useEffect to dispatch fetchClaims when filters, pagination, or sort changes and autoFetch is true
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchClaims();
    }
  }, [fetchClaims, options.autoFetch]);

  // Return claims state and operations in a structured object
  return {
    claims,
    selectedClaim,
    loading,
    error,
    filterState,
    paginationState,
    sortState,
    fetchClaims,
    fetchClaimById,
    createClaim,
    updateClaim,
    validateClaims,
    submitClaim,
    batchSubmitClaims,
    updateClaimStatus,
    fetchClaimLifecycle,
    fetchClaimMetrics,
    fetchClaimAging,
    appealClaim,
    voidClaim,
    clearSelectedClaim,
    clearValidationResults,
    clearBatchResults,
    resetFilters,
    claimMetrics,
    validationResults,
    batchResults,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    statusCounts,
    totalAmount,
    isLoading,
    hasError,
  };
}