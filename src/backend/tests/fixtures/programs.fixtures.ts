import { UUID, ISO8601Date, Money, StatusType } from '../../types/common.types';
import {
  Program,
  ProgramType,
  ProgramStatus,
  FundingSource,
  BillingFrequency,
  ServiceCode,
  RateSchedule
} from '../../models/program.model';
import { mockPayers } from './payers.fixtures';
import { v4 as uuidv4 } from 'uuid'; // version 9.0.0

/**
 * Creates a mock service code object for testing
 * 
 * @param overrides - Optional overrides for service code properties
 * @param programId - Optional program ID to associate with the service code
 * @returns A complete mock service code object
 */
export function createMockServiceCode(
  overrides: Partial<ServiceCode> = {},
  programId: UUID = uuidv4()
): ServiceCode {
  const id = overrides.id || uuidv4();
  
  const defaultServiceCode: ServiceCode = {
    id,
    programId,
    code: `SVC${Math.floor(1000 + Math.random() * 9000)}`,
    name: `Test Service ${id.substring(0, 4)}`,
    description: 'This is a test service code for unit testing',
    type: 'hourly',
    defaultRate: 2500, // $25.00 in cents
    unitType: 'hour',
    isActive: true,
    requiresAuthorization: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: uuidv4(),
    updatedBy: uuidv4()
  };

  return {
    ...defaultServiceCode,
    ...overrides
  };
}

/**
 * Creates a mock rate schedule object for testing
 * 
 * @param overrides - Optional overrides for rate schedule properties
 * @param programId - Optional program ID to associate with the rate schedule
 * @param serviceCodeId - Optional service code ID to associate with the rate schedule
 * @returns A complete mock rate schedule object
 */
export function createMockRateSchedule(
  overrides: Partial<RateSchedule> = {}, 
  programId: UUID = uuidv4(),
  serviceCodeId: UUID = uuidv4()
): RateSchedule {
  const id = overrides.id || uuidv4();
  
  // Select a random payer from mockPayers or use the first one if not available
  const payerId = overrides.payerId || 
    (mockPayers.length > 0 ? 
      mockPayers[Math.floor(Math.random() * mockPayers.length)].id : 
      uuidv4());
  
  const defaultRateSchedule: RateSchedule = {
    id,
    programId,
    serviceCodeId,
    payerId,
    rate: 2750, // $27.50 in cents
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: uuidv4(),
    updatedBy: uuidv4()
  };

  return {
    ...defaultRateSchedule,
    ...overrides
  };
}

/**
 * Creates a complete mock program object for testing
 * 
 * @param overrides - Optional overrides for program properties
 * @returns A complete mock program object with all required properties
 */
