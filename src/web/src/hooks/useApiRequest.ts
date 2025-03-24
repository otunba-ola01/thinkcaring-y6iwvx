/**
 * Custom React hook that provides a standardized way to make API requests in the HCBS Revenue Management System.
 * This hook abstracts the complexity of API calls, handles loading states, error handling, and provides
 * a consistent interface for components to interact with backend services.
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react'; // react v18.2+
import { AxiosError, AxiosRequestConfig } from 'axios'; // axios v1.4+

import { apiClient } from '../api/client';
import { ApiRequestHook, ApiRequestOptions, HttpMethod } from '../types/api.types';
import { ResponseError } from '../types/common.types';
import { apiConfig } from '../config/api.config';

/**
 * Custom hook for making API requests with loading state and error handling
 * 
 * @param options - Configuration options for the API request
 * @returns Object containing data, loading state, error, execute function, and reset function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApiRequest<UserData>({
 *   url: '/users/profile',
 *   method: HttpMethod.GET
 * });
 * 
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 * 
 * if (loading) return <Loading />;
 * if (error) return <ErrorMessage error={error} />;
 * if (data) return <UserProfile userData={data} />;
 * ```
 */
export function useApiRequest<T = any, P = void>(
  options?: ApiRequestOptions
): ApiRequestHook<T, P> {
  // State for data, loading, and error
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ResponseError | null>(null);
  
  // Reference to track if component is mounted
  const isMountedRef = useRef<boolean>(true);
  
  // Set up effect to mark component as unmounted when it's destroyed
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Execute function to make the API request
  const execute = useCallback(async (params?: P): Promise<T> => {
    // Reset error state at the start of new request
    setError(null);
    setLoading(true);
    
    try {
      let response: T;
      
      // Extract request-specific properties
      const { 
        method = HttpMethod.GET, // Default to GET if not specified
        url = '', 
        data, 
        params: optionParams, 
        ...axiosConfig 
      } = options || {} as ApiRequestOptions;
      
      // Merge params passed to execute with params from options
      const mergedParams = {
        ...optionParams,
        ...(params || {}) as any
      };
      
      // Make request based on method
      switch (method) {
        case HttpMethod.GET:
          response = await apiClient.get<T>(url, mergedParams, axiosConfig);
          break;
        case HttpMethod.POST:
          response = await apiClient.post<T>(url, data, axiosConfig);
          break;
        case HttpMethod.PUT:
          response = await apiClient.put<T>(url, data, axiosConfig);
          break;
        case HttpMethod.PATCH:
          response = await apiClient.patch<T>(url, data, axiosConfig);
          break;
        case HttpMethod.DELETE:
          response = await apiClient.del<T>(url, axiosConfig);
          break;
        default:
          // Use general request for unknown methods
          response = await apiClient.request<T>({
            method,
            url,
            data,
            params: mergedParams,
            ...axiosConfig
          });
      }
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        setData(response);
        setLoading(false);
      }
      
      return response;
    } catch (err) {
      // If component is unmounted, don't update state
      if (!isMountedRef.current) {
        throw err;
      }
      
      const error = err as any;
      
      // Extract error details
      const responseError: ResponseError = error.error || {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: null
      };
      
      // Update error state
      setError(responseError);
      setLoading(false);
      
      // Propagate the error for caller handling
      throw error;
    }
  }, [options]);
  
  // Reset function to clear data and error states
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(null);
      setError(null);
    }
  }, []);
  
  // Return hook interface
  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}