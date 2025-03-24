import React, { useState, useEffect, useCallback } from 'react'; // react v18.2+
import { useRouter } from 'next/router'; // next/router v13.0+
import {
  Typography,
  Box,
  Paper,
  Container,
  Grid,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'; // @mui/material v5.13+
import { ArrowBack } from '@mui/icons-material'; // @mui/icons-material v5.13+

import MainLayout from '../../components/layout/MainLayout';
import PaymentForm from '../../components/payments/PaymentForm';
import usePayments from '../../hooks/usePayments';
import useClients from '../../hooks/useClients';
import useToast from '../../hooks/useToast';
import { CreatePaymentDto, PaymentMethod } from '../../types/payments.types';
import { PAYMENT_METHOD_LABELS } from '../../constants/payments.constants';

/**
 * Page component for creating a new payment record
 * @returns {JSX.Element} The rendered page component
 */
const NewPaymentPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notifications using useToast hook
  const toast = useToast();

  // Get payment creation function and loading state from usePayments hook
  const { createPayment, isLoading, error } = usePayments();

  // Initialize state for payers list
  const [payers, setPayers] = useState<
    { value: string; label: string }[]
  >([]);

  // Define handleSubmit function to process form submission
  const handleSubmit = async (payment: CreatePaymentDto) => {
    try {
      // Call the createPayment function from the usePayments hook
      await createPayment(payment);

      // Navigate back to the payments list page after successful submission
      router.push('/payments');
    } catch (err: any) {
      // Show error message if submission fails
      toast.error(err?.message || 'Failed to create payment');
    }
  };

  // Define handleCancel function to navigate back to payments list
  const handleCancel = () => {
    router.push('/payments');
  };

  // Fetch clients data using useClients hook
  const { clients } = useClients();

  // Update payers list when clients data is available
  useEffect(() => {
    if (clients) {
      // Map clients data to the format required by the PaymentForm component
      const payerOptions = clients.map((client) => ({
        value: client.id,
        label: `${client.firstName} ${client.lastName} (${client.medicaidId})`,
      }));

      // Update the payers state with the formatted data
      setPayers(payerOptions);
    }
  }, [clients]);

  // Define paymentMethods list
  const paymentMethods = Object.values(PaymentMethod).map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method],
  }));

  // Render the page with MainLayout component
  return (
    <MainLayout>
      {/* Render page header with title and back button */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h5">New Payment</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleCancel}
        >
          Back to Payments
        </Button>
      </Box>

      {/* Render PaymentForm component with submit and cancel handlers */}
      <PaymentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        payers={payers}
        paymentMethods={paymentMethods}
        loading={isLoading}
        error={error}
      />

      {/* Show loading indicator when submission is in progress */}
      {isLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={200}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Show error alert if submission fails */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </MainLayout>
  );
};

export default NewPaymentPage;