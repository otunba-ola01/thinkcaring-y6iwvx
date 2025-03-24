/**
 * This file defines TypeScript interfaces and types for API communication in the HCBS Revenue Management System frontend.
 * It provides type definitions for API requests, responses, configuration, and error handling to ensure type safety 
 * and consistency across all API interactions.
 */

// Import common types used in API definitions
import { 
  UUID, 
  ISO8601Date, 
  ISO8601DateTime, 
  PaginationParams, 
  PaginatedResponse, 
  SortDirection, 
  FilterOperator, 
  FilterParams, 
  QueryParams, 
  ResponseError 
} from './common.types';

// Import axios types for request/response handling
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'; // axios v1.4+

/**
 * Enum for HTTP methods used in API requests
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

/**
 * Enum for content types used in API requests and responses
 */
export enum ContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  TEXT = 'text/plain',
  BINARY = 'application/octet-stream'
}

/**
 * Enum for API error codes used in error responses
 */
export enum ApiErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Interface for API client configuration options
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  withCredentials: boolean;
}

/**
 * Interface for API response caching configuration
 */
export interface ApiCacheConfig {
  enabled: boolean;
  ttl: number; // Time-to-live in milliseconds
  maxSize: number; // Maximum number of cached responses
  excludedEndpoints: string[]; // Endpoints that should not be cached
}

/**
 * Interface for API retry configuration options
 */
export interface ApiRetryConfig {
  maxRetries: number;
  retryDelay: number; // Delay in milliseconds between retries
  retryableStatusCodes: number[]; // HTTP status codes that should trigger retry
}

/**
 * Interface for API interceptors to handle request/response processing
 */
export interface ApiInterceptor {
  onRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;
  onRequestError?: (error: any) => any;
  onResponse?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
  onResponseError?: (error: AxiosError) => any;
}

/**
 * Generic interface for API responses
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Interface for API error responses
 */
export interface ApiErrorResponse {
  error: ResponseError;
  status: number;
  statusText: string;
}

/**
 * Interface for validation error details in API responses
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/**
 * Interface for API request options
 */
export interface ApiRequestOptions {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: string;
  cache?: boolean;
  retry?: boolean;
}

/**
 * Interface extending Axios request configuration with custom properties
 */
export interface ApiRequestConfig {
  baseURL: string;
  headers: Record<string, string>;
  params: Record<string, any>;
  data: any;
  timeout: number;
  withCredentials: boolean;
  responseType: string;
  method: HttpMethod;
  url: string;
}

/**
 * Type for API request function signature
 */
export type ApiRequestFunction<T = any, P = any> = (params?: P) => Promise<ApiResponse<T>>;

/**
 * Interface for API request hook return value
 */
export interface ApiRequestHook<T, P = void> {
  data: T | null;
  loading: boolean;
  error: ResponseError | null;
  execute: (params?: P) => Promise<T>;
  reset: () => void;
}

/**
 * Interface for API endpoint configuration
 */
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  contentType: ContentType;
  requiresAuth: boolean;
  cacheable: boolean;
}

/**
 * Interface for file upload options
 */
export interface FileUploadOptions {
  url: string;
  file: File;
  fieldName: string;
  additionalData?: Record<string, any>;
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

/**
 * Interface for file download options
 */
export interface FileDownloadOptions {
  url: string;
  fileName: string;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

/**
 * Interface for batch request options
 */
export interface BatchRequestOptions {
  requests: ApiRequestOptions[];
  concurrency?: number;
  stopOnError?: boolean;
}

/**
 * Interface for batch request results
 */
export interface BatchRequestResult {
  results: Array<ApiResponse<any> | ApiErrorResponse>;
  successCount: number;
  errorCount: number;
  totalCount: number;
}

/**
 * Interface for API pagination metadata
 */
export interface ApiPaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Generic interface for paginated API responses
 */
export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: ApiPaginationMeta;
}

/**
 * Interface for API sorting parameters
 */
export interface ApiSortParams {
  field: string;
  direction: SortDirection;
}

/**
 * Interface for API query parameters combining pagination, sorting, and filtering
 */
export interface ApiQueryParams {
  page?: number;
  pageSize?: number;
  sort?: ApiSortParams[];
  filters?: FilterParams[];
  search?: string;
}

/**
 * Interface for API health check response
 */
export interface ApiHealthCheckResponse {
  status: string;
  version: string;
  timestamp: ISO8601DateTime;
  services: Array<{
    name: string;
    status: string;
    message?: string;
  }>;
}