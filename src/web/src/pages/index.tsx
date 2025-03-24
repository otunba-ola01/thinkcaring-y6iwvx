import React, { useEffect } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Box, Container, Typography, Button, Grid } from '@mui/material'; // @mui/material v5.13.0
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import FinancialOverview from '../components/dashboard/FinancialOverview';
import useAuth from '../hooks/useAuth';
import { ROUTES } from '../constants/routes.constants';

/**
 * The main landing page component that handles authentication state and redirects accordingly
 * @returns {JSX.Element} The rendered home page
 */
const HomePage: React.FC = () => {
  // LD1: Get the router instance using useRouter hook
  const router = useRouter();

  // LD1: Get authentication state and functions using useAuth hook
  const { isAuthenticated, isLoading, user } = useAuth();

  // LD1: Use useEffect to redirect authenticated users to the dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD.ROOT);
    }
  }, [isAuthenticated, router]);

  // LD1: Handle loading state with a simple loading indicator
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  // LD1: For unauthenticated users, render a landing page with system information
  return (
    <>
      {/* LD1: Include Head component with page title and metadata */}
      <Head>
        <title>Thinkcaring - HCBS Revenue Management System</title>
        <meta name="description" content="Transform financial operations for Home and Community-Based Services (HCBS) providers." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* LD1: Use AuthLayout for unauthenticated users */}
      <AuthLayout title="Welcome to Thinkcaring">
        <Container maxWidth="md">
          {/* LD1: Display welcome message and system description */}
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Thinkcaring
          </Typography>
          <Typography variant="body1" paragraph>
            The HCBS Revenue Management System is a comprehensive web application designed to transform financial operations for Home and Community-Based Services (HCBS) providers.
          </Typography>

          {/* LD1: Include a login button that redirects to the login page */}
          <Button variant="contained" color="primary" onClick={() => router.push(ROUTES.AUTH.LOGIN)}>
            Login
          </Button>

          {/* LD1: Include information about the system's key features */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Key Features:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  - Streamlined billing processes
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  - Enhanced financial visibility
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  - Compliance with Medicaid and other payer requirements
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  - Improved cash flow predictability
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </AuthLayout>
    </>
  );
};

// LD1: Add appropriate styling and responsive design considerations
export default HomePage;