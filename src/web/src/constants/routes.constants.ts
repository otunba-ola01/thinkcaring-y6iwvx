/**
 * Route Constants
 * 
 * This file defines all route paths used throughout the HCBS Revenue Management System.
 * Using these constants instead of hardcoded strings ensures consistency and easier maintenance.
 * It supports the navigation flow defined in the technical specifications.
 */

/**
 * Application route paths organized by feature
 */
export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    MFA: '/mfa'
  },
  DASHBOARD: {
    ROOT: '/dashboard',
    REVENUE_METRICS: '/dashboard/revenue-metrics',
    ALERTS: '/dashboard/alerts'
  },
  CLIENTS: {
    ROOT: '/clients',
    NEW: '/clients/new',
    DETAIL: '/clients/[id]',
    EDIT: '/clients/[id]/edit',
    AUTHORIZATIONS: '/clients/[id]/authorizations',
    SERVICES: '/clients/[id]/services',
    CLAIMS: '/clients/[id]/claims'
  },
  SERVICES: {
    ROOT: '/services',
    DASHBOARD: '/services/dashboard',
    NEW: '/services/new',
    VALIDATION: '/services/validation',
    DETAIL: '/services/[id]',
    EDIT: '/services/[id]/edit'
  },
  CLAIMS: {
    ROOT: '/claims',
    DASHBOARD: '/claims/dashboard',
    NEW: '/claims/new',
    BATCH: '/claims/batch',
    STATUS_TRACKING: '/claims/status-tracking',
    DETAIL: '/claims/[id]',
    EDIT: '/claims/[id]/edit'
  },
  BILLING: {
    ROOT: '/billing',
    DASHBOARD: '/billing/dashboard',
    QUEUE: '/billing/queue',
    VALIDATION: '/billing/validation',
    CLAIM_CREATION: '/billing/claim-creation',
    CONFIRMATION: '/billing/confirmation'
  },
  PAYMENTS: {
    ROOT: '/payments',
    DASHBOARD: '/payments/dashboard',
    NEW: '/payments/new',
    RECONCILIATION: '/payments/reconciliation',
    ACCOUNTS_RECEIVABLE: '/payments/accounts-receivable',
    DETAIL: '/payments/[id]',
    PAYMENT_RECONCILIATION: '/payments/[id]/reconciliation'
  },
  REPORTS: {
    ROOT: '/reports',
    DASHBOARD: '/reports/dashboard',
    SELECTION: '/reports/selection',
    REVENUE: '/reports/revenue',
    CLAIMS: '/reports/claims',
    FINANCIAL: '/reports/financial',
    CUSTOM_BUILDER: '/reports/custom-builder',
    VIEWER: '/reports/viewer',
    SCHEDULER: '/reports/scheduler'
  },
  SETTINGS: {
    ROOT: '/settings',
    USERS: '/settings/users',
    ORGANIZATION: '/settings/organization',
    PROGRAMS: '/settings/programs',
    PAYERS: '/settings/payers',
    SERVICE_CODES: '/settings/service-codes',
    INTEGRATIONS: '/settings/integrations',
    NOTIFICATIONS: '/settings/notifications',
    AUDIT_LOG: '/settings/audit-log'
  },
  HELP: {
    ROOT: '/help',
    KNOWLEDGE_BASE: '/help/knowledge-base',
    TUTORIALS: '/help/tutorials',
    SUPPORT: '/help/support'
  },
  PROFILE: {
    ROOT: '/profile',
    PASSWORD: '/profile/password',
    NOTIFICATIONS: '/profile/notifications',
    THEME: '/profile/theme',
    API_KEYS: '/profile/api-keys'
  }
};

/**
 * Parameter names used in dynamic routes
 */
export const ROUTE_PARAMS = {
  CLIENT_ID: 'id',
  SERVICE_ID: 'id',
  CLAIM_ID: 'id',
  PAYMENT_ID: 'id',
  REPORT_ID: 'id',
  TOKEN: 'token',
  RESET_TOKEN: 'token'
};

/**
 * Query parameter names used in routes
 */
export const QUERY_PARAMS = {
  REDIRECT: 'redirect',
  TAB: 'tab',
  PAGE: 'page',
  LIMIT: 'limit',
  SORT: 'sort',
  FILTER: 'filter',
  DATE_RANGE: 'dateRange',
  PROGRAM: 'program',
  PAYER: 'payer',
  STATUS: 'status',
  SEARCH: 'search',
  VIEW: 'view'
};

/**
 * Builds a route path by replacing parameter placeholders with actual values
 * 
 * @param route - Route path with parameter placeholders (e.g., "/clients/[id]")
 * @param params - Object containing parameter values (e.g., { id: '123' })
 * @returns Constructed route path with parameter values
 */
export const buildRoute = (route: string, params: Record<string, string>): string => {
  return route.replace(/\[([^\]]+)\]/g, (_, p) => params[p] || p);
};

/**
 * Builds a query string from parameter object
 * 
 * @param params - Object containing query parameters
 * @returns Query string (excluding the "?" character)
 */
export const buildQueryString = (params: Record<string, string | number | boolean | undefined | null>): string => {
  return Object.entries(params)
    .filter(([_, v]) => v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
};