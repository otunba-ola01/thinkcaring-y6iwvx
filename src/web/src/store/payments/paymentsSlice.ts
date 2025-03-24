/**
 * Payments Slice
 * 
 * Redux slice for payment management in the HCBS Revenue Management System.
 * Manages state for payment data, including lists, selected payment details,
 * loading states, errors, filters, remittance processing results, payment matching
 * results, accounts receivable data, and dashboard metrics.
 * 
 * @version 1.0.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9+

import { 
  PaymentSummary, 
  PaymentWithRelations, 
  PaymentQueryParams,
  PaymentDashboardMetrics,
  RemittanceProcessingResult,
  PaymentMatchingResult,
  AccountsReceivableItem,
  AccountsReceivableSummary,
  ReconciliationStatus
} from '../../types/payments.types';
import { PaginationMeta } from '../../types/api.types';
import { 
  fetchPayments,
  fetchPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  importRemittance,
  matchPaymentToClaims,
  reconcilePayment,
  fetchAccountsReceivable,
  fetchPaymentDashboardMetrics
} from './paymentsThunks';

/**
 * Enum-like type for tracking loading states
 */
export const LoadingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed'
} as const;

export type LoadingState = typeof LoadingState[keyof typeof LoadingState];

/**
 * Interface defining the shape of the payments slice in the Redux store
 */
export interface PaymentState {
  payments: PaymentSummary[];
  selectedPayment: PaymentWithRelations | null;
  pagination: PaginationMeta;
  loading: LoadingState;
  error: string | null;
  filters: PaymentQueryParams;
  remittanceResult: RemittanceProcessingResult | null;
  matchingResult: PaymentMatchingResult | null;
  accountsReceivable: {
    items: AccountsReceivableItem[];
    summary: AccountsReceivableSummary;
  } | null;
  dashboardMetrics: PaymentDashboardMetrics | null;
}

/**
 * Initial state for the payments slice
 */
export const initialPaymentsState: PaymentState = {
  payments: [],
  selectedPayment: null,
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0
  },
  loading: LoadingState.IDLE,
  error: null,
  filters: {
    pagination: {
      page: 1,
      pageSize: 10
    },
    sort: {
      field: 'paymentDate',
      direction: 'desc'
    },
    filters: [],
    search: '',
    payerId: '',
    reconciliationStatus: [],
    paymentMethod: [],
    dateRange: {
      startDate: null,
      endDate: null
    },
    includeRemittance: false
  },
  remittanceResult: null,
  matchingResult: null,
  accountsReceivable: null,
  dashboardMetrics: null
};

/**
 * Create the payments slice with reducers and extra reducers for async actions
 */
