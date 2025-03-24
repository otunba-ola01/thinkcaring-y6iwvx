# src/backend/tests/e2e/api.e2e.test.ts
```typescript
import request from 'supertest'; // HTTP assertion library for testing API endpoints // supertest ^6.3.3
import { v4 as uuidv4 } from 'uuid'; // For generating unique identifiers for test data // uuid ^9.0.0
import express from 'express'; // Express types for the application instance // express ^4.18.2

import { initializeApp } from '../../app'; // Import the Express application initialization function
import { initializeDatabase, closeDatabase } from '../../database/connection'; // Import database connection functions for test setup and teardown
import { mockAdminUser, mockFinancialManagerUser, mockBillingSpecialistUser, mockProgramManagerUser, mockReadOnlyUser, mockInactiveUser } from '../fixtures/users.fixtures'; // Import mock user data for authentication and authorization testing
import { mockClaims, mockDraftClaim, mockSubmittedClaim, mockPendingClaim, mockPaidClaim, mockDeniedClaim } from '../fixtures/claims.fixtures'; // Import mock claim data for claims API testing
import { mockServices, mockBillableService, mockUnbillableService } from '../fixtures/services.fixtures'; // Import mock service data for services API testing
import { mockClients } from '../fixtures/clients.fixtures'; // Import mock client data for clients API testing
import { mockPayments, mockUnreconciledPayment, mockReconciledPayment } from '../fixtures/payments.fixtures'; // Import mock payment data for payments API testing
import { mockMedicaidPayer, mockMedicarePayer } from '../fixtures/payers.fixtures'; // Import mock payer data for testing
import { generateToken } from '../../security/token'; // Import token generation function for authentication testing
import { UserRepository } from '../../database/repositories/user.repository'; // Import user repository for test data setup
import { ClientRepository } from '../../database/repositories/client.repository'; // Import client repository for test data setup
import { ServiceRepository } from '../../database/repositories/service.repository'; // Import service repository for test data setup
import { ClaimRepository } from '../../database/repositories/claim.repository'; // Import claim repository for test data setup
import { PaymentRepository } from '../../database/repositories/payment.repository'; // Import payment repository for test data setup
import { ClaimStatus, ClaimType, SubmissionMethod } from '../../types/claims.types'; // Import claim-related enums for test data
import { PaymentStatus, PaymentMethod } from '../../types/payments.types'; // Import payment-related enums for test data

let app: express.Application;
let userRepository: UserRepository;
let clientRepository: ClientRepository;
let serviceRepository: ServiceRepository;
let claimRepository: ClaimRepository;
let paymentRepository: PaymentRepository;
let testUsers: any = {};
let testClients: any = {};
let testServices: any = {};
let testClaims: any = {};
let testPayments: any = {};
let authTokens: any = {};

const BASE_URL = '/api';

const setupTestApp = async (): Promise<express.Application> => {
  await initializeDatabase();
  return await initializeApp();
};

const seedTestData = async (): Promise<void> => {
  userRepository = new UserRepository();
  clientRepository = new ClientRepository();
  serviceRepository = new ServiceRepository();
  claimRepository = new ClaimRepository();
  paymentRepository = new PaymentRepository();

  // Create test users with different roles
  testUsers.admin = await userRepository.create(mockAdminUser);
  testUsers.financialManager = await userRepository.create(mockFinancialManagerUser);
  testUsers.billingSpecialist = await userRepository.create(mockBillingSpecialistUser);
  testUsers.programManager = await userRepository.create(mockProgramManagerUser);
  testUsers.readOnly = await userRepository.create(mockReadOnlyUser);
  testUsers.inactive = await userRepository.create(mockInactiveUser);

  // Generate authentication tokens for each user
  authTokens.admin = generateToken(mockAdminUser);
  authTokens.financialManager = generateToken(mockFinancialManagerUser);
  authTokens.billingSpecialist = generateToken(mockBillingSpecialistUser);
  authTokens.programManager = generateToken(mockProgramManagerUser);
  authTokens.readOnly = generateToken(mockReadOnlyUser);
  authTokens.inactive = generateToken(mockInactiveUser);

  // Create test clients
  testClients.client1 = await clientRepository.create(mockClients[0]);
  testClients.client2 = await clientRepository.create(mockClients[1]);

  // Create test services
  testServices.service1 = await serviceRepository.create(mockServices[0]);
  testServices.service2 = await serviceRepository.create(mockServices[1]);

  // Create test claims in various statuses
  testClaims.draftClaim = await claimRepository.create(mockDraftClaim);
  testClaims.submittedClaim = await claimRepository.create(mockSubmittedClaim);
  testClaims.pendingClaim = await claimRepository.create(mockPendingClaim);
  testClaims.paidClaim = await claimRepository.create(mockPaidClaim);
  testClaims.deniedClaim = await claimRepository.create(mockDeniedClaim);

  // Create test payments
  testPayments.unreconciledPayment = await paymentRepository.create(mockUnreconciledPayment);
  testPayments.reconciledPayment = await paymentRepository.create(mockReconciledPayment);
};

const cleanupTestData = async (): Promise<void> => {
  // Delete test payments from the database
  await paymentRepository.delete(testPayments.unreconciledPayment.id);
  await paymentRepository.delete(testPayments.reconciledPayment.id);

  // Delete test claims from the database
  await claimRepository.delete(testClaims.draftClaim.id);
  await claimRepository.delete(testClaims.submittedClaim.id);
  await claimRepository.delete(testClaims.pendingClaim.id);
  await claimRepository.delete(testClaims.paidClaim.id);
  await claimRepository.delete(testClaims.deniedClaim.id);

  // Delete test services from the database
  await serviceRepository.delete(testServices.service1.id);
  await serviceRepository.delete(testServices.service2.id);

  // Delete test clients from the database
  await clientRepository.delete(testClients.client1.id);
  await clientRepository.delete(testClients.client2.id);

  // Delete test users from the database
  await userRepository.delete(testUsers.admin.id);
  await userRepository.delete(testUsers.financialManager.id);
  await userRepository.delete(testUsers.billingSpecialist.id);
  await userRepository.delete(testUsers.programManager.id);
  await userRepository.delete(testUsers.readOnly.id);
  await userRepository.delete(testUsers.inactive.id);
};

const createAuthenticatedRequest = (role: string) => {
  const token = authTokens[role];
  const requestObject = request(app).get(BASE_URL).set('Authorization', `Bearer ${token}`);
  return requestObject;
};

describe('API Health Check Tests', () => {
  it('should return 200 OK for health check endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should include database status in health check response', async () => {
    const response = await request(app).get('/health');
    expect(response.body.database).toBe('connected');
  });

  it('should include version information in health check response', async () => {
    const response = await request(app).get('/health');
    expect(response.body.version).toMatch(/^(\d+\.)?(\d+\.)?(\*|\d+)$/);
  });
});

describe('Authentication API Tests', () => {
  it('should return 200 and token on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: mockAdminUser.email, password: 'P@ssw0rd123' });
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
  });

  it('should return 401 on invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: mockAdminUser.email, password: 'wrongpassword' });
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should return 403 for inactive user login attempt', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: mockInactiveUser.email, password: 'P@ssw0rd123' });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBeDefined();
  });

  it('should return 200 on password reset request for valid email', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: mockAdminUser.email });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBeDefined();
  });

  it('should return 200 on logout', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBeDefined();
  });
});

describe('Authorization Tests', () => {
  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/api/claims');
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .get('/api/claims')
      .set('Authorization', 'Bearer invalidtoken');
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  it('should return 403 when user lacks required permissions', async () => {
    const response = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${authTokens.readOnly}`)
      .send({});
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBeDefined();
  });

  it('should allow access to endpoints with proper permissions', async () => {
    const response = await request(app)
      .get('/api/claims')
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});

