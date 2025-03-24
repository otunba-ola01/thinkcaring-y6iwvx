import { BillingService } from '../../services/billing.service'; // Import the BillingService to be tested
import { BillingValidationService } from '../../services/billing/billing-validation.service'; // Import BillingValidationService for mocking
import { DocumentationValidationService } from '../../services/billing/documentation-validation.service'; // Import DocumentationValidationService for mocking
import { AuthorizationTrackingService } from '../../services/billing/authorization-tracking.service'; // Import AuthorizationTrackingService for mocking
import { ServiceToClaimService } from '../../services/billing/service-to-claim.service'; // Import ServiceToClaimService for mocking
import { ElectronicSubmissionService } from '../../services/billing/electronic-submission.service'; // Import ElectronicSubmissionService for mocking
import { ServiceModel } from '../../models/service.model'; // Import ServiceModel for mocking
import { ClaimModel } from '../../models/claim.model'; // Import ClaimModel for mocking
import { BillingStatus, DocumentationStatus } from '../../types/services.types'; // Import BillingStatus and DocumentationStatus enums for assertions
import { ClaimStatus, SubmissionMethod } from '../../types/claims.types'; // Import ClaimStatus and SubmissionMethod enums for assertions
import { UUID } from '../../types/common.types'; // Import UUID type for test parameters
import { NotFoundError } from '../../errors/not-found-error'; // Import NotFoundError for testing error scenarios
import { ValidationError } from '../../errors/validation-error'; // Import ValidationError for testing validation failures
import { BusinessError } from '../../errors/business-error'; // Import BusinessError for testing business rule violations
import { mockService, mockServiceWithRelations, mockValidService, mockInvalidService, mockServiceWithIncompleteDocumentation, mockServiceWithInvalidAuthorization, mockServices } from '../fixtures/services.fixtures'; // Import mock service data for tests
import { mockClaim, mockClaimWithRelations, mockDraftClaim, mockSubmittedClaim } from '../fixtures/claims.fixtures'; // Import mock claim data for tests

// Mock the BillingValidationService
jest.mock('../../services/billing/billing-validation.service');
const mockBillingValidationService = BillingValidationService as jest.Mocked<typeof BillingValidationService>;

// Mock the DocumentationValidationService
jest.mock('../../services/billing/documentation-validation.service');
const mockDocumentationValidationService = DocumentationValidationService as jest.Mocked<typeof DocumentationValidationService>;

// Mock the AuthorizationTrackingService
jest.mock('../../services/billing/authorization-tracking.service');
const mockAuthorizationTrackingService = AuthorizationTrackingService as jest.Mocked<typeof AuthorizationTrackingService>;

// Mock the ServiceToClaimService
jest.mock('../../services/billing/service-to-claim.service');
const mockServiceToClaimService = ServiceToClaimService as jest.Mocked<typeof ServiceToClaimService>;

// Mock the ElectronicSubmissionService
jest.mock('../../services/billing/electronic-submission.service');
const mockElectronicSubmissionService = ElectronicSubmissionService as jest.Mocked<typeof ElectronicSubmissionService>;

// Mock the ServiceModel
jest.mock('../../models/service.model');
const mockServiceModel = ServiceModel as jest.Mocked<typeof ServiceModel>;

// Mock the ClaimModel
jest.mock('../../models/claim.model');
const mockClaimModel = ClaimModel as jest.Mocked<typeof ClaimModel>;

// Function to generate a consistent test user ID
function generateTestUserId(): UUID {
  return '123e4567-e89b-12d3-a456-426614174000';
}

