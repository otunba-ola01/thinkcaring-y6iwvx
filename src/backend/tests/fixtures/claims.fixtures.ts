import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { UUID, ISO8601Date, Money, StatusType } from '../../types/common.types';
import {
  Claim,
  ClaimWithRelations,
  ClaimSummary,
  ClaimStatus,
  ClaimType,
  SubmissionMethod,
  DenialReason,
  ClaimStatusHistory,
  ClaimService
} from '../../types/claims.types';
import { mockClient, mockClients } from './clients.fixtures';
import { mockService, mockServices, mockServiceSummary, mockServiceSummaries } from './services.fixtures';
import { mockMedicaidPayer, mockMedicarePayer, mockPrivateInsurancePayer, mockPayers } from './payers.fixtures';

/**
 * Creates a mock claim status history entry for testing
 * @param overrides - Optional overrides for claim status history properties
 * @param claimId - Optional claim ID to associate with the status history
 * @returns A complete mock claim status history entry
 */
function createMockClaimStatusHistory(
  overrides: Partial<ClaimStatusHistory> = {},
  claimId: UUID = uuidv4()
): ClaimStatusHistory {
  // Generate a UUID for the status history entry if not provided
  const id: UUID = overrides.id || uuidv4();

  // Use the provided claimId or generate one if not provided
  const claimIdValue: UUID = overrides.claimId || claimId;

  // Set default status to DRAFT if not provided
  const status: ClaimStatus = overrides.status || ClaimStatus.DRAFT;

  // Set default timestamp to current date if not provided
  const timestamp: ISO8601Date = overrides.timestamp || new Date().toISOString();

  // Set default notes to null if not provided
  const notes: string | null = overrides.notes || null;

  // Set default userId to null if not provided
  const userId: UUID | null = overrides.userId || null;

  // Apply any provided overrides to the default status history entry
  const statusHistory: ClaimStatusHistory = {
    id,
    claimId: claimIdValue,
    status,
    timestamp,
    notes,
    userId,
    ...overrides,
  };

  // Return the complete status history entry object
  return statusHistory;
}

/**
 * Creates a mock claim service association for testing
 * @param overrides - Optional overrides for claim service properties
 * @param claimId - Optional claim ID to associate with the service
 * @param serviceId - Optional service ID to associate with the claim
 * @returns A complete mock claim service association
 */
function createMockClaimService(
  overrides: Partial<ClaimService> = {},
  claimId: UUID = uuidv4(),
  serviceId: UUID = mockService.id
): ClaimService {
  // Generate a UUID for the claim service if not provided
  const id: UUID = overrides.id || uuidv4();

  // Use the provided claimId or generate one if not provided
  const claimIdValue: UUID = overrides.claimId || claimId;

  // Use the provided serviceId or use mockService.id if not provided
  const serviceIdValue: UUID = overrides.serviceId || mockService.id;

  // Set default service line number if not provided
  const serviceLineNumber: number = overrides.serviceLineNumber || 1;

  // Set default billed units if not provided
  const billedUnits: number = overrides.billedUnits || 1;

  // Set default billed amount if not provided
  const billedAmount: Money = overrides.billedAmount || 50.00;

  // Set default service reference if not provided
  const service = mockServiceSummary;

  // Apply any provided overrides to the default claim service
  const claimService: ClaimService = {
    id,
    claimId: claimIdValue,
    serviceId: serviceIdValue,
    serviceLineNumber,
    billedUnits,
    billedAmount,
    service,
    ...overrides,
  };

  // Return the complete claim service object
  return claimService;
}

/**
 * Creates a complete mock claim object for testing
 * @param overrides - Optional overrides for claim properties
 * @returns A complete mock claim object with all required properties
 */
