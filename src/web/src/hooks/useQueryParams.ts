import { useRouter } from 'next/router'; // Next.js v13.4+
import { useCallback, useMemo } from 'react'; // React v18.2.0
import { parseQueryString, buildQueryString } from '../utils/route';

/**
 * Interface for the return value of the useQueryParams hook
 */
export interface UseQueryParamsReturn {
  /**
   * Current query parameters object
   */
  query: Record<string, any>;

  /**
   * Get a specific query parameter value
   * @param key - Query parameter key
   * @param defaultValue - Default value if the parameter doesn't exist
   * @returns The parameter value or the default value
   */
  getQueryParam: <T = any>(key: string, defaultValue?: T) => T;

  /**
   * Set a specific query parameter value
   * @param key - Query parameter key
   * @param value - Query parameter value
   * @param options - Additional options
   */
  setQueryParam: (key: string, value: any, options?: { replace?: boolean }) => void;

  /**
   * Set multiple query parameters at once
   * @param params - Object containing query parameters
   * @param options - Additional options
   */
  setQueryParams: (params: Record<string, any>, options?: { replace?: boolean }) => void;

  /**
   * Remove a specific query parameter
   * @param key - Query parameter key to remove
   * @param options - Additional options
   */
  removeQueryParam: (key: string, options?: { replace?: boolean }) => void;

  /**
   * Clear all query parameters
   * @param options - Additional options
   */
  clearQueryParams: (options?: { replace?: boolean }) => void;

  /**
   * Replace all query parameters
   * @param params - New query parameters
   */
  replaceQueryParams: (params: Record<string, any>) => void;

  /**
   * Get the current query string
   * @returns Query string without the leading ?
   */
  getQueryString: () => string;
}

/**
 * A custom hook that provides functionality for managing URL query parameters
 * in the HCBS Revenue Management System. This hook enables components to read,
 * update, and sync their state with URL query parameters, facilitating shareable
 * and bookmarkable UI states.
 * 
 * @returns Object containing query parameter state and operations
 * 
 * @example
 * ```tsx
 * const { 
 *   query, 
 *   getQueryParam, 
 *   setQueryParam, 
 *   removeQueryParam 
 * } = useQueryParams();
 * 
 * // Get the 'page' parameter with a default value of 1
 * const page = getQueryParam('page', 1);
 * 
 * // Set the 'page' parameter to 2
 * setQueryParam('page', 2);
 * 
 * // Remove the 'filter' parameter
 * removeQueryParam('filter');
 * ```
 */
const useQueryParams = (): UseQueryParamsReturn => {
  // Get the router instance
  const router = useRouter();
  
  // Parse current query parameters from router.query
  const query = useMemo(() => {
    return parseQueryString(router.query);
  }, [router.query]);

  /**
   * Get a specific query parameter value
   * @param key - Query parameter key
   * @param defaultValue - Default value if the parameter doesn't exist
   * @returns The parameter value or the default value
   */
  const getQueryParam = useCallback(<T = any>(key: string, defaultValue?: T): T => {
    return (key in query ? query[key] : defaultValue) as T;
  }, [query]);

  /**
   * Set a specific query parameter value
   * @param key - Query parameter key
   * @param value - Query parameter value
   * @param options - Additional options (replace: whether to use replace instead of push)
   */
  const setQueryParam = useCallback((key: string, value: any, options?: { replace?: boolean }) => {
    const newQuery = { ...query };
    
    if (value === undefined || value === null) {
      delete newQuery[key];
    } else {
      newQuery[key] = value;
    }
    
    const url = {
      pathname: router.pathname,
      query: newQuery
    };
    
    if (options?.replace) {
      router.replace(url, undefined, { shallow: true });
    } else {
      router.push(url, undefined, { shallow: true });
    }
  }, [query, router]);

  /**
   * Set multiple query parameters at once
   * @param params - Object containing query parameters
   * @param options - Additional options (replace: whether to use replace instead of push)
   */
  const setQueryParams = useCallback((params: Record<string, any>, options?: { replace?: boolean }) => {
    const newQuery = { ...query };
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        delete newQuery[key];
      } else {
        newQuery[key] = value;
      }
    });
    
    const url = {
      pathname: router.pathname,
      query: newQuery
    };
    
    if (options?.replace) {
      router.replace(url, undefined, { shallow: true });
    } else {
      router.push(url, undefined, { shallow: true });
    }
  }, [query, router]);

  /**
   * Remove a specific query parameter
   * @param key - Query parameter key to remove
   * @param options - Additional options (replace: whether to use replace instead of push)
   */
  const removeQueryParam = useCallback((key: string, options?: { replace?: boolean }) => {
    const newQuery = { ...query };
    delete newQuery[key];
    
    const url = {
      pathname: router.pathname,
      query: newQuery
    };
    
    if (options?.replace) {
      router.replace(url, undefined, { shallow: true });
    } else {
      router.push(url, undefined, { shallow: true });
    }
  }, [query, router]);

  /**
   * Clear all query parameters
   * @param options - Additional options (replace: whether to use replace instead of push)
   */
  const clearQueryParams = useCallback((options?: { replace?: boolean }) => {
    const url = {
      pathname: router.pathname,
      query: {}
    };
    
    if (options?.replace) {
      router.replace(url, undefined, { shallow: true });
    } else {
      router.push(url, undefined, { shallow: true });
    }
  }, [router]);

  /**
   * Replace all query parameters
   * @param params - New query parameters
   */
  const replaceQueryParams = useCallback((params: Record<string, any>) => {
    const newQuery: Record<string, any> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        newQuery[key] = value;
      }
    });
    
    router.replace({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: true });
  }, [router]);

  /**
   * Get the current query string
   * @returns Query string without the leading ?
   */
  const getQueryString = useCallback(() => {
    return buildQueryString(query);
  }, [query]);

  return {
    query,
    getQueryParam,
    setQueryParam,
    setQueryParams,
    removeQueryParam,
    clearQueryParams,
    replaceQueryParams,
    getQueryString
  };
};

export default useQueryParams;