import request from 'supertest'; // version 6.3.3
import fs from 'fs'; // version 0.0.1-security
import path from 'path'; // version 0.12.7
import jsonwebtoken from 'jsonwebtoken'; // version ^9.0.0
import app from '../../app';
import { db } from '../../database/connection';
import { paymentRepository } from '../../database/repositories/payment.repository';
import { claimRepository } from '../../database/repositories/claim.repository';
import { payerRepository } from '../../database/repositories/payer.repository';
import { createMockPayment, createMockPaymentWithRelations, mockPayment } from '../fixtures/payments.fixtures';
import { createMockClaim, createMockClaimWithRelations, mockPendingClaim, mockSubmittedClaim } from '../fixtures/claims.fixtures';
import { mockMedicaidPayer } from '../fixtures/payers.fixtures';
import { ReconciliationStatus, PaymentMethod, RemittanceFileType } from '../../types/payments.types';
import { ClaimStatus } from '../../types/claims.types';
import { StatusType } from '../../types/common.types';

/**
 * Test user with appropriate permissions for payment operations
 */
let testUser: { id: string; email: string; role: string; permissions: string[] };

/**
 * Authentication token for API requests
 */
let authToken: string;

/**
 * Test payer for payment operations
 */
let testPayer: any;

/**
 * Test claims for payment reconciliation
 */
let testClaims: any[];

/**
 * Test payment for reconciliation operations
 */
let testPayment: any;

/**
 * Sets up test data for payment processing tests
 * @returns Promise<void> Resolves when test data is set up
 */
async function setupTestData(): Promise<void> {
  // Create test user with payment management permissions
  testUser = {
    id: uuidv4(),
    email: 'payment.tester@example.com',
    role: 'financial_manager',
    permissions: ['payments:create', 'payments:read', 'payments:update', 'payments:delete']
  };

  // Generate authentication token for test user
  authToken = jsonwebtoken.sign(testUser, 'secret', { expiresIn: '1h' });

  // Create test payer in the database
  testPayer = await payerRepository.create(mockMedicaidPayer);

  // Create test claims in the database
  testClaims = await Promise.all([
    claimRepository.create(createMockClaim({ payerId: testPayer.id, claimStatus: ClaimStatus.SUBMITTED })),
    claimRepository.create(createMockClaim({ payerId: testPayer.id, claimStatus: ClaimStatus.PENDING }))
  ]);

  // Create test payment in the database
  testPayment = await paymentRepository.create(createMockPayment({ payerId: testPayer.id }));
}

/**
 * Cleans up test data after tests complete
 * @returns Promise<void> Resolves when test data is cleaned up
 */
async function cleanupTestData(): Promise<void> {
  // Delete test payment from the database
  await paymentRepository.delete(testPayment.id);

  // Delete test claims from the database
  await Promise.all(testClaims.map(claim => claimRepository.delete(claim.id)));

  // Delete test payer from the database
  await payerRepository.delete(testPayer.id);
}

/**
 * Loads a test remittance file for processing
 * @param fileType 
 * @returns File content as a buffer
 */
