// jest v29.5.0
import { claimsApi } from '../../../api/claims.api';
import { apiClient } from '../../../api/client';
import { CLAIM_API_ENDPOINTS } from '../../../constants/claims.constants';
import { 
  ClaimStatus, 
  ClaimType, 
  SubmissionMethod, 
  Claim, 
  ClaimWithRelations, 
  ClaimSummary, 
  ClaimQueryParams, 
  CreateClaimDto, 
  UpdateClaimDto, 
  SubmitClaimDto, 
  BatchSubmitClaimsDto, 
  ClaimValidationResult, 
  ClaimBatchResult, 
  ClaimMetrics, 
  ClaimAgingReport, 
  ClaimTimelineEntry 
} from '../../../types/claims.types';
import { mockApiResponse, mockApiErrorResponse, mockPaginatedResponse } from '../../utils/mock-api';
import { createMockClaim, createMockClaimWithRelations, mockClaims } from '../../utils/mock-data';

// Mock the API client methods (get, post, put, del) to return controlled responses
beforeEach(() => {
  jest.spyOn(apiClient, 'get').mockImplementation(jest.fn());
  jest.spyOn(apiClient, 'post').mockImplementation(jest.fn());
  jest.spyOn(apiClient, 'put').mockImplementation(jest.fn());
  jest.spyOn(apiClient, 'del').mockImplementation(jest.fn());
});

// Reset all mocks to ensure test isolation
afterEach(() => {
  jest.clearAllMocks();
});

