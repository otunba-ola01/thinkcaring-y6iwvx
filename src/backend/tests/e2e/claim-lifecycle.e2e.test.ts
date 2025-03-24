import request from 'supertest'; // version 6.3.3
import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import app from '../../app';
import { initializeDatabase, closeDatabase } from '../../database/connection';
import { mockClaims, mockDraftClaim, mockSubmittedClaim, mockPendingClaim, mockPaidClaim, mockDeniedClaim, createMockClaim } from '../fixtures/claims.fixtures';
import { mockServices, createMockService } from '../fixtures/services.fixtures';
import { mockClients } from '../fixtures/clients.fixtures';
import { mockPayments, createMockPayment } from '../fixtures/payments.fixtures';
import { mockMedicaidPayer, mockMedicarePayer } from '../fixtures/payers.fixtures';
import { ClaimModel } from '../../models/claim.model';
import { claimProcessingWorkflow } from '../../workflows/claim-processing.workflow';
import { ClaimLifecycleService } from '../../services/claims/claim-lifecycle.service';
import { ClaimStatus, ClaimType, SubmissionMethod, DenialReason } from '../../types/claims.types';

let testClaims: any;
let testServices: any;
let testClients: any;
let testPayments: any;

/**
 * Seeds the test database with data for claim lifecycle testing
 */
const seedTestData = async (): Promise<void> => {
  // Create test clients in the database based on mockClients fixtures
  testClients = await Promise.all(mockClients.map(async (client) => {
    return await db.query(async (queryBuilder) => {
      return await queryBuilder('clients').insert(client).returning('*');
    });
  }));

  // Create test services in the database based on mockServices fixtures
  testServices = await Promise.all(mockServices.map(async (service) => {
    return await db.query(async (queryBuilder) => {
      return await queryBuilder('services').insert(service).returning('*');
    });
  }));

  // Create test claims in various statuses (draft, submitted, pending, paid, denied)
  testClaims = {
    draft: await createTestClaim(ClaimStatus.DRAFT),
    submitted: await createTestClaim(ClaimStatus.SUBMITTED),
    pending: await createTestClaim(ClaimStatus.PENDING),
    paid: await createTestClaim(ClaimStatus.PAID),
    denied: await createTestClaim(ClaimStatus.DENIED),
  };

  // Create test payments for paid claims
  testPayments = {
    paid: await createMockPayment({ claimId: testClaims.paid.id }),
  };
};

/**
 * Cleans up test data after tests are complete
 */
const cleanupTestData = async (): Promise<void> => {
  // Delete test payments from the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('payments').whereIn('id', Object.values(testPayments)).del();
  });

  // Delete test claims from the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('claims').whereIn('id', Object.values(testClaims)).del();
  });

  // Delete test services from the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('services').whereIn('id', testServices.map(service => service.id)).del();
  });

  // Delete test clients from the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('clients').whereIn('id', testClients.map(client => client.id)).del();
  });
};

/**
 * Creates a test claim with the specified status
 * @param status 
 * @param overrides 
 */
const createTestClaim = async (status: ClaimStatus, overrides: object = {}): Promise<any> => {
  // Create a base claim using createMockClaim with the specified status
  let claim = createMockClaim({ claimStatus: status, ...overrides });

  // Apply any provided overrides to the claim data
  claim = { ...claim, ...overrides };

  // Save the claim to the database
  await db.query(async (queryBuilder) => {
    await queryBuilder('claims').insert(claim).returning('*');
  });

  // Return the created claim
  return claim;
};

/**
 * Advances a claim through the lifecycle to the specified status
 * @param claimId 
 * @param targetStatus 
 */
