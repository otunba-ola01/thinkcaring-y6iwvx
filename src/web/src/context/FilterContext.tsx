import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FilterParams, FilterOperator } from '../types/common.types';
import { FilterConfig, FilterType } from '../types/ui.types';
import useFilter from '../hooks/useFilter';
import useQueryParams from '../hooks/useQueryParams';

/**
 * Interface defining the shape of the filter context
 */
export interface FilterContextType {
  // State
  filterConfigs: Record<string, FilterConfig[]>;
  globalFilters: Record<string, any>;
  
  // Operations
  registerFilterConfig: (key: string, config: FilterConfig[]) => void;
  unregisterFilterConfig: (key: string) => void;
  setGlobalFilter: (key: string, value: any) => void;
  clearGlobalFilter: (key: string) => void;
  clearAllGlobalFilters: () => void;
}

/**
 * Interface for props accepted by the FilterProvider component
 */
export interface FilterProviderProps {
  children: ReactNode;
  syncWithUrl?: boolean;
}

/**
 * React context for filter state and operations
 */
export const FilterContext = createContext<FilterContextType | undefined>(undefined);

/**
 * Provider component for the filter context
 * 
 * Manages filter configurations and global filter state across the application.
 * Optionally synchronizes filter state with URL parameters for shareable filter states.
 * 
 * @param props - Component props
 * @param props.children - Child components
 * @param props.syncWithUrl - Whether to synchronize filters with URL parameters (default: false)
 */
export const FilterProvider: React.FC<FilterProviderProps> = ({ 
  children, 
  syncWithUrl = false 
}) => {
  // Initialize state for filter configurations
  const [filterConfigs, setFilterConfigs] = useState<Record<string, FilterConfig[]>>({});
  
  // Initialize state for global filters
  const [globalFilters, setGlobalFilters] = useState<Record<string, any>>({});
  
  // Get query params functionality from useQueryParams hook
  const { query, setQueryParams, clearQueryParams } = useQueryParams();
  
  // Effect to initialize global filters from URL if syncWithUrl is enabled
  React.useEffect(() => {
    if (syncWithUrl && Object.keys(query).length > 0) {
      // Extract filter values that match known filter configurations
      const urlFilters: Record<string, any> = {};
      
      Object.entries(query).forEach(([key, value]) => {
        // Only include query params that might be filters
        if (typeof key === 'string' && value !== undefined) {
          urlFilters[key] = value;
        }
      });
      
      if (Object.keys(urlFilters).length > 0) {
        setGlobalFilters(prev => ({ ...prev, ...urlFilters }));
      }
    }
  }, [syncWithUrl, query]);
  
  /**
   * Register filter configuration for a specific key
   * 
   * @param key - Unique key to identify the filter configuration
   * @param config - Array of filter configurations
   */
  const registerFilterConfig = useCallback((key: string, config: FilterConfig[]) => {
    setFilterConfigs(prev => ({
      ...prev,
      [key]: config
    }));
  }, []);
  
  /**
   * Unregister filter configuration for a specific key
   * 
   * @param key - Key of the filter configuration to remove
   */
  const unregisterFilterConfig = useCallback((key: string) => {
    setFilterConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[key];
      return newConfigs;
    });
  }, []);
  
  /**
   * Set a global filter value
   * 
   * @param key - Filter key
   * @param value - Filter value
   */
  const setGlobalFilter = useCallback((key: string, value: any) => {
    setGlobalFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Sync with URL if enabled
    if (syncWithUrl) {
      setQueryParams({ [key]: value });
    }
  }, [syncWithUrl, setQueryParams]);
  
  /**
   * Clear a specific global filter
   * 
   * @param key - Key of the filter to clear
   */
  const clearGlobalFilter = useCallback((key: string) => {
    setGlobalFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    
    // Remove from URL if sync is enabled
    if (syncWithUrl) {
      setQueryParams({ [key]: undefined });
    }
  }, [syncWithUrl, setQueryParams]);
  
  /**
   * Clear all global filters
   */
  const clearAllGlobalFilters = useCallback(() => {
    setGlobalFilters({});
    
    // Clear URL params if sync is enabled
    if (syncWithUrl) {
      clearQueryParams();
    }
  }, [syncWithUrl, clearQueryParams]);
  
  // Create context value object with all filter state and functions
  const contextValue: FilterContextType = {
    filterConfigs,
    globalFilters,
    registerFilterConfig,
    unregisterFilterConfig,
    setGlobalFilter,
    clearGlobalFilter,
    clearAllGlobalFilters
  };
  
  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Custom hook to access the filter context
 * 
 * @returns The filter context value
 * @throws Error if used outside of FilterProvider
 */
export const useFilterContext = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};