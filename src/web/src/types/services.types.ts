/**
 * This file defines TypeScript types and interfaces for services in the HCBS Revenue Management System frontend.
 * It includes type definitions for service entities, DTOs for service operations, enums for service statuses,
 * and interfaces for service queries and validation.
 */

import {
  UUID,
  ISO8601Date,
  ISO8601DateTime,
  Money,
  DateRange,
  PaginationParams,
  SortParams,
  FilterParams,
  PaginatedResponse,
  Status,
  ServiceStatus,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EntityBase
} from './common.types';

import { ApiResponse } from './api.types';

/**
 * Enum for types of services provided in the HCBS system
 */
export enum ServiceType {
  PERSONAL_CARE = 'personalCare',
  RESIDENTIAL = 'residential',
  DAY_SERVICES = 'dayServices',
  RESPITE = 'respite',
  THERAPY = 'therapy',
  TRANSPORTATION = 'transportation',
  CASE_MANAGEMENT = 'caseManagement',
  OTHER = 'other'
}

/**
 * Enum for documentation status of services
 */
export enum DocumentationStatus {
  INCOMPLETE = 'incomplete',
  COMPLETE = 'complete',
  REJECTED = 'rejected',
  PENDING_REVIEW = 'pendingReview'
}

/**
 * Enum for billing status of services
 */
export enum BillingStatus {
  UNBILLED = 'unbilled',
  READY_FOR_BILLING = 'readyForBilling',
  IN_CLAIM = 'inClaim',
  BILLED = 'billed',
  PAID = 'paid',
  DENIED = 'denied',
  VOID = 'void'
}

/**
 * Type alias for service units (numeric value)
 */
export type Units = number;

/**
 * Interface for the service entity
 */
export interface Service extends EntityBase {
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
  status: Status;
}

/**
 * Interface for service entity with its related entities
 */
export interface ServiceWithRelations extends Service {
  client: {
    id: UUID;
    firstName: string;
    lastName: string;
    medicaidId: string | null;
  };
  serviceType: {
    id: UUID;
    name: string;
    code: string;
  };
  staff: {
    id: UUID;
    firstName: string;
    lastName: string;
    title: string | null;
  } | null;
  facility: {
    id: UUID;
    name: string;
    type: string;
  } | null;
  program: {
    id: UUID;
    name: string;
    code: string;
  };
  authorization: {
    id: UUID;
    number: string;
    startDate: ISO8601Date;
    endDate: ISO8601Date;
    authorizedUnits: Units;
    usedUnits: Units;
  } | null;
  claim: {
    id: UUID;
    claimNumber: string;
    status: string;
  } | null;
  documents: Array<{
    id: UUID;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

/**
 * Interface for service summary used in listings and reports
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
  status: Status;
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
 * Interface for service query parameters
 */
export interface ServiceQueryParams {
  clientId?: UUID;
  programId?: UUID;
  serviceTypeId?: UUID;
  dateRange?: DateRange;
  documentationStatus?: DocumentationStatus;
  billingStatus?: BillingStatus;
  status?: Status;
  search?: string;
  pagination?: PaginationParams;
  sort?: SortParams;
  filter?: FilterParams;
}

/**
 * Interface for paginated service list response
 */
export interface ServiceListResponse {
  items: ServiceSummary[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Interface for service validation response containing multiple validation results
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

/**
 * Props interface for the ServiceList component
 */
export interface ServiceListProps {
  clientId?: UUID;
  programId?: UUID;
  onServiceSelect?: (service: ServiceSummary) => void;
  selectable: boolean;
  sx?: object;
}

/**
 * Props interface for the ServiceFilter component
 */
export interface ServiceFilterProps {
  filters: ServiceQueryParams;
  onFilterChange: (filters: ServiceQueryParams) => void;
  onClearFilters: () => void;
  clientId?: UUID;
  programId?: UUID;
}