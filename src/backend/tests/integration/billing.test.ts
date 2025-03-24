import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect } from 'jest'; // version ^29.0.0
import { BillingService } from '../../services/billing.service';
import { ServiceModel } from '../../models/service.model';
import { ClaimModel } from '../../models/claim.model';
import { PayerModel } from '../../models/payer.model';
import { db } from '../../database/connection';
import { mockService, mockReadyForBillingService, mockIncompleteDocumentationService, createMockService, createMockServices } from '../fixtures/services.fixtures';
import { mockClaim, mockDraftClaim, createMockClaim } from '../fixtures/claims.fixtures';
import { mockMedicaidPayer, mockMedicarePayer } from '../fixtures/payers.fixtures';
import { mockClient } from '../fixtures/clients.fixtures';
import { UUID } from '../../types/common.types';
import { BillingStatus, DocumentationStatus } from '../../types/services.types';
import { ClaimStatus, SubmissionMethod } from '../../types/claims.types';
import { ValidationError } from '../../errors/validation-error';
import { NotFoundError } from '../../errors/not-found-error';

// Define setup and teardown functions for the test database
async function setupTestDatabase(): Promise<void> {
  // Initialize the database connection
  await db.initialize();
  // Log successful connection
  console.log('Test database initialized');
}

async function teardownTestDatabase(): Promise<void> {
  // Close the database connection
  await db.close();
  // Log successful disconnection
  console.log('Test database connection closed');
}

async function createTestService(serviceData: Partial<Service>): Promise<Service> {
  // Create a mock service with the provided data
  const mockServiceData = createMockService(serviceData);
  // Insert the service into the database
  await db('services').insert(mockServiceData);
  // Return the created service
  return mockServiceData;
}

async function createTestServices(count: number, serviceData: Partial<Service>): Promise<Service[]> {
  // Create multiple mock services with the provided data
  const mockServicesData = createMockServices(count, serviceData);
  // Insert the services into the database
  await db('services').insert(mockServicesData);
  // Return the created services
  return mockServicesData;
}

async function cleanupTestData(): Promise<void> {
  // Delete test services from the database
  await db('services').where('clientId', mockClient.id).del();
  // Delete test claims from the database
  await db('claims').where('clientId', mockClient.id).del();
  // Log successful cleanup
  console.log('Test data cleaned up');
}