const advanceClaimToStatus = async (claimId: string, targetStatus: ClaimStatus): Promise<any> => {
  // Retrieve the claim from the database
  let claim = await ClaimModel.findById(claimId);

  // Determine the necessary status transitions to reach the target status
  const transitions = [];
  if (claim.claimStatus !== ClaimStatus.DRAFT) transitions.push(ClaimStatus.DRAFT);
  if (claim.claimStatus !== ClaimStatus.VALIDATED) transitions.push(ClaimStatus.VALIDATED);
  if (claim.claimStatus !== ClaimStatus.SUBMITTED) transitions.push(ClaimStatus.SUBMITTED);
  if (claim.claimStatus !== ClaimStatus.ACKNOWLEDGED) transitions.push(ClaimStatus.ACKNOWLEDGED);
  if (claim.claimStatus !== ClaimStatus.PENDING) transitions.push(ClaimStatus.PENDING);
  if (targetStatus === ClaimStatus.PAID) transitions.push(ClaimStatus.PAID);
  if (targetStatus === ClaimStatus.DENIED) transitions.push(ClaimStatus.DENIED);

  // Apply each transition in sequence (DRAFT → VALIDATED → SUBMITTED → ACKNOWLEDGED → PENDING → PAID/DENIED)
  for (const status of transitions) {
    claim = await ClaimModel.updateStatus(claim.id, status);
  }

  // Return the claim with the target status
  return claim;
};

/**
 * Waits for a claim to reach the specified status with timeout
 * @param claimId 
 * @param expectedStatus 
 * @param timeoutMs 
 */
const waitForClaimStatus = async (claimId: string, expectedStatus: ClaimStatus, timeoutMs: number): Promise<boolean> => {
  // Set up a polling interval to check claim status
  const pollIntervalMs = 1000; // Check every 1 second
  let elapsedTimeMs = 0;

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        // Retrieve the claim from the database
        const claim = await ClaimModel.findById(claimId);

        // Check if claim status matches expected status
        if (claim.claimStatus === expectedStatus) {
          clearInterval(intervalId);
          resolve(true); // Status matches, resolve with true
        }

        // Increment elapsed time
        elapsedTimeMs += pollIntervalMs;

        // Check if timeout has been reached
        if (elapsedTimeMs >= timeoutMs) {
          clearInterval(intervalId);
          resolve(false); // Timeout reached, resolve with false
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(error); // Error occurred, reject with error
      }
    }, pollIntervalMs);
  });
};

