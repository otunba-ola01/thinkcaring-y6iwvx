import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0
import { Box, Typography, Paper, Breadcrumbs, Link, CircularProgress, Alert, Divider } from '@mui/material'; // @mui/material v5.13.0
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // @mui/icons-material v5.11.16

import MainLayout from '../../../components/layout/MainLayout';
import ServiceList from '../../../components/services/ServiceList';
import ActionButton from '../../../components/ui/ActionButton';
import useServices from '../../../hooks/useServices';
import useClients from '../../../hooks/useClients';
import { ROUTES, buildRoute } from '../../../constants/routes.constants';
import { UUID } from '../../../types/common.types';
import { ServiceSummary } from '../../../types/services.types';

/**
 * Interface for the ClientServicesHeader component props
 */
interface ClientServicesHeaderProps {
  clientName: string;
  onBack: () => void;
  onAddService: () => void;
}

/**
 * Component that displays the header for the client services page
 * @param {ClientServicesHeaderProps} props - The component props
 * @returns {JSX.Element} The rendered header component
 */
const ClientServicesHeader: React.FC<ClientServicesHeaderProps> = ({ clientName, onBack, onAddService }) => {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" href={ROUTES.CLIENTS.ROOT} onClick={(e) => { e.preventDefault(); onBack(); }}>
          <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />
          Clients
        </Link>
        <Typography color="text.primary">{clientName} - Services</Typography>
      </Breadcrumbs>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="h5" component="h1">
          {clientName} Services
        </Typography>
        <ActionButton label="Add Service" icon={<AddIcon />} onClick={onAddService} />
      </Box>
    </Paper>
  );
};

/**
 * Page component that displays services for a specific client
 * @returns {JSX.Element} The rendered client services page
 */
const ClientServicesPage: React.FC = () => {
  // Initialize router using useRouter hook to access the client ID from the URL
  const router = useRouter();

  // Extract the client ID from router.query.id, ensuring it's a string
  const clientId = typeof router.query.id === 'string' ? router.query.id : undefined;

  // Initialize client data using useClients hook to fetch client information
  const { getClientById, selectedClient, loading: clientLoading, error: clientError } = useClients();

  // Initialize services data and operations using useServices hook with the client ID
  const { services, loading: servicesLoading, error: servicesError } = useServices({ clientId: clientId as UUID, autoFetch: false });

  // Use useState to track loading state and error messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useEffect to fetch client data when the component mounts or clientId changes
  useEffect(() => {
    if (clientId) {
      setLoading(true);
      setError(null);
      getClientById(clientId as UUID)
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err.message || 'Failed to load client');
          setLoading(false);
        });
    }
  }, [clientId, getClientById]);

  // Create handleServiceSelect function to navigate to service detail page
  const handleServiceSelect = useCallback((service: ServiceSummary) => {
    router.push(ROUTES.SERVICES.DETAIL.replace('[id]', service.id));
  }, [router]);

  // Create handleAddService function to navigate to service creation page with client ID pre-filled
  const handleAddService = useCallback(() => {
    router.push(buildRoute(ROUTES.SERVICES.NEW, { clientId: clientId as string }));
  }, [router, clientId]);

  // Create handleBackToClient function to navigate back to the client detail page
  const handleBackToClient = useCallback(() => {
    router.push(ROUTES.CLIENTS.DETAIL.replace('[id]', clientId as string));
  }, [router, clientId]);

  // Render loading state with CircularProgress when data is being fetched
  if (loading || clientLoading || servicesLoading) {
    return (
      <MainLayout>
        <CircularProgress />
      </MainLayout>
    );
  }

  // Render error state with Alert component if data fetch fails
  if (error || clientError || servicesError) {
    return (
      <MainLayout>
        <Alert severity="error">{error || clientError || servicesError}</Alert>
      </MainLayout>
    );
  }

  // Render the page header with client name and action buttons
  // Render the ServiceList component with client services data
  // Set page title and metadata using Next.js Head component
  // Wrap everything in MainLayout component for consistent page structure
  return (
    <MainLayout>
      <Head>
        <title>Client Services - ThinkCaring</title>
      </Head>
      {selectedClient && (
        <ClientServicesHeader
          clientName={`${selectedClient.firstName} ${selectedClient.lastName}`}
          onBack={handleBackToClient}
          onAddService={handleAddService}
        />
      )}
      <ServiceList clientId={clientId as UUID} selectable={true} onServiceSelect={handleServiceSelect} />
    </MainLayout>
  );
};

/**
 * Server-side function to validate the client ID parameter and handle redirects if needed
 * @param {object} context
 * @returns {Promise<object>} Props object or redirect object
 */
export const getServerSideProps = async (context: any) => {
  // Extract the client ID from context.params.id
  const { id } = context.params;

  // Validate that the client ID is present and in the correct format
  if (!id || typeof id !== 'string' || id.length === 0) {
    // If validation fails, return a redirect to the clients list page
    return {
      redirect: {
        destination: ROUTES.CLIENTS.ROOT,
        permanent: false,
      },
    };
  }

  // Return an empty props object if validation passes
  return {
    props: {},
  };
};

export default ClientServicesPage;