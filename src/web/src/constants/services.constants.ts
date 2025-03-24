/**
 * Services Constants
 * 
 * This file defines constants related to services management in the HCBS Revenue Management System.
 * It includes API endpoints, status labels, color codes, table column definitions, validation messages,
 * and other configuration values used throughout the services management functionality.
 */

import { ServiceType, DocumentationStatus, BillingStatus } from '../types/services.types';

/**
 * API endpoints for service-related operations
 */
export const SERVICE_API_ENDPOINTS = {
  BASE: '/api/services',
  GET_SERVICE: '/api/services/:id',
  CREATE_SERVICE: '/api/services',
  UPDATE_SERVICE: '/api/services/:id',
  DELETE_SERVICE: '/api/services/:id',
  VALIDATE_SERVICE: '/api/services/:id/validate',
  BATCH_VALIDATE: '/api/services/batch/validate',
  UPDATE_DOCUMENTATION_STATUS: '/api/services/:id/documentation-status',
  UPDATE_BILLING_STATUS: '/api/services/:id/billing-status',
  GET_BY_CLIENT: '/api/services/client/:clientId',
  GET_BY_PROGRAM: '/api/services/program/:programId',
  GET_UNBILLED: '/api/services/unbilled',
  GET_METRICS: '/api/services/metrics',
  IMPORT_SERVICES: '/api/services/import'
};

/**
 * Human-readable labels for service type values
 */
export const SERVICE_TYPE_LABELS = {
  [ServiceType.PERSONAL_CARE]: 'Personal Care',
  [ServiceType.RESIDENTIAL]: 'Residential',
  [ServiceType.DAY_SERVICES]: 'Day Services',
  [ServiceType.RESPITE]: 'Respite',
  [ServiceType.THERAPY]: 'Therapy',
  [ServiceType.TRANSPORTATION]: 'Transportation',
  [ServiceType.CASE_MANAGEMENT]: 'Case Management',
  [ServiceType.OTHER]: 'Other'
};

/**
 * Human-readable labels for documentation status values
 */
export const DOCUMENTATION_STATUS_LABELS = {
  [DocumentationStatus.INCOMPLETE]: 'Incomplete',
  [DocumentationStatus.COMPLETE]: 'Complete',
  [DocumentationStatus.REJECTED]: 'Rejected',
  [DocumentationStatus.PENDING_REVIEW]: 'Pending Review'
};

/**
 * Human-readable labels for billing status values
 */
export const BILLING_STATUS_LABELS = {
  [BillingStatus.UNBILLED]: 'Unbilled',
  [BillingStatus.READY_FOR_BILLING]: 'Ready for Billing',
  [BillingStatus.IN_CLAIM]: 'In Claim',
  [BillingStatus.BILLED]: 'Billed',
  [BillingStatus.PAID]: 'Paid',
  [BillingStatus.DENIED]: 'Denied',
  [BillingStatus.VOID]: 'Void'
};

/**
 * Color codes for documentation status badges and visualizations
 * Following the design system color palette
 */
export const DOCUMENTATION_STATUS_COLORS = {
  [DocumentationStatus.INCOMPLETE]: '#F44336', // Error Red
  [DocumentationStatus.COMPLETE]: '#4CAF50', // Success Green
  [DocumentationStatus.REJECTED]: '#F44336', // Error Red
  [DocumentationStatus.PENDING_REVIEW]: '#FFC107' // Warning Amber
};

/**
 * Color codes for billing status badges and visualizations
 * Following the design system color palette
 */
export const BILLING_STATUS_COLORS = {
  [BillingStatus.UNBILLED]: '#616E7C', // Neutral Dark
  [BillingStatus.READY_FOR_BILLING]: '#0F52BA', // Primary Blue
  [BillingStatus.IN_CLAIM]: '#2196F3', // Info Blue
  [BillingStatus.BILLED]: '#FF6B35', // Accent Orange
  [BillingStatus.PAID]: '#4CAF50', // Success Green
  [BillingStatus.DENIED]: '#F44336', // Error Red
  [BillingStatus.VOID]: '#616E7C' // Neutral Dark
};

/**
 * Column definitions for service data tables
 */
export const SERVICE_TABLE_COLUMNS = [
  { 
    id: 'serviceId',
    label: 'Service ID',
    sortable: true,
    width: '120px'
  },
  { 
    id: 'clientName',
    label: 'Client',
    sortable: true,
    width: '150px'
  },
  { 
    id: 'serviceType',
    label: 'Service Type',
    sortable: true,
    width: '150px'
  },
  { 
    id: 'serviceDate',
    label: 'Date',
    sortable: true,
    width: '100px'
  },
  { 
    id: 'units',
    label: 'Units',
    sortable: true,
    width: '80px'
  },
  { 
    id: 'rate',
    label: 'Rate',
    sortable: true,
    width: '100px'
  },
  { 
    id: 'amount',
    label: 'Amount',
    sortable: true,
    width: '100px'
  },
  { 
    id: 'documentationStatus',
    label: 'Documentation',
    sortable: true,
    width: '140px'
  },
  { 
    id: 'billingStatus',
    label: 'Billing Status',
    sortable: true,
    width: '130px'
  },
  { 
    id: 'program',
    label: 'Program',
    sortable: true,
    width: '150px'
  },
  { 
    id: 'actions',
    label: 'Actions',
    sortable: false,
    width: '120px'
  }
];

