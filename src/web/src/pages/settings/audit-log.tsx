import React, { useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import Head from 'next/head'; // next/head v13.4+
import { Box, Typography, Paper, Container } from '@mui/material'; // @mui/material v5.13+

import SettingsLayout from '../../components/layout/SettingsLayout';
import AuditLogViewer from '../../components/settings/AuditLogViewer';
import useAuth, {  } from '../../hooks/useAuth';
import { NextPageWithLayout } from '../../types/common.types';

/**
 * Page component for displaying the audit log in the settings section
 * @returns {JSX.Element} The rendered audit log page
 */
const AuditLogPage: NextPageWithLayout = () => {
  // LD1: Get the router instance using useRouter hook
  const router = useRouter();

  // LD1: Get the hasPermission function from useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Check if user has permission to view audit logs
  useEffect(() => {
    // LD1: If user doesn't have permission, redirect to settings home page
    if (!hasPermission('settings:auditLog:view')) {
      router.push('/settings');
    }
  }, [hasPermission, router]);

  // LD1: Render the page with SettingsLayout and AuditLogViewer components
  return (
    <>
      {/* LD1: Set page title and metadata using Next.js Head component */}
      <Head>
        <title>Audit Log - HCBS Revenue Management</title>
        <meta name="description" content="View system audit logs for compliance monitoring and security auditing." />
      </Head>

      {/* LD1: Render a container with the AuditLogViewer component */}
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Audit Log</Typography>
          </Box>
          <AuditLogViewer />
        </Paper>
      </Container>
    </>
  );
};

// IE3: Export the AuditLogPage component wrapped with authentication HOC
export default AuditLogPage;

// Function to get the layout for the audit log page
AuditLogPage.getLayout = function getLayout(page: React.ReactElement) {
  // Returns the page wrapped in SettingsLayout with 'audit-log' as the active tab
  return (
    <SettingsLayout activeTab="audit-log">
      {page}
    </SettingsLayout>
  );
};