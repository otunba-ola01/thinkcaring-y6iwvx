import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Box, Typography, Button, Breadcrumbs, Link, CircularProgress } from '@mui/material'; // @mui/material v5.13.0
import { Add as AddIcon } from '@mui/icons-material'; // @mui/icons-material v5.11.16
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../../components/layout/MainLayout';
import ClaimList from '../../../components/claims/ClaimList';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import useClients from '../../../hooks/useClients';
import useClaims from '../../../hooks/useClaims';
import useToast from '../../../hooks/useToast';
import { buildRoute } from '../../../constants/routes.constants';

/**
 * Page component that displays claims associated with a specific client
 */
const ClientClaimsPage: React.FC = () => {
  // LD1: Initialize router to access the client ID from the URL
  const router = useRouter();

  // LD1: Extract the client ID from router.query.id
  const { id: clientIdFromUrl } = router.query;
  const clientId = typeof clientIdFromUrl === 'string' ? clientIdFromUrl : '';

  // LD1: Initialize state for the client data
  const [client, setClient] = useState<any>(null);

  // LD1: Initialize state for loading status
  const [loading, setLoading] = useState<boolean>(true);

  // LD1: Initialize state for active tab
  const [activeTab, setActiveTab] = useState('claims');

  // LD1: Initialize useClients hook to fetch client data
  const { getClientById } = useClients();

  // LD1: Initialize useClaims hook with the client ID to fetch client-specific claims
  const { fetchClaims } = useClaims({ clientId });

  // LD1: Initialize useToast hook for error notifications
  const toast = useToast();

  // LD1: Use useEffect to fetch client data when the ID is available
  useEffect(() => {
    if (clientId) {
      setLoading(true);
      getClientById(clientId)
        .then((clientData) => {
          if (clientData) {
            setClient(clientData);
          } else {
            toast.showError('Failed to load client data.');
          }
        })
        .catch((error) => {
          console.error('Error fetching client:', error);
          toast.showError('Failed to load client data.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [clientId, getClientById, toast]);

  // LD1: Define handleTabChange function to update the active tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Additional logic to load data based on the selected tab can be added here
  };

  // LD1: Define handleCreateClaim function to navigate to the new claim page with client ID
  const handleCreateClaim = () => {
    router.push(buildRoute('/claims/new', { clientId }));
  };

  // LD1: Render the MainLayout component as the page wrapper
  return (
    <MainLayout>
      {/* LD1: Add Head component with page title */}
      <Head>
        <title>Client Claims - ThinkCaring</title>
      </Head>

      {/* LD1: Render page header with client name and breadcrumb navigation */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {loading ? 'Loading...' : client ? `${client.firstName} ${client.lastName} - Claims` : 'Client Claims'}
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="/clients">
            Clients
          </Link>
          <Typography color="text.primary">Claims</Typography>
        </Breadcrumbs>
      </Box>

      {/* LD1: Render Tabs component for client detail navigation (Info, Services, Claims, Authorizations) */}
      <Tabs
        tabs={[
          { label: 'Info', value: 'info' },
          { label: 'Services', value: 'services' },
          { label: 'Claims', value: 'claims' },
          { label: 'Authorizations', value: 'authorizations' },
        ]}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* LD1: Render a Card component containing the ClaimList */}
      <Card
        title="Claims"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClaim}>
            Create Claim
          </Button>
        }
      >
        {/* LD1: Pass the client ID to the ClaimList component */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : client ? (
          <ClaimList clientId={clientId} />
        ) : (
          <Typography variant="body1">Could not load client claims.</Typography>
        )}
      </Card>
    </MainLayout>
  );
};

// LD1: Show loading indicator when data is being fetched

// LD1: Show error message if client data cannot be loaded

// IE3: Export the ClientClaimsPage component as the default export
export default ClientClaimsPage;