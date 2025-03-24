import { 
  UUID, 
  ISO8601Date, 
  Address, 
  ContactInfo, 
  EntityBase, 
  Status, 
  PaginatedResponse 
} from './common.types';
import { ApiPaginatedResponse } from './api.types';

/**
 * Enum for client gender options
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'nonBinary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'preferNotToSay'
}

/**
 * Enum for client status values
 */
export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DISCHARGED = 'discharged',
  ON_HOLD = 'onHold',
  DECEASED = 'deceased'
}

/**
 * Enum for client insurance types
 */
export enum InsuranceType {
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE = 'private',
  SELF_PAY = 'selfPay',
  OTHER = 'other'
}

/**
 * Interface for client emergency contact information
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
}

/**
 * Interface for program reference data used in client programs
 */
export interface ProgramReference {
  id: UUID;
  name: string;
  code: string;
}

/**
 * Interface for payer reference data used in client insurance
 */
export interface PayerReference {
  id: UUID;
  name: string;
  type: string;
}

/**
 * Interface for client program enrollment
 */
export interface ClientProgram {
  id: UUID;
  clientId: UUID;
  programId: UUID;
  program: ProgramReference;
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  status: Status;
  notes: string | null;
}

/**
 * Interface for client insurance information
 */
export interface ClientInsurance {
  id: UUID;
  clientId: UUID;
  type: InsuranceType;
  payerId: UUID | null;
  payer: PayerReference | null;
  policyNumber: string;
  groupNumber: string | null;
  subscriberName: string | null;
  subscriberRelationship: string | null;
  effectiveDate: ISO8601Date;
  terminationDate: ISO8601Date | null;
  isPrimary: boolean;
  status: Status;
}

/**
 * Main interface for client data with all properties and relations
 */
export interface Client {
  id: UUID;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: ISO8601Date;
  gender: Gender;
  medicaidId: string | null;
  medicareId: string | null;
  ssn: string | null;
  address: Address;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact | null;
  status: ClientStatus;
  programs: ClientProgram[];
  insurances: ClientInsurance[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified client interface for lists and dropdowns
 */
export interface ClientSummary {
  id: UUID;
  firstName: string;
  lastName: string;
  dateOfBirth: ISO8601Date;
  medicaidId: string | null;
  status: ClientStatus;
  programs: string[]; // Just program names for summary view
}

/**
 * DTO for client creation requests
 */
export interface CreateClientDto {
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: ISO8601Date;
  gender: Gender;
  medicaidId: string | null;
  medicareId: string | null;
  ssn: string | null;
  address: Address;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact | null;
  status: ClientStatus;
  programs: Omit<ClientProgram, 'id' | 'clientId' | 'program'>[];
  insurances: Omit<ClientInsurance, 'id' | 'clientId' | 'payer'>[];
  notes: string | null;
}

/**
 * DTO for client update requests
 */
export interface UpdateClientDto {
  firstName: string;
  lastName: string;
  middleName: string | null;
  gender: Gender;
  medicaidId: string | null;
  medicareId: string | null;
  ssn: string | null;
  address: Address;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact | null;
  status: ClientStatus;
  notes: string | null;
}

/**
 * DTO for client program enrollment creation
 */
export interface CreateClientProgramDto {
  programId: UUID;
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  status: Status;
  notes: string | null;
}

/**
 * DTO for client program enrollment updates
 */
export interface UpdateClientProgramDto {
  startDate: ISO8601Date;
  endDate: ISO8601Date | null;
  status: Status;
  notes: string | null;
}

/**
 * DTO for client insurance creation
 */
export interface CreateClientInsuranceDto {
  type: InsuranceType;
  payerId: UUID | null;
  policyNumber: string;
  groupNumber: string | null;
  subscriberName: string | null;
  subscriberRelationship: string | null;
  effectiveDate: ISO8601Date;
  terminationDate: ISO8601Date | null;
  isPrimary: boolean;
  status: Status;
}

/**
 * DTO for client insurance updates
 */
export interface UpdateClientInsuranceDto {
  type: InsuranceType;
  payerId: UUID | null;
  policyNumber: string;
  groupNumber: string | null;
  subscriberName: string | null;
  subscriberRelationship: string | null;
  effectiveDate: ISO8601Date;
  terminationDate: ISO8601Date | null;
  isPrimary: boolean;
  status: Status;
}

/**
 * Interface for client filter form values
 */
export interface ClientFilterValues {
  search: string;
  status: ClientStatus | ClientStatus[] | null;
  programId: UUID | null;
}

/**
 * Interface for client query parameters used in API requests
 */
export interface ClientQueryParams {
  search: string;
  status: ClientStatus | ClientStatus[];
  programId: UUID;
  page: number;
  pageSize: number;
  sortField: string;
  sortDirection: string;
}

/**
 * Interface for paginated client list response
 */
export interface ClientListResponse {
  items: ClientSummary[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}