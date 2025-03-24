import { useCallback, useEffect, useState } from 'react'; // v18.2.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux
import { useToast } from '../hooks/useToast'; // Custom hook for displaying toast notifications
import { LoadingState } from '../types/common.types'; // Enum for tracking loading states
import {
  Payment,
  PaymentWithRelations,
  PaymentSummary,
  PaymentQueryParams,
  CreatePaymentDto,
  UpdatePaymentDto,
  ImportRemittanceDto,
  ReconcilePaymentRequest,
  RemittanceProcessingResult,
  PaymentMatchingResult,
  AccountsReceivableItem,
  AccountsReceivableSummary,
  PaymentDashboardMetrics,
} from '../types/payments.types'; // Type definitions for payment-related data structures
import { PaginationMeta, UUID } from '../types/common.types'; // Common type definitions
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
  fetchPaymentDashboardMetrics,
} from '../store/payments/paymentsThunks'; // Redux thunks for payment-related operations
import {
  setPaymentFilters,
  resetPaymentFilters,
  clearSelectedPayment,
  clearRemittanceResult,
  clearMatchingResult,
  clearAccountsReceivable,
} from '../store/payments/paymentsSlice'; // Redux actions for payment state management
import {
  selectPayments,
  selectSelectedPayment,
  selectPaymentsPagination,
  selectPaymentsLoading,
  selectPaymentsError,
  selectPaymentFilters,
  selectPaymentDashboardMetrics,
  selectRemittanceResult,
  selectMatchingResult,
  selectAccountsReceivable,
  selectIsPaymentsLoading,
} from '../store/payments/paymentsSelectors'; // Redux selectors for accessing payment state

/**
 * Custom hook for managing payment-related operations and state
 *
 * @returns An object containing payment state and functions for payment operations
 */
