import React from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4+
import { NextSeo } from 'next-seo'; // v5.15.0
import { Box, Container, Typography } from '@mui/material'; // v5.13.0
import { PageNotFound, Home } from '@mui/icons-material'; // v5.13.0

import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ActionButton from '../components/ui/ActionButton';
import { getSeoConfig } from '../config/seo.config';

// Styles for the container
const containerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  py: 4
};

// Styles for the card
const cardStyles = {
  maxWidth: '600px',
  width: '100%',
  textAlign: 'center'
};

// Styles for the title
const titleStyles = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: 'primary.main',
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
 * A custom 404 error page component that displays when users navigate to non-existent routes
 * @returns The rendered 404 page component
 */
const NotFoundPage = (): JSX.Element => {
  const router = useRouter();

  // Function to handle navigation to home/dashboard
  const handleGoHome = () => {
    router.push('/dashboard');
  };

  // Function to handle navigation to previous page
  const handleGoBack = () => {
    router.back();
  };

  // SEO configuration for the 404 page
  const seoConfig = getSeoConfig({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has been moved.',
    noindex: true,
    nofollow: true
  });

  // Action buttons for navigation
  const actionButtons = (
    <Box sx={actionContainerStyles}>
      <ActionButton
        label="Go to Dashboard"
        icon={<Home />}
        onClick={handleGoHome}
        color="primary"
      />
      <ActionButton
        label="Go Back"
        onClick={handleGoBack}
        variant="outlined"
        color="primary"
      />
    </Box>
  );

  return (
    <>
      {/* SEO Configuration */}
      <NextSeo {...seoConfig} />

      {/* Main Container */}
      <Container sx={containerStyles}>
        <Card sx={cardStyles}>
          {/* Title */}
          <Typography sx={titleStyles} component="h1">
            404 - Page Not Found
          </Typography>

          {/* Empty State with Icon and Message */}
          <EmptyState
            title="We couldn't find the page you're looking for"
            description="The page may have been moved, deleted, or never existed. Please check the URL or navigate to another section of the application."
            icon={<PageNotFound sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.7 }} />}
            action={actionButtons}
          />
        </Card>
      </Container>
    </>
  );
};

export default NotFoundPage;