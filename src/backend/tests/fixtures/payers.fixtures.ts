import { UUID, ISO8601Date, StatusType, Address, ContactInfo } from '../../types/common.types';
import { PayerType, SubmissionFormat, BillingRequirements, SubmissionMethod } from '../../models/payer.model';
import { v4 as uuidv4 } from 'uuid'; // version 9.0.0

/**
 * Creates a mock address object for testing
 * @param overrides - Optional overrides for address properties
 * @returns A complete mock address object
 */
export function createMockAddress(overrides: Partial<Address> = {}): Address {
  return {
    street1: '123 Main Street',
    street2: 'Suite 100',
    city: 'Springfield',
    state: 'NY',
    zipCode: '12345',
    country: 'USA',
    ...overrides
  };
}

/**
 * Creates a mock contact information object for testing
 * @param overrides - Optional overrides for contact info properties
 * @returns A complete mock contact information object
 */
export function createMockContactInfo(overrides: Partial<ContactInfo> = {}): ContactInfo {
  return {
    email: 'contact@payerexample.com',
    phone: '(555) 123-4567',
    alternatePhone: '(555) 987-6543',
    fax: '(555) 123-4568',
    ...overrides
  };
}

/**
 * Creates a mock billing requirements object for testing
 * @param overrides - Optional overrides for billing requirements properties
 * @returns A complete mock billing requirements object
 */
export function createMockBillingRequirements(overrides: Partial<BillingRequirements> = {}): BillingRequirements {
  return {
    submissionFormat: SubmissionFormat.EDI_837P,
    timely_filing_days: 90,
    requires_authorization: true,
    required_fields: ['clientId', 'serviceDate', 'procedureCode', 'diagnosisCode'],
    claim_frequency_limit: 1,
    service_line_limit: 50,
    custom_requirements: {
      requiresReferringProvider: true,
      allowsGrouping: true
    },
    ...overrides
  };
}

/**
 * Creates a mock submission method object for testing
 * @param overrides - Optional overrides for submission method properties
 * @returns A complete mock submission method object
 */
export function createMockSubmissionMethod(overrides: Partial<SubmissionMethod> = {}): SubmissionMethod {
  return {
    method: 'clearinghouse',
    endpoint: 'https://api.clearinghouse.example.com/claims',
    credentials: {
      username: 'testuser',
      password: 'password123',
      api_key: 'testapikey123'
    },
    clearinghouse: 'Change Healthcare',
    trading_partner_id: 'TP12345',
    configuration: {
      submitterID: 'SUBM123',
      receiverID: 'RECV456',
      useTestIndicator: true
    },
    ...overrides
  };
}

/**
 * Creates a complete mock payer object for testing
 * @param overrides - Optional overrides for payer properties
 * @returns A complete mock payer object with all required properties
 */
