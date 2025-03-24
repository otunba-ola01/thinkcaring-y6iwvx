/**
 * Service layer for managing services in the HCBS Revenue Management System. This service provides business logic for service operations including CRUD operations, service validation, billing status management, and service metrics for reporting and dashboards.
 */

import {
  UUID,
  DateRange
} from '../types/common.types';
import {
  Service,
  ServiceWithRelations,
  ServiceSummary,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServiceBillingStatusDto,
  UpdateServiceDocumentationStatusDto,
  ServiceQueryParams,
  ServiceValidationResult,
  ServiceValidationResponse,
  ServiceImportDto,
  ServiceMetrics,
  BillingStatus,
  DocumentationStatus
} from '../types/services.types';
import serviceModel from '../models/service.model';
import { ClientsService } from './clients.service';
import { NotFoundError } from '../errors/not-found-error';
import { BusinessError } from '../errors/business-error';
import { ValidationError } from '../errors/validation-error';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

/**
 * Retrieves a service by its ID
 * @param id - Unique identifier of the service to retrieve
 * @returns The service with related entities
 */
async function getServiceById(id: UUID): Promise<ServiceWithRelations> {
  logger.info('Retrieving service by ID', { serviceId: id }); // Log service retrieval request

  const service = await serviceModel.findById(id); // Call ServiceModel.findById to retrieve service

  if (!service) { // If service not found, throw NotFoundError
    logger.warn('Service not found', { serviceId: id });
    throw new NotFoundError('Service not found', 'service', id);
  }

  return service; // Return service with relations
}

/**
 * Retrieves services with optional filtering and pagination
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated services and total count
 */
async function getServices(params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  logger.info('Retrieving services with parameters', { queryParams: params }); // Log services retrieval request with parameters

  const { services, total } = await serviceModel.findAll(params); // Call ServiceModel.findAll with query parameters

  return { services, total }; // Return services and total count
}

/**
 * Retrieves services for a specific client
 * @param clientId - Client identifier
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated client services and total count
 */
async function getServicesByClientId(clientId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  logger.info('Retrieving services for client', { clientId: clientId }); // Log client services retrieval request

  const { services, total } = await serviceModel.findByClientId(clientId, params); // Call ServiceModel.findByClientId with client ID and query parameters

  return { services, total }; // Return client services and total count
}

/**
 * Retrieves services for a specific program
 * @param programId - Program identifier
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated program services and total count
 */
async function getServicesByProgramId(programId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  logger.info('Retrieving services for program', { programId: programId }); // Log program services retrieval request

  // Create modified query parameters with programId filter
  const programParams: ServiceQueryParams = {
    ...params,
    programId: programId
  };

  const { services, total } = await serviceModel.findAll(programParams); // Call ServiceModel.findAll with modified parameters

  return { services, total }; // Return program services and total count
}

/**
 * Retrieves services for a specific authorization
 * @param authorizationId - Authorization identifier
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated authorization services and total count
 */
async function getServicesByAuthorizationId(authorizationId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  logger.info('Retrieving services for authorization', { authorizationId: authorizationId }); // Log authorization services retrieval request

  const { services, total } = await serviceModel.findByAuthorizationId(authorizationId, params); // Call ServiceModel.findByAuthorizationId with authorization ID and query parameters

  return { services, total }; // Return authorization services and total count
}

/**
 * Retrieves services for a specific claim
 * @param claimId - Claim identifier
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated claim services and total count
 */
async function getServicesByClaimId(claimId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  logger.info('Retrieving services for claim', { claimId: claimId }); // Log claim services retrieval request

  const { services, total } = await serviceModel.findByClaimId(claimId, params); // Call ServiceModel.findByClaimId with claim ID and query parameters

  return { services, total }; // Return claim services and total count
}

/**
 * Creates a new service
 * @param serviceData - Data for the new service
 * @param createdBy - User ID of the user creating the service
 * @returns The newly created service
 */
async function createService(serviceData: CreateServiceDto, createdBy: UUID | null = null): Promise<ServiceWithRelations> {
  logger.info('Creating service', { serviceData: serviceData, createdBy: createdBy }); // Log service creation request

  // Validate client exists by calling ClientsService.getClientById
  const client = await ClientsService.getClientById(serviceData.clientId, false);

  // Call ServiceModel.create with service data and createdBy
  const service = await serviceModel.create(serviceData, createdBy);

  // Send notification about new service creation
  await NotificationService.sendServiceNotification(service.id, 'service_created', 'info', { serviceId: service.id });

  return service; // Return created service with relations
}

/**
 * Updates an existing service
 * @param id - Unique identifier of the service to update
 * @param serviceData - Updated service data
 * @param updatedBy - User ID of the user updating the service
 * @returns The updated service
 */
