import { ClaimStatus, DenialReason, SubmissionMethod, ClaimType } from '../types/claims.types';

/**
 * API endpoints for claim operations
 */
export const CLAIM_API_ENDPOINTS = {
  BASE: '/api/claims',
  GET_CLAIM: '/api/claims/:id',
  CREATE_CLAIM: '/api/claims',
  UPDATE_CLAIM: '/api/claims/:id',
  DELETE_CLAIM: '/api/claims/:id',
  VALIDATE_CLAIM: '/api/claims/:id/validate',
  BATCH_VALIDATE: '/api/claims/batch/validate',
  SUBMIT_CLAIM: '/api/claims/:id/submit',
  BATCH_SUBMIT: '/api/claims/batch/submit',
  VALIDATE_AND_SUBMIT: '/api/claims/:id/validate-and-submit',
  BATCH_VALIDATE_AND_SUBMIT: '/api/claims/batch/validate-and-submit',
  RESUBMIT_CLAIM: '/api/claims/:id/resubmit',
  UPDATE_STATUS: '/api/claims/:id/status',
  GET_STATUS: '/api/claims/:id/status',
  REFRESH_STATUS: '/api/claims/:id/refresh-status',
  BATCH_REFRESH_STATUS: '/api/claims/batch/refresh-status',
  GET_BY_STATUS: '/api/claims/status/:status',
  GET_AGING: '/api/claims/aging',
  GET_TIMELINE: '/api/claims/:id/timeline',
  VOID_CLAIM: '/api/claims/:id/void',
  APPEAL_CLAIM: '/api/claims/:id/appeal',
  CREATE_ADJUSTMENT: '/api/claims/:id/adjustment',
  GET_LIFECYCLE: '/api/claims/:id/lifecycle',
  GET_METRICS: '/api/claims/metrics',
};

/**
 * Human-readable labels for claim status values
 */
export const CLAIM_STATUS_LABELS = {
  [ClaimStatus.DRAFT]: 'Draft',
  [ClaimStatus.VALIDATED]: 'Validated',
  [ClaimStatus.SUBMITTED]: 'Submitted',
  [ClaimStatus.ACKNOWLEDGED]: 'Acknowledged',
  [ClaimStatus.PENDING]: 'Pending',
  [ClaimStatus.PAID]: 'Paid',
  [ClaimStatus.PARTIAL_PAID]: 'Partially Paid',
  [ClaimStatus.DENIED]: 'Denied',
  [ClaimStatus.APPEALED]: 'Appealed',
  [ClaimStatus.VOID]: 'Void',
  [ClaimStatus.FINAL_DENIED]: 'Final Denied',
};

/**
 * Color codes for claim status badges and visualizations based on design system
 */
export const CLAIM_STATUS_COLORS = {
  [ClaimStatus.DRAFT]: '#9E9E9E', // Grey
  [ClaimStatus.VALIDATED]: '#2196F3', // Blue
  [ClaimStatus.SUBMITTED]: '#FF9800', // Orange
  [ClaimStatus.ACKNOWLEDGED]: '#9C27B0', // Purple
  [ClaimStatus.PENDING]: '#FFC107', // Amber
  [ClaimStatus.PAID]: '#4CAF50', // Green
  [ClaimStatus.PARTIAL_PAID]: '#8BC34A', // Light Green
  [ClaimStatus.DENIED]: '#F44336', // Red
  [ClaimStatus.APPEALED]: '#E91E63', // Pink
  [ClaimStatus.VOID]: '#616E7C', // Dark Grey
  [ClaimStatus.FINAL_DENIED]: '#B71C1C', // Dark Red
};

/**
 * Human-readable labels for claim type values
 */
export const CLAIM_TYPE_LABELS = {
  [ClaimType.ORIGINAL]: 'Original',
  [ClaimType.ADJUSTMENT]: 'Adjustment',
  [ClaimType.REPLACEMENT]: 'Replacement',
  [ClaimType.VOID]: 'Void',
};

/**
 * Human-readable labels for claim submission method values
 */
export const SUBMISSION_METHOD_LABELS = {
  [SubmissionMethod.ELECTRONIC]: 'Electronic',
  [SubmissionMethod.PAPER]: 'Paper',
  [SubmissionMethod.PORTAL]: 'Portal',
  [SubmissionMethod.CLEARINGHOUSE]: 'Clearinghouse',
  [SubmissionMethod.DIRECT]: 'Direct',
};

/**
 * Human-readable labels for claim denial reason values
 */
