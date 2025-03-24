import { UUID, ISO8601Date, Address, ContactInfo, StatusType } from '../../types/common.types';
import {
  Client,
  ClientProgram,
  ClientInsurance,
  ClientStatus,
  Gender,
  EmergencyContact,
  InsuranceType
} from '../../types/clients.types';
import { mockPrograms } from './programs.fixtures';
import { mockPayers } from './payers.fixtures';
import { v4 as uuidv4 } from 'uuid'; // version 9.0.0

/**
 * Creates a mock address object for testing
 * 
 * @param overrides - Optional overrides for address properties
 * @returns A complete mock address object
 */
export function createMockAddress(overrides: Partial<Address> = {}): Address {
  return {
    street1: '123 Main Street',
    street2: 'Apt 4B',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    country: 'USA',
    ...overrides
  };
}

/**
 * Creates a mock contact information object for testing
 * 
 * @param overrides - Optional overrides for contact info properties
 * @returns A complete mock contact information object
 */
export function createMockContactInfo(overrides: Partial<ContactInfo> = {}): ContactInfo {
  return {
    email: 'client@example.com',
    phone: '(555) 123-4567',
    alternatePhone: '(555) 987-6543',
    fax: '(555) 456-7890',
    ...overrides
  };
}

/**
 * Creates a mock emergency contact object for testing
 * 
 * @param overrides - Optional overrides for emergency contact properties
 * @returns A complete mock emergency contact object
 */
export function createMockEmergencyContact(overrides: Partial<EmergencyContact> = {}): EmergencyContact {
  return {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phone: '(555) 234-5678',
    alternatePhone: null,
    email: 'emergency@example.com',
    ...overrides
  };
}

/**
 * Creates a mock client program enrollment object for testing
 * 
 * @param overrides - Optional overrides for client program properties
 * @param clientId - Optional client ID to associate with the program
 * @returns A complete mock client program enrollment object
 */
export function createMockClientProgram(
  overrides: Partial<ClientProgram> = {},
  clientId: UUID = uuidv4()
): ClientProgram {
  const id = overrides.id || uuidv4();
  
  // Select a random program from mockPrograms
  const randomProgram = mockPrograms.length > 0 
    ? mockPrograms[Math.floor(Math.random() * mockPrograms.length)] 
    : { id: uuidv4(), name: 'Mock Program', code: 'MP001' };
  
  const programId = overrides.programId || randomProgram.id;
  
  return {
    id,
    clientId,
    programId,
    program: {
      id: programId,
      name: randomProgram.name || 'Mock Program',
      code: randomProgram.code || 'MP001'
    },
    startDate: '2023-01-01',
    endDate: null,
    status: StatusType.ACTIVE,
    notes: null,
    ...overrides
  };
}

/**
 * Creates a mock client insurance object for testing
 * 
 * @param overrides - Optional overrides for client insurance properties
 * @param clientId - Optional client ID to associate with the insurance
 * @returns A complete mock client insurance object
 */
export function createMockClientInsurance(
  overrides: Partial<ClientInsurance> = {},
  clientId: UUID = uuidv4()
): ClientInsurance {
  const id = overrides.id || uuidv4();
  
  // Select a random payer from mockPayers
  const randomPayer = mockPayers.length > 0 
    ? mockPayers[Math.floor(Math.random() * mockPayers.length)] 
    : { id: uuidv4(), name: 'Mock Payer', payerId: 'MP001' };
  
  const payerId = overrides.payerId || randomPayer.id;
  
  return {
    id,
    clientId,
    type: InsuranceType.MEDICAID,
    payerId,
    payer: {
      id: payerId,
      name: randomPayer.name || 'Mock Payer',
      code: randomPayer.payerId || 'MP001'
    },
    policyNumber: 'POL123456789',
    groupNumber: 'GRP987654321',
    subscriberName: null,
    subscriberRelationship: null,
    effectiveDate: '2023-01-01',
    terminationDate: null,
    isPrimary: true,
    status: StatusType.ACTIVE,
    ...overrides
  };
}

/**
 * Creates a complete mock client object for testing
 * 
 * @param overrides - Optional overrides for client properties
 * @returns A complete mock client object with all required properties
 */
export function createMockClient(overrides: Partial<Client> = {}): Client {
  // Generate a UUID for the client if not provided
  const id = overrides.id || uuidv4();
  
  // Create default address, contact info, and emergency contact if not provided
  const address = overrides.address || createMockAddress();
  const contactInfo = overrides.contactInfo || createMockContactInfo();
  const emergencyContact = overrides.emergencyContact || createMockEmergencyContact();
  
  // Create default programs and insurances if not provided
  const programs = overrides.programs || [
    createMockClientProgram({}, id)
  ];
  
  const insurances = overrides.insurances || [
    createMockClientInsurance({
      type: InsuranceType.MEDICAID,
      isPrimary: true
    }, id)
  ];
  
  // Create default client object
  const defaultClient: Client = {
    id,
    firstName: 'John',
    lastName: 'Doe',
    middleName: null,
    dateOfBirth: '1980-01-01',
    gender: Gender.MALE,
    medicaidId: 'MCD123456789',
    medicareId: null,
    ssn: '123-45-6789',
    address,
    contactInfo,
    emergencyContact,
    status: ClientStatus.ACTIVE,
    programs,
    insurances,
    notes: 'This is a mock client for testing purposes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    updatedBy: null
  };
  
  // Apply overrides and return
  return {
    ...defaultClient,
    ...overrides
  };
}

