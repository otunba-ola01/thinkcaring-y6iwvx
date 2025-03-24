import { 
  Client, 
  ClientSummary, 
  ClientProgram, 
  ClientInsurance, 
  ClientStatus, 
  Gender, 
  InsuranceType, 
  ProgramReference, 
  PayerReference 
} from '../../types/clients.types';
import { UUID, Status, ISO8601Date } from '../../types/common.types';

/**
 * Mock program references for client programs
 */
export const mockProgramReferences: ProgramReference[] = [
  {
    id: "8a9s87d9-8as9-4df9-b309-sdf98sd7f9sd",
    name: "Personal Care",
    code: "PC101"
  },
  {
    id: "7ba65dce-a908-4d66-b97c-f446892a9e22",
    name: "Residential Services",
    code: "RS202"
  },
  {
    id: "c45f9d12-b67d-4c98-8a23-59afef6ab345",
    name: "Day Services",
    code: "DS303"
  },
  {
    id: "9e7d532b-6a1c-45e7-9b4f-88e129a6d1db",
    name: "Respite Care",
    code: "RC404"
  },
  {
    id: "1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
    name: "Skill Building",
    code: "SB505"
  }
];

/**
 * Mock payer references for client insurance
 */
export const mockPayerReferences: PayerReference[] = [
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    name: "State Medicaid",
    type: "medicaid"
  },
  {
    id: "b2c3d4e5-f6a7-8b9c-0d1e-f2a3b4c5d6e7",
    name: "Medicare",
    type: "medicare"
  },
  {
    id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    name: "Blue Cross Blue Shield",
    type: "private"
  },
  {
    id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    name: "Aetna",
    type: "private"
  },
  {
    id: "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    name: "United Healthcare",
    type: "private"
  }
];

/**
 * Mock client program enrollments
 */
export const mockClientPrograms: ClientProgram[] = [
  {
    id: "p1a2b3c4-d5e6-f7a8-9b0c-d1e2f3a4b5c6",
    clientId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    programId: "8a9s87d9-8as9-4df9-b309-sdf98sd7f9sd",
    program: mockProgramReferences[0], // Personal Care
    startDate: "2022-01-15",
    endDate: null,
    status: Status.ACTIVE,
    notes: "Client requires assistance with daily activities."
  },
  {
    id: "p2b3c4d5-e6f7-a8b9-0c1d-e2f3a4b5c6d7",
    clientId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    programId: "9e7d532b-6a1c-45e7-9b4f-88e129a6d1db",
    program: mockProgramReferences[3], // Respite Care
    startDate: "2022-03-10",
    endDate: null,
    status: Status.ACTIVE,
    notes: null
  },
  {
    id: "p3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8",
    clientId: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    programId: "7ba65dce-a908-4d66-b97c-f446892a9e22",
    program: mockProgramReferences[1], // Residential Services
    startDate: "2021-11-20",
    endDate: null,
    status: Status.ACTIVE,
    notes: "Client is well-adjusted to group home setting."
  },
  {
    id: "p4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9",
    clientId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    programId: "c45f9d12-b67d-4c98-8a23-59afef6ab345",
    program: mockProgramReferences[2], // Day Services
    startDate: "2022-02-05",
    endDate: null,
    status: Status.ACTIVE,
    notes: "Client engages well in group activities."
  },
  {
    id: "p5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0",
    clientId: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    programId: "1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
    program: mockProgramReferences[4], // Skill Building
    startDate: "2022-04-15",
    endDate: "2022-10-15",
    status: Status.INACTIVE,
    notes: "Client completed program successfully."
  },
  {
    id: "p6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1",
    clientId: "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    programId: "8a9s87d9-8as9-4df9-b309-sdf98sd7f9sd",
    program: mockProgramReferences[0], // Personal Care
    startDate: "2022-05-01",
    endDate: null,
    status: Status.ACTIVE,
    notes: null
  },
  {
    id: "p7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2",
    clientId: "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
    programId: "c45f9d12-b67d-4c98-8a23-59afef6ab345",
    program: mockProgramReferences[2], // Day Services
    startDate: "2021-09-10",
    endDate: null,
    status: Status.ACTIVE,
    notes: "Client enjoys art and music activities."
  },
  {
    id: "p8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3",
    clientId: "g7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d",
    programId: "9e7d532b-6a1c-45e7-9b4f-88e129a6d1db",
    program: mockProgramReferences[3], // Respite Care
    startDate: "2022-06-15",
    endDate: null,
    status: Status.PENDING,
    notes: "Awaiting authorization approval."
  }
];