describe('Billing Service Integration Tests', () => {
  // Before all tests, set up the test database
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // After all tests, teardown the test database
  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Before each test, seed the database with necessary data
  beforeEach(async () => {
    // Seed the database with a mock client
    await db('clients').insert(mockClient);
    // Seed the database with a mock Medicaid payer
    await db('payers').insert(mockMedicaidPayer);
    // Seed the database with a mock Medicare payer
    await db('payers').insert(mockMedicarePayer);
  });

  // After each test, cleanup the test data
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('validateServicesForBilling', () => {
    it('should successfully validate services for billing', async () => {
      // Create a test service that is ready for billing
      const service = await createTestService({
        clientId: mockClient.id,
        documentationStatus: DocumentationStatus.COMPLETE,
        billingStatus: BillingStatus.READY_FOR_BILLING
      });

      // Call validateServicesForBilling with the service ID
      const validationResponse = await BillingService.validateServicesForBilling({ serviceIds: [service.id] }, null);

      // Assert that the validation was successful
      expect(validationResponse.isValid).toBe(true);
      expect(validationResponse.results).toHaveLength(1);
      expect(validationResponse.results[0].serviceId).toBe(service.id);
      expect(validationResponse.results[0].isValid).toBe(true);
    });

    it('should return validation errors for services with incomplete documentation', async () => {
      // Create a test service with incomplete documentation
      const service = await createTestService({
        clientId: mockClient.id,
        documentationStatus: DocumentationStatus.INCOMPLETE,
        billingStatus: BillingStatus.READY_FOR_BILLING
      });

      // Call validateServicesForBilling with the service ID
      const validationResponse = await BillingService.validateServicesForBilling({ serviceIds: [service.id] }, null);

      // Assert that the validation failed and errors are returned
      expect(validationResponse.isValid).toBe(false);
      expect(validationResponse.results).toHaveLength(1);
      expect(validationResponse.results[0].serviceId).toBe(service.id);
      expect(validationResponse.results[0].isValid).toBe(false);
      expect(validationResponse.results[0].errors.length).toBeGreaterThan(0);
    });
  });

  describe('convertServicesToClaim', () => {
    it('should successfully convert services to a claim', async () => {
      // Create a test service that is ready for billing
      const service = await createTestService({
        clientId: mockClient.id,
        documentationStatus: DocumentationStatus.COMPLETE,
        billingStatus: BillingStatus.READY_FOR_BILLING
      });

      // Call convertServicesToClaim with the service ID and payer ID
      const conversionResponse = await BillingService.convertServicesToClaim({ serviceIds: [service.id], payerId: mockMedicaidPayer.id, notes: 'Test claim' }, null);

      // Assert that the conversion was successful and a claim was created
      expect(conversionResponse.success).toBe(true);
      expect(conversionResponse.claim).toBeDefined();
      expect(conversionResponse.claim.clientId).toBe(mockClient.id);
      expect(conversionResponse.claim.payerId).toBe(mockMedicaidPayer.id);

      // Verify that the service is now associated with the claim
      const updatedService = await ServiceModel.findById(service.id);
      expect(updatedService.billingStatus).toBe(BillingStatus.IN_CLAIM);
      expect(updatedService.claimId).toBe(conversionResponse.claim.id);
    });

    it('should return an error if the payer is not found', async () => {
      // Call convertServicesToClaim with an invalid payer ID
      const conversionResponse = await BillingService.convertServicesToClaim({ serviceIds: [mockService.id], payerId: uuidv4(), notes: 'Test claim' }, null);

      // Assert that the conversion failed and an error is returned
      expect(conversionResponse.success).toBe(false);
      expect(conversionResponse.claim).toBeNull();
      expect(conversionResponse.validationResult).toBeDefined();
      expect(conversionResponse.validationResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('batchConvertServicesToClaims', () => {
    it('should successfully convert multiple batches of services to claims', async () => {
      // Create multiple test services that are ready for billing
      const services1 = await createTestServices(2, {
        clientId: mockClient.id,
        documentationStatus: DocumentationStatus.COMPLETE,
        billingStatus: BillingStatus.READY_FOR_BILLING
      });

      const services2 = await createTestServices(3, {
        clientId: mockClient.id,
        documentationStatus: DocumentationStatus.COMPLETE,
        billingStatus: BillingStatus.READY_FOR_BILLING
      });

      // Prepare batch data with service IDs and payer ID
      const batchData = [
        { serviceIds: services1.map(s => s.id), payerId: mockMedicaidPayer.id, notes: 'Batch 1' },
        { serviceIds: services2.map(s => s.id), payerId: mockMedicarePayer.id, notes: 'Batch 2' }
      ];

      // Call batchConvertServicesToClaims with the batch data
      const batchConversionResponse = await BillingService.batchConvertServicesToClaims(batchData, null);

      // Assert that the batch conversion was successful
      expect(batchConversionResponse.totalProcessed).toBe(2);
      expect(batchConversionResponse.successCount).toBe(2);
      expect(batchConversionResponse.errorCount).toBe(0);
      expect(batchConversionResponse.errors).toHaveLength(0);
      expect(batchConversionResponse.createdClaims.length).toBe(2);

      // Verify that the services are now associated with the claims
      for (const service of services1) {
        const updatedService = await ServiceModel.findById(service.id);
        expect(updatedService.billingStatus).toBe(BillingStatus.IN_CLAIM);
        expect(updatedService.claimId).toBeDefined();
      }

      for (const service of services2) {
        const updatedService = await ServiceModel.findById(service.id);
        expect(updatedService.billingStatus).toBe(BillingStatus.IN_CLAIM);
        expect(updatedService.claimId).toBeDefined();
      }
    });

    it('should handle errors when converting individual batches', async () => {
      // Create test services that are ready for billing
      const services1 = await createTestServices(2, {
        clientId: mockClient.id,
        documentationStatus: DocumentationStatus.COMPLETE,
        billingStatus: BillingStatus.READY_FOR_BILLING
      });

      // Prepare batch data with an invalid payer ID in one of the batches
      const batchData = [
        { serviceIds: services1.map(s => s.id), payerId: mockMedicaidPayer.id, notes: 'Batch 1' },
        { serviceIds: [mockService.id], payerId: uuidv4(), notes: 'Batch 2' } // Invalid payer ID
      ];

      // Call batchConvertServicesToClaims with the batch data
      const batchConversionResponse = await BillingService.batchConvertServicesToClaims(batchData, null);

      // Assert that the batch conversion had one success and one error
      expect(batchConversionResponse.totalProcessed).toBe(2);
      expect(batchConversionResponse.successCount).toBe(1);
      expect(batchConversionResponse.errorCount).toBe(1);
      expect(batchConversionResponse.errors).toHaveLength(1);
      expect(batchConversionResponse.createdClaims.length).toBe(1);
    });
  });

  describe('submitClaim', () => {
    it('should successfully submit a claim', async () => {
      // Create a test claim that is validated
      const claim = createMockClaim({
        clientId: mockClient.id,
        payerId: mockMedicaidPayer.id,
        claimStatus: ClaimStatus.VALIDATED
      });
      await db('claims').insert(claim);

      // Call submitClaim with the claim ID and submission method
      const submissionResponse = await BillingService.submitClaim({ claimId: claim.id, submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString(), externalClaimId: null, notes: 'Test submission' }, null);

      // Assert that the submission was successful
      expect(submissionResponse.success).toBe(true);
      expect(submissionResponse.confirmationNumber).toBeDefined();
      expect(submissionResponse.submissionDate).toBeDefined();

      // Verify that the claim status has been updated to SUBMITTED
      const updatedClaim = await ClaimModel.findById(claim.id);
      expect(updatedClaim.claimStatus).toBe(ClaimStatus.SUBMITTED);
      expect(updatedClaim.submissionMethod).toBe(SubmissionMethod.ELECTRONIC);
    });

    it('should return an error if the claim is not found', async () => {
      // Call submitClaim with an invalid claim ID
      const submissionResponse = await BillingService.submitClaim({ claimId: uuidv4(), submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString(), externalClaimId: null, notes: 'Test submission' }, null);

      // Assert that the submission failed and an error is returned
      expect(submissionResponse.success).toBe(false);
      expect(submissionResponse.confirmationNumber).toBeNull();
      expect(submissionResponse.submissionDate).toBeNull();
      expect(submissionResponse.validationResult).toBeNull();
    });
  });
});