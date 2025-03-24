import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { UUID, ISO8601Date, Money, Units, StatusType } from '../../types/common.types';
import {
  Service,
  ServiceWithRelations,
  ServiceSummary,
  DocumentationStatus,
  BillingStatus,
  ServiceType
} from '../../types/services.types';
import { mockClient, mockClients } from './clients.fixtures';
import { mockProgram, mockPrograms } from './programs.fixtures';
import { mockAuthorization, mockAuthorizationWithRelations } from './authorizations.fixtures';
import { mockPayers } from './payers.fixtures';

/**
 * Creates a complete mock service object for testing
 * @param overrides - Optional overrides for service properties
 * @returns A complete mock service object with all required properties
 */
function createMockService(overrides: Partial<Service> = {}): Service {
  // Generate a UUID for the service if not provided
  const id: UUID = overrides.id || uuidv4();

  // Set default client ID from mockClient if not provided
  const clientId: UUID = overrides.clientId || mockClient.id;

  // Set default service type ID if not provided
  const serviceTypeId: UUID = overrides.serviceTypeId || uuidv4();

  // Set default service code based on service type
  const serviceCode: string = overrides.serviceCode || `SVC-${serviceTypeId.substring(0, 5)}`;

  // Set default service date to current date if not provided
  const serviceDate: ISO8601Date = overrides.serviceDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default units and rate if not provided
  const units: Units = overrides.units || 1;
  const rate: Money = overrides.rate || 50.00;

  // Calculate amount as units * rate
  const amount: Money = overrides.amount || units * rate;

  // Set default documentation status to COMPLETE if not provided
  const documentationStatus: DocumentationStatus = overrides.documentationStatus || DocumentationStatus.COMPLETE;

  // Set default billing status to UNBILLED if not provided
  const billingStatus: BillingStatus = overrides.billingStatus || BillingStatus.UNBILLED;

  // Set default status to ACTIVE if not provided
  const status: StatusType = overrides.status || StatusType.ACTIVE;

  // Apply any provided overrides to the default service
  const service: Service = {
    id,
    clientId,
    serviceTypeId,
    serviceCode,
    serviceDate,
    startTime: null,
    endTime: null,
    units,
    rate,
    amount,
    staffId: null,
    facilityId: null,
    programId: mockProgram.id,
    authorizationId: null,
    documentationStatus,
    billingStatus,
    claimId: null,
    notes: null,
    documentIds: [],
    status,
    ...overrides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: uuidv4(),
    updatedBy: uuidv4()
  };

  // Return the complete service object
  return service;
}

/**
 * Creates a mock service with related entities for testing
 * @param overrides - Optional overrides for service properties
 * @returns A complete mock service with related entities
 */
function createMockServiceWithRelations(overrides: Partial<ServiceWithRelations> = {}): ServiceWithRelations {
  // Create a base service using createMockService
  const baseService: Service = createMockService(overrides);

  // Add mock client reference if not provided
  const client = overrides.clientId ? mockClients.find(c => c.id === overrides.clientId) : mockClient;

  // Add mock service type reference if not provided
  const serviceType = { id: baseService.serviceTypeId, name: 'Mock Service Type', code: 'MST001' };

  // Add mock staff reference if not provided
  const staff = { id: uuidv4(), firstName: 'Test', lastName: 'Staff', title: 'Caregiver' };

  // Add mock facility reference if not provided
  const facility = { id: uuidv4(), name: 'Test Facility', type: 'Residential' };

  // Add mock program reference if not provided
  const program = mockProgram;

  // Add mock authorization reference if not provided
  const authorization = mockAuthorization;

  // Add mock claim reference if not provided
  const claim = { id: uuidv4(), claimNumber: 'CLM-12345', status: 'Submitted' };

  // Add mock documents array if not provided
  const documents = [{ id: uuidv4(), fileName: 'test.pdf', fileSize: 1024, mimeType: 'application/pdf' }];

  // Add created and updated timestamps
  const createdAt: string = new Date().toISOString();
  const updatedAt: string = new Date().toISOString();

  // Apply any provided overrides to the service with relations
  const serviceWithRelations: ServiceWithRelations = {
    ...baseService,
    clientId: client.id,
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      medicaidId: client.medicaidId
    },
    serviceTypeId: baseService.serviceTypeId,
    serviceType: serviceType,
    serviceCode: baseService.serviceCode,
    serviceDate: baseService.serviceDate,
    startTime: null,
    endTime: null,
    units: baseService.units,
    rate: baseService.rate,
    amount: baseService.amount,
    staffId: staff.id,
    staff: staff,
    facilityId: facility.id,
    facility: facility,
    programId: program.id,
    program: program,
    authorizationId: authorization.id,
    authorization: authorization,
    documentationStatus: baseService.documentationStatus,
    billingStatus: baseService.billingStatus,
    claimId: claim.id,
    claim: claim,
    notes: baseService.notes,
    documentIds: baseService.documentIds,
    documents: documents,
    status: baseService.status,
    createdAt,
    updatedAt,
    ...overrides,
  } as ServiceWithRelations;

  // Return the complete service with relations object
  return serviceWithRelations;
}

