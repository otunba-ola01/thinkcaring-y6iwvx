import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+
import { Typography, Box, Container, Paper } from '@mui/material'; // @mui/material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ServiceForm from '../../components/services/ServiceForm';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import useServices from '../../hooks/useServices';
import useClients from '../../hooks/useClients';
import useToast from '../../hooks/useToast';
import { CreateServiceDto, ServiceType, DocumentationStatus } from '../../types/services.types';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Page component for creating a new service
 * @returns {JSX.Element} The rendered page component
 */
const NewServicePage: React.FC = () => {
  // 1. Initialize the router using useRouter hook
  const router = useRouter();

  // 2. Initialize the toast notification hook using useToast
  const toast = useToast();

  // 3. Initialize the services hook with createService function
  const { createService, isCreating } = useServices();

  // 4. Initialize the clients hook to fetch client data
  const { clients, fetchClientsList } = useClients({ autoLoad: false });

  // 5. Set up state for loading status and service type options
  const [loading, setLoading] = useState(false);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<
    { value: ServiceType; label: string }[]
  >([]);

  // 6. Set up state for program options and staff options
  const [programOptions, setProgramOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [staffOptions, setStaffOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // 7. Use useEffect to fetch clients when the component mounts
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClientsList()])
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load data');
        setLoading(false);
      });
  }, [fetchClientsList, toast]);

  // 8. Create handleServiceSubmit function to process form submission
  const handleServiceSubmit = useCallback(
    async (serviceData: CreateServiceDto) => {
      try {
        // Try to create a new service using the createService function from useServices hook
        const newService = await createService(serviceData);

        if (newService) {
          // If successful, show a success toast notification
          toast.success('Service created successfully');

          // Navigate to the services list page or the newly created service detail page
          router.push(`${ROUTES.SERVICES.ROOT}/${newService.id}`);
        } else {
          toast.error('Failed to create service');
        }
      } catch (err: any) {
        // If an error occurs, show an error toast notification
        toast.error(err.message || 'Failed to create service');

        // Log the error to the console
        console.error(err);
      }
    },
    [createService, router, toast]
  );

  // 9. Create handleCancel function to navigate back to services list
  const handleCancel = useCallback(() => {
    router.push(ROUTES.SERVICES.ROOT);
  }, [router]);

  // 10. Render the page with MainLayout component
  return (
    <MainLayout>
      {/* 11. Add Head component with page title and metadata */}
      <Head>
        <title>New Service | ThinkCaring</title>
        <meta name="description" content="Create a new service" />
      </Head>

      {/* 12. Render Breadcrumbs component for navigation context */}
      <Breadcrumbs />

      {/* 13. Render page title and description */}
      <Container maxWidth="xl">
        <Typography variant="h4" component="h1" gutterBottom>
          New Service
        </Typography>
        <Typography variant="body1" paragraph>
          Enter the details for the new service below.
        </Typography>

        {/* 14. Render ServiceForm component with necessary props */}
        <ServiceForm
          onSubmit={handleServiceSubmit}
          onCancel={handleCancel}
          clients={
            clients
              ? clients.map((client) => ({
                  value: client.id,
                  label: `${client.lastName}, ${client.firstName}`,
                }))
              : []
          }
          serviceTypes={
            Object.values(ServiceType).map((type) => ({
              value: type,
              label: type, // TODO: Use SERVICE_TYPE_LABELS
            }))
          }
          staff={staffOptions} // TODO: Populate with staff options
          loading={loading}
          error={null}
        />
      </Container>
    </MainLayout>
  );
};

export default NewServicePage;