function createMockClaim(overrides: Partial<Claim> = {}): Claim {
  // Generate a UUID for the claim if not provided
  const id: UUID = overrides.id || uuidv4();

  // Generate a claim number if not provided
  const claimNumber: string = overrides.claimNumber || `CLM-${Math.floor(Math.random() * 1000)}`;

  // Set default client ID from mockClient if not provided
  const clientId: UUID = overrides.clientId || mockClient.id;

  // Set default payer ID from mockMedicaidPayer if not provided
  const payerId: UUID = overrides.payerId || mockMedicaidPayer.id;

  // Set default claim type to ORIGINAL if not provided
  const claimType: ClaimType = overrides.claimType || ClaimType.ORIGINAL;

  // Set default claim status to DRAFT if not provided
  const claimStatus: ClaimStatus = overrides.claimStatus || ClaimStatus.DRAFT;

  // Set default total amount if not provided
  const totalAmount: Money = overrides.totalAmount || 100.00;

  // Set default service start and end dates if not provided
  const serviceStartDate: ISO8601Date = overrides.serviceStartDate || new Date().toISOString().split('T')[0] as ISO8601Date;
  const serviceEndDate: ISO8601Date = overrides.serviceEndDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default submission date to null if not provided
  const submissionDate: ISO8601Date | null = overrides.submissionDate || null;

  // Set default submission method to null if not provided
  const submissionMethod: SubmissionMethod | null = overrides.submissionMethod || null;

  // Set default adjudication date to null if not provided
  const adjudicationDate: ISO8601Date | null = overrides.adjudicationDate || null;

  // Set default denial reason to null if not provided
  const denialReason: DenialReason | null = overrides.denialReason || null;

  // Set default denial details to null if not provided
  const denialDetails: string | null = overrides.denialDetails || null;

  // Set default adjustment codes to null if not provided
  const adjustmentCodes: Record<string, string> | null = overrides.adjustmentCodes || null;

  // Set default original claim ID to null if not provided
  const originalClaimId: UUID | null = overrides.originalClaimId || null;

  // Set default notes to null if not provided
  const notes: string | null = overrides.notes || null;

  // Set default created and updated timestamps
  const createdAt: ISO8601Date = new Date().toISOString();
  const updatedAt: ISO8601Date = new Date().toISOString();

  // Set default created by and updated by to null if not provided
  const createdBy: UUID | null = overrides.createdBy || null;
  const updatedBy: UUID | null = overrides.updatedBy || null;

  // Apply any provided overrides to the default claim
  const claim: Claim = {
    id,
    claimNumber,
    externalClaimId: null,
    clientId,
    payerId,
    claimType,
    claimStatus,
    totalAmount,
    serviceStartDate,
    serviceEndDate,
    submissionDate,
    submissionMethod,
    adjudicationDate,
    denialReason,
    denialDetails,
    adjustmentCodes,
    originalClaimId,
    notes,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    ...overrides,
  };

  // Return the complete claim object
  return claim;
}

/**
 * Creates a mock claim with related entities for testing
 * @param overrides - Optional overrides for claim properties
 * @returns A complete mock claim with related entities
 */
function createMockClaimWithRelations(overrides: Partial<ClaimWithRelations> = {}): ClaimWithRelations {
  // Create a base claim using createMockClaim
  const baseClaim: Claim = createMockClaim(overrides);

  // Add mock client reference if not provided
  const client = overrides.clientId ? mockClients.find(c => c.id === overrides.clientId) : mockClient;

  // Add mock payer reference if not provided
  const payer = overrides.payerId ? mockPayers.find(p => p.id === overrides.payerId) : mockMedicaidPayer;

  // Add mock original claim reference if not provided
  const originalClaim: ClaimSummary | null = overrides.originalClaimId ? createMockClaimSummary({ id: overrides.originalClaimId }) : null;

  // Add mock services array if not provided
  const services = mockServiceSummaries;

  // Add mock status history array if not provided
  const statusHistory = [createMockClaimStatusHistory({ claimId: baseClaim.id })];

  // Apply any provided overrides to the claim with relations
  const claimWithRelations: ClaimWithRelations = {
    ...baseClaim,
    clientId: client.id,
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      medicaidId: client.medicaidId
    },
    payerId: payer.id,
    payer: {
      id: payer.id,
      name: payer.name,
      payerType: payer.payerType
    },
    originalClaimId: originalClaim ? originalClaim.id : null,
    originalClaim: originalClaim,
    services: services,
    statusHistory: statusHistory,
    ...overrides,
  } as ClaimWithRelations;

  // Return the complete claim with relations object
  return claimWithRelations;
}

