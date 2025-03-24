import React, { useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+
import { Box, Typography, Container } from '@mui/material'; // @mui/material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import PaymentDashboard from '../../components/payments/PaymentDashboard';
import usePayments from '../../hooks/usePayments';
import { PaymentDashboardMetrics } from '../../types/payments.types';

/**
 * The main page component for the payments dashboard
 * @returns {JSX.Element} The rendered payments dashboard page
 */
const PaymentsDashboardPage: React.FC = () => {
  // Get the router instance using useRouter hook
  const router = useRouter();

  // Extract the dashboardMetrics, isLoading, and fetchPaymentDashboardMetrics from usePayments hook
  const {
    dashboardMetrics,
    isLoading,
    fetchPaymentDashboardMetrics
  } = usePayments();

  // Use useEffect to fetch payment dashboard metrics when the component mounts
  useEffect(() => {
    fetchPaymentDashboardMetrics();
  }, [fetchPaymentDashboardMetrics]);

  // Define handleCreatePayment function to navigate to the new payment page
  const handleCreatePayment = useCallback(() => {
    router.push('/payments/new');
  }, [router]);

  // Define handleImportRemittance function to navigate to the remittance import page
  const handleImportRemittance = useCallback(() => {
    router.push('/payments/reconciliation');
  }, [router]);

  // Define handleViewAll function to navigate to the payments list page
  const handleViewAll = useCallback(() => {
    router.push('/payments');
  }, [router]);

  // Render the page with MainLayout wrapper
  return (
    <MainLayout>
      {/* Include Head component with page title and metadata */}
      <Head>
        <title>Payments Dashboard - HCBS Revenue Management</title>
        <meta name="description" content="Payments dashboard for HCBS Revenue Management System" />
      </Head>

      {/* Render page header with title and description */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Payments Dashboard
          </Typography>
          <Typography variant="subtitle1">
            Overview of recent payments, reconciliation status, and key metrics.
          </Typography>
        </Box>

        {/* Render PaymentDashboard component with metrics, loading state, and handler functions */}
        <PaymentDashboard
          metrics={dashboardMetrics as PaymentDashboardMetrics}
          loading={isLoading}
          onCreatePayment={handleCreatePayment}
          onImportRemittance={handleImportRemittance}
          onViewAll={handleViewAll}
        />
      </Container>
    </MainLayout>
  );
};

export default PaymentsDashboardPage;