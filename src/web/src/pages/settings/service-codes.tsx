import React, { useState, useEffect } from 'react'; // react v18.2.0
import { Box, Typography, Container, Paper } from '@mui/material'; // @mui/material v5.13.0
import { NextPage } from 'next'; // next v13.4.0
import Head from 'next/head'; // next v13.4.0

import SettingsLayout from '../../components/layout/SettingsLayout';
import ServiceCodeList from '../../components/settings/ServiceCodeList';
import useAuth from '../../hooks/useAuth';
import { getPrograms } from '../../api/settings.api';

/**
 * Page component for managing service codes in the settings section
 * @returns {JSX.Element} The rendered page component
 */
const ServiceCodesPage: NextPage = () => {
  // LD1: Initialize state for programs data
  const [programs, setPrograms] = useState<any[]>([]);

  // LD1: Initialize state for loading programs
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // LD1: Get the hasPermission function from useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Check if user has permission to manage service codes
  const canManageServiceCodes = hasPermission('settings:serviceCodes:manage');

  // LD1: Implement useEffect to fetch programs data on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await getPrograms({ pagination: { page: 1, pageSize: 1000 } });
        if (response.data && response.data.items) {
          setPrograms(response.data.items);
        }
      } catch (error) {
        console.error('Failed to load programs:', error);
        // Handle error appropriately, e.g., display an error message
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, [setPrograms, setLoadingPrograms, getPrograms]);

  // LD1: Render the SettingsLayout component with 'service-codes' as the active tab
  return (
    <>
      <Head>
        <title>Service Codes - ThinkCaring</title>
      </Head>
      <SettingsLayout activeTab="service-codes">
        <Container maxWidth="xl">
          <Paper elevation={3} sx={{ padding: 3 }}>
            {canManageServiceCodes ? (
              <>
                {/* LD1: Render page title and description */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" component="h1" gutterBottom>
                    Service Codes
                  </Typography>
                  <Typography variant="body1">
                    Manage service codes used throughout the billing and claims processes.
                  </Typography>
                </Box>

                {/* LD1: Render the ServiceCodeList component with programs data */}
                <ServiceCodeList programs={programs} loading={loadingPrograms} />
              </>
            ) : (
              // LD1: Handle unauthorized access by showing appropriate message
              <Typography variant="body1">
                You do not have permission to manage service codes.
              </Typography>
            )}
          </Paper>
        </Container>
      </SettingsLayout>
    </>
  );
};

// IE3: Export the ServiceCodesPage component as the default export
export default ServiceCodesPage;