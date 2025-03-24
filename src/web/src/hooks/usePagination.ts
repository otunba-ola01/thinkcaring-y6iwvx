import { useState, useEffect, useCallback, useMemo } from 'react'; // React v18.2.0
import { PaginationParams } from '../types/common.types';
import useQueryParams from './useQueryParams';
import { DEFAULT_PAGE_SIZE, PAGINATION_OPTIONS } from '../constants/ui.constants';

/**
 * Interface defining the options for the usePagination hook
 */
export interface UsePaginationOptions {
  /**
   * Initial page number (defaults to 1)
   */
  initialPage?: number;
  
  /**
   * Initial page size (defaults to DEFAULT_PAGE_SIZE)
   */
  initialPageSize?: number;
  
  /**
   * Whether to sync pagination state with URL query parameters
   */
  syncWithUrl?: boolean;
  
  /**
   * Callback function that gets called when pagination changes
   */
  onPaginationChange?: (page: number, pageSize: number) => void;
}

/**
 * Interface defining the return value of the usePagination hook
 */
export interface UsePaginationReturn {
  /**
   * Current page number
   */
  page: number;
  
  /**
   * Current page size (items per page)
   */
  pageSize: number;
  
  /**
   * Function to handle page changes
   */
  handlePageChange: (newPage: number) => void;
  
  /**
   * Function to handle page size changes
   */
  handlePageSizeChange: (newPageSize: number) => void;
  
  /**
   * Function to reset pagination to initial values
   */
  resetPagination: (resetPageSize?: boolean) => void;
  
  /**
   * Pagination parameters for API requests (page, pageSize)
   */
  paginationParams: PaginationParams;
}

/**
 * A custom hook that provides pagination functionality with optional URL synchronization
 * for data tables and lists throughout the HCBS Revenue Management System.
 * 
 * @param options - Configuration options for pagination
 * @returns Pagination state and handler functions
 * 
 * @example
 * ```tsx
 * const {
 *   page,
 *   pageSize,
 *   handlePageChange,
 *   handlePageSizeChange,
 *   paginationParams
 * } = usePagination({
 *   initialPage: 1,
 *   initialPageSize: 25,
 *   syncWithUrl: true,
 *   onPaginationChange: (page, pageSize) => console.log(`Page: ${page}, Size: ${pageSize}`)
 * });
 * 
 * // Use with an API request
 * useEffect(() => {
 *   fetchData(paginationParams);
 * }, [paginationParams]);
 * 
 * // Use with MUI Pagination component
 * <Pagination 
 *   page={page}
 *   count={totalPages}
 *   onChange={(_, newPage) => handlePageChange(newPage)}
 * />
 * ```
 */
const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    syncWithUrl = false,
    onPaginationChange
  } = options;
  
  // Initialize query params hook if URL sync is enabled
  const queryParams = syncWithUrl ? useQueryParams() : null;
  
  // Get initial values from URL if syncing with URL
  const initialPageFromUrl = syncWithUrl && queryParams 
    ? Number(queryParams.getQueryParam('page', initialPage))
    : initialPage;
    
  const initialPageSizeFromUrl = syncWithUrl && queryParams 
    ? Number(queryParams.getQueryParam('pageSize', initialPageSize))
    : initialPageSize;
  
  // Initialize state
  const [page, setPage] = useState<number>(initialPageFromUrl);
  const [pageSize, setPageSize] = useState<number>(initialPageSizeFromUrl);
  
  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (onPaginationChange) {
      onPaginationChange(newPage, pageSize);
    }
  }, [pageSize, onPaginationChange]);
  
  // Handle page size change (resets to page 1)
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    if (onPaginationChange) {
      onPaginationChange(1, newPageSize);
    }
  }, [onPaginationChange]);
  
  // Reset pagination to initial values
  const resetPagination = useCallback((resetPageSize: boolean = false) => {
    setPage(initialPage);
    if (resetPageSize) {
      setPageSize(initialPageSize);
    }
  }, [initialPage, initialPageSize]);
  
  // Sync with URL if enabled
  useEffect(() => {
    if (syncWithUrl && queryParams) {
      queryParams.setQueryParams({
        page,
        pageSize
      }, { replace: true });
    }
  }, [syncWithUrl, queryParams, page, pageSize]);
  
  // Calculate pagination parameters for API requests
  const paginationParams = useMemo<PaginationParams>(() => ({
    page,
    pageSize
  }), [page, pageSize]);
  
  return {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
    paginationParams
  };
};

export default usePagination;