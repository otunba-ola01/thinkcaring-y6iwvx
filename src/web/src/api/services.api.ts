/**
 * API functions for service-related operations in the HCBS Revenue Management System.
 * Provides methods for fetching, creating, updating, and deleting services, as well as
 * specialized operations like service validation, billing status updates, and metrics retrieval.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client'; // axios v1.4+
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  Service,
  ServiceWithRelations,
  ServiceSummary,
  ServiceQueryParams,
  ServiceListResponse,
  ServiceValidationRequest,
  ServiceValidationResponse,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServiceBillingStatusDto,
  UpdateServiceDocumentationStatusDto,
  ServiceMetrics
} from '../types/services.types';
import { UUID, ApiResponse } from '../types/common.types';

/**
 * Fetches a paginated list of services with optional filtering, sorting, and pagination
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated service list
 */
export async function fetchServices(
  params: ServiceQueryParams
): Promise<ApiResponse<ServiceListResponse>> {
  return apiClient.get(API_ENDPOINTS.SERVICES.BASE, params);
}

/**
 * Fetches a single service by its ID with related entities
 * 
 * @param id - ID of the service to fetch
 * @returns Promise resolving to service with relations
 */
export async function fetchServiceById(
  id: UUID
): Promise<ApiResponse<ServiceWithRelations>> {
  return apiClient.get(`${API_ENDPOINTS.SERVICES.BASE}/${id}`);
}

/**
 * Fetches services that are ready for billing (complete documentation and unbilled)
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated billable service list
 */
export async function fetchBillableServices(
  params: ServiceQueryParams
): Promise<ApiResponse<ServiceListResponse>> {
  return apiClient.get(API_ENDPOINTS.SERVICES.BILLABLE, params);
}

/**
 * Fetches services for a specific client
 * 
 * @param clientId - ID of the client
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated service list for the client
 */
export async function fetchServicesByClientId(
  clientId: UUID,
  params: ServiceQueryParams
): Promise<ApiResponse<ServiceListResponse>> {
  return apiClient.get(API_ENDPOINTS.SERVICES.BASE, {
    ...params,
    clientId
  });
}

/**
 * Fetches services for a specific program
 * 
 * @param programId - ID of the program
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated service list for the program
 */
export async function fetchServicesByProgramId(
  programId: UUID,
  params: ServiceQueryParams
): Promise<ApiResponse<ServiceListResponse>> {
  return apiClient.get(API_ENDPOINTS.SERVICES.BASE, {
    ...params,
    programId
  });
}

/**
 * Creates a new service
 * 
 * @param data - Service data for creation
 * @returns Promise resolving to the created service
 */
export async function createService(
  data: CreateServiceDto
): Promise<ApiResponse<Service>> {
  return apiClient.post(API_ENDPOINTS.SERVICES.BASE, data);
}

/**
 * Updates an existing service
 * 
 * @param id - ID of the service to update
 * @param data - Updated service data
 * @returns Promise resolving to the updated service
 */
export async function updateService(
  id: UUID,
  data: UpdateServiceDto
): Promise<ApiResponse<Service>> {
  return apiClient.put(`${API_ENDPOINTS.SERVICES.BASE}/${id}`, data);
}

/**
 * Deletes a service by ID
 * 
 * @param id - ID of the service to delete
 * @returns Promise resolving to success status
 */
export async function deleteService(
  id: UUID
): Promise<ApiResponse<{ success: boolean }>> {
  return apiClient.del(`${API_ENDPOINTS.SERVICES.BASE}/${id}`);
}

/**
 * Validates services for billing eligibility
 * 
 * @param data - Service IDs to validate
 * @returns Promise resolving to validation results
 */
export async function validateServices(
  data: ServiceValidationRequest
): Promise<ApiResponse<ServiceValidationResponse>> {
  return apiClient.post(API_ENDPOINTS.SERVICES.VALIDATE, data);
}

/**
 * Updates the billing status of a service
 * 
 * @param id - ID of the service to update
 * @param data - Billing status update data
 * @returns Promise resolving to the updated service
 */
export async function updateServiceBillingStatus(
  id: UUID,
  data: UpdateServiceBillingStatusDto
): Promise<ApiResponse<Service>> {
  return apiClient.put(`${API_ENDPOINTS.SERVICES.BASE}/${id}/billing-status`, data);
}

/**
 * Updates the documentation status of a service
 * 
 * @param id - ID of the service to update
 * @param data - Documentation status update data
 * @returns Promise resolving to the updated service
 */
export async function updateServiceDocumentationStatus(
  id: UUID,
  data: UpdateServiceDocumentationStatusDto
): Promise<ApiResponse<Service>> {
  return apiClient.put(`${API_ENDPOINTS.SERVICES.BASE}/${id}/documentation-status`, data);
}

/**
 * Updates the billing status of multiple services
 * 
 * @param serviceIds - IDs of services to update
 * @param data - Billing status update data
 * @returns Promise resolving to count of updated services
 */
export async function bulkUpdateBillingStatus(
  serviceIds: UUID[],
  data: UpdateServiceBillingStatusDto
): Promise<ApiResponse<{ count: number }>> {
  return apiClient.post(`${API_ENDPOINTS.SERVICES.BASE}/bulk-update-billing-status`, {
    serviceIds,
    ...data
  });
}

/**
 * Fetches service metrics and statistics
 * 
 * @returns Promise resolving to service metrics
 */
export async function fetchServiceMetrics(): Promise<ApiResponse<ServiceMetrics>> {
  return apiClient.get(`${API_ENDPOINTS.SERVICES.BASE}/metrics`);
}

/**
 * Uploads documentation for a service
 * 
 * @param serviceId - ID of the service
 * @param formData - Form data containing the documentation files
 * @returns Promise resolving to uploaded document IDs
 */
export async function uploadServiceDocumentation(
  serviceId: UUID,
  formData: FormData
): Promise<ApiResponse<{ documentIds: UUID[] }>> {
  return apiClient.post(`${API_ENDPOINTS.SERVICES.BASE}/${serviceId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * Imports services from an external file
 * 
 * @param formData - Form data containing the import file
 * @returns Promise resolving to import results
 */
export async function importServices(
  formData: FormData
): Promise<ApiResponse<{ imported: number, errors: any[] }>> {
  return apiClient.post(`${API_ENDPOINTS.SERVICES.BASE}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}