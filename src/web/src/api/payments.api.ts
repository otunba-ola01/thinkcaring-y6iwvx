import { apiClient } from './client';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  PaymentQueryParams,
  CreatePaymentDto,
  UpdatePaymentDto,
  ReconcilePaymentDto,
  ImportRemittanceDto,
  Payment,
  PaymentWithRelations,
  PaymentSummary,
  RemittanceProcessingResult,
  ReconciliationResult,
  PaymentMetrics,
  AccountsReceivableAging
} from '../types/payments.types';
import { ApiPaginatedResponse } from '../types/api.types';
import { UUID } from '../types/common.types';

/**
 * Retrieves a payment by its ID with related entities
 * 
 * @param id - Payment ID
 * @returns Promise resolving to payment with related entities
 */
const getPayment = async (id: UUID): Promise<PaymentWithRelations> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${id}`;
  const response = await apiClient.get<PaymentWithRelations>(url);
  return response;
};

/**
 * Retrieves a paginated list of payments with optional filtering
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated payment summaries
 */
const getPayments = async (params: PaymentQueryParams): Promise<ApiPaginatedResponse<PaymentSummary>> => {
  const response = await apiClient.get<ApiPaginatedResponse<PaymentSummary>>(API_ENDPOINTS.PAYMENTS.BASE, params);
  return response;
};

/**
 * Creates a new payment record
 * 
 * @param payment - Payment data for creation
 * @returns Promise resolving to created payment
 */
const createPayment = async (payment: CreatePaymentDto): Promise<PaymentWithRelations> => {
  const response = await apiClient.post<PaymentWithRelations>(API_ENDPOINTS.PAYMENTS.BASE, payment);
  return response;
};

/**
 * Updates an existing payment record
 * 
 * @param id - Payment ID to update
 * @param payment - Updated payment data
 * @returns Promise resolving to updated payment
 */
const updatePayment = async (id: UUID, payment: UpdatePaymentDto): Promise<PaymentWithRelations> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${id}`;
  const response = await apiClient.put<PaymentWithRelations>(url, payment);
  return response;
};

/**
 * Deletes a payment record
 * 
 * @param id - Payment ID to delete
 * @returns Promise resolving to success status
 */
const deletePayment = async (id: UUID): Promise<{ success: boolean }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${id}`;
  const response = await apiClient.del<{ success: boolean }>(url);
  return response;
};

/**
 * Processes a remittance file and creates payment records
 * 
 * @param data - Remittance file and processing options
 * @returns Promise resolving to remittance processing results
 */
const processRemittance = async (data: ImportRemittanceDto): Promise<RemittanceProcessingResult> => {
  const url = API_ENDPOINTS.PAYMENTS.REMITTANCE;
  
  const response = await apiClient.uploadFile<RemittanceProcessingResult>({
    url,
    file: data.file,
    fieldName: 'file',
    additionalData: {
      payerId: data.payerId,
      fileType: data.fileType,
      mappingConfig: data.mappingConfig ? JSON.stringify(data.mappingConfig) : null
    }
  });
  
  return response;
};

/**
 * Gets suggested claim matches for a payment
 * 
 * @param paymentId - Payment ID to get matches for
 * @returns Promise resolving to payment and suggested matches
 */
const getSuggestedMatches = async (paymentId: UUID): Promise<{
  payment: PaymentWithRelations,
  suggestedMatches: Array<{ claimId: UUID, confidence: number, amount: number }>
}> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${paymentId}${API_ENDPOINTS.PAYMENTS.MATCH.replace(':id', '')}`;
  const response = await apiClient.get<{
    payment: PaymentWithRelations,
    suggestedMatches: Array<{ claimId: UUID, confidence: number, amount: number }>
  }>(url);
  return response;
};

/**
 * Reconciles a payment with claims
 * 
 * @param paymentId - Payment ID to reconcile
 * @param reconcileData - Claim payment mapping data for reconciliation
 * @returns Promise resolving to reconciliation results
 */
const reconcilePayment = async (paymentId: UUID, reconcileData: ReconcilePaymentDto): Promise<ReconciliationResult> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${paymentId}${API_ENDPOINTS.PAYMENTS.RECONCILE.replace(':id', '')}`;
  const response = await apiClient.post<ReconciliationResult>(url, reconcileData);
  return response;
};

/**
 * Gets detailed reconciliation information for a payment
 * 
 * @param paymentId - Payment ID
 * @returns Promise resolving to payment and reconciliation details
 */
const getReconciliationDetails = async (paymentId: UUID): Promise<{
  payment: PaymentWithRelations,
  reconciliationDetails: any
}> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${paymentId}/reconciliation`;
  const response = await apiClient.get<{
    payment: PaymentWithRelations,
    reconciliationDetails: any
  }>(url);
  return response;
};

/**
 * Undoes a previous reconciliation
 * 
 * @param paymentId - Payment ID to undo reconciliation for
 * @returns Promise resolving to payment with updated reconciliation status
 */
