import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+ Create memoized selector functions for Redux state
import { RootState } from '../index'; // Import root state type for type-safe selectors
import { ClientState, Client, ClientSummary, ClientQueryParams } from '../../types/clients.types'; // Import client-related type definitions
import { LoadingState } from '../../types/common.types'; // Import loading state enum for selector conditions

/**
 * Base selector that returns the clients slice of the Redux state
 * @param state 
 * @returns The clients state slice
 */
export const selectClientsState = (state: RootState): ClientState => state.clients;

/**
 * Selector for retrieving the list of clients
 * @returns Array of client summaries
 */
export const selectClients = createSelector(
  [selectClientsState],
  (state: ClientState): ClientSummary[] => state.clients
);

/**
 * Selector for retrieving the currently selected client
 * @returns The selected client or null if none is selected
 */
export const selectSelectedClient = createSelector(
  [selectClientsState],
  (state: ClientState): Client | null => state.selectedClient
);

/**
 * Selector for retrieving the loading state of client operations
 * @returns The current loading state
 */
export const selectClientsLoading = createSelector(
  [selectClientsState],
  (state: ClientState): LoadingState => state.loading
);

/**
 * Selector for retrieving any error from client operations
 * @returns Error message or null if no error
 */
export const selectClientsError = createSelector(
  [selectClientsState],
  (state: ClientState): string | null => state.error
);

/**
 * Selector for retrieving pagination information for clients
 * @returns Pagination metadata including page, limit, totalItems, and totalPages
 */
export const selectClientsPagination = createSelector(
  [selectClientsState],
  (state: ClientState): any => state.pagination
);

/**
 * Selector for retrieving the current filter criteria for clients
 * @returns The current filter parameters
 */
export const selectClientsFilter = createSelector(
  [selectClientsState],
  (state: ClientState): ClientQueryParams => state.filters
);

/**
 * Selector that returns a boolean indicating if clients are currently loading
 * @returns True if clients are loading, false otherwise
 */
export const selectIsClientsLoading = createSelector(
  [selectClientsLoading],
  (loading: LoadingState): boolean => loading === LoadingState.LOADING
);

/**
 * Selector that returns a boolean indicating if there is a client error
 * @returns True if there is an error, false otherwise
 */
export const selectHasClientsError = createSelector(
  [selectClientsError],
  (error: string | null): boolean => error !== null
);

/**
 * Selector factory that creates a selector for finding a client by ID
 * @param clientId 
 * @returns A selector function that returns the client with the specified ID or undefined
 */
export const selectClientById = (clientId: string) => createSelector(
  [selectClients],
  (clients: ClientSummary[]) => clients.find(client => client.id === clientId)
);

/**
 * Selector that filters clients by their status
 * @param status 
 * @returns A selector function that returns clients filtered by the specified status(es)
 */
export const selectClientsByStatus = (status: string | string[]) => createSelector(
  [selectClients],
  (clients: ClientSummary[]) => {
    if (Array.isArray(status)) {
      return clients.filter(client => status.includes(client.status));
    }
    return clients.filter(client => client.status === status);
  }
);

/**
 * Selector that filters clients by their program enrollment
 * @param programId 
 * @returns A selector function that returns clients enrolled in the specified program
 */
export const selectClientsByProgram = (programId: string) => createSelector(
  [selectClients],
  (clients: ClientSummary[]) =>
    clients.filter(client => client.programs.some(program => program === programId))
);

/**
 * Selector that returns the total number of clients
 * @returns The total number of clients
 */
export const selectClientsTotal = createSelector(
  [selectClientsPagination],
  (pagination: any): number => pagination.totalItems
);

/**
 * Selector that returns the count of active clients
 * @returns The number of active clients
 */
export const selectActiveClientsCount = createSelector(
  [selectClients],
  (clients: ClientSummary[]): number => clients.filter(client => client.status === 'active').length
);