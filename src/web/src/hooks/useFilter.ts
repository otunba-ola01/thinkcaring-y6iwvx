import { useState, useCallback, useEffect, useMemo } from 'react'; // v18.2.0
import { FilterParams, FilterOperator } from '../types/common.types';
import { FilterConfig, FilterType } from '../types/ui.types';
import useQueryParams from './useQueryParams';

/**
 * Interface for options passed to useFilter hook
 */
export interface UseFilterOptions {
  /**
   * Configuration for each filter field
   */
  filterConfigs: FilterConfig[];
  
  /**
   * Initial filter values
   */
  initialFilters?: Record<string, any>;
  
  /**
   * Callback function when filters are applied
   */
  onFilterChange?: (filterParams: FilterParams[]) => void;
  
  /**
   * Whether to synchronize filters with URL parameters
   */
  syncWithUrl?: boolean;
}

/**
 * Interface for the return value of useFilter hook
 */
export interface UseFilterReturn {
  /**
   * Current filter state
   */
  filters: Record<string, any>;
  
  /**
   * Formatted filter parameters for API requests
   */
  filterParams: FilterParams[];
  
  /**
   * Set a specific filter value
   */
  setFilter: (key: string, value: any) => void;
  
  /**
   * Clear a specific filter
   */
  clearFilter: (key: string) => void;
  
  /**
   * Clear all filters
   */
  clearAllFilters: () => void;
  
  /**
   * Apply filters and trigger onFilterChange callback
   */
  applyFilters: () => void;
  
  /**
   * Reset filters to initialFilters
   */
  resetFilters: () => void;
}

/**
 * A custom hook that provides functionality for managing filter state in the 
 * HCBS Revenue Management System. This hook handles filter operations such as 
 * setting, clearing, and applying filters, with optional URL synchronization for 
 * shareable filter states.
 * 
 * @param options - Configuration options for the filter hook
 * @returns Object containing filter state and operations
 * 
 * @example
 * ```tsx
 * const { 
 *   filters, 
 *   filterParams, 
 *   setFilter, 
 *   clearFilter, 
 *   applyFilters 
 * } = useFilter({
 *   filterConfigs,
 *   initialFilters,
 *   onFilterChange: handleFilterChange,
 *   syncWithUrl: true
 * });
 * ```
 */
const useFilter = (options: UseFilterOptions): UseFilterReturn => {
  const { filterConfigs, initialFilters = {}, onFilterChange, syncWithUrl = false } = options;
  
  // Initialize filter state
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  
  // Initialize filter parameters state
  const [filterParams, setFilterParams] = useState<FilterParams[]>([]);
  
  // Get query params functionality if syncWithUrl is true
  const { query, setQueryParams, clearQueryParams } = useQueryParams();
  
  // Synchronize filter state with URL parameters on initial load if syncWithUrl is true
  useEffect(() => {
    if (syncWithUrl && Object.keys(query).length > 0) {
      // Extract filter values from query
      const queryFilters: Record<string, any> = {};
      
      filterConfigs.forEach(config => {
        if (query[config.id] !== undefined) {
          queryFilters[config.id] = query[config.id];
        }
      });
      
      if (Object.keys(queryFilters).length > 0) {
        setFilters(prev => ({ ...prev, ...queryFilters }));
      }
    }
  }, [syncWithUrl, query, filterConfigs]);
  
  // Function to set a single filter value
  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Function to clear a specific filter
  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  // Function to clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
    if (syncWithUrl) {
      clearQueryParams();
    }
  }, [syncWithUrl, clearQueryParams]);
  
  // Function to convert filter state to FilterParams array and trigger callback
  const applyFilters = useCallback(() => {
    // Convert filters to FilterParams
    const params = convertFiltersToParams(filters, filterConfigs);
    setFilterParams(params);
    
    // Call the onFilterChange callback with the params
    if (onFilterChange) {
      onFilterChange(params);
    }
    
    // Update URL if syncWithUrl is true
    if (syncWithUrl) {
      // Only include non-empty filters
      const queryParams = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      setQueryParams(queryParams);
    }
  }, [filters, filterConfigs, onFilterChange, syncWithUrl, setQueryParams]);
  
  // Function to reset filters to initialFilters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    if (syncWithUrl) {
      // Update URL with initial filters
      setQueryParams(initialFilters);
    }
  }, [initialFilters, syncWithUrl, setQueryParams]);
  
  // Update filterParams when filters change
  useEffect(() => {
    const params = convertFiltersToParams(filters, filterConfigs);
    setFilterParams(params);
  }, [filters, filterConfigs]);
  
  // Sync with URL if syncWithUrl is true
  useEffect(() => {
    if (syncWithUrl) {
      // Only include non-empty filters
      const queryParams = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      setQueryParams(queryParams, { replace: true });
    }
  }, [filters, syncWithUrl, setQueryParams]);
  
  return {
    filters,
    filterParams,
    setFilter,
    clearFilter,
    clearAllFilters,
    applyFilters,
    resetFilters
  };
};

/**
 * Converts filter state object to an array of FilterParams objects
 * 
 * @param filters - Current filter state
 * @param filterConfigs - Filter configuration definitions
 * @returns Array of filter parameters ready for API requests
 */
function convertFiltersToParams(
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): FilterParams[] {
  const params: FilterParams[] = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    // Skip empty or null values
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Find the filter config
    const config = filterConfigs.find(c => c.id === key);
    if (!config) return;
    
    // Determine the operator based on filter type
    const operator = config.operator || getOperatorForFilterType(config.type);
    
    // Format value based on filter type
    let formattedValue = value;
    
    // Handle specific filter types
    if (config.type === FilterType.DATE_RANGE && value.startDate && value.endDate) {
      // Date range filters use the BETWEEN operator and array of [startDate, endDate]
      formattedValue = [value.startDate, value.endDate];
    } else if (config.type === FilterType.MULTI_SELECT && Array.isArray(value)) {
      // Multi-select filters use the IN operator and array of selected values
      formattedValue = value;
    }
    
    // Add the filter parameter
    params.push({
      field: config.field,
      operator,
      value: formattedValue
    });
  });
  
  return params;
}

/**
 * Determines the appropriate FilterOperator based on FilterType
 * 
 * @param filterType - Type of filter
 * @returns The appropriate operator for the filter type
 */
function getOperatorForFilterType(filterType: FilterType): FilterOperator {
  switch (filterType) {
    case FilterType.TEXT:
      return FilterOperator.CONTAINS;
    case FilterType.SELECT:
      return FilterOperator.EQUALS;
    case FilterType.MULTI_SELECT:
      return FilterOperator.IN;
    case FilterType.BOOLEAN:
      return FilterOperator.EQUALS;
    case FilterType.DATE:
      return FilterOperator.EQUALS;
    case FilterType.DATE_RANGE:
      return FilterOperator.BETWEEN;
    case FilterType.NUMBER:
    default:
      return FilterOperator.EQUALS;
  }
}

export default useFilter;