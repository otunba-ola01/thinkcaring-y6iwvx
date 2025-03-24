import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { Box, Typography, Container, Paper } from '@mui/material'; // @mui/material v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../components/layout/MainLayout';
import BillingDashboard from '../../components/billing/BillingDashboard';
import BillingFilter from '../../components/billing/BillingFilter';
import useApiRequest from '../../hooks/useApiRequest';
import { billingApi } from '../../api/billing.api';
import { BillingDashboardMetrics } from '../../types/billing.types';

/**
 * The main billing page component that serves as the entry point for the billing module
 * @returns {JSX.Element} The rendered billing page
 */
const BillingPage: React.FC = () => {
  // LD1: Initialize router using useRouter hook for navigation
  const router = useRouter();

  // LD1: Set up API request hook for fetching billing dashboard metrics
  const { data: dashboardMetrics, loading, error, execute } = useApiRequest<BillingDashboardMetrics>({
    url: '/api/billing/dashboard-metrics', // TODO: Use API_ENDPOINTS.BILLING.DASHBOARD_METRICS
    method: 'GET',
  });

  // LD1: Define local state for filters
  const [filters, setFilters] = useState<Record<string, any>>({ dateRange: { startDate: '30 days ago', endDate: 'today' } });

  // LD1: Define handleFilterChange function to update filter state and refetch data
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    execute(); // Refetch data with new filters
  }, [execute]);

  // LD1: Use useEffect to fetch dashboard metrics when component mounts
  useEffect(() => {
    execute();
  }, [execute]);

  // LD1: Render the page with MainLayout as the wrapper
  return (
    <MainLayout>
      {/* LD1: Include Head component with page title and metadata */}
      <Head>
        <title>Billing Dashboard | HCBS Revenue Management</title>
        <meta name="description" content="Manage billing operations, view unbilled services, and track billing metrics" />
      </Head>

      {/* LD1: Render page title and description */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Billing Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage billing operations, view unbilled services, and track billing metrics.
          </Typography>
        </Box>

        {/* LD1: Render BillingFilter component for filtering billing data */}
        <BillingFilter onFilterChange={handleFilterChange} />

        {/* LD1: Render BillingDashboard component with metrics and actions */}
        <BillingDashboard />

        {/* LD1: Handle loading states with appropriate UI feedback */}
        {loading && (
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="body1">Loading billing dashboard metrics...</Typography>
          </Paper>
        )}

        {/* LD1: Handle error states with error message display */}
        {error && (
          <Paper elevation={3} sx={{ p: 3, mt: 3, color: 'error.main' }}>
            <Typography variant="body1">Error: {error.message}</Typography>
          </Paper>
        )}
      </Container>
    </MainLayout>
  );
};

export default BillingPage;