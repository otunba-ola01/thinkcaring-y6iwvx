import React, { useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Container, Paper, Grid } from '@mui/material'; // @mui/material v5.13+
import { Add } from '@mui/icons-material'; // @mui/icons-material v5.13+
import Head from 'next/head'; // next/head v13.4+

import MainLayout from '../../components/layout/MainLayout';
import ServiceList from '../../components/services/ServiceList';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import ActionButton from '../../components/ui/ActionButton';
import useServices from '../../hooks/useServices';
import useResponsive from '../../hooks/useResponsive';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Main component for the services listing page
 * @returns {JSX.Element} The rendered services page
 */
const ServicesPage: React.FC = () => {
  // LD1: Initialize router using useRouter hook
  const router = useRouter();

  // LD1: Initialize responsive design hooks using useResponsive
  const { isMobile } = useResponsive();

  // LD1: Initialize services data and operations using useServices hook
  const { services, loading, error } = useServices();

  // LD1: Define handleCreateService function to navigate to service creation page
  const handleCreateService = useCallback(() => {
    router.push(ROUTES.SERVICES.NEW);
  }, [router]);

  // LD1: Define handleViewService function to navigate to service detail page
  const handleViewService = useCallback((serviceId: string) => {
    router.push(ROUTES.SERVICES.DETAIL.replace('[id]', serviceId));
  }, [router]);

  // LD1: Render page with MainLayout wrapper
  // LD1: Include Head component with page title and metadata
  // LD1: Render page header with title and action buttons
  // LD1: Render Breadcrumbs component for navigation context
  // LD1: Render ServiceList component with appropriate props
  // LD1: Pass service data and handlers to ServiceList component
  // LD1: Apply responsive styling based on device size
  return (
    <MainLayout>
      <Head>
        <title>Services | ThinkCaring</title>
      </Head>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5">Services</Typography>
        <ActionButton
          label="New Service"
          icon={<Add />}
          onClick={handleCreateService}
        />
      </Box>
      <Breadcrumbs />
      <ServiceList selectable={false} />
    </MainLayout>
  );
};

/**
 * Server-side function to handle authentication and initial data loading
 * @param {object} context
 * @returns {Promise<{ props: {} }> The rendered services page
 */
export async function getServerSideProps(context: any): Promise<{ props: {} }> {
  // LD1: Check if user is authenticated
  // LD1: Redirect to login page if not authenticated
  const { req, res } = context;
  const { cookies } = req;
  const accessToken = cookies.hcbs_access_token;

  if (!accessToken) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return { props: {} };
  }

  // LD1: Return empty props object as data will be fetched client-side
  return { props: {} };
}

export default ServicesPage;