/**
 * Standard error messages for service validation errors
 */
export const SERVICE_VALIDATION_ERROR_MESSAGES = {
  MISSING_CLIENT: 'Client is required',
  MISSING_SERVICE_TYPE: 'Service type is required',
  MISSING_SERVICE_CODE: 'Service code is required',
  INVALID_SERVICE_DATE: 'Service date is invalid',
  MISSING_UNITS: 'Units are required',
  INVALID_UNITS: 'Units must be greater than zero',
  MISSING_RATE: 'Rate is required',
  INVALID_RATE: 'Rate must be greater than zero',
  MISSING_PROGRAM: 'Program is required',
  MISSING_AUTHORIZATION: 'Authorization is required for this service',
  EXPIRED_AUTHORIZATION: 'Authorization has expired',
  INSUFFICIENT_AUTHORIZATION: 'Insufficient authorized units available',
  INCOMPLETE_DOCUMENTATION: 'Documentation is incomplete',
  CLIENT_INELIGIBLE: 'Client is not eligible for this service',
  DUPLICATE_SERVICE: 'Duplicate service found for this date and service type'
};

/**
 * Default filter values for service list views
 */
export const DEFAULT_SERVICE_FILTERS = {
  dateRange: {
    startDate: null,
    endDate: null
  },
  programId: null,
  serviceTypeId: null,
  documentationStatus: null,
  billingStatus: null,
  status: 'active',
  search: '',
  pagination: {
    page: 1,
    pageSize: 10
  },
  sort: {
    field: 'serviceDate',
    direction: 'desc'
  }
};

/**
 * Validation schema for service form inputs
 * This is a placeholder that would typically be implemented with a validation
 * library like Yup, Zod, or Joi
 */
export const SERVICE_FORM_VALIDATION_SCHEMA = {
  clientId: {
    required: true,
    errorMessage: 'Client is required'
  },
  serviceTypeId: {
    required: true,
    errorMessage: 'Service type is required'
  },
  serviceCode: {
    required: true,
    errorMessage: 'Service code is required'
  },
  serviceDate: {
    required: true,
    isDate: true,
    errorMessage: 'Valid service date is required'
  },
  units: {
    required: true,
    min: 0.01,
    errorMessage: 'Units must be greater than zero'
  },
  rate: {
    required: true,
    min: 0,
    errorMessage: 'Rate must be greater than or equal to zero'
  },
  programId: {
    required: true,
    errorMessage: 'Program is required'
  }
};

/**
 * Maximum number of services that can be processed in a single batch
 */
export const SERVICE_BATCH_SIZE_LIMIT = 100;

/**
 * Valid documentation status transitions for services in the workflow
 */
export const DOCUMENTATION_STATUS_TRANSITIONS = {
  [DocumentationStatus.INCOMPLETE]: [
    DocumentationStatus.COMPLETE,
    DocumentationStatus.PENDING_REVIEW
  ],
  [DocumentationStatus.COMPLETE]: [
    DocumentationStatus.INCOMPLETE,
    DocumentationStatus.REJECTED
  ],
  [DocumentationStatus.REJECTED]: [
    DocumentationStatus.INCOMPLETE,
    DocumentationStatus.PENDING_REVIEW
  ],
  [DocumentationStatus.PENDING_REVIEW]: [
    DocumentationStatus.COMPLETE,
    DocumentationStatus.REJECTED,
    DocumentationStatus.INCOMPLETE
  ]
};

/**
 * Valid billing status transitions for services in the workflow
 */
export const BILLING_STATUS_TRANSITIONS = {
  [BillingStatus.UNBILLED]: [
    BillingStatus.READY_FOR_BILLING,
    BillingStatus.VOID
  ],
  [BillingStatus.READY_FOR_BILLING]: [
    BillingStatus.IN_CLAIM,
    BillingStatus.UNBILLED,
    BillingStatus.VOID
  ],
  [BillingStatus.IN_CLAIM]: [
    BillingStatus.BILLED,
    BillingStatus.READY_FOR_BILLING,
    BillingStatus.VOID
  ],
  [BillingStatus.BILLED]: [
    BillingStatus.PAID,
    BillingStatus.DENIED,
    BillingStatus.VOID
  ],
  [BillingStatus.PAID]: [
    BillingStatus.VOID
  ],
  [BillingStatus.DENIED]: [
    BillingStatus.READY_FOR_BILLING,
    BillingStatus.VOID
  ],
  [BillingStatus.VOID]: []
};

