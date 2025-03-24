import React, { useEffect } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4.0
import { Grid, Box, Container, Typography, Divider, useTheme } from '@mui/material'; // @mui/material v5.13.0
import MainLayout from '../../components/layout/MainLayout';
import FinancialOverview from '../../components/dashboard/FinancialOverview';
import RevenueByProgram from '../../components/dashboard/RevenueByProgram';
import AgingReceivables from '../../components/dashboard/AgingReceivables';
import QuickActions from '../../components/dashboard/QuickActions';
import RecentClaims from '../../components/dashboard/RecentClaims';
import useDashboard from '../../hooks/useDashboard';
import useResponsive from '../../hooks/useResponsive';
import { ROUTES } from '../../constants/routes.constants';

/**
 * The main dashboard page component that displays a comprehensive overview of financial metrics and KPIs
 * @returns {JSX.Element} The rendered dashboard page
 */
const DashboardPage: React.FC = () => {
  // LD1: Use the useTheme hook to access the current theme for styling
  const theme = useTheme();

  // LD1: Use the useResponsive hook to determine the current device size
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // LD1: Use the useDashboard hook to fetch and manage dashboard data
  const { setRefreshInterval } = useDashboard();

  // LD1: Set up useEffect to refresh dashboard data at regular intervals
  useEffect(() => {
    // LD1: Set refresh interval to 30 seconds (30000 milliseconds)
    setRefreshInterval(30000);

    // LD1: Clean up the interval when the component unmounts
    return () => {
      setRefreshInterval(null);
    };
  }, [setRefreshInterval]);

  // LD1: Render the MainLayout component as the page container
  return (
    <MainLayout>
      {/* LD1: Include Head component with page title and metadata */}
      <Head>
        <title>Dashboard - HCBS Revenue Management</title>
        <meta name="description" content="HCBS Revenue Management Dashboard" />
      </Head>

      {/* LD1: Create a responsive grid layout using Material UI Grid components */}
      <Container maxWidth="xl">
        <Box sx={{ flexGrow: 1, mt: 3 }}>
          <Grid container spacing={3}>
            {/* LD1: Render the FinancialOverview component in the top section */}
            <Grid item xs={12}>
              <FinancialOverview />
            </Grid>

            {/* LD1: Create a grid layout for the middle section with RevenueByProgram, AgingReceivables, and QuickActions */}
            {/* LD1: Adjust grid item sizes based on screen size (xs, sm, md, lg, xl) */}
            <Grid item xs={12} md={4}>
              <RevenueByProgram />
            </Grid>
            <Grid item xs={12} md={4}>
              <AgingReceivables />
            </Grid>
            <Grid item xs={12} md={4}>
              <QuickActions />
            </Grid>

            {/* LD1: Render the RecentClaims component in the bottom section */}
            <Grid item xs={12}>
              <RecentClaims limit={5} title="Recent Claims" viewAllHref={ROUTES.CLAIMS.ROOT} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </MainLayout>
  );
};

// Export the DashboardPage component as the default export
export default DashboardPage;