import { v4 as uuidv4 } from 'uuid'; // version ^9.0.0
import { addDays, subDays, format } from 'date-fns'; // version ^2.30.0
import {
  UUID,
  ISO8601Date,
  Units,
  Money,
  DateRange,
  StatusType,
  AuthorizationStatus
} from '../../types/common.types';
import {
  Authorization,
  AuthorizationWithRelations,
  AuthorizationUtilization,
  AuthorizationFrequency
} from '../../types/services.types';
import { mockClient, mockClients } from './clients.fixtures';
import { mockProgram, mockPrograms } from './programs.fixtures';

/**
 * Creates a complete mock authorization object for testing
 * @param overrides - Optional overrides for authorization properties
 * @returns A complete mock authorization object with all required properties
 */
export function createMockAuthorization(overrides: Partial<Authorization> = {}): Authorization {
  // Generate a UUID for the authorization if not provided
  const id: UUID = overrides.id || uuidv4();

  // Set default client ID from mockClient if not provided
  const clientId: UUID = overrides.clientId || mockClient.id;

  // Set default program ID from mockProgram if not provided
  const programId: UUID = overrides.programId || mockProgram.id;

  // Set default authorization number if not provided
  const number: string = overrides.number || `AUTH-${Math.floor(Math.random() * 1000)}`;

  // Set default start date to current date if not provided
  const startDate: ISO8601Date = overrides.startDate || format(new Date(), 'yyyy-MM-dd') as ISO8601Date;

  // Set default end date to 90 days from start date if not provided
  const endDate: ISO8601Date = overrides.endDate || format(addDays(new Date(startDate), 90), 'yyyy-MM-dd') as ISO8601Date;

  // Set default authorized units if not provided
  const authorizedUnits: Units = overrides.authorizedUnits || 100;

  // Set default used units to 0 if not provided
  const usedUnits: Units = overrides.usedUnits || 0;

  // Set default frequency to MONTHLY if not provided
  const frequency: AuthorizationFrequency = overrides.frequency || AuthorizationFrequency.MONTHLY;

  // Set default status to ACTIVE if not provided
  const status: AuthorizationStatus = overrides.status || AuthorizationStatus.ACTIVE;

  // Set default service type IDs if not provided
  const serviceTypeIds: UUID[] = overrides.serviceTypeIds || [uuidv4(), uuidv4()];

  // Apply any provided overrides to the default authorization
  const authorization: Authorization = {
    id,
    clientId,
    programId,
    number,
    startDate,
    endDate,
    authorizedUnits,
    usedUnits,
    frequency,
    status,
    serviceTypeIds,
    notes: null,
    ...overrides,
  };

  // Return the complete authorization object
  return authorization;
}

/**
 * Creates a mock authorization with related entities for testing
 * @param overrides - Optional overrides for authorization properties
 * @returns A complete mock authorization with related entities
 */
export function createMockAuthorizationWithRelations(overrides: Partial<AuthorizationWithRelations> = {}): AuthorizationWithRelations {
  // Create a base authorization using createMockAuthorization
  const baseAuthorization: Authorization = createMockAuthorization(overrides);

  // Add mock client reference if not provided
  const client = overrides.clientId ? mockClients.find(c => c.id === overrides.clientId) : mockClient;

  // Add mock program reference if not provided
  const program = overrides.programId ? mockPrograms.find(p => p.id === overrides.programId) : mockProgram;

  // Add mock service types array if not provided
  const serviceTypes = baseAuthorization.serviceTypeIds.map(id => ({ id, name: `Service Type ${id}`, code: `ST-${id}` }));

  // Add mock utilization data if not provided
  const utilization: AuthorizationUtilization = createMockAuthorizationUtilization({
    authorizationId: baseAuthorization.id,
    authorizedUnits: baseAuthorization.authorizedUnits,
    usedUnits: baseAuthorization.usedUnits
  });

  // Add created and updated timestamps
  const createdAt: string = new Date().toISOString();
  const updatedAt: string = new Date().toISOString();

  // Apply any provided overrides to the authorization with relations
  const authorizationWithRelations: AuthorizationWithRelations = {
    ...baseAuthorization,
    clientId: client.id,
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      medicaidId: client.medicaidId
    },
    programId: program.id,
    program: {
      id: program.id,
      name: program.name,
      code: program.code
    },
    authorizedUnits: baseAuthorization.authorizedUnits,
    usedUnits: baseAuthorization.usedUnits,
    utilization,
    frequency: baseAuthorization.frequency,
    status: baseAuthorization.status,
    serviceTypeIds: baseAuthorization.serviceTypeIds,
    serviceTypes,
    notes: baseAuthorization.notes,
    createdAt,
    updatedAt,
    createdBy: uuidv4(),
    updatedBy: uuidv4(),
    ...overrides,
  } as AuthorizationWithRelations;

  // Return the complete authorization with relations object
  return authorizationWithRelations;
}

/**
 * Creates a mock authorization utilization object for testing
 * @param overrides - Optional overrides for authorization utilization properties
 * @param authorizationId - Optional authorization ID to associate with the utilization
 * @param authorizedUnits - Optional authorized units to associate with the utilization
 * @returns A complete mock authorization utilization object
 */
