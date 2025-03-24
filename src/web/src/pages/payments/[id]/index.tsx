import React, { useState, useEffect } from 'react'; // react v18.2.0
import { Box, Typography, Container, CircularProgress, Alert } from '@mui/material'; // @mui/material v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4.1
import Head from 'next/head'; // next/head v13.4.1

import MainLayout from '../../../components/layout/MainLayout';
import PaymentDetail from '../../../components/payments/PaymentDetail';
import { usePayments } from '../../../hooks/usePayments';
import Breadcrumbs from '../../../components/navigation/Breadcrumbs';

/**
 * Next.js page component for displaying payment details
 * @returns {JSX.Element} The rendered payment detail page
 */
const PaymentDetailPage: React.FC = () => {
  // Get the router instance to access the payment ID from the URL
  const router = useRouter();

  // Use the usePayments hook to access payment-related state and functions
  const { selectedPayment, fetchPaymentById, loading, error } = usePayments();

  // Extract the payment ID from the router query parameters
  const paymentId = router.query.id as string;

  // Use useEffect to fetch the payment data when the component mounts or paymentId changes
  useEffect(() => {
    if (paymentId) {
      fetchPaymentById(paymentId);
    }
  }, [paymentId, fetchPaymentById]);

  // Handle loading state by showing a CircularProgress component
  if (loading) {
    return (
      <MainLayout>
        <Container>
          <CircularProgress />
        </Container>
      </MainLayout>
    );
  }

  // Handle error state by showing an Alert component
  if (error) {
    return (
      <MainLayout>
        <Container>
          <Alert severity="error">{error}</Alert>
        </Container>
      </MainLayout>
    );
  }

  // Define a handleEdit function to navigate to the payment edit page
  const handleEdit = () => {
    router.push(`/payments/${paymentId}/edit`);
  };

  // Define a handleReconcile function to navigate to the payment reconciliation page
  const handleReconcile = () => {
    router.push(`/payments/${paymentId}/reconciliation`);
  };

  // Define a handleBack function to navigate back to the payments list
  const handleBack = () => {
    router.push('/payments');
  };

  // Render the page with MainLayout wrapper
  return (
    <MainLayout>
      {/* Set page title and metadata using Next.js Head component */}
      <Head>
        <title>Payment Detail - HCBS Revenue Management</title>
        <meta name="description" content="View and manage payment details" />
      </Head>

      {/* Render Breadcrumbs for navigation */}
      <Breadcrumbs />

      {/* Render the PaymentDetail component with the payment data and handler functions */}
      <PaymentDetail
        paymentId={paymentId}
        onEdit={handleEdit}
        onReconcile={handleReconcile}
        onBack={handleBack}
      />
    </MainLayout>
  );
};

export default PaymentDetailPage;