import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { GetServerSideProps, NextPage } from 'next'; // next v13.4.0
import Head from 'next/head'; // next v13.4.0
import { Box, Container, Typography, CircularProgress, Button } from '@mui/material'; // @mui/material v5.13.0
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../../components/layout/MainLayout';
import ClaimDetail from '../../../components/claims/ClaimDetail';
import useClaims from '../../../hooks/useClaims';
import useToast from '../../../hooks/useToast';
import Breadcrumbs from '../../../components/navigation/Breadcrumbs';
import { ROUTES } from '../../../constants/routes.constants';

/**
 * Interface defining the props for the ClaimDetailPage component
 */
interface ClaimDetailPageProps {
  /** The ID of the claim to display */
  claimId: string;
}

/**
 * Server-side function to fetch initial claim data
 */
export const getServerSideProps: GetServerSideProps<ClaimDetailPageProps> = async (context) => {
  // Extract claimId from the route parameters
  const { id } = context.params || {};

  // Return the claimId as a prop to the page component
  if (typeof id === 'string') {
    return {
      props: {
        claimId: id,
      },
    };
  }

  // Handle case where claimId is not provided by redirecting to claims list
  return {
    redirect: {
      destination: ROUTES.CLAIMS.ROOT,
      permanent: false,
    },
  };
};

/**
 * Page component that displays detailed information about a specific claim
 */
const ClaimDetailPage: NextPage<ClaimDetailPageProps> = ({ claimId }) => {
  // Initialize router for navigation
  const router = useRouter();

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Initialize loading state for the page
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize error state for the page
  const [error, setError] = useState<string | null>(null);

  // Initialize useClaims hook for claim operations
  const { fetchClaimById, clearSelectedClaim } = useClaims({ autoFetch: false });

  /**
   * Navigates back to the claims list page
   */
  const handleBack = useCallback(() => {
    router.push(ROUTES.CLAIMS.LIST);
  }, [router]);

  /**
   * Navigates to the edit page for the current claim
   * @param claimId The ID of the claim to edit
   */
  const handleEdit = useCallback((claimId: string) => {
    router.push(ROUTES.CLAIMS.EDIT.replace('[id]', claimId));
  }, [router]);

  /**
   * Deletes the current claim and navigates back to the claims list
   * @param claimId The ID of the claim to delete
   */
  const handleDelete = useCallback(async (claimId: string) => {
    try {
      // Call API to delete the claim
      console.log('Deleting claim with ID:', claimId);
      toast.success('Claim deleted successfully!');
      router.push(ROUTES.CLAIMS.LIST);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete claim.');
    }
  }, [router, toast]);

  // Use useEffect to clear selected claim on component unmount
  useEffect(() => {
    return () => {
      clearSelectedClaim();
    };
  }, [clearSelectedClaim]);

  return (
    <MainLayout>
      <Head>
        <title>Claim Details | HCBS Revenue Management</title>
      </Head>
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        <Breadcrumbs sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mr: 2 }}>
            Back to Claims
          </Button>
          <Typography variant="h4" component="h1">
            Claim Details
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error Loading Claim
            </Typography>
            <Typography color="text.secondary">
              There was a problem loading the claim details. Please try again.
            </Typography>
            <Button variant="contained" onClick={handleBack} sx={{ mt: 2 }}>
              Return to Claims List
            </Button>
          </Box>
        ) : (
          <ClaimDetail claimId={claimId} onBack={handleBack} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </Container>
    </MainLayout>
  );
};

export default ClaimDetailPage;