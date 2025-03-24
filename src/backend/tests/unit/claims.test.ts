import { ClaimsService } from '../../services/claims.service'; // Import the ClaimsService to be tested
import { ClaimValidationService } from '../../services/claims/claim-validation.service'; // Import ClaimValidationService for mocking
import { ClaimSubmissionService } from '../../services/claims/claim-submission.service'; // Import ClaimSubmissionService for mocking
import { ClaimTrackingService } from '../../services/claims/claim-tracking.service'; // Import ClaimTrackingService for mocking
import { ClaimModel } from '../../models/claim.model'; // Import ClaimModel for mocking
import { ClaimStatus, ClaimType, SubmissionMethod, DenialReason } from '../../types/claims.types'; // Import claim-related enums for assertions
import { UUID } from '../../types/common.types'; // Import UUID type for test parameters
import { NotFoundError } from '../../errors/not-found-error'; // Import NotFoundError for testing error scenarios
import { BusinessError } from '../../errors/business-error'; // Import BusinessError for testing business rule violations
import { mockClaim, mockClaimWithRelations, mockDraftClaim, mockSubmittedClaim, mockPendingClaim, mockPaidClaim, mockDeniedClaim, mockClaimSummaries } from '../fixtures/claims.fixtures'; // Import mock claim data for tests
import { mockClient } from '../fixtures/clients.fixtures'; // Import mock client data for tests
import { mockMedicaidPayer } from '../fixtures/payers.fixtures'; // Import mock payer data for tests
import { mockService } from '../fixtures/services.fixtures'; // Import mock service data for tests
import { mockAuthorization } from '../fixtures/authorizations.fixtures'; // Import mock authorization data for tests
import { mockUser } from '../fixtures/users.fixtures'; // Import mock user data for tests
import { mockNotification } from '../fixtures/notifications.fixtures'; // Import mock notification data for tests
import { mockFile } from '../fixtures/files.fixtures'; // Import mock file data for tests
import { mockProgram } from '../fixtures/programs.fixtures'; // Import mock program data for tests
import { mockServiceType } from '../fixtures/service-types.fixtures'; // Import mock service type data for tests
import { mockStaff } from '../fixtures/staff.fixtures'; // Import mock staff data for tests
import { mockFacility } from '../fixtures/facilities.fixtures'; // Import mock facility data for tests
import { mockPayment } from '../fixtures/payments.fixtures'; // Import mock payment data for tests
import { mockAdjustmentCode } from '../fixtures/adjustments.fixtures'; // Import mock adjustment code data for tests
import { mockDocument } from '../fixtures/documents.fixtures'; // Import mock document data for tests
import { mockClaimStatusHistory } from '../fixtures/claim-status-history.fixtures'; // Import mock claim status history data for tests
import { mockClaimService } from '../fixtures/claim-services.fixtures'; // Import mock claim service data for tests
import { mockClaimMetrics } from '../fixtures/claim-metrics.fixtures'; // Import mock claim metrics data for tests
import { mockClaimAgingReport } from '../fixtures/claim-aging-report.fixtures'; // Import mock claim aging report data for tests

// Mock the ClaimValidationService
jest.mock('../../services/claims/claim-validation.service');
const mockClaimValidationService = ClaimValidationService as jest.Mocked<typeof ClaimValidationService>;

// Mock the ClaimSubmissionService
jest.mock('../../services/claims/claim-submission.service');
const mockClaimSubmissionService = ClaimSubmissionService as jest.Mocked<typeof ClaimSubmissionService>;

// Mock the ClaimTrackingService
jest.mock('../../services/claims/claim-tracking.service');
const mockClaimTrackingService = ClaimTrackingService as jest.Mocked<typeof ClaimTrackingService>;

// Mock the ClaimModel
jest.mock('../../models/claim.model');
const mockClaimModel = ClaimModel as jest.Mocked<typeof ClaimModel>;

/**
 * Generates a consistent test user ID for tests
 * @returns A UUID to use as a test user ID
 */
function generateTestUserId(): UUID {
  return '123e4567-e89b-12d3-a456-426614174000';
}

