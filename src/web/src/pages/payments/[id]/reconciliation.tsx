import React, { useEffect, useState, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { GetServerSideProps } from 'next'; // next v13.4+
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material'; // @mui/material v5.13+
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../../components/layout/MainLayout';
import ReconciliationForm from '../../../components/payments/ReconciliationForm';
import usePayments from '../../../hooks/usePayments';
import useToast from '../../../hooks/useToast';
import { LoadingState } from '../../../types/common.types';
import { PaymentWithRelations, ReconcilePaymentDto } from '../../../types/payments.types';
import { ClaimSummary } from '../../../types/claims.types';

/**
 * The main page component for reconciling a payment with claims
 * @param {object} props - The props passed to the component
 * @returns {JSX.Element} The rendered payment reconciliation page
 */
const PaymentReconciliationPage: React.FC = () => {
  // LD1: Get the router instance using useRouter hook
  const router = useRouter();

  // LD1: Extract the payment ID from the router query parameters
  const { id } = router.query;
  const paymentId = Array.isArray(id) ? id[0] : id;

  // LD1: Initialize the usePayments hook to access payment functionality
  const {
    fetchPaymentById,
    selectedPayment,
    loading,
    error,
    reconcilePayment,
  } = usePayments();

  // LD1: Initialize the useToast hook for displaying notifications
  const { success, error: toastError } = useToast();

  // LD1: Set up state for reconciliation submission loading state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // LD1: Set up state for available claims that can be reconciled
  const [availableClaims, setAvailableClaims] = useState<ClaimSummary[]>([]);

  // LD1: Define a handleSubmit function to process the reconciliation form submission
  const handleSubmit = useCallback(
    async (reconcileData: ReconcilePaymentDto) => {
      setIsSubmitting(true);
      try {
        if (paymentId) {
          await reconcilePayment(paymentId, reconcileData);
          success('Payment reconciled successfully!');
          router.push(`/payments/${paymentId}`); // Redirect to payment detail page
        } else {
          toastError('Payment ID is missing.');
        }
      } catch (err: any) {
        toastError(err?.message || 'Failed to reconcile payment.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [paymentId, reconcilePayment, success, toastError, router]
  );

  // LD1: Define a handleCancel function to navigate back to the payment detail page
  const handleCancel = useCallback(() => {
    if (paymentId) {
      router.push(`/payments/${paymentId}`);
    } else {
      router.push('/payments'); // Navigate to payments list if no ID
    }
  }, [paymentId, router]);

  // LD1: Use useEffect to fetch payment data when the component mounts or ID changes
  useEffect(() => {
    if (paymentId) {
      fetchPaymentById(paymentId);
    }
  }, [paymentId, fetchPaymentById]);

  // LD1: Use useEffect to extract available claims from the payment data when it's loaded
  useEffect(() => {
    if (selectedPayment && selectedPayment.claimPayments) {
      const claims = selectedPayment.claimPayments.map((cp) => cp.claim);
      setAvailableClaims(claims);
    }
  }, [selectedPayment]);

  // LD1: Render loading state when payment data is being fetched
  if (loading === LoadingState.LOADING) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  // LD1: Render error state if there was an error fetching the payment
  if (error) {
    return (
      <MainLayout>
        <Alert severity="error">{error}</Alert>
      </MainLayout>
    );
  }

  // LD1: Render not found state if the payment doesn't exist
  if (!selectedPayment) {
    return (
      <MainLayout>
        <Alert severity="warning">Payment not found</Alert>
      </MainLayout>
    );
  }

  // LD1: Render the reconciliation form when data is available
  return (
    <MainLayout>
      <Head>
        <title>Payment Reconciliation - ThinkCaring</title>
      </Head>
      <Typography variant="h4" gutterBottom>
        Payment Reconciliation
      </Typography>
      <ReconciliationForm
        payment={selectedPayment}
        claims={availableClaims}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={isSubmitting}
        error={error}
      />
    </MainLayout>
  );
};

/**
 * LD1: Server-side function to pre-fetch payment data
 * @param {object} context - The context object containing request parameters
 * @returns {Promise<{ props: { initialPaymentId: string } }>} The props to pass to the page component
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  // LD1: Extract the payment ID from the context params
  const { id } = context.params;
  const paymentId = Array.isArray(id) ? id[0] : id;

  // LD1: Return the payment ID as a prop to the page component
  return {
    props: {
      initialPaymentId: paymentId || null,
    },
  };
};

// LD1: Export the payment reconciliation page component as the default export
export default PaymentReconciliationPage;