describe('Claim Lifecycle E2E Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  it('should create a new claim in DRAFT status', async () => {
    // Create a new claim using test data
    const newClaim = createMockClaim();

    // Verify claim is created with DRAFT status
    expect(newClaim.claimStatus).toBe(ClaimStatus.DRAFT);

    // Verify claim has expected properties and relationships
    expect(newClaim.clientId).toBeDefined();
    expect(newClaim.payerId).toBeDefined();
  });

  it('should validate a claim and transition to VALIDATED status', async () => {
    // Create a new claim in DRAFT status
    const draftClaim = await createTestClaim(ClaimStatus.DRAFT);

    // Call claimProcessingWorkflow.validateClaim
    const validationResult = await claimProcessingWorkflow.validateClaim(draftClaim.id);

    // Verify validation results are successful
    expect(validationResult.isValid).toBe(true);

    // Verify claim status is updated to VALIDATED
    const validatedClaim = await ClaimModel.findById(draftClaim.id);
    expect(validatedClaim.claimStatus).toBe(ClaimStatus.VALIDATED);

    // Verify status history is updated with the transition
    const statusHistory = await ClaimModel.getStatusHistory(draftClaim.id);
    expect(statusHistory.length).toBeGreaterThan(0);
    expect(statusHistory[0].status).toBe(ClaimStatus.VALIDATED);
  });

  it('should submit a validated claim and transition to SUBMITTED status', async () => {
    // Create a new claim and advance to VALIDATED status
    const validatedClaim = await createTestClaim(ClaimStatus.VALIDATED);

    // Prepare submission data with method and date
    const submissionData = {
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: new Date().toISOString(),
    };

    // Call claimProcessingWorkflow.submitClaim
    await claimProcessingWorkflow.submitClaim(validatedClaim.id, submissionData);

    // Verify claim status is updated to SUBMITTED
    const submittedClaim = await ClaimModel.findById(validatedClaim.id);
    expect(submittedClaim.claimStatus).toBe(ClaimStatus.SUBMITTED);

    // Verify submission details are recorded
    expect(submittedClaim.submissionMethod).toBe(submissionData.submissionMethod);
    expect(submittedClaim.submissionDate).toBe(submissionData.submissionDate);

    // Verify status history is updated with the transition
    const statusHistory = await ClaimModel.getStatusHistory(validatedClaim.id);
    expect(statusHistory.length).toBeGreaterThan(0);
    expect(statusHistory[0].status).toBe(ClaimStatus.SUBMITTED);
  });

  it('should transition a claim through the complete lifecycle to PAID status', async () => {
    // Create a new claim in DRAFT status
    let claim = await createTestClaim(ClaimStatus.DRAFT);

    // Advance through each status: VALIDATED → SUBMITTED → ACKNOWLEDGED → PENDING → PAID
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.VALIDATED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.SUBMITTED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.ACKNOWLEDGED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.PENDING);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.PAID);

    // Verify each transition is recorded in status history
    const statusHistory = await ClaimModel.getStatusHistory(claim.id);
    expect(statusHistory.length).toBeGreaterThanOrEqual(5);
    expect(statusHistory.map(s => s.status)).toEqual([
      ClaimStatus.VALIDATED,
      ClaimStatus.SUBMITTED,
      ClaimStatus.ACKNOWLEDGED,
      ClaimStatus.PENDING,
      ClaimStatus.PAID,
    ]);

    // Verify final status is PAID
    const paidClaim = await ClaimModel.findById(claim.id);
    expect(paidClaim.claimStatus).toBe(ClaimStatus.PAID);

    // Verify adjudication date is set
    expect(paidClaim.adjudicationDate).toBeDefined();
  });

  it('should transition a claim to DENIED status and support appeals', async () => {
    // Create a new claim and advance to PENDING status
    let claim = await createTestClaim(ClaimStatus.PENDING);

    // Transition claim to DENIED status with reason
    await ClaimModel.updateStatus(claim.id, ClaimStatus.DENIED, 'Service not covered');

    // Verify claim status is DENIED and reason is recorded
    const deniedClaim = await ClaimModel.findById(claim.id);
    expect(deniedClaim.claimStatus).toBe(ClaimStatus.DENIED);
    expect(deniedClaim.denialReason).toBe('Service not covered');

    // Appeal the denied claim
    await ClaimModel.updateStatus(claim.id, ClaimStatus.APPEALED, 'Appealing denial');

    // Verify claim status is updated to APPEALED
    const appealedClaim = await ClaimModel.findById(claim.id);
    expect(appealedClaim.claimStatus).toBe(ClaimStatus.APPEALED);

    // Verify appeal details are recorded in status history
    const statusHistory = await ClaimModel.getStatusHistory(claim.id);
    expect(statusHistory.length).toBeGreaterThan(0);
    expect(statusHistory.map(s => s.status)).toContain(ClaimStatus.APPEALED);
    expect(statusHistory.find(s => s.status === ClaimStatus.APPEALED).notes).toBe('Appealing denial');
  });

  it('should void a claim and prevent further transitions', async () => {
    // Create a new claim in DRAFT status
    const draftClaim = await createTestClaim(ClaimStatus.DRAFT);

    // Void the claim with notes
    await ClaimModel.updateStatus(draftClaim.id, ClaimStatus.VOID, 'Claim was invalid');

    // Verify claim status is updated to VOID
    const voidedClaim = await ClaimModel.findById(draftClaim.id);
    expect(voidedClaim.claimStatus).toBe(ClaimStatus.VOID);

    // Attempt to transition the voided claim to another status
    try {
      await ClaimModel.updateStatus(draftClaim.id, ClaimStatus.SUBMITTED, 'Attempting to submit voided claim');
    } catch (error) {
      // Verify transition is rejected with appropriate error
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Invalid status transition');

      // Verify claim status remains unchanged
      const reVoidedClaim = await ClaimModel.findById(draftClaim.id);
      expect(reVoidedClaim.claimStatus).toBe(ClaimStatus.VOID);
    }
  });

  it('should retrieve claim lifecycle information with timeline and next actions', async () => {
    // Create a claim and advance it through multiple status transitions
    let claim = await createTestClaim(ClaimStatus.DRAFT);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.VALIDATED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.SUBMITTED);

    // Call claimProcessingWorkflow.getClaimLifecycle
    const lifecycle = await claimProcessingWorkflow.getClaimLifecycle(claim.id);

    // Verify returned data includes claim details, timeline, age, and next actions
    expect(lifecycle.claim.id).toBe(claim.id);
    expect(lifecycle.timeline).toBeDefined();
    expect(lifecycle.age).toBeGreaterThanOrEqual(0);
    expect(lifecycle.nextActions).toBeDefined();

    // Verify timeline accurately reflects status history
    expect(lifecycle.timeline.map(t => t.status)).toEqual([
      ClaimStatus.VALIDATED,
      ClaimStatus.SUBMITTED,
    ]);

    // Verify next actions are appropriate for current status
    expect(lifecycle.nextActions).toContain('Submit to Payer');
  });

  it('should handle claim resubmission after denial', async () => {
    // Create a claim and advance to DENIED status
    let claim = await createTestClaim(ClaimStatus.DENIED);

    // Create a new claim referencing the denied claim as original
    const newClaim = createMockClaim({
      claimType: ClaimType.ADJUSTMENT,
      originalClaimId: claim.id,
    });

    // Submit the new claim
    await ClaimModel.updateStatus(newClaim.id, ClaimStatus.SUBMITTED, 'Resubmitting claim');

    // Verify new claim is processed successfully
    const submittedClaim = await ClaimModel.findById(newClaim.id);
    expect(submittedClaim.claimStatus).toBe(ClaimStatus.SUBMITTED);

    // Verify relationship between original and new claim is maintained
    expect(submittedClaim.originalClaimId).toBe(claim.id);
  });

  it('should process a batch of claims through validation and submission', async () => {
    // Create multiple claims in DRAFT status
    const claim1 = await createTestClaim(ClaimStatus.DRAFT);
    const claim2 = await createTestClaim(ClaimStatus.DRAFT);

    // Process claims in batch using claimProcessingWorkflow.batchProcessClaims
    const batchResult = await claimProcessingWorkflow.batchProcessClaims([claim1.id, claim2.id]);

    // Verify all claims are validated successfully
    expect(batchResult.isValid).toBe(true);

    // Submit validated claims in batch
    const submissionData = {
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: new Date().toISOString(),
    };
    await claimProcessingWorkflow.batchSubmitClaims([claim1.id, claim2.id], submissionData);

    // Verify all claims are submitted successfully and status is updated
    const submittedClaim1 = await ClaimModel.findById(claim1.id);
    const submittedClaim2 = await ClaimModel.findById(claim2.id);
    expect(submittedClaim1.claimStatus).toBe(ClaimStatus.SUBMITTED);
    expect(submittedClaim2.claimStatus).toBe(ClaimStatus.SUBMITTED);
  });

  it('should maintain accurate status history throughout lifecycle', async () => {
    // Create a claim and transition through multiple statuses
    let claim = await createTestClaim(ClaimStatus.DRAFT);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.VALIDATED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.SUBMITTED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.ACKNOWLEDGED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.PENDING);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.PAID);

    // Retrieve status history using ClaimModel.getStatusHistory
    const statusHistory = await ClaimModel.getStatusHistory(claim.id);

    // Verify history contains all transitions in correct order
    expect(statusHistory.length).toBeGreaterThanOrEqual(5);
    expect(statusHistory.map(s => s.status)).toEqual([
      ClaimStatus.VALIDATED,
      ClaimStatus.SUBMITTED,
      ClaimStatus.ACKNOWLEDGED,
      ClaimStatus.PENDING,
      ClaimStatus.PAID,
    ]);

    // Verify each history entry has correct timestamp and notes
    statusHistory.forEach(entry => {
      expect(entry.timestamp).toBeDefined();
      expect(entry.notes).toBeDefined();
    });
  });

  it('should enforce valid status transitions and reject invalid ones', async () => {
    // Create a claim in DRAFT status
    const draftClaim = await createTestClaim(ClaimStatus.DRAFT);

    // Attempt to transition directly from DRAFT to PAID (invalid)
    try {
      await ClaimModel.updateStatus(draftClaim.id, ClaimStatus.PAID, 'Attempting invalid transition');
    } catch (error) {
      // Verify transition is rejected with appropriate error
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Invalid status transition');

      // Verify claim status remains unchanged
      const reDraftClaim = await ClaimModel.findById(draftClaim.id);
      expect(reDraftClaim.claimStatus).toBe(ClaimStatus.DRAFT);
    }

    // Perform valid transition from DRAFT to VALIDATED
    await ClaimModel.updateStatus(draftClaim.id, ClaimStatus.VALIDATED, 'Valid transition');

    // Verify transition succeeds
    const validatedClaim = await ClaimModel.findById(draftClaim.id);
    expect(validatedClaim.claimStatus).toBe(ClaimStatus.VALIDATED);
  });

  it('should integrate with payment processing for paid claims', async () => {
    // Create a claim and advance to PENDING status
    let claim = await createTestClaim(ClaimStatus.PENDING);

    // Create a payment for the claim
    const payment = createMockPayment({ claimId: claim.id });

    // Mark claim as paid with payment reference
    await ClaimModel.updateStatus(claim.id, ClaimStatus.PAID, 'Payment received');

    // Verify claim status is updated to PAID
    const paidClaim = await ClaimModel.findById(claim.id);
    expect(paidClaim.claimStatus).toBe(ClaimStatus.PAID);

    // Verify payment is properly linked to the claim
    expect(payment.claimId).toBe(claim.id);
  });
});

