/**
 * Mock data utilities for testing the HCBS Revenue Management System frontend.
 * This file provides factory functions and pre-defined data for creating test fixtures
 * with consistent structure and realistic values.
 * 
 * @version 1.0.0
 */

import { 
  UUID,
  ISO8601Date,
  ISO8601DateTime,
  Money,
  DateRange
} from '../../types/common.types';

import {
  UserStatus,
  UserRole,
  UserProfile,
  Role,
  Permission,
  PermissionCategory,
  PermissionAction
} from '../../types/users.types';

import {
  ClaimStatus,
  ClaimType,
  SubmissionMethod,
  DenialReason,
  Claim,
  ClaimWithRelations,
  ClaimSummary
} from '../../types/claims.types';

import {
  PaymentMethod,
  ReconciliationStatus,
  Payment,
  PaymentWithRelations,
  PaymentSummary,
  ClaimPayment
} from '../../types/payments.types';

import {
  ServiceStatus,
  Service,
  ServiceWithRelations,
  ServiceSummary
} from '../../types/services.types';

import {
  Client,
  ClientSummary
} from '../../types/clients.types';

import {
  Program,
  ProgramSummary,
  Payer,
  PayerSummary
} from '../../types/settings.types';

import {
  ReportType,
  Report,
  ReportParameter
} from '../../types/reports.types';

import {
  MfaMethod,
  AuthProvider
} from '../../types/auth.types';

/**
 * Generates a mock UUID for testing purposes
 * @returns A UUID string
 */
export const generateMockId = (): UUID => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Default user profile for testing
 */