function getTestRemittanceFile(fileType: string): Buffer {
  // Determine file path based on file type (EDI_835, CSV, etc.)
  let filePath: string;
  switch (fileType) {
    case 'EDI_835':
      filePath = path.join(__dirname, '../fixtures/remittance.835');
      break;
    case 'CSV':
      filePath = path.join(__dirname, '../fixtures/remittance.csv');
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Read file from test fixtures directory
  return fs.readFileSync(filePath);
}

describe('Payment Processing E2E Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('should create a new payment', async () => {
    // Create payment data with required fields
    const paymentData = {
      payerId: testPayer.id,
      paymentDate: new Date().toISOString(),
      paymentAmount: 1000,
      paymentMethod: PaymentMethod.EFT,
      referenceNumber: 'REF123'
    };

    // Send POST request to /api/payments
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(paymentData);

    // Verify 201 status code
    expect(response.status).toBe(201);

    // Verify response contains created payment
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payerId).toBe(paymentData.payerId);
    expect(response.body.data.paymentAmount).toBe(paymentData.paymentAmount);

    // Verify payment exists in database
    const payment = await paymentRepository.findById(response.body.data.id);
    expect(payment).toBeDefined();
    expect(payment.payerId).toBe(paymentData.payerId);
  });

  it('should retrieve a payment by ID', async () => {
    // Send GET request to /api/payments/:id
    const response = await request(app)
      .get(`/api/payments/${testPayment.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains correct payment data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(testPayment.id);
    expect(response.body.data.payerId).toBe(testPayment.payerId);
  });

  it('should update a payment', async () => {
    // Create updated payment data
    const updatedPaymentData = {
      paymentAmount: 2000,
      notes: 'Updated notes'
    };

    // Send PUT request to /api/payments/:id
    const response = await request(app)
      .put(`/api/payments/${testPayment.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedPaymentData);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains updated payment
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(testPayment.id);
    expect(response.body.data.paymentAmount).toBe(updatedPaymentData.paymentAmount);
    expect(response.body.data.notes).toBe(updatedPaymentData.notes);

    // Verify payment was updated in database
    const payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.paymentAmount).toBe(updatedPaymentData.paymentAmount);
    expect(payment.notes).toBe(updatedPaymentData.notes);
  });

  it('should delete a payment', async () => {
    // Send DELETE request to /api/payments/:id
    const response = await request(app)
      .delete(`/api/payments/${testPayment.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify payment is marked as deleted in database
    const payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeNull();
  });

  it('should process a remittance file', async () => {
    // Load test remittance file
    const fileContent = getTestRemittanceFile('EDI_835');

    // Create remittance import request with file and payer ID
    const importData = {
      payerId: testPayer.id,
      fileContent: fileContent.toString(),
      fileType: RemittanceFileType.EDI_835,
      originalFilename: 'remittance.835'
    };

    // Send POST request to /api/payments/remittance
    const response = await request(app)
      .post('/api/payments/remittance')
      .set('Authorization', `Bearer ${authToken}`)
      .send(importData);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains processing results
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payment).toBeDefined();
    expect(response.body.data.remittanceInfo).toBeDefined();

    // Verify payment record was created in database
    const payment = await paymentRepository.findById(response.body.data.payment.id);
    expect(payment).toBeDefined();

    // Verify remittance info was created in database
    const remittanceInfo = await paymentRepository.getRemittanceInfo(response.body.data.payment.id);
    expect(remittanceInfo).toBeDefined();
  });

  it('should get suggested claim matches for a payment', async () => {
    // Send GET request to /api/payments/:id/suggested-matches
    const response = await request(app)
      .get(`/api/payments/${testPayment.id}/suggested-matches`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains payment and suggested matches
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payment).toBeDefined();
    expect(response.body.data.suggestedMatches).toBeDefined();

    // Verify matches include appropriate claims
    const suggestedMatches = response.body.data.suggestedMatches;
    expect(suggestedMatches.length).toBeGreaterThan(0);
    expect(suggestedMatches[0].claimId).toBe(testClaims[0].id);
  });

  it('should reconcile a payment with claims', async () => {
    // Create reconciliation data with claim payments
    const reconcileData = {
      claimPayments: [
        {
          claimId: testClaims[0].id,
          amount: 500
        }
      ],
      notes: 'Reconciled payment'
    };

    // Send POST request to /api/payments/:id/reconcile
    const response = await request(app)
      .post(`/api/payments/${testPayment.id}/reconcile`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(reconcileData);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains reconciliation results
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payment).toBeDefined();
    expect(response.body.data.claimPayments).toBeDefined();

    // Verify payment reconciliation status is updated
    const payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.PARTIALLY_RECONCILED);

    // Verify claim statuses are updated
    const claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PAID);

    // Verify claim payment associations are created
    const claimPayments = await paymentRepository.getClaimPayments(testPayment.id);
    expect(claimPayments).toBeDefined();
    expect(claimPayments.length).toBeGreaterThan(0);
    expect(claimPayments[0].claimId).toBe(testClaims[0].id);
  });

  it('should get reconciliation details for a payment', async () => {
    // Send GET request to /api/payments/:id/reconciliation
    const response = await request(app)
      .get(`/api/payments/${testPayment.id}/reconciliation`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains reconciliation details
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payment).toBeDefined();
    expect(response.body.data.claimPayments).toBeDefined();

    // Verify details include claim payments and amounts
    const claimPayments = response.body.data.claimPayments;
    expect(claimPayments.length).toBeGreaterThan(0);
    expect(claimPayments[0].claimId).toBe(testClaims[0].id);
  });

  it('should undo reconciliation for a payment', async () => {
    // Send POST request to /api/payments/:id/undo-reconciliation
    const response = await request(app)
      .post(`/api/payments/${testPayment.id}/undo-reconciliation`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response indicates successful undo
    expect(response.body.data).toBeDefined();
    expect(response.body.data.success).toBe(true);

    // Verify payment reconciliation status is reset
    const payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.UNRECONCILED);

    // Verify claim statuses are reverted
    const claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PENDING);

    // Verify claim payment associations are removed
    const claimPayments = await paymentRepository.getClaimPayments(testPayment.id);
    expect(claimPayments).toBeDefined();
    expect(claimPayments.length).toBe(0);
  });

  it('should auto-reconcile a payment', async () => {
    // Send POST request to /api/payments/:id/auto-reconcile
    const response = await request(app)
      .post(`/api/payments/${testPayment.id}/auto-reconcile`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains reconciliation results
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payment).toBeDefined();
    expect(response.body.data.claimPayments).toBeDefined();

    // Verify payment reconciliation status is updated
    const payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.PARTIALLY_RECONCILED);

    // Verify claim statuses are updated
    const claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PAID);

    // Verify claim payment associations are created
    const claimPayments = await paymentRepository.getClaimPayments(testPayment.id);
    expect(claimPayments).toBeDefined();
    expect(claimPayments.length).toBeGreaterThan(0);
    expect(claimPayments[0].claimId).toBe(testClaims[0].id);
  });

  it('should batch reconcile multiple payments', async () => {
    // Create batch reconciliation data with multiple payments
    const batchData = [
      {
        paymentId: testPayment.id,
        reconcileData: {
          claimPayments: [
            {
              claimId: testClaims[0].id,
              amount: 500
            }
          ],
          notes: 'Batch reconciled payment'
        }
      }
    ];

    // Send POST request to /api/payments/batch-reconcile
    const response = await request(app)
      .post('/api/payments/batch-reconcile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(batchData);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains batch reconciliation results
    expect(response.body.data).toBeDefined();
    expect(response.body.data.successful).toBeDefined();
    expect(response.body.data.failed).toBeDefined();

    // Verify payments are reconciled in database
    const payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.PARTIALLY_RECONCILED);

    // Verify claim statuses are updated
    const claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PAID);
  });

  it('should get adjustments for a payment', async () => {
    // Send GET request to /api/payments/:id/adjustments
    const response = await request(app)
      .get(`/api/payments/${testPayment.id}/adjustments`)
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains payment adjustments
    expect(response.body.data).toBeDefined();
  });

  it('should generate an accounts receivable aging report', async () => {
    // Send GET request to /api/payments/aging-report
    const response = await request(app)
      .get('/api/payments/aging-report')
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains aging report data
    expect(response.body.data).toBeDefined();
  });

  it('should get unreconciled payments', async () => {
    // Send GET request to /api/payments/unreconciled
    const response = await request(app)
      .get('/api/payments/unreconciled')
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains unreconciled payments
    expect(response.body.data).toBeDefined();

    // Verify all returned payments have UNRECONCILED status
    const unreconciledPayments = response.body.data;
    unreconciledPayments.forEach(payment => {
      expect(payment.reconciliationStatus).toBe(ReconciliationStatus.UNRECONCILED);
    });
  });

  it('should get payment metrics', async () => {
    // Send GET request to /api/payments/metrics
    const response = await request(app)
      .get('/api/payments/metrics')
      .set('Authorization', `Bearer ${authToken}`);

    // Verify 200 status code
    expect(response.status).toBe(200);

    // Verify response contains payment metrics
    expect(response.body.data).toBeDefined();

    // Verify metrics include expected categories
    expect(response.body.data.totalPayments).toBeDefined();
    expect(response.body.data.totalAmount).toBeDefined();
    expect(response.body.data.reconciliationBreakdown).toBeDefined();
  });

  it('should handle the complete payment lifecycle', async () => {
    // Create a new payment
    const createPaymentData = {
      payerId: testPayer.id,
      paymentDate: new Date().toISOString(),
      paymentAmount: 1000,
      paymentMethod: PaymentMethod.EFT,
      referenceNumber: 'REF123'
    };

    let createPaymentResponse = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createPaymentData);

    expect(createPaymentResponse.status).toBe(201);
    expect(createPaymentResponse.body.data).toBeDefined();

    const newPayment = createPaymentResponse.body.data;

    // Process a remittance file
    const fileContent = getTestRemittanceFile('EDI_835');

    const importData = {
      payerId: testPayer.id,
      fileContent: fileContent.toString(),
      fileType: RemittanceFileType.EDI_835,
      originalFilename: 'remittance.835'
    };

    let importResponse = await request(app)
      .post('/api/payments/remittance')
      .set('Authorization', `Bearer ${authToken}`)
      .send(importData);

    expect(importResponse.status).toBe(200);
    expect(importResponse.body.data).toBeDefined();

    // Get suggested claim matches
    let getMatchesResponse = await request(app)
      .get(`/api/payments/${newPayment.id}/suggested-matches`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getMatchesResponse.status).toBe(200);
    expect(getMatchesResponse.body.data).toBeDefined();

    // Reconcile payment with claims
    const reconcileData = {
      claimPayments: [
        {
          claimId: testClaims[0].id,
          amount: 500
        }
      ],
      notes: 'Reconciled payment'
    };

    let reconcileResponse = await request(app)
      .post(`/api/payments/${newPayment.id}/reconcile`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(reconcileData);

    expect(reconcileResponse.status).toBe(200);
    expect(reconcileResponse.body.data).toBeDefined();

    // Verify claim statuses are updated
    let claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PAID);

    // Get reconciliation details
    let getReconcileResponse = await request(app)
      .get(`/api/payments/${newPayment.id}/reconciliation`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getReconcileResponse.status).toBe(200);
    expect(getReconcileResponse.body.data).toBeDefined();

    // Undo reconciliation
    let undoReconcileResponse = await request(app)
      .post(`/api/payments/${newPayment.id}/undo-reconciliation`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(undoReconcileResponse.status).toBe(200);
    expect(undoReconcileResponse.body.data).toBeDefined();

    // Verify payment and claims are reset
    payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.UNRECONCILED);

    claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PENDING);

    // Auto-reconcile payment
    let autoReconcileResponse = await request(app)
      .post(`/api/payments/${newPayment.id}/auto-reconcile`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(autoReconcileResponse.status).toBe(200);
    expect(autoReconcileResponse.body.data).toBeDefined();

    // Verify reconciliation is successful
    payment = await paymentRepository.findById(testPayment.id);
    expect(payment).toBeDefined();
    expect(payment.reconciliationStatus).toBe(ReconciliationStatus.PARTIALLY_RECONCILED);

    claim = await claimRepository.findById(testClaims[0].id);
    expect(claim).toBeDefined();
    expect(claim.claimStatus).toBe(ClaimStatus.PAID);
  });
});