/**
 * Creates a mock claim summary object for testing
 * @param overrides - Optional overrides for claim summary properties
 * @returns A complete mock claim summary object
 */
function createMockClaimSummary(overrides: Partial<ClaimSummary> = {}): ClaimSummary {
  // Generate a UUID for the claim if not provided
  const id: UUID = overrides.id || uuidv4();

  // Generate a claim number if not provided
  const claimNumber: string = overrides.claimNumber || `CLM-${Math.floor(Math.random() * 1000)}`;

  // Set default client ID and name if not provided
  const clientId: UUID = overrides.clientId || mockClient.id;
  const clientName: string = overrides.clientName || `${mockClient.lastName}, ${mockClient.firstName}`;

  // Set default payer ID and name if not provided
  const payerId: UUID = overrides.payerId || mockMedicaidPayer.id;
  const payerName: string = overrides.payerName || mockMedicaidPayer.name;

  // Set default claim status to DRAFT if not provided
  const claimStatus: ClaimStatus = overrides.claimStatus || ClaimStatus.DRAFT;

  // Set default total amount if not provided
  const totalAmount: Money = overrides.totalAmount || 100.00;

  // Set default service start and end dates if not provided
  const serviceStartDate: ISO8601Date = overrides.serviceStartDate || new Date().toISOString().split('T')[0] as ISO8601Date;
  const serviceEndDate: ISO8601Date = overrides.serviceEndDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default submission date to null if not provided
  const submissionDate: ISO8601Date | null = overrides.submissionDate || null;

  // Set default claim age (days since creation) if not provided
  const claimAge: number = overrides.claimAge || 0;

  // Apply any provided overrides to the default claim summary
  const claimSummary: ClaimSummary = {
    id,
    claimNumber,
    clientId,
    clientName,
    payerId,
    payerName,
    claimStatus,
    totalAmount,
    serviceStartDate,
    serviceEndDate,
    submissionDate,
    claimAge,
    ...overrides,
  };

  // Return the complete claim summary object
  return claimSummary;
}

/**
 * Creates an array of mock claim objects for testing
 * @param count - Number of mock claims to create
 * @param overrides - Optional overrides to apply to all claims
 * @returns An array of mock claim objects
 */