/**
 * Creates a mock service summary object for testing
 * @param overrides - Optional overrides for service summary properties
 * @returns A complete mock service summary object
 */
function createMockServiceSummary(overrides: Partial<ServiceSummary> = {}): ServiceSummary {
  // Generate a UUID for the service if not provided
  const id: UUID = overrides.id || uuidv4();

  // Set default client name if not provided
  const clientName: string = overrides.clientName || 'John Doe';

  // Set default service type if not provided
  const serviceType: string = overrides.serviceType || 'Personal Care';

  // Set default service date to current date if not provided
  const serviceDate: ISO8601Date = overrides.serviceDate || new Date().toISOString().split('T')[0] as ISO8601Date;

  // Set default units and amount if not provided
  const units: Units = overrides.units || 1;
  const amount: Money = overrides.amount || 50.00;

  // Set default documentation status to COMPLETE if not provided
  const documentationStatus: DocumentationStatus = overrides.documentationStatus || DocumentationStatus.COMPLETE;

  // Set default billing status to UNBILLED if not provided
  const billingStatus: BillingStatus = overrides.billingStatus || BillingStatus.UNBILLED;

  // Set default program name if not provided
  const programName: string = overrides.programName || 'Test Program';

  // Apply any provided overrides to the default service summary
  const serviceSummary: ServiceSummary = {
    id,
    clientName,
    serviceType,
    serviceDate,
    units,
    amount,
    documentationStatus,
    billingStatus,
    programName,
    ...overrides,
  };

  // Return the complete service summary object
  return serviceSummary;
}

/**
 * Creates an array of mock service objects for testing
 * @param count - Number of mock services to create
 * @param overrides - Optional overrides to apply to all services
 * @returns An array of mock service objects
 */
function createMockServices(count: number, overrides: Partial<Service> = {}): Service[] {
  // Create an empty array to hold the services
  const services: Service[] = [];

  // Loop 'count' times to create the specified number of services
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockService with the provided overrides
    const service: Service = createMockService({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created service to the array
    services.push(service);
  }

  // Return the array of mock services
  return services;
}

/**
 * Creates an array of mock services with relations for testing
 * @param count - Number of mock services to create
 * @param overrides - Optional overrides to apply to all services
 * @returns An array of mock services with relations
 */
function createMockServicesWithRelations(count: number, overrides: Partial<ServiceWithRelations> = {}): ServiceWithRelations[] {
  // Create an empty array to hold the services with relations
  const services: ServiceWithRelations[] = [];

  // Loop 'count' times to create the specified number of services
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockServiceWithRelations with the provided overrides
    const service: ServiceWithRelations = createMockServiceWithRelations({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created service to the array
    services.push(service);
  }

  // Return the array of mock services with relations
  return services;
}

/**
 * Creates an array of mock service summary objects for testing
 * @param count - Number of mock service summaries to create
 * @param overrides - Optional overrides to apply to all service summaries
 * @returns An array of mock service summary objects
 */
function createMockServiceSummaries(count: number, overrides: Partial<ServiceSummary> = {}): ServiceSummary[] {
  // Create an empty array to hold the service summaries
  const serviceSummaries: ServiceSummary[] = [];

  // Loop 'count' times to create the specified number of service summaries
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockServiceSummary with the provided overrides
    const serviceSummary: ServiceSummary = createMockServiceSummary({
      ...overrides,
      id: uuidv4(),
    });

    // Add each created service summary to the array
    serviceSummaries.push(serviceSummary);
  }

  // Return the array of mock service summaries
  return serviceSummaries;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Mock service for testing
 */
export const mockService: Service = createMockService();

/**
 * Mock service with relations for testing
 */
export const mockServiceWithRelations: ServiceWithRelations = createMockServiceWithRelations();

/**
 * Mock service summary for testing
 */
export const mockServiceSummary: ServiceSummary = createMockServiceSummary();

/**
 * Mock Personal Care service for testing
 */
export const mockPersonalCareService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'PC100',
  serviceDate: '2024-01-15',
  units: 2,
  rate: 60.00,
  amount: 120.00,
  programId: mockProgram.id,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.UNBILLED
});

