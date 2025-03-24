import React, { useEffect } from 'react'; // react v18.2.0
import { Head } from 'next/head'; // next v12.3.1
import { NextPage } from 'next'; // next v12.3.1
import { Box, Typography, Container } from '@mui/material'; // @mui/material v5.10.12

import MainLayout from '../../components/layout/MainLayout';
import BillingDashboard from '../../components/billing/BillingDashboard';
import useAuth from '../../hooks/useAuth';
import { SEO_CONFIG } from '../../config/seo.config';

/**
 * The main page component for the Billing Dashboard
 * @returns {JSX.Element} The rendered Billing Dashboard page
 */
const BillingDashboardPage: NextPage = () => {
  // LD1: Use the useAuth hook to ensure the user is authenticated
  const { isLoading } = useAuth();

  // LD1: Render the MainLayout component as the page container
  return (
    <MainLayout>
      {/* LD1: Set page metadata using the Next.js Head component */}
      <Head>
        <title>{SEO_CONFIG.title}</title>
        <meta name="description" content={SEO_CONFIG.description} />
      </Head>

      {/* LD1: Render a page header with the title 'Billing Dashboard' */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1">
            Billing Dashboard
          </Typography>
        </Box>

        {/* LD1: Render the BillingDashboard component that displays metrics and billing information */}
        {/* LD1: Wrap the content in appropriate Container and Box components for layout */}
        {!isLoading && <BillingDashboard />}
      </Container>
    </MainLayout>
  );
};

// IE3: Export the BillingDashboardPage component as the default export for the page
export default BillingDashboardPage;