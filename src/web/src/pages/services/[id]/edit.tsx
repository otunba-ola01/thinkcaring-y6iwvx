import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material'; // @mui/material v5.13+
import { ArrowBack, Edit } from '@mui/icons-material'; // @mui/icons-material v5.11+
import Head from 'next/head'; // next/head v13.4+
import { z } from 'zod'; // zod v3.21+

import MainLayout from '../../../components/layout/MainLayout';
import ServiceEntryForm from '../../../components/forms/ServiceEntryForm';
import useServices from '../../../hooks/useServices';
import useToast from '../../../hooks/useToast';
import useForm from '../../../hooks/useForm';
import { ServiceWithRelations, UpdateServiceDto } from '../../../types/services.types';
import { LoadingState } from '../../../types/common.types';
import { NextPageWithLayout } from '../../../types/page.types';
import { buildRoute, ROUTES } from '../../../constants/routes.constants';
import { ClientSummary } from '../../../types/clients.types';
import { SelectOption } from '../../../types/common.types';
import { DocumentationStatus } from '../../../types/services.types';

/**
 * Interface defining the props for the ServiceEditPage component
 */
interface ServiceEditPageProps {
  clients: SelectOption[];
  serviceTypes: SelectOption[];
  staff: SelectOption[];
}

/**
 * Next.js page component for editing an existing service
 * @returns {JSX.Element} The rendered service edit page
 */
const ServiceEditPage: NextPageWithLayout<ServiceEditPageProps> = ({ clients, serviceTypes, staff }) => {
  // 1. Initialize router to access the id parameter from the URL
  const router = useRouter();
  const { id } = router.query;

  // 2. Initialize toast notifications using useToast hook
  const toast = useToast();

  // 3. Initialize services hook to access service operations
  const {
    fetchServiceById,
    updateService,
    loading,
    error,
    selectedService,
  } = useServices();

  // 4. Set up state for loading state, service data, and related entities (clients, service types, staff, etc.)
  const [serviceData, setServiceData] = useState<ServiceWithRelations | null>(null);

  // 5. Create validation schema using Zod for form validation
  // TODO: Move this to a separate file if it becomes too large
  const validationSchema = useMemo(() => {
    return z.object({
      serviceTypeId: z.string().uuid({ message: 'Required UUID for service type' }),
      serviceCode: z.string({ required_error: 'Required string for service code' }),
      serviceDate: z.string({ required_error: 'Required date in ISO8601 format' }),
      units: z.number({ required_error: 'Required number for service units (positive)' }).positive(),
      rate: z.number({ required_error: 'Required number for service rate (positive)' }).positive(),
      staffId: z.string().uuid().optional(),
      facilityId: z.string().uuid().optional(),
      programId: z.string().uuid({ message: 'Required UUID for program' }),
      authorizationId: z.string().uuid().optional(),
      documentationStatus: z.nativeEnum(DocumentationStatus, { required_error: 'Required enum value for documentation status' }),
      notes: z.string().optional(),
      documentIds: z.array(z.string().uuid()).optional(),
    });
  }, []);

  // 6. Fetch service data and related entities when component mounts or id changes
  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchServiceById(id)
        .then((service) => {
          if (service) {
            setServiceData(service);
          }
        });
    }
  }, [id, fetchServiceById]);

  // 7. Handle form submission to update the service
  const handleSubmit = async (formData: UpdateServiceDto) => {
    if (id && typeof id === 'string') {
      try {
        await updateService(id, formData);
        toast.success('Service updated successfully!');
        router.push(buildRoute(ROUTES.SERVICES.DETAIL, { id }));
      } catch (e: any) {
        toast.error(e.message || 'Failed to update service.');
      }
    } else {
      toast.error('Invalid service ID.');
    }
  };

  // 8. Handle navigation back to service detail page
  const handleCancel = () => {
    if (id && typeof id === 'string') {
      router.push(buildRoute(ROUTES.SERVICES.DETAIL, { id }));
    } else {
      router.push(ROUTES.SERVICES.ROOT);
    }
  };

  // 9. Render loading state when service data is being fetched
  if (loading === LoadingState.LOADING && !serviceData) {
    return (
      <MainLayout>
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  // 10. Render error state if service data cannot be loaded
  if (error) {
    return (
      <MainLayout>
        <Container>
          <Alert severity="error">{error}</Alert>
        </Container>
      </MainLayout>
    );
  }

  // 11. Render the ServiceEntryForm with fetched service data and related entities
  return (
    <>
      <Head>
        <title>Edit Service</title>
      </Head>
      <MainLayout>
        <Container maxWidth="md">
          <Breadcrumbs aria-label="breadcrumb">
            <Link href={ROUTES.SERVICES.ROOT} underline="hover" color="inherit">
              Services
            </Link>
            <Link
              href={selectedService ? buildRoute(ROUTES.SERVICES.DETAIL, { id: selectedService.id }) : ''}
              underline="hover"
              color="inherit"
            >
              {selectedService ? `${selectedService.serviceType.name} - ${selectedService.client.firstName} ${selectedService.client.lastName}` : 'Service Details'}
            </Link>
            <Typography color="text.primary">
              <Edit sx={{ mr: 1, width: 16, height: 16, verticalAlign: 'middle' }} />
              Edit
            </Typography>
          </Breadcrumbs>
          <Paper elevation={3} sx={{ padding: 3 }}>
            <Typography variant="h5" gutterBottom>
              Edit Service
            </Typography>
            {selectedService && (
              <ServiceEntryForm
                service={selectedService}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                clients={clients}
                serviceTypes={serviceTypes}
                staff={staff}
                loading={loading === LoadingState.LOADING}
                error={error}
              />
            )}
          </Paper>
        </Container>
      </MainLayout>
    </>
  );
};

/**
 * Function to get the layout for the page
 * @param ReactElement page
 * @returns ReactElement The page wrapped in the MainLayout component
 */
ServiceEditPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default ServiceEditPage;