/**
 * Mock Residential service for testing
 */
export const mockResidentialService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'RES200',
  serviceDate: '2024-01-16',
  units: 1,
  rate: 150.00,
  amount: 150.00,
  facilityId: uuidv4(),
  programId: mockProgram.id,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.UNBILLED
});

/**
 * Mock Day service for testing
 */
export const mockDayService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'DAY300',
  serviceDate: '2024-01-17',
  units: 6,
  rate: 30.00,
  amount: 180.00,
  facilityId: uuidv4(),
  programId: mockProgram.id,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.UNBILLED
});

/**
 * Mock unbilled service for testing
 */
export const mockUnbilledService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'UNB400',
  serviceDate: '2024-01-18',
  units: 4,
  rate: 40.00,
  amount: 160.00,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.UNBILLED
});

/**
 * Mock service ready for billing for testing
 */
export const mockReadyForBillingService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'RFB500',
  serviceDate: '2024-01-19',
  units: 2,
  rate: 75.00,
  amount: 150.00,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.READY_FOR_BILLING
});

/**
 * Mock billed service for testing
 */
export const mockBilledService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'BIL600',
  serviceDate: '2024-01-20',
  units: 3,
  rate: 55.00,
  amount: 165.00,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.BILLED,
  claimId: uuidv4()
});

/**
 * Mock paid service for testing
 */
export const mockPaidService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'PAI700',
  serviceDate: '2024-01-21',
  units: 5,
  rate: 45.00,
  amount: 225.00,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.PAID,
  claimId: uuidv4()
});

/**
 * Mock denied service for testing
 */
export const mockDeniedService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'DEN800',
  serviceDate: '2024-01-22',
  units: 1,
  rate: 100.00,
  amount: 100.00,
  documentationStatus: DocumentationStatus.COMPLETE,
  billingStatus: BillingStatus.DENIED,
  claimId: uuidv4()
});

/**
 * Mock service with incomplete documentation for testing
 */
export const mockIncompleteDocumentationService: Service = createMockService({
  serviceTypeId: uuidv4(),
  serviceCode: 'INC900',
  serviceDate: '2024-01-23',
  units: 2,
  rate: 60.00,
  amount: 120.00,
  documentationStatus: DocumentationStatus.INCOMPLETE,
  billingStatus: BillingStatus.UNBILLED
});

/**
 * Array of mock services for testing
 */
export const mockServices: Service[] = createMockServices(5);

/**
 * Array of mock services with relations for testing
 */
export const mockServicesWithRelations: ServiceWithRelations[] = createMockServicesWithRelations(5);

/**
 * Array of mock service summaries for testing
 */
export const mockServiceSummaries: ServiceSummary[] = createMockServiceSummaries(5);

export { createMockService, createMockServiceWithRelations, createMockServiceSummary, createMockServices, createMockServicesWithRelations, createMockServiceSummaries };