/**
 * Icon names for documentation status visualization
 */
export const DOCUMENTATION_STATUS_ICONS = {
  [DocumentationStatus.INCOMPLETE]: 'error_outline',
  [DocumentationStatus.COMPLETE]: 'check_circle',
  [DocumentationStatus.REJECTED]: 'cancel',
  [DocumentationStatus.PENDING_REVIEW]: 'hourglass_empty'
};

/**
 * Icon names for billing status visualization
 */
export const BILLING_STATUS_ICONS = {
  [BillingStatus.UNBILLED]: 'pending',
  [BillingStatus.READY_FOR_BILLING]: 'check_circle_outline',
  [BillingStatus.IN_CLAIM]: 'description',
  [BillingStatus.BILLED]: 'send',
  [BillingStatus.PAID]: 'payments',
  [BillingStatus.DENIED]: 'highlight_off',
  [BillingStatus.VOID]: 'block'
};

/**
 * Action identifiers for service operations
 */
export const SERVICE_ACTIONS = {
  VIEW: 'view_service',
  EDIT: 'edit_service',
  DELETE: 'delete_service',
  VALIDATE: 'validate_service',
  UPDATE_DOCUMENTATION: 'update_documentation_status',
  UPDATE_BILLING_STATUS: 'update_billing_status',
  ADD_TO_CLAIM: 'add_to_claim',
  REMOVE_FROM_CLAIM: 'remove_from_claim',
  EXPORT: 'export_service'
};

/**
 * Map service actions to required permissions
 */
export const SERVICE_ACTION_PERMISSIONS = {
  [SERVICE_ACTIONS.VIEW]: 'services:view',
  [SERVICE_ACTIONS.EDIT]: 'services:edit',
  [SERVICE_ACTIONS.DELETE]: 'services:delete',
  [SERVICE_ACTIONS.VALIDATE]: 'services:validate',
  [SERVICE_ACTIONS.UPDATE_DOCUMENTATION]: 'services:update_documentation',
  [SERVICE_ACTIONS.UPDATE_BILLING_STATUS]: 'services:update_billing',
  [SERVICE_ACTIONS.ADD_TO_CLAIM]: 'claims:edit',
  [SERVICE_ACTIONS.REMOVE_FROM_CLAIM]: 'claims:edit',
  [SERVICE_ACTIONS.EXPORT]: 'services:export'
};

/**
 * Map documentation statuses to allowed actions
 */
export const DOCUMENTATION_STATUS_ACTIONS = {
  [DocumentationStatus.INCOMPLETE]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EDIT,
    SERVICE_ACTIONS.DELETE,
    SERVICE_ACTIONS.UPDATE_DOCUMENTATION
  ],
  [DocumentationStatus.COMPLETE]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EDIT,
    SERVICE_ACTIONS.DELETE,
    SERVICE_ACTIONS.UPDATE_DOCUMENTATION,
    SERVICE_ACTIONS.VALIDATE,
    SERVICE_ACTIONS.UPDATE_BILLING_STATUS
  ],
  [DocumentationStatus.REJECTED]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EDIT,
    SERVICE_ACTIONS.DELETE,
    SERVICE_ACTIONS.UPDATE_DOCUMENTATION
  ],
  [DocumentationStatus.PENDING_REVIEW]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.UPDATE_DOCUMENTATION
  ]
};

/**
 * Map billing statuses to allowed actions
 */
export const BILLING_STATUS_ACTIONS = {
  [BillingStatus.UNBILLED]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EDIT,
    SERVICE_ACTIONS.DELETE,
    SERVICE_ACTIONS.VALIDATE,
    SERVICE_ACTIONS.UPDATE_BILLING_STATUS,
    SERVICE_ACTIONS.EXPORT
  ],
  [BillingStatus.READY_FOR_BILLING]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.UPDATE_BILLING_STATUS,
    SERVICE_ACTIONS.ADD_TO_CLAIM,
    SERVICE_ACTIONS.EXPORT
  ],
  [BillingStatus.IN_CLAIM]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.REMOVE_FROM_CLAIM,
    SERVICE_ACTIONS.EXPORT
  ],
  [BillingStatus.BILLED]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EXPORT
  ],
  [BillingStatus.PAID]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EXPORT
  ],
  [BillingStatus.DENIED]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.UPDATE_BILLING_STATUS,
    SERVICE_ACTIONS.EXPORT
  ],
  [BillingStatus.VOID]: [
    SERVICE_ACTIONS.VIEW,
    SERVICE_ACTIONS.EXPORT
  ]
};