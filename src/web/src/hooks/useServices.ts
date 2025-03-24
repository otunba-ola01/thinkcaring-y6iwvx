import { useState, useCallback, useEffect, useMemo } from 'react'; // react v18.2.0
import useApiRequest from './useApiRequest';
import useFilter from './useFilter';
import usePagination from './usePagination';
import useSort from './useSort';
import useToast from './useToast';
import { API_ENDPOINTS } from '../constants/api.constants';
import { DEFAULT_SERVICE_FILTERS, DOCUMENTATION_STATUS_LABELS, BILLING_STATUS_LABELS, SERVICE_BATCH_SIZE_LIMIT } from '../constants/services.constants';
import { Service, ServiceWithRelations, ServiceSummary, DocumentationStatus, BillingStatus, ServiceQueryParams, ServiceListResponse, ServiceValidationRequest, ServiceValidationResponse, CreateServiceDto, UpdateServiceDto, UpdateServiceBillingStatusDto, UpdateServiceDocumentationStatusDto, ServiceMetrics } from '../types/services.types';
import { UUID, PaginationParams, SortParams, FilterParams, LoadingState, ApiResponse } from '../types/common.types';
import { FilterConfig, FilterType } from '../types/ui.types';
import * as servicesApi from '../api/services.api';

/**
 * Interface for options passed to useServices hook
 */
export interface UseServicesOptions {
  /**
   * Initial filters for services
   */
  initialFilters?: Partial<ServiceQueryParams>;
  /**
   * Initial sort parameters
   */
  initialSort?: SortParams[];
  /**
   * Initial page number
   */
  initialPage?: number;
  /**
   * Initial page size
   */
  initialPageSize?: number;
  /**
   * Whether to synchronize with URL
   */
  syncWithUrl?: boolean;
  /**
   * Whether to automatically fetch services
   */
  autoFetch?: boolean;
  /**
   * Client ID to filter services by
   */
  clientId?: UUID | undefined;
  /**
   * Program ID to filter services by
   */
  programId?: UUID | undefined;
}

/**
 * Interface for the result returned by useServices hook
 */
export interface UseServicesResult {
  /**
   * List of services
   */
  services: ServiceSummary[];
  /**
   * Selected service
   */
  selectedService: ServiceWithRelations | null;
  /**
   * Loading state
   */
  loading: LoadingState;
  /**
   * Error message
   */
  error: string | null;
  /**
   * Filter state
   */
  filterState: any; // TODO: Replace 'any' with FilterState type
  /**
   * Pagination state
   */
  paginationState: any; // TODO: Replace 'any' with PaginationState type
  /**
   * Sort state
   */
  sortState: any; // TODO: Replace 'any' with SortState type
  /**
   * Function to fetch services
   */
  fetchServices: () => Promise<void>;
  /**
   * Function to fetch a service by ID
   */
  fetchServiceById: (id: UUID) => Promise<ServiceWithRelations | null>;
  /**
   * Function to fetch billable services
   */
  fetchBillableServices: () => Promise<void>;
  /**
   * Function to fetch services by client ID
   */
  fetchServicesByClientId: (clientId: UUID) => Promise<void>;
  /**
   * Function to fetch services by program ID
   */
  fetchServicesByProgramId: (programId: UUID) => Promise<void>;
  /**
   * Function to create a new service
   */
  createService: (data: CreateServiceDto) => Promise<Service | null>;
  /**
   * Function to update an existing service
   */
  updateService: (id: UUID, data: UpdateServiceDto) => Promise<Service | null>;
  /**
   * Function to delete a service
   */
  deleteService: (id: UUID) => Promise<boolean>;
  /**
   * Function to validate services
   */
  validateServices: (serviceIds: UUID[]) => Promise<ServiceValidationResponse | null>;
  /**
   * Function to update the billing status of a service
   */
  updateServiceBillingStatus: (id: UUID, data: UpdateServiceBillingStatusDto) => Promise<Service | null>;
  /**
   * Function to update the documentation status of a service
   */
  updateServiceDocumentationStatus: (id: UUID, data: UpdateServiceDocumentationStatusDto) => Promise<Service | null>;
  /**
   * Function to bulk update billing status for multiple services
   */
  bulkUpdateBillingStatus: (serviceIds: UUID[], data: UpdateServiceBillingStatusDto) => Promise<{ count: number } | null>;
  /**
   * Function to fetch service metrics
   */
  fetchServiceMetrics: () => Promise<ServiceMetrics | null>;
  /**
   * Service metrics data
   */
  serviceMetrics: ServiceMetrics | null;
  /**
   * Validation results
   */
  validationResults: ServiceValidationResponse | null;
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Loading state for create service operation
   */
  isCreating: boolean;
  /**
   * Loading state for update service operation
   */
  isUpdating: boolean;
  /**
   * Loading state for delete service operation
   */
  isDeleting: boolean;
  /**
   * Loading state for validate service operation
   */
  isValidating: boolean;
  /**
   * Loading state for update billing status operation
   */
  isUpdatingBillingStatus: boolean;
  /**
   * Loading state for update documentation status operation
   */
  isUpdatingDocumentationStatus: boolean;
  /**
   * Loading state for bulk update operation
   */
  isBulkUpdating: boolean;
  /**
   * Loading state for fetching service metrics
   */
  isFetchingMetrics: boolean;
}