const paymentsSlice = createSlice({
  name: 'payments',
  initialState: initialPaymentsState,
  reducers: {
    /**
     * Sets the currently selected payment
     */
    setSelectedPayment: (state, action: PayloadAction<PaymentWithRelations>) => {
      state.selectedPayment = action.payload;
    },
    
    /**
     * Clears the currently selected payment
     */
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
    
    /**
     * Updates the payment filter criteria
     */
    setPaymentFilters: (state, action: PayloadAction<Partial<PaymentQueryParams>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    
    /**
     * Resets payment filters to default values
     */
    resetPaymentFilters: (state) => {
      state.filters = initialPaymentsState.filters;
    },
    
    /**
     * Clears remittance processing results
     */
    clearRemittanceResult: (state) => {
      state.remittanceResult = null;
    },
    
    /**
     * Clears payment matching results
     */
    clearMatchingResult: (state) => {
      state.matchingResult = null;
    },
    
    /**
     * Resets the entire payments state to initial values
     */
    resetPaymentsState: () => initialPaymentsState
  },
  extraReducers: (builder) => {
    // Handle fetchPayments thunk
    builder.addCase(fetchPayments.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(fetchPayments.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.payments = action.payload.data;
      state.pagination = {
        page: action.payload.meta.page,
        pageSize: action.payload.meta.pageSize,
        totalItems: action.payload.meta.totalItems,
        totalPages: action.payload.meta.totalPages
      };
    });
    builder.addCase(fetchPayments.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle fetchPaymentById thunk
    builder.addCase(fetchPaymentById.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(fetchPaymentById.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.selectedPayment = action.payload;
    });
    builder.addCase(fetchPaymentById.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle createPayment thunk
    builder.addCase(createPayment.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(createPayment.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.selectedPayment = action.payload;
      state.payments.unshift({
        id: action.payload.id,
        payerId: action.payload.payerId,
        payerName: action.payload.payer.name,
        paymentDate: action.payload.paymentDate,
        paymentAmount: action.payload.paymentAmount,
        paymentMethod: action.payload.paymentMethod,
        referenceNumber: action.payload.referenceNumber,
        reconciliationStatus: action.payload.reconciliationStatus,
        claimCount: action.payload.claimPayments?.length || 0
      });
    });
    builder.addCase(createPayment.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle updatePayment thunk
    builder.addCase(updatePayment.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(updatePayment.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.selectedPayment = action.payload;
      
      // Update in the payments array if it exists
      const index = state.payments.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.payments[index] = {
          id: action.payload.id,
          payerId: action.payload.payerId,
          payerName: action.payload.payer.name,
          paymentDate: action.payload.paymentDate,
          paymentAmount: action.payload.paymentAmount,
          paymentMethod: action.payload.paymentMethod,
          referenceNumber: action.payload.referenceNumber,
          reconciliationStatus: action.payload.reconciliationStatus,
          claimCount: action.payload.claimPayments?.length || 0
        };
      }
    });
    builder.addCase(updatePayment.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle deletePayment thunk
    builder.addCase(deletePayment.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(deletePayment.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.payments = state.payments.filter(p => p.id !== action.payload.id);
      
      // Clear selected payment if it matches the deleted one
      if (state.selectedPayment && state.selectedPayment.id === action.payload.id) {
        state.selectedPayment = null;
      }
    });
    builder.addCase(deletePayment.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle importRemittance thunk
    builder.addCase(importRemittance.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
      state.remittanceResult = null;
    });
    builder.addCase(importRemittance.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.remittanceResult = action.payload;
      
      // Update selected payment if the remittance result includes payment data
      if (action.payload.payment) {
        state.selectedPayment = action.payload.payment;
        
        // Update in the payments array if it exists
        const index = state.payments.findIndex(p => p.id === action.payload.payment.id);
        if (index !== -1) {
          state.payments[index] = {
            id: action.payload.payment.id,
            payerId: action.payload.payment.payerId,
            payerName: action.payload.payment.payer.name,
            paymentDate: action.payload.payment.paymentDate,
            paymentAmount: action.payload.payment.paymentAmount,
            paymentMethod: action.payload.payment.paymentMethod,
            referenceNumber: action.payload.payment.referenceNumber,
            reconciliationStatus: action.payload.payment.reconciliationStatus,
            claimCount: action.payload.payment.claimPayments?.length || 0
          };
        }
      }
    });
    builder.addCase(importRemittance.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle matchPaymentToClaims thunk
    builder.addCase(matchPaymentToClaims.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
      state.matchingResult = null;
    });
    builder.addCase(matchPaymentToClaims.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.matchingResult = action.payload;
    });
    builder.addCase(matchPaymentToClaims.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle reconcilePayment thunk
    builder.addCase(reconcilePayment.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(reconcilePayment.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      
      // Update the selected payment if the action.payload contains payment data
      if (action.payload.payment) {
        state.selectedPayment = action.payload.payment;
        
        // Update in the payments array if it exists
        const index = state.payments.findIndex(p => p.id === action.payload.payment.id);
        if (index !== -1) {
          state.payments[index] = {
            id: action.payload.payment.id,
            payerId: action.payload.payment.payerId,
            payerName: action.payload.payment.payer.name,
            paymentDate: action.payload.payment.paymentDate,
            paymentAmount: action.payload.payment.paymentAmount,
            paymentMethod: action.payload.payment.paymentMethod,
            referenceNumber: action.payload.payment.referenceNumber,
            reconciliationStatus: action.payload.payment.reconciliationStatus,
            claimCount: action.payload.payment.claimPayments?.length || 0
          };
        }
      }
    });
    builder.addCase(reconcilePayment.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle fetchAccountsReceivable thunk
    builder.addCase(fetchAccountsReceivable.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(fetchAccountsReceivable.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.accountsReceivable = action.payload;
    });
    builder.addCase(fetchAccountsReceivable.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });

    // Handle fetchPaymentDashboardMetrics thunk
    builder.addCase(fetchPaymentDashboardMetrics.pending, (state) => {
      state.loading = LoadingState.LOADING;
      state.error = null;
    });
    builder.addCase(fetchPaymentDashboardMetrics.fulfilled, (state, action) => {
      state.loading = LoadingState.SUCCEEDED;
      state.dashboardMetrics = action.payload;
    });
    builder.addCase(fetchPaymentDashboardMetrics.rejected, (state, action) => {
      state.loading = LoadingState.FAILED;
      state.error = action.payload?.error?.message || action.error?.message || 'An unknown error occurred';
    });
  }
});

export const paymentsActions = paymentsSlice.actions;
export default paymentsSlice.reducer;
export { initialPaymentsState };