export function createMockPayer(overrides: Partial<any> = {}): any {
  // Generate a random ID if not provided
  const id = overrides.id || uuidv4();
  
  // Create default payer object
  const defaultPayer = {
    id,
    name: `Mock Payer ${id.substring(0, 4)}`,
    payerType: PayerType.MEDICAID,
    payerId: `PAYER${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
    address: createMockAddress(),
    contactInfo: createMockContactInfo(),
    billingRequirements: createMockBillingRequirements(),
    submissionMethod: createMockSubmissionMethod(),
    isElectronic: true,
    status: StatusType.ACTIVE,
    notes: 'This is a mock payer for testing purposes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null as UUID | null,
    updatedBy: null as UUID | null
  };
  
  // Apply overrides and return
  return {
    ...defaultPayer,
    ...overrides
  };
}

/**
 * Creates an array of mock payer objects for testing
 * @param count - Number of mock payers to create
 * @param overrides - Optional overrides to apply to all payers
 * @returns An array of mock payer objects
 */
export function createMockPayers(count: number, overrides: Partial<any> = {}): any[] {
  const payers: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const payer = createMockPayer({
      ...overrides,
      name: `Mock Payer ${i + 1}`
    });
    payers.push(payer);
  }
  
  return payers;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Mock address for testing
 */
export const mockAddress: Address = {
  street1: '123 Main Street',
  street2: 'Suite 100',
  city: 'Springfield',
  state: 'NY',
  zipCode: '12345',
  country: 'USA'
};

/**
 * Mock contact information for testing
 */
export const mockContactInfo: ContactInfo = {
  email: 'contact@payerexample.com',
  phone: '(555) 123-4567',
  alternatePhone: '(555) 987-6543',
  fax: '(555) 123-4568'
};

/**
 * Mock billing requirements for testing
 */
export const mockBillingRequirements: BillingRequirements = {
  submissionFormat: SubmissionFormat.EDI_837P,
  timely_filing_days: 90,
  requires_authorization: true,
  required_fields: ['clientId', 'serviceDate', 'procedureCode', 'diagnosisCode'],
  claim_frequency_limit: 1,
  service_line_limit: 50,
  custom_requirements: {
    requiresReferringProvider: true,
    allowsGrouping: true
  }
};

/**
 * Mock submission method for testing
 */
export const mockSubmissionMethod: SubmissionMethod = {
  method: 'clearinghouse',
  endpoint: 'https://api.clearinghouse.example.com/claims',
  credentials: {
    username: 'testuser',
    password: 'password123',
    api_key: 'testapikey123'
  },
  clearinghouse: 'Change Healthcare',
  trading_partner_id: 'TP12345',
  configuration: {
    submitterID: 'SUBM123',
    receiverID: 'RECV456',
    useTestIndicator: true
  }
};

/**
 * Mock Medicaid payer for testing
 */
export const mockMedicaidPayer = createMockPayer({
  id: uuidv4(),
  name: 'State Medicaid',
  payerType: PayerType.MEDICAID,
  payerId: 'MEDICAID001',
  billingRequirements: createMockBillingRequirements({
    timely_filing_days: 120,
    required_fields: ['clientId', 'serviceDate', 'procedureCode', 'diagnosisCode', 'medicaidId'],
    custom_requirements: {
      requiresNPI: true,
      requiresReferringProvider: true
    }
  })
});

/**
 * Mock Medicare payer for testing
 */
export const mockMedicarePayer = createMockPayer({
  id: uuidv4(),
  name: 'Medicare',
  payerType: PayerType.MEDICARE,
  payerId: 'MEDICARE001',
  billingRequirements: createMockBillingRequirements({
    timely_filing_days: 365,
    required_fields: ['clientId', 'serviceDate', 'procedureCode', 'diagnosisCode', 'medicareId'],
    custom_requirements: {
      requiresNPI: true,
      requiresMBINumber: true
    }
  })
});

/**
 * Mock private insurance payer for testing
 */
export const mockPrivateInsurancePayer = createMockPayer({
  id: uuidv4(),
  name: 'Acme Health Insurance',
  payerType: PayerType.PRIVATE_INSURANCE,
  payerId: 'ACME001',
  billingRequirements: createMockBillingRequirements({
    timely_filing_days: 60,
    required_fields: ['clientId', 'serviceDate', 'procedureCode', 'diagnosisCode', 'subscriberId', 'groupNumber'],
    custom_requirements: {
      requiresAuthorizationNumber: true,
      requiresCopayAmount: true
    }
  })
});

/**
 * Mock self-pay payer for testing
 */
export const mockSelfPayPayer = createMockPayer({
  id: uuidv4(),
  name: 'Self Pay',
  payerType: PayerType.SELF_PAY,
  payerId: 'SELFPAY',
  address: null,
  contactInfo: null,
  billingRequirements: null,
  submissionMethod: null,
  isElectronic: false
});

/**
 * Mock active payer for testing
 */
export const mockActivePayer = createMockPayer({
  id: uuidv4(),
  name: 'Active Payer',
  status: StatusType.ACTIVE
});

/**
 * Mock inactive payer for testing
 */
export const mockInactivePayer = createMockPayer({
  id: uuidv4(),
  name: 'Inactive Payer',
  status: StatusType.INACTIVE
});

/**
 * Mock electronic payer for testing
 */
export const mockElectronicPayer = createMockPayer({
  id: uuidv4(),
  name: 'Electronic Payer',
  isElectronic: true,
  submissionMethod: createMockSubmissionMethod({
    method: 'direct',
    endpoint: 'https://api.payer.example.com/claims'
  })
});

/**
 * Mock paper-based payer for testing
 */
export const mockPaperPayer = createMockPayer({
  id: uuidv4(),
  name: 'Paper Payer',
  isElectronic: false,
  submissionMethod: createMockSubmissionMethod({
    method: 'paper',
    endpoint: null,
    credentials: null,
    clearinghouse: null,
    trading_partner_id: null
  })
});

/**
 * Array of mock payers for testing
 */
export const mockPayers = createMockPayers(5);