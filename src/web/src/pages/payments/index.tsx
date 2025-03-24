import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0
import { Box, Typography, Tabs, Tab, Button, Container, Grid } from '@mui/material'; // @mui/material v5.13.0
import { Add, FileUpload } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import PaymentList from '../../components/payments/PaymentList';
import PaymentDashboard from '../../components/payments/PaymentDashboard';
import usePayments from '../../hooks/usePayments';
import useResponsive from '../../hooks/useResponsive';
import { 
  PAYMENTS_PAGE_TITLE, 
  PAYMENTS_PAGE_DESCRIPTION 
} from '../../constants/payments.constants';

/**
 * PaymentsPage component that displays payment dashboard and list
 */
const PaymentsPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize responsive hooks to determine screen size
  const { isMobile, isTablet } = useResponsive();

  // Initialize state for selected tab using useState
  const [tabValue, setTabValue] = useState<number>(0);

  // Initialize state for selected payment IDs using useState
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);

  // Get payment-related state and functions from usePayments hook
  const { 
    payments, 
    loading, 
    isLoading,
    pagination, 
    filters, 
    dashboardMetrics, 
    fetchPayments, 
    fetchPaymentDashboardMetrics, 
    updateFilters 
  } = usePayments();

  /**
   * Function to handle tab change
   * @param event - The event object
   * @param newValue - The new tab value
   */
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  /**
   * Function to handle create payment navigation
   */
  const handleCreatePayment = () => {
    router.push('/payments/new');
  };

  /**
   * Function to handle import remittance navigation
   */
  const handleImportRemittance = () => {
    router.push('/payments/reconciliation');
  };

  /**
   * Function to handle view all payments navigation
   */
  const handleViewAllPayments = () => {
    setTabValue(1);
  };

  /**
   * Function to handle payment selection
   * @param paymentId - The ID of the selected payment
   */
  const handlePaymentSelect = (paymentId: string) => {
    setSelectedPaymentIds(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  // Use useEffect to fetch payment dashboard metrics on component mount
  useEffect(() => {
    fetchPaymentDashboardMetrics();
  }, [fetchPaymentDashboardMetrics]);

  // Use useEffect to fetch payments when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, filters]);

  return (
    <MainLayout>
      <Head>
        <title>{PAYMENTS_PAGE_TITLE}</title>
        <meta name="description" content={PAYMENTS_PAGE_DESCRIPTION} />
      </Head>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Payments
        </Typography>
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreatePayment} sx={{ mr: 2 }}>
            New Payment
          </Button>
          <Button variant="outlined" startIcon={<FileUpload />} onClick={handleImportRemittance}>
            Import Remittance
          </Button>
        </Box>
      </Box>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Payment Tabs">
        <Tab label="Dashboard" id="payment-tab-dashboard" aria-controls="payment-tabpanel-dashboard" />
        <Tab label="Payments List" id="payment-tab-list" aria-controls="payment-tabpanel-list" />
      </Tabs>
      <Box role="tabpanel" hidden={tabValue !== 0} id="payment-tabpanel-dashboard" aria-labelledby="payment-tab-dashboard">
        {tabValue === 0 && (
          <PaymentDashboard
            metrics={dashboardMetrics}
            loading={isLoading}
            onCreatePayment={handleCreatePayment}
            onImportRemittance={handleImportRemittance}
            onViewAll={handleViewAllPayments}
          />
        )}
      </Box>
      <Box role="tabpanel" hidden={tabValue !== 1} id="payment-tabpanel-list" aria-labelledby="payment-tab-list">
        {tabValue === 1 && (
          <PaymentList
            onPaymentSelect={handlePaymentSelect}
            selectedPaymentIds={selectedPaymentIds}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default PaymentsPage;