/**
 * A custom hook that provides comprehensive functionality for managing services
 * @param options - Options for the hook
 * @returns An object containing service state and operations
 */
const useServices = (options: UseServicesOptions = {}): UseServicesResult => {
  // 1. Initialize state for services list, selected service, loading state, and error
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceWithRelations | null>(null);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics | null>(null);
  const [validationResults, setValidationResults] = useState<ServiceValidationResponse | null>(null);

  // 2. Set up filter configuration for services filtering
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: FilterType.DATE_RANGE,
      field: 'serviceDate'
    },
    {
      id: 'programId',
      label: 'Program',
      type: FilterType.SELECT,
      field: 'programId',
      options: [], // TODO: Populate with program options
    },
    {
      id: 'serviceTypeId',
      label: 'Service Type',
      type: FilterType.SELECT,
      field: 'serviceTypeId',
      options: [], // TODO: Populate with service type options
    },
    {
      id: 'documentationStatus',
      label: 'Documentation Status',
      type: FilterType.SELECT,
      field: 'documentationStatus',
      options: Object.entries(DOCUMENTATION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      id: 'billingStatus',
      label: 'Billing Status',
      type: FilterType.SELECT,
      field: 'billingStatus',
      options: Object.entries(BILLING_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
  ], []);

  // 3. Initialize filter state using useFilter hook with default service filters
  const {
    filters,
    filterParams,
    setFilter,
    clearFilter,
    clearAllFilters,
    applyFilters,
  } = useFilter({
    filterConfigs,
    initialFilters: options.initialFilters || DEFAULT_SERVICE_FILTERS,
    syncWithUrl: options.syncWithUrl,
  });

  // 4. Initialize pagination state using usePagination hook
  const {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
    paginationParams,
  } = usePagination({
    initialPage: options.initialPage,
    initialPageSize: options.initialPageSize,
    syncWithUrl: options.syncWithUrl,
  });

  // 5. Initialize sort state using useSort hook
  const {
    sort,
    setSort,
    toggleSort,
    clearSort,
    getSortParams,
  } = useSort({
    initialSort: options.initialSort,
    syncWithUrl: options.syncWithUrl,
  });

  // 6. Initialize toast notifications using useToast hook
  const { success, error: toastError } = useToast();

  // 7. Set up API request hooks for various service operations
  const { execute: executeFetchServices, loading: isFetching } = useApiRequest<ServiceListResponse>({ url: API_ENDPOINTS.SERVICES.BASE });
  const { execute: executeFetchServiceById } = useApiRequest<ServiceWithRelations>();
  const { execute: executeCreateService, loading: isCreating } = useApiRequest<Service>({ url: API_ENDPOINTS.SERVICES.BASE, method: 'POST' });
  const { execute: executeUpdateService, loading: isUpdating } = useApiRequest<Service>({ method: 'PUT' });
  const { execute: executeDeleteService, loading: isDeleting } = useApiRequest<{ success: boolean }>({ method: 'DELETE' });
  const { execute: executeValidateServices, loading: isValidating } = useApiRequest<ServiceValidationResponse>({ url: API_ENDPOINTS.SERVICES.VALIDATE, method: 'POST' });
  const { execute: executeUpdateServiceBillingStatus, loading: isUpdatingBillingStatus } = useApiRequest<Service>({ method: 'PUT' });
  const { execute: executeUpdateServiceDocumentationStatus, loading: isUpdatingDocumentationStatus } = useApiRequest<Service>({ method: 'PUT' });
  const { execute: executeBulkUpdateBillingStatus, loading: isBulkUpdating } = useApiRequest<{ count: number }>({ method: 'POST' });
  const { execute: executeFetchServiceMetrics, loading: isFetchingMetrics } = useApiRequest<ServiceMetrics>({ url: API_ENDPOINTS.SERVICES.GET_METRICS });

  // 8. Define fetchServices function to retrieve services with filtering, pagination, and sorting
  const fetchServices = useCallback(async () => {
    setLoading(LoadingState.LOADING);
    setError(null);

    try {
      const queryParams: ServiceQueryParams = {
        ...filters,
        pagination: paginationParams,
        sort: getSortParams(),
        clientId: options.clientId,
        programId: options.programId
      };

      const response = await executeFetchServices({ params: queryParams });

      if (response) {
        setServices(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
        setLoading(LoadingState.SUCCESS);
      } else {
        setLoading(LoadingState.ERROR);
        setError('Failed to fetch services');
      }
    } catch (err: any) {
      setLoading(LoadingState.ERROR);
      setError(err.message || 'Failed to fetch services');
      toastError(err.message || 'Failed to fetch services');
    }
  }, [executeFetchServices, getSortParams, paginationParams, filters, options.clientId, options.programId, toastError]);

  // 9. Define fetchServiceById function to retrieve a specific service by ID
  const fetchServiceById = useCallback(async (id: UUID) => {
    try {
      const response = await executeFetchServiceById({ url: `${API_ENDPOINTS.SERVICES.BASE}/${id}` });
      setSelectedService(response ? response.data : null);
      return response ? response.data : null;
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch service');
      return null;
    }
  }, [executeFetchServiceById, toastError]);

  // 10. Define fetchBillableServices function to retrieve services ready for billing
  const fetchBillableServices = useCallback(async () => {
    setLoading(LoadingState.LOADING);
    setError(null);

    try {
      const response = await executeFetchServices({ url: API_ENDPOINTS.SERVICES.BILLABLE, params: filterParams });

      if (response) {
        setServices(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
        setLoading(LoadingState.SUCCESS);
      } else {
        setLoading(LoadingState.ERROR);
        setError('Failed to fetch billable services');
      }
    } catch (err: any) {
      setLoading(LoadingState.ERROR);
      setError(err.message || 'Failed to fetch billable services');
      toastError(err.message || 'Failed to fetch billable services');
    }
  }, [executeFetchServices, filterParams, toastError]);

  // 11. Define fetchServicesByClientId function to retrieve services for a specific client
  const fetchServicesByClientId = useCallback(async (clientId: UUID) => {
    setLoading(LoadingState.LOADING);
    setError(null);

    try {
      const response = await executeFetchServices({ url: `${API_ENDPOINTS.SERVICES.BASE}/client/${clientId}`, params: filterParams });

      if (response) {
        setServices(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
        setLoading(LoadingState.SUCCESS);
      } else {
        setLoading(LoadingState.ERROR);
        setError('Failed to fetch services by client ID');
      }
    } catch (err: any) {
      setLoading(LoadingState.ERROR);
      setError(err.message || 'Failed to fetch services by client ID');
      toastError(err.message || 'Failed to fetch services by client ID');
    }
  }, [executeFetchServices, filterParams, toastError]);

  // 12. Define fetchServicesByProgramId function to retrieve services for a specific program
  const fetchServicesByProgramId = useCallback(async (programId: UUID) => {
    setLoading(LoadingState.LOADING);
    setError(null);

    try {
      const response = await executeFetchServices({ url: `${API_ENDPOINTS.SERVICES.BASE}/program/${programId}`, params: filterParams });

      if (response) {
        setServices(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
        setLoading(LoadingState.SUCCESS);
      } else {
        setLoading(LoadingState.ERROR);
        setError('Failed to fetch services by program ID');
      }
    } catch (err: any) {
      setLoading(LoadingState.ERROR);
      setError(err.message || 'Failed to fetch services by program ID');
      toastError(err.message || 'Failed to fetch services by program ID');
    }
  }, [executeFetchServices, filterParams, toastError]);

  // 13. Define createService function to create a new service
  const createService = useCallback(async (data: CreateServiceDto) => {
    try {
      const response = await executeCreateService({ data });
      if (response) {
        success('Service created successfully');
        return response.data;
      } else {
        toastError('Failed to create service');
        return null;
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create service');
      return null;
    }
  }, [executeCreateService, success, toastError]);

  // 14. Define updateService function to update an existing service
  const updateService = useCallback(async (id: UUID, data: UpdateServiceDto) => {
    try {
      const response = await executeUpdateService({ url: `${API_ENDPOINTS.SERVICES.BASE}/${id}`, data, method: 'PUT' });
      if (response) {
        success('Service updated successfully');
        return response.data;
      } else {
        toastError('Failed to update service');
        return null;
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update service');
      return null;
    }
  }, [executeUpdateService, success, toastError]);

  // 15. Define deleteService function to delete a service
  const deleteService = useCallback(async (id: UUID) => {
    try {
      const response = await executeDeleteService({ url: `${API_ENDPOINTS.SERVICES.BASE}/${id}` });
      if (response && response.data.success) {
        success('Service deleted successfully');
        return true;
      } else {
        toastError('Failed to delete service');
        return false;
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete service');
      return false;
    }
  }, [executeDeleteService, success, toastError]);

  // 16. Define validateServices function to validate services for billing
  const validateServices = useCallback(async (serviceIds: UUID[]) => {
    try {
      const data: ServiceValidationRequest = { serviceIds };
      const response = await executeValidateServices({ data });
      setValidationResults(response ? response.data : null);
      return response ? response.data : null;
    } catch (err: any) {
      toastError(err.message || 'Failed to validate services');
      return null;
    }
  }, [executeValidateServices, toastError]);

  // 17. Define updateServiceBillingStatus function to update the billing status of a service
  const updateServiceBillingStatus = useCallback(async (id: UUID, data: UpdateServiceBillingStatusDto) => {
    try {
      const response = await executeUpdateServiceBillingStatus({ url: `${API_ENDPOINTS.SERVICES.BASE}/${id}/billing-status`, data, method: 'PUT' });
      if (response) {
        success('Billing status updated successfully');
        return response.data;
      } else {
        toastError('Failed to update billing status');
        return null;
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update billing status');
      return null;
    }
  }, [executeUpdateServiceBillingStatus, success, toastError]);

  // 18. Define updateServiceDocumentationStatus function to update the documentation status of a service
  const updateServiceDocumentationStatus = useCallback(async (id: UUID, data: UpdateServiceDocumentationStatusDto) => {
    try {
      const response = await executeUpdateServiceDocumentationStatus({ url: `${API_ENDPOINTS.SERVICES.BASE}/${id}/documentation-status`, data, method: 'PUT' });
      if (response) {
        success('Documentation status updated successfully');
        return response.data;
      } else {
        toastError('Failed to update documentation status');
        return null;
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update documentation status');
      return null;
    }
  }, [executeUpdateServiceDocumentationStatus, success, toastError]);

  // 19. Define bulkUpdateBillingStatus function to update billing status for multiple services
  const bulkUpdateBillingStatus = useCallback(async (serviceIds: UUID[], data: UpdateServiceBillingStatusDto) => {
    try {
      const response = await executeBulkUpdateBillingStatus({ url: `${API_ENDPOINTS.SERVICES.BASE}/bulk-update-billing-status`, data: { serviceIds, ...data }, method: 'POST' });
      if (response) {
        success(`${response.data.count} services updated successfully`);
        return response.data;
      } else {
        toastError('Failed to update billing status for selected services');
        return null;
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update billing status for selected services');
      return null;
    }
  }, [executeBulkUpdateBillingStatus, success, toastError]);

    // 20. Define fetchServiceMetrics function to retrieve service metrics and statistics
    const fetchServiceMetrics = useCallback(async () => {
        try {
            const response = await executeFetchServiceMetrics({});
            setServiceMetrics(response ? response.data : null);
            return response ? response.data : null;
        } catch (err: any) {
            toastError(err.message || 'Failed to fetch service metrics');
            return null;
        }
    }, [executeFetchServiceMetrics, toastError]);

  // 21. Use useEffect to fetch services when filters, pagination, or sort changes
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchServices();
    }
  }, [fetchServices, options.autoFetch]);

  // 22. Return services state and operations
  return {
    services,
    selectedService,
    loading,
    error,
    filterState: filters,
    paginationState: {
      page,
      pageSize,
      handlePageChange,
      handlePageSizeChange,
      resetPagination,
    },
    sortState: {
      sort,
      setSort,
      toggleSort,
      clearSort,
      getSortParams,
    },
    fetchServices,
    fetchServiceById,
    fetchBillableServices,
    fetchServicesByClientId,
    fetchServicesByProgramId,
    createService,
    updateService,
    deleteService,
    validateServices,
    updateServiceBillingStatus,
    updateServiceDocumentationStatus,
    bulkUpdateBillingStatus,
    fetchServiceMetrics,
    serviceMetrics,
    validationResults,
    totalItems,
    totalPages,
    isCreating,
    isUpdating,
    isDeleting,
    isValidating,
    isUpdatingBillingStatus,
    isUpdatingDocumentationStatus,
    isBulkUpdating,
    isFetchingMetrics
  };
};

export default useServices;

/**
 * Interface for options passed to useServices hook
 */
export interface UseServicesOptions {
  /**
   * Initial filters for services
   */
  initialFilters?: Partial<ServiceQueryParams>;
  /**
   * Initial sort parameters
   */
  initialSort?: SortParams[];
  /**
   * Initial page number
   */
  initialPage?: number;
  /**
   * Initial page size
   */
  initialPageSize?: number;
  /**
   * Whether to synchronize with URL
   */
  syncWithUrl?: boolean;
  /**
   * Whether to automatically fetch services
   */
  autoFetch?: boolean;
    /**
   * Client ID to filter services by
   */
  clientId?: UUID | undefined;
  /**
   * Program ID to filter services by
   */
  programId?: UUID | undefined;
}

/**
 * Interface for the result returned by useServices hook
 */
export interface UseServicesResult {
  /**
   * List of services
   */
  services: ServiceSummary[];
  /**
   * Selected service
   */
  selectedService: ServiceWithRelations | null;
  /**
   * Loading state
   */
  loading: LoadingState;
  /**
   * Error message
   */
  error: string | null;
    /**
   * Filter state
   */
  filterState: any; // TODO: Replace 'any' with FilterState type
  /**
   * Pagination state
   */
  paginationState: any; // TODO: Replace 'any' with PaginationState type
  /**
   * Sort state
   */
  sortState: any; // TODO: Replace 'any' with SortState type
  /**
   * Function to fetch services
   */
  fetchServices: () => Promise<void>;
  /**
   * Function to fetch a service by ID
   */
  fetchServiceById: (id: UUID) => Promise<ServiceWithRelations | null>;
  /**
   * Function to fetch billable services
   */
  fetchBillableServices: () => Promise<void>;
    /**
   * Function to fetch services by client ID
   */
  fetchServicesByClientId: (clientId: UUID) => Promise<void>;
  /**
   * Function to fetch services by program ID
   */
  fetchServicesByProgramId: (programId: UUID) => Promise<void>;
  /**
   * Function to create a new service
   */
  createService: (data: CreateServiceDto) => Promise<Service | null>;
  /**
   * Function to update an existing service
   */
  updateService: (id: UUID, data: UpdateServiceDto) => Promise<Service | null>;
  /**
   * Function to delete a service
   */
  deleteService: (id: UUID) => Promise<boolean>;
  /**
   * Function to validate services
   */
  validateServices: (serviceIds: UUID[]) => Promise<ServiceValidationResponse | null>;
  /**
   * Function to update the billing status of a service
   */
  updateServiceBillingStatus: (id: UUID, data: UpdateServiceBillingStatusDto) => Promise<Service | null>;
  /**
   * Function to update the documentation status of a service
   */
  updateServiceDocumentationStatus: (id: UUID, data: UpdateServiceDocumentationStatusDto) => Promise<Service | null>;
  /**
   * Function to bulk update billing status for multiple services
   */
  bulkUpdateBillingStatus: (serviceIds: UUID[], data: UpdateServiceBillingStatusDto) => Promise<{ count: number } | null>;
    /**
   * Function to fetch service metrics
   */
  fetchServiceMetrics: () => Promise<ServiceMetrics | null>;
  /**
   * Service metrics data
   */
  serviceMetrics: ServiceMetrics | null;
  /**
   * Validation results
   */
  validationResults: ServiceValidationResponse | null;
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Loading state for create service operation
   */
  isCreating: boolean;
  /**
   * Loading state for update service operation
   */
  isUpdating: boolean;
  /**
   * Loading state for delete service operation
   */
  isDeleting: boolean;
  /**
   * Loading state for validate service operation
   */
  isValidating: boolean;
  /**
   * Loading state for update billing status operation
   */
  isUpdatingBillingStatus: boolean;
  /**
   * Loading state for update documentation status operation
   */
  isUpdatingDocumentationStatus: boolean;
  /**
   * Loading state for bulk update operation
   */
  isBulkUpdating: boolean;
    /**
   * Loading state for fetching service metrics
   */
  isFetchingMetrics: boolean;
}