/**
 * Creates an array of mock client objects for testing
 * 
 * @param count - Number of mock clients to create
 * @param overrides - Optional overrides to apply to all clients
 * @returns An array of mock client objects
 */
export function createMockClients(count: number, overrides: Partial<Client> = {}): Client[] {
  const clients: Client[] = [];
  
  for (let i = 0; i < count; i++) {
    clients.push(createMockClient({
      ...overrides,
      firstName: `Test${i + 1}`,
      lastName: `Client${i + 1}`,
      medicaidId: `MCD${100000 + i}`,
      ssn: `${100 + i}-${45 + i}-${6789 + i}`
    }));
  }
  
  return clients;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Mock address for testing
 */
export const mockAddress: Address = {
  street1: '123 Main Street',
  street2: 'Apt 4B',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62704',
  country: 'USA'
};

/**
 * Mock contact information for testing
 */
export const mockContactInfo: ContactInfo = {
  email: 'client@example.com',
  phone: '(555) 123-4567',
  alternatePhone: '(555) 987-6543',
  fax: '(555) 456-7890'
};

/**
 * Mock emergency contact for testing
 */
export const mockEmergencyContact: EmergencyContact = {
  name: 'Jane Doe',
  relationship: 'Spouse',
  phone: '(555) 234-5678',
  alternatePhone: null,
  email: 'emergency@example.com'
};

/**
 * Mock client program enrollment for testing
 */
export const mockClientProgram: ClientProgram = {
  id: uuidv4(),
  clientId: uuidv4(),
  programId: mockPrograms.length > 0 ? mockPrograms[0].id : uuidv4(),
  program: {
    id: mockPrograms.length > 0 ? mockPrograms[0].id : uuidv4(),
    name: mockPrograms.length > 0 ? mockPrograms[0].name : 'Personal Care Program',
    code: mockPrograms.length > 0 ? mockPrograms[0].code : 'PC001'
  },
  startDate: '2023-01-01',
  endDate: null,
  status: StatusType.ACTIVE,
  notes: null
};

/**
 * Mock client insurance for testing
 */
export const mockClientInsurance: ClientInsurance = {
  id: uuidv4(),
  clientId: uuidv4(),
  type: InsuranceType.MEDICAID,
  payerId: mockPayers.length > 0 ? mockPayers[0].id : uuidv4(),
  payer: {
    id: mockPayers.length > 0 ? mockPayers[0].id : uuidv4(),
    name: mockPayers.length > 0 ? mockPayers[0].name : 'State Medicaid',
    code: mockPayers.length > 0 ? mockPayers[0].payerId : 'MEDICAID001'
  },
  policyNumber: 'POL123456789',
  groupNumber: 'GRP987654321',
  subscriberName: null,
  subscriberRelationship: null,
  effectiveDate: '2023-01-01',
  terminationDate: null,
  isPrimary: true,
  status: StatusType.ACTIVE
};

/**
 * Mock client for testing
 */
export const mockClient: Client = createMockClient();

/**
 * Mock active client for testing
 */
export const mockActiveClient: Client = createMockClient({
  status: ClientStatus.ACTIVE,
  firstName: 'Active',
  lastName: 'Client'
});

/**
 * Mock inactive client for testing
 */
export const mockInactiveClient: Client = createMockClient({
  status: ClientStatus.INACTIVE,
  firstName: 'Inactive',
  lastName: 'Client'
});

/**
 * Mock pending client for testing
 */
export const mockPendingClient: Client = createMockClient({
  status: ClientStatus.PENDING,
  firstName: 'Pending',
  lastName: 'Client'
});

/**
 * Mock client with Medicaid insurance for testing
 */
export const mockClientWithMedicaid: Client = createMockClient({
  firstName: 'Medicaid',
  lastName: 'Client',
  medicaidId: 'MCD123456789',
  insurances: [
    createMockClientInsurance({
      type: InsuranceType.MEDICAID,
      isPrimary: true
    })
  ]
});

/**
 * Mock client with Medicare insurance for testing
 */
export const mockClientWithMedicare: Client = createMockClient({
  firstName: 'Medicare',
  lastName: 'Client',
  medicareId: 'MCR123456789',
  insurances: [
    createMockClientInsurance({
      type: InsuranceType.MEDICARE,
      isPrimary: true
    })
  ]
});

/**
 * Mock client with private insurance for testing
 */
export const mockClientWithPrivateInsurance: Client = createMockClient({
  firstName: 'Private',
  lastName: 'Insurance',
  insurances: [
    createMockClientInsurance({
      type: InsuranceType.PRIVATE,
      isPrimary: true
    })
  ]
});

/**
 * Array of mock clients for testing
 */
export const mockClients: Client[] = createMockClients(5);