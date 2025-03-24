/**
 * API Constants
 * 
 * Defines API-related constants for the HCBS Revenue Management System web application,
 * including base URLs, endpoint paths, content types, response codes, and request methods.
 * These constants are used throughout the application to ensure consistent API communication.
 */

/**
 * Base URL for API requests.
 * Uses environment variable if available, otherwise falls back to default
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.thinkcaring.com';

/**
 * API version used in URL construction
 */
export const API_VERSION = 'v1';

/**
 * Content type constants for API requests and responses
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  TEXT: 'text/plain',
  BINARY: 'application/octet-stream'
};

/**
 * HTTP method constants for API requests
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};

/**
 * HTTP status code constants for API responses
 */
export const API_RESPONSE_CODES = {
  // Success codes
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  // Client error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  
  // Server error codes
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * API endpoint constants organized by resource type
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PASSWORD_RESET: '/auth/password-reset',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm',
    MFA: '/auth/mfa'
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences'
  },
  CLIENTS: {
    BASE: '/clients',
    SEARCH: '/clients/search',
    AUTHORIZATIONS: '/clients/:id/authorizations',
    SERVICES: '/clients/:id/services',
    CLAIMS: '/clients/:id/claims',
    DOCUMENTS: '/clients/:id/documents'
  },
  SERVICES: {
    BASE: '/services',
    VALIDATE: '/services/validate',
    TYPES: '/services/types',
    BILLABLE: '/services/billable',
    UNBILLED: '/services/unbilled'
  },
  CLAIMS: {
    BASE: '/claims',
    BATCH: '/claims/batch',
    STATUS: '/claims/status',
    VALIDATE: '/claims/:id/validate',
    SUBMIT: '/claims/:id/submit',
    RESUBMIT: '/claims/:id/resubmit',
    VOID: '/claims/:id/void',
    APPEAL: '/claims/:id/appeal'
  },
  BILLING: {
    BASE: '/billing',
    QUEUE: '/billing/queue',
    VALIDATION: '/billing/validation',
    SUBMISSION: '/billing/submission',
    CONFIRMATION: '/billing/confirmation'
  },
  PAYMENTS: {
    BASE: '/payments',
    REMITTANCE: '/payments/remittance',
    UNRECONCILED: '/payments/unreconciled',
    MATCH: '/payments/:id/match',
    RECONCILE: '/payments/:id/reconcile'
  },
  REPORTS: {
    BASE: '/reports',
    STANDARD: '/reports/standard/:type',
    CUSTOM: '/reports/custom',
    SCHEDULED: '/reports/scheduled',
    EXPORT: '/reports/:id/export/:format',
    DASHBOARD_METRICS: '/reports/dashboard/metrics'
  },
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    REVENUE: '/dashboard/revenue',
    CLAIMS: '/dashboard/claims',
    ALERTS: '/dashboard/alerts'
  },
  SETTINGS: {
    BASE: '/settings',
    ORGANIZATION: '/settings/organization',
    PROGRAMS: '/settings/programs',
    PAYERS: '/settings/payers',
    SERVICE_CODES: '/settings/service-codes',
    INTEGRATIONS: '/settings/integrations',
    NOTIFICATIONS: '/settings/notifications',
    AUDIT_LOG: '/settings/audit-log'
  },
  HEALTH: {
    LIVE: '/health/live',
    READY: '/health/ready',
    DEEP: '/health/deep'
  }
};

/**
 * Default timeout value for API requests in milliseconds
 * 30 seconds is a reasonable default for most operations
 */
export const DEFAULT_API_TIMEOUT = 30000;

/**
 * Default headers to include with all API requests
 */
export const DEFAULT_API_HEADERS = {
  'Content-Type': CONTENT_TYPES.JSON,
  'Accept': CONTENT_TYPES.JSON,
  'X-Requested-With': 'XMLHttpRequest',
  'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
};

/**
 * Standard error messages for common API error scenarios
 */
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request took too long to complete. Please try again later.',
  UNAUTHORIZED: 'Your session has expired. Please log in again to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource could not be found.',
  SERVER_ERROR: 'An unexpected error occurred. Our team has been notified and is working to resolve the issue.',
  VALIDATION_ERROR: 'Please correct the errors in your submission and try again.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  DEFAULT: 'An error occurred while processing your request. Please try again.'
};