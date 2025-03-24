import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Paper, Container, Grid, Button, CircularProgress } from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../components/layout/MainLayout';
import StatusTracking from '../../components/claims/StatusTracking';
import useClaims from '../../hooks/useClaims';
import useToast from '../../hooks/useToast';
import { ClaimStatus } from '../../types/claims.types';
import { UUID } from '../../types/common.types';

/**
 * The main page component for claim status tracking
 */
const StatusTrackingPage: React.FC = () => {
  // Initialize router to access query parameters
  const router = useRouter();

  // Initialize toast notification hook for displaying success/error messages
  const toast = useToast();

  // Set up state for selected claim IDs from query parameters
  const [selectedClaimIds, setSelectedClaimIds] = useState<UUID[] | undefined>(undefined);

  // Initialize claims hook with appropriate options for tracking claims
  const { claims, fetchClaims, updateClaimStatus, isLoading } = useClaims({
    autoFetch: false
  });

  // Parse query parameters to extract selected claim IDs
  useEffect(() => {
    if (router.query.claimIds) {
      const claimIds = Array.isArray(router.query.claimIds)
        ? router.query.claimIds.map(id => id as UUID)
        : [router.query.claimIds as UUID];
      setSelectedClaimIds(claimIds);
    } else {
      setSelectedClaimIds(undefined);
    }
  }, [router.query.claimIds]);

  // Set up state for tracking status updates
  const [statusUpdates, setStatusUpdates] = useState<{ [claimId: UUID]: ClaimStatus }>({});

  // Implement handleStatusUpdate callback to handle status updates
  const handleStatusUpdate = useCallback(async (claimId: UUID, newStatus: ClaimStatus) => {
    try {
      // Optimistically update the UI
      setStatusUpdates(prev => ({ ...prev, [claimId]: newStatus }));

      // Call the updateClaimStatus function from the useClaims hook
      await updateClaimStatus(claimId, { status: newStatus, adjudicationDate: null, denialReason: null, denialDetails: null, adjustmentCodes: null, notes: null });

      // Fetch claims to update the UI with the new status
      await fetchClaims();

      // Display success message
      toast.success(`Claim status updated to ${newStatus}`);
    } catch (error: any) {
      // Revert the optimistic update if the API call fails
      setStatusUpdates(prev => {
        const { [claimId]: removed, ...rest } = prev;
        return rest;
      });

      // Display error message
      toast.error(`Failed to update claim status: ${error.message}`);
    }
  }, [fetchClaims, toast, updateClaimStatus]);

  // Use useEffect to update selected claim IDs when query parameters change
  useEffect(() => {
    if (router.query.claimIds) {
      const claimIds = Array.isArray(router.query.claimIds)
        ? router.query.claimIds.map(id => id as UUID)
        : [router.query.claimIds as UUID];
      setSelectedClaimIds(claimIds);
    } else {
      setSelectedClaimIds(undefined);
    }
  }, [router.query.claimIds]);

  return (
    <MainLayout>
      <Head>
        <title>Claim Status Tracking - ThinkCaring</title>
        <meta name="description" content="Track and manage claim statuses" />
      </Head>

      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ padding: 3, mt: 2 }}>
          <Typography variant="h4" gutterBottom>
            Claim Status Tracking
          </Typography>
          <Typography variant="body1">
            Track and manage the status of your claims throughout their lifecycle.
          </Typography>

          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <CircularProgress />
            </Box>
          ) : (
            <StatusTracking selectedClaimIds={selectedClaimIds} onStatusUpdate={handleStatusUpdate} />
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

/**
 * Server-side function to prepare props for the page
 */
export async function getServerSideProps(context: any): Promise<{ props: {} }> {
  // Return empty props object as the page uses client-side data fetching with hooks
  return { props: {} };
}

export default StatusTrackingPage;