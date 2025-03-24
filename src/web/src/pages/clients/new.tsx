import React, { useState, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+
import { Box, Typography, Container, Paper, Breadcrumbs, Link } from '@mui/material'; // @mui/material v5.13+

import MainLayout from '../../components/layout/MainLayout';
import ClientForm from '../../components/clients/ClientForm';
import useClients from '../../hooks/useClients';
import useToast from '../../hooks/useToast';
import { ROUTES } from '../../constants/routes.constants';
import { CreateClientDto } from '../../types/clients.types';
import { LoadingState } from '../../types/common.types';

/**
 * Page component for creating a new client
 * @returns {JSX.Element} The rendered NewClientPage component
 */
const NewClientPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Get client management functions and loading state from useClients hook
  const { addClient, loading } = useClients();

  /**
   * Handles the submission of the client creation form
   * @param {CreateClientDto} clientData
   * @returns {Promise<void>}
   */
  const handleSubmit = useCallback(async (clientData: CreateClientDto): Promise<void> => {
    try {
      // Call addClient API function with client data
      const newClient = await addClient(clientData);

      if (newClient) {
        // If successful, show success toast notification
        toast.success('Client created successfully');

        // Navigate to the newly created client's detail page
        router.push(ROUTES.CLIENTS.DETAIL.replace('[id]', newClient.id));
      } else {
        toast.error('Failed to create client');
      }
    } catch (error: any) {
      // If error occurs, show error toast notification
      toast.error(error?.message || 'Failed to create client');

      // Log error details to console
      console.error('Error creating client:', error);
    }
  }, [addClient, router, toast]);

  /**
   * Handles cancellation of client creation
   * @returns {void}
   */
  const handleCancel = useCallback(() => {
    // Navigate back to clients list page
    router.push(ROUTES.CLIENTS.ROOT);
  }, [router]);

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Include page title and metadata using Head component */}
      <Head>
        <title>New Client | ThinkCaring</title>
      </Head>

      {/* Render page header with title and breadcrumbs navigation */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          New Client
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href={ROUTES.DASHBOARD.ROOT}>
            Dashboard
          </Link>
          <Link underline="hover" color="inherit" href={ROUTES.CLIENTS.ROOT}>
            Clients
          </Link>
          <Typography color="text.primary">New Client</Typography>
        </Breadcrumbs>
      </Box>

      {/* Render ClientForm component with submit and cancel handlers */}
      <ClientForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading === LoadingState.LOADING} />
    </MainLayout>
  );
};

// Export the NewClientPage component as the default export
export default NewClientPage;