const undoReconciliation = async (paymentId: UUID): Promise<PaymentWithRelations> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${paymentId}/undo-reconciliation`;
  const response = await apiClient.post<PaymentWithRelations>(url);
  return response;
};

/**
 * Reconciles multiple payments in a batch operation
 * 
 * @param batchData - Array of payment IDs and their reconciliation data
 * @returns Promise resolving to batch reconciliation results
 */
const batchReconcilePayments = async (
  batchData: Array<{ paymentId: UUID, reconcileData: ReconcilePaymentDto }>
): Promise<{
  successful: UUID[],
  failed: Array<{ paymentId: UUID, error: string }>,
  results: ReconciliationResult[]
}> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/batch-reconcile`;
  const response = await apiClient.post<{
    successful: UUID[],
    failed: Array<{ paymentId: UUID, error: string }>,
    results: ReconciliationResult[]
  }>(url, batchData);
  return response;
};

/**
 * Automatically reconciles a payment using intelligent matching algorithms
 * 
 * @param paymentId - Payment ID to auto-reconcile
 * @param matchThreshold - Optional confidence threshold for matching (0-100)
 * @returns Promise resolving to auto-reconciliation results
 */
const autoReconcilePayment = async (
  paymentId: UUID,
  matchThreshold?: number
): Promise<ReconciliationResult> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${paymentId}/auto-reconcile`;
  const data = matchThreshold !== undefined ? { matchThreshold } : {};
  const response = await apiClient.post<ReconciliationResult>(url, data);
  return response;
};

/**
 * Gets adjustments associated with a payment
 * 
 * @param paymentId - Payment ID to get adjustments for
 * @returns Promise resolving to payment and adjustments
 */
const getAdjustmentsForPayment = async (paymentId: UUID): Promise<{
  payment: PaymentWithRelations,
  adjustments: any[]
}> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/${paymentId}/adjustments`;
  const response = await apiClient.get<{
    payment: PaymentWithRelations,
    adjustments: any[]
  }>(url);
  return response;
};

/**
 * Analyzes adjustment trends over time and by payer
 * 
 * @param params - Filter parameters for the analysis
 * @returns Promise resolving to adjustment trends data
 */
const getAdjustmentTrends = async (params: {
  dateRange?: string,
  payerId?: UUID,
  programId?: UUID
}): Promise<{ trends: any[] }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/adjustments/trends`;
  const response = await apiClient.get<{ trends: any[] }>(url, params);
  return response;
};

/**
 * Analyzes claim denials based on adjustment codes
 * 
 * @param params - Filter parameters for the analysis
 * @returns Promise resolving to denial analysis data
 */
const getDenialAnalysis = async (params: {
  dateRange?: string,
  payerId?: UUID,
  programId?: UUID
}): Promise<{ analysis: any }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/denials/analysis`;
  const response = await apiClient.get<{ analysis: any }>(url, params);
  return response;
};

/**
 * Generates an accounts receivable aging report
 * 
 * @param params - Filter parameters for the report
 * @returns Promise resolving to aging report data
 */
const getAgingReport = async (params: {
  asOfDate?: string,
  payerId?: UUID,
  programId?: UUID
}): Promise<{ aging: AccountsReceivableAging }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/aging`;
  const response = await apiClient.get<{ aging: AccountsReceivableAging }>(url, params);
  return response;
};

/**
 * Gets a list of outstanding claims that need follow-up
 * 
 * @param params - Filter parameters for outstanding claims
 * @returns Promise resolving to outstanding claims data
 */
const getOutstandingClaims = async (params: {
  minAge?: number,
  payerId?: UUID,
  programId?: UUID
}): Promise<{ claims: any[] }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/outstanding-claims`;
  const response = await apiClient.get<{ claims: any[] }>(url, params);
  return response;
};

/**
 * Gets a list of unreconciled payments that need attention
 * 
 * @param params - Filter parameters for unreconciled payments
 * @returns Promise resolving to unreconciled payments data
 */
const getUnreconciledPayments = async (params: {
  minAge?: number,
  payerId?: UUID
}): Promise<{ payments: PaymentSummary[] }> => {
  const url = API_ENDPOINTS.PAYMENTS.UNRECONCILED;
  const response = await apiClient.get<{ payments: PaymentSummary[] }>(url, params);
  return response;
};

/**
 * Generates a prioritized list of claims for collection follow-up
 * 
 * @returns Promise resolving to collection work list data
 */
const generateCollectionWorkList = async (): Promise<{ workList: any[] }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/collection-worklist`;
  const response = await apiClient.get<{ workList: any[] }>(url);
  return response;
};

/**
 * Retrieves payment metrics for dashboard and reporting
 * 
 * @param params - Filter parameters for metrics
 * @returns Promise resolving to payment metrics data
 */
const getPaymentMetrics = async (params: {
  dateRange?: string,
  programId?: UUID,
  payerId?: UUID,
  facilityId?: UUID
}): Promise<{ metrics: PaymentMetrics }> => {
  const url = `${API_ENDPOINTS.PAYMENTS.BASE}/metrics`;
  const response = await apiClient.get<{ metrics: PaymentMetrics }>(url, params);
  return response;
};

export const paymentsApi = {
  getPayment,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  processRemittance,
  getSuggestedMatches,
  reconcilePayment,
  getReconciliationDetails,
  undoReconciliation,
  batchReconcilePayments,
  autoReconcilePayment,
  getAdjustmentsForPayment,
  getAdjustmentTrends,
  getDenialAnalysis,
  getAgingReport,
  getOutstandingClaims,
  getUnreconciledPayments,
  generateCollectionWorkList,
  getPaymentMetrics
};