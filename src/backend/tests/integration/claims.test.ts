import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { db, getKnexInstance } from '../../database/connection';
import { ClaimsService } from '../../services/claims.service';
import { claimRepository } from '../../database/repositories/claim.repository';
import { serviceRepository } from '../../database/repositories/service.repository';
import { clientRepository } from '../../database/repositories/client.repository';
import { payerRepository } from '../../database/repositories/payer.repository';
import { ClaimStatus, ClaimType, SubmissionMethod, DenialReason } from '../../types/claims.types';
import { createMockClaim, createMockClaimWithRelations } from '../fixtures/claims.fixtures';
import { createMockService } from '../fixtures/services.fixtures';
import { createMockClient } from '../fixtures/clients.fixtures';
import { createMockPayer } from '../fixtures/payers.fixtures';
import { NotFoundError } from '../../errors/not-found-error';
import { BusinessError } from '../../errors/business-error';

/**
 * Sets up the test database with necessary test data
 */
async function setupTestDatabase(): Promise<{ clientId: string; payerId: string; serviceIds: string[] }> {
  // Create a test client
  const client = createMockClient();
  const clientId = await clientRepository.createClient(client);

  // Create a test payer
  const payer = createMockPayer();
  const payerId = await payerRepository.createPayer(payer);

  // Create multiple test services
  const service1 = createMockService({ clientId });
  const service2 = createMockService({ clientId });
  const serviceIds = [
    await serviceRepository.createService(service1),
    await serviceRepository.createService(service2),
  ];

  return { clientId, payerId, serviceIds };
}

/**
 * Creates a test claim with the given properties
 */
async function createTestClaim(object: { clientId: string; payerId: string; serviceIds: string[]; status: ClaimStatus }): Promise<string> {
  // Create a claim object
  const claim = createMockClaim({
    clientId: object.clientId,
    payerId: object.payerId,
  });

  // Save the claim to the database
  const claimId = await claimRepository.createClaim(claim);

  // If serviceIds are provided, associate services with the claim
  if (object.serviceIds && object.serviceIds.length > 0) {
    await claimRepository.updateClaimServices(claimId, object.serviceIds);
  }

  // If a status other than DRAFT is specified, update the claim status
  if (object.status && object.status !== ClaimStatus.DRAFT) {
    await claimRepository.updateStatus(claimId, object.status);
  }

  return claimId;
}

/**
 * Cleans up test data after tests complete
 */
async function cleanupTestData(): Promise<void> {
  // Get database connection
  const knex = getKnexInstance();

  // Delete all test claims
  await knex('claims').del();

  // Delete all test services
  await knex('services').del();

  // Delete all test clients
  await knex('clients').del();

  // Delete all test payers
  await knex('payers').del();
}

describe('ClaimsService Integration Tests', () => {
  let testData: { clientId: string; payerId: string; serviceIds: string[] };

  beforeAll(async () => {
    await db.initialize();
  });

  beforeEach(async () => {
    testData = await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should retrieve a claim by ID with related data', async () => {
    // Create a test claim
    const claimId = await createTestClaim(testData);

    // Retrieve the claim using ClaimsService.getClaim
    const claim = await ClaimsService.getClaim(claimId);

    // Assert that the claim is retrieved successfully
    expect(claim).toBeDefined();
    expect(claim.id).toBe(claimId);
    expect(claim.clientId).toBe(testData.clientId);
    expect(claim.payerId).toBe(testData.payerId);
  });

  it('should throw NotFoundError when retrieving a non-existent claim', async () => {
    // Generate a random UUID for a non-existent claim
    const nonExistentClaimId = uuidv4();

    // Attempt to retrieve the claim using ClaimsService.getClaim and assert that it throws NotFoundError
    await expect(ClaimsService.getClaim(nonExistentClaimId)).rejects.toThrow(NotFoundError);
  });

  it('should validate a claim successfully', async () => {
    // Create a test claim
    const claimId = await createTestClaim(testData);

    // Validate the claim using ClaimsService.validateClaim
    const validationResult = await ClaimsService.validateClaim(claimId, null);

    // Assert that the claim is valid
    expect(validationResult).toBeDefined();
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual([]);
  });

  it('should submit a claim successfully', async () => {
    // Create a test claim
    const claimId = await createTestClaim(testData);

    // Define submission data
    const submissionData = {
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: new Date().toISOString(),
    };

    // Submit the claim using ClaimsService.submitClaim
    const submittedClaim = await ClaimsService.submitClaim(claimId, submissionData, null);

    // Assert that the claim is submitted successfully
    expect(submittedClaim).toBeDefined();
    expect(submittedClaim.claimStatus).toBe(ClaimStatus.SUBMITTED);
    expect(submittedClaim.submissionDate).toBeDefined();
    expect(submittedClaim.submissionMethod).toBe(SubmissionMethod.ELECTRONIC);
  });

  it('should update claim status successfully', async () => {
    // Create a test claim
    const claimId = await createTestClaim({ ...testData, status: ClaimStatus.SUBMITTED });

    // Define status data
    const statusData = {
      status: ClaimStatus.PAID,
      adjudicationDate: new Date().toISOString(),
      denialReason: null,
      denialDetails: null,
      adjustmentCodes: null,
    };

    // Update the claim status using ClaimsService.updateClaimStatus
    const updatedClaim = await ClaimsService.updateClaimStatus(claimId, statusData, null);

    // Assert that the claim status is updated successfully
    expect(updatedClaim).toBeDefined();
    expect(updatedClaim.claimStatus).toBe(ClaimStatus.PAID);
    expect(updatedClaim.adjudicationDate).toBeDefined();
  });

  it('should get claim status successfully', async () => {
    // Create a test claim
    const claimId = await createTestClaim({ ...testData, status: ClaimStatus.SUBMITTED });

    // Get the claim status using ClaimsService.getClaimStatus
    const claimStatus = await ClaimsService.getClaimStatus(claimId);

    // Assert that the claim status is retrieved successfully
    expect(claimStatus).toBeDefined();
    expect(claimStatus.status).toBe(ClaimStatus.SUBMITTED);
    expect(claimStatus.lastUpdated).toBeDefined();
  });
});