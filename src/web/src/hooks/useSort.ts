import { useState, useCallback, useEffect, useMemo } from 'react'; // React v18.2.0
import { SortDirection, SortParams } from '../types/common.types';
import useQueryParams from './useQueryParams';

/**
 * Interface for options passed to useSort hook
 */
export interface UseSortOptions {
  /**
   * Initial sort parameters
   */
  initialSort?: SortParams[];
  
  /**
   * Callback function called when sort parameters change
   */
  onSortChange?: (sortParams: SortParams[]) => void;
  
  /**
   * Whether to sync sort parameters with URL query parameters
   */
  syncWithUrl?: boolean;
  
  /**
   * Whether to allow sorting by multiple fields
   */
  multiSort?: boolean;
}

/**
 * Interface for the sort state and operations returned by useSort
 */
export interface SortState {
  /**
   * Current sort parameters
   */
  sort: SortParams[];
  
  /**
   * Set sort parameters directly
   */
  setSort: (sortParams: SortParams[]) => void;
  
  /**
   * Toggle sort direction for a field or add new sort parameter
   */
  toggleSort: (field: string) => void;
  
  /**
   * Clear all sort parameters
   */
  clearSort: () => void;
  
  /**
   * Get current sort parameters for API requests
   */
  getSortParams: () => SortParams[];
  
  /**
   * Get current sort direction for a field
   */
  getSortDirection: (field: string) => SortDirection | null;
}

/**
 * Toggles the sort direction between ASC and DESC
 * 
 * @param currentDirection - Current sort direction
 * @returns The toggled sort direction
 */
function toggleSortDirection(currentDirection: SortDirection): SortDirection {
  return currentDirection === SortDirection.ASC 
    ? SortDirection.DESC 
    : SortDirection.ASC;
}

/**
 * Parses sort parameters from URL query string
 * 
 * @param queryParams - Query parameters object
 * @returns Array of sort parameters parsed from URL
 */
function parseSortFromUrl(queryParams: Record<string, any>): SortParams[] {
  // Extract sort field and direction from query parameters
  if (!queryParams.sort) {
    return [];
  }
  
  // Handle single sort parameter
  if (typeof queryParams.sort === 'string') {
    const [field, direction] = queryParams.sort.split(':');
    if (!field) return [];
    
    return [{
      field,
      direction: (direction === SortDirection.DESC) 
        ? SortDirection.DESC 
        : SortDirection.ASC
    }];
  }
  
  // Handle multiple sort parameters
  if (Array.isArray(queryParams.sort)) {
    return queryParams.sort
      .map(sortParam => {
        if (typeof sortParam !== 'string') return null;
        
        const [field, direction] = sortParam.split(':');
        if (!field) return null;
        
        return {
          field,
          direction: (direction === SortDirection.DESC) 
            ? SortDirection.DESC 
            : SortDirection.ASC
        };
      })
      .filter(Boolean) as SortParams[];
  }
  
  return [];
}

/**
 * A custom hook that provides sorting functionality for data tables and lists
 * throughout the HCBS Revenue Management System. This hook enables components
 * to sort data consistently across the application with support for single or
 * multi-column sorting, URL synchronization, and external change notifications.
 * 
 * @param options - Configuration options for sorting behavior
 * @returns Object containing sort state and operations
 * 
 * @example
 * ```tsx
 * const { sort, toggleSort, getSortDirection } = useSort({
 *   initialSort: [{ field: 'lastName', direction: SortDirection.ASC }],
 *   syncWithUrl: true
 * });
 * 
 * // In a data table component
 * return (
 *   <TableHead>
 *     <TableRow>
 *       <TableCell onClick={() => toggleSort('lastName')}>
 *         Name {getSortDirection('lastName') === SortDirection.ASC ? '↑' : '↓'}
 *       </TableCell>
 *     </TableRow>
 *   </TableHead>
 * );
 * ```
 */
function useSort(options: UseSortOptions = {}): SortState {
  const {
    initialSort = [],
    onSortChange,
    syncWithUrl = false,
    multiSort = false
  } = options;
  
  // Initialize sort state with initial sort parameters from options
  const [sort, setSort] = useState<SortParams[]>(initialSort);
  
  // Get URL query params using useQueryParams if syncWithUrl is true
  const { query, setQueryParam } = useQueryParams();
  
  // Initialize sort state from URL params if syncWithUrl is true
  useEffect(() => {
    if (syncWithUrl && query) {
      const urlSort = parseSortFromUrl(query);
      if (urlSort.length > 0) {
        setSort(urlSort);
      }
    }
  }, [syncWithUrl, query]);
  
  /**
   * Toggle sort direction for a field or add new sort parameter
   */
  const toggleSort = useCallback((field: string) => {
    setSort(prevSort => {
      // Find if the field is already being sorted
      const existingIndex = prevSort.findIndex(s => s.field === field);
      
      // If field is already being sorted, toggle direction
      if (existingIndex >= 0) {
        const existingSort = prevSort[existingIndex];
        const newDirection = toggleSortDirection(existingSort.direction);
        
        // If multiSort is enabled, update the existing sort parameter
        if (multiSort) {
          const newSort = [...prevSort];
          newSort[existingIndex] = { ...existingSort, direction: newDirection };
          return newSort;
        }
        
        // If multiSort is disabled, replace with only this field
        return [{ field, direction: newDirection }];
      }
      
      // If field is not being sorted, add new sort parameter
      const newSort = { field, direction: SortDirection.ASC };
      
      // If multiSort is enabled, add to existing sort parameters
      if (multiSort) {
        return [...prevSort, newSort];
      }
      
      // If multiSort is disabled, replace with only this field
      return [newSort];
    });
  }, [multiSort]);
  
  /**
   * Clear all sort parameters
   */
  const clearSort = useCallback(() => {
    setSort(initialSort);
  }, [initialSort]);
  
  /**
   * Get current sort parameters for API requests
   */
  const getSortParams = useCallback(() => {
    return sort;
  }, [sort]);
  
  /**
   * Get current sort direction for a field
   */
  const getSortDirection = useCallback((field: string) => {
    const sortParam = sort.find(s => s.field === field);
    return sortParam ? sortParam.direction : null;
  }, [sort]);
  
  // Update URL when sort changes if syncWithUrl is true
  useEffect(() => {
    if (!syncWithUrl) return;
    
    // Format sort parameters for URL
    if (sort.length === 0) {
      setQueryParam('sort', null);
    } else if (sort.length === 1) {
      setQueryParam('sort', `${sort[0].field}:${sort[0].direction}`);
    } else {
      const sortParams = sort.map(s => `${s.field}:${s.direction}`);
      setQueryParam('sort', sortParams);
    }
  }, [sort, syncWithUrl, setQueryParam]);
  
  // Trigger onSortChange callback when sort parameters change
  useEffect(() => {
    if (onSortChange) {
      onSortChange(sort);
    }
  }, [sort, onSortChange]);
  
  return {
    sort,
    setSort,
    toggleSort,
    clearSort,
    getSortParams,
    getSortDirection
  };
}

export default useSort;