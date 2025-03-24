/**
 * Client API Module
 * 
 * Implements API functions for client management in the HCBS Revenue Management System,
 * providing methods for fetching, creating, updating, and deleting clients, as well as
 * managing client programs, insurances, services, claims, and authorizations.
 * 
 * @version 1.0.0
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  Client,
  ClientSummary,
  ClientListResponse,
  CreateClientDto,
  UpdateClientDto,
  ClientProgram,
  ClientInsurance,
  CreateClientProgramDto,
  UpdateClientProgramDto,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto,
  ClientQueryParams
} from '../types/clients.types';
import { UUID, ApiResponse, ApiPaginatedResponse } from '../types/api.types';

/**
 * Fetches a paginated list of clients with optional filtering
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated client list
 */
export async function fetchClients(params: ClientQueryParams): Promise<ApiPaginatedResponse<ClientListResponse>> {
  return apiClient.get(API_ENDPOINTS.CLIENTS.BASE, params);
}

/**
 * Fetches detailed information for a specific client by ID
 * 
 * @param id - Client ID
 * @returns Promise resolving to client details
 */
export async function fetchClientById(id: UUID): Promise<ApiResponse<Client>> {
  return apiClient.get(`${API_ENDPOINTS.CLIENTS.BASE}/${id}`);
}

/**
 * Creates a new client with the provided data
 * 
 * @param client - Client data for creation
 * @returns Promise resolving to the created client
 */
export async function createClient(client: CreateClientDto): Promise<ApiResponse<Client>> {
  return apiClient.post(API_ENDPOINTS.CLIENTS.BASE, client);
}

/**
 * Updates an existing client with the provided data
 * 
 * @param id - Client ID
 * @param client - Updated client data
 * @returns Promise resolving to the updated client
 */
export async function updateClient(id: UUID, client: UpdateClientDto): Promise<ApiResponse<Client>> {
  return apiClient.put(`${API_ENDPOINTS.CLIENTS.BASE}/${id}`, client);
}

/**
 * Deletes a client by ID
 * 
 * @param id - Client ID
 * @returns Promise resolving to deletion success status
 */
export async function deleteClient(id: UUID): Promise<ApiResponse<boolean>> {
  return apiClient.del(`${API_ENDPOINTS.CLIENTS.BASE}/${id}`);
}

/**
 * Adds a program enrollment to a client
 * 
 * @param clientId - Client ID
 * @param program - Program enrollment data
 * @returns Promise resolving to the created program enrollment
 */
export async function addClientProgram(
  clientId: UUID,
  program: CreateClientProgramDto
): Promise<ApiResponse<ClientProgram>> {
  return apiClient.post(`${API_ENDPOINTS.CLIENTS.BASE}/${clientId}/programs`, program);
}

/**
 * Updates a client's program enrollment
 * 
 * @param clientId - Client ID
 * @param programId - Program enrollment ID
 * @param program - Updated program enrollment data
 * @returns Promise resolving to the updated program enrollment
 */
export async function updateClientProgram(
  clientId: UUID,
  programId: UUID,
  program: UpdateClientProgramDto
): Promise<ApiResponse<ClientProgram>> {
  return apiClient.put(`${API_ENDPOINTS.CLIENTS.BASE}/${clientId}/programs/${programId}`, program);
}

/**
 * Removes a program enrollment from a client
 * 
 * @param clientId - Client ID
 * @param programId - Program enrollment ID
 * @returns Promise resolving to removal success status
 */
export async function removeClientProgram(
  clientId: UUID,
  programId: UUID
): Promise<ApiResponse<boolean>> {
  return apiClient.del(`${API_ENDPOINTS.CLIENTS.BASE}/${clientId}/programs/${programId}`);
}

/**
 * Adds insurance information to a client
 * 
 * @param clientId - Client ID
 * @param insurance - Insurance information data
 * @returns Promise resolving to the created insurance record
 */
export async function addClientInsurance(
  clientId: UUID,
  insurance: CreateClientInsuranceDto
): Promise<ApiResponse<ClientInsurance>> {
  return apiClient.post(`${API_ENDPOINTS.CLIENTS.BASE}/${clientId}/insurances`, insurance);
}

/**
 * Updates a client's insurance information
 * 
 * @param clientId - Client ID
 * @param insuranceId - Insurance record ID
 * @param insurance - Updated insurance information
 * @returns Promise resolving to the updated insurance record
 */
export async function updateClientInsurance(
  clientId: UUID,
  insuranceId: UUID,
  insurance: UpdateClientInsuranceDto
): Promise<ApiResponse<ClientInsurance>> {
  return apiClient.put(`${API_ENDPOINTS.CLIENTS.BASE}/${clientId}/insurances/${insuranceId}`, insurance);
}

/**
 * Removes insurance information from a client
 * 
 * @param clientId - Client ID
 * @param insuranceId - Insurance record ID
 * @returns Promise resolving to removal success status
 */
export async function removeClientInsurance(
  clientId: UUID,
  insuranceId: UUID
): Promise<ApiResponse<boolean>> {
  return apiClient.del(`${API_ENDPOINTS.CLIENTS.BASE}/${clientId}/insurances/${insuranceId}`);
}

/**
 * Fetches services associated with a client
 * 
 * @param clientId - Client ID
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated client services
 */
export async function fetchClientServices(
  clientId: UUID,
  params: object = {}
): Promise<ApiPaginatedResponse<any>> {
  const endpoint = API_ENDPOINTS.CLIENTS.SERVICES.replace(':id', clientId);
  return apiClient.get(endpoint, params);
}

/**
 * Fetches claims associated with a client
 * 
 * @param clientId - Client ID
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated client claims
 */
export async function fetchClientClaims(
  clientId: UUID,
  params: object = {}
): Promise<ApiPaginatedResponse<any>> {
  const endpoint = API_ENDPOINTS.CLIENTS.CLAIMS.replace(':id', clientId);
  return apiClient.get(endpoint, params);
}

/**
 * Fetches service authorizations associated with a client
 * 
 * @param clientId - Client ID
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated client authorizations
 */
export async function fetchClientAuthorizations(
  clientId: UUID,
  params: object = {}
): Promise<ApiPaginatedResponse<any>> {
  const endpoint = API_ENDPOINTS.CLIENTS.AUTHORIZATIONS.replace(':id', clientId);
  return apiClient.get(endpoint, params);
}