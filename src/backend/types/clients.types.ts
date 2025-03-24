/**
 * Defines TypeScript types and interfaces for client management in the HCBS Revenue Management System.
 * This file contains type definitions for client data structures, including client demographics,
 * program enrollments, insurance information, and related DTOs for API operations.
 * 
 * @module clients.types
 */

import { 
  UUID, 
  ISO8601Date, 
  Address, 
  ContactInfo, 
  AuditableEntity, 
  StatusType, 
  EntityReference 
} from './common.types';

import { 
  QueryParams, 
  PaginationParams 
} from './common.types';

/**
 * Enum for client gender options in the system
 * Used for demographic information and reporting
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

/**
 * Enum for client status values
 * Represents the current state of a client in the system
 */
export enum ClientStatus {
  ACTIVE = 'active',           // Currently receiving services
  INACTIVE = 'inactive',       // Not currently receiving services but may in future
  PENDING = 'pending',         // In the process of enrollment
  DISCHARGED = 'discharged',   // Formally discharged from services
  ON_HOLD = 'on_hold',         // Temporarily not receiving services
  DECEASED = 'deceased'        // Client has passed away
}

/**
 * Enum for client insurance types
 * Defines the types of insurance a client may have
 */
export enum InsuranceType {
  MEDICAID = 'medicaid',
  MEDICARE = 'medicare',
  PRIVATE = 'private',
  SELF_PAY = 'self_pay',
  OTHER = 'other'
}

/**
 * Interface for client emergency contact information
 * Contains information about who to contact in case of emergency
 */
export interface EmergencyContact {
  name: string;                 // Full name of the emergency contact
  relationship: string;         // Relationship to the client
  phone: string;                // Primary phone number
  alternatePhone: string | null; // Secondary phone number if available
  email: string | null;         // Email address if available
}

/**
 * Interface for client program enrollment
 * Tracks which programs a client is enrolled in and related details
 */
export interface ClientProgram {
  id: UUID;                     // Unique identifier for this program enrollment
  clientId: UUID;               // Reference to the client
  programId: UUID;              // Reference to the program
  program: EntityReference;     // Program name and identifier for display purposes
  startDate: ISO8601Date;       // When the client started in this program
  endDate: ISO8601Date | null;  // When the client ended/will end in this program (if known)
  status: StatusType;           // Current status of this program enrollment
  notes: string | null;         // Any additional notes about this enrollment
}

/**
 * Interface for client insurance information
 * Contains details about client's insurance coverage
 */
export interface ClientInsurance {
  id: UUID;                      // Unique identifier for this insurance record
  clientId: UUID;                // Reference to the client
  type: InsuranceType;           // Type of insurance
  payerId: UUID | null;          // Reference to the payer, if applicable
  payer: EntityReference | null; // Payer name and identifier for display purposes
  policyNumber: string;          // Insurance policy number
  groupNumber: string | null;    // Insurance group number, if applicable
  subscriberName: string | null; // Name of policy subscriber, if different from client
  subscriberRelationship: string | null; // Relationship to subscriber, if applicable
  effectiveDate: ISO8601Date;    // When this insurance became effective
  terminationDate: ISO8601Date | null; // When this insurance terminates/terminated, if applicable
  isPrimary: boolean;            // Whether this is the client's primary insurance
  status: StatusType;            // Current status of this insurance record
}

/**
 * Main interface for client data
 * Contains all client properties and relations
 * Implements HIPAA-compliant data structure for Protected Health Information (PHI)
 */
export interface Client {
  id: UUID;                      // Unique identifier for the client
  firstName: string;             // Client's first name
  lastName: string;              // Client's last name
  middleName: string | null;     // Client's middle name, if applicable
  dateOfBirth: ISO8601Date;      // Client's date of birth (PHI)
  gender: Gender;                // Client's gender
  medicaidId: string | null;     // Client's Medicaid ID, if applicable (PHI)
  medicareId: string | null;     // Client's Medicare ID, if applicable (PHI)
  ssn: string | null;            // Client's Social Security Number, if applicable (PHI)
  address: Address;              // Client's residential address (PHI)
  contactInfo: ContactInfo;      // Client's contact information (PHI)
  emergencyContact: EmergencyContact | null; // Client's emergency contact
  status: ClientStatus;          // Current status of the client
  programs: ClientProgram[];     // Programs the client is enrolled in
  insurances: ClientInsurance[]; // Client's insurance information
  notes: string | null;          // Any additional notes about the client
  createdAt: string;             // When this client record was created
  updatedAt: string;             // When this client record was last updated
  createdBy: UUID | null;        // Who created this client record
  updatedBy: UUID | null;        // Who last updated this client record
}

/**
 * Simplified client interface for dropdowns and lists
 * Contains only essential client information for reference purposes
 */
