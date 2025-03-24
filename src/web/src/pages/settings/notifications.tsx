import React, { useEffect } from 'react'; // React library and hooks for component creation and lifecycle management // react v18.2+
import { Box, Typography, CircularProgress } from '@mui/material'; // Material UI components for layout and loading indicator // @mui/material v5.13+
import Head from 'next/head'; // Next.js Head component for setting page metadata // next/head latest

import SettingsLayout from '../../components/layout/SettingsLayout'; // Layout component for settings pages with navigation tabs
import NotificationSettings from '../../components/settings/NotificationSettings'; // Component for managing notification settings
import useSettings from '../../hooks/useSettings'; // Hook for accessing and updating notification settings
import { LoadingState } from '../../types/common.types'; // Enum for loading state values

/**
 * Page component for notification settings management
 * @returns {JSX.Element} The rendered NotificationsPage component
 */
const NotificationsPage: React.FC = () => {
  // LD1: Get notification settings data and functions from useSettings hook
  const {
    notificationSettings,
    loading,
    error,
    fetchNotificationSettings
  } = useSettings();

  // LD1: Use useEffect to fetch notification settings on component mount
  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  // LD1: Render the SettingsLayout component with 'notifications' as the active tab
  return (
    <SettingsLayout activeTab="notifications">
      {/* LD1: Set page title and metadata using Next.js Head component */}
      <Head>
        <title>Notification Settings - ThinkCaring</title>
        <meta name="description" content="Manage your notification preferences" />
      </Head>

      {/* LD1: Display loading indicator when settings are being fetched */}
      {loading === LoadingState.LOADING && (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      )}

      {/* LD1: Display error message if settings fetch fails */}
      {error && (
        <Box color="error.main" textAlign="center">
          <Typography variant="body1">Error: {error.message}</Typography>
        </Box>
      )}

      {/* LD1: Render the NotificationSettings component when data is available */}
      {notificationSettings && (
        /* LD1: Pass notification settings data to the NotificationSettings component */
        <NotificationSettings />
      )}
    </SettingsLayout>
  );
};

// IE3: Export the NotificationsPage component as the default export
export default NotificationsPage;