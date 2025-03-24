import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import claimsReducer, { claimsActions, initialClaimsState } from '../../../../store/claims/claimsSlice';
import { 
  fetchClaims, 
  fetchClaimById, 
  createClaim, 
  updateClaim, 
  validateClaims, 
  submitClaim,
  batchSubmitClaims,
  fetchClaimMetrics 
} from '../../../../store/claims/claimsThunks';
import { ClaimStatus } from '../../../../types/claims.types';
import { 
  mockClaimSummaries, 
  mockClaimWithRelations, 
  mockClaimValidationResponse, 
  mockClaimBatchResult, 
  mockClaimMetrics 
} from '../../../../mocks/data/claims';

describe('Claims Slice', () => {
  // Test initial state
  test('should return the initial state', () => {
    expect(claimsReducer(undefined, { type: '' })).toEqual(initialClaimsState);
  });

  // Test synchronous actions
  test('should handle setSelectedClaim', () => {
    const claim = mockClaimWithRelations[0];
    const newState = claimsReducer(initialClaimsState, claimsActions.setSelectedClaim(claim));
    expect(newState.selectedClaim).toEqual(claim);
  });

  test('should handle clearSelectedClaim', () => {
    const initialStateWithSelected = {
      ...initialClaimsState,
      selectedClaim: mockClaimWithRelations[0]
    };
    const newState = claimsReducer(initialStateWithSelected, claimsActions.clearSelectedClaim());
    expect(newState.selectedClaim).toBeNull();
  });

  test('should handle setClaimsFilters', () => {
    const filters = {
      claimStatus: [ClaimStatus.PAID, ClaimStatus.PENDING],
      clientId: 'client-123'
    };
    const newState = claimsReducer(initialClaimsState, claimsActions.setClaimsFilters(filters));
    expect(newState.filters).toEqual({
      ...initialClaimsState.filters,
      ...filters
    });
  });

  test('should handle resetClaimsFilters', () => {
    const initialStateWithFilters = {
      ...initialClaimsState,
      filters: {
        ...initialClaimsState.filters,
        claimStatus: [ClaimStatus.PAID],
        clientId: 'client-123'
      }
    };
    const newState = claimsReducer(initialStateWithFilters, claimsActions.resetClaimsFilters());
    expect(newState.filters).toEqual(initialClaimsState.filters);
  });

  test('should handle clearValidationResults', () => {
    const initialStateWithValidation = {
      ...initialClaimsState,
      validationResults: mockClaimValidationResponse
    };
    const newState = claimsReducer(initialStateWithValidation, claimsActions.clearValidationResults());
    expect(newState.validationResults).toBeNull();
  });

  test('should handle clearBatchResults', () => {
    const initialStateWithBatch = {
      ...initialClaimsState,
      batchResults: mockClaimBatchResult
    };
    const newState = claimsReducer(initialStateWithBatch, claimsActions.clearBatchResults());
    expect(newState.batchResults).toBeNull();
  });

  test('should handle resetClaimsState', () => {
    const modifiedState = {
      ...initialClaimsState,
      selectedClaim: mockClaimWithRelations[0],
      validationResults: mockClaimValidationResponse,
      loading: 'SUCCEEDED' as const
    };
    const newState = claimsReducer(modifiedState, claimsActions.resetClaimsState());
    expect(newState).toEqual(initialClaimsState);
  });
});

