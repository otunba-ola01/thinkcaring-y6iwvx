import { createSelector } from '@reduxjs/toolkit'; // @reduxjs/toolkit v1.9+ Create memoized selector functions for efficient state access
import { RootState } from '../index'; // Import the root state type for type-safe selectors
import { PaymentState } from './paymentsSlice'; // Import the payment state interface for type annotations

/**
 * Base selector that returns the entire payments slice from the Redux store
 * @param state 
 * @returns The complete payments state slice
 */
export const selectPaymentsState = (state: RootState): PaymentState => state.payments;

/**
 * Selector for retrieving the list of payments
 * @returns Array List of payment summaries
 */
export const selectPayments = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.payments
);

/**
 * Selector for retrieving the currently selected payment with its relations
 * @returns PaymentWithRelations | null The selected payment or null if none is selected
 */
export const selectSelectedPayment = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.selectedPayment
);

/**
 * Selector for retrieving the pagination metadata for payments list
 * @returns PaginationMeta Pagination metadata including page, pageSize, totalItems, and totalPages
 */
export const selectPaymentsPagination = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.pagination
);

/**
 * Selector for retrieving the loading state of payment operations
 * @returns string Current loading state (IDLE, LOADING, SUCCEEDED, FAILED)
 */
export const selectPaymentsLoading = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.loading
);

/**
 * Selector for retrieving any error message from payment operations
 * @returns string | null Error message or null if no error
 */
export const selectPaymentsError = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.error
);

/**
 * Selector for retrieving the current payment filter criteria
 * @returns PaymentQueryParams Current filter parameters for payments
 */
export const selectPaymentFilters = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.filters
);

/**
 * Selector for retrieving the results of remittance processing
 * @returns RemittanceProcessingResult | null Remittance processing results or null if none available
 */
export const selectRemittanceResult = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.remittanceResult
);

/**
 * Selector for retrieving the results of payment matching
 * @returns PaymentMatchingResult | null Payment matching results or null if none available
 */
export const selectMatchingResult = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.matchingResult
);

/**
 * Selector for retrieving accounts receivable data
 * @returns { items: AccountsReceivableItem[]; summary: AccountsReceivableSummary } | null Accounts receivable data or null if none available
 */
export const selectAccountsReceivable = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.accountsReceivable
);

/**
 * Selector for retrieving payment dashboard metrics
 * @returns PaymentDashboardMetrics | null Payment dashboard metrics or null if none available
 */
export const selectPaymentDashboardMetrics = createSelector(
  [selectPaymentsState],
  (paymentsState) => paymentsState.dashboardMetrics
);

/**
 * Selector that returns a boolean indicating if payments are currently loading
 * @returns boolean True if payments are loading, false otherwise
 */
export const selectIsPaymentsLoading = createSelector(
  [selectPaymentsLoading],
  (loading) => loading === 'LOADING'
);

/**
 * Selector that returns a boolean indicating if there is a payment error
 * @returns boolean True if there is an error, false otherwise
 */
export const selectHasPaymentsError = createSelector(
  [selectPaymentsError],
  (error) => error !== null
);

/**
 * Selector factory that creates a selector for finding a payment by ID
 * @param string paymentId
 * @returns function Memoized selector function that returns the payment with the specified ID or undefined
 */
export const selectPaymentById = (paymentId: string) => createSelector(
  [selectPayments],
  (payments) => payments.find(payment => payment.id === paymentId)
);

/**
 * Selector factory that creates a selector for filtering payments by reconciliation status
 * @param ReconciliationStatus | ReconciliationStatus[] status
 * @returns function Memoized selector function that returns payments with the specified status(es)
 */
export const selectPaymentsByStatus = (status: any) => createSelector(
  [selectPayments],
  (payments) => {
    if (Array.isArray(status)) {
      return payments.filter(payment => status.includes(payment.reconciliationStatus));
    } else {
      return payments.filter(payment => payment.reconciliationStatus === status);
    }
  }
);

/**
 * Selector for retrieving all unreconciled payments
 * @returns Array List of unreconciled payments
 */
export const selectUnreconciledPayments = createSelector(
  [selectPayments],
  (payments) => payments.filter(payment => payment.reconciliationStatus === 'unreconciled')
);

/**
 * Selector for retrieving all partially reconciled payments
 * @returns Array List of partially reconciled payments
 */
export const selectPartiallyReconciledPayments = createSelector(
  [selectPayments],
  (payments) => payments.filter(payment => payment.reconciliationStatus === 'partiallyReconciled')
);

/**
 * Selector for retrieving all fully reconciled payments
 * @returns Array List of fully reconciled payments
 */
export const selectReconciledPayments = createSelector(
  [selectPayments],
  (payments) => payments.filter(payment => payment.reconciliationStatus === 'reconciled')
);

/**
 * Selector for retrieving all payments with reconciliation exceptions
 * @returns Array List of payments with exceptions
 */
export const selectExceptionPayments = createSelector(
  [selectPayments],
  (payments) => payments.filter(payment => payment.reconciliationStatus === 'exception')
);

/**
 * Selector for calculating the total amount of all payments
 * @returns number Sum of all payment amounts
 */
export const selectTotalPaymentsAmount = createSelector(
  [selectPayments],
  (payments) => payments.reduce((total, payment) => total + payment.paymentAmount, 0)
);

/**
 * Selector for calculating the total amount of unreconciled payments
 * @returns number Sum of unreconciled payment amounts
 */
export const selectTotalUnreconciledAmount = createSelector(
  [selectUnreconciledPayments],
  (payments) => payments.reduce((total, payment) => total + payment.paymentAmount, 0)
);

/**
 * Selector for organizing accounts receivable data by aging buckets
 * @returns object Accounts receivable amounts grouped by aging buckets
 */
export const selectAccountsReceivableByAging = createSelector(
  [selectAccountsReceivable],
  (accountsReceivable) => {
    if (!accountsReceivable) {
      return null;
    }

    const { summary } = accountsReceivable;

    if (!summary) {
      return null;
    }

    return {
      current: summary.current,
      days1to30: summary.days1to30,
      days31to60: summary.days31to60,
      days61to90: summary.days61to90,
      days91Plus: summary.days91Plus
    };
  }
);