# src/web/src/components/layout/SettingsLayout.tsx
```typescript
import React from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Paper, Container, Typography } from '@mui/material'; // @mui/material v5.13+
import { Settings as SettingsIcon } from '@mui/icons-material'; // @mui/icons-material v5.13+

import MainLayout from './MainLayout';
import TabNavigation from '../navigation/TabNavigation';
import { SettingsLayoutProps } from '../../types/ui.types';
import { ROUTES } from '../../constants/routes.constants';
import useResponsive from '../../hooks/useResponsive';
import useAuth from '../../hooks/useAuth';

/**
 * A layout component that provides a tabbed interface for settings management pages
 * @param {SettingsLayoutProps} props - The component props
 * @returns {JSX.Element} The rendered SettingsLayout component
 */
const SettingsLayout: React.FC<SettingsLayoutProps> = (props: SettingsLayoutProps) => {
  // LD1: Destructure props to extract children and activeTab
  const { children, activeTab } = props;

  // LD1: Get the router instance using useRouter hook
  const router = useRouter();

  // LD1: Get responsive breakpoints using useResponsive hook
  const { isMobile } = useResponsive();

  // LD1: Get the hasPermission function from useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Determine the current active tab from props or router path
  const currentActiveTab = activeTab || router.pathname;

  // LD1: Define the settings tabs configuration with labels, paths, and required permissions
  const SETTINGS_TABS = [
    {
      id: 'users',
      label: 'User Management',
      path: ROUTES.SETTINGS.USERS,
      requiredPermission: 'settings:users:manage',
    },
    {
      id: 'organization',
      label: 'Organization',
      path: ROUTES.SETTINGS.ORGANIZATION,
      requiredPermission: 'settings:organization:manage',
    },
    {
      id: 'programs',
      label: 'Programs',
      path: ROUTES.SETTINGS.PROGRAMS,
      requiredPermission: 'settings:programs:manage',
    },
    {
      id: 'payers',
      label: 'Payers',
      path: ROUTES.SETTINGS.PAYERS,
      requiredPermission: 'settings:payers:manage',
    },
    {
      id: 'service-codes',
      label: 'Service Codes',
      path: ROUTES.SETTINGS.SERVICE_CODES,
      requiredPermission: 'settings:serviceCodes:manage',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      path: ROUTES.SETTINGS.INTEGRATIONS,
      requiredPermission: 'settings:integrations:manage',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: ROUTES.SETTINGS.NOTIFICATIONS,
      requiredPermission: 'settings:notifications:manage',
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      path: ROUTES.SETTINGS.AUDIT_LOG,
      requiredPermission: 'settings:auditLog:view',
    },
  ];

  // LD1: Filter tabs based on user permissions using hasPermission function
  const filteredTabs = SETTINGS_TABS.filter((tab) => {
    return hasPermission(tab.requiredPermission || '');
  });

  // LD1: Create a handleTabChange function to handle tab navigation
  const handleTabChange = (value: string) => {
    router.push(value);
  };

  // LD1: Render the MainLayout component as the base layout
  return (
    <MainLayout>
      {/* LD1: Render a Container component to center the content */}
      <Container maxWidth="xl">
        {/* LD1: Render a Paper component as the content container */}
        <Paper elevation={3} sx={{ padding: 3 }}>
          {/* LD1: Render a header with SettingsIcon and Typography for the page title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SettingsIcon sx={{ mr: 1, fontSize: 30 }} color="primary" />
            <Typography variant="h5">System Settings</Typography>
          </Box>

          {/* LD1: Render the TabNavigation component with filtered settings tabs */}
          <TabNavigation
            tabs={filteredTabs.map((tab) => ({
              label: tab.label,
              value: tab.path,
            }))}
            activeTab={currentActiveTab}
            onChange={handleTabChange}
          />

          {/* LD1: Render the children content below the tabs */}
          <Box sx={{ mt: 3 }}>{children}</Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

// IE3: Export the SettingsLayout component as the default export
export default SettingsLayout;