async function updateService(id: UUID, serviceData: UpdateServiceDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
  logger.info('Updating service', { serviceId: id, serviceData: serviceData, updatedBy: updatedBy }); // Log service update request

  // Verify service exists by calling getServiceById
  const existingService = await getServiceById(id);

  // Call ServiceModel.update with service ID, service data, and updatedBy
  const service = await serviceModel.update(id, serviceData, updatedBy);

  // Send notification about service update if significant changes
  if (serviceData.serviceCode !== existingService.serviceCode || serviceData.serviceDate !== existingService.serviceDate) {
    await NotificationService.sendServiceNotification(service.id, 'service_updated', 'info', { serviceId: service.id });
  }

  return service; // Return updated service with relations
}

/**
 * Deletes a service
 * @param id - Unique identifier of the service to delete
 * @param deletedBy - User ID of the user deleting the service
 * @returns True if the service was successfully deleted
 */
async function deleteService(id: UUID, deletedBy: UUID | null = null): Promise<boolean> {
  logger.info('Deleting service', { serviceId: id, deletedBy: deletedBy }); // Log service deletion request

  // Verify service exists by calling getServiceById
  await getServiceById(id);

  // Call ServiceModel.delete with service ID and deletedBy
  const deleted = await serviceModel.delete(id, deletedBy);

  // Send notification about service deletion
  await NotificationService.sendServiceNotification(id, 'service_deleted', 'info', { serviceId: id });

  return deleted; // Return deletion result
}

/**
 * Updates a service's billing status
 * @param id - Unique identifier of the service to update
 * @param statusData - Data containing the new billing status
 * @param updatedBy - User ID of the user updating the billing status
 * @returns The updated service
 */
async function updateServiceBillingStatus(id: UUID, statusData: UpdateServiceBillingStatusDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
  logger.info('Updating service billing status', { serviceId: id, statusData: statusData, updatedBy: updatedBy }); // Log billing status update request

  // Verify service exists by calling getServiceById
  await getServiceById(id);

  // Call ServiceModel.updateBillingStatus with service ID, status data, and updatedBy
  const service = await serviceModel.updateBillingStatus(id, statusData, updatedBy);

  // Send notification about billing status change
  await NotificationService.sendServiceNotification(id, 'service_billing_status_changed', 'info', { serviceId: id, billingStatus: statusData.billingStatus });

  return service; // Return updated service with relations
}

/**
 * Updates a service's documentation status
 * @param id - Unique identifier of the service to update
 * @param statusData - Data containing the new documentation status
 * @param updatedBy - User ID of the user updating the documentation status
 * @returns The updated service
 */
async function updateServiceDocumentationStatus(id: UUID, statusData: UpdateServiceDocumentationStatusDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
  logger.info('Updating service documentation status', { serviceId: id, statusData: statusData, updatedBy: updatedBy }); // Log documentation status update request

  // Verify service exists by calling getServiceById
  await getServiceById(id);

  // Call ServiceModel.updateDocumentationStatus with service ID, status data, and updatedBy
  const service = await serviceModel.updateDocumentationStatus(id, statusData, updatedBy);

  // Send notification about documentation status change
  await NotificationService.sendServiceNotification(id, 'service_documentation_status_changed', 'info', { serviceId: id, documentationStatus: statusData.documentationStatus });

  return service; // Return updated service with relations
}

/**
 * Updates billing status for multiple services
 * @param serviceIds - Array of service IDs to update
 * @param statusData - Data containing the new billing status
 * @param updatedBy - User ID of the user updating the billing status
 * @returns Results of bulk update operation
 */
async function bulkUpdateBillingStatus(serviceIds: UUID[], statusData: UpdateServiceBillingStatusDto, updatedBy: UUID | null = null): Promise<{ updatedCount: number, failedIds: UUID[] }> {
  logger.info('Bulk updating billing status for services', { serviceIds: serviceIds, statusData: statusData, updatedBy: updatedBy }); // Log bulk billing status update request

  let updatedCount = 0;
  const failedIds: UUID[] = [];

  // For each service ID:
  for (const serviceId of serviceIds) {
    try {
      // Try to update billing status using updateServiceBillingStatus
      await updateServiceBillingStatus(serviceId, statusData, updatedBy);
      updatedCount++; // If successful, increment success counter
    } catch (error) {
      logger.error('Failed to update billing status for service', { serviceId: serviceId, error: error });
      failedIds.push(serviceId); // If failed, add to failed IDs array
    }
  }

  return { updatedCount, failedIds }; // Return results with updated count and failed IDs
}

/**
 * Validates a service for billing readiness
 * @param id - Unique identifier of the service to validate
 * @returns Validation results for the service
 */
async function validateService(id: UUID): Promise<ServiceValidationResult> {
  logger.info('Validating service for billing', { serviceId: id }); // Log service validation request

  // Verify service exists by calling getServiceById
  await getServiceById(id);

  // Call ServiceModel.validateService with service ID
  const validationResult = await serviceModel.validateService(id);

  return validationResult; // Return validation result
}

