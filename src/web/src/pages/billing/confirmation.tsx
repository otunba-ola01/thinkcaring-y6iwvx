import React, { useEffect, useState } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import {
  Box,
  Container,
  Typography,
  CircularProgress,
} from '@mui/material'; // @mui/material v5.13.0
import { useSelector, useDispatch } from 'react-redux'; // react-redux v8.0.5
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../components/layout/MainLayout';
import SubmissionConfirmation from '../../components/billing/SubmissionConfirmation';
import { BillingSubmissionResponse } from '../../types/billing.types';
import useApiRequest from '../../hooks/useApiRequest';
import { billingApi } from '../../api/billing.api';

/**
 * Interface for the expected query parameters in the URL
 */
interface ConfirmationQueryParams {
  success: string;
  confirmationNumber: string;
  submissionDate: string;
  claimId: string;
  message: string;
}

/**
 * Page component that displays claim submission confirmation details
 *
 * @returns {JSX.Element} The rendered confirmation page
 */
const BillingConfirmationPage: React.FC = () => {
  // LD1: Initialize router to access query parameters
  const router = useRouter();

  // LD1: Initialize state for submission result
  const [submissionResult, setSubmissionResult] = useState<BillingSubmissionResponse | null>(null);

  // LD1: Get submission result from URL query parameters if available
  useEffect(() => {
    if (router.isReady) {
      const { success, confirmationNumber, submissionDate, claimId, message } =
        router.query as ConfirmationQueryParams;

      if (success && confirmationNumber && submissionDate && claimId) {
        setSubmissionResult({
          success: success === 'true',
          confirmationNumber,
          submissionDate,
          claimId,
          message,
          validationResult: null, // Assuming validation result is not passed in query params
        });
      }
    }
  }, [router.isReady, router.query]);

  // LD1: If query parameters don't contain submission data, try to get it from Redux store
  // const submissionResultFromStore = useSelector((state: RootState) => state.billing.submissionResult);
  // useEffect(() => {
  //   if (!submissionResult && submissionResultFromStore) {
  //     setSubmissionResult(submissionResultFromStore);
  //   }
  // }, [submissionResult, submissionResultFromStore]);

  // LD1: Handle navigation back to dashboard
  const onBackToDashboard = () => {
    router.push('/billing');
  };

  // LD1: Render the page with MainLayout wrapper
  return (
    <MainLayout>
      {/* LD1: Set page title using Next.js Head component */}
      <Head>
        <title>Claim Submission Confirmation</title>
      </Head>

      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          {/* LD1: Display loading indicator if submission result is not yet available */}
          {!submissionResult ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
              <Typography variant="h6" sx={{ ml: 2 }}>Loading confirmation details...</Typography>
            </Box>
          ) : (
            <>
              {/* LD1: Display error message if there was an error retrieving submission data */}
              {submissionResult.success === false ? (
                <Typography color="error">
                  An error occurred while retrieving submission details.
                </Typography>
              ) : (
                /* LD1: Render SubmissionConfirmation component with submission result when available */
                /* LD1: Pass onBackToDashboard handler to the SubmissionConfirmation component */
                <SubmissionConfirmation
                  submissionResult={submissionResult}
                  onBackToDashboard={onBackToDashboard}
                />
              )}
            </>
          )}
        </Box>
      </Container>
    </MainLayout>
  );
};

// LD1: Export the BillingConfirmationPage component as the default export
export default BillingConfirmationPage;