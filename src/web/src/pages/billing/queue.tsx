import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next/head v13.4+
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Container, Alert, Breadcrumbs, Link } from '@mui/material'; // @mui/material v5.13+

import MainLayout from '../../components/layout/MainLayout';
import BillingQueue from '../../components/billing/BillingQueue';
import Card from '../../components/ui/Card';
import { useAuthContext } from '../../context/AuthContext';
import { hasPermission } from '../../utils/auth';
import useToast from '../../hooks/useToast';
import { UUID } from '../../types/common.types';
import { BillingQueueFilter } from '../../types/billing.types';

/**
 * The main page component for the billing queue that displays services ready for billing
 * @returns {JSX.Element} The rendered billing queue page
 */
const BillingQueuePage: NextPage = () => {
  // LD1: Get router instance using useRouter hook
  const router = useRouter();

  // LD1: Get authentication context using useAuthContext hook
  const { hasPermission } = useAuthContext();

  // LD1: Initialize toast notification hook
  const toast = useToast();

  // LD1: Set up state for selected services using useState
  const [selectedServices, setSelectedServices] = useState<UUID[]>([]);

  // LD1: Check if user has permission to access billing features
  const hasBillingPermission = hasPermission('billing:view');

  // LD1: Create handleServiceSelect function to update selected services state
  const handleServiceSelect = useCallback((serviceIds: UUID[]) => {
    setSelectedServices(serviceIds);
  }, []);

  // LD1: Create handleValidateServices function to navigate to validation page with selected services
  const handleValidateServices = useCallback(() => {
    // LD1: Check if any services are selected
    if (!selectedServices || selectedServices.length === 0) {
      toast.warning('Please select at least one service to validate.');
      return;
    }

    // LD1: Navigate to validation page with selected service IDs as URL parameters
    router.push(`/billing/validation?serviceIds=${selectedServices.join(',')}`);
  }, [selectedServices, toast, router]);

  // LD1: Create handleCreateClaim function to navigate to claim creation page with selected services
  const handleCreateClaim = useCallback(() => {
    // LD1: Check if any services are selected
    if (!selectedServices || selectedServices.length === 0) {
      toast.warning('Please select at least one service to create a claim.');
      return;
    }

    // LD1: Navigate to claim creation page with selected service IDs as URL parameters
    router.push(`/billing/claim-creation?serviceIds=${selectedServices.join(',')}`);
  }, [selectedServices, toast, router]);

  // LD1: Return the MainLayout component with the billing queue content
  return (
    <MainLayout>
      <Head>
        {/* LD1: Include Head component with page title and metadata */}
        <title>Billing Queue - ThinkCaring</title>
      </Head>
      <Container maxWidth="xl">
        {/* LD1: Render page title and description */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Billing Queue
          </Typography>
          <Typography variant="subtitle1">
            Select services to validate and create claims.
          </Typography>
        </Box>
        {hasBillingPermission ? (
          /* LD1: Render the BillingQueue component with necessary props */
          <BillingQueue
            onServiceSelect={handleServiceSelect}
            selectedServices={selectedServices}
          />
        ) : (
          /* LD1: If user doesn't have permission, display an access denied message */
          <Alert severity="error">You do not have permission to access this page.</Alert>
        )}
      </Container>
    </MainLayout>
  );
};

export default BillingQueuePage;