describe('Claims API', () => {
  it('getClaim - should fetch a claim by ID', async () => {
    // Arrange: Mock the API client get method to return a mock claim
    const mockClaim = createMockClaimWithRelations();
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockClaim));

    // Act: Call the getClaim function with a claim ID
    const claimId = mockClaim.id;
    const result = await claimsApi.getClaim(claimId);

    // Assert: Verify the API client was called with the correct endpoint
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_CLAIM.replace(':id', claimId)
    );

    // Assert: Verify the returned claim matches the mock data
    expect(result.data).toEqual(mockClaim);
  });

  it('getAllClaims - should fetch all claims with pagination', async () => {
    // Arrange: Mock the API client get method to return paginated claims
    const mockPaginatedClaims = mockPaginatedResponse(mockClaims);
    (apiClient.get as jest.Mock).mockResolvedValue(mockPaginatedClaims);

    // Act: Call the getAllClaims function with query parameters
    const queryParams: ClaimQueryParams = {
      pagination: { page: 1, pageSize: 10 },
      sort: { field: 'claimNumber', direction: 'asc' },
      filters: [],
      search: '',
      clientId: null,
      payerId: null,
      programId: null,
      facilityId: null,
      claimStatus: null,
      dateRange: null,
      claimType: null,
      includeServices: false,
      includeStatusHistory: false
    };
    const result = await claimsApi.getAllClaims(queryParams);

    // Assert: Verify the API client was called with the correct endpoint and parameters
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.BASE,
      queryParams
    );

    // Assert: Verify the returned claims match the mock data
    expect(result.data).toEqual(mockPaginatedClaims.data);
  });

  it('getClaimSummaries - should fetch claim summaries with pagination', async () => {
    // Arrange: Mock the API client get method to return paginated claim summaries
    const mockClaimSummaries = mockPaginatedResponse(mockClaims.map(claim => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      clientId: claim.clientId,
      clientName: 'Test Client',
      payerId: claim.payerId,
      payerName: 'Test Payer',
      claimStatus: claim.claimStatus,
      totalAmount: claim.totalAmount,
      serviceStartDate: claim.serviceStartDate,
      serviceEndDate: claim.serviceEndDate,
      submissionDate: claim.submissionDate,
      claimAge: 10
    })));
    (apiClient.get as jest.Mock).mockResolvedValue(mockClaimSummaries);

    // Act: Call the getClaimSummaries function with query parameters
    const queryParams: ClaimQueryParams = {
      pagination: { page: 1, pageSize: 10 },
      sort: { field: 'claimNumber', direction: 'asc' },
      filters: [],
      search: '',
      clientId: null,
      payerId: null,
      programId: null,
      facilityId: null,
      claimStatus: null,
      dateRange: null,
      claimType: null,
      includeServices: false,
      includeStatusHistory: false
    };
    const result = await claimsApi.getClaimSummaries(queryParams);

    // Assert: Verify the API client was called with the correct endpoint and parameters
    expect(apiClient.get).toHaveBeenCalledWith(
      `${CLAIM_API_ENDPOINTS.BASE}/summaries`,
      queryParams
    );

    // Assert: Verify the returned claim summaries match the mock data
    expect(result.data).toEqual(mockClaimSummaries.data);
  });

  it('createClaim - should create a new claim', async () => {
    // Arrange: Create mock claim data for submission
    const mockClaimData: CreateClaimDto = {
      clientId: 'client-uuid',
      payerId: 'payer-uuid',
      claimType: ClaimType.ORIGINAL,
      serviceIds: ['service-uuid-1', 'service-uuid-2'],
      originalClaimId: null,
      notes: 'Test claim'
    };

    // Arrange: Mock the API client post method to return a created claim
    const mockCreatedClaim = createMockClaim();
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockCreatedClaim));

    // Act: Call the createClaim function with the mock data
    const result = await claimsApi.createClaim(mockClaimData);

    // Assert: Verify the API client was called with the correct endpoint and data
    expect(apiClient.post).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.CREATE_CLAIM,
      mockClaimData
    );

    // Assert: Verify the returned claim matches the mock data
    expect(result.data).toEqual(mockCreatedClaim);
  });

  it('updateClaim - should update an existing claim', async () => {
    // Arrange: Create mock claim update data
    const mockClaimUpdateData: UpdateClaimDto = {
      payerId: 'new-payer-uuid',
      serviceIds: ['service-uuid-3', 'service-uuid-4'],
      notes: 'Updated test claim'
    };

    // Arrange: Mock the API client put method to return an updated claim
    const mockUpdatedClaim = createMockClaim();
    (apiClient.put as jest.Mock).mockResolvedValue(mockApiResponse(mockUpdatedClaim));

    // Act: Call the updateClaim function with a claim ID and update data
    const claimId = 'claim-uuid';
    const result = await claimsApi.updateClaim(claimId, mockClaimUpdateData);

    // Assert: Verify the API client was called with the correct endpoint and data
    expect(apiClient.put).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.UPDATE_CLAIM.replace(':id', claimId),
      mockClaimUpdateData
    );

    // Assert: Verify the returned claim matches the mock data
    expect(result.data).toEqual(mockUpdatedClaim);
  });

  it('validateClaim - should validate a claim', async () => {
    // Arrange: Mock the API client post method to return validation results
    const mockValidationResult: ClaimValidationResult = {
      claimId: 'claim-uuid',
      isValid: true,
      errors: [],
      warnings: []
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockValidationResult));

    // Act: Call the validateClaim function with a claim ID
    const claimId = 'claim-uuid';
    const result = await claimsApi.validateClaim(claimId);

    // Assert: Verify the API client was called with the correct endpoint
    expect(apiClient.post).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.VALIDATE_CLAIM.replace(':id', claimId)
    );

    // Assert: Verify the returned validation results match the mock data
    expect(result.data).toEqual(mockValidationResult);
  });

  it('batchValidateClaims - should validate multiple claims', async () => {
    // Arrange: Create an array of claim IDs for validation
    const claimIds = ['claim-uuid-1', 'claim-uuid-2', 'claim-uuid-3'];

    // Arrange: Mock the API client post method to return batch validation results
    const mockBatchValidationResults: ClaimValidationResult[] = claimIds.map(claimId => ({
      claimId,
      isValid: true,
      errors: [],
      warnings: []
    }));
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockBatchValidationResults));

    // Act: Call the batchValidateClaims function with the claim IDs
    const result = await claimsApi.batchValidateClaims(claimIds);

    // Assert: Verify the API client was called with the correct endpoint and data
    expect(apiClient.post).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.BATCH_VALIDATE,
      { claimIds }
    );

    // Assert: Verify the returned validation results match the mock data
    expect(result.data).toEqual(mockBatchValidationResults);
  });

  it('submitClaim - should submit a claim to a payer', async () => {
    // Arrange: Create mock submission data
    const mockSubmissionData: SubmitClaimDto = {
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: '2023-06-01',
      externalClaimId: 'external-claim-123',
      notes: 'Submitting claim'
    };

    // Arrange: Mock the API client post method to return a submitted claim
    const mockSubmittedClaim = createMockClaim();
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockSubmittedClaim));

    // Act: Call the submitClaim function with a claim ID and submission data
    const claimId = 'claim-uuid';
    const result = await claimsApi.submitClaim(claimId, mockSubmissionData);

    // Assert: Verify the API client was called with the correct endpoint and data
    expect(apiClient.post).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.SUBMIT_CLAIM.replace(':id', claimId),
      mockSubmissionData
    );

    // Assert: Verify the returned claim matches the mock data
    expect(result.data).toEqual(mockSubmittedClaim);
  });

  it('batchSubmitClaims - should submit multiple claims in a batch', async () => {
    // Arrange: Create mock batch submission data
    const mockBatchSubmissionData: BatchSubmitClaimsDto = {
      claimIds: ['claim-uuid-1', 'claim-uuid-2'],
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: '2023-06-01',
      notes: 'Submitting batch'
    };

    // Arrange: Mock the API client post method to return batch submission results
    const mockBatchResults: ClaimBatchResult = {
      totalProcessed: 2,
      successCount: 2,
      errorCount: 0,
      errors: [],
      processedClaims: ['claim-uuid-1', 'claim-uuid-2']
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockBatchResults));

    // Act: Call the batchSubmitClaims function with the batch data
    const result = await claimsApi.batchSubmitClaims(mockBatchSubmissionData);

    // Assert: Verify the API client was called with the correct endpoint and data
    expect(apiClient.post).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.BATCH_SUBMIT,
      mockBatchSubmissionData
    );

    // Assert: Verify the returned batch results match the mock data
    expect(result.data).toEqual(mockBatchResults);
  });

  it('validateAndSubmitClaim - should validate and submit a claim in one operation', async () => {
    // Arrange: Create mock submission data
    const mockSubmissionData: SubmitClaimDto = {
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: '2023-06-01',
      externalClaimId: 'external-claim-123',
      notes: 'Validating and submitting claim'
    };

    // Arrange: Mock the API client post method to return a validated and submitted claim
    const mockSubmittedClaim = createMockClaim();
    (apiClient.post as jest.Mock).mockResolvedValue(mockApiResponse(mockSubmittedClaim));

    // Act: Call the validateAndSubmitClaim function with a claim ID and submission data
    const claimId = 'claim-uuid';
    const result = await claimsApi.validateAndSubmitClaim(claimId, mockSubmissionData);

    // Assert: Verify the API client was called with the correct endpoint and data
    expect(apiClient.post).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.VALIDATE_AND_SUBMIT.replace(':id', claimId),
      mockSubmissionData
    );

    // Assert: Verify the returned claim matches the mock data
    expect(result.data).toEqual(mockSubmittedClaim);
  });

  it('getClaimStatus - should get the current status of a claim', async () => {
    // Arrange: Mock the API client get method to return claim status information
    const mockClaimStatus = {
      status: ClaimStatus.SUBMITTED,
      timestamp: '2023-06-01T12:00:00.000Z'
    };
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockClaimStatus));

    // Act: Call the getClaimStatus function with a claim ID
    const claimId = 'claim-uuid';
    const result = await claimsApi.getClaimStatus(claimId);

    // Assert: Verify the API client was called with the correct endpoint
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_STATUS.replace(':id', claimId)
    );

    // Assert: Verify the returned status information matches the mock data
    expect(result.data).toEqual(mockClaimStatus);
  });

  it('getClaimsByStatus - should get claims filtered by status', async () => {
    // Arrange: Mock the API client get method to return claims filtered by status
    const mockClaimsByStatus = mockPaginatedResponse(mockClaims);
    (apiClient.get as jest.Mock).mockResolvedValue(mockClaimsByStatus);

    // Act: Call the getClaimsByStatus function with a status and query parameters
    const status = ClaimStatus.SUBMITTED;
    const queryParams: ClaimQueryParams = {
      pagination: { page: 1, pageSize: 10 },
      sort: { field: 'claimNumber', direction: 'asc' },
      filters: [],
      search: '',
      clientId: null,
      payerId: null,
      programId: null,
      facilityId: null,
      claimStatus: null,
      dateRange: null,
      claimType: null,
      includeServices: false,
      includeStatusHistory: false
    };
    const result = await claimsApi.getClaimsByStatus(status, queryParams);

    // Assert: Verify the API client was called with the correct endpoint and parameters
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_BY_STATUS.replace(':status', status),
      queryParams
    );

    // Assert: Verify the returned claims match the mock data
    expect(result.data).toEqual(mockClaimsByStatus.data);
  });

  it('getClaimAging - should get an aging report for claims', async () => {
    // Arrange: Mock the API client get method to return claim aging report data
    const mockClaimAgingReport: ClaimAgingReport = {
      agingBuckets: [],
      totalAmount: 1000,
      totalClaims: 10,
      averageAge: 30
    };
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockClaimAgingReport));

    // Act: Call the getClaimAging function with query parameters
    const queryParams: ClaimQueryParams = {
      pagination: { page: 1, pageSize: 10 },
      sort: { field: 'claimNumber', direction: 'asc' },
      filters: [],
      search: '',
      clientId: null,
      payerId: null,
      programId: null,
      facilityId: null,
      claimStatus: null,
      dateRange: null,
      claimType: null,
      includeServices: false,
      includeStatusHistory: false
    };
    const result = await claimsApi.getClaimAging(queryParams);

    // Assert: Verify the API client was called with the correct endpoint and parameters
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_AGING,
      queryParams
    );

    // Assert: Verify the returned aging report matches the mock data
    expect(result.data).toEqual(mockClaimAgingReport);
  });

  it('getClaimTimeline - should get a detailed timeline of a claim\'s lifecycle', async () => {
    // Arrange: Mock the API client get method to return claim timeline entries
    const mockClaimTimeline: ClaimTimelineEntry[] = [
      {
        status: ClaimStatus.DRAFT,
        timestamp: '2023-05-01T10:00:00.000Z',
        notes: 'Claim created',
        userId: 'user-uuid',
        userName: 'Test User'
      }
    ];
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockClaimTimeline));

    // Act: Call the getClaimTimeline function with a claim ID
    const claimId = 'claim-uuid';
    const result = await claimsApi.getClaimTimeline(claimId);

    // Assert: Verify the API client was called with the correct endpoint
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_TIMELINE.replace(':id', claimId)
    );

    // Assert: Verify the returned timeline entries match the mock data
    expect(result.data).toEqual(mockClaimTimeline);
  });

  it('getClaimMetrics - should get claim metrics for dashboard and reporting', async () => {
    // Arrange: Mock the API client get method to return claim metrics data
    const mockClaimMetrics: ClaimMetrics = {
      totalClaims: 100,
      totalAmount: 50000,
      statusBreakdown: [],
      agingBreakdown: [],
      denialRate: 0.05,
      averageProcessingTime: 15,
      claimsByPayer: []
    };
    (apiClient.get as jest.Mock).mockResolvedValue(mockApiResponse(mockClaimMetrics));

    // Act: Call the getClaimMetrics function with query parameters
    const queryParams: ClaimQueryParams = {
      pagination: { page: 1, pageSize: 10 },
      sort: { field: 'claimNumber', direction: 'asc' },
      filters: [],
      search: '',
      clientId: null,
      payerId: null,
      programId: null,
      facilityId: null,
      claimStatus: null,
      dateRange: null,
      claimType: null,
      includeServices: false,
      includeStatusHistory: false
    };
    const result = await claimsApi.getClaimMetrics(queryParams);

    // Assert: Verify the API client was called with the correct endpoint and parameters
    expect(apiClient.get).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_METRICS,
      queryParams
    );

    // Assert: Verify the returned metrics match the mock data
    expect(result.data).toEqual(mockClaimMetrics);
  });

  it('deleteClaim - should delete a claim', async () => {
    // Arrange: Mock the API client del method to return a success response
    (apiClient.del as jest.Mock).mockResolvedValue(mockApiResponse(null));

    // Act: Call the deleteClaim function with a claim ID
    const claimId = 'claim-uuid';
    const result = await claimsApi.deleteClaim(claimId);

    // Assert: Verify the API client was called with the correct endpoint
    expect(apiClient.del).toHaveBeenCalledWith(
      CLAIM_API_ENDPOINTS.GET_CLAIM.replace(':id', claimId)
    );

    // Assert: Verify the returned response indicates success
    expect(result.status).toBe(200);
  });

  it('error handling - should handle API errors correctly', async () => {
    // Arrange: Mock the API client to return an error response
    const errorMessage = 'An error occurred';
    (apiClient.get as jest.Mock).mockRejectedValue(mockApiErrorResponse(errorMessage));

    // Act: Call a claims API function that would trigger the error
    try {
      await claimsApi.getClaim('claim-uuid');
    } catch (error: any) {
      // Assert: Verify the error is properly propagated
      expect(error.error.message).toEqual(errorMessage);

      // Assert: Verify the error contains the expected error details
      expect(error.status).toBe(400);
    }
  });
});