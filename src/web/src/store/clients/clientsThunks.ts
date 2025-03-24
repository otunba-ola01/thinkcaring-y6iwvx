/**
 * Client Thunks for Redux state management
 * 
 * This file defines async thunk actions for managing clients in the HCBS Revenue Management System.
 * These thunks handle API requests for fetching, creating, updating, and deleting clients.
 *
 * @version 1.0.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { 
  fetchClients, 
  fetchClientById, 
  createClient, 
  updateClient, 
  deleteClient 
} from '../../api/clients.api';
import { 
  ClientQueryParams, 
  CreateClientDto, 
  UpdateClientDto, 
  Client, 
  ClientSummary, 
  UUID 
} from '../../types/clients.types';
import { PaginationMeta } from '../../types/common.types';

/**
 * Async thunk for fetching clients with optional filtering and pagination
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated list of clients
 */
export const fetchClientsThunk = createAsyncThunk<
  { data: ClientSummary[]; pagination: PaginationMeta },
  ClientQueryParams
>('clients/fetchClients', async (params) => {
  try {
    const response = await fetchClients(params);
    return {
      data: response.data,
      pagination: response.meta
    };
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error('Failed to fetch clients');
  }
});

/**
 * Async thunk for fetching a single client by ID
 * 
 * @param id - Client ID
 * @returns Promise resolving to client details
 */
export const fetchClientByIdThunk = createAsyncThunk<
  Client,
  UUID
>('clients/fetchClientById', async (id) => {
  try {
    const response = await fetchClientById(id);
    return response.data;
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error(`Failed to fetch client with ID: ${id}`);
  }
});

/**
 * Async thunk for creating a new client
 * 
 * @param clientData - Client data for creation
 * @returns Promise resolving to created client
 */
export const createClientThunk = createAsyncThunk<
  Client,
  CreateClientDto
>('clients/createClient', async (clientData) => {
  try {
    const response = await createClient(clientData);
    return response.data;
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error('Failed to create client');
  }
});

/**
 * Async thunk for updating an existing client
 * 
 * @param params - Object containing client ID and update data
 * @returns Promise resolving to updated client
 */
export const updateClientThunk = createAsyncThunk<
  Client,
  { id: UUID; data: UpdateClientDto }
>('clients/updateClient', async ({ id, data }) => {
  try {
    const response = await updateClient(id, data);
    return response.data;
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error(`Failed to update client with ID: ${id}`);
  }
});

/**
 * Async thunk for deleting a client
 * 
 * @param id - Client ID
 * @returns Promise resolving to deletion result
 */
export const deleteClientThunk = createAsyncThunk<
  { id: UUID; success: boolean },
  UUID
>('clients/deleteClient', async (id) => {
  try {
    const response = await deleteClient(id);
    return { id, success: response.data };
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error(`Failed to delete client with ID: ${id}`);
  }
});