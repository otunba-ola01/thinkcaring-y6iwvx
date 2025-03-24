/**
 * Type definitions for API endpoints in the HCBS Revenue Management System.
 * 
 * This file provides TypeScript interfaces and types for API routes, controllers,
 * and middleware, ensuring type safety and consistency across the application's
 * API layer.
 */

import { 
  Request, 
  RequestWithParams, 
  RequestWithQuery, 
  RequestWithBody, 
  RequestWithParamsAndBody, 
  RequestWithQueryAndBody, 
  RequestWithParamsQueryAndBody 
} from './request.types';

import { 
  ApiResponse, 
  PaginatedApiResponse, 
  EmptyApiResponse, 
  ValidationResponse, 
  BulkOperationResponse, 
  FileUploadResponse, 
  HealthCheckResponse, 
  ExportResponse 
} from './response.types';

import { ErrorResponse } from './error.types';
import { UUID } from './common.types';
import { Response, NextFunction } from 'express'; // v4.18+

/**
 * Type for Express route handler functions that process requests and return responses
 */
export type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Type for controller methods that handle specific API endpoints
 */
export type ControllerMethod = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Type for middleware functions that process requests before they reach route handlers
 */
export type Middleware = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Type for middleware functions that validate request data
 */
export type ValidationMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Type for middleware functions that handle authentication and authorization
 */
export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Type for middleware functions that handle errors
 */
export type ErrorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => Promise<void> | void;

/**
 * Interface for defining API routes with path, method, handler, middleware, and description
 */
export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: RouteHandler;
  middleware: Middleware[];
  description: string;
}

/**
 * Interface for controller objects that contain methods for handling API endpoints
 */
export interface Controller {
  [key: string]: ControllerMethod;
}

/**
 * Interface for documenting API endpoints with detailed metadata for API documentation
 */
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestBody: object | null;
  requestParams: object | null;
  requestQuery: object | null;
  responses: Record<string, { description: string; schema: object }>;
  requiresAuth: boolean;
  permissions: string[];
  tags: string[];
}

/**
 * Interface for grouping related API endpoints into a resource with a common base path
 */
export interface ApiResource {
  name: string;
  basePath: string;
  description: string;
  endpoints: ApiEndpoint[];
}

/**
 * Type for API version strings used in route paths
 */
export type ApiVersion = 'v1' | 'v2';

/**
 * Interface for configuring API versions with resources and deprecation information
 */
export interface ApiVersionConfig {
  version: ApiVersion;
  resources: ApiResource[];
  deprecated: boolean;
  deprecationDate: string | null;
}

/**
 * Interface for overall API configuration with versions and metadata
 */
export interface ApiConfig {
  title: string;
  description: string;
  basePath: string;
  versions: ApiVersionConfig[];
  defaultVersion: ApiVersion;
}

/**
 * Type alias for HTTP methods used in API endpoints
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Type alias for HTTP status codes used in API responses
 */
export type HttpStatusCode = 
  | 200 | 201 | 202 | 204  // Success
  | 400 | 401 | 403 | 404 | 409 | 422 | 429  // Client errors
  | 500 | 501 | 502 | 503 | 504;  // Server errors

/**
 * Type alias for content types used in API requests and responses
 */
export type ContentType = 
  | 'application/json' 
  | 'application/x-www-form-urlencoded' 
  | 'multipart/form-data' 
  | 'text/plain'
  | 'application/pdf'
  | 'application/vnd.ms-excel'
  | 'text/csv';

/**
 * Generic type for API handlers with typed parameters, query, body, and response
 */
