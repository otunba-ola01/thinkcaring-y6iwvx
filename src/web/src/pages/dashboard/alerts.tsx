import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import Head from 'next/head'; // next/head v13.4+
import { useRouter } from 'next/router'; // next/router v13.4+
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Container
} from '@mui/material'; // @mui/material v5.13.0
import {
  Notifications as NotificationsIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import AlertNotification from '../../components/ui/AlertNotification';
import Card from '../../components/ui/Card';
import FilterPanel from '../../components/ui/FilterPanel';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import useDashboard from '../../hooks/useDashboard';
import usePagination from '../../hooks/usePagination';
import useFilter from '../../hooks/useFilter';
import useSort from '../../hooks/useSort';
import {
  AlertNotification as AlertNotificationType,
  AlertCategory,
  LoadingState
} from '../../types/dashboard.types';
import { Severity } from '../../types/common.types';
import { NextPageWithLayout } from '../../types/common.types';

/**
 * Helper function to get a human-readable label for an alert category
 * @param {AlertCategory} category - The alert category
 * @returns {string} Human-readable category label
 */
const getAlertCategoryLabel = (category: AlertCategory): string => {
  switch (category) {
    case AlertCategory.CLAIM:
      return 'Claim';
    case AlertCategory.PAYMENT:
      return 'Payment';
    case AlertCategory.AUTHORIZATION:
      return 'Authorization';
    case AlertCategory.BILLING:
      return 'Billing';
    case AlertCategory.COMPLIANCE:
      return 'Compliance';
    case AlertCategory.SYSTEM:
      return 'System';
    default:
      return 'Notification';
  }
};

/**
 * Helper function to get a human-readable label for a severity level
 * @param {Severity} severity - The severity level
 * @returns {string} Human-readable severity label
 */
const getSeverityLabel = (severity: Severity): string => {
  switch (severity) {
    case Severity.SUCCESS:
      return 'Success';
    case Severity.INFO:
      return 'Information';
    case Severity.WARNING:
      return 'Warning';
    case Severity.ERROR:
      return 'Error';
    default:
      return 'Information';
  }
};

/**
 * The main alerts page component that displays a comprehensive list of system alerts with filtering, sorting, and pagination
 * @returns {JSX.Element} The rendered alerts page
 */
const AlertsPage: NextPageWithLayout = () => {
  // Use the useDashboard hook to access alerts data and related functions
  const {
    alertNotifications,
    loading,
    markAlertAsRead
  } = useDashboard();

  // Use the usePagination hook to manage pagination of alerts
  const { page, pageSize, handlePageChange } = usePagination({
    initialPageSize: 10,
    syncWithUrl: true
  });

  // Use the useFilter hook to manage filtering of alerts
  const { filters, setFilter } = useFilter({
    filterConfigs: [
      {
        id: 'category',
        label: 'Category',
        type: 'select',
        field: 'category',
        operator: 'eq',
        options: Object.values(AlertCategory).map((category) => ({
          value: category,
          label: getAlertCategoryLabel(category)
        }))
      },
      {
        id: 'severity',
        label: 'Severity',
        type: 'select',
        field: 'severity',
        operator: 'eq',
        options: Object.values(Severity).map((severity) => ({
          value: severity,
          label: getSeverityLabel(severity)
        }))
      }
    ]
  });

  // Use the useSort hook to manage sorting of alerts
  const { sort, toggleSort } = useSort({
    initialSort: [{ field: 'timestamp', direction: 'desc' }],
    syncWithUrl: true
  });

  // Create state for filter panel visibility
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Create a function to handle marking an alert as read
  const handleMarkAlertAsRead = (alertId: string, read: boolean) => {
    markAlertAsRead(alertId, read);
  };

  // Create a function to handle marking all alerts as read
  const handleMarkAllAsRead = () => {
    if (alertNotifications) {
      alertNotifications.forEach((alert) => {
        if (!alert.read) {
          markAlertAsRead(alert.id, true);
        }
      });
    }
  };

  // Create a function to handle alert action clicks
  const handleAlertActionClick = (alert: AlertNotificationType) => {
    // Implement logic to handle alert actions (e.g., navigate to claim details)
    console.log(`Action clicked for alert: ${alert.id}`);
  };

  // Use useMemo to filter, sort, and paginate alerts based on current state
  const filteredAlerts = useMemo(() => {
    if (!alertNotifications) {
      return [];
    }

    // Apply filters
    let filtered = [...alertNotifications];
    if (filters.category) {
      filtered = filtered.filter((alert) => alert.category === filters.category);
    }
    if (filters.severity) {
      filtered = filtered.filter((alert) => alert.severity === filters.severity);
    }

    // Apply sorting
    if (sort.length > 0) {
      const sortBy = sort[0].field;
      const sortDirection = sort[0].direction === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1 * sortDirection;
        if (a[sortBy] > b[sortBy]) return 1 * sortDirection;
        return 0;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  }, [alertNotifications, filters, sort, page, pageSize]);

  // Render the page title and SEO metadata using Next.js Head component
  return (
    <>
      <Head>
        <title>Alerts | ThinkCaring</title>
      </Head>
      <Box>
        {/* Render the page header with title, alert count, and action buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h1">
            Alerts
          </Typography>
          <Box>
            {/* Provide a 'Mark All as Read' button when there are unread alerts */}
            {alertNotifications && alertNotifications.filter((alert) => !alert.read).length > 0 && (
              <Button variant="contained" color="primary" onClick={handleMarkAllAsRead} sx={{ mr: 2 }}>
                Mark All as Read
              </Button>
            )}
            <Tooltip title="Refresh Alerts">
              <IconButton aria-label="refresh alerts">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter Alerts">
              <IconButton aria-label="filter alerts" onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Render the filter panel when visible */}
        {isFilterPanelOpen && (
          <FilterPanel
            filters={[
              {
                id: 'category',
                label: 'Category',
                type: 'select',
                field: 'category',
                operator: 'eq',
                options: Object.values(AlertCategory).map((category) => ({
                  value: category,
                  label: getAlertCategoryLabel(category)
                }))
              },
              {
                id: 'severity',
                label: 'Severity',
                type: 'select',
                field: 'severity',
                operator: 'eq',
                options: Object.values(Severity).map((severity) => ({
                  value: severity,
                  label: getSeverityLabel(severity)
                }))
              }
            ]}
            onFilterChange={setFilter}
          />
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Render the alerts list with individual AlertNotification components */}
        {loading === LoadingState.LOADING ? (
          <Typography>Loading alerts...</Typography>
        ) : filteredAlerts && filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertNotification
              key={alert.id}
              message={alert.message}
              severity={alert.severity}
              onDismiss={() => handleMarkAlertAsRead(alert.id, true)}
              action={
                <Button color="inherit" size="small" onClick={() => handleAlertActionClick(alert)}>
                  View
                </Button>
              }
            />
          ))
        ) : (
          <EmptyState title="No Alerts" description="There are no alerts to display." />
        )}

        {/* Render pagination controls at the bottom of the list */}
        {alertNotifications && alertNotifications.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={alertNotifications.length}
            onPageChange={handlePageChange}
          />
        )}
      </Box>
    </>
  );
};

AlertsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <MainLayout>
      {page}
    </MainLayout>
  );
};

export default AlertsPage;