/**
 * Mock client insurance information
 */
export const mockClientInsurances: ClientInsurance[] = [
  {
    id: "i1a2b3c4-d5e6-f7a8-9b0c-d1e2f3a4b5c6",
    clientId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    type: InsuranceType.MEDICAID,
    payerId: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    payer: mockPayerReferences[0], // State Medicaid
    policyNumber: "MCD12345678",
    groupNumber: null,
    subscriberName: "John Smith",
    subscriberRelationship: "Self",
    effectiveDate: "2022-01-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  },
  {
    id: "i2b3c4d5-e6f7-a8b9-0c1d-e2f3a4b5c6d7",
    clientId: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    type: InsuranceType.MEDICAID,
    payerId: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    payer: mockPayerReferences[0], // State Medicaid
    policyNumber: "MCD23456789",
    groupNumber: null,
    subscriberName: "Jane Doe",
    subscriberRelationship: "Self",
    effectiveDate: "2021-11-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  },
  {
    id: "i3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8",
    clientId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    type: InsuranceType.MEDICARE,
    payerId: "b2c3d4e5-f6a7-8b9c-0d1e-f2a3b4c5d6e7",
    payer: mockPayerReferences[1], // Medicare
    policyNumber: "MCR34567890",
    groupNumber: null,
    subscriberName: "Robert Johnson",
    subscriberRelationship: "Self",
    effectiveDate: "2022-01-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  },
  {
    id: "i4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9",
    clientId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    type: InsuranceType.PRIVATE,
    payerId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    payer: mockPayerReferences[2], // Blue Cross Blue Shield
    policyNumber: "BCBS45678901",
    groupNumber: "GRP123456",
    subscriberName: "Mary Johnson",
    subscriberRelationship: "Spouse",
    effectiveDate: "2022-01-01",
    terminationDate: null,
    isPrimary: false,
    status: Status.ACTIVE
  },
  {
    id: "i5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0",
    clientId: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    type: InsuranceType.MEDICAID,
    payerId: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    payer: mockPayerReferences[0], // State Medicaid
    policyNumber: "MCD56789012",
    groupNumber: null,
    subscriberName: "Michael Brown",
    subscriberRelationship: "Self",
    effectiveDate: "2022-03-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  },
  {
    id: "i6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1",
    clientId: "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    type: InsuranceType.PRIVATE,
    payerId: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    payer: mockPayerReferences[3], // Aetna
    policyNumber: "AET67890123",
    groupNumber: "GRP234567",
    subscriberName: "Sarah Wilson",
    subscriberRelationship: "Self",
    effectiveDate: "2022-04-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  },
  {
    id: "i7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2",
    clientId: "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
    type: InsuranceType.MEDICAID,
    payerId: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    payer: mockPayerReferences[0], // State Medicaid
    policyNumber: "MCD78901234",
    groupNumber: null,
    subscriberName: "David Lee",
    subscriberRelationship: "Self",
    effectiveDate: "2021-09-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  },
  {
    id: "i8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3",
    clientId: "g7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d",
    type: InsuranceType.PRIVATE,
    payerId: "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    payer: mockPayerReferences[4], // United Healthcare
    policyNumber: "UHC89012345",
    groupNumber: "GRP345678",
    subscriberName: "Thomas Young",
    subscriberRelationship: "Self",
    effectiveDate: "2022-05-01",
    terminationDate: null,
    isPrimary: true,
    status: Status.ACTIVE
  }
];

/**
 * Mock client data with complete information for testing
 */
export const mockClients: Client[] = [
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    firstName: "John",
    lastName: "Smith",
    middleName: "Robert",
    dateOfBirth: "1985-06-15",
    gender: Gender.MALE,
    medicaidId: "MCD12345678",
    medicareId: null,
    ssn: "123-45-6789",
    address: {
      street1: "123 Main St",
      street2: "Apt 4B",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      country: "USA"
    },
    contactInfo: {
      email: "john.smith@example.com",
      phone: "217-555-1234",
      alternatePhone: null,
      fax: null
    },
    emergencyContact: {
      name: "Mary Smith",
      relationship: "Spouse",
      phone: "217-555-5678",
      alternatePhone: null,
      email: "mary.smith@example.com"
    },
    status: ClientStatus.ACTIVE,
    programs: mockClientPrograms.filter(program => program.clientId === "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"),
    notes: "Client has been in the program for over a year with good progress.",
    createdAt: "2022-01-10T09:30:00.000Z",
    updatedAt: "2023-05-15T14:22:00.000Z"
  },
  {
    id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    firstName: "Jane",
    lastName: "Doe",
    middleName: null,
    dateOfBirth: "1992-03-24",
    gender: Gender.FEMALE,
    medicaidId: "MCD23456789",
    medicareId: null,
    ssn: "234-56-7890",
    address: {
      street1: "456 Oak Ave",
      street2: null,
      city: "Riverdale",
      state: "NY",
      zipCode: "10471",
      country: "USA"
    },
    contactInfo: {
      email: "jane.doe@example.com",
      phone: "718-555-2345",
      alternatePhone: "718-555-3456",
      fax: null
    },
    emergencyContact: {
      name: "John Doe",
      relationship: "Father",
      phone: "718-555-4567",
      alternatePhone: null,
      email: "john.doe.sr@example.com"
    },
    status: ClientStatus.ACTIVE,
    programs: mockClientPrograms.filter(program => program.clientId === "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"),
    notes: "Client requires consistent support in residential setting.",
    createdAt: "2021-11-15T11:45:00.000Z",
    updatedAt: "2023-04-22T10:15:00.000Z"
  },
  {
    id: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    firstName: "Robert",
    lastName: "Johnson",
    middleName: "James",
    dateOfBirth: "1960-12-05",
    gender: Gender.MALE,
    medicaidId: null,
    medicareId: "MCR34567890",
    ssn: "345-67-8901",
    address: {
      street1: "789 Pine St",
      street2: null,
      city: "Columbus",
      state: "OH",
      zipCode: "43215",
      country: "USA"
    },
    contactInfo: {
      email: "robert.johnson@example.com",
      phone: "614-555-3456",
      alternatePhone: null,
      fax: null
    },
    emergencyContact: {
      name: "Mary Johnson",
      relationship: "Spouse",
      phone: "614-555-4567",
      alternatePhone: null,
      email: "mary.johnson@example.com"
    },
    status: ClientStatus.ACTIVE,
    programs: mockClientPrograms.filter(program => program.clientId === "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"),
    notes: "Client attends day program 3 times per week.",
    createdAt: "2022-02-01T10:15:00.000Z",
    updatedAt: "2023-05-10T15:30:00.000Z"
  },
  {
    id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    firstName: "Michael",
    lastName: "Brown",
    middleName: "Thomas",
    dateOfBirth: "1988-08-12",
    gender: Gender.MALE,
    medicaidId: "MCD56789012",
    medicareId: null,
    ssn: "456-78-9012",
    address: {
      street1: "101 Elm St",
      street2: "Unit 304",
      city: "Portland",
      state: "OR",
      zipCode: "97205",
      country: "USA"
    },
    contactInfo: {
      email: "michael.brown@example.com",
      phone: "503-555-4567",
      alternatePhone: null,
      fax: null
    },
    emergencyContact: {
      name: "Jennifer Brown",
      relationship: "Sister",
      phone: "503-555-5678",
      alternatePhone: null,
      email: "jennifer.brown@example.com"
    },
    status: ClientStatus.INACTIVE,
    programs: mockClientPrograms.filter(program => program.clientId === "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"),
    notes: "Client completed skill building program and is no longer receiving services.",
    createdAt: "2022-04-10T09:00:00.000Z",
    updatedAt: "2022-10-20T16:45:00.000Z"
  },
  {
    id: "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    firstName: "Sarah",
    lastName: "Wilson",
    middleName: null,
    dateOfBirth: "1995-02-28",
    gender: Gender.FEMALE,
    medicaidId: null,
    medicareId: null,
    ssn: "567-89-0123",
    address: {
      street1: "202 Maple Dr",
      street2: null,
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "USA"
    },
    contactInfo: {
      email: "sarah.wilson@example.com",
      phone: "512-555-5678",
      alternatePhone: "512-555-6789",
      fax: null
    },
    emergencyContact: {
      name: "James Wilson",
      relationship: "Father",
      phone: "512-555-7890",
      alternatePhone: null,
      email: "james.wilson@example.com"
    },
    status: ClientStatus.ACTIVE,
    programs: mockClientPrograms.filter(program => program.clientId === "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b"),
    notes: "Client receives personal care assistance daily.",
    createdAt: "2022-04-25T13:30:00.000Z",
    updatedAt: "2023-05-18T11:20:00.000Z"
  },
  {
    id: "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
    firstName: "David",
    lastName: "Lee",
    middleName: "Alan",
    dateOfBirth: "1975-09-03",
    gender: Gender.MALE,
    medicaidId: "MCD78901234",
    medicareId: null,
    ssn: "678-90-1234",
    address: {
      street1: "303 Birch Ln",
      street2: "Apt 12",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "USA"
    },
    contactInfo: {
      email: "david.lee@example.com",
      phone: "206-555-6789",
      alternatePhone: null,
      fax: null
    },
    emergencyContact: {
      name: "Emily Lee",
      relationship: "Spouse",
      phone: "206-555-7890",
      alternatePhone: null,
      email: "emily.lee@example.com"
    },
    status: ClientStatus.ACTIVE,
    programs: mockClientPrograms.filter(program => program.clientId === "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c"),
    notes: "Client has been attending day program consistently.",
    createdAt: "2021-09-05T14:20:00.000Z",
    updatedAt: "2023-05-05T09:45:00.000Z"
  },
  {
    id: "g7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d",
    firstName: "Thomas",
    lastName: "Young",
    middleName: null,
    dateOfBirth: "1990-11-15",
    gender: Gender.MALE,
    medicaidId: null,
    medicareId: null,
    ssn: "789-01-2345",
    address: {
      street1: "404 Cedar St",
      street2: null,
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      country: "USA"
    },
    contactInfo: {
      email: "thomas.young@example.com",
      phone: "303-555-7890",
      alternatePhone: null,
      fax: null
    },
    emergencyContact: {
      name: "Lisa Young",
      relationship: "Mother",
      phone: "303-555-8901",
      alternatePhone: null,
      email: "lisa.young@example.com"
    },
    status: ClientStatus.PENDING,
    programs: mockClientPrograms.filter(program => program.clientId === "g7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d"),
    insurances: mockClientInsurances.filter(insurance => insurance.clientId === "g7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d"),
    notes: "Client pending approval for respite care services.",
    createdAt: "2022-06-10T15:30:00.000Z",
    updatedAt: "2022-06-10T15:30:00.000Z"
  }
];

/**
 * Simplified client data for list views
 */
export const mockClientSummaries: ClientSummary[] = mockClients.map(client => ({
  id: client.id,
  firstName: client.firstName,
  lastName: client.lastName,
  dateOfBirth: client.dateOfBirth,
  medicaidId: client.medicaidId,
  status: client.status,
  programs: client.programs.map(program => program.program.name)
}));

/**
 * Mock paginated response for client list API
 */
export const mockClientListResponse = {
  items: mockClientSummaries,
  totalItems: mockClientSummaries.length,
  page: 1,
  pageSize: 10,
  totalPages: 1
};