export interface ClientSummary {
  id: UUID;                      // Unique identifier for the client
  firstName: string;             // Client's first name
  lastName: string;              // Client's last name
  dateOfBirth: ISO8601Date;      // Client's date of birth
  medicaidId: string | null;     // Client's Medicaid ID, if applicable
  status: ClientStatus;          // Current status of the client
}

/**
 * DTO for client creation requests
 * Contains all fields required to create a new client
 */
export interface CreateClientDto {
  firstName: string;             // Client's first name
  lastName: string;              // Client's last name
  middleName: string | null;     // Client's middle name, if applicable
  dateOfBirth: ISO8601Date;      // Client's date of birth
  gender: Gender;                // Client's gender
  medicaidId: string | null;     // Client's Medicaid ID, if applicable
  medicareId: string | null;     // Client's Medicare ID, if applicable
  ssn: string | null;            // Client's Social Security Number, if applicable
  address: Address;              // Client's residential address
  contactInfo: ContactInfo;      // Client's contact information
  emergencyContact: EmergencyContact | null; // Client's emergency contact
  status: ClientStatus;          // Initial status of the client
  programs: Omit<ClientProgram, 'id' | 'clientId' | 'program'>[]; // Initial program enrollments
  insurances: Omit<ClientInsurance, 'id' | 'clientId' | 'payer'>[]; // Initial insurance information
  notes: string | null;          // Any additional notes about the client
}

/**
 * DTO for client update requests
 * Contains fields that can be updated for an existing client
 */
export interface UpdateClientDto {
  firstName: string;             // Client's first name
  lastName: string;              // Client's last name
  middleName: string | null;     // Client's middle name, if applicable
  gender: Gender;                // Client's gender
  medicaidId: string | null;     // Client's Medicaid ID, if applicable
  medicareId: string | null;     // Client's Medicare ID, if applicable
  ssn: string | null;            // Client's Social Security Number, if applicable
  address: Address;              // Client's residential address
  contactInfo: ContactInfo;      // Client's contact information
  emergencyContact: EmergencyContact | null; // Client's emergency contact
  status: ClientStatus;          // Current status of the client
  notes: string | null;          // Any additional notes about the client
}

/**
 * DTO for client program enrollment creation
 * Contains fields required to enroll a client in a program
 */
export interface CreateClientProgramDto {
  programId: UUID;               // ID of the program to enroll in
  startDate: ISO8601Date;        // When the client starts in this program
  endDate: ISO8601Date | null;   // When the client will end in this program, if known
  status: StatusType;            // Initial status of this program enrollment
  notes: string | null;          // Any additional notes about this enrollment
}

/**
 * DTO for client program enrollment updates
 * Contains fields that can be updated for an existing program enrollment
 */
export interface UpdateClientProgramDto {
  startDate: ISO8601Date;        // When the client started in this program
  endDate: ISO8601Date | null;   // When the client ended/will end in this program
  status: StatusType;            // Current status of this program enrollment
  notes: string | null;          // Any additional notes about this enrollment
}

/**
 * DTO for client insurance creation
 * Contains fields required to add insurance information for a client
 */
export interface CreateClientInsuranceDto {
  type: InsuranceType;           // Type of insurance
  payerId: UUID | null;          // ID of the payer, if applicable
  policyNumber: string;          // Insurance policy number
  groupNumber: string | null;    // Insurance group number, if applicable
  subscriberName: string | null; // Name of policy subscriber, if different from client
  subscriberRelationship: string | null; // Relationship to subscriber, if applicable
  effectiveDate: ISO8601Date;    // When this insurance became effective
  terminationDate: ISO8601Date | null; // When this insurance terminates, if applicable
  isPrimary: boolean;            // Whether this is the client's primary insurance
  status: StatusType;            // Initial status of this insurance record
}

/**
 * DTO for client insurance updates
 * Contains fields that can be updated for existing insurance information
 */
export interface UpdateClientInsuranceDto {
  type: InsuranceType;           // Type of insurance
  payerId: UUID | null;          // ID of the payer, if applicable
  policyNumber: string;          // Insurance policy number
  groupNumber: string | null;    // Insurance group number, if applicable
  subscriberName: string | null; // Name of policy subscriber, if different from client
  subscriberRelationship: string | null; // Relationship to subscriber, if applicable
  effectiveDate: ISO8601Date;    // When this insurance became effective
  terminationDate: ISO8601Date | null; // When this insurance terminates, if applicable
  isPrimary: boolean;            // Whether this is the client's primary insurance
  status: StatusType;            // Current status of this insurance record
}

/**
 * Interface for client query parameters
 * Extends standard query parameters with client-specific filters
 */
export interface ClientQueryParams {
  search: string;                // Search term for client name, ID, etc.
  status: ClientStatus | ClientStatus[]; // Filter by client status
  programId: UUID;               // Filter by program enrollment
  page: number;                  // Page number for pagination
  limit: number;                 // Number of items per page
}