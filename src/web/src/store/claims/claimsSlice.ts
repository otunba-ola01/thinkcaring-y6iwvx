import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+

import { 
  ClaimSummary, 
  ClaimWithRelations, 
  ClaimQueryParams, 
  ClaimValidationResponse, 
  ClaimBatchResult, 
  ClaimMetrics, 
  ClaimStatus 
} from '../../types/claims.types';
import { PaginationMeta } from '../../types/api.types';
import { 
  fetchClaims, 
  fetchClaimById, 
  createClaim, 
  updateClaim, 
  validateClaims, 
  submitClaim, 
  batchSubmitClaims, 
  fetchClaimMetrics 
} from './claimsThunks';

/**
 * Enum-like type for tracking loading states
 */
export type LoadingState = 'IDLE' | 'LOADING' | 'SUCCEEDED' | 'FAILED';

/**
 * Interface defining the shape of the claims slice in the Redux store
 */
export interface ClaimState {
  claims: ClaimSummary[];
  selectedClaim: ClaimWithRelations | null;
  pagination: PaginationMeta;
  loading: LoadingState;
  error: string | null;
  filters: ClaimQueryParams;
  validationResults: ClaimValidationResponse | null;
  batchResults: ClaimBatchResult | null;
  metrics: ClaimMetrics | null;
}

/**
 * Initial state for the claims slice
 */
export const initialClaimsState: ClaimState = {
  claims: [],
  selectedClaim: null,
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  loading: 'IDLE',
  error: null,
  filters: {
    pagination: {
      page: 1,
      pageSize: 10
    },
    sort: {
      field: 'claimNumber',
      direction: 'desc'
    },
    filters: [],
    search: '',
    clientId: '',
    payerId: '',
    programId: '',
    facilityId: '',
    claimStatus: [],
    dateRange: {
      startDate: null,
      endDate: null
    },
    claimType: 'original',
    includeServices: false,
    includeStatusHistory: false
  },
  validationResults: null,
  batchResults: null,
  metrics: null
};

/**
 * Redux slice for Claims Management in the HCBS Revenue Management System
 * 
 * Manages the state for claims data, including lists, selected claim details,
 * loading states, errors, filters, validation results, and metrics.
 * Provides reducers for handling async thunk actions and synchronous state updates.
 */
