import { createAsyncThunk } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import {
  servicesActions
} from './servicesSlice';
import { selectServicesFilters } from './servicesSelectors';
import { AppThunk, RootState } from '../index';
import {
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
  uploadServiceDocumentation,
  importServices
} from '../../api/services.api';
import {
  ServiceQueryParams,
  CreateServiceDto,
  UpdateServiceDto,
  UpdateServiceBillingStatusDto,
  UpdateServiceDocumentationStatusDto,
  ServiceValidationRequest
} from '../../types/services.types';
import { UUID } from '../../types/common.types';

/**
 * Thunk action to fetch services with optional filtering and pagination
 * @param params - ServiceQueryParams | undefined: params
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const fetchServicesThunk = (params?: ServiceQueryParams): AppThunk => {
  return async (dispatch, getState) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    // Get current filters from state if params not provided
    const filters = params || selectServicesFilters(getState() as RootState);

    try {
      // Call fetchServices API with filters
      const response = await fetchServices(filters);

      // If successful, dispatch actions to update services and pagination
      dispatch(servicesActions.setServices(response.data.items));
      dispatch(servicesActions.setPagination({
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalItems: response.data.totalItems,
        totalPages: response.data.totalPages
      }));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to fetch a single service by ID
 * @param serviceId - UUID: serviceId
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const fetchServiceByIdThunk = (serviceId: UUID): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call fetchServiceById API with the service ID
      const response = await fetchServiceById(serviceId);

      // If successful, dispatch action to update selected service
      dispatch(servicesActions.setSelectedService(response.data));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to fetch services that are ready for billing
 * @param params - ServiceQueryParams | undefined: params
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const fetchBillableServicesThunk = (params?: ServiceQueryParams): AppThunk => {
  return async (dispatch, getState) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    // Get current filters from state if params not provided
    const filters = params || selectServicesFilters(getState() as RootState);

    try {
      // Call fetchBillableServices API with filters
      const response = await fetchBillableServices(filters);

      // If successful, dispatch actions to update services and pagination
      dispatch(servicesActions.setServices(response.data.items));
      dispatch(servicesActions.setPagination({
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalItems: response.data.totalItems,
        totalPages: response.data.totalPages
      }));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to fetch services for a specific client
 * @param clientId - UUID: clientId
 * @param params - ServiceQueryParams | undefined: params
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const fetchServicesByClientIdThunk = (clientId: UUID, params?: ServiceQueryParams): AppThunk => {
  return async (dispatch, getState) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    // Get current filters from state if params not provided
    const filters = params || selectServicesFilters(getState() as RootState);

    try {
      // Call fetchServicesByClientId API with client ID and filters
      const response = await fetchServicesByClientId(clientId, filters);

      // If successful, dispatch actions to update services and pagination
      dispatch(servicesActions.setServices(response.data.items));
      dispatch(servicesActions.setPagination({
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalItems: response.data.totalItems,
        totalPages: response.data.totalPages
      }));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to fetch services for a specific program
 * @param programId - UUID: programId
 * @param params - ServiceQueryParams | undefined: params
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const fetchServicesByProgramIdThunk = (programId: UUID, params?: ServiceQueryParams): AppThunk => {
  return async (dispatch, getState) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    // Get current filters from state if params not provided
    const filters = params || selectServicesFilters(getState() as RootState);

    try {
      // Call fetchServicesByProgramId API with program ID and filters
      const response = await fetchServicesByProgramId(programId, filters);

      // If successful, dispatch actions to update services and pagination
      dispatch(servicesActions.setServices(response.data.items));
      dispatch(servicesActions.setPagination({
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalItems: response.data.totalItems,
        totalPages: response.data.totalPages
      }));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to create a new service
 * @param serviceData - CreateServiceDto: serviceData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const createServiceThunk = (serviceData: CreateServiceDto): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call createService API with service data
      const response = await createService(serviceData);

      // If successful, refresh services list by dispatching fetchServicesThunk
      dispatch(fetchServicesThunk());
      dispatch(servicesActions.setSelectedService(response.data));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to update an existing service
 * @param serviceId - UUID: serviceId
 * @param serviceData - UpdateServiceDto: serviceData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const updateServiceThunk = (serviceId: UUID, serviceData: UpdateServiceDto): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call updateService API with service ID and updated data
      await updateService(serviceId, serviceData);

      // If successful, refresh the service details by dispatching fetchServiceByIdThunk
      dispatch(fetchServiceByIdThunk(serviceId));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to delete a service
 * @param serviceId - UUID: serviceId
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const deleteServiceThunk = (serviceId: UUID): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call deleteService API with service ID
      await deleteService(serviceId);

      // If successful, refresh services list by dispatching fetchServicesThunk
      dispatch(fetchServicesThunk());
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to validate services for billing eligibility
 * @param validationRequest - ServiceValidationRequest: validationRequest
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const validateServicesThunk = (validationRequest: ServiceValidationRequest): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call validateServices API with service IDs to validate
      const response = await validateServices(validationRequest);

      // If successful, dispatch action to update validation results
      dispatch(servicesActions.setValidationResults(response.data));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to update the billing status of a service
 * @param serviceId - UUID: serviceId
 * @param statusData - UpdateServiceBillingStatusDto: statusData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const updateServiceBillingStatusThunk = (serviceId: UUID, statusData: UpdateServiceBillingStatusDto): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call updateServiceBillingStatus API with service ID and status data
      await updateServiceBillingStatus(serviceId, statusData);

      // If successful, refresh the service details by dispatching fetchServiceByIdThunk
      dispatch(fetchServiceByIdThunk(serviceId));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to update the documentation status of a service
 * @param serviceId - UUID: serviceId
 * @param statusData - UpdateServiceDocumentationStatusDto: statusData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const updateServiceDocumentationStatusThunk = (serviceId: UUID, statusData: UpdateServiceDocumentationStatusDto): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call updateServiceDocumentationStatus API with service ID and status data
      await updateServiceDocumentationStatus(serviceId, statusData);

      // If successful, refresh the service details by dispatching fetchServiceByIdThunk
      dispatch(fetchServiceByIdThunk(serviceId));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to update the billing status of multiple services
 * @param serviceIds - UUID[]: serviceIds
 * @param statusData - UpdateServiceBillingStatusDto: statusData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const bulkUpdateBillingStatusThunk = (serviceIds: UUID[], statusData: UpdateServiceBillingStatusDto): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call bulkUpdateBillingStatus API with service IDs and status data
      await bulkUpdateBillingStatus(serviceIds, statusData);

      // If successful, refresh services list by dispatching fetchServicesThunk
      dispatch(fetchServicesThunk());
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to fetch service metrics and statistics
 * @param  - 
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const fetchServiceMetricsThunk = (): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call fetchServiceMetrics API
      const response = await fetchServiceMetrics();

      // If successful, dispatch action to update service metrics
      dispatch(servicesActions.setMetrics(response.data));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to upload documentation for a service
 * @param serviceId - UUID: serviceId
 * @param formData - FormData: formData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const uploadServiceDocumentationThunk = (serviceId: UUID, formData: FormData): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call uploadServiceDocumentation API with service ID and form data
      await uploadServiceDocumentation(serviceId, formData);

      // If successful, refresh the service details by dispatching fetchServiceByIdThunk
      dispatch(fetchServiceByIdThunk(serviceId));
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to import services from an external file
 * @param formData - FormData: formData
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const importServicesThunk = (formData: FormData): AppThunk => {
  return async (dispatch) => {
    // Set loading state to true
    dispatch(servicesActions.setLoading(true));

    try {
      // Call importServices API with form data
      await importServices(formData);

      // If successful, refresh services list by dispatching fetchServicesThunk
      dispatch(fetchServicesThunk());
    } catch (error: any) {
      // If error occurs, dispatch error action
      dispatch(servicesActions.setError(error.message));
    } finally {
      // Set loading state to false regardless of outcome
      dispatch(servicesActions.setLoading(false));
    }
  };
};

/**
 * Thunk action to update service filters and reload services
 * @param filters - Partial<ServiceQueryParams>: filters
 * @returns AppThunk: Thunk action that can be dispatched
 */
export const setFiltersThunk = (filters: Partial<ServiceQueryParams>): AppThunk => {
  return async (dispatch) => {
    // Dispatch action to update filters with the provided values
    dispatch(servicesActions.setFilters(filters));

    // Dispatch fetchServicesThunk to reload services with the new filters
    dispatch(fetchServicesThunk());
  };
};