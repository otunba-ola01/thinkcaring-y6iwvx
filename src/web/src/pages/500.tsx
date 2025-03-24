import React from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4+
import { NextSeo } from 'next-seo'; // v5.15.0
import { Box, Container, Typography } from '@mui/material'; // v5.13.0
import { Error as ErrorIcon, Refresh, Home } from '@mui/icons-material'; // v5.13.0

import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ActionButton from '../components/ui/ActionButton';
import { getSeoConfig } from '../config/seo.config';

// Styles for the container layout
const containerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  py: 4
};

// Styles for the error card
const cardStyles = {
  maxWidth: '600px',
  width: '100%',
  textAlign: 'center'
};

// Styles for the error title
const titleStyles = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: 'error.main',
  mb: 2
};

// Styles for the action buttons container
const actionContainerStyles = {
  display: 'flex',
  justifyContent: 'center',
  gap: 2,
  mt: 2
};

/**
 * A custom 500 error page component that displays when server-side errors occur
 * in the HCBS Revenue Management System. Provides users with a clear error message
 * and navigation options to recover from the error.
 * 
 * @returns {JSX.Element} The rendered 500 page component
 */
const ServerErrorPage = (): JSX.Element => {
  const router = useRouter();

  // Navigate to the dashboard
  const handleGoHome = () => {
    router.push('/dashboard');
  };

  // Refresh the current page
  const handleRefresh = () => {
    router.reload();
  };

  // SEO configuration for the 500 page
  const seoConfig = getSeoConfig({
    title: 'Server Error',
    description: 'We encountered an unexpected server error. Please try again later.',
    noindex: true,
    nofollow: true
  });

  return (
    <>
      <NextSeo {...seoConfig} />
      <Container sx={containerStyles}>
        <Card sx={cardStyles}>
          <Typography sx={titleStyles} variant="h1" component="h1">
            500: Server Error
          </Typography>
          <EmptyState
            title="Something went wrong"
            description="We encountered an unexpected server error. Our team has been notified and is working to fix the issue. Please try again later or return to the dashboard."
            icon={<ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />}
            action={
              <Box sx={actionContainerStyles}>
                <ActionButton
                  label="Go to Dashboard"
                  icon={<Home />}
                  onClick={handleGoHome}
                  variant="contained"
                  color="primary"
                />
                <ActionButton
                  label="Refresh Page"
                  icon={<Refresh />}
                  onClick={handleRefresh}
                  variant="outlined"
                  color="primary"
                />
              </Box>
            }
          />
        </Card>
      </Container>
    </>
  );
};

export default ServerErrorPage;