export function createMockProgram(overrides: Partial<Program> = {}): Program {
  const id = overrides.id || uuidv4();
  
  // Select a random payer from mockPayers or use null if not available
  const payerId = overrides.payerId || 
    (mockPayers.length > 0 ? 
      mockPayers[Math.floor(Math.random() * mockPayers.length)].id : 
      null);
  
  // Create service codes and rate schedules if not provided
  const serviceCodes = overrides.serviceCodes || [
    createMockServiceCode({}, id),
    createMockServiceCode({
      code: `SVC${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Additional Service',
      defaultRate: 3000
    }, id)
  ];
  
  const rateSchedules = overrides.rateSchedules || serviceCodes.map(sc => 
    createMockRateSchedule({}, id, sc.id)
  );
  
  const defaultProgram: Program = {
    id,
    name: `Test Program ${id.substring(0, 4)}`,
    code: `PRG${Math.floor(1000 + Math.random() * 9000)}`,
    description: 'This is a test program for unit testing',
    type: ProgramType.PERSONAL_CARE,
    status: ProgramStatus.ACTIVE,
    fundingSource: FundingSource.MEDICAID,
    billingFrequency: BillingFrequency.WEEKLY,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    payerId,
    contractNumber: `CONTRACT-${Math.floor(10000 + Math.random() * 90000)}`,
    requiresAuthorization: true,
    documentationRequirements: 'Standard documentation required',
    billingRequirements: 'Standard billing procedures',
    serviceCodes,
    rateSchedules,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: uuidv4(),
    updatedBy: uuidv4()
  };

  return {
    ...defaultProgram,
    ...overrides
  };
}

/**
 * Creates an array of mock program objects for testing
 * 
 * @param count - Number of mock programs to create
 * @param overrides - Optional overrides to apply to all programs
 * @returns An array of mock program objects
 */
export function createMockPrograms(count: number, overrides: Partial<Program> = {}): Program[] {
  const programs: Program[] = [];
  
  for (let i = 0; i < count; i++) {
    programs.push(createMockProgram({
      ...overrides,
      name: `Test Program ${i + 1}`
    }));
  }
  
  return programs;
}

// Pre-defined mock objects for common testing scenarios

/**
 * Mock service code for testing
 */
export const mockServiceCode: ServiceCode = createMockServiceCode({
  id: uuidv4(),
  code: 'SVC1001',
  name: 'Personal Care',
  description: 'Basic personal care services',
  defaultRate: 2500,
  unitType: 'hour'
});

/**
 * Mock rate schedule for testing
 */
export const mockRateSchedule: RateSchedule = createMockRateSchedule({
  id: uuidv4(),
  rate: 2750,
  effectiveDate: '2023-01-01',
  endDate: null
});

/**
 * Mock personal care program for testing
 */
export const mockPersonalCareProgram: Program = createMockProgram({
  id: uuidv4(),
  name: 'Personal Care Program',
  code: 'PC001',
  type: ProgramType.PERSONAL_CARE,
  status: ProgramStatus.ACTIVE,
  fundingSource: FundingSource.MEDICAID
});

/**
 * Mock residential program for testing
 */
export const mockResidentialProgram: Program = createMockProgram({
  id: uuidv4(),
  name: 'Residential Program',
  code: 'RP001',
  type: ProgramType.RESIDENTIAL,
  status: ProgramStatus.ACTIVE,
  fundingSource: FundingSource.MEDICAID
});

/**
 * Mock day services program for testing
 */
export const mockDayServicesProgram: Program = createMockProgram({
  id: uuidv4(),
  name: 'Day Services Program',
  code: 'DS001',
  type: ProgramType.DAY_SERVICES,
  status: ProgramStatus.ACTIVE,
  fundingSource: FundingSource.MEDICAID
});

/**
 * Mock respite program for testing
 */
export const mockRespiteProgram: Program = createMockProgram({
  id: uuidv4(),
  name: 'Respite Care Program',
  code: 'RC001',
  type: ProgramType.RESPITE,
  status: ProgramStatus.ACTIVE,
  fundingSource: FundingSource.MEDICAID
});

/**
 * Mock active program for quick status testing
 */
export const mockActiveProgram = {
  id: uuidv4(),
  name: 'Active Program',
  code: 'ACT001',
  type: ProgramType.PERSONAL_CARE,
  status: ProgramStatus.ACTIVE,
  fundingSource: FundingSource.MEDICAID
};

/**
 * Mock inactive program for quick status testing
 */
export const mockInactiveProgram = {
  id: uuidv4(),
  name: 'Inactive Program',
  code: 'INACT001',
  type: ProgramType.PERSONAL_CARE,
  status: ProgramStatus.INACTIVE,
  fundingSource: FundingSource.MEDICAID
};

/**
 * Mock pending program for quick status testing
 */
export const mockPendingProgram = {
  id: uuidv4(),
  name: 'Pending Program',
  code: 'PEND001',
  type: ProgramType.PERSONAL_CARE,
  status: ProgramStatus.PENDING,
  fundingSource: FundingSource.MEDICAID
};

/**
 * Mock Medicaid-funded program for quick funding testing
 */
export const mockMedicaidProgram = {
  id: uuidv4(),
  name: 'Medicaid Program',
  code: 'MED001',
  type: ProgramType.PERSONAL_CARE,
  status: ProgramStatus.ACTIVE,
  fundingSource: FundingSource.MEDICAID,
  payerId: mockPayers.length > 0 ? mockPayers[0].id : uuidv4()
};

/**
 * Array of mock programs for testing
 */
export const mockPrograms: Program[] = createMockPrograms(4);