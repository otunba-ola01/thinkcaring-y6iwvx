/**
 * API Client for HCBS Revenue Management System
 * 
 * Provides a centralized HTTP client for making API requests with consistent handling of
 * authentication, error management, caching, and retry mechanisms.
 * 
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'; // axios v1.4+
import { setupCache } from 'axios-cache-adapter'; // axios-cache-adapter v2.7+
import axiosRetry from 'axios-retry'; // axios-retry v3.5+
import FormData from 'form-data'; // form-data v4.0+

import { apiConfig } from '../config/api.config';
import { requestInterceptors, responseInterceptors } from './interceptors';
import {
  ApiRequestOptions,
  ApiResponse,
  ApiErrorResponse,
  HttpMethod,
  FileUploadOptions,
  FileDownloadOptions,
  BatchRequestOptions,
  BatchRequestResult
} from '../types/api.types';

/**
 * Creates and configures an Axios instance with interceptors, caching, and retry mechanisms
 * 
 * @returns Configured Axios instance
 */
function createApiClient(): AxiosInstance {
  // Create cache adapter with configured settings
  const cache = setupCache(apiConfig.cache);

  // Create Axios instance with base configuration and cache adapter
  const instance = axios.create({
    ...apiConfig.client,
    adapter: cache.adapter
  });

  // Apply request interceptors
  requestInterceptors.forEach(interceptor => {
    if (interceptor.onRequest) {
      instance.interceptors.request.use(
        interceptor.onRequest,
        interceptor.onRequestError
      );
    }
  });

  // Apply response interceptors
  responseInterceptors.forEach(interceptor => {
    if (interceptor.onResponse) {
      instance.interceptors.response.use(
        interceptor.onResponse,
        interceptor.onResponseError
      );
    }
  });

  // Configure retry mechanism
  axiosRetry(instance, apiConfig.retry);

  return instance;
}

// Create the Axios instance
const axiosInstance = createApiClient();

// Map to store cancel tokens for ongoing requests
const cancelTokens = new Map<string, () => void>();

/**
 * Generic request function that wraps the Axios instance
 * 
 * @param options - Request options
 * @returns Promise resolving to API response
 */
async function request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { method, url, data, params, headers, requestId, ...otherOptions } = options;

  const config: AxiosRequestConfig = {
    method,
    url,
    data,
    params,
    headers,
    ...otherOptions
  };

  // Add cancel token if requestId is provided
  if (requestId) {
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelTokens.set(requestId, source.cancel);
  }

  try {
    const response = await axiosInstance(config);
    return response.data;
  } catch (error) {
    throw error;
  } finally {
    // Clean up cancel token if requestId was provided
    if (requestId) {
      cancelTokens.delete(requestId);
    }
  }
}

/**
 * Convenience function for making GET requests
 * 
 * @param url - Request URL
 * @param params - Query parameters
 * @param config - Additional Axios config
 * @returns Promise resolving to API response
 */
async function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request<T>({
    method: HttpMethod.GET,
    url,
    params,
    ...config
  });
}

/**
 * Convenience function for making POST requests
 * 
 * @param url - Request URL
 * @param data - Request body data
 * @param config - Additional Axios config
 * @returns Promise resolving to API response
 */
async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request<T>({
    method: HttpMethod.POST,
    url,
    data,
    ...config
  });
}

/**
 * Convenience function for making PUT requests
 * 
 * @param url - Request URL
 * @param data - Request body data
 * @param config - Additional Axios config
 * @returns Promise resolving to API response
 */
async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request<T>({
    method: HttpMethod.PUT,
    url,
    data,
    ...config
  });
}

/**
 * Convenience function for making PATCH requests
 * 
 * @param url - Request URL
 * @param data - Request body data
 * @param config - Additional Axios config
 * @returns Promise resolving to API response
 */
async function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request<T>({
    method: HttpMethod.PATCH,
    url,
    data,
    ...config
  });
}

/**
 * Convenience function for making DELETE requests
 * 
 * @param url - Request URL
 * @param config - Additional Axios config
 * @returns Promise resolving to API response
 */
async function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return request<T>({
    method: HttpMethod.DELETE,
    url,
    ...config
  });
}

/**
 * Uploads a file to the specified endpoint
 * 
 * @param options - File upload options
 * @returns Promise resolving to API response
 */
async function uploadFile<T = any>(options: FileUploadOptions): Promise<ApiResponse<T>> {
  const { url, file, fieldName, additionalData, onProgress, headers } = options;

  // Create FormData instance
  const formData = new FormData();
  
  // Append file to FormData
  formData.append(fieldName, file);
  
  // Append any additional data
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  // Create upload configuration
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...headers
    },
  };

  // Add progress handler if provided
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  // Make POST request with FormData
  return post<T>(url, formData, config);
}

/**
 * Downloads a file from the specified endpoint
 * 
 * @param options - File download options
 * @returns Promise resolving to file blob
 */
async function downloadFile(options: FileDownloadOptions): Promise<Blob> {
  const { url, fileName, params, headers, onProgress } = options;

  // Create download configuration
  const config: AxiosRequestConfig = {
    responseType: 'blob',
    params,
    headers,
  };

  // Add progress handler if provided
  if (onProgress) {
    config.onDownloadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    };
  }

  // Make GET request with configuration
  const response = await axiosInstance.get(url, config);
  
  // Create blob URL and trigger download
  const blob = new Blob([response.data]);
  const blobUrl = window.URL.createObjectURL(blob);
  
  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', fileName);
  
  // Trigger click to download file
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
  
  return blob;
}

/**
 * Executes multiple API requests in batch
 * 
 * @param options - Batch request options
 * @returns Promise resolving to batch request results
 */
async function batchRequest(options: BatchRequestOptions): Promise<BatchRequestResult> {
  const { requests, concurrency = 5, stopOnError = false } = options;

  // Create array to store results
  const results: Array<ApiResponse<any> | ApiErrorResponse> = [];
  
  // Track success and error counts
  let successCount = 0;
  let errorCount = 0;
  
  // Process requests in batches based on concurrency limit
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    
    try {
      // Process current batch
      const batchPromises = batch.map(async (requestOptions) => {
        try {
          const response = await request(requestOptions);
          successCount++;
          return response;
        } catch (error) {
          errorCount++;
          if (stopOnError) {
            throw error; // Re-throw to stop further processing
          }
          return error as ApiErrorResponse;
        }
      });
      
      // Wait for all requests in current batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // If stopOnError is true and we have errors, stop processing
      if (stopOnError && errorCount > 0) {
        break;
      }
    } catch (error) {
      // If an error was re-thrown with stopOnError, end batch processing
      break;
    }
  }
  
  return {
    results,
    successCount,
    errorCount,
    totalCount: results.length
  };
}

/**
 * Cancels an ongoing request
 * 
 * @param requestId - ID of the request to cancel
 */
function cancelRequest(requestId: string): void {
  const cancelFn = cancelTokens.get(requestId);
  if (cancelFn) {
    cancelFn();
    cancelTokens.delete(requestId);
  }
}

/**
 * Checks if an error is a cancellation error
 * 
 * @param error - Error to check
 * @returns True if the error is a cancellation error
 */
function isCancel(error: any): boolean {
  return axios.isCancel(error);
}

// Export the API client
const apiClient = {
  request,
  get,
  post,
  put,
  patch,
  del,
  uploadFile,
  downloadFile,
  batchRequest,
  cancelRequest,
  isCancel,
  axiosInstance
};

export { apiClient };