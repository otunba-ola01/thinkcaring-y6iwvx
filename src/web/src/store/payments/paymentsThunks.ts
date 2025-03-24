/**
 * Payment Thunks
 * 
 * This file contains async thunks for payment-related operations in the HCBS Revenue Management System.
 * These thunks handle API communication for payment operations including fetching, creating, updating,
 * and deleting payments, as well as handling remittance processing, payment matching, and reconciliation.
 * 
 * @version 1.0.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // v1.9+

import { paymentsApi } from '../../api/payments.api';
import { 
  PaymentQueryParams, 
  CreatePaymentDto, 
  UpdatePaymentDto, 
  ReconcilePaymentDto,
  ImportRemittanceDto,
  PaymentWithRelations,
  RemittanceProcessingResult,
  PaymentMatchingResult,
  AccountsReceivableAging,
  PaymentDashboardMetrics
} from '../../types/payments.types';
import { ApiPaginatedResponse } from '../../types/api.types';
import { UUID } from '../../types/common.types';

/**
 * Fetches a paginated list of payments with optional filtering
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to paginated payment response
 */
export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (params: PaymentQueryParams, { rejectWithValue }) => {
    try {
      const response = await paymentsApi.getPayments(params);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Fetches a single payment by ID with related entities
 * 
 * @param paymentId - The ID of the payment to fetch
 * @returns Promise resolving to payment with related entities
 */
export const fetchPaymentById = createAsyncThunk(
  'payments/fetchPaymentById',
  async (paymentId: UUID, { rejectWithValue }) => {
    try {
      const payment = await paymentsApi.getPayment(paymentId);
      return payment;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Creates a new payment record
 * 
 * @param payment - Payment data for creation
 * @returns Promise resolving to created payment
 */
export const createPayment = createAsyncThunk(
  'payments/createPayment',
  async (payment: CreatePaymentDto, { rejectWithValue }) => {
    try {
      const newPayment = await paymentsApi.createPayment(payment);
      return newPayment;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Updates an existing payment record
 * 
 * @param payload - Object containing payment ID and updated payment data
 * @returns Promise resolving to updated payment
 */
export const updatePayment = createAsyncThunk(
  'payments/updatePayment',
  async ({ id, payment }: { id: UUID, payment: UpdatePaymentDto }, { rejectWithValue }) => {
    try {
      const updatedPayment = await paymentsApi.updatePayment(id, payment);
      return updatedPayment;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Deletes a payment record
 * 
 * @param paymentId - ID of the payment to delete
 * @returns Promise resolving to success status
 */
export const deletePayment = createAsyncThunk(
  'payments/deletePayment',
  async (paymentId: UUID, { rejectWithValue }) => {
    try {
      const result = await paymentsApi.deletePayment(paymentId);
      return { id: paymentId, success: result.success };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Processes a remittance file and creates payment records
 * 
 * @param data - Remittance file and processing options
 * @returns Promise resolving to remittance processing results
 */
export const importRemittance = createAsyncThunk(
  'payments/importRemittance',
  async (data: ImportRemittanceDto, { rejectWithValue }) => {
    try {
      const result = await paymentsApi.processRemittance(data);
      return result;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Matches a payment to specific claims
 * 
 * @param payload - Object containing payment ID and claim IDs to match
 * @returns Promise resolving to payment matching results
 */
export const matchPaymentToClaims = createAsyncThunk(
  'payments/matchPaymentToClaims',
  async ({ paymentId, claimIds }: { paymentId: UUID, claimIds: UUID[] }, { rejectWithValue }) => {
    try {
      // First get suggested matches if no specific claim IDs are provided
      if (!claimIds || claimIds.length === 0) {
        const suggestedMatches = await paymentsApi.getSuggestedMatches(paymentId);
        return suggestedMatches;
      }
      
      // If specific claim IDs are provided, process those claims
      const matchingResult = await paymentsApi.matchPaymentToClaims(paymentId, { claimIds });
      return matchingResult;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Reconciles a payment with claims
 * 
 * @param payload - Object containing payment ID and reconciliation data
 * @returns Promise resolving to reconciled payment
 */
export const reconcilePayment = createAsyncThunk(
  'payments/reconcilePayment',
  async (
    { paymentId, reconcileData }: { paymentId: UUID, reconcileData: ReconcilePaymentDto }, 
    { rejectWithValue }
  ) => {
    try {
      const result = await paymentsApi.reconcilePayment(paymentId, reconcileData);
      return result;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Retrieves accounts receivable aging report
 * 
 * @param params - Optional filtering parameters for the report
 * @returns Promise resolving to accounts receivable aging data
 */
export const fetchAccountsReceivable = createAsyncThunk(
  'payments/fetchAccountsReceivable',
  async (
    { asOfDate, payerId, programId }: { asOfDate?: string, payerId?: UUID, programId?: UUID },
    { rejectWithValue }
  ) => {
    try {
      const { aging } = await paymentsApi.getAgingReport({ asOfDate, payerId, programId });
      
      // Transform the aging data into a format expected by the UI
      const items = [
        ...aging.agingByPayer.map(item => ({
          type: 'payer',
          id: item.payerId,
          name: item.payerName,
          current: item.current,
          days1to30: item.days1to30,
          days31to60: item.days31to60,
          days61to90: item.days61to90,
          days91Plus: item.days91Plus,
          total: item.total
        })),
        ...aging.agingByProgram.map(item => ({
          type: 'program',
          id: item.programId,
          name: item.programName,
          current: item.current,
          days1to30: item.days1to30,
          days31to60: item.days31to60,
          days61to90: item.days61to90,
          days91Plus: item.days91Plus,
          total: item.total
        }))
      ];
      
      const summary = {
        asOfDate: aging.asOfDate,
        totalOutstanding: aging.totalOutstanding,
        current: aging.current,
        days1to30: aging.days1to30,
        days31to60: aging.days31to60,
        days61to90: aging.days61to90,
        days91Plus: aging.days91Plus
      };
      
      return { items, summary };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/**
 * Retrieves payment dashboard metrics for reporting and analytics
 * 
 * @param params - Optional filtering parameters for the metrics
 * @returns Promise resolving to payment dashboard metrics
 */
export const fetchPaymentDashboardMetrics = createAsyncThunk(
  'payments/fetchPaymentDashboardMetrics',
  async (
    { dateRange, programId, payerId, facilityId }: 
    { dateRange?: string, programId?: UUID, payerId?: UUID, facilityId?: UUID },
    { rejectWithValue }
  ) => {
    try {
      const { metrics } = await paymentsApi.getPaymentMetrics({ 
        dateRange, 
        programId, 
        payerId, 
        facilityId 
      });
      return metrics;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);