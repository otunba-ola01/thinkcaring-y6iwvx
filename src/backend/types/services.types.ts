/**
 * TypeScript types and interfaces for services in the HCBS Revenue Management System.
 * This file contains definitions for service entities, DTOs, enums, and related types.
 * 
 * @module services.types
 */

import {
  UUID,
  ISO8601Date,
  Money,
  Units,
  AuditableEntity,
  StatusType,
  DateRange,
  PaginationParams,
  SortParams,
  FilterParams,
  ValidationResult
} from './common.types';

/**
 * Enum for service types in the HCBS system
 */
export enum ServiceType {
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
 * Enum for service documentation status
 */
export enum DocumentationStatus {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete',
  REJECTED = 'rejected',
  PENDING_REVIEW = 'pending_review'
}

/**
 * Enum for service billing status
 */
export enum BillingStatus {
  UNBILLED = 'unbilled',
  READY_FOR_BILLING = 'ready_for_billing',
  IN_CLAIM = 'in_claim',
  BILLED = 'billed',
  PAID = 'paid',
  DENIED = 'denied',
  VOID = 'void'
}

/**
 * Interface for service entity
 * Represents a delivered service that can be billed to a payer
 */
export interface Service extends AuditableEntity {
  id: UUID;
  clientId: UUID;
  serviceTypeId: UUID;
  serviceCode: string;
  serviceDate: ISO8601Date;
  startTime: string | null;
  endTime: string | null;
  units: Units;
  rate: Money;
  amount: Money;
  staffId: UUID | null;
  facilityId: UUID | null;
  programId: UUID;
  authorizationId: UUID | null;
  documentationStatus: DocumentationStatus;
  billingStatus: BillingStatus;
  claimId: UUID | null;
  notes: string | null;
  documentIds: UUID[];
  status: StatusType;
}

/**
 * Interface for service entity with related entities
 * Used when retrieving service details with connected data
 */
export interface ServiceWithRelations {
  id: UUID;
  clientId: UUID;
  client: {
    id: UUID;
    firstName: string;
    lastName: string;
    medicaidId: string | null;
  };
  serviceTypeId: UUID;
  serviceType: {
    id: UUID;
    name: string;
    code: string;
  };
  serviceCode: string;
  serviceDate: ISO8601Date;
  startTime: string | null;
  endTime: string | null;
  units: Units;
  rate: Money;
  amount: Money;
  staffId: UUID | null;
  staff: {
    id: UUID;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  facilityId: UUID | null;
  facility: {
    id: UUID;
    name: string;
    type: string;
  } | null;
  programId: UUID;
  program: {
    id: UUID;
    name: string;
    code: string;
  };
  authorizationId: UUID | null;
  authorization: {
    id: UUID;
    number: string;
    startDate: ISO8601Date;
    endDate: ISO8601Date;
    authorizedUnits: Units;
    usedUnits: Units;
  } | null;
  documentationStatus: DocumentationStatus;
  billingStatus: BillingStatus;
  claimId: UUID | null;
  claim: {
    id: UUID;
    claimNumber: string;
    status: string;
  } | null;
  notes: string | null;
  documentIds: UUID[];
  documents: Array<{
    id: UUID;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  status: StatusType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for service summary data used in listings and reports
 */
export interface ServiceSummary {
  id: UUID;
  clientName: string;
  serviceType: string;
  serviceDate: ISO8601Date;
  units: Units;
  amount: Money;
  documentationStatus: DocumentationStatus;
  billingStatus: BillingStatus;
  programName: string;
}

/**
 * Data transfer object for creating a new service
 */
export interface CreateServiceDto {
  clientId: UUID;
  serviceTypeId: UUID;
  serviceCode: string;
  serviceDate: ISO8601Date;
  startTime: string | null;
  endTime: string | null;
  units: Units;
  rate: Money;
  staffId: UUID | null;
  facilityId: UUID | null;
  programId: UUID;
  authorizationId: UUID | null;
  documentationStatus: DocumentationStatus;
  notes: string | null;
  documentIds: UUID[];
}

/**
 * Data transfer object for updating an existing service
 */
export interface UpdateServiceDto {
  serviceTypeId: UUID;
  serviceCode: string;
  serviceDate: ISO8601Date;
  startTime: string | null;
  endTime: string | null;
  units: Units;
  rate: Money;
  staffId: UUID | null;
  facilityId: UUID | null;
  programId: UUID;
  authorizationId: UUID | null;
  documentationStatus: DocumentationStatus;
  billingStatus: BillingStatus;
  notes: string | null;
  documentIds: UUID[];
  status: StatusType;
}

/**
 * Data transfer object for updating a service's billing status
 */
export interface UpdateServiceBillingStatusDto {
  billingStatus: BillingStatus;
  claimId: UUID | null;
}

/**
 * Data transfer object for updating a service's documentation status
 */
export interface UpdateServiceDocumentationStatusDto {
  documentationStatus: DocumentationStatus;
  documentIds: UUID[];
}

/**
 * Interface for service query parameters used in listing and filtering services
 */
export interface ServiceQueryParams {
  clientId?: UUID;
  programId?: UUID;
  serviceTypeId?: UUID;
  dateRange?: DateRange;
  documentationStatus?: DocumentationStatus;
  billingStatus?: BillingStatus;
  status?: StatusType;
  search?: string;
  pagination: PaginationParams;
  sort: SortParams;
  filter: FilterParams;
}

/**
 * Interface for service validation request
 */
export interface ServiceValidationRequest {
  serviceIds: UUID[];
}

/**
 * Interface for individual service validation result
 */
export interface ServiceValidationResult {
  serviceId: UUID;
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    field: string | null;
  }>;
  warnings: Array<{
    code: string;
    message: string;
    field: string | null;
  }>;
}

/**
 * Interface for service validation response containing results for multiple services
 */
export interface ServiceValidationResponse {
  results: ServiceValidationResult[];
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}

/**
 * Interface for service metrics used in dashboard and reporting
 */
export interface ServiceMetrics {
  totalServices: number;
  totalUnbilledServices: number;
  totalUnbilledAmount: Money;
  incompleteDocumentation: number;
  servicesByProgram: Array<{
    programId: UUID;
    programName: string;
    count: number;
    amount: Money;
  }>;
  servicesByType: Array<{
    serviceTypeId: UUID;
    serviceTypeName: string;
    count: number;
    amount: Money;
  }>;
}

/**
 * Data transfer object for importing services from external systems
 */
export interface ServiceImportDto {
  clientId: UUID;
  serviceTypeId: UUID;
  serviceCode: string;
  serviceDate: ISO8601Date;
  units: Units;
  rate: Money;
  staffId: UUID | null;
  programId: UUID;
  notes: string | null;
}