export const DENIAL_REASON_LABELS = {
  [DenialReason.DUPLICATE_CLAIM]: 'Duplicate Claim',
  [DenialReason.SERVICE_NOT_COVERED]: 'Service Not Covered',
  [DenialReason.AUTHORIZATION_MISSING]: 'Authorization Missing',
  [DenialReason.AUTHORIZATION_INVALID]: 'Authorization Invalid',
  [DenialReason.CLIENT_INELIGIBLE]: 'Client Ineligible',
  [DenialReason.PROVIDER_INELIGIBLE]: 'Provider Ineligible',
  [DenialReason.TIMELY_FILING]: 'Timely Filing',
  [DenialReason.INVALID_CODING]: 'Invalid Coding',
  [DenialReason.MISSING_INFORMATION]: 'Missing Information',
  [DenialReason.OTHER]: 'Other',
};

/**
 * Column definitions for claim data tables
 */
export const CLAIM_TABLE_COLUMNS = [
  { id: 'claimNumber', label: 'Claim #', sortable: true },
  { id: 'clientName', label: 'Client', sortable: true },
  { id: 'serviceDate', label: 'Service Date', sortable: true },
  { id: 'totalAmount', label: 'Amount', sortable: true },
  { id: 'claimStatus', label: 'Status', sortable: true },
  { id: 'payerName', label: 'Payer', sortable: true },
  { id: 'claimAge', label: 'Age', sortable: true, width: '80px' },
  { id: 'submissionDate', label: 'Submitted', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false, width: '120px' },
];

/**
 * Standard error messages for claim validation errors
 */
export const CLAIM_VALIDATION_ERROR_MESSAGES = {
  MISSING_CLIENT: 'Client information is required',
  MISSING_PAYER: 'Payer information is required',
  MISSING_SERVICES: 'At least one service must be selected',
  INVALID_SERVICE_DATES: 'Service dates are invalid or inconsistent',
  MISSING_AUTHORIZATION: 'Service authorization is required',
  EXPIRED_AUTHORIZATION: 'Service authorization has expired',
  INSUFFICIENT_AUTHORIZATION: 'Insufficient units in service authorization',
  CLIENT_INELIGIBLE: 'Client is not eligible for this service',
  INCOMPLETE_DOCUMENTATION: 'Service documentation is incomplete',
  DUPLICATE_CLAIM: 'A claim for this service already exists',
  TIMELY_FILING_RISK: 'Service date exceeds timely filing limits',
  INVALID_PROCEDURE_CODE: 'Invalid procedure code for this service',
  INVALID_DIAGNOSIS_CODE: 'Invalid diagnosis code',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
};

/**
 * Standard error messages for claim submission errors
 */
export const CLAIM_SUBMISSION_ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Claim validation failed. Please fix the errors and try again.',
  INVALID_STATUS: 'Claim cannot be submitted in its current status.',
  CLEARINGHOUSE_ERROR: 'An error occurred while communicating with the clearinghouse.',
  PAYER_CONNECTION_ERROR: 'Unable to connect to the payer system.',
  SUBMISSION_TIMEOUT: 'The submission request timed out. Please try again.',
  DUPLICATE_SUBMISSION: 'This claim has already been submitted.',
};

/**
 * Define aging buckets for claim aging reports
 */
export const CLAIM_AGING_BUCKETS = [
  { label: '0-30 days', minDays: 0, maxDays: 30, color: '#4CAF50' },
  { label: '31-60 days', minDays: 31, maxDays: 60, color: '#8BC34A' },
  { label: '61-90 days', minDays: 61, maxDays: 90, color: '#FFC107' },
  { label: '91-120 days', minDays: 91, maxDays: 120, color: '#FF9800' },
  { label: '120+ days', minDays: 121, maxDays: null, color: '#F44336' },
];

/**
 * Default filter values for claim list views
 */
export const DEFAULT_CLAIM_FILTERS = {
  status: null,
  dateRange: {
    startDate: null,
    endDate: null,
  },
  payerId: null,
  programId: null,
  clientId: null,
  search: '',
};

/**
 * Validation schema for claim form inputs
 * This is a placeholder for the actual validation schema implementation
 * that would be used with a form validation library like Yup or Zod
 */
export const CLAIM_FORM_VALIDATION_SCHEMA = {};

/**
 * Maximum number of claims that can be processed in a single batch
 */
export const CLAIM_BATCH_SIZE_LIMIT = 100;

/**
 * Valid status transitions for claims in the workflow
 * Maps each status to an array of statuses it can transition to
 */
