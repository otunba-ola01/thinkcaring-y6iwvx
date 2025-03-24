import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Button, Container, Paper } from '@mui/material'; // @mui/material v5.13.0
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../../components/layout/MainLayout';
import ServiceDetail from '../../../components/services/ServiceDetail';
import Skeleton from '../../../components/ui/Skeleton';
import AlertNotification from '../../../components/ui/AlertNotification';
import useServices from '../../../hooks/useServices';
import useToast from '../../../hooks/useToast';
import { ROUTES } from '../../../constants/routes.constants';
import { Severity } from '../../../types/common.types';
import { GetServerSideProps } from 'next';

interface ServiceDetailPageProps {
  serviceId: string;
}

/**
 * Main page component for displaying service details
 * @param {ServiceDetailPageProps} props
 * @returns {JSX.Element} The rendered service detail page
 */
const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ serviceId }) => {
  // 1. Initialize router to access route parameters and navigation
  const router = useRouter();

  // 2. Extract serviceId from router query parameters
  // const { id } = router.query;
  // const serviceId = Array.isArray(id) ? id[0] : id;

  // 3. Initialize useServices hook for service data operations
  const {
    selectedService: service,
    fetchServiceById,
    loading,
    error,
  } = useServices();

  // 4. Initialize useToast hook for notifications
  const toast = useToast();

  // 5. Set up state for loading, error, and service data
  // const [loading, setLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string | null>(null);
  // const [service, setService] = useState<ServiceWithRelations | null>(null);

  // 6. Create fetchServiceData function to retrieve service details
  // const fetchServiceData = useCallback(async (id: string) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     // TODO: Implement API call to fetch service details
  //     // const response = await getServiceDetails(id);
  //     // setService(response.data);
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to fetch service details');
  //     toast.error(err.message || 'Failed to fetch service details');
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [toast]);

  // 7. Create handleBack function to navigate back to services list
  const handleBack = () => {
    router.push(ROUTES.SERVICES.ROOT);
  };

  // 8. Use useEffect to fetch service data when serviceId is available
  useEffect(() => {
    if (serviceId) {
      fetchServiceById(serviceId);
    }
  }, [serviceId, fetchServiceById]);

  // 9. Render loading state with Skeleton when data is being fetched
  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="xl">
          <Skeleton variant="rectangular" height={300} />
        </Container>
      </MainLayout>
    );
  }

  // 10. Render error notification if service data fetch fails
  if (error) {
    return (
      <MainLayout>
        <Container maxWidth="xl">
          <AlertNotification message={error} severity={Severity.ERROR} />
        </Container>
      </MainLayout>
    );
  }

  // 11. Render service details with ServiceDetail component when data is available
  return (
    <MainLayout>
      <Container maxWidth="xl">
        {/* 12. Include back button for navigation to services list */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Services
        </Button>

        {/* 13. Render service details with ServiceDetail component when data is available */}
        {service && <ServiceDetail serviceId={service.id} />}
      </Container>
    </MainLayout>
  );
};

/**
 * Server-side function to validate the service ID parameter
 * @param {object} context
 * @returns {Promise<object>} Props object or redirect if ID is invalid
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  // 1. Extract id parameter from context.params
  const { id } = context.params;

  // 2. Check if id exists and is a valid format
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    // 3. If id is invalid, return redirect to services list page
    return {
      redirect: {
        destination: ROUTES.SERVICES.ROOT,
        permanent: false,
      },
    };
  }

  // 4. If id is valid, return it as a prop to the page component
  return {
    props: { serviceId: id },
  };
};

export default ServiceDetailPage;