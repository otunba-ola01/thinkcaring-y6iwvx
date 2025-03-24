# src/web/src/pages/payments/reconciliation.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material'; // @mui/material v5.13+
import { ArrowBack } from '@mui/icons-material'; // @mui/icons-material v5.13+

import MainLayout from '../../components/layout/MainLayout';
import ReconciliationForm from '../../components/payments/ReconciliationForm';
import usePayments from '../../hooks/usePayments';
import { claimsApi } from '../../api/claims.api';
import { paymentsApi } from '../../api/payments.api';
import useToast from '../../hooks/useToast';
import { LoadingState } from '../../types/common.types';
import { ReconcilePaymentDto, ClaimSummary } from '../../types/payments.types';

/**
 * Page component for reconciling payments with claims
 */
const PaymentReconciliationPage: React.FC = () => {
  // 1. Initialize router using useRouter hook
  const router = useRouter();

  // 2. Extract paymentId from router query parameters
  const { paymentId } = router.query;
  const paymentIdStr = Array.isArray(paymentId) ? paymentId[0] : paymentId;

  // 3. Initialize toast notifications using useToast hook
  const toast = useToast();

  // 4. Initialize payment-related state and functions using usePayments hook
  const {
    selectedPayment,
    fetchPaymentById,
    reconcilePayment,
    loading,
    error,
    clearSelectedPayment,
  } = usePayments();

  // 5. Initialize state for available claims using useState
  const [availableClaims, setAvailableClaims] = useState<ClaimSummary[]>([]);

  // 6. Initialize state for loading claims using useState
  const [loadingClaims, setLoadingClaims] = useState<boolean>(false);

  // 7. Initialize state for claims error using useState
  const [claimsError, setClaimsError] = useState<string | null>(null);

  // 8. Initialize state for suggested matches using useState
  const [suggestedMatches, setSuggestedMatches] = useState<ClaimSummary[]>([]);

  // 9. Initialize state for loading suggested matches using useState
  const [loadingSuggestedMatches, setLoadingSuggestedMatches] = useState<boolean>(false);

  // 10. Create fetchPaymentData function to load payment details
  const fetchPaymentData = useCallback(async () => {
    if (paymentIdStr) {
      await fetchPaymentById(paymentIdStr);
    }
  }, [fetchPaymentById, paymentIdStr]);

  // 11. Create fetchAvailableClaims function to load claims that can be reconciled
  const fetchAvailableClaims = useCallback(async () => {
    if (selectedPayment) {
      setLoadingClaims(true);
      setClaimsError(null);
      try {
        const response = await claimsApi.getClaimSummaries({
          filters: [
            { field: 'payerId', operator: 'eq', value: selectedPayment.payerId },
            { field: 'claimStatus', operator: 'eq', value: 'submitted' },
          ],
          pagination: { page: 1, pageSize: 100 }, // Adjust pagination as needed
          sort: [],
        });
        setAvailableClaims(response.data);
      } catch (err: any) {
        setClaimsError(err?.message || 'Failed to load available claims');
        toast.showError(err?.message || 'Failed to load available claims');
      } finally {
        setLoadingClaims(false);
      }
    }
  }, [selectedPayment, toast]);

  // 12. Create fetchSuggestedMatches function to get AI-suggested claim matches
  const fetchSuggestedMatches = useCallback(async () => {
    if (selectedPayment) {
      setLoadingSuggestedMatches(true);
      try {
        const response = await paymentsApi.getSuggestedMatches(selectedPayment.id);
        setSuggestedMatches(response.suggestedMatches);
      } catch (err: any) {
        toast.showError(err?.message || 'Failed to load suggested matches');
      } finally {
        setLoadingSuggestedMatches(false);
      }
    }
  }, [selectedPayment, toast]);

  // 13. Create handleReconcile function to process reconciliation submission
  const handleReconcile = async (reconcileData: ReconcilePaymentDto) => {
    if (selectedPayment) {
      await reconcilePayment(selectedPayment.id, reconcileData);
      router.push('/payments'); // Redirect to payments list after successful reconciliation
    }
  };

  // 14. Create handleCancel function to navigate back to payments list
  const handleCancel = () => {
    router.push('/payments');
  };

  // 15. Use useEffect to fetch payment data when paymentId changes
  useEffect(() => {
    if (paymentIdStr) {
      fetchPaymentData();
    }
  }, [paymentIdStr, fetchPaymentData]);

  // 16. Use useEffect to fetch available claims when payment data is loaded
  useEffect(() => {
    if (selectedPayment) {
      fetchAvailableClaims();
    }
  }, [selectedPayment, fetchAvailableClaims]);

  // 17. Use useEffect to fetch suggested matches when payment data is loaded
  useEffect(() => {
    if (selectedPayment) {
      fetchSuggestedMatches();
    }
  }, [selectedPayment, fetchSuggestedMatches]);

  // 18. Use useEffect to clean up selected payment on component unmount
  useEffect(() => {
    return () => {
      clearSelectedPayment();
    };
  }, [clearSelectedPayment]);

  // 19. Render page title and metadata using Next.js Head component
  return (
    <>
      <Head>
        <title>Payment Reconciliation - ThinkCaring</title>
      </Head>

      {/* 20. Render page within MainLayout component */}
      <MainLayout>
        {/* 21. Render page header with title and back button */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back to Payments
          </Button>
          <Typography variant="h5">Payment Reconciliation</Typography>
        </Box>

        {/* 22. Render loading indicator when payment data is loading */}
        {loading === LoadingState.LOADING ? (
          <CircularProgress />
        ) : (
          <>
            {/* 23. Render error message if payment data fails to load */}
            {error && (
              <Alert severity="error">Error: {error}</Alert>
            )}

            {/* 24. Render ReconciliationForm when payment data is available */}
            {selectedPayment && (
              <ReconciliationForm
                payment={selectedPayment}
                claims={availableClaims}
                suggestedMatches={suggestedMatches}
                onSubmit={handleReconcile}
                onCancel={handleCancel}
                loading={loadingClaims || loadingSuggestedMatches}
                error={claimsError}
              />
            )}
          </>
        )}
      </MainLayout>
    </>
  );
};

/**
 * Server-side function to validate request and redirect if needed
 */
export const getServerSideProps = async (context: any) => {
  // 1. Extract query parameters from context
  const { paymentId } = context.query;

  // 2. Check if paymentId exists in query parameters
  if (!paymentId) {
    // 3. If paymentId is missing, return redirect to payments list page
    return {
      redirect: {
        destination: '/payments',
        permanent: false,
      },
    };
  }

  // 4. Otherwise, return empty props object to render the page
  return {
    props: {},
  };
};

export default PaymentReconciliationPage;