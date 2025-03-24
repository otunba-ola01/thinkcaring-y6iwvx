import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Typography, Box, Button, CircularProgress, Container } from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../components/layout/MainLayout';
import ClaimForm from '../../components/claims/ClaimForm';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import useToast from '../../hooks/useToast';
import useApiRequest from '../../hooks/useApiRequest';
import { claimsApi } from '../../api/claims.api';
import { fetchClients } from '../../api/clients.api';
import { fetchServices, fetchServicesByClientId } from '../../api/services.api';
import { CreateClaimDto, ClaimType } from '../../types/claims.types';
import Card from '../../components/ui/Card';
import { getServerSession } from 'next-auth';

/**
 * Page component for creating a new claim
 * @returns {JSX.Element} The rendered NewClaimPage component
 */
const NewClaimPage: React.FC = () => {
  // Initialize router for navigation
  const router = useRouter();

  // Initialize toast notification hook
  const toast = useToast();

  // Set up state for clients, payers, and services data
  const [clients, setClients] = useState([]);
  const [payers, setPayers] = useState([]);
  const [services, setServices] = useState([]);

  // Set up state for loading states
  const [clientsLoading, setClientsLoading] = useState(true);
  const [payersLoading, setPayersLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Set up state for error handling
  const [clientsError, setClientsError] = useState(null);
  const [payersError, setPayersError] = useState(null);
  const [servicesError, setServicesError] = useState(null);

  // Use useApiRequest hook to fetch clients with loading and error handling
  useEffect(() => {
    fetchClients({})
      .then((response) => {
        if (response && response.items) {
          setClients(response.items);
        } else {
          toast.error('Failed to fetch clients');
        }
        setClientsLoading(false);
      })
      .catch((err) => {
        setClientsError(err);
        toast.error('Error fetching clients: ' + err.message);
        setClientsLoading(false);
      });
  }, [toast]);

  // Use useApiRequest hook to fetch payers with loading and error handling
  useEffect(() => {
    // Mock payer data for now
    const mockPayers = [
      { id: '1', name: 'Medicaid' },
      { id: '2', name: 'Medicare' },
      { id: '3', name: 'Private Pay' },
    ];
    setPayers(mockPayers);
    setPayersLoading(false);
  }, []);

  // Use useApiRequest hook to fetch services with loading and error handling
  useEffect(() => {
    fetchServices({})
      .then((response) => {
        if (response && response.items) {
          setServices(response.items);
        } else {
          toast.error('Failed to fetch services');
        }
        setServicesLoading(false);
      })
      .catch((err) => {
        setServicesError(err);
        toast.error('Error fetching services: ' + err.message);
        setServicesLoading(false);
      });
  }, [toast]);

  // Create function to handle form submission
  const handleFormSubmit = async (data: CreateClaimDto) => {
    try {
      // Call the createClaim API function
      await claimsApi.createClaim(data);

      // Show success notification
      toast.success('Claim created successfully!');

      // Navigate back to the claims list page
      router.push('/claims');
    } catch (error: any) {
      // Show error notification
      toast.error('Failed to create claim: ' + error.message);
    }
  };

  // Create function to handle cancellation and navigation back to claims list
  const handleCancel = () => {
    router.push('/claims');
  };

  // Render page with MainLayout component
  return (
    <MainLayout>
      <Head>
        <title>New Claim - HCBS Revenue Management</title>
      </Head>
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom>
          New Claim
        </Typography>
        <Breadcrumbs />

        {/* Render loading indicator while data is being fetched */}
        {clientsLoading || payersLoading || servicesLoading ? (
          <CircularProgress />
        ) : // Render error message if data fetching fails
        clientsError || payersError || servicesError ? (
          <Typography color="error">
            Error: {clientsError?.message || payersError?.message || servicesError?.message}
          </Typography>
        ) : (
          // Render ClaimForm component with fetched data and handlers
          <ClaimForm
            clients={clients}
            payers={payers}
            services={services}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            loading={false}
            error={null}
          />
        )}

        {/* Render cancel button to return to claims list */}
        <Button variant="contained" color="primary" onClick={handleCancel}>
          Cancel
        </Button>
      </Container>
    </MainLayout>
  );
};

export default NewClaimPage;