import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../../components/layout/MainLayout';
import ClaimForm from '../../../components/claims/ClaimForm';
import useClaims from '../../../hooks/useClaims';
import useToast from '../../../hooks/useToast';
import { UUID, LoadingState } from '../../../types/common.types';
import {
  ClaimWithRelations,
  UpdateClaimDto,
} from '../../../types/claims.types';
import { claimsApi } from '../../../api/claims.api';

/**
 * Interface defining the props for the EditClaimPage component
 */
interface EditClaimPageProps {
  claimId: string;
}

/**
 * Server-side function to validate the claim ID parameter
 */
export const getServerSideProps = async (context: any) => {
  const { id: claimId } = context.params;

  // If claimId is not provided, return notFound: true
  if (!claimId) {
    return { notFound: true };
  }

  // Return claimId as a prop to the page component
  return {
    props: { claimId },
  };
};

/**
 * The main page component for editing a claim
 */
const EditClaimPage: React.FC<EditClaimPageProps> = ({ claimId }) => {
  // Initialize router to get claim ID from route parameters
  const router = useRouter();

  // Initialize useClaims hook for claim operations
  const { fetchClaimById, updateClaim, clearSelectedClaim } = useClaims({});

  // Initialize useToast hook for notifications
  const toast = useToast();

  // Set up state for claim data, loading state, and error state
  const [claim, setClaim] = useState<ClaimWithRelations | null>(null);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  // Set up state for clients, payers, and services data needed for the form
  const [clients, setClients] = useState<any[]>([]); // TODO: Replace 'any' with the correct type
  const [payers, setPayers] = useState<any[]>([]); // TODO: Replace 'any' with the correct type
  const [services, setServices] = useState<any[]>([]); // TODO: Replace 'any' with the correct type

  /**
   * Function to fetch claim details
   */
  const fetchClaimData = useCallback(async () => {
    setLoading(LoadingState.LOADING);
    setError(null);

    try {
      // Fetch claim data using the useClaims hook
      const claimData = await fetchClaimById(claimId as UUID);
      if (claimData) {
        setClaim(claimData);
      } else {
        setError('Claim not found');
      }
      setLoading(LoadingState.SUCCESS);
    } catch (e: any) {
      setError(e.message || 'Failed to load claim');
      setLoading(LoadingState.ERROR);
    }
  }, [claimId, fetchClaimById]);

  /**
   * Function to process form submission
   */
  const handleSubmit = useCallback(
    async (data: UpdateClaimDto) => {
      setLoading(LoadingState.LOADING);
      setError(null);

      try {
        // Update claim data using the useClaims hook
        if (claim) {
          await updateClaim(claim.id, data);
          toast.success('Claim updated successfully');
          router.push(`/claims/${claim.id}`);
        } else {
          setError('Claim not found');
        }
        setLoading(LoadingState.SUCCESS);
      } catch (e: any) {
        setError(e.message || 'Failed to update claim');
        setLoading(LoadingState.ERROR);
      }
    },
    [claim, updateClaim, router, toast]
  );

  /**
   * Function to navigate back to claim details page
   */
  const handleCancel = useCallback(() => {
    clearSelectedClaim();
    router.push(`/claims/${claimId}`);
  }, [claimId, router, clearSelectedClaim]);

  // Use useEffect to fetch claim data when the component mounts or claimId changes
  useEffect(() => {
    if (claimId) {
      fetchClaimData();
    }
  }, [claimId, fetchClaimData]);

  // Use useEffect to fetch clients, payers, and services data for the form
  useEffect(() => {
    // Fetch clients
    claimsApi.getAllClaims({}).then((response) => {
      setClients(response.data);
    });

    // Fetch payers
    claimsApi.getAllClaims({}).then((response) => {
      setPayers(response.data);
    });

    // Fetch services
    claimsApi.getAllClaims({}).then((response) => {
      setServices(response.data);
    });
  }, []);

  // Render loading state when claim data is being fetched
  if (loading === LoadingState.LOADING) {
    return (
      <MainLayout>
        <Container>
          <Paper elevation={3} sx={{ padding: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  // Render error state if claim data cannot be loaded
  if (error) {
    return (
      <MainLayout>
        <Container>
          <Alert severity="error">{error}</Alert>
        </Container>
      </MainLayout>
    );
  }

  // Render the page title and breadcrumbs
  return (
    <>
      <Head>
        <title>Edit Claim - ThinkCaring</title>
      </Head>
      <MainLayout>
        <Container>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Claim
          </Typography>
          {/* Render the ClaimForm component with claim data, form dependencies, and handlers */}
          {claim && (
            <ClaimForm
              claim={claim}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              clients={clients}
              payers={payers}
              services={services}
              loading={loading === LoadingState.LOADING}
              error={error}
            />
          )}
        </Container>
      </MainLayout>
    </>
  );
};

export default EditClaimPage;