function createMockClaims(count: number, overrides: Partial<Claim> = {}): Claim[] {
  // Create an empty array to hold the claims
  const claims: Claim[] = [];

  // Loop 'count' times to create the specified number of claims
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockClaim with the provided overrides
    const claim: Claim = createMockClaim({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created claim to the array
    claims.push(claim);
  }

  // Return the array of mock claims
  return claims;
}

/**
 * Creates an array of mock claims with relations for testing
 * @param count - Number of mock claims to create
 * @param overrides - Optional overrides to apply to all claims
 * @returns An array of mock claims with relations
 */
function createMockClaimsWithRelations(count: number, overrides: Partial<ClaimWithRelations> = {}): ClaimWithRelations[] {
  // Create an empty array to hold the claims with relations
  const claims: ClaimWithRelations[] = [];

  // Loop 'count' times to create the specified number of claims
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockClaimWithRelations with the provided overrides
    const claim: ClaimWithRelations = createMockClaimWithRelations({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created claim to the array
    claims.push(claim);
  }

  // Return the array of mock claims with relations
  return claims;
}

/**
 * Creates an array of mock claim summary objects for testing
 * @param count - Number of mock claim summaries to create
 * @param overrides - Optional overrides to apply to all claim summaries
 * @returns An array of mock claim summary objects
 */
function createMockClaimSummaries(count: number, overrides: Partial<ClaimSummary> = {}): ClaimSummary[] {
  // Create an empty array to hold the claim summaries
  const claimSummaries: ClaimSummary[] = [];

  // Loop 'count' times to create the specified number of claim summaries
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockClaimSummary with the provided overrides
    const claimSummary: ClaimSummary = createMockClaimSummary({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created claim summary to the array
    claimSummaries.push(claimSummary);
  }

  // Return the array of mock claim summaries
  return claimSummaries;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Mock claim for testing
 */
export const mockClaim: Claim = createMockClaim();

/**
 * Mock claim with relations for testing
 */
export const mockClaimWithRelations: ClaimWithRelations = createMockClaimWithRelations();

/**
 * Mock claim summary for testing
 */
export const mockClaimSummary: ClaimSummary = createMockClaimSummary();

/**
 * Mock draft claim for testing
 */
export const mockDraftClaim: Claim = createMockClaim({
  claimStatus: ClaimStatus.DRAFT
});

/**
 * Mock submitted claim for testing
 */
export const mockSubmittedClaim: Claim = createMockClaim({
  claimStatus: ClaimStatus.SUBMITTED,
  submissionDate: new Date().toISOString(),
  submissionMethod: SubmissionMethod.ELECTRONIC
});

/**
 * Mock pending claim for testing
 */
export const mockPendingClaim: Claim = createMockClaim({
  claimStatus: ClaimStatus.PENDING,
  submissionDate: new Date().toISOString(),
  submissionMethod: SubmissionMethod.ELECTRONIC
});

/**
 * Mock paid claim for testing
 */
export const mockPaidClaim: Claim = createMockClaim({
  claimStatus: ClaimStatus.PAID,
  submissionDate: new Date().toISOString(),
  submissionMethod: SubmissionMethod.ELECTRONIC,
  adjudicationDate: new Date().toISOString()
});

/**
 * Mock denied claim for testing
 */
export const mockDeniedClaim: Claim = createMockClaim({
  claimStatus: ClaimStatus.DENIED,
  submissionDate: new Date().toISOString(),
  submissionMethod: SubmissionMethod.ELECTRONIC,
  adjudicationDate: new Date().toISOString(),
  denialReason: DenialReason.SERVICE_NOT_COVERED,
  denialDetails: 'Service not covered under payer policy'
});

/**
 * Mock adjustment claim for testing
 */
export const mockAdjustmentClaim: Claim = createMockClaim({
  claimType: ClaimType.ADJUSTMENT,
  originalClaimId: uuidv4()
});

/**
 * Mock void claim for testing
 */
export const mockVoidClaim: Claim = createMockClaim({
  claimStatus: ClaimStatus.VOID,
  notes: 'Claim was voided due to incorrect information'
});

/**
 * Mock claim status history entry for testing
 */
export const mockClaimStatusHistory: ClaimStatusHistory = createMockClaimStatusHistory();

/**
 * Mock claim service association for testing
 */
export const mockClaimService: ClaimService = createMockClaimService();

/**
 * Array of mock claims for testing
 */
export const mockClaims: Claim[] = createMockClaims(5);

/**
 * Array of mock claims with relations for testing
 */
export const mockClaimsWithRelations: ClaimWithRelations[] = createMockClaimsWithRelations(5);

/**
 * Array of mock claim summaries for testing
 */
export const mockClaimSummaries: ClaimSummary[] = createMockClaimSummaries(5);

export {
  createMockClaimStatusHistory,
  createMockClaimService,
  createMockClaim,
  createMockClaimWithRelations,
  createMockClaimSummary,
  createMockClaims,
  createMockClaimsWithRelations,
  createMockClaimSummaries
};