export const CLAIM_STATUS_TRANSITIONS = {
  [ClaimStatus.DRAFT]: [ClaimStatus.VALIDATED, ClaimStatus.VOID],
  [ClaimStatus.VALIDATED]: [ClaimStatus.SUBMITTED, ClaimStatus.DRAFT, ClaimStatus.VOID],
  [ClaimStatus.SUBMITTED]: [ClaimStatus.ACKNOWLEDGED, ClaimStatus.DENIED, ClaimStatus.VOID],
  [ClaimStatus.ACKNOWLEDGED]: [ClaimStatus.PENDING, ClaimStatus.DENIED, ClaimStatus.VOID],
  [ClaimStatus.PENDING]: [ClaimStatus.PAID, ClaimStatus.PARTIAL_PAID, ClaimStatus.DENIED, ClaimStatus.VOID],
  [ClaimStatus.PAID]: [ClaimStatus.VOID],
  [ClaimStatus.PARTIAL_PAID]: [ClaimStatus.PAID, ClaimStatus.VOID],
  [ClaimStatus.DENIED]: [ClaimStatus.APPEALED, ClaimStatus.FINAL_DENIED, ClaimStatus.VOID],
  [ClaimStatus.APPEALED]: [ClaimStatus.PENDING, ClaimStatus.FINAL_DENIED, ClaimStatus.VOID],
  [ClaimStatus.VOID]: [],
  [ClaimStatus.FINAL_DENIED]: [ClaimStatus.VOID],
};

/**
 * Icon names for claim status visualization
 * Uses Material Icons naming convention
 */
export const CLAIM_STATUS_ICONS = {
  [ClaimStatus.DRAFT]: 'edit_note',
  [ClaimStatus.VALIDATED]: 'check_circle',
  [ClaimStatus.SUBMITTED]: 'send',
  [ClaimStatus.ACKNOWLEDGED]: 'receipt',
  [ClaimStatus.PENDING]: 'hourglass_empty',
  [ClaimStatus.PAID]: 'payments',
  [ClaimStatus.PARTIAL_PAID]: 'attach_money',
  [ClaimStatus.DENIED]: 'cancel',
  [ClaimStatus.APPEALED]: 'gavel',
  [ClaimStatus.VOID]: 'delete',
  [ClaimStatus.FINAL_DENIED]: 'block',
};

/**
 * Action identifiers for claim operations
 */
export const CLAIM_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  VALIDATE: 'validate',
  SUBMIT: 'submit',
  RESUBMIT: 'resubmit',
  VOID: 'void',
  APPEAL: 'appeal',
  CREATE_ADJUSTMENT: 'createAdjustment',
  REFRESH_STATUS: 'refreshStatus',
  UPDATE_STATUS: 'updateStatus',
  PRINT: 'print',
  EXPORT: 'export',
};

/**
 * Map claim actions to required permissions
 */
export const CLAIM_ACTION_PERMISSIONS = {
  [CLAIM_ACTIONS.VIEW]: 'claims:view',
  [CLAIM_ACTIONS.EDIT]: 'claims:edit',
  [CLAIM_ACTIONS.VALIDATE]: 'claims:validate',
  [CLAIM_ACTIONS.SUBMIT]: 'claims:submit',
  [CLAIM_ACTIONS.RESUBMIT]: 'claims:submit',
  [CLAIM_ACTIONS.VOID]: 'claims:void',
  [CLAIM_ACTIONS.APPEAL]: 'claims:appeal',
  [CLAIM_ACTIONS.CREATE_ADJUSTMENT]: 'claims:adjust',
  [CLAIM_ACTIONS.REFRESH_STATUS]: 'claims:status',
  [CLAIM_ACTIONS.UPDATE_STATUS]: 'claims:status',
  [CLAIM_ACTIONS.PRINT]: 'claims:view',
  [CLAIM_ACTIONS.EXPORT]: 'claims:export',
};

/**
 * Map claim statuses to allowed actions
 */
export const CLAIM_STATUS_ACTIONS = {
  [ClaimStatus.DRAFT]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.EDIT,
    CLAIM_ACTIONS.VALIDATE,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.VALIDATED]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.EDIT,
    CLAIM_ACTIONS.SUBMIT,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.SUBMITTED]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.REFRESH_STATUS,
    CLAIM_ACTIONS.UPDATE_STATUS,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.ACKNOWLEDGED]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.REFRESH_STATUS,
    CLAIM_ACTIONS.UPDATE_STATUS,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.PENDING]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.REFRESH_STATUS,
    CLAIM_ACTIONS.UPDATE_STATUS,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.PAID]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.CREATE_ADJUSTMENT,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.PARTIAL_PAID]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.CREATE_ADJUSTMENT,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.DENIED]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.APPEAL,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.APPEALED]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.REFRESH_STATUS,
    CLAIM_ACTIONS.UPDATE_STATUS,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.VOID]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
  [ClaimStatus.FINAL_DENIED]: [
    CLAIM_ACTIONS.VIEW,
    CLAIM_ACTIONS.VOID,
    CLAIM_ACTIONS.PRINT,
    CLAIM_ACTIONS.EXPORT,
  ],
};