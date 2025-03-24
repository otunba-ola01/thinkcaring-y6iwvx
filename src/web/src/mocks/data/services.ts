import { 
  Service, 
  ServiceWithRelations, 
  ServiceSummary, 
  ServiceType, 
  DocumentationStatus, 
  BillingStatus, 
  ServiceValidationResult, 
  ServiceValidationError, 
  ServiceValidationWarning, 
  ServiceMetrics 
} from '../../types/services.types';
import { 
  Status, 
  UUID, 
  ISO8601Date, 
  EntityReference 
} from '../../types/common.types';
import { 
  mockClientSummaries, 
  mockProgramReferences 
} from './clients';

/**
 * Mock service types for service categorization
 */
export const mockServiceTypes = [
  {
    id: "st001-0000-0000-0000-000000000000" as UUID,
    name: "Personal Care",
    code: "PC101",
    type: ServiceType.PERSONAL_CARE,
    defaultRate: 25.50,
    status: Status.ACTIVE
  },
  {
    id: "st002-0000-0000-0000-000000000000" as UUID,
    name: "Residential Services",
    code: "RS202",
    type: ServiceType.RESIDENTIAL,
    defaultRate: 150.00,
    status: Status.ACTIVE
  },
  {
    id: "st003-0000-0000-0000-000000000000" as UUID,
    name: "Day Services",
    code: "DS303",
    type: ServiceType.DAY_SERVICES,
    defaultRate: 85.75,
    status: Status.ACTIVE
  },
  {
    id: "st004-0000-0000-0000-000000000000" as UUID,
    name: "Respite Care",
    code: "RC404",
    type: ServiceType.RESPITE,
    defaultRate: 32.00,
    status: Status.ACTIVE
  },
  {
    id: "st005-0000-0000-0000-000000000000" as UUID,
    name: "Therapy Session",
    code: "TS505",
    type: ServiceType.THERAPY,
    defaultRate: 95.00,
    status: Status.ACTIVE
  },
  {
    id: "st006-0000-0000-0000-000000000000" as UUID,
    name: "Transportation",
    code: "TR606",
    type: ServiceType.TRANSPORTATION,
    defaultRate: 18.50,
    status: Status.ACTIVE
  },
  {
    id: "st007-0000-0000-0000-000000000000" as UUID,
    name: "Case Management",
    code: "CM707",
    type: ServiceType.CASE_MANAGEMENT,
    defaultRate: 65.00,
    status: Status.ACTIVE
  }
];

/**
 * Mock staff data for service providers
 */
const mockStaff = [
  {
    id: "staff001-0000-0000-0000-000000000000" as UUID,
    firstName: "Sarah",
    lastName: "Johnson",
    title: "Personal Care Aide"
  },
  {
    id: "staff002-0000-0000-0000-000000000000" as UUID,
    firstName: "Michael",
    lastName: "Brown",
    title: "Program Supervisor"
  },
  {
    id: "staff003-0000-0000-0000-000000000000" as UUID,
    firstName: "Jessica",
    lastName: "Davis",
    title: "Therapist"
  },
  {
    id: "staff004-0000-0000-0000-000000000000" as UUID,
    firstName: "David",
    lastName: "Wilson",
    title: "Case Manager"
  }
];

/**
 * Mock facility data for service locations
 */
const mockFacilities = [
  {
    id: "fac001-0000-0000-0000-000000000000" as UUID,
    name: "Main Day Center",
    type: "Day Program Facility"
  },
  {
    id: "fac002-0000-0000-0000-000000000000" as UUID,
    name: "Residential Home A",
    type: "Group Home"
  },
  {
    id: "fac003-0000-0000-0000-000000000000" as UUID,
    name: "Therapy Center",
    type: "Outpatient Facility"
  }
];

/**
 * Mock authorizations for services
 */
const mockAuthorizations = [
  {
    id: "auth001-0000-0000-0000-000000000000" as UUID,
    number: "AUTH2023-456",
    startDate: "2023-01-01" as ISO8601Date,
    endDate: "2023-12-31" as ISO8601Date,
    authorizedUnits: 240,
    usedUnits: 185
  },
  {
    id: "auth002-0000-0000-0000-000000000000" as UUID,
    number: "AUTH2023-789",
    startDate: "2023-02-15" as ISO8601Date,
    endDate: "2023-08-15" as ISO8601Date,
    authorizedUnits: 180,
    usedUnits: 120
  },
  {
    id: "auth003-0000-0000-0000-000000000000" as UUID,
    number: "AUTH2023-123",
    startDate: "2023-03-01" as ISO8601Date,
    endDate: "2024-02-28" as ISO8601Date,
    authorizedUnits: 365,
    usedUnits: 95
  }
];

