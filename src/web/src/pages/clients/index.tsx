import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Box, Container, Typography } from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v13.4.0

import MainLayout from '../../components/layout/MainLayout';
import ClientList from '../../components/clients/ClientList';
import useClients from '../../hooks/useClients';
import { ClientQueryParams } from '../../types/clients.types';
import useAuth from '../../hooks/useAuth';
import withAuth from '../../utils/auth';

/**
 * The main clients listing page component
 * @returns {JSX.Element} The rendered clients page
 */
const ClientsPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize auth state using useAuth hook
  const { redirectToLogin } = useAuth();

  // Initialize query parameters state for client filtering
  const [initialFilters, setInitialFilters] = useState<Partial<ClientQueryParams>>({});

  /**
   * Handle client selection to navigate to client details page
   * @param {string} clientId - The ID of the selected client
   */
  const handleClientSelect = useCallback((clientId: string) => {
    router.push(`/clients/${clientId}`);
  }, [router]);

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Set page title and metadata with Head component */}
      <Head>
        <title>Clients | ThinkCaring</title>
      </Head>

      {/* Render ClientList component with query parameters and selection handler */}
      <ClientList
        initialFilters={initialFilters}
        onClientSelect={(client) => handleClientSelect(client.id)}
      />
    </MainLayout>
  );
};

/**
 * Server-side function to handle initial data loading and authentication
 * @param {object} context - The context object
 * @returns {Promise<object>} Props object containing initial filters
 */
export const getServerSideProps = withAuth(async (context: any) => {
  // Extract query parameters from the request
  const { query } = context;

  // Parse and validate query parameters
  const initialFilters: Partial<ClientQueryParams> = {
    search: query.search as string || '',
    status: query.status as any || 'active',
    programId: query.programId as string || undefined,
    page: query.page ? parseInt(query.page as string, 10) : 1,
    pageSize: query.pageSize ? parseInt(query.pageSize as string, 10) : 25,
    sortField: query.sortField as string || 'lastName',
    sortDirection: query.sortDirection as string || 'asc',
  };

  // Return the initialFilters as props
  return {
    props: {
      initialFilters: initialFilters,
    },
  };
});

// Export the protected ClientsPage component as the default export
export default ClientsPage;