/**
 * Validates multiple services for billing readiness
 * @param serviceIds - Array of service IDs to validate
 * @returns Validation results for multiple services
 */
async function validateServices(serviceIds: UUID[]): Promise<ServiceValidationResponse> {
  logger.info('Validating multiple services for billing', { serviceIds: serviceIds }); // Log multiple services validation request

  // Call ServiceModel.validateServices with service IDs
  const validationResponse = await serviceModel.validateServices(serviceIds);

  return validationResponse; // Return validation response with results, isValid flag, and error/warning counts
}

/**
 * Retrieves summarized service information for lists and dashboards
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated service summaries and total count
 */
async function getServiceSummaries(params: ServiceQueryParams): Promise<{ services: ServiceSummary[], total: number }> {
  logger.info('Retrieving service summaries', { queryParams: params }); // Log service summaries retrieval request

  // Call ServiceModel.getServiceSummaries with query parameters
  const { services, total } = await serviceModel.getServiceSummaries(params);

  return { services, total }; // Return service summaries and total count
}

/**
 * Retrieves services that are ready for billing
 * @param params - Query parameters for filtering and pagination
 * @returns Paginated billable services and total count
 */
async function getBillableServices(params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  logger.info('Retrieving billable services', { queryParams: params }); // Log billable services retrieval request

  // Call ServiceModel.getUnbilledServices with query parameters
  const { services, total } = await serviceModel.getUnbilledServices(params);

  return { services, total }; // Return billable services and total count
}

/**
 * Retrieves service metrics for dashboard and reporting
 * @param options - Options for filtering metrics
 * @returns Service metrics data
 */
async function getServiceMetrics(options: any): Promise<ServiceMetrics> {
  logger.info('Retrieving service metrics', { options: options }); // Log service metrics retrieval request

  // Call ServiceModel.getServiceMetrics with options
  const metrics = await serviceModel.getServiceMetrics(options);

  return metrics; // Return service metrics data
}

/**
 * Imports services from external systems
 * @param services - Array of services to import
 * @param createdBy - User ID of the user importing the services
 * @returns Import results
 */
async function importServices(services: ServiceImportDto[], createdBy: UUID | null = null): Promise<{ totalProcessed: number, successCount: number, errorCount: number, errors: Array<{ index: number, message: string }>, processedServices: UUID[] }> {
  logger.info('Importing services', { serviceCount: services.length, createdBy: createdBy }); // Log service import request

  // Call ServiceModel.importServices with services array and createdBy
  const importResults = await serviceModel.importServices(services, createdBy);

  // Send notification about service import completion
  await NotificationService.sendServiceNotification(null, 'services_imported', 'info', {
    totalProcessed: importResults.totalProcessed,
    successCount: importResults.successCount,
    errorCount: importResults.errorCount
  });

  return importResults; // Return import results with counts and processed service IDs
}

/**
 * Checks if a billing status transition is allowed based on business rules
 * @param currentStatus - Current billing status
 * @param newStatus - New billing status
 * @returns True if the transition is allowed
 */
function isBillingStatusTransitionAllowed(currentStatus: BillingStatus, newStatus: BillingStatus): boolean {
  // Define allowed transitions for each billing status
  const allowedTransitions: { [key: string]: BillingStatus[] } = {
    [BillingStatus.UNBILLED]: [BillingStatus.READY_FOR_BILLING, BillingStatus.VOID],
    [BillingStatus.READY_FOR_BILLING]: [BillingStatus.UNBILLED, BillingStatus.IN_CLAIM, BillingStatus.VOID],
    [BillingStatus.IN_CLAIM]: [BillingStatus.BILLED, BillingStatus.READY_FOR_BILLING, BillingStatus.UNBILLED, BillingStatus.VOID],
    [BillingStatus.BILLED]: [BillingStatus.PAID, BillingStatus.DENIED, BillingStatus.VOID],
    [BillingStatus.DENIED]: [BillingStatus.READY_FOR_BILLING, BillingStatus.VOID],
    [BillingStatus.PAID]: [BillingStatus.VOID],
    [BillingStatus.VOID]: []
  };

  // Check if the new status is in the allowed transitions for the current status
  return allowedTransitions[currentStatus].includes(newStatus);
}

// Export the service object with all functions
export const ServicesService = {
  getServiceById,
  getServices,
  getServicesByClientId,
  getServicesByProgramId,
  getServicesByAuthorizationId,
  getServicesByClaimId,
  createService,
  updateService,
  deleteService,
  updateServiceBillingStatus,
  updateServiceDocumentationStatus,
  bulkUpdateBillingStatus,
  validateService,
  validateServices,
  getServiceSummaries,
  getBillableServices,
  getServiceMetrics,
  importServices,
  isBillingStatusTransitionAllowed
};