import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material'; // @mui/material v5.13.0
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // @mui/icons-material v5.13.0
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../../components/layout/MainLayout';
import ClientForm from '../../../components/clients/ClientForm';
import useClients from '../../../hooks/useClients';
import useToast from '../../../hooks/useToast';
import { UpdateClientDto } from '../../../types/clients.types';
import { LoadingState } from '../../../types/common.types';
import { ROUTES } from '../../../constants/routes.constants';

/**
 * Page component for editing an existing client
 * @returns {JSX.Element} Rendered edit client page
 */
const EditClientPage: React.FC = () => {
  // Get router instance to access the client ID from URL parameters
  const router = useRouter();
  const { id } = router.query;

  // Initialize state for client data and loading state
  const [clientId, setClientId] = useState<string | null>(null);

  // Initialize toast notification hooks
  const toast = useToast();

  // Initialize client API hooks from useClients
  const { getClientById, editClient, loading, error, selectedClient } = useClients();

  // Fetch client data by ID when component mounts or ID changes
  useEffect(() => {
    if (id && typeof id === 'string') {
      setClientId(id);
      getClientById(id);
    }
  }, [id, getClientById]);

  // Handle form submission to update client data
  const handleEditClient = useCallback(async (clientDto: UpdateClientDto) => {
    if (clientId) {
      try {
        await editClient(clientId, clientDto);
        toast.showSuccess('Client updated successfully');
        router.push(ROUTES.CLIENTS.DETAIL.replace('[id]', clientId));
      } catch (err) {
        toast.showError('Failed to update client');
      }
    }
  }, [clientId, editClient, router, toast]);

  // Handle navigation back to client details page
  const handleCancel = useCallback(() => {
    if (clientId) {
      router.push(ROUTES.CLIENTS.DETAIL.replace('[id]', clientId));
    } else {
      router.push(ROUTES.CLIENTS.ROOT);
    }
  }, [clientId, router]);

  // Render page with appropriate loading states
  if (loading === LoadingState.LOADING) {
    return (
      <MainLayout>
        <Head>
          <title>Edit Client | ThinkCaring</title>
        </Head>
        <Container maxWidth="xl">
          <Paper elevation={3} sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress />
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Head>
          <title>Edit Client | ThinkCaring</title>
        </Head>
        <Container maxWidth="xl">
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <Typography variant="h6" color="error">
              Error: {error}
            </Typography>
            <Button onClick={() => router.back()}>Go Back</Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  // Render ClientForm component with client data and submission handler
  return (
    <MainLayout>
      <Head>
        <title>Edit Client | ThinkCaring</title>
      </Head>
      <Container maxWidth="xl">
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            Back to Client Details
          </Button>
        </Box>
        {/* Render ClientForm component with client data and submission handler */}
        {selectedClient && (
          <ClientForm
            client={selectedClient}
            onSubmit={handleEditClient}
            onCancel={handleCancel}
            loading={loading === LoadingState.LOADING}
            error={error}
          />
        )}
      </Container>
    </MainLayout>
  );
};

export default EditClientPage;