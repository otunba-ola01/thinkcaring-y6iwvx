/**
 * Redux slice for managing clients state in the HCBS Revenue Management System.
 * Handles client data, loading states, filtering, pagination, and CRUD operations.
 * Works with client thunks for asynchronous operations.
 * 
 * @version 1.0.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { ClientState, Client, ClientSummary, ClientQueryParams } from '../../types/clients.types';
import { LoadingState, PaginationMeta } from '../../types/common.types';
import {
  fetchClientsThunk,
  fetchClientByIdThunk,
  createClientThunk,
  updateClientThunk,
  deleteClientThunk
} from './clientsThunks';

/**
 * Initial state for clients slice
 */
const initialState: ClientState = {
  clients: [],
  selectedClient: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  },
  loading: LoadingState.IDLE,
  error: null,
  filters: {
    search: '',
    status: null,
    programId: null,
    pagination: {
      page: 1,
      limit: 10
    }
  }
};

/**
 * Redux slice for clients management
 */
export const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    /**
     * Updates client filter criteria and resets pagination to first page
     */
    setClientsFilter: (state, action: PayloadAction<Partial<ClientQueryParams>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        pagination: {
          ...state.filters.pagination,
          page: 1 // Reset to first page when filter changes
        }
      };
    },
    
    /**
     * Resets all client filters to default values
     */
    resetClientsFilter: (state) => {
      state.filters = {
        search: '',
        status: null,
        programId: null,
        pagination: {
          page: 1,
          limit: 10
        }
      };
    },
    
    /**
     * Clears the currently selected client
     */
    clearSelectedClient: (state) => {
      state.selectedClient = null;
    }
  },
  extraReducers: (builder) => {
    // Handle fetchClientsThunk
    builder
      .addCase(fetchClientsThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchClientsThunk.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCEEDED;
        state.clients = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchClientsThunk.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.payload || {
          code: 'FETCH_ERROR',
          message: action.error.message || 'Failed to fetch clients',
          details: null
        };
      });

    // Handle fetchClientByIdThunk
    builder
      .addCase(fetchClientByIdThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(fetchClientByIdThunk.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCEEDED;
        state.selectedClient = action.payload;
      })
      .addCase(fetchClientByIdThunk.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.payload || {
          code: 'FETCH_ERROR',
          message: action.error.message || 'Failed to fetch client details',
          details: null
        };
      });

    // Handle createClientThunk
    builder
      .addCase(createClientThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(createClientThunk.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCEEDED;
        state.selectedClient = action.payload;
        
        // Add new client to the list if it's within the current filter criteria
        // This is a simplification - in a real app we might refetch the list instead
        const clientSummary: ClientSummary = {
          id: action.payload.id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          dateOfBirth: action.payload.dateOfBirth,
          medicaidId: action.payload.medicaidId,
          status: action.payload.status,
          programs: action.payload.programs.map(p => p.program.name)
        };
        
        // Only add to the list if we have fewer items than the total (to maintain pagination)
        if (state.clients.length < state.pagination.totalItems) {
          state.clients.unshift(clientSummary);
          
          // Remove last item if we've exceeded the page size
          if (state.clients.length > state.pagination.limit) {
            state.clients.pop();
          }
        }
        
        // Update total items count
        state.pagination.totalItems += 1;
      })
      .addCase(createClientThunk.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.payload || {
          code: 'CREATE_ERROR',
          message: action.error.message || 'Failed to create client',
          details: null
        };
      });

    // Handle updateClientThunk
    builder
      .addCase(updateClientThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(updateClientThunk.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCEEDED;
        state.selectedClient = action.payload;
        
        // Update the client in the clients array if it exists
        const index = state.clients.findIndex(client => client.id === action.payload.id);
        if (index !== -1) {
          // Create a ClientSummary from the full Client
          const updatedClientSummary: ClientSummary = {
            id: action.payload.id,
            firstName: action.payload.firstName,
            lastName: action.payload.lastName,
            dateOfBirth: action.payload.dateOfBirth,
            medicaidId: action.payload.medicaidId,
            status: action.payload.status,
            programs: action.payload.programs.map(p => p.program.name)
          };
          state.clients[index] = updatedClientSummary;
        }
      })
      .addCase(updateClientThunk.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.payload || {
          code: 'UPDATE_ERROR',
          message: action.error.message || 'Failed to update client',
          details: null
        };
      });

    // Handle deleteClientThunk
    builder
      .addCase(deleteClientThunk.pending, (state) => {
        state.loading = LoadingState.LOADING;
        state.error = null;
      })
      .addCase(deleteClientThunk.fulfilled, (state, action) => {
        state.loading = LoadingState.SUCCEEDED;
        
        // Remove the deleted client from the clients array
        state.clients = state.clients.filter(client => client.id !== action.payload.id);
        
        // Clear selectedClient if it matches the deleted client
        if (state.selectedClient && state.selectedClient.id === action.payload.id) {
          state.selectedClient = null;
        }
        
        // Update total items count
        if (state.pagination.totalItems > 0) {
          state.pagination.totalItems -= 1;
        }
      })
      .addCase(deleteClientThunk.rejected, (state, action) => {
        state.loading = LoadingState.FAILED;
        state.error = action.payload || {
          code: 'DELETE_ERROR',
          message: action.error.message || 'Failed to delete client',
          details: null
        };
      });
  }
});

// Export actions for components to use
export const { 
  setClientsFilter, 
  resetClientsFilter, 
  clearSelectedClient 
} = clientsSlice.actions;

// Export the reducer for the store configuration
export const clientsReducer = clientsSlice.reducer;