export function createMockAuthorizationUtilization(
  overrides: Partial<AuthorizationUtilization> = {},
  authorizationId: UUID = uuidv4(),
  authorizedUnits: Units = 100
): AuthorizationUtilization {
  // Use the provided authorizationId or generate one if not provided
  const authId: UUID = overrides.authorizationId || authorizationId;

  // Use the provided authorizedUnits or default value if not provided
  const authUnits: Units = overrides.authorizedUnits || authorizedUnits;

  // Set default used units if not provided
  const usedUnits: Units = overrides.usedUnits || 0;

  // Calculate utilization percentage based on used and authorized units
  const utilizationPercentage: number = (usedUnits / authUnits) * 100;

  // Apply any provided overrides to the default utilization
  const utilization: AuthorizationUtilization = {
    authorizationId: authId,
    authorizedUnits: authUnits,
    usedUnits,
    utilizationPercentage,
    ...overrides,
  };

  // Return the complete utilization object
  return utilization;
}

/**
 * Creates an array of mock authorization objects for testing
 * @param count - Number of mock authorizations to create
 * @param overrides - Optional overrides to apply to all authorizations
 * @returns An array of mock authorization objects
 */
export function createMockAuthorizations(count: number, overrides: Partial<Authorization> = {}): Authorization[] {
  // Create an empty array to hold the authorizations
  const authorizations: Authorization[] = [];

  // Loop 'count' times to create the specified number of authorizations
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockAuthorization with the provided overrides
    const authorization: Authorization = createMockAuthorization({
      ...overrides,
      id: uuidv4(),
      number: `AUTH-${Math.floor(Math.random() * 1000)}`,
    });

    // Add each created authorization to the array
    authorizations.push(authorization);
  }

  // Return the array of mock authorizations
  return authorizations;
}

/**
 * Creates an array of mock authorizations with relations for testing
 * @param count - Number of mock authorizations to create
 * @param overrides - Optional overrides to apply to all authorizations
 * @returns An array of mock authorizations with relations
 */
export function createMockAuthorizationsWithRelations(count: number, overrides: Partial<AuthorizationWithRelations> = {}): AuthorizationWithRelations[] {
  // Create an empty array to hold the authorizations with relations
  const authorizations: AuthorizationWithRelations[] = [];

  // Loop 'count' times to create the specified number of authorizations
  for (let i = 0; i < count; i++) {
    // For each iteration, call createMockAuthorizationWithRelations with the provided overrides
    const authorization: AuthorizationWithRelations = createMockAuthorizationWithRelations({
      ...overrides,
      id: uuidv4(),
      number: `AUTH-${Math.floor(Math.random() * 1000)}`,
    });

    // Add each created authorization to the array
    authorizations.push(authorization);
  }

  // Return the array of mock authorizations with relations
  return authorizations;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Pre-defined mock authorization for quick test setup
 */
export const mockAuthorization: Authorization = createMockAuthorization();

/**
 * Pre-defined mock authorization with relations for quick test setup
 */
export const mockAuthorizationWithRelations: AuthorizationWithRelations = createMockAuthorizationWithRelations();

/**
 * Pre-defined mock authorization utilization for quick test setup
 */
export const mockAuthorizationUtilization: AuthorizationUtilization = createMockAuthorizationUtilization();

/**
 * Pre-defined mock active authorization for quick test setup
 */
export const mockActiveAuthorization: Authorization = createMockAuthorization({
  status: AuthorizationStatus.ACTIVE,
});

/**
 * Pre-defined mock expiring authorization for quick test setup
 */
export const mockExpiringAuthorization: Authorization = createMockAuthorization({
  status: AuthorizationStatus.EXPIRING,
  endDate: format(addDays(new Date(), 10), 'yyyy-MM-dd') as ISO8601Date, // Expires in 10 days
});

/**
 * Pre-defined mock expired authorization for quick test setup
 */
export const mockExpiredAuthorization: Authorization = createMockAuthorization({
  status: AuthorizationStatus.EXPIRED,
  endDate: format(subDays(new Date(), 10), 'yyyy-MM-dd') as ISO8601Date, // Expired 10 days ago
});

/**
 * Pre-defined mock authorization with high utilization for quick test setup
 */
export const mockHighUtilizationAuthorization: Authorization = createMockAuthorization({
  authorizedUnits: 100,
  usedUnits: 95,
});

/**
 * Pre-defined mock Personal Care authorization for quick test setup
 */
export const mockPersonalCareAuthorization: Authorization = createMockAuthorization({
  programId: mockProgram.id,
});

/**
 * Pre-defined mock Residential authorization for quick test setup
 */
export const mockResidentialAuthorization: Authorization = createMockAuthorization({
  programId: mockProgram.id,
});

/**
 * Pre-defined mock Day Services authorization for quick test setup
 */
export const mockDayServicesAuthorization: Authorization = createMockAuthorization({
  programId: mockProgram.id,
});

/**
 * Pre-defined array of mock authorizations for quick test setup
 */
export const mockAuthorizations: Authorization[] = createMockAuthorizations(5);

/**
 * Pre-defined array of mock authorizations with relations for quick test setup
 */
export const mockAuthorizationsWithRelations: AuthorizationWithRelations[] = createMockAuthorizationsWithRelations(5);