describe('BillingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateServicesForBilling', () => {
    it('should successfully validate services for billing', async () => {
      const serviceIds: UUID[] = [uuidv4(), uuidv4()];
      const userId: UUID = generateTestUserId();
      const mockValidationResponse = { results: [], isValid: true, totalErrors: 0, totalWarnings: 0 };
      mockBillingValidationService.validateServicesForBilling.mockResolvedValue(mockValidationResponse);

      const result = await BillingService.validateServicesForBilling({ serviceIds }, userId);

      expect(mockBillingValidationService.validateServicesForBilling).toHaveBeenCalledWith(serviceIds);
      expect(result).toEqual(mockValidationResponse);
    });
  });

  describe('convertServicesToClaim', () => {
    it('should successfully convert services to a claim', async () => {
      const request = { serviceIds: [uuidv4()], payerId: uuidv4(), notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockClaimResponse = { claim: mockClaimSummary, validationResult: null, success: true, message: 'Claim created' };
      mockServiceToClaimService.convertServicesToClaim.mockResolvedValue(mockClaimResponse);

      const result = await BillingService.convertServicesToClaim(request, userId);

      expect(mockServiceToClaimService.convertServicesToClaim).toHaveBeenCalledWith(request, userId);
      expect(result).toEqual(mockClaimResponse);
    });
  });

  describe('batchConvertServicesToClaims', () => {
    it('should successfully batch convert services to claims', async () => {
      const batchData = [{ serviceIds: [uuidv4()], payerId: uuidv4(), notes: 'Test notes' }];
      const userId: UUID = generateTestUserId();
      const mockBatchResponse = { totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], createdClaims: [uuidv4()] };
      mockServiceToClaimService.batchConvertServicesToClaims.mockResolvedValue(mockBatchResponse);

      const result = await BillingService.batchConvertServicesToClaims(batchData, userId);

      expect(mockServiceToClaimService.batchConvertServicesToClaims).toHaveBeenCalledWith(batchData, userId);
      expect(result).toEqual(mockBatchResponse);
    });
  });

  describe('submitClaim', () => {
    it('should successfully submit a claim', async () => {
      const request = { claimId: uuidv4(), submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString(), externalClaimId: null, notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockSubmissionResponse = { success: true, message: 'Claim submitted', confirmationNumber: '12345', submissionDate: new Date().toISOString(), claimId: request.claimId, validationResult: null };
      mockElectronicSubmissionService.submitClaim.mockResolvedValue(mockSubmissionResponse);

      const result = await BillingService.submitClaim(request, userId);

      expect(mockElectronicSubmissionService.submitClaim).toHaveBeenCalledWith(request, userId);
      expect(result).toEqual(mockSubmissionResponse);
    });
  });

  describe('batchSubmitClaims', () => {
    it('should successfully batch submit claims', async () => {
      const request = { claimIds: [uuidv4()], submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString(), notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockBatchSubmissionResponse = { totalProcessed: 1, successCount: 1, errorCount: 0, errors: [], processedClaims: [uuidv4()], submissionDate: request.submissionDate };
      mockElectronicSubmissionService.submitBatch.mockResolvedValue(mockBatchSubmissionResponse);

      const result = await BillingService.batchSubmitClaims(request, userId);

      expect(mockElectronicSubmissionService.submitBatch).toHaveBeenCalledWith(request, userId);
      expect(result).toEqual(mockBatchSubmissionResponse);
    });
  });

  describe('getBillingQueue', () => {
    it('should successfully retrieve the billing queue', async () => {
      const filter = {};
      const page = 1;
      const pageSize = 10;
      const mockBillingQueueResponse = { services: [mockServiceSummary], total: 1, page: 1, limit: 10, totalPages: 1, totalAmount: 100 };
      mockServiceToClaimService.findBillableServices.mockResolvedValue(mockBillingQueueResponse);

      const result = await BillingService.getBillingQueue(filter, page, pageSize);

      expect(mockServiceToClaimService.findBillableServices).toHaveBeenCalledWith(filter, page, pageSize);
      expect(result).toEqual(mockBillingQueueResponse);
    });
  });

  describe('validateSubmissionRequirements', () => {
    it('should successfully validate submission requirements', async () => {
      const claimId: UUID = uuidv4();
      const submissionMethod = SubmissionMethod.ELECTRONIC;
      const mockValidationResult = { isValid: true, errors: [], warnings: [] };
      mockElectronicSubmissionService.validateFilingDeadline.mockResolvedValue(mockValidationResult);
      mockClaimModel.findById.mockResolvedValue(mockClaim);

      const result = await BillingService.validateSubmissionRequirements(claimId, submissionMethod);

      expect(mockElectronicSubmissionService.validateFilingDeadline).toHaveBeenCalled();
      expect(result).toEqual({ isValid: true, errors: [], warnings: [] });
    });

    it('should throw NotFoundError if claim is not found', async () => {
      const claimId: UUID = uuidv4();
      const submissionMethod = SubmissionMethod.ELECTRONIC;
      mockClaimModel.findById.mockResolvedValue(null);

      await expect(BillingService.validateSubmissionRequirements(claimId, submissionMethod)).rejects.toThrow(NotFoundError);
    });
  });

  describe('validateAndConvertToClaim', () => {
    it('should successfully validate and convert services to a claim', async () => {
      const request = { serviceIds: [uuidv4()], payerId: uuidv4(), notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockValidationResponse = { results: [], isValid: true, totalErrors: 0, totalWarnings: 0 };
      mockBillingValidationService.validateServicesForBilling.mockResolvedValue(mockValidationResponse);
      const mockClaimResponse = { claim: mockClaimSummary, validationResult: null, success: true, message: 'Claim created' };
      mockServiceToClaimService.convertServicesToClaim.mockResolvedValue(mockClaimResponse);

      const result = await BillingService.validateAndConvertToClaim(request, userId);

      expect(mockBillingValidationService.validateServicesForBilling).toHaveBeenCalledWith({ serviceIds: request.serviceIds });
      expect(mockServiceToClaimService.convertServicesToClaim).toHaveBeenCalledWith(request, userId);
      expect(result).toEqual(mockClaimResponse);
    });

    it('should return validation errors if service validation fails', async () => {
      const request = { serviceIds: [uuidv4()], payerId: uuidv4(), notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockValidationResponse = { results: [], isValid: false, totalErrors: 1, totalWarnings: 0 };
      mockBillingValidationService.validateServicesForBilling.mockResolvedValue(mockValidationResponse);

      const result = await BillingService.validateAndConvertToClaim(request, userId);

      expect(mockBillingValidationService.validateServicesForBilling).toHaveBeenCalledWith({ serviceIds: request.serviceIds });
      expect(result).toEqual({
        claim: null,
        validationResult: {
          isValid: false,
          errors: [],
          warnings: []
        },
        success: false,
        message: 'Service validation failed'
      });
    });
  });

  describe('validateAndSubmitClaim', () => {
    it('should successfully validate and submit a claim', async () => {
      const request = { claimId: uuidv4(), submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString(), externalClaimId: null, notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockValidationResult = { isValid: true, errors: [], warnings: [] };
      mockElectronicSubmissionService.validateFilingDeadline.mockResolvedValue(mockValidationResult);
      const mockSubmissionResponse = { success: true, message: 'Claim submitted', confirmationNumber: '12345', submissionDate: new Date().toISOString(), claimId: request.claimId, validationResult: null };
      mockElectronicSubmissionService.submitClaim.mockResolvedValue(mockSubmissionResponse);
      mockClaimModel.findById.mockResolvedValue(mockClaim);

      const result = await BillingService.validateAndSubmitClaim(request, userId);

      expect(mockElectronicSubmissionService.validateFilingDeadline).toHaveBeenCalled();
      expect(mockElectronicSubmissionService.submitClaim).toHaveBeenCalledWith(request, userId);
      expect(result).toEqual(mockSubmissionResponse);
    });

    it('should return validation errors if submission requirements validation fails', async () => {
      const request = { claimId: uuidv4(), submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString(), externalClaimId: null, notes: 'Test notes' };
      const userId: UUID = generateTestUserId();
      const mockValidationResult = { isValid: false, errors: [{ field: 'test', message: 'Test error' }], warnings: [] };
      mockElectronicSubmissionService.validateFilingDeadline.mockResolvedValue(mockValidationResult);
      mockClaimModel.findById.mockResolvedValue(mockClaim);

      const result = await BillingService.validateAndSubmitClaim(request, userId);

      expect(mockElectronicSubmissionService.validateFilingDeadline).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Claim submission requirements validation failed',
        confirmationNumber: null,
        submissionDate: null,
        claimId: request.claimId,
        validationResult: mockValidationResult
      });
    });
  });

  describe('getBillingDashboardMetrics', () => {
    it('should successfully retrieve billing dashboard metrics', async () => {
      const userId: UUID = generateTestUserId();
      const mockMetrics = {
        unbilledServicesCount: 10,
        unbilledServicesAmount: 1000,
        incompleteDocumentation: 5,
        pendingClaimsCount: 3,
        pendingClaimsAmount: 500,
        upcomingFilingDeadlines: [],
        recentBillingActivity: []
      };
      mockServiceModel.getUnbilledServices.mockResolvedValue({ services: mockServices, total: 10 });
      mockServiceModel.findAll.mockResolvedValue({ services: mockServices, total: 5 });
      mockClaimModel.prototype.findByStatus.mockResolvedValue({ services: mockServices, total: 3 });

      const result = await BillingService.getBillingDashboardMetrics(userId);

      expect(mockServiceModel.getUnbilledServices).toHaveBeenCalled();
      expect(mockServiceModel.findAll).toHaveBeenCalled();
      expect(mockClaimModel.prototype.findByStatus).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });
  });
});