/**
 * Mock claim data for billed services
 */
const mockClaims = [
  {
    id: "claim001-0000-0000-0000-000000000000" as UUID,
    claimNumber: "C10043",
    status: "Paid"
  },
  {
    id: "claim002-0000-0000-0000-000000000000" as UUID,
    claimNumber: "C10044",
    status: "Pending"
  },
  {
    id: "claim003-0000-0000-0000-000000000000" as UUID,
    claimNumber: "C10045",
    status: "Denied"
  }
];

/**
 * Mock document data for service documentation
 */
const mockDocuments = [
  {
    id: "doc001-0000-0000-0000-000000000000" as UUID,
    fileName: "service_note_20230515.pdf",
    fileSize: 256789,
    mimeType: "application/pdf"
  },
  {
    id: "doc002-0000-0000-0000-000000000000" as UUID,
    fileName: "assessment_form.pdf",
    fileSize: 345678,
    mimeType: "application/pdf"
  },
  {
    id: "doc003-0000-0000-0000-000000000000" as UUID,
    fileName: "signature_page.jpg",
    fileSize: 124567,
    mimeType: "image/jpeg"
  }
];

/**
 * Mock services array containing basic service records
 */
export const mockServices: Service[] = [
  // Personal Care Services
  {
    id: "srv001-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[0].id, // John Smith
    serviceTypeId: mockServiceTypes[0].id, // Personal Care
    serviceCode: "PC101",
    serviceDate: "2023-05-28" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "11:00:00",
    units: 4,
    rate: 25.50,
    amount: 102.00,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[0].id, // Personal Care
    authorizationId: mockAuthorizations[0].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Client required assistance with morning routine.",
    documentIds: [mockDocuments[0].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-28T12:00:00.000Z",
    updatedAt: "2023-05-28T12:00:00.000Z"
  },
  {
    id: "srv002-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[0].id, // John Smith
    serviceTypeId: mockServiceTypes[0].id, // Personal Care
    serviceCode: "PC101",
    serviceDate: "2023-05-26" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "10:30:00",
    units: 3,
    rate: 25.50,
    amount: 76.50,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[0].id, // Personal Care
    authorizationId: mockAuthorizations[0].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Client required assistance with medication and personal hygiene.",
    documentIds: [mockDocuments[0].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-26T11:30:00.000Z",
    updatedAt: "2023-05-26T11:30:00.000Z"
  },
  {
    id: "srv003-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[0].id, // John Smith
    serviceTypeId: mockServiceTypes[0].id, // Personal Care
    serviceCode: "PC101",
    serviceDate: "2023-05-24" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "11:30:00",
    units: 5,
    rate: 25.50,
    amount: 127.50,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[0].id, // Personal Care
    authorizationId: mockAuthorizations[0].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Client required extra assistance with bathing today.",
    documentIds: [mockDocuments[0].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-24T12:00:00.000Z",
    updatedAt: "2023-05-24T12:00:00.000Z"
  },
  {
    id: "srv004-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[0].id, // John Smith
    serviceTypeId: mockServiceTypes[0].id, // Personal Care
    serviceCode: "PC101",
    serviceDate: "2023-05-22" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "11:00:00",
    units: 4,
    rate: 25.50,
    amount: 102.00,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[0].id, // Personal Care
    authorizationId: mockAuthorizations[0].id,
    documentationStatus: DocumentationStatus.INCOMPLETE,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Client's morning routine assistance.",
    documentIds: [],
    status: Status.ACTIVE,
    createdAt: "2023-05-22T12:00:00.000Z",
    updatedAt: "2023-05-22T12:00:00.000Z"
  },
  // Residential Services
  {
    id: "srv005-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[1].id, // Jane Doe
    serviceTypeId: mockServiceTypes[1].id, // Residential
    serviceCode: "RS202",
    serviceDate: "2023-05-28" as ISO8601Date,
    startTime: null,
    endTime: null,
    units: 1,
    rate: 150.00,
    amount: 150.00,
    staffId: null,
    facilityId: mockFacilities[1].id, // Residential Home
    programId: mockProgramReferences[1].id, // Residential Services
    authorizationId: mockAuthorizations[1].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.READY_FOR_BILLING,
    claimId: null,
    notes: "Daily residential services in group home setting.",
    documentIds: [mockDocuments[1].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-28T23:00:00.000Z",
    updatedAt: "2023-05-28T23:00:00.000Z"
  },
  // Day Services
  {
    id: "srv006-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[2].id, // Robert Johnson
    serviceTypeId: mockServiceTypes[2].id, // Day Services
    serviceCode: "DS303",
    serviceDate: "2023-05-27" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "15:00:00",
    units: 6,
    rate: 85.75,
    amount: 514.50,
    staffId: mockStaff[1].id,
    facilityId: mockFacilities[0].id, // Day Center
    programId: mockProgramReferences[2].id, // Day Services
    authorizationId: mockAuthorizations[2].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.BILLED,
    claimId: mockClaims[1].id, // Pending claim
    notes: "Client participated in group activities and vocational training.",
    documentIds: [mockDocuments[1].id, mockDocuments[2].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-27T16:00:00.000Z",
    updatedAt: "2023-05-27T16:00:00.000Z"
  },
  // Therapy Services
  {
    id: "srv007-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[2].id, // Robert Johnson
    serviceTypeId: mockServiceTypes[4].id, // Therapy
    serviceCode: "TS505",
    serviceDate: "2023-05-25" as ISO8601Date,
    startTime: "13:00:00",
    endTime: "14:00:00",
    units: 1,
    rate: 95.00,
    amount: 95.00,
    staffId: mockStaff[2].id, // Therapist
    facilityId: mockFacilities[2].id, // Therapy Center
    programId: mockProgramReferences[2].id, // Day Services (includes therapy)
    authorizationId: mockAuthorizations[2].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.PAID,
    claimId: mockClaims[0].id, // Paid claim
    notes: "Individual therapy session focused on coping strategies.",
    documentIds: [mockDocuments[0].id, mockDocuments[1].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-25T15:00:00.000Z",
    updatedAt: "2023-05-30T10:15:00.000Z"
  },
  // Transportation
  {
    id: "srv008-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[2].id, // Robert Johnson
    serviceTypeId: mockServiceTypes[5].id, // Transportation
    serviceCode: "TR606",
    serviceDate: "2023-05-27" as ISO8601Date,
    startTime: "08:15:00",
    endTime: "08:45:00",
    units: 1,
    rate: 18.50,
    amount: 18.50,
    staffId: null,
    facilityId: null,
    programId: mockProgramReferences[2].id, // Day Services
    authorizationId: mockAuthorizations[2].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.BILLED,
    claimId: mockClaims[1].id, // Pending claim
    notes: "Transportation to day program facility.",
    documentIds: [mockDocuments[2].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-27T09:00:00.000Z",
    updatedAt: "2023-05-27T09:00:00.000Z"
  },
  // Respite Care
  {
    id: "srv009-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[3].id, // Michael Brown
    serviceTypeId: mockServiceTypes[3].id, // Respite
    serviceCode: "RC404",
    serviceDate: "2023-05-26" as ISO8601Date,
    startTime: "10:00:00",
    endTime: "16:00:00",
    units: 6,
    rate: 32.00,
    amount: 192.00,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[3].id, // Respite Care
    authorizationId: null,
    documentationStatus: DocumentationStatus.REJECTED,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Respite care provided at client's home. Documentation rejected due to missing signature.",
    documentIds: [mockDocuments[2].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-26T17:00:00.000Z",
    updatedAt: "2023-05-29T09:30:00.000Z"
  },
  // Case Management
  {
    id: "srv010-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[4].id, // Sarah Wilson
    serviceTypeId: mockServiceTypes[6].id, // Case Management
    serviceCode: "CM707",
    serviceDate: "2023-05-24" as ISO8601Date,
    startTime: "14:00:00",
    endTime: "15:00:00",
    units: 1,
    rate: 65.00,
    amount: 65.00,
    staffId: mockStaff[3].id, // Case Manager
    facilityId: null,
    programId: mockProgramReferences[0].id, // Personal Care (includes case management)
    authorizationId: null,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.DENIED,
    claimId: mockClaims[2].id, // Denied claim
    notes: "Monthly case management meeting to review service plan.",
    documentIds: [mockDocuments[0].id, mockDocuments[1].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-24T16:00:00.000Z",
    updatedAt: "2023-05-30T11:30:00.000Z"
  },
  // Additional Personal Care
  {
    id: "srv011-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[0].id, // John Smith
    serviceTypeId: mockServiceTypes[0].id, // Personal Care
    serviceCode: "PC101",
    serviceDate: "2023-05-20" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "10:30:00",
    units: 3,
    rate: 25.50,
    amount: 76.50,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[0].id, // Personal Care
    authorizationId: mockAuthorizations[0].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Client assistance with morning routine and medication.",
    documentIds: [mockDocuments[0].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-20T11:00:00.000Z",
    updatedAt: "2023-05-20T11:00:00.000Z"
  },
  // More residential
  {
    id: "srv012-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[1].id, // Jane Doe
    serviceTypeId: mockServiceTypes[1].id, // Residential
    serviceCode: "RS202",
    serviceDate: "2023-05-27" as ISO8601Date,
    startTime: null,
    endTime: null,
    units: 1,
    rate: 150.00,
    amount: 150.00,
    staffId: null,
    facilityId: mockFacilities[1].id, // Residential Home
    programId: mockProgramReferences[1].id, // Residential Services
    authorizationId: mockAuthorizations[1].id,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.READY_FOR_BILLING,
    claimId: null,
    notes: "Daily residential services in group home setting.",
    documentIds: [mockDocuments[1].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-27T23:00:00.000Z",
    updatedAt: "2023-05-27T23:00:00.000Z"
  },
  // Services in pending review status
  {
    id: "srv013-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[5].id, // David Lee
    serviceTypeId: mockServiceTypes[2].id, // Day Services
    serviceCode: "DS303",
    serviceDate: "2023-05-25" as ISO8601Date,
    startTime: "09:00:00",
    endTime: "15:00:00",
    units: 6,
    rate: 85.75,
    amount: 514.50,
    staffId: mockStaff[1].id,
    facilityId: mockFacilities[0].id, // Day Center
    programId: mockProgramReferences[2].id, // Day Services
    authorizationId: null,
    documentationStatus: DocumentationStatus.PENDING_REVIEW,
    billingStatus: BillingStatus.UNBILLED,
    claimId: null,
    notes: "Client participated in group activities. Documentation pending supervisor review.",
    documentIds: [mockDocuments[1].id],
    status: Status.ACTIVE,
    createdAt: "2023-05-25T16:00:00.000Z",
    updatedAt: "2023-05-25T16:00:00.000Z"
  },
  // Voided service
  {
    id: "srv014-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[6].id, // Thomas Young
    serviceTypeId: mockServiceTypes[3].id, // Respite
    serviceCode: "RC404",
    serviceDate: "2023-05-23" as ISO8601Date,
    startTime: "10:00:00",
    endTime: "14:00:00",
    units: 4,
    rate: 32.00,
    amount: 128.00,
    staffId: mockStaff[0].id,
    facilityId: null,
    programId: mockProgramReferences[3].id, // Respite Care
    authorizationId: null,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.VOID,
    claimId: null,
    notes: "Service voided due to duplicate entry.",
    documentIds: [mockDocuments[2].id],
    status: Status.INACTIVE,
    createdAt: "2023-05-23T15:00:00.000Z",
    updatedAt: "2023-05-24T09:30:00.000Z"
  },
  // Inactive client service
  {
    id: "srv015-0000-0000-0000-000000000000" as UUID,
    clientId: mockClientSummaries[3].id, // Michael Brown (inactive)
    serviceTypeId: mockServiceTypes[4].id, // Therapy
    serviceCode: "TS505",
    serviceDate: "2023-05-19" as ISO8601Date,
    startTime: "13:00:00",
    endTime: "14:00:00",
    units: 1,
    rate: 95.00,
    amount: 95.00,
    staffId: mockStaff[2].id, // Therapist
    facilityId: mockFacilities[2].id, // Therapy Center
    programId: mockProgramReferences[4].id, // Skill Building
    authorizationId: null,
    documentationStatus: DocumentationStatus.COMPLETE,
    billingStatus: BillingStatus.PAID,
    claimId: mockClaims[0].id, // Paid claim
    notes: "Final therapy session before program completion.",
    documentIds: [mockDocuments[0].id, mockDocuments[1].id],
    status: Status.INACTIVE,
    createdAt: "2023-05-19T15:00:00.000Z",
    updatedAt: "2023-05-30T10:15:00.000Z"
  }
];

/**
 * Mock services with related entities included for detailed views
 */
export const mockServiceWithRelations: ServiceWithRelations[] = mockServices.map(service => {
  // Find client by ID
  const clientIndex = mockClientSummaries.findIndex(c => c.id === service.clientId);
  const client = clientIndex >= 0 ? mockClientSummaries[clientIndex] : mockClientSummaries[0];
  
  // Find service type by ID
  const serviceTypeIndex = mockServiceTypes.findIndex(s => s.id === service.serviceTypeId);
  const serviceType = serviceTypeIndex >= 0 ? mockServiceTypes[serviceTypeIndex] : mockServiceTypes[0];
  
  // Find staff by ID
  const staffIndex = service.staffId ? mockStaff.findIndex(s => s.id === service.staffId) : -1;
  const staff = staffIndex >= 0 ? mockStaff[staffIndex] : null;
  
  // Find facility by ID
  const facilityIndex = service.facilityId ? mockFacilities.findIndex(f => f.id === service.facilityId) : -1;
  const facility = facilityIndex >= 0 ? mockFacilities[facilityIndex] : null;
  
  // Find program by ID
  const programIndex = mockProgramReferences.findIndex(p => p.id === service.programId);
  const program = programIndex >= 0 ? mockProgramReferences[programIndex] : mockProgramReferences[0];
  
  // Find authorization by ID
  const authIndex = service.authorizationId ? mockAuthorizations.findIndex(a => a.id === service.authorizationId) : -1;
  const authorization = authIndex >= 0 ? mockAuthorizations[authIndex] : null;
  
  // Find claim by ID
  const claimIndex = service.claimId ? mockClaims.findIndex(c => c.id === service.claimId) : -1;
  const claim = claimIndex >= 0 ? mockClaims[claimIndex] : null;
  
  // Find documents by IDs
  const documents = service.documentIds.map(docId => {
    const docIndex = mockDocuments.findIndex(d => d.id === docId);
    return docIndex >= 0 ? mockDocuments[docIndex] : mockDocuments[0];
  });
  
  return {
    ...service,
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      medicaidId: client.medicaidId
    },
    serviceType: {
      id: serviceType.id,
      name: serviceType.name,
      code: serviceType.code
    },
    staff,
    facility,
    program: {
      id: program.id,
      name: program.name,
      code: program.code
    },
    authorization,
    claim,
    documents
  };
});

/**
 * Mock simplified service summaries for lists and tables
 */
export const mockServiceSummaries: ServiceSummary[] = mockServices.map(service => {
  // Get client name
  const clientIndex = mockClientSummaries.findIndex(c => c.id === service.clientId);
  const client = clientIndex >= 0 ? mockClientSummaries[clientIndex] : mockClientSummaries[0];
  const clientName = `${client.firstName} ${client.lastName}`;
  
  // Get service type name
  const serviceTypeIndex = mockServiceTypes.findIndex(s => s.id === service.serviceTypeId);
  const serviceTypeName = serviceTypeIndex >= 0 ? mockServiceTypes[serviceTypeIndex].name : "Unknown Service";
  
  // Get program name
  const programIndex = mockProgramReferences.findIndex(p => p.id === service.programId);
  const programName = programIndex >= 0 ? mockProgramReferences[programIndex].name : "Unknown Program";
  
  return {
    id: service.id,
    clientName,
    serviceType: serviceTypeName,
    serviceDate: service.serviceDate,
    units: service.units,
    amount: service.amount,
    documentationStatus: service.documentationStatus,
    billingStatus: service.billingStatus,
    programName
  };
});

/**
 * Mock service validation results for testing validation features
 */
export const mockServiceValidationResults: ServiceValidationResult[] = [
  {
    serviceId: mockServices[0].id, // Complete and ready for billing
    isValid: true,
    errors: [],
    warnings: []
  },
  {
    serviceId: mockServices[1].id, // Complete and ready for billing
    isValid: true,
    errors: [],
    warnings: []
  },
  {
    serviceId: mockServices[2].id, // Complete and ready for billing
    isValid: true,
    errors: [],
    warnings: []
  },
  {
    serviceId: mockServices[3].id, // Incomplete documentation
    isValid: false,
    errors: [
      {
        field: "documentation",
        message: "Service documentation is incomplete",
        code: "INCOMPLETE_DOCUMENTATION"
      }
    ],
    warnings: []
  },
  {
    serviceId: mockServices[8].id, // Rejected documentation
    isValid: false,
    errors: [
      {
        field: "documentation",
        message: "Service documentation has been rejected",
        code: "REJECTED_DOCUMENTATION"
      }
    ],
    warnings: []
  },
  {
    serviceId: mockServices[12].id, // Pending review
    isValid: false,
    errors: [
      {
        field: "documentation",
        message: "Service documentation is pending review",
        code: "PENDING_REVIEW"
      }
    ],
    warnings: []
  },
  {
    serviceId: mockServices[4].id, // Authorization warning
    isValid: true,
    errors: [],
    warnings: [
      {
        field: "authorization",
        message: "Authorization expires in 30 days",
        code: "AUTHORIZATION_EXPIRING"
      }
    ]
  },
  {
    serviceId: mockServices[9].id, // Service with denied claim
    isValid: true,
    errors: [],
    warnings: [
      {
        field: "billing",
        message: "Previous claim for this service was denied",
        code: "PREVIOUS_DENIAL"
      }
    ]
  }
];

/**
 * Mock service metrics for dashboard and reporting features
 */
export const mockServiceMetrics: ServiceMetrics = {
  totalServices: 145,
  totalUnbilledServices: 78,
  totalUnbilledAmount: 7823.50,
  incompleteDocumentation: 12,
  servicesByProgram: [
    {
      programId: mockProgramReferences[0].id, // Personal Care
      programName: "Personal Care",
      count: 62,
      amount: 3456.78
    },
    {
      programId: mockProgramReferences[1].id, // Residential
      programName: "Residential Services",
      count: 30,
      amount: 4500.00
    },
    {
      programId: mockProgramReferences[2].id, // Day Services
      programName: "Day Services",
      count: 25,
      amount: 2189.45
    },
    {
      programId: mockProgramReferences[3].id, // Respite Care
      programName: "Respite Care",
      count: 18,
      amount: 1267.50
    },
    {
      programId: mockProgramReferences[4].id, // Skill Building
      programName: "Skill Building",
      count: 10,
      amount: 950.00
    }
  ],
  servicesByType: [
    {
      serviceTypeId: mockServiceTypes[0].id, // Personal Care
      serviceTypeName: "Personal Care",
      count: 60,
      amount: 3280.50
    },
    {
      serviceTypeId: mockServiceTypes[1].id, // Residential
      serviceTypeName: "Residential Services",
      count: 30,
      amount: 4500.00
    },
    {
      serviceTypeId: mockServiceTypes[2].id, // Day Services
      serviceTypeName: "Day Services",
      count: 22,
      amount: 1914.45
    },
    {
      serviceTypeId: mockServiceTypes[3].id, // Respite
      serviceTypeName: "Respite Care",
      count: 15,
      amount: 935.75
    },
    {
      serviceTypeId: mockServiceTypes[4].id, // Therapy
      serviceTypeName: "Therapy Session",
      count: 10,
      amount: 950.00
    },
    {
      serviceTypeId: mockServiceTypes[5].id, // Transportation
      serviceTypeName: "Transportation",
      count: 5,
      amount: 92.50
    },
    {
      serviceTypeId: mockServiceTypes[6].id, // Case Management
      serviceTypeName: "Case Management",
      count: 3,
      amount: 195.00
    }
  ]
};

/**
 * Mock service validation response for testing validation API
 */
export const mockServiceValidationResponse = {
  results: mockServiceValidationResults,
  isValid: mockServiceValidationResults.every(result => result.isValid),
  totalErrors: mockServiceValidationResults.reduce((count, result) => count + result.errors.length, 0),
  totalWarnings: mockServiceValidationResults.reduce((count, result) => count + result.warnings.length, 0)
};

/**
 * Mock paginated response for service list API
 */
export const mockServiceListResponse = {
  items: mockServiceSummaries,
  totalItems: mockServiceSummaries.length,
  page: 1,
  pageSize: 10,
  totalPages: Math.ceil(mockServiceSummaries.length / 10)
};