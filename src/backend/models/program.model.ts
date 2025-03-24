/**
 * Program Model
 * 
 * This file defines TypeScript interfaces and enums for Program entities in the 
 * HCBS Revenue Management System. Programs represent service programs offered by HCBS providers,
 * including program details, service codes, and rate schedules.
 */

import { UUID, ISO8601Date, Money, AuditableEntity, StatusType } from '../types/common.types';
import { DatabaseEntity } from '../types/database.types';

/**
 * Enum for program types in the HCBS system
 */
export enum ProgramType {
  PERSONAL_CARE = 'personal_care',
  RESIDENTIAL = 'residential',
  DAY_SERVICES = 'day_services',
  RESPITE = 'respite',
  THERAPY = 'therapy',
  TRANSPORTATION = 'transportation',
  CASE_MANAGEMENT = 'case_management',
  OTHER = 'other'
}

/**
 * Enum for program status values
 */
export enum ProgramStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

/**
 * Enum for program funding sources
 */
export enum FundingSource {
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE_INSURANCE = 'private_insurance',
  PRIVATE_PAY = 'private_pay',
  GRANT = 'grant',
  STATE_FUNDED = 'state_funded',
  OTHER = 'other'
}

/**
 * Enum for program billing frequency options
 */
export enum BillingFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  PER_SERVICE = 'per_service'
}

/**
 * Interface for service codes associated with a program
 */
export interface ServiceCode {
  id: UUID;
  programId: UUID;
  code: string;
  name: string;
  description: string;
  type: string;
  defaultRate: Money;
  unitType: string;
  isActive: boolean;
  requiresAuthorization: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: UUID;
  updatedBy: UUID;
}

/**
 * Interface for rate schedules associated with program service codes
 */
export interface RateSchedule {
  id: UUID;
  programId: UUID;
  serviceCodeId: UUID;
  payerId: UUID;
  rate: Money;
  effectiveDate: ISO8601Date;
  endDate: ISO8601Date | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: UUID;
  updatedBy: UUID;
}

/**
 * Interface for program entity with all properties
 */
export interface Program {
  id: UUID;
  name: string;
  code: string;
  description: string;
  type: ProgramType;
  status: ProgramStatus;
  fundingSource: FundingSource;
  billingFrequency: BillingFrequency;
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  payerId: UUID | null;
  contractNumber: string | null;
  requiresAuthorization: boolean;
  documentationRequirements: string | null;
  billingRequirements: string | null;
  serviceCodes: ServiceCode[];
  rateSchedules: RateSchedule[];
  createdAt: string;
  updatedAt: string;
  createdBy: UUID;
  updatedBy: UUID;
}

/**
 * Interface for program summary data used in dropdowns and lists
 */
export interface ProgramSummary {
  id: UUID;
  name: string;
  code: string;
  type: ProgramType;
  status: ProgramStatus;
  fundingSource: FundingSource;
}

/**
 * Interface for program metrics used in dashboard and reporting
 */
export interface ProgramMetrics {
  totalPrograms: number;
  activePrograms: number;
  programsByType: Array<{ type: ProgramType, count: number }>;
  programsByFundingSource: Array<{ fundingSource: FundingSource, count: number }>;
  revenueByProgram: Array<{ programId: UUID, programName: string, revenue: Money }>;
}

/**
 * Data transfer object for creating a new program
 */
export interface CreateProgramDto {
  name: string;
  code: string;
  description: string;
  type: ProgramType;
  status: ProgramStatus;
  fundingSource: FundingSource;
  billingFrequency: BillingFrequency;
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  payerId: UUID | null;
  contractNumber: string | null;
  requiresAuthorization: boolean;
  documentationRequirements: string | null;
  billingRequirements: string | null;
  serviceCodes: Omit<ServiceCode, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[];
  rateSchedules: Omit<RateSchedule, 'id' | 'programId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[];
}

/**
 * Data transfer object for updating an existing program
 */
export interface UpdateProgramDto {
  name: string;
  code: string;
  description: string;
  type: ProgramType;
  status: ProgramStatus;
  fundingSource: FundingSource;
  billingFrequency: BillingFrequency;
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  payerId: UUID | null;
  contractNumber: string | null;
  requiresAuthorization: boolean;
  documentationRequirements: string | null;
  billingRequirements: string | null;
}

/**
 * Data transfer object for updating a program's status
 */
export interface UpdateProgramStatusDto {
  status: ProgramStatus;
}

/**
 * Data transfer object for creating a new service code
 */
export interface CreateServiceCodeDto {
  code: string;
  name: string;
  description: string;
  type: string;
  defaultRate: Money;
  unitType: string;
  isActive: boolean;
  requiresAuthorization: boolean;
}

/**
 * Data transfer object for updating an existing service code
 */
export interface UpdateServiceCodeDto {
  code: string;
  name: string;
  description: string;
  type: string;
  defaultRate: Money;
  unitType: string;
  isActive: boolean;
  requiresAuthorization: boolean;
}

/**
 * Data transfer object for creating a new rate schedule
 */
export interface CreateRateScheduleDto {
  serviceCodeId: UUID;
  payerId: UUID;
  rate: Money;
  effectiveDate: ISO8601Date;
  endDate: ISO8601Date | null;
  isActive: boolean;
}

/**
 * Data transfer object for updating an existing rate schedule
 */
export interface UpdateRateScheduleDto {
  serviceCodeId: UUID;
  payerId: UUID;
  rate: Money;
  effectiveDate: ISO8601Date;
  endDate: ISO8601Date | null;
  isActive: boolean;
}