describe('Claims Async Thunks', () => {
  // fetchClaims tests
  test('should handle fetchClaims.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaims.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
  });

  test('should handle fetchClaims.fulfilled', () => {
    const payload = {
      data: mockClaimSummaries,
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: mockClaimSummaries.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaims.fulfilled.type,
      payload
    });
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.claims).toEqual(payload.data);
    expect(state.pagination).toEqual(payload.meta);
  });

  test('should handle fetchClaims.rejected', () => {
    const error = 'Failed to fetch claims';
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaims.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // fetchClaimById tests
  test('should handle fetchClaimById.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaimById.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
  });

  test('should handle fetchClaimById.fulfilled', () => {
    const payload = {
      data: mockClaimWithRelations[0]
    };
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaimById.fulfilled.type,
      payload
    });
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.selectedClaim).toEqual(payload.data);
  });

  test('should handle fetchClaimById.rejected', () => {
    const error = 'Failed to fetch claim details';
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaimById.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // createClaim tests
  test('should handle createClaim.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: createClaim.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
  });

  test('should handle createClaim.fulfilled', () => {
    const newClaim = mockClaimWithRelations[0];
    const payload = {
      data: newClaim
    };
    const state = claimsReducer(initialClaimsState, {
      type: createClaim.fulfilled.type,
      payload
    });
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.selectedClaim).toEqual(payload.data);
    // Check that the claim was added to the claims array
    expect(state.claims.some(claim => claim.id === newClaim.id)).toBeTruthy();
    // Check claim summary fields are correctly derived from the claim with relations
    const addedClaim = state.claims.find(claim => claim.id === newClaim.id);
    expect(addedClaim?.clientName).toBe(`${newClaim.client.firstName} ${newClaim.client.lastName}`);
    expect(addedClaim?.payerName).toBe(newClaim.payer.name);
  });

  test('should handle createClaim.rejected', () => {
    const error = 'Failed to create claim';
    const state = claimsReducer(initialClaimsState, {
      type: createClaim.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // updateClaim tests
  test('should handle updateClaim.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: updateClaim.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
  });

  test('should handle updateClaim.fulfilled', () => {
    // First, set up initial state with some claims
    const existingClaim = mockClaimSummaries[0];
    const stateWithClaims = {
      ...initialClaimsState,
      claims: [existingClaim, ...mockClaimSummaries.slice(1)]
    };
    
    // Create updated claim
    const updatedClaim = {
      ...mockClaimWithRelations[0],
      id: existingClaim.id,
      totalAmount: 2000,
      notes: 'Updated notes'
    };
    
    const payload = {
      data: updatedClaim
    };
    
    const state = claimsReducer(stateWithClaims, {
      type: updateClaim.fulfilled.type,
      payload
    });
    
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.selectedClaim).toEqual(payload.data);
    
    // Find the updated claim in the claims array
    const claimInState = state.claims.find(claim => claim.id === updatedClaim.id);
    expect(claimInState).toBeDefined();
    expect(claimInState?.totalAmount).toBe(updatedClaim.totalAmount);
  });

  test('should handle updateClaim.rejected', () => {
    const error = 'Failed to update claim';
    const state = claimsReducer(initialClaimsState, {
      type: updateClaim.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // validateClaims tests
  test('should handle validateClaims.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: validateClaims.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
    expect(state.validationResults).toBeNull();
  });

  test('should handle validateClaims.fulfilled', () => {
    const payload = {
      data: mockClaimValidationResponse
    };
    const state = claimsReducer(initialClaimsState, {
      type: validateClaims.fulfilled.type,
      payload
    });
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.validationResults).toEqual(payload.data);
  });

  test('should handle validateClaims.rejected', () => {
    const error = 'Failed to validate claims';
    const state = claimsReducer(initialClaimsState, {
      type: validateClaims.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // submitClaim tests
  test('should handle submitClaim.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: submitClaim.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
  });

  test('should handle submitClaim.fulfilled', () => {
    // First, set up initial state with some claims
    const existingClaim = mockClaimSummaries[0];
    const stateWithClaims = {
      ...initialClaimsState,
      claims: [existingClaim, ...mockClaimSummaries.slice(1)]
    };
    
    // Create submitted claim
    const submittedClaim = {
      ...mockClaimWithRelations[0],
      id: existingClaim.id,
      claimStatus: ClaimStatus.SUBMITTED,
      submissionDate: '2023-06-01'
    };
    
    const payload = {
      data: submittedClaim
    };
    
    const state = claimsReducer(stateWithClaims, {
      type: submitClaim.fulfilled.type,
      payload
    });
    
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.selectedClaim).toEqual(payload.data);
    
    // Find the submitted claim in the claims array
    const claimInState = state.claims.find(claim => claim.id === submittedClaim.id);
    expect(claimInState).toBeDefined();
    expect(claimInState?.claimStatus).toBe(ClaimStatus.SUBMITTED);
    expect(claimInState?.submissionDate).toBe(submittedClaim.submissionDate);
  });

  test('should handle submitClaim.rejected', () => {
    const error = 'Failed to submit claim';
    const state = claimsReducer(initialClaimsState, {
      type: submitClaim.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // batchSubmitClaims tests
  test('should handle batchSubmitClaims.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: batchSubmitClaims.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
    expect(state.batchResults).toBeNull();
  });

  test('should handle batchSubmitClaims.fulfilled', () => {
    // First, set up initial state with some claims
    const stateWithClaims = {
      ...initialClaimsState,
      claims: [...mockClaimSummaries]
    };
    
    const payload = {
      data: mockClaimBatchResult
    };
    
    const state = claimsReducer(stateWithClaims, {
      type: batchSubmitClaims.fulfilled.type,
      payload
    });
    
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.batchResults).toEqual(payload.data);
    
    // Verify that processed claims status is updated to SUBMITTED
    const processedClaimIds = payload.data.processedClaims;
    processedClaimIds.forEach(id => {
      const claim = state.claims.find(c => c.id === id);
      if (claim) {
        expect(claim.claimStatus).toBe(ClaimStatus.SUBMITTED);
        expect(claim.submissionDate).toBeDefined();
      }
    });
  });

  test('should handle batchSubmitClaims.rejected', () => {
    const error = 'Failed to submit batch claims';
    const state = claimsReducer(initialClaimsState, {
      type: batchSubmitClaims.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });

  // fetchClaimMetrics tests
  test('should handle fetchClaimMetrics.pending', () => {
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaimMetrics.pending.type
    });
    expect(state.loading).toBe('LOADING');
    expect(state.error).toBeNull();
  });

  test('should handle fetchClaimMetrics.fulfilled', () => {
    const payload = {
      data: mockClaimMetrics
    };
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaimMetrics.fulfilled.type,
      payload
    });
    expect(state.loading).toBe('SUCCEEDED');
    expect(state.metrics).toEqual(payload.data);
  });

  test('should handle fetchClaimMetrics.rejected', () => {
    const error = 'Failed to fetch claim metrics';
    const state = claimsReducer(initialClaimsState, {
      type: fetchClaimMetrics.rejected.type,
      payload: error
    });
    expect(state.loading).toBe('FAILED');
    expect(state.error).toBe(error);
  });
});

describe('Claims Integration Tests', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        claims: claimsReducer
      }
    });
  });
  
  test('should dispatch actions and update state correctly', () => {
    // Dispatch setSelectedClaim action
    store.dispatch(claimsActions.setSelectedClaim(mockClaimWithRelations[0]));
    expect(store.getState().claims.selectedClaim).toEqual(mockClaimWithRelations[0]);
    
    // Dispatch clearSelectedClaim action
    store.dispatch(claimsActions.clearSelectedClaim());
    expect(store.getState().claims.selectedClaim).toBeNull();
    
    // Dispatch setClaimsFilters action
    const filters = {
      claimStatus: [ClaimStatus.PAID, ClaimStatus.PENDING],
      clientId: 'client-123'
    };
    store.dispatch(claimsActions.setClaimsFilters(filters));
    expect(store.getState().claims.filters).toEqual({
      ...initialClaimsState.filters,
      ...filters
    });
    
    // Dispatch resetClaimsFilters action
    store.dispatch(claimsActions.resetClaimsFilters());
    expect(store.getState().claims.filters).toEqual(initialClaimsState.filters);
  });
  
  test('should handle async thunks with store dispatch', async () => {
    // Simulate fetchClaims.pending
    store.dispatch({ type: fetchClaims.pending.type });
    expect(store.getState().claims.loading).toBe('LOADING');
    
    // Simulate fetchClaims.fulfilled
    const claimsResponse = {
      data: mockClaimSummaries,
      meta: {
        page: 1,
        pageSize: 10,
        totalItems: mockClaimSummaries.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
    
    store.dispatch({ 
      type: fetchClaims.fulfilled.type, 
      payload: claimsResponse 
    });
    expect(store.getState().claims.loading).toBe('SUCCEEDED');
    expect(store.getState().claims.claims).toEqual(claimsResponse.data);
    
    // Simulate fetchClaimById.fulfilled
    const claimByIdResponse = {
      data: mockClaimWithRelations[0]
    };
    
    store.dispatch({ 
      type: fetchClaimById.fulfilled.type, 
      payload: claimByIdResponse 
    });
    expect(store.getState().claims.selectedClaim).toEqual(claimByIdResponse.data);
    
    // Simulate validateClaims.fulfilled
    const validationResponse = {
      data: mockClaimValidationResponse
    };
    
    store.dispatch({ 
      type: validateClaims.fulfilled.type, 
      payload: validationResponse 
    });
    expect(store.getState().claims.validationResults).toEqual(validationResponse.data);
  });
});