# src/web/src/pages/clients/[id]/authorizations.tsx
```typescript
import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Button, CircularProgress, Alert, Breadcrumbs, Link } from '@mui/material'; // @mui/material v5.13+
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // @mui/icons-material v5.13+
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../../components/layout/MainLayout';
import AuthorizationList from '../../../components/clients/AuthorizationList';
import AuthorizationForm from '../../../components/clients/AuthorizationForm';
import useClients from '../../../hooks/useClients';
import { ROUTES } from '../../../constants/routes.constants';
import { UUID } from '../../../types/common.types';

/**
 * Page component that displays and manages service authorizations for a specific client
 * @returns {JSX.Element} The rendered client authorizations page
 */
const ClientAuthorizationsPage: React.FC = () => {
  // Initialize router using useRouter hook to access the client ID from the URL
  const router = useRouter();

  // Extract the client ID from router.query.id, ensuring it's a string
  const clientId = router.query.id as string;

  // Initialize state for client data, loading state, error messages, and form visibility
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAuthorizationId, setEditingAuthorizationId] = useState<UUID | null>(null);

  // Initialize client data operations using useClients hook
  const { getClientById } = useClients();

  // Use useEffect to fetch client data when the component mounts or clientId changes
  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const clientData = await getClientById(clientId as UUID);
        setClient(clientData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch client');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, getClientById]);

  // Create handleAddAuthorization function to show the authorization form
  const handleAddAuthorization = () => {
    setEditingAuthorizationId(null);
    setShowForm(true);
  };

  // Create handleEditAuthorization function to show the form with existing authorization data
  const handleEditAuthorization = (authorizationId: UUID) => {
    setEditingAuthorizationId(authorizationId);
    setShowForm(true);
  };

  // Create handleFormClose function to hide the form
  const handleFormClose = () => {
    setShowForm(false);
  };

  // Create handleFormSuccess function to refresh authorizations and hide the form
  const handleFormSuccess = () => {
    setShowForm(false);
  };

  // Create handleBack function to navigate back to the client detail page
  const handleBack = () => {
    router.push(`${ROUTES.CLIENTS.ROOT}/${clientId}`);
  };

  // Render loading state with CircularProgress when client data is being fetched
  if (loading) {
    return (
      <MainLayout>
        <CircularProgress />
      </MainLayout>
    );
  }

  // Render error state with Alert component if client data fetch fails
  if (error) {
    return (
      <MainLayout>
        <Alert severity="error">{error}</Alert>
      </MainLayout>
    );
  }

  // Render the authorization list view with add button when data is available
  return (
    <>
      {/* Set page title and metadata using Next.js Head component */}
      <Head>
        <title>Client Authorizations - ThinkCaring</title>
      </Head>

      {/* Wrap everything in MainLayout component for consistent page structure */}
      <MainLayout>
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href={ROUTES.CLIENTS.ROOT}>
              Clients
            </Link>
            <Typography color="text.primary">Authorizations</Typography>
          </Breadcrumbs>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Client
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddAuthorization}>
            Add Authorization
          </Button>
        </Box>

        <AuthorizationList clientId={clientId as UUID} />

        {/* Conditionally render the authorization form when adding or editing */}
        {showForm && (
          <AuthorizationForm
            clientId={clientId as UUID}
            authorizationId={editingAuthorizationId}
            onSuccess={handleFormSuccess}
          />
        )}
      </MainLayout>
    </>
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

export default ClientAuthorizationsPage;