import React, { useEffect } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4.0
import { Grid, Typography, Box, Container, useTheme } from '@mui/material'; // @mui/material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ServiceDashboard from '../../components/services/ServiceDashboard';
import useServices from '../../hooks/useServices';
import useResponsive from '../../hooks/useResponsive';
import { ROUTES } from '../../constants/routes.constants';
import { LoadingState } from '../../types/common.types';

/**
 * The main component for the services dashboard page
 * @returns {JSX.Element} The rendered services dashboard page
 */
const ServicesDashboardPage: React.FC = (): JSX.Element => {
  // Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // Use the useResponsive hook to determine the current device size
  const { isMobile } = useResponsive();

  // Initialize the useServices hook with autoFetch set to false
  const {
    serviceMetrics,
    fetchServiceMetrics,
    loading,
    error
  } = useServices({ autoFetch: false });

  // Define fetchServiceMetrics function to fetch service metrics data
  const fetchServiceMetricsData = async () => {
    await fetchServiceMetrics();
  };

  // Use useEffect to fetch service metrics when component mounts
  useEffect(() => {
    fetchServiceMetricsData();
  }, [fetchServiceMetricsData]);

  // Use useEffect to set up a refresh interval for service metrics
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchServiceMetricsData();
    }, 60000); // Refresh every 60 seconds

    // Clean up the refresh interval when component unmounts
    return () => clearInterval(intervalId);
  }, [fetchServiceMetricsData]);

  // Render the page with MainLayout as the wrapper
  return (
    <MainLayout>
      {/* Include Head component with page title and metadata */}
      <Head>
        <title>Services Dashboard - ThinkCaring</title>
        <meta name="description" content="Service delivery metrics and status" />
      </Head>

      {/* Render a Container with appropriate maxWidth */}
      <Container maxWidth="xl">
        {/* Render a Typography component for the page title */}
        <Typography variant="h4" component="h1" gutterBottom>
          Services Dashboard
        </Typography>

        {/* Render the ServiceDashboard component with service metrics data */}
        {loading === LoadingState.LOADING && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body1">Loading service metrics...</Typography>
          </Box>
        )}

        {loading === LoadingState.ERROR && (
          <Box sx={{ textAlign: 'center', mt: 3, color: theme.palette.error.main }}>
            <Typography variant="body1">Error: {error}</Typography>
          </Box>
        )}

        {loading === LoadingState.SUCCESS && serviceMetrics && (
          <ServiceDashboard serviceMetrics={serviceMetrics} />
        )}
      </Container>
    </MainLayout>
  );
};

export default ServicesDashboardPage;