import React, { useEffect, useCallback } from 'react'; // react v18.2.0
import { Container, Typography, Paper, Box, Alert } from '@mui/material'; // @mui/material v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0

import SettingsLayout from '../../components/layout/SettingsLayout';
import OrganizationForm from '../../components/settings/OrganizationForm';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';

/**
 * The main component for the organization settings page
 * @returns {JSX.Element} The rendered organization settings page
 */
const OrganizationSettingsPage: React.FC = () => {
  // LD1: Get authentication functions using useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Get router using useRouter hook
  const router = useRouter();

  // LD1: Get toast notification functions using useToast hook
  const toast = useToast();

  // LD1: Check if user has permission to manage organization settings
  const hasManagePermission = hasPermission('settings:organization:manage');

  // LD1: Redirect to dashboard if user lacks required permissions
  useEffect(() => {
    if (!hasManagePermission) {
      router.push('/dashboard');
    }
  }, [hasManagePermission, router]);

  // LD1: Handle successful form submission with toast notification
  const handleSuccess = useCallback(() => {
    toast.success('Organization settings updated successfully!');
  }, [toast]);

  // LD1: Render the page with SettingsLayout and OrganizationForm components
  return (
    <>
      {/* LD1: Set page title and metadata using Next.js Head component */}
      <Head>
        <title>Organization Settings - ThinkCaring</title>
      </Head>
      {/* LD1: Render the page with SettingsLayout and OrganizationForm components */}
      <SettingsLayout activeTab="/settings/organization">
        {hasManagePermission ? (
          <OrganizationForm onSuccess={handleSuccess} />
        ) : (
          <Container maxWidth="md">
            <Alert severity="warning">
              You do not have permission to manage organization settings.
            </Alert>
          </Container>
        )}
      </SettingsLayout>
    </>
  );
};

/**
 * Handles successful form submission
 * @returns {void} No return value
 */
const handleSuccess = (): void => {
  // Display success toast notification
  // Optionally refresh data or perform additional actions
};

// IE3: Export the OrganizationSettingsPage component as the default export
export default OrganizationSettingsPage;