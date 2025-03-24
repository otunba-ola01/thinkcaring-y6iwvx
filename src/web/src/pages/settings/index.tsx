import React, { useEffect, useCallback, useMemo } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Grid, Typography, Box, Button, Divider } from '@mui/material'; // @mui/material v5.13+
import { Settings as SettingsIcon, People as PeopleIcon, Business as BusinessIcon, Category as CategoryIcon, Payments as PaymentsIcon, Code as CodeIcon, Integration as IntegrationIcon, Notifications as NotificationsIcon, History as HistoryIcon } from '@mui/icons-material'; // @mui/icons-material v5.13+
import Head from 'next/head'; // next/head v13.4+

import SettingsLayout from '../../components/layout/SettingsLayout';
import UserManagement from '../../components/settings/UserManagement';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
import { ROUTES } from '../../constants/routes.constants';
import useAuth from '../../hooks/useAuth';
import useSettings from '../../hooks/useSettings';

/**
 * Interface defining the structure of settings category
 */
interface SettingsCategory {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  permission?: string;
}

/**
 * Interface defining the props for SettingsCategoryCard component
 */
interface SettingsCategoryCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}

/**
 * Interface defining the props for SystemStatusCard component
 */
interface SystemStatusCardProps {
  systemStatus: SystemStatus;
}

/**
 * Interface defining the structure of system status information
 */
interface SystemStatus {
  uptime: number;
  databaseStatus: string;
  apiPerformance: number;
  storageUsage: number;
  activeUsers: number;
  lastBackup: string;
}

/**
 * Main component for the settings index page
 * @returns The rendered settings index page
 */
const SettingsPage: React.FC = () => {
  // LD1: Get the router instance using useRouter hook
  const router = useRouter();

  // LD1: Get the hasPermission function from useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Get systemStatus and fetchSystemStatus from useSettings hook
  const { systemSettings, fetchSystemSettings } = useSettings();

  // LD1: Use useEffect to fetch system status when component mounts
  useEffect(() => {
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  // LD1: Define settings categories with their icons, labels, descriptions, paths, and required permissions
  const SETTINGS_CATEGORIES: SettingsCategory[] = useMemo(() => [
    { id: 'users', icon: PeopleIcon, title: 'User Management', description: 'Manage users, roles, and permissions', path: ROUTES.SETTINGS.USERS, permission: 'settings:users:view' },
    { id: 'organization', icon: BusinessIcon, title: 'Organization', description: 'Configure organization information and branding', path: ROUTES.SETTINGS.ORGANIZATION, permission: 'settings:organization:view' },
    { id: 'programs', icon: CategoryIcon, title: 'Programs', description: 'Manage service programs and configurations', path: ROUTES.SETTINGS.PROGRAMS, permission: 'settings:programs:view' },
    { id: 'payers', icon: PaymentsIcon, title: 'Payers', description: 'Configure payers and billing requirements', path: ROUTES.SETTINGS.PAYERS, permission: 'settings:payers:view' },
    { id: 'service-codes', icon: CodeIcon, title: 'Service Codes', description: 'Manage service codes and rates', path: ROUTES.SETTINGS.SERVICE_CODES, permission: 'settings:serviceCodes:view' },
    { id: 'integrations', icon: IntegrationIcon, title: 'Integrations', description: 'Configure external system integrations', path: ROUTES.SETTINGS.INTEGRATIONS, permission: 'settings:integrations:view' },
    { id: 'notifications', icon: NotificationsIcon, title: 'Notifications', description: 'Configure system notifications and alerts', path: ROUTES.SETTINGS.NOTIFICATIONS, permission: 'settings:notifications:view' },
    { id: 'audit-log', icon: HistoryIcon, title: 'Audit Log', description: 'View system activity and audit trail', path: ROUTES.SETTINGS.AUDIT_LOG, permission: 'settings:auditLog:view' },
  ], []);

  // LD1: Filter settings categories based on user permissions
  const filteredCategories = useMemo(() => {
    return SETTINGS_CATEGORIES.filter(category => {
      return hasPermission(category.permission || '');
    });
  }, [hasPermission, SETTINGS_CATEGORIES]);

  // LD1: Create a handleNavigate function to navigate to specific settings pages
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // LD1: Render the SettingsLayout component as the base layout
  return (
    <SettingsLayout>
      {/* LD1: Render a Head component with page title */}
      <Head>
        <title>System Settings - ThinkCaring</title>
      </Head>

      {/* LD1: Render a welcome section with title and description */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1">
          Configure various aspects of the system to meet your organization's needs.
        </Typography>
      </Box>

      {/* LD1: Render a grid of settings category cards */}
      <Grid container spacing={3}>
        {filteredCategories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <SettingsCategoryCard
              icon={category.icon}
              title={category.title}
              description={category.description}
              onClick={() => handleNavigate(category.path)}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* LD1: For system status, render MetricCards with key system metrics */}
      <SystemStatusCard systemStatus={{
        uptime: 365 * 24 * 3600,
        databaseStatus: 'Active',
        apiPerformance: 120,
        storageUsage: 67,
        activeUsers: 45,
        lastBackup: '2023-08-25T14:30:00.000Z'
      }} />
    </SettingsLayout>
  );
};

/**
 * Component for rendering a settings category card
 * @param props 
 * @returns The rendered settings category card
 */
const SettingsCategoryCard: React.FC<SettingsCategoryCardProps> = (props) => {
  // Destructure props to get icon, title, description, onClick
  const { icon: Icon, title, description, onClick } = props;

  // Render a Card component with appropriate styling
  return (
    <Card onClick={onClick} sx={{ height: '100%', cursor: 'pointer' }}>
      {/* Render the category icon at the top of the card */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        <Icon color="primary" sx={{ fontSize: 40 }} />
      </Box>

      {/* Render the category title as Typography component */}
      <Typography variant="h6" component="h3" gutterBottom>
        {title}
      </Typography>

      {/* Render the category description as Typography component with secondary color */}
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>

      {/* Render a Button component for navigation to the category page */}
      <Button variant="contained" color="primary" onClick={onClick} sx={{ mt: 2 }}>
        Go to {title}
      </Button>
    </Card>
  );
};

/**
 * Component for rendering system status information
 * @param props 
 * @returns The rendered system status card
 */
const SystemStatusCard: React.FC<SystemStatusCardProps> = (props) => {
  // Destructure props to get systemStatus
  const { systemStatus } = props;

  // Render a Card component with appropriate styling
  return (
    <Card title="System Status">
      {/* Render a header with title 'System Status' */}
      <Typography variant="h6" component="h3" gutterBottom>
        System Status
      </Typography>

      {/* Render a grid of MetricCard components for different status metrics */}
      <Grid container spacing={2}>
        {/* Include metrics for system uptime, database status, API performance, and storage usage */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Uptime" value={`${systemStatus.uptime / (24 * 3600)} days`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Database Status" value={systemStatus.databaseStatus} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="API Performance" value={`${systemStatus.apiPerformance} ms`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Storage Usage" value={`${systemStatus.storageUsage}%`} />
        </Grid>
      </Grid>
    </Card>
  );
};

// IE3: Export the SettingsPage component as the default export
export default SettingsPage;