const claimsSlice = createSlice({
  name: 'claims',
  initialState: initialClaimsState,
  reducers: {
    /**
     * Sets the currently selected claim
     */
    setSelectedClaim(state, action: PayloadAction<ClaimWithRelations>) {
      state.selectedClaim = action.payload;
    },
    
    /**
     * Clears the currently selected claim
     */
    clearSelectedClaim(state) {
      state.selectedClaim = null;
    },
    
    /**
     * Updates the claims filter criteria
     */
    setClaimsFilters(state, action: PayloadAction<Partial<ClaimQueryParams>>) {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    
    /**
     * Resets claims filters to default values
     */
    resetClaimsFilters(state) {
      state.filters = initialClaimsState.filters;
    },
    
    /**
     * Clears claim validation results
     */
    clearValidationResults(state) {
      state.validationResults = null;
    },
    
    /**
     * Clears batch processing results
     */
    clearBatchResults(state) {
      state.batchResults = null;
    },
    
    /**
     * Resets the entire claims state to initial values
     */
    resetClaimsState(state) {
      return initialClaimsState;
    }
  },
  extraReducers: (builder) => {
    // Handle fetchClaims thunk
    builder.addCase(fetchClaims.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
    });
    builder.addCase(fetchClaims.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.claims = action.payload.data;
      state.pagination = action.payload.meta;
    });
    builder.addCase(fetchClaims.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to fetch claims';
    });
    
    // Handle fetchClaimById thunk
    builder.addCase(fetchClaimById.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
    });
    builder.addCase(fetchClaimById.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.selectedClaim = action.payload.data;
    });
    builder.addCase(fetchClaimById.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to fetch claim details';
    });
    
    // Handle createClaim thunk
    builder.addCase(createClaim.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
    });
    builder.addCase(createClaim.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.selectedClaim = action.payload.data;
      
      // Add the newly created claim to the claims array if it's not there already
      const claimExists = state.claims.some(claim => claim.id === action.payload.data.id);
      if (!claimExists) {
        const newClaimSummary: ClaimSummary = {
          id: action.payload.data.id,
          claimNumber: action.payload.data.claimNumber,
          clientId: action.payload.data.clientId,
          clientName: `${action.payload.data.client.firstName} ${action.payload.data.client.lastName}`,
          payerId: action.payload.data.payerId,
          payerName: action.payload.data.payer.name,
          claimStatus: action.payload.data.claimStatus,
          totalAmount: action.payload.data.totalAmount,
          serviceStartDate: action.payload.data.serviceStartDate,
          serviceEndDate: action.payload.data.serviceEndDate,
          submissionDate: action.payload.data.submissionDate,
          claimAge: 0 // This will be calculated on the server or in a selector
        };
        
        state.claims.unshift(newClaimSummary);
        state.pagination.totalItems += 1;
      }
    });
    builder.addCase(createClaim.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to create claim';
    });
    
    // Handle updateClaim thunk
    builder.addCase(updateClaim.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
    });
    builder.addCase(updateClaim.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.selectedClaim = action.payload.data;
      
      // Update the claim in the claims array if it exists
      const claimIndex = state.claims.findIndex(claim => claim.id === action.payload.data.id);
      if (claimIndex !== -1) {
        const updatedClaim: ClaimSummary = {
          id: action.payload.data.id,
          claimNumber: action.payload.data.claimNumber,
          clientId: action.payload.data.clientId,
          clientName: `${action.payload.data.client.firstName} ${action.payload.data.client.lastName}`,
          payerId: action.payload.data.payerId,
          payerName: action.payload.data.payer.name,
          claimStatus: action.payload.data.claimStatus,
          totalAmount: action.payload.data.totalAmount,
          serviceStartDate: action.payload.data.serviceStartDate,
          serviceEndDate: action.payload.data.serviceEndDate,
          submissionDate: action.payload.data.submissionDate,
          claimAge: state.claims[claimIndex].claimAge
        };
        
        state.claims[claimIndex] = updatedClaim;
      }
    });
    builder.addCase(updateClaim.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to update claim';
    });
    
    // Handle validateClaims thunk
    builder.addCase(validateClaims.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
      state.validationResults = null;
    });
    builder.addCase(validateClaims.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.validationResults = action.payload.data;
    });
    builder.addCase(validateClaims.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to validate claims';
    });
    
    // Handle submitClaim thunk
    builder.addCase(submitClaim.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
    });
    builder.addCase(submitClaim.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.selectedClaim = action.payload.data;
      
      // Update the claim in the claims array if it exists
      const claimIndex = state.claims.findIndex(claim => claim.id === action.payload.data.id);
      if (claimIndex !== -1) {
        const updatedClaim: ClaimSummary = {
          ...state.claims[claimIndex],
          claimStatus: action.payload.data.claimStatus,
          submissionDate: action.payload.data.submissionDate
        };
        
        state.claims[claimIndex] = updatedClaim;
      }
    });
    builder.addCase(submitClaim.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to submit claim';
    });
    
    // Handle batchSubmitClaims thunk
    builder.addCase(batchSubmitClaims.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
      state.batchResults = null;
    });
    builder.addCase(batchSubmitClaims.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.batchResults = action.payload.data;
      
      // If we have successfully processed claims, we should update their status in the list
      if (action.payload.data.processedClaims && action.payload.data.processedClaims.length > 0) {
        state.claims = state.claims.map(claim => {
          if (action.payload.data.processedClaims.includes(claim.id)) {
            return {
              ...claim,
              claimStatus: ClaimStatus.SUBMITTED,
              submissionDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
            };
          }
          return claim;
        });
      }
    });
    builder.addCase(batchSubmitClaims.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to submit batch claims';
    });
    
    // Handle fetchClaimMetrics thunk
    builder.addCase(fetchClaimMetrics.pending, (state) => {
      state.loading = 'LOADING';
      state.error = null;
    });
    builder.addCase(fetchClaimMetrics.fulfilled, (state, action) => {
      state.loading = 'SUCCEEDED';
      state.metrics = action.payload.data;
    });
    builder.addCase(fetchClaimMetrics.rejected, (state, action) => {
      state.loading = 'FAILED';
      state.error = action.payload as string || 'Failed to fetch claim metrics';
    });
  }
});

// Export the action creators
export const claimsActions = claimsSlice.actions;

// Export the reducer
export default claimsSlice.reducer;