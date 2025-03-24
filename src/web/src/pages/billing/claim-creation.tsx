import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Breadcrumbs, 
  Link,
  CircularProgress
} from '@mui/material'; // @mui/material v5.13+
import { Home, NavigateNext } from '@mui/icons-material'; // @mui/icons-material v5.13+
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../components/layout/MainLayout';
import ClaimCreationWizard from '../../components/billing/ClaimCreationWizard';
import useServices from '../../hooks/useServices';
import useClaims from '../../hooks/useClaims';
import useToast from '../../hooks/useToast';
import { BillingStatus } from '../../types/services.types';
import { UUID } from '../../types/common.types';

/**
 * The main page component for claim creation
 * @returns {JSX.Element} The rendered page component
 */
const ClaimCreationPage: React.FC = () => {
  // LD1: Initialize router for navigation
  const router = useRouter();

  // LD1: Extract query parameters from router
  const { serviceIds: serviceIdsQuery } = router.query;

  // LD1: Initialize toast notification hook
  const toast = useToast();

  // LD1: Set up state for selected service IDs
  const [selectedServiceIds, setSelectedServiceIds] = useState<UUID[]>([]);

  // LD1: Initialize useServices hook to fetch and manage services
  const { loading: loadingServices } = useServices();

  // LD1: Initialize useClaims hook for claim operations
  const { createClaim } = useClaims();

  // LD1: Create effect to parse and set selected service IDs from query parameters
  useEffect(() => {
    if (serviceIdsQuery && typeof serviceIdsQuery === 'string') {
      try {
        const parsedServiceIds = JSON.parse(serviceIdsQuery) as UUID[];
        setSelectedServiceIds(parsedServiceIds);
      } catch (error) {
        console.error('Failed to parse serviceIds from query:', error);
        toast.error('Invalid service IDs in URL', { title: 'Error' });
      }
    }
  }, [serviceIdsQuery, toast]);

  // LD1: Define handleComplete function to handle wizard completion
  const handleComplete = useCallback(() => {
    toast.success('Claim creation completed successfully!', { title: 'Success' });
    router.push('/claims');
  }, [router, toast]);

  // LD1: Define handleCancel function to handle wizard cancellation
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // LD1: Render the page with MainLayout component
  return (
    <MainLayout>
      {/* LD1: Include Head component with page title and metadata */}
      <Head>
        <title>Claim Creation - ThinkCaring</title>
        <meta name="description" content="Create a new claim for billing" />
      </Head>

      {/* LD1: Render breadcrumb navigation */}
      <Container maxWidth="xl">
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="/" onClick={(e) => { e.preventDefault(); router.push('/'); }}>
            <Home />
          </Link>
          <Link underline="hover" color="inherit" href="/billing" onClick={(e) => { e.preventDefault(); router.push('/billing'); }}>
            Billing
          </Link>
          <Typography color="text.primary">Claim Creation</Typography>
        </Breadcrumbs>
      </Container>

      {/* LD1: Render page title and description */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Claim Creation
          </Typography>
          <Typography variant="body1">
            Create a new claim by selecting services and providing claim details.
          </Typography>
        </Box>
      </Container>

      {/* LD1: Render ClaimCreationWizard component with selected services and handlers */}
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 3 }}>
          {loadingServices ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : (
            <ClaimCreationWizard
              initialSelectedServices={selectedServiceIds}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          )}
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default ClaimCreationPage;