describe('ClaimsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve a claim by ID', async () => {
    mockClaimModel.findById.mockResolvedValue(mockClaim);
    const claim = await ClaimsService.getClaim(mockClaim.id);
    expect(claim).toEqual(mockClaim);
    expect(mockClaimModel.findById).toHaveBeenCalledWith(mockClaim.id);
  });

  it('should throw NotFoundError if claim is not found by ID', async () => {
    mockClaimModel.findById.mockResolvedValue(null);
    await expect(ClaimsService.getClaim(mockClaim.id)).rejects.toThrow(NotFoundError);
    expect(mockClaimModel.findById).toHaveBeenCalledWith(mockClaim.id);
  });

  it('should retrieve a claim by claim number', async () => {
    mockClaimModel.findByClaimNumber.mockResolvedValue(mockClaim);
    mockClaimModel.findById.mockResolvedValue(mockClaim);
    const claim = await ClaimsService.getClaimByNumber(mockClaim.claimNumber);
    expect(claim).toEqual(mockClaim);
    expect(mockClaimModel.findByClaimNumber).toHaveBeenCalledWith(mockClaim.claimNumber);
  });

  it('should throw NotFoundError if claim is not found by claim number', async () => {
    mockClaimModel.findByClaimNumber.mockResolvedValue(null);
    await expect(ClaimsService.getClaimByNumber(mockClaim.claimNumber)).rejects.toThrow(NotFoundError);
    expect(mockClaimModel.findByClaimNumber).toHaveBeenCalledWith(mockClaim.claimNumber);
  });

  it('should validate a claim', async () => {
    mockClaimValidationService.validateClaim.mockResolvedValue({ claimId: mockClaim.id, isValid: true, errors: [], warnings: [] });
    const validationResult = await ClaimsService.validateClaim(mockClaim.id, generateTestUserId());
    expect(validationResult).toEqual({ claimId: mockClaim.id, isValid: true, errors: [], warnings: [] });
    expect(mockClaimValidationService.validateClaim).toHaveBeenCalledWith(mockClaim.id, generateTestUserId());
  });

  it('should batch validate claims', async () => {
    mockClaimValidationService.batchValidateClaims.mockResolvedValue({ results: [], isValid: true, totalErrors: 0, totalWarnings: 0 });
    const validationResult = await ClaimsService.batchValidateClaims([mockClaim.id], generateTestUserId());
    expect(validationResult).toEqual({ results: [], isValid: true, totalErrors: 0, totalWarnings: 0 });
    expect(mockClaimValidationService.batchValidateClaims).toHaveBeenCalledWith([mockClaim.id], generateTestUserId());
  });

  it('should submit a claim', async () => {
    mockClaimSubmissionService.submitClaim.mockResolvedValue(mockClaimWithRelations);
    const submissionData = { submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() };
    const submittedClaim = await ClaimsService.submitClaim(mockClaim.id, submissionData, generateTestUserId());
    expect(submittedClaim).toEqual(mockClaimWithRelations);
    expect(mockClaimSubmissionService.submitClaim).toHaveBeenCalledWith(mockClaim.id, submissionData, generateTestUserId());
  });

  it('should batch submit claims', async () => {
    mockClaimSubmissionService.batchSubmitClaims.mockResolvedValue({ totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], processedClaims: [mockClaim.id] });
    const batchData = { claimIds: [mockClaim.id], submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() };
    const submissionResult = await ClaimsService.batchSubmitClaims(batchData, generateTestUserId());
    expect(submissionResult).toEqual({ totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], processedClaims: [mockClaim.id] });
    expect(mockClaimSubmissionService.batchSubmitClaims).toHaveBeenCalledWith(batchData, generateTestUserId());
  });

  it('should validate and submit a claim', async () => {
    mockClaimSubmissionService.submitClaim.mockResolvedValue(mockClaimWithRelations);
    mockClaimValidationService.validateClaim.mockResolvedValue({ claimId: mockClaim.id, isValid: true, errors: [], warnings: [] });
    const submissionData = { submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() };
    const submittedClaim = await ClaimsService.validateAndSubmitClaim(mockClaim.id, submissionData, generateTestUserId());
    expect(submittedClaim).toEqual(mockClaimWithRelations);
    expect(mockClaimValidationService.validateClaim).toHaveBeenCalledWith(mockClaim.id, generateTestUserId());
    expect(mockClaimSubmissionService.submitClaim).toHaveBeenCalledWith(mockClaim.id, submissionData, generateTestUserId());
  });

  it('should batch validate and submit claims', async () => {
    mockClaimSubmissionService.batchSubmitClaims.mockResolvedValue({ totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], processedClaims: [mockClaim.id] });
    mockClaimValidationService.batchValidateClaims.mockResolvedValue({ results: [], isValid: true, totalErrors: 0, totalWarnings: 0 });
    const batchData = { claimIds: [mockClaim.id], submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() };
    const submissionResult = await ClaimsService.batchValidateAndSubmitClaims([mockClaim.id], batchData, generateTestUserId());
    expect(submissionResult).toEqual({ totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], processedClaims: [mockClaim.id] });
    expect(mockClaimValidationService.batchValidateClaims).toHaveBeenCalledWith([mockClaim.id], generateTestUserId());
    expect(mockClaimSubmissionService.batchSubmitClaims).toHaveBeenCalledWith(batchData, generateTestUserId());
  });

  it('should resubmit a claim', async () => {
    mockClaimSubmissionService.resubmitClaim.mockResolvedValue(mockClaimWithRelations);
    const submissionData = { submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() };
    const resubmittedClaim = await ClaimsService.resubmitClaim(mockClaim.id, submissionData, generateTestUserId());
    expect(resubmittedClaim).toEqual(mockClaimWithRelations);
    expect(mockClaimSubmissionService.resubmitClaim).toHaveBeenCalledWith(mockClaim.id, submissionData, generateTestUserId());
  });

  it('should update claim status', async () => {
    mockClaimTrackingService.updateClaimStatus.mockResolvedValue(mockClaimWithRelations);
    const statusData = { status: ClaimStatus.PAID, adjudicationDate: new Date().toISOString() };
    const updatedClaim = await ClaimsService.updateClaimStatus(mockClaim.id, statusData, generateTestUserId());
    expect(updatedClaim).toEqual(mockClaimWithRelations);
    expect(mockClaimTrackingService.updateClaimStatus).toHaveBeenCalledWith(mockClaim.id, statusData, generateTestUserId());
  });

  it('should get claim status', async () => {
    mockClaimTrackingService.getClaimStatus.mockResolvedValue({ status: ClaimStatus.PAID, lastUpdated: new Date().toISOString(), history: [] });
    const claimStatus = await ClaimsService.getClaimStatus(mockClaim.id);
    expect(claimStatus).toEqual({ status: ClaimStatus.PAID, lastUpdated: new Date().toISOString(), history: [] });
    expect(mockClaimTrackingService.getClaimStatus).toHaveBeenCalledWith(mockClaim.id);
  });
});