const DEFAULT_USER: UserProfile = {
  id: generateMockId(),
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  roleId: generateMockId(),
  roleName: 'Billing Specialist',
  status: UserStatus.ACTIVE,
  lastLogin: new Date().toISOString(),
  mfaEnabled: true,
  mfaMethod: MfaMethod.APP,
  authProvider: AuthProvider.LOCAL,
  contactInfo: {
    email: 'user@example.com',
    phone: '555-123-4567',
    alternatePhone: null,
    fax: null
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Default client for testing
 */
const DEFAULT_CLIENT: Client = {
  id: generateMockId(),
  firstName: 'John',
  lastName: 'Smith',
  middleName: null,
  dateOfBirth: '1985-05-15',
  gender: 'male' as any,
  medicaidId: 'MD123456789',
  medicareId: null,
  ssn: '123-45-6789',
  address: {
    street1: '123 Main St',
    street2: 'Apt 4B',
    city: 'Anytown',
    state: 'NY',
    zipCode: '12345',
    country: 'USA'
  },
  contactInfo: {
    email: 'john.smith@example.com',
    phone: '555-987-6543',
    alternatePhone: null,
    fax: null
  },
  emergencyContact: {
    name: 'Jane Smith',
    relationship: 'Spouse',
    phone: '555-987-6544',
    alternatePhone: null,
    email: 'jane.smith@example.com'
  },
  status: 'active' as any,
  programs: [],
  insurances: [],
  notes: 'Sample client for testing',
  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Default service for testing
 */
const DEFAULT_SERVICE: Service = {
  id: generateMockId(),
  clientId: generateMockId(),
  serviceTypeId: generateMockId(),
  serviceCode: 'T1019',
  serviceDate: new Date().toISOString().split('T')[0],
  startTime: '09:00:00',
  endTime: '10:00:00',
  units: 4,
  rate: 25.75,
  amount: 103.00,
  staffId: generateMockId(),
  facilityId: null,
  programId: generateMockId(),
  authorizationId: generateMockId(),
  documentationStatus: 'complete' as any,
  billingStatus: 'unbilled' as any,
  claimId: null,
  notes: 'Sample service for testing',
  documentIds: [generateMockId(), generateMockId()],
  status: 'active' as any,
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Default claim for testing
 */
const DEFAULT_CLAIM: Claim = {
  id: generateMockId(),
  claimNumber: `CLM-${new Date().getFullYear()}-12345`,
  externalClaimId: null,
  clientId: generateMockId(),
  payerId: generateMockId(),
  claimType: ClaimType.ORIGINAL,
  claimStatus: ClaimStatus.SUBMITTED,
  totalAmount: 526.50,
  serviceStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  serviceEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  submissionMethod: SubmissionMethod.ELECTRONIC,
  adjudicationDate: null,
  denialReason: null,
  denialDetails: null,
  adjustmentCodes: null,
  originalClaimId: null,
  notes: 'Sample claim for testing',
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: generateMockId(),
  updatedBy: null
};

/**
 * Default payment for testing
 */
const DEFAULT_PAYMENT: Payment = {
  id: generateMockId(),
  payerId: generateMockId(),
  paymentDate: new Date().toISOString().split('T')[0],
  paymentAmount: 1245.67,
  paymentMethod: PaymentMethod.EFT,
  referenceNumber: 'EFT123456789',
  checkNumber: null,
  remittanceId: 'RA987654321',
  reconciliationStatus: ReconciliationStatus.UNRECONCILED,
  notes: 'Sample payment for testing',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Default program for testing
 */
const DEFAULT_PROGRAM: Program = {
  id: generateMockId(),
  name: 'Personal Care Services',
  code: 'PCS',
  description: 'Provides assistance with activities of daily living',
  fundingSource: 'Medicaid',
  status: 'active' as any,
  serviceCodes: ['T1019', 'T1020'],
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Default payer for testing
 */
const DEFAULT_PAYER: Payer = {
  id: generateMockId(),
  name: 'State Medicaid',
  payerType: 'medicaid' as any,
  identifier: 'MCD001',
  contactInfo: {
    email: 'claims@medicaid.example.gov',
    phone: '800-123-4567',
    alternatePhone: null,
    fax: '800-123-4568'
  },
  address: {
    street1: '456 Government Way',
    street2: 'Suite 300',
    city: 'Capital City',
    state: 'NY',
    zipCode: '12346',
    country: 'USA'
  },
  submissionMethod: 'electronic' as any,
  electronicPayer: true,
  payerId: 'SMNY',
  tradingPartnerId: 'TP12345',
  status: 'active' as any,
  submissionDetails: {
    clearinghouse: 'Change Healthcare',
    supportedFormats: ['837P'],
    submissionUrl: 'https://claims.example.gov/submit',
    requiresAuthorization: true
  },
  createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Default report for testing
 */
const DEFAULT_REPORT: Report = {
  id: generateMockId(),
  name: 'Revenue by Program',
  description: 'Analysis of revenue grouped by program',
  type: ReportType.REVENUE_BY_PROGRAM,
  parameters: {
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    programIds: [],
    payerIds: [],
    format: 'pdf' as any
  },
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  createdBy: generateMockId(),
  isScheduled: false,
  scheduleFrequency: null,
  lastRunAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'completed' as any
};

/**
 * Creates a mock user profile with specified overrides
 * 
 * @param overrides - Optional partial user profile to override default values
 * @returns A mock user profile object
 */
export const createMockUser = (overrides: Partial<UserProfile> = {}): UserProfile => {
  return {
    ...DEFAULT_USER,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock role with permissions
 * 
 * @param overrides - Optional partial role object to override default values
 * @returns A mock role object with permissions
 */
export const createMockRole = (overrides: Partial<Role> = {}): Role => {
  const baseRole: Role = {
    id: generateMockId(),
    name: 'Billing Specialist',
    description: 'Can manage claims and billing processes',
    isSystem: true,
    permissions: [
      createMockPermission(PermissionCategory.CLAIMS, PermissionAction.VIEW, null),
      createMockPermission(PermissionCategory.CLAIMS, PermissionAction.CREATE, null),
      createMockPermission(PermissionCategory.CLAIMS, PermissionAction.UPDATE, null),
      createMockPermission(PermissionCategory.BILLING, PermissionAction.SUBMIT, null),
      createMockPermission(PermissionCategory.REPORTS, PermissionAction.VIEW, null),
      createMockPermission(PermissionCategory.PAYMENTS, PermissionAction.VIEW, null)
    ],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    ...baseRole,
    id: overrides.id || baseRole.id,
    ...overrides
  };
};

/**
 * Creates a mock permission object
 * 
 * @param category - Permission category
 * @param action - Permission action
 * @param resource - Optional resource identifier
 * @returns A mock permission object
 */
export const createMockPermission = (
  category: PermissionCategory,
  action: PermissionAction,
  resource: string | null
): Permission => {
  const resourceStr = resource ? `:${resource}` : '';
  const permissionName = `${category}:${action}${resourceStr}`;

  return {
    id: generateMockId(),
    name: permissionName,
    description: `Permission to ${action} ${category}${resource ? ` for ${resource}` : ''}`,
    category,
    action,
    resource,
    isSystem: true
  };
};

/**
 * Creates a mock client with specified overrides
 * 
 * @param overrides - Optional partial client object to override default values
 * @returns A mock client object
 */
export const createMockClient = (overrides: Partial<Client> = {}): Client => {
  return {
    ...DEFAULT_CLIENT,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock client summary with specified overrides
 * 
 * @param overrides - Optional partial client summary object to override default values
 * @returns A mock client summary object
 */
export const createMockClientSummary = (overrides: Partial<ClientSummary> = {}): ClientSummary => {
  const baseClientSummary: ClientSummary = {
    id: generateMockId(),
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1985-05-15',
    medicaidId: 'MD123456789',
    status: 'active' as any,
    programs: ['Personal Care Services', 'Day Services']
  };

  return {
    ...baseClientSummary,
    id: overrides.id || baseClientSummary.id,
    ...overrides
  };
};

/**
 * Creates a mock service with specified overrides
 * 
 * @param overrides - Optional partial service object to override default values
 * @returns A mock service object
 */
export const createMockService = (overrides: Partial<Service> = {}): Service => {
  const baseService = {...DEFAULT_SERVICE};
  
  if (overrides.units && overrides.rate && !overrides.amount) {
    baseService.amount = overrides.units * overrides.rate;
  }

  return {
    ...baseService,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock service with related entities
 * 
 * @param overrides - Optional partial service with relations object to override default values
 * @returns A mock service object with related entities
 */
export const createMockServiceWithRelations = (
  overrides: Partial<ServiceWithRelations> = {}
): ServiceWithRelations => {
  const baseService = createMockService(overrides);
  
  const serviceWithRelations: ServiceWithRelations = {
    ...baseService,
    client: {
      id: baseService.clientId,
      firstName: 'John',
      lastName: 'Smith',
      medicaidId: 'MD123456789'
    },
    serviceType: {
      id: baseService.serviceTypeId,
      name: 'Personal Care',
      code: 'T1019'
    },
    staff: baseService.staffId ? {
      id: baseService.staffId,
      firstName: 'Sarah',
      lastName: 'Johnson',
      title: 'Care Provider'
    } : null,
    facility: baseService.facilityId ? {
      id: baseService.facilityId,
      name: 'Main Street Facility',
      type: 'Day Center'
    } : null,
    program: {
      id: baseService.programId,
      name: 'Personal Care Services',
      code: 'PCS'
    },
    authorization: baseService.authorizationId ? {
      id: baseService.authorizationId,
      number: 'AUTH-12345',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      authorizedUnits: 240,
      usedUnits: 120
    } : null,
    claim: baseService.claimId ? {
      id: baseService.claimId,
      claimNumber: `CLM-${new Date().getFullYear()}-12345`,
      status: 'submitted'
    } : null,
    documents: baseService.documentIds.map(id => ({
      id,
      fileName: `document-${id.substring(0, 8)}.pdf`,
      fileSize: 1024 * 1024,
      mimeType: 'application/pdf'
    }))
  };

  return {
    ...serviceWithRelations,
    ...overrides
  };
};

/**
 * Creates a mock claim with specified overrides
 * 
 * @param overrides - Optional partial claim object to override default values
 * @returns A mock claim object
 */
export const createMockClaim = (overrides: Partial<Claim> = {}): Claim => {
  const baseClaim = {...DEFAULT_CLAIM};
  const currentYear = new Date().getFullYear();
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  
  // Set appropriate dates based on claim status
  if (overrides.claimStatus) {
    const now = new Date();
    
    // Service dates are typically before submission
    if (!overrides.serviceStartDate && !overrides.serviceEndDate) {
      baseClaim.serviceStartDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      baseClaim.serviceEndDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    // Submission date based on status
    if (!overrides.submissionDate && [
      ClaimStatus.SUBMITTED, 
      ClaimStatus.ACKNOWLEDGED, 
      ClaimStatus.PENDING, 
      ClaimStatus.PAID, 
      ClaimStatus.PARTIAL_PAID,
      ClaimStatus.DENIED,
      ClaimStatus.APPEALED
    ].includes(overrides.claimStatus)) {
      baseClaim.submissionDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    // Adjudication date for paid or denied claims
    if (!overrides.adjudicationDate && [
      ClaimStatus.PAID, 
      ClaimStatus.PARTIAL_PAID,
      ClaimStatus.DENIED
    ].includes(overrides.claimStatus)) {
      baseClaim.adjudicationDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    // Denial reason for denied claims
    if (!overrides.denialReason && overrides.claimStatus === ClaimStatus.DENIED) {
      baseClaim.denialReason = DenialReason.CLIENT_INELIGIBLE;
      baseClaim.denialDetails = 'Client not eligible for services on date of service';
    }
  }

  return {
    ...baseClaim,
    id: overrides.id || generateMockId(),
    claimNumber: overrides.claimNumber || `CLM-${currentYear}-${randomNumber}`,
    ...overrides
  };
};

/**
 * Creates a mock claim with related entities
 * 
 * @param overrides - Optional partial claim with relations object to override default values
 * @returns A mock claim object with related entities
 */
export const createMockClaimWithRelations = (
  overrides: Partial<ClaimWithRelations> = {}
): ClaimWithRelations => {
  const baseClaim = createMockClaim(overrides);
  
  const claimWithRelations: ClaimWithRelations = {
    ...baseClaim,
    client: {
      id: baseClaim.clientId,
      firstName: 'John',
      lastName: 'Smith',
      medicaidId: 'MD123456789',
      status: 'active' as any,
      programs: ['Personal Care Services', 'Day Services'],
      dateOfBirth: '1985-05-15'
    },
    payer: {
      id: baseClaim.payerId,
      name: 'State Medicaid',
      payerType: 'medicaid' as any,
      isElectronic: true,
      status: 'active' as any
    },
    originalClaim: baseClaim.originalClaimId ? {
      id: baseClaim.originalClaimId,
      claimNumber: `CLM-${new Date().getFullYear()}-54321`,
      clientId: baseClaim.clientId,
      clientName: 'John Smith',
      payerId: baseClaim.payerId,
      payerName: 'State Medicaid',
      claimStatus: ClaimStatus.DENIED,
      totalAmount: baseClaim.totalAmount,
      serviceStartDate: baseClaim.serviceStartDate,
      serviceEndDate: baseClaim.serviceEndDate,
      submissionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      claimAge: 15
    } : null,
    services: [
      {
        id: generateMockId(),
        clientName: 'John Smith',
        serviceType: 'Personal Care',
        serviceDate: baseClaim.serviceStartDate,
        units: 4,
        amount: 103.00,
        documentationStatus: 'complete' as any,
        billingStatus: 'billed' as any,
        programName: 'Personal Care Services'
      },
      {
        id: generateMockId(),
        clientName: 'John Smith',
        serviceType: 'Personal Care',
        serviceDate: baseClaim.serviceEndDate,
        units: 3,
        amount: 77.25,
        documentationStatus: 'complete' as any,
        billingStatus: 'billed' as any,
        programName: 'Personal Care Services'
      }
    ],
    statusHistory: [
      {
        id: generateMockId(),
        claimId: baseClaim.id,
        status: ClaimStatus.DRAFT,
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Claim created',
        userId: generateMockId(),
        userName: 'Test User'
      },
      {
        id: generateMockId(),
        claimId: baseClaim.id,
        status: ClaimStatus.VALIDATED,
        timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Validation complete',
        userId: generateMockId(),
        userName: 'Test User'
      },
      {
        id: generateMockId(),
        claimId: baseClaim.id,
        status: baseClaim.claimStatus,
        timestamp: baseClaim.submissionDate ? new Date(baseClaim.submissionDate).toISOString() : new Date().toISOString(),
        notes: baseClaim.claimStatus === ClaimStatus.SUBMITTED ? 'Claim submitted to payer' : 'Status updated',
        userId: generateMockId(),
        userName: 'Test User'
      }
    ]
  };

  // Update services array if provided in overrides
  if (overrides.services) {
    claimWithRelations.services = overrides.services;
  }

  // Update status history if provided in overrides
  if (overrides.statusHistory) {
    claimWithRelations.statusHistory = overrides.statusHistory;
  }

  return {
    ...claimWithRelations,
    ...overrides
  };
};

/**
 * Creates a mock payment with specified overrides
 * 
 * @param overrides - Optional partial payment object to override default values
 * @returns A mock payment object
 */
export const createMockPayment = (overrides: Partial<Payment> = {}): Payment => {
  const basePayment = {...DEFAULT_PAYMENT};
  
  // Generate appropriate reference numbers based on payment method
  if (overrides.paymentMethod && !overrides.referenceNumber) {
    switch(overrides.paymentMethod) {
      case PaymentMethod.EFT:
        basePayment.referenceNumber = `EFT${Math.floor(100000000 + Math.random() * 900000000)}`;
        basePayment.checkNumber = null;
        break;
      case PaymentMethod.CHECK:
        basePayment.referenceNumber = null;
        basePayment.checkNumber = `${Math.floor(1000 + Math.random() * 9000)}`;
        break;
      case PaymentMethod.CREDIT_CARD:
        basePayment.referenceNumber = `CC${Math.floor(100000000 + Math.random() * 900000000)}`;
        basePayment.checkNumber = null;
        break;
      default:
        basePayment.referenceNumber = `REF${Math.floor(100000000 + Math.random() * 900000000)}`;
        basePayment.checkNumber = null;
    }
  }

  return {
    ...basePayment,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock payment with related entities
 * 
 * @param overrides - Optional partial payment with relations object to override default values
 * @returns A mock payment object with related entities
 */
export const createMockPaymentWithRelations = (
  overrides: Partial<PaymentWithRelations> = {}
): PaymentWithRelations => {
  const basePayment = createMockPayment(overrides);
  
  const paymentWithRelations: PaymentWithRelations = {
    ...basePayment,
    payer: {
      id: basePayment.payerId,
      name: 'State Medicaid',
      payerType: 'medicaid' as any,
      isElectronic: true,
      status: 'active' as any
    },
    claimPayments: [
      {
        id: generateMockId(),
        paymentId: basePayment.id,
        claimId: generateMockId(),
        paidAmount: 450.00,
        claim: {
          id: generateMockId(),
          claimNumber: `CLM-${new Date().getFullYear()}-12345`,
          clientId: generateMockId(),
          clientName: 'John Smith',
          payerId: basePayment.payerId,
          payerName: 'State Medicaid',
          claimStatus: ClaimStatus.PAID,
          totalAmount: 450.00,
          serviceStartDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          serviceEndDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          submissionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          claimAge: 15
        },
        adjustments: [],
        createdAt: basePayment.createdAt,
        updatedAt: basePayment.updatedAt
      },
      {
        id: generateMockId(),
        paymentId: basePayment.id,
        claimId: generateMockId(),
        paidAmount: 795.67,
        claim: {
          id: generateMockId(),
          claimNumber: `CLM-${new Date().getFullYear()}-12346`,
          clientId: generateMockId(),
          clientName: 'Jane Doe',
          payerId: basePayment.payerId,
          payerName: 'State Medicaid',
          claimStatus: ClaimStatus.PAID,
          totalAmount: 795.67,
          serviceStartDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          serviceEndDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          submissionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          claimAge: 14
        },
        adjustments: [],
        createdAt: basePayment.createdAt,
        updatedAt: basePayment.updatedAt
      }
    ],
    remittanceInfo: {
      id: generateMockId(),
      paymentId: basePayment.id,
      remittanceNumber: basePayment.remittanceId || `RA${Math.floor(100000000 + Math.random() * 900000000)}`,
      remittanceDate: basePayment.paymentDate,
      payerIdentifier: 'SMNY',
      payerName: 'State Medicaid',
      totalAmount: basePayment.paymentAmount,
      claimCount: 2,
      fileType: 'edi835' as any,
      originalFilename: '835_12345.txt',
      createdAt: basePayment.createdAt,
      updatedAt: basePayment.updatedAt
    }
  };

  // Update claim payments array if provided in overrides
  if (overrides.claimPayments) {
    paymentWithRelations.claimPayments = overrides.claimPayments;
  }

  // Update remittance info if provided in overrides
  if (overrides.remittanceInfo) {
    paymentWithRelations.remittanceInfo = overrides.remittanceInfo;
  }

  return {
    ...paymentWithRelations,
    ...overrides
  };
};

/**
 * Creates a mock program with specified overrides
 * 
 * @param overrides - Optional partial program object to override default values
 * @returns A mock program object
 */
export const createMockProgram = (overrides: Partial<Program> = {}): Program => {
  return {
    ...DEFAULT_PROGRAM,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock payer with specified overrides
 * 
 * @param overrides - Optional partial payer object to override default values
 * @returns A mock payer object
 */
export const createMockPayer = (overrides: Partial<Payer> = {}): Payer => {
  return {
    ...DEFAULT_PAYER,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock report with specified overrides
 * 
 * @param overrides - Optional partial report object to override default values
 * @returns A mock report object
 */
export const createMockReport = (overrides: Partial<Report> = {}): Report => {
  return {
    ...DEFAULT_REPORT,
    id: overrides.id || generateMockId(),
    ...overrides
  };
};

/**
 * Creates a mock date range for a specified period
 * 
 * @param period - String identifier for the period (e.g., 'currentMonth', 'lastWeek')
 * @returns A date range object with start and end dates
 */
export const createMockDateRange = (period: string): DateRange => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;
  
  switch (period) {
    case 'today':
      startDate = now;
      break;
    case 'yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'lastWeek':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'lastMonth':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'lastQuarter':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'lastYear':
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'currentMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'currentQuarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      break;
    case 'currentYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'last30days':
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Pre-defined mock data arrays for common test scenarios

/**
 * Array of pre-defined mock users
 */
export const mockUsers = [
  createMockUser({
    id: generateMockId(),
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    roleName: 'Administrator'
  }),
  createMockUser({
    id: generateMockId(),
    firstName: 'Finance',
    lastName: 'Manager',
    email: 'finance@example.com',
    roleName: 'Financial Manager'
  }),
  createMockUser({
    id: generateMockId(),
    firstName: 'Billing',
    lastName: 'Specialist',
    email: 'billing@example.com',
    roleName: 'Billing Specialist'
  }),
  createMockUser({
    id: generateMockId(),
    firstName: 'Program',
    lastName: 'Manager',
    email: 'program@example.com',
    roleName: 'Program Manager'
  }),
  createMockUser({
    id: generateMockId(),
    firstName: 'Read',
    lastName: 'Only',
    email: 'readonly@example.com',
    roleName: 'Read-Only User',
    status: UserStatus.INACTIVE
  })
];

/**
 * Array of pre-defined mock roles
 */
export const mockRoles = [
  createMockRole({
    id: generateMockId(),
    name: 'Administrator',
    description: 'Full system access'
  }),
  createMockRole({
    id: generateMockId(),
    name: 'Financial Manager',
    description: 'Manages financial operations and reporting'
  }),
  createMockRole({
    id: generateMockId(),
    name: 'Billing Specialist',
    description: 'Handles claims and billing processes'
  }),
  createMockRole({
    id: generateMockId(),
    name: 'Program Manager',
    description: 'Manages specific programs and related data'
  }),
  createMockRole({
    id: generateMockId(),
    name: 'Read-Only User',
    description: 'View-only access to system data'
  })
];

/**
 * Array of pre-defined mock clients
 */
export const mockClients = [
  createMockClient({
    id: generateMockId(),
    firstName: 'John',
    lastName: 'Smith'
  }),
  createMockClient({
    id: generateMockId(),
    firstName: 'Jane',
    lastName: 'Doe'
  }),
  createMockClient({
    id: generateMockId(),
    firstName: 'Robert',
    lastName: 'Johnson'
  }),
  createMockClient({
    id: generateMockId(),
    firstName: 'Maria',
    lastName: 'Garcia'
  }),
  createMockClient({
    id: generateMockId(),
    firstName: 'David',
    lastName: 'Chen'
  })
];

/**
 * Array of pre-defined mock services
 */
export const mockServices = [
  createMockService({
    id: generateMockId(),
    serviceCode: 'T1019',
    units: 4,
    rate: 25.75,
    amount: 103.00
  }),
  createMockService({
    id: generateMockId(),
    serviceCode: 'T1020',
    units: 6,
    rate: 32.50,
    amount: 195.00
  }),
  createMockService({
    id: generateMockId(),
    serviceCode: 'S5125',
    units: 8,
    rate: 18.25,
    amount: 146.00
  }),
  createMockService({
    id: generateMockId(),
    serviceCode: 'H2019',
    units: 2,
    rate: 45.00,
    amount: 90.00
  }),
  createMockService({
    id: generateMockId(),
    serviceCode: 'T2022',
    units: 1,
    rate: 125.00,
    amount: 125.00
  })
];

/**
 * Array of pre-defined mock claims
 */
export const mockClaims = [
  createMockClaim({
    id: generateMockId(),
    claimStatus: ClaimStatus.SUBMITTED,
    totalAmount: 498.00
  }),
  createMockClaim({
    id: generateMockId(),
    claimStatus: ClaimStatus.PENDING,
    totalAmount: 634.50
  }),
  createMockClaim({
    id: generateMockId(),
    claimStatus: ClaimStatus.PAID,
    totalAmount: 412.75,
    adjudicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }),
  createMockClaim({
    id: generateMockId(),
    claimStatus: ClaimStatus.DENIED,
    totalAmount: 287.25,
    denialReason: DenialReason.SERVICE_NOT_COVERED,
    adjudicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }),
  createMockClaim({
    id: generateMockId(),
    claimStatus: ClaimStatus.DRAFT,
    totalAmount: 375.50,
    submissionDate: null
  })
];

/**
 * Array of pre-defined mock payments
 */
export const mockPayments = [
  createMockPayment({
    id: generateMockId(),
    paymentMethod: PaymentMethod.EFT,
    paymentAmount: 1245.67,
    reconciliationStatus: ReconciliationStatus.UNRECONCILED
  }),
  createMockPayment({
    id: generateMockId(),
    paymentMethod: PaymentMethod.CHECK,
    paymentAmount: 876.25,
    reconciliationStatus: ReconciliationStatus.PARTIALLY_RECONCILED
  }),
  createMockPayment({
    id: generateMockId(),
    paymentMethod: PaymentMethod.EFT,
    paymentAmount: 1532.40,
    reconciliationStatus: ReconciliationStatus.RECONCILED
  }),
  createMockPayment({
    id: generateMockId(),
    paymentMethod: PaymentMethod.CREDIT_CARD,
    paymentAmount: 346.75,
    reconciliationStatus: ReconciliationStatus.RECONCILED
  }),
  createMockPayment({
    id: generateMockId(),
    paymentMethod: PaymentMethod.EFT,
    paymentAmount: 981.33,
    reconciliationStatus: ReconciliationStatus.EXCEPTION
  })
];

/**
 * Array of pre-defined mock programs
 */
export const mockPrograms = [
  createMockProgram({
    id: generateMockId(),
    name: 'Personal Care Services',
    code: 'PCS'
  }),
  createMockProgram({
    id: generateMockId(),
    name: 'Residential Services',
    code: 'RES'
  }),
  createMockProgram({
    id: generateMockId(),
    name: 'Day Services',
    code: 'DAY'
  }),
  createMockProgram({
    id: generateMockId(),
    name: 'Respite Care',
    code: 'RSP'
  }),
  createMockProgram({
    id: generateMockId(),
    name: 'Therapy Services',
    code: 'THR'
  })
];

/**
 * Array of pre-defined mock payers
 */
export const mockPayers = [
  createMockPayer({
    id: generateMockId(),
    name: 'State Medicaid',
    payerType: 'medicaid' as any
  }),
  createMockPayer({
    id: generateMockId(),
    name: 'Medicare',
    payerType: 'medicare' as any
  }),
  createMockPayer({
    id: generateMockId(),
    name: 'Blue Cross Blue Shield',
    payerType: 'privateInsurance' as any
  }),
  createMockPayer({
    id: generateMockId(),
    name: 'Managed Care Organization',
    payerType: 'managedCare' as any
  }),
  createMockPayer({
    id: generateMockId(),
    name: 'Self Pay',
    payerType: 'selfPay' as any
  })
];

/**
 * Array of pre-defined mock reports
 */
export const mockReports = [
  createMockReport({
    id: generateMockId(),
    name: 'Revenue by Program',
    type: ReportType.REVENUE_BY_PROGRAM
  }),
  createMockReport({
    id: generateMockId(),
    name: 'Revenue by Payer',
    type: ReportType.REVENUE_BY_PAYER
  }),
  createMockReport({
    id: generateMockId(),
    name: 'Claims Status Report',
    type: ReportType.CLAIMS_STATUS
  }),
  createMockReport({
    id: generateMockId(),
    name: 'Aging Accounts Receivable',
    type: ReportType.AGING_ACCOUNTS_RECEIVABLE
  }),
  createMockReport({
    id: generateMockId(),
    name: 'Denial Analysis',
    type: ReportType.DENIAL_ANALYSIS
  })
];