export type ApiHandler<P, Q, B, R> = 
  (req: RequestWithParamsQueryAndBody<P, Q, B>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed parameters and response
 */
export type ApiHandlerWithParams<P, R> = 
  (req: RequestWithParams<P>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed query parameters and response
 */
export type ApiHandlerWithQuery<Q, R> = 
  (req: RequestWithQuery<Q>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed request body and response
 */
export type ApiHandlerWithBody<B, R> = 
  (req: RequestWithBody<B>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed parameters, query, and response
 */
export type ApiHandlerWithParamsAndQuery<P, Q, R> = 
  (req: RequestWithParamsAndQuery<P, Q>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed parameters, body, and response
 */
export type ApiHandlerWithParamsAndBody<P, B, R> = 
  (req: RequestWithParamsAndBody<P, B>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed query, body, and response
 */
export type ApiHandlerWithQueryAndBody<Q, B, R> = 
  (req: RequestWithQueryAndBody<Q, B>, res: Response) => Promise<R> | R;

/**
 * Type for API handlers with typed parameters, query, body, and response
 */
export type ApiHandlerWithParamsQueryAndBody<P, Q, B, R> = 
  (req: RequestWithParamsQueryAndBody<P, Q, B>, res: Response) => Promise<R> | R;

/**
 * Interface for claims API handlers with typed parameters and responses
 */
export interface ClaimsApiHandlers {
  getClaim: ApiHandlerWithParams<{ id: UUID }, ApiResponse<ClaimWithRelations>>;
  getAllClaims: ApiHandlerWithQuery<ClaimQueryParams, PaginatedApiResponse<ClaimWithRelations>>;
  getClaimSummaries: ApiHandlerWithQuery<ClaimQueryParams, PaginatedApiResponse<ClaimSummary>>;
  createClaim: ApiHandlerWithBody<CreateClaimDto, ApiResponse<ClaimWithRelations>>;
  updateClaim: ApiHandlerWithParamsAndBody<{ id: UUID }, UpdateClaimDto, ApiResponse<ClaimWithRelations>>;
  validateClaim: ApiHandlerWithParams<{ id: UUID }, ValidationResponse>;
  submitClaim: ApiHandlerWithParamsAndBody<{ id: UUID }, SubmitClaimDto, ApiResponse<ClaimWithRelations>>;
  batchValidateClaims: ApiHandlerWithBody<{ claimIds: UUID[] }, ValidationResponse>;
  batchSubmitClaims: ApiHandlerWithBody<BatchSubmitClaimsDto, BulkOperationResponse>;
  getClaimStatus: ApiHandlerWithParams<{ id: UUID }, ApiResponse<{ status: ClaimStatus; statusDate: string; statusReason: string | null }>>;
  updateClaimStatus: ApiHandlerWithParamsAndBody<{ id: UUID }, UpdateClaimStatusDto, ApiResponse<ClaimWithRelations>>;
}

/**
 * Interface for payments API handlers with typed parameters and responses
 */
export interface PaymentsApiHandlers {
  getPayment: ApiHandlerWithParams<{ id: UUID }, ApiResponse<PaymentWithRelations>>;
  getAllPayments: ApiHandlerWithQuery<PaymentQueryParams, PaginatedApiResponse<PaymentWithRelations>>;
  createPayment: ApiHandlerWithBody<CreatePaymentDto, ApiResponse<PaymentWithRelations>>;
  processRemittance: ApiHandlerWithBody<ProcessRemittanceDto, BulkOperationResponse>;
  reconcilePayment: ApiHandlerWithParamsAndBody<{ id: UUID }, ReconcilePaymentDto, ApiResponse<PaymentWithRelations>>;
}

/**
 * Interface for billing API handlers with typed parameters and responses
 */
export interface BillingApiHandlers {
  getBillingQueue: ApiHandlerWithQuery<BillingQueueParams, PaginatedApiResponse<ServiceWithRelations>>;
  validateServices: ApiHandlerWithBody<{ serviceIds: UUID[] }, ValidationResponse>;
  generateClaims: ApiHandlerWithBody<GenerateClaimsDto, BulkOperationResponse>;
  validateAndGenerateClaims: ApiHandlerWithBody<GenerateClaimsDto, BulkOperationResponse>;
}

/**
 * Interface for reports API handlers with typed parameters and responses
 */
export interface ReportsApiHandlers {
  generateReport: ApiHandlerWithBody<GenerateReportDto, ApiResponse<ReportResult>>;
  getReportTypes: ApiHandlerWithQuery<{}, ApiResponse<ReportType[]>>;
  exportReport: ApiHandlerWithParamsAndQuery<{ id: UUID }, ExportReportParams, ExportResponse>;
  scheduleReport: ApiHandlerWithBody<ScheduleReportDto, ApiResponse<ScheduledReport>>;
}

/**
 * Interface grouping all API handlers by resource category
 */
export interface ApiHandlers {
  claims: ClaimsApiHandlers;
  payments: PaymentsApiHandlers;
  billing: BillingApiHandlers;
  reports: ReportsApiHandlers;
}