import React, { useState, useEffect } from 'react'; // react v18.2.0
import { Box, Typography, Container, Paper, Button, CircularProgress } from '@mui/material'; // @mui/material v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4.1
import Head from 'next/head'; // next/head v13.4.1
import { ArrowBack, ArrowForward } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ValidationResults from '../../components/services/ValidationResults';
import { UUID } from '../../types/common.types';
import { ServiceValidationRequest, ServiceValidationResponse } from '../../types/services.types';
import useToast from '../../hooks/useToast';
import { validateServices } from '../../api/services.api';

/**
 * Page component that displays the validation results for selected services
 *
 * @returns {JSX.Element} The rendered service validation page
 */
const ServiceValidationPage: React.FC = () => {
  // LD1: Initialize router using useRouter hook
  const router = useRouter();

  // LD1: Extract serviceIds from router query parameters
  const { serviceIds: serviceIdsString } = router.query;

  // LD1: Parse serviceIds string into an array of UUIDs
  const serviceIds: UUID[] = React.useMemo(() => {
    if (typeof serviceIdsString === 'string') {
      return serviceIdsString.split(',').map(id => id.trim()) as UUID[];
    } else if (Array.isArray(serviceIdsString)) {
      return serviceIdsString.map(id => id.trim()) as UUID[];
    } else {
      return [];
    }
  }, [serviceIdsString]);

  // LD1: Initialize state for validation response and loading state
  const [validationResponse, setValidationResponse] = useState<ServiceValidationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Set up toast notification hook
  const toast = useToast();

  // LD1: Create validateSelectedServices function to call the services API for validation
  const validateSelectedServices = async () => {
    setLoading(true);
    try {
      const requestData: ServiceValidationRequest = {
        serviceIds: serviceIds
      };
      const response = await validateServices(requestData);
      setValidationResponse(response.data);
    } catch (error: any) {
      toast.error(`Failed to validate services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // LD1: Use useEffect to automatically validate services when serviceIds change
  useEffect(() => {
    if (serviceIds.length > 0) {
      validateSelectedServices();
    }
  }, [serviceIds]);

  // LD1: Create handleFixService function to navigate to service detail page for fixing issues
  const handleFixService = (serviceId: UUID) => {
    router.push(`/services/${serviceId}/edit`);
  };

  // LD1: Create handleBack function to navigate back to the services list page
  const handleBack = () => {
    router.push('/services');
  };

  // LD1: Create handleProceed function to navigate to the next step (could be billing or another workflow)
  const handleProceed = () => {
    // TODO: Implement navigation to the next step in the workflow
    toast.info('Navigating to the next step...');
  };

  // LD1: Render the MainLayout component
  return (
    <MainLayout>
      {/* LD1: Render the Head component with page title and metadata */}
      <Head>
        <title>Service Validation</title>
        <meta name="description" content="Validate services for billing" />
      </Head>

      {/* LD1: Render a Container with the page content */}
      <Container maxWidth="md">
        {/* LD1: Render a Typography component for the page title */}
        <Typography variant="h4" component="h1" gutterBottom>
          Service Validation
        </Typography>

        {/* LD1: Render a Paper component containing the validation content */}
        <Paper elevation={3} sx={{ padding: 3 }}>
          {/* LD1: If loading, display a CircularProgress component */}
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          )}

          {/* LD1: If validation response exists, display the ValidationResults component */}
          {validationResponse && (
            <ValidationResults
              validationResponse={validationResponse}
              onFixService={handleFixService}
            />
          )}

          {/* LD1: Handle case where no serviceIds are provided with appropriate message */}
          {serviceIds.length === 0 && !loading && (
            <Typography variant="body1">
              No services selected for validation. Please select services from the service list.
            </Typography>
          )}

          {/* LD1: Render action buttons for back and proceed based on validation state */}
          <Box mt={3} display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
              Back to Services
            </Button>
            {validationResponse && validationResponse.results.every(result => result.isValid) && (
              <Button variant="contained" color="primary" onClick={handleProceed} endIcon={<ArrowForward />}>
                Proceed to Billing
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

// LD1: Export the ServiceValidationPage component as the default export
export default ServiceValidationPage;