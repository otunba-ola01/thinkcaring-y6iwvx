import React, { useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Button } from '@mui/material'; // @mui/material v5.13+
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../components/layout/MainLayout';
import BatchClaimProcess from '../../components/claims/BatchClaimProcess';
import Card from '../../components/ui/Card';
import useClaims from '../../hooks/useClaims';
import useToast from '../../hooks/useToast';
import { ClaimBatchResult } from '../../types/claims.types';

/**
 * A page component that provides a batch processing interface for claims
 * @returns {JSX.Element} The rendered BatchClaimsPage component
 */
const BatchClaimsPage: React.FC = () => {
  // Initialize router for navigation
  const router = useRouter();

  // Initialize toast hook for notifications
  const toast = useToast();

  // Initialize useClaims hook for claims management functionality
  const { batchResults, clearBatchResults } = useClaims({});

  /**
   * Handles the completion of the batch claim process
   * @param {ClaimBatchResult} result - The result of the batch claim process
   * @returns {void} No return value
   */
  const handleComplete = useCallback((result: ClaimBatchResult) => {
    // Display success toast notification with summary of batch results
    toast.success(`Batch process completed: ${result.successCount} successful, ${result.errorCount} errors`);

    // Navigate to claims list page after short delay
    setTimeout(() => {
      router.push('/claims');
    }, 1500);
  }, [router, toast]);

  // Use useEffect to clear batch results when component unmounts
  useEffect(() => {
    return () => {
      clearBatchResults();
    };
  }, [clearBatchResults]);

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Set page title and metadata using Head component */}
      <Head>
        <title>Batch Claims - ThinkCaring</title>
        <meta name="description" content="Batch process claims in ThinkCaring" />
      </Head>

      {/* Render page header with title and description */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Batch Claims
        </Typography>
        <Typography variant="body1">
          Process multiple claims simultaneously for efficient billing.
        </Typography>
      </Box>

      {/* Render Card component containing BatchClaimProcess wizard */}
      <Card>
        <BatchClaimProcess onComplete={handleComplete} />
      </Card>
    </MainLayout>
  );
};

export default BatchClaimsPage;