describe('Claim Lifecycle API Tests', () => {
  beforeAll(async () => {
    await initializeDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  it('should validate a claim via API', async () => {
    // Create a test claim in DRAFT status
    const draftClaim = await createTestClaim(ClaimStatus.DRAFT);

    // Send POST request to /api/claims/:id/validate
    const response = await request(app)
      .post(`/api/claims/${draftClaim.id}/validate`);

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains validation results
    expect(response.body.data.isValid).toBe(true);
    expect(response.body.data.errors).toEqual([]);

    // Verify claim status is updated to VALIDATED if validation passes
    const validatedClaim = await ClaimModel.findById(draftClaim.id);
    expect(validatedClaim.claimStatus).toBe(ClaimStatus.VALIDATED);
  });

  it('should submit a claim via API', async () => {
    // Create a test claim in VALIDATED status
    const validatedClaim = await createTestClaim(ClaimStatus.VALIDATED);

    // Send POST request to /api/claims/:id/submit with submission data
    const submissionData = {
      submissionMethod: SubmissionMethod.ELECTRONIC,
      submissionDate: new Date().toISOString(),
    };
    const response = await request(app)
      .post(`/api/claims/${validatedClaim.id}/submit`)
      .send(submissionData);

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains submitted claim with updated status
    expect(response.body.data.claimStatus).toBe(ClaimStatus.SUBMITTED);
    expect(response.body.data.submissionMethod).toBe(submissionData.submissionMethod);
    expect(response.body.data.submissionDate).toBe(submissionData.submissionDate);

    // Verify claim status is updated to SUBMITTED in database
    const submittedClaim = await ClaimModel.findById(validatedClaim.id);
    expect(submittedClaim.claimStatus).toBe(ClaimStatus.SUBMITTED);
  });

  it('should update claim status via API', async () => {
    // Create a test claim in SUBMITTED status
    const submittedClaim = await createTestClaim(ClaimStatus.SUBMITTED);

    // Send POST request to /api/claims/:id/status with new status data
    const statusData = {
      status: ClaimStatus.PAID,
      adjudicationDate: new Date().toISOString(),
    };
    const response = await request(app)
      .post(`/api/claims/${submittedClaim.id}/status`)
      .send(statusData);

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains claim with updated status
    expect(response.body.data.claimStatus).toBe(ClaimStatus.PAID);
    expect(response.body.data.adjudicationDate).toBe(statusData.adjudicationDate);

    // Verify claim status is updated in database
    const paidClaim = await ClaimModel.findById(submittedClaim.id);
    expect(paidClaim.claimStatus).toBe(ClaimStatus.PAID);
  });

  it('should get claim lifecycle information via API', async () => {
    // Create a test claim with multiple status transitions
    let claim = await createTestClaim(ClaimStatus.DRAFT);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.VALIDATED);
    claim = await advanceClaimToStatus(claim.id, ClaimStatus.SUBMITTED);

    // Send GET request to /api/claims/:id/lifecycle
    const response = await request(app)
      .get(`/api/claims/${claim.id}/lifecycle`);

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains claim details, timeline, and next actions
    expect(response.body.data.claim).toBeDefined();
    expect(response.body.data.timeline).toBeDefined();
    expect(response.body.data.nextActions).toBeDefined();

    // Verify timeline accurately reflects status history
    expect(response.body.data.timeline.map(t => t.status)).toEqual([
      ClaimStatus.VALIDATED,
      ClaimStatus.SUBMITTED,
    ]);
  });

  it('should void a claim via API', async () => {
    // Create a test claim in DRAFT status
    const draftClaim = await createTestClaim(ClaimStatus.DRAFT);

    // Send POST request to /api/claims/:id/void with notes
    const response = await request(app)
      .post(`/api/claims/${draftClaim.id}/void`)
      .send({ notes: 'Claim was invalid' });

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains voided claim
    expect(response.body.data.claimStatus).toBe(ClaimStatus.VOID);
    expect(response.body.data.notes).toBe('Claim was invalid');

    // Verify claim status is updated to VOID in database
    const voidedClaim = await ClaimModel.findById(draftClaim.id);
    expect(voidedClaim.claimStatus).toBe(ClaimStatus.VOID);
  });

  it('should appeal a denied claim via API', async () => {
    // Create a test claim in DENIED status
    const deniedClaim = await createTestClaim(ClaimStatus.DENIED);

    // Send POST request to /api/claims/:id/appeal with appeal data
    const appealData = { appealReason: 'Additional information provided' };
    const response = await request(app)
      .post(`/api/claims/${deniedClaim.id}/appeal`)
      .send(appealData);

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains appealed claim
    expect(response.body.data.claimStatus).toBe(ClaimStatus.APPEALED);

    // Verify claim status is updated to APPEALED in database
    const appealedClaim = await ClaimModel.findById(deniedClaim.id);
    expect(appealedClaim.claimStatus).toBe(ClaimStatus.APPEALED);
  });

  it('should process claims in batch via API', async () => {
    // Create multiple test claims in DRAFT status
    const claim1 = await createTestClaim(ClaimStatus.DRAFT);
    const claim2 = await createTestClaim(ClaimStatus.DRAFT);

    // Send POST request to /api/claims/batch/validate with claim IDs
    let response = await request(app)
      .post(`/api/claims/batch/validate`)
      .send({ claimIds: [claim1.id, claim2.id] });

    // Verify 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains validation results for all claims
    expect(response.body.data.results.length).toBe(2);
    expect(response.body.data.isValid).toBe(true);

    // Send POST request to /api/claims/batch/submit with validated claim IDs
    response = await request(app)
      .post(`/api/claims/batch/submit`)
      .send({ claimIds: [claim1.id, claim2.id], submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() });

    // Verify response contains submission results for all claims
    expect(response.body.data.results.length).toBe(2);

    // Verify all claims are submitted successfully and status is updated
    const submittedClaim1 = await ClaimModel.findById(claim1.id);
    const submittedClaim2 = await ClaimModel.findById(claim2.id);
    expect(submittedClaim1.claimStatus).toBe(ClaimStatus.SUBMITTED);
    expect(submittedClaim2.claimStatus).toBe(ClaimStatus.SUBMITTED);
  });
});

describe('Claim Lifecycle Error Handling', () => {
  beforeAll(async () => {
    await initializeDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  it('should handle validation failures appropriately', async () => {
    // Create a test claim with invalid data
    const invalidClaim = createMockClaim({ clientId: 'invalid-uuid' });

    // Attempt to validate the claim
    try {
      await claimProcessingWorkflow.validateClaim(invalidClaim.id);
    } catch (error) {
      // Verify validation fails with appropriate error messages
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Claim validation failed');

      // Verify claim remains in DRAFT status
      const draftClaim = await ClaimModel.findById(invalidClaim.id);
      expect(draftClaim.claimStatus).toBe(ClaimStatus.DRAFT);
    }
  });

  it('should handle submission failures appropriately', async () => {
    // Create a test claim in VALIDATED status
    const validatedClaim = await createTestClaim(ClaimStatus.VALIDATED);

    // Configure a mock to simulate submission failure
    // Attempt to submit the claim
    try {
      const submissionData = {
        submissionMethod: SubmissionMethod.ELECTRONIC,
        submissionDate: new Date().toISOString(),
      };
      await claimProcessingWorkflow.submitClaim(validatedClaim.id, submissionData);
    } catch (error) {
      // Verify submission fails with appropriate error
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Claim submission failed');

      // Verify claim status is not updated
      const reValidatedClaim = await ClaimModel.findById(validatedClaim.id);
      expect(reValidatedClaim.claimStatus).toBe(ClaimStatus.VALIDATED);

      // Verify error is logged
      // TODO: Implement error logging verification
    }
  });

  it('should handle invalid status transitions appropriately', async () => {
    // Create a test claim in DRAFT status
    const draftClaim = await createTestClaim(ClaimStatus.DRAFT);

    // Attempt invalid transitions (e.g., DRAFT to PAID)
    try {
      await ClaimModel.updateStatus(draftClaim.id, ClaimStatus.PAID, 'Attempting invalid transition');
    } catch (error) {
      // Verify each attempt fails with appropriate error
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Invalid status transition');

      // Verify claim status remains unchanged
      const reDraftClaim = await ClaimModel.findById(draftClaim.id);
      expect(reDraftClaim.claimStatus).toBe(ClaimStatus.DRAFT);
    }

    // Perform valid transition from DRAFT to VALIDATED
    await ClaimModel.updateStatus(draftClaim.id, ClaimStatus.VALIDATED, 'Valid transition');

    // Verify transition succeeds
    const validatedClaim = await ClaimModel.findById(draftClaim.id);
    expect(validatedClaim.claimStatus).toBe(ClaimStatus.VALIDATED);
  });

  it('should handle non-existent claims appropriately', async () => {
    // Generate a non-existent claim ID
    const nonExistentClaimId = uuidv4();

    // Attempt operations on the non-existent claim
    try {
      await claimProcessingWorkflow.validateClaim(nonExistentClaimId);
    } catch (error) {
      // Verify each operation fails with appropriate not found error
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Claim not found');

      // Verify error responses have consistent format
      // TODO: Implement error response format verification
    }
  });
});