const usePayments = () => {
  // Initialize Redux dispatch and toast notification
  const dispatch = useDispatch();
  const { success, error } = useToast();

  // Select payment-related state from Redux store
  const payments = useSelector(selectPayments);
  const selectedPayment = useSelector(selectSelectedPayment);
  const pagination = useSelector(selectPaymentsPagination);
  const loading = useSelector(selectPaymentsLoading);
  const isLoading = useSelector(selectIsPaymentsLoading);
  const paymentError = useSelector(selectPaymentsError);
  const filters = useSelector(selectPaymentFilters);
  const dashboardMetrics = useSelector(selectPaymentDashboardMetrics);
  const remittanceResult = useSelector(selectRemittanceResult);
  const matchingResult = useSelector(selectMatchingResult);
  const accountsReceivable = useSelector(selectAccountsReceivable);

  // Define function to fetch payments with optional filters
  const fetchPaymentsData = useCallback(
    (params?: PaymentQueryParams) => {
      dispatch(fetchPayments(params || filters));
    },
    [dispatch, filters]
  );

  // Define function to fetch a specific payment by ID
  const fetchPaymentByIdData = useCallback(
    (paymentId: UUID) => {
      dispatch(fetchPaymentById(paymentId));
    },
    [dispatch]
  );

  // Define function to create a new payment
  const createPaymentData = useCallback(
    (payment: CreatePaymentDto) => {
      return dispatch(createPayment(payment))
        .unwrap()
        .then(() => {
          success('Payment created successfully');
        })
        .catch((err: any) => {
          error(err?.message || 'Failed to create payment');
        });
    },
    [dispatch, success, error]
  );

  // Define function to update an existing payment
  const updatePaymentData = useCallback(
    (id: UUID, payment: UpdatePaymentDto) => {
      return dispatch(updatePayment({ id, payment }))
        .unwrap()
        .then(() => {
          success('Payment updated successfully');
        })
        .catch((err: any) => {
          error(err?.message || 'Failed to update payment');
        });
    },
    [dispatch, success, error]
  );

  // Define function to delete a payment
  const deletePaymentData = useCallback(
    (paymentId: UUID) => {
      return dispatch(deletePayment(paymentId))
        .unwrap()
        .then(() => {
          success('Payment deleted successfully');
        })
        .catch((err: any) => {
          error(err?.message || 'Failed to delete payment');
        });
    },
    [dispatch, success, error]
  );

  // Define function to import and process a remittance advice file
  const importRemittanceData = useCallback(
    (data: ImportRemittanceDto) => {
      return dispatch(importRemittance(data))
        .unwrap()
        .then(() => {
          success('Remittance processed successfully');
        })
        .catch((err: any) => {
          error(err?.message || 'Failed to process remittance');
        });
    },
    [dispatch, success, error]
  );

  // Define function to match a payment to claims
  const matchPayment = useCallback(
    (paymentId: UUID, claimIds: UUID[]) => {
      return dispatch(matchPaymentToClaims({ paymentId, claimIds }))
        .unwrap()
        .then(() => {
          success('Payment matched to claims successfully');
        })
        .catch((err: any) => {
          error(err?.message || 'Failed to match payment to claims');
        });
    },
    [dispatch, success, error]
  );

  // Define function to reconcile a payment
  const reconcilePaymentData = useCallback(
    (paymentId: UUID, reconcileData: ReconcilePaymentRequest) => {
      return dispatch(reconcilePayment({ paymentId, reconcileData }))
        .unwrap()
        .then(() => {
          success('Payment reconciled successfully');
        })
        .catch((err: any) => {
          error(err?.message || 'Failed to reconcile payment');
        });
    },
    [dispatch, success, error]
  );

  // Define function to fetch accounts receivable data
  const fetchAccountsReceivableData = useCallback(
    (asOfDate?: string, payerId?: UUID, programId?: UUID) => {
      dispatch(fetchAccountsReceivable({ asOfDate, payerId, programId }));
    },
    [dispatch]
  );

  // Define function to fetch payment dashboard metrics
  const fetchPaymentDashboardMetricsData = useCallback(
    (dateRange?: string, programId?: UUID, payerId?: UUID, facilityId?: UUID) => {
      dispatch(fetchPaymentDashboardMetrics({ dateRange, programId, payerId, facilityId }));
    },
    [dispatch]
  );

  // Define function to update payment filters
  const updateFilters = useCallback(
    (newFilters: Partial<PaymentQueryParams>) => {
      dispatch(setPaymentFilters(newFilters));
    },
    [dispatch]
  );

  // Define function to reset payment filters
  const resetFilters = useCallback(() => {
    dispatch(resetPaymentFilters());
  }, [dispatch]);

  // Define function to clear the selected payment
  const clearSelectedPaymentData = useCallback(() => {
    dispatch(clearSelectedPayment());
  }, [dispatch]);

  // Define function to clear remittance processing results
  const clearRemittanceResultData = useCallback(() => {
    dispatch(clearRemittanceResult());
  }, [dispatch]);

  // Define function to clear payment matching results
  const clearMatchingResultData = useCallback(() => {
    dispatch(clearMatchingResult());
  }, [dispatch]);

  // Define function to clear accounts receivable data
  const clearAccountsReceivableData = useCallback(() => {
    dispatch(clearAccountsReceivable());
  }, [dispatch]);

  // Return object with all payment state and functions
  return {
    payments,
    selectedPayment,
    pagination,
    loading,
    isLoading,
    error: paymentError,
    filters,
    dashboardMetrics,
    remittanceResult,
    matchingResult,
    accountsReceivable,
    fetchPayments: fetchPaymentsData,
    fetchPaymentById: fetchPaymentByIdData,
    createPayment: createPaymentData,
    updatePayment: updatePaymentData,
    deletePayment: deletePaymentData,
    importRemittance: importRemittanceData,
    matchPayment: matchPayment,
    reconcilePayment: reconcilePaymentData,
    fetchAccountsReceivable: fetchAccountsReceivableData,
    fetchPaymentDashboardMetrics: fetchPaymentDashboardMetricsData,
    updateFilters,
    resetFilters,
    clearSelectedPayment: clearSelectedPaymentData,
    clearRemittanceResult: clearRemittanceResultData,
    clearMatchingResult: clearMatchingResultData,
    clearAccountsReceivable: clearAccountsReceivableData,
  };
};

export default usePayments;