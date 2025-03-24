import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+
import { RootState } from '../index'; // Import RootState type for type-safe selectors
import { BillingStatus, DocumentationStatus } from '../../types/services.types'; // Import service status enums for filtering services by status
import { ServiceMetrics, ServiceQueryParams, ServiceSummary, ServiceValidationResponse, ServiceWithRelations } from '../../types/services.types';

/**
 * Base selector that returns the entire services slice from the Redux store
 * @param state 
 * @returns The complete services state
 */
export const selectServicesState = (state: RootState) => state.services;

/**
 * Selector for the list of services
 * @param state 
 * @returns Array of service summaries
 */
export const selectServices = (state: RootState) => state.services.services;

/**
 * Selector for the currently selected service
 * @param state 
 * @returns The selected service with its related entities or null if none selected
 */
export const selectSelectedService = (state: RootState) => state.services.selectedService;

/**
 * Selector for services pagination metadata
 * @param state 
 * @returns Pagination metadata for services
 */
export const selectServicesPagination = (state: RootState) => state.services.pagination;

/**
 * Selector for services loading state
 * @param state 
 * @returns Current loading state for services operations
 */
export const selectServicesLoading = (state: RootState) => state.services.loading;

/**
 * Selector for services error state
 * @param state 
 * @returns Error message or null if no error
 */
export const selectServicesError = (state: RootState) => state.services.error;

/**
 * Selector for services filter criteria
 * @param state 
 * @returns Current filter parameters for services
 */
export const selectServicesFilters = (state: RootState) => state.services.filters;

/**
 * Selector for service metrics data
 * @param state 
 * @returns Service metrics data or null if not loaded
 */
export const selectServiceMetrics = (state: RootState) => state.services.metrics;

/**
 * Selector for service validation results
 * @param state 
 * @returns Validation results or null if not available
 */
export const selectValidationResults = (state: RootState) => state.services.validationResults;

/**
 * Memoized selector that filters services by billing status
 * @param state 
 * @param status 
 * @returns Services filtered by the specified billing status
 */
export const selectServicesByBillingStatus = createSelector(
  [selectServices, (_, status: BillingStatus) => status],
  (services, status) =>
    services.filter(service => service.billingStatus === status)
);

/**
 * Memoized selector that filters services by documentation status
 * @param state 
 * @param status 
 * @returns Services filtered by the specified documentation status
 */
export const selectServicesByDocumentationStatus = createSelector(
  [selectServices, (_, status: DocumentationStatus) => status],
  (services, status) =>
    services.filter(service => service.documentationStatus === status)
);

/**
 * Memoized selector that counts services by billing status
 * @param state 
 * @returns Object with counts of services by billing status
 */
export const selectBillingStatusCounts = createSelector(
  [selectServices],
  (services) => {
    const counts: Record<BillingStatus, number> = {
      [BillingStatus.UNBILLED]: 0,
      [BillingStatus.READY_FOR_BILLING]: 0,
      [BillingStatus.IN_CLAIM]: 0,
      [BillingStatus.BILLED]: 0,
      [BillingStatus.PAID]: 0,
      [BillingStatus.DENIED]: 0,
      [BillingStatus.VOID]: 0,
    };

    services.forEach(service => {
      counts[service.billingStatus]++;
    });

    return counts;
  }
);

/**
 * Memoized selector that counts services by documentation status
 * @param state 
 * @returns Object with counts of services by documentation status
 */
export const selectDocumentationStatusCounts = createSelector(
  [selectServices],
  (services) => {
    const counts: Record<DocumentationStatus, number> = {
      [DocumentationStatus.INCOMPLETE]: 0,
      [DocumentationStatus.COMPLETE]: 0,
      [DocumentationStatus.REJECTED]: 0,
      [DocumentationStatus.PENDING_REVIEW]: 0,
    };

    services.forEach(service => {
      counts[service.documentationStatus]++;
    });

    return counts;
  }
);

/**
 * Memoized selector that calculates the total amount of all services
 * @param state 
 * @returns Sum of all service amounts
 */
export const selectTotalServicesAmount = createSelector(
  [selectServices],
  (services) => services.reduce((total, service) => total + service.amount, 0)
);

/**
 * Memoized selector that calculates the total amount of unbilled services
 * @param state 
 * @returns Sum of unbilled service amounts
 */
export const selectUnbilledServicesAmount = createSelector(
  [selectServices],
  (services) => services.filter(service => service.billingStatus === BillingStatus.UNBILLED).reduce((total, service) => total + service.amount, 0)
);

/**
 * Memoized selector that determines if services are currently loading
 * @param state 
 * @returns True if services are loading, false otherwise
 */
export const selectIsServicesLoading = createSelector(
  [selectServicesLoading],
  (loading) => loading
);

/**
 * Memoized selector that determines if there is a services error
 * @param state 
 * @returns True if there is an error, false otherwise
 */
export const selectHasServicesError = createSelector(
  [selectServicesError],
  (error) => error !== null
);

/**
 * Memoized selector that finds a service by ID in the services list
 * @param state 
 * @param serviceId 
 * @returns The service with the specified ID or undefined if not found
 */
export const selectServiceById = createSelector(
  [selectServices, (_, serviceId: string) => serviceId],
  (services, serviceId) => services.find(service => service.id === serviceId)
);

/**
 * Memoized selector that filters services by program ID
 * @param state 
 * @param programId 
 * @returns Services filtered by the specified program ID
 */
export const selectServicesByProgramId = createSelector(
  [selectServices, (_, programId: string) => programId],
  (services, programId) => services.filter(service => service.programId === programId)
);

/**
 * Memoized selector that filters services by client ID
 * @param state 
 * @param clientId 
 * @returns Services filtered by the specified client ID
 */
export const selectServicesByClientId = createSelector(
  [selectServices, (_, clientId: string) => clientId],
  (services, clientId) => services.filter(service => service.clientId === clientId)
);