import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9+
import { 
  ServiceSummary, 
  ServiceWithRelations, 
  ServiceQueryParams, 
  PaginationMeta, 
  ServiceMetrics, 
  ServiceValidationResponse,
  BillingStatus,
  DocumentationStatus
} from '../../types/services.types';

// Define the service state interface
export interface ServiceState {
  services: ServiceSummary[];
  selectedService: ServiceWithRelations | null;
  pagination: PaginationMeta;
  loading: boolean;
  error: string | null;
  filters: ServiceQueryParams;
  metrics: ServiceMetrics | null;
  validationResults: ServiceValidationResponse | null;
}

// Define the initial state for the services slice
const initialState: ServiceState = {
  services: [],
  selectedService: null,
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  },
  loading: false,
  error: null,
  filters: {
    clientId: undefined,
    programId: undefined,
    serviceTypeId: undefined,
    dateRange: undefined,
    documentationStatus: undefined,
    billingStatus: undefined,
    status: undefined,
    search: undefined,
    pagination: {
      page: 1,
      pageSize: 10
    },
    sort: {
      field: 'serviceDate',
      direction: 'desc'
    },
    filter: {}
  },
  metrics: null,
  validationResults: null
};

// Create the services slice with reducers
const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices: (state, action: PayloadAction<ServiceSummary[]>) => {
      state.services = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedService: (state, action: PayloadAction<ServiceWithRelations | null>) => {
      state.selectedService = action.payload;
      state.loading = false;
      state.error = null;
    },
    setPagination: (state, action: PayloadAction<PaginationMeta>) => {
      state.pagination = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<Partial<ServiceQueryParams>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setMetrics: (state, action: PayloadAction<ServiceMetrics | null>) => {
      state.metrics = action.payload;
      state.loading = false;
      state.error = null;
    },
    setValidationResults: (state, action: PayloadAction<ServiceValidationResponse | null>) => {
      state.validationResults = action.payload;
      state.loading = false;
      state.error = null;
    },
    resetState: (state) => {
      return initialState;
    }
  }
});

// Extract the reducer and actions
export const servicesReducer = servicesSlice.reducer;
export const servicesActions = servicesSlice.actions;

// Export the slice
export default servicesSlice;