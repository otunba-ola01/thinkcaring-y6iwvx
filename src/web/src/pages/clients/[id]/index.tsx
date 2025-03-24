import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Box, Typography, CircularProgress, Alert } from '@mui/material'; // @mui/material v5.13.0
import { GetServerSideProps } from 'next'; // next v13.4.0
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../../components/layout/MainLayout';
import ClientDetail from '../../../components/clients/ClientDetail';
import useClients from '../../../hooks/useClients';
import { ROUTES } from '../../../constants/routes.constants';
import { LoadingState } from '../../../types/common.types';
import { Client } from '../../../types/clients.types';

/**
 * Interface for the props passed to the ClientDetailPage component
 */
interface ClientDetailPageProps {
  /** The ID of the client to display */
  id: string;
}

/**
 * Page component that displays detailed information about a client
 * @param props - ClientDetailPageProps
 * @returns The rendered client detail page
 */
const ClientDetailPage: React.FC<ClientDetailPageProps> = (props: ClientDetailPageProps) => {
  // LD1: Extract clientId from props
  const { id: clientId } = props;

  // LD1: Initialize router for navigation
  const router = useRouter();

  // LD1: Initialize state for client data, loading state, and error
  const [loading, setLoading] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  // LD1: Initialize useClients hook to access client data functions
  const {
    getClientById,
    selectedClient: client
  } = useClients();

  // LD1: Fetch client data when component mounts or clientId changes
  useEffect(() => {
    const fetchClient = async () => {
      setLoading(LoadingState.LOADING);
      setError(null);
      try {
        await getClientById(clientId);
        setLoading(LoadingState.SUCCESS);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch client details');
        setLoading(LoadingState.ERROR);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, getClientById]);

  // LD1: Handle loading state with a loading indicator
  if (loading === LoadingState.LOADING) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  // LD1: Handle error state with an error message
  if (error) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <Alert severity="error">{error}</Alert>
        </Box>
      </MainLayout>
    );
  }

  // LD1: Render the client detail page with MainLayout and ClientDetail component
  return (
    <MainLayout>
      <Head>
        {/* LD1: Set page title and meta tags using Next.js Head component */}
        <title>{client ? `${client.firstName} ${client.lastName} - Client Details` : 'Client Details'}</title>
        <meta name="description" content="Detailed information about a client" />
      </Head>
      {client && <ClientDetail clientId={clientId} />}
    </MainLayout>
  );
};

/**
 * Server-side function to fetch initial props for the page
 * @param context - Next.js context object
 * @returns Props object containing the client ID
 */
export const getServerSideProps: GetServerSideProps<ClientDetailPageProps> = async (context) => {
  // LD1: Extract client ID from route parameters
  const { id } = context.params as { id: string };

  // LD1: Return the client ID as a prop
  if (id) {
    return {
      props: {
        id,
      },
    };
  } else {
    // LD1: Handle case where ID is missing by redirecting to clients list page
    return {
      redirect: {
        destination: ROUTES.CLIENTS.ROOT,
        permanent: false,
      },
    };
  }
};

export default ClientDetailPage;