describe('Claims API Tests', () => {
  it('should return 200 and claims list for authorized users', async () => {
    const response = await request(app)
      .get('/api/claims')
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.pagination).toBeDefined();
  });

  it('should return 200 and claim details for authorized users', async () => {
    const response = await request(app)
      .get(`/api/claims/${testClaims.draftClaim.id}`)
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(testClaims.draftClaim.id);
  });

  it('should return 201 when creating a new claim with valid data', async () => {
    const response = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .send({
        clientId: testClients.client1.id,
        payerId: mockMedicaidPayer.id,
        claimType: ClaimType.ORIGINAL,
        serviceIds: [testServices.service1.id],
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.clientId).toBe(testClients.client1.id);
  });

  it('should return 400 when creating a claim with invalid data', async () => {
    const response = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .send({ clientId: 'invalid-uuid', payerId: mockMedicaidPayer.id, claimType: ClaimType.ORIGINAL, serviceIds: [testServices.service1.id] });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return 200 when validating a claim', async () => {
    const response = await request(app)
      .post(`/api/claims/${testClaims.draftClaim.id}/validate`)
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });

  it('should return 200 when submitting a claim', async () => {
    const response = await request(app)
      .post(`/api/claims/${testClaims.draftClaim.id}/submit`)
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .send({ submissionMethod: SubmissionMethod.ELECTRONIC, submissionDate: new Date().toISOString() });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.claimStatus).toBe(ClaimStatus.SUBMITTED);
  });

  it('should return 200 when updating claim status', async () => {
    const response = await request(app)
      .put(`/api/claims/${testClaims.draftClaim.id}/status`)
      .set('Authorization', `Bearer ${authTokens.admin}`)
      .send({ status: ClaimStatus.VALIDATED });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.claimStatus).toBe(ClaimStatus.VALIDATED);
  });

  it('should return 200 when getting claim lifecycle information', async () => {
    const response = await request(app)
      .get(`/api/claims/${testClaims.draftClaim.id}/lifecycle`)
      .set('Authorization', `Bearer ${authTokens.admin}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});

describe('Billing API Tests', () => {
  it('should return 200 when validating services for billing', async () => {
    const response = await request(app)
      .post('/api/billing/validate')
      .set('Authorization', `Bearer ${authTokens.billingSpecialist}`)
      .send({ serviceIds: [testServices.service1.id] });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });

  it('should return 200 when converting services to claim', async () => {
    const response = await request(app)
      .post('/api/billing/convert')
      .set('Authorization', `Bearer ${authTokens.billingSpecialist}`)
      .send({ serviceIds: [testServices.service1.id], payerId: mockMedicaidPayer.id });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });

  it('should return 200 when validating and converting services to claim', async () => {
    const response = await request(app)
      .post('/api/billing/validate-convert')
      .set('Authorization', `Bearer ${authTokens.billingSpecialist}`)
      .send({ serviceIds: [testServices.service1.id], payerId: mockMedicaidPayer.id });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });

  it('should return 200 when getting billing queue', async () => {
    const response = await request(app)
      .get('/api/billing/queue')
      .set('Authorization', `Bearer ${authTokens.billingSpecialist}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.pagination).toBeDefined();
  });

  it('should return 200 when getting billing dashboard metrics', async () => {
    const response = await request(app)
      .get('/api/billing/dashboard')
      .set('Authorization', `Bearer ${authTokens.billingSpecialist}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});

describe('Payments API Tests', () => {
  it('should return 200 and payments list for authorized users', async () => {
    const response = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${authTokens.financialManager}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.pagination).toBeDefined();
  });

  it('should return 200 and payment details for authorized users', async () => {
    const response = await request(app)
      .get(`/api/payments/${testPayments.unreconciledPayment.id}`)
      .set('Authorization', `Bearer ${authTokens.financialManager}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(testPayments.unreconciledPayment.id);
  });

  it('should return 201 when recording a new payment with valid data', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authTokens.financialManager}`)
      .send({
        payerId: mockMedicaidPayer.id,
        paymentDate: new Date().toISOString(),
        paymentAmount: 1000,
        paymentMethod: PaymentMethod.EFT,
        referenceNumber: 'REF123',
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payerId).toBe(mockMedicaidPayer.id);
  });

  it('should return 400 when recording a payment with invalid data', async () => {
    const response = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authTokens.financialManager}`)
      .send({ payerId: 'invalid-uuid', paymentDate: new Date().toISOString(), paymentAmount: 0, paymentMethod: PaymentMethod.EFT });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it('should return 200 when getting suggested claim matches for a payment', async () => {
    const response = await request(app)
      .get(`/api/payments/${testPayments.unreconciledPayment.id}/suggested-matches`)
      .set('Authorization', `Bearer ${authTokens.financialManager}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });

  it('should return 200 when reconciling a payment', async () => {
    const response = await request(app)
      .post(`/api/payments/${testPayments.unreconciledPayment.id}/reconcile`)
      .set('Authorization', `Bearer ${authTokens.financialManager}`)
      .send({ claimPayments: [{ claimId: testClaims.draftClaim.id, amount: 100 }] });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.reconciliationStatus).toBe(ReconciliationStatus.PARTIALLY_RECONCILED);
  });

  it('should return 200 when getting aging report', async () => {
    const response = await request(app)
      .get('/api/payments/aging-report')
      .set('Authorization', `Bearer ${authTokens.financialManager}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
  });
});