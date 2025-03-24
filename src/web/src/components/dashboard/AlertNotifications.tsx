# src/web/src/components/dashboard/AlertNotifications.tsx
```typescript
import React, { useMemo } from 'react'; // v18.2.0
import { Box, Typography, Button, Divider, Skeleton, Badge, IconButton, Tooltip } from '@mui/material'; // v5.13.0
import { Notifications as NotificationsIcon, MoreVert as MoreVertIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material'; // v5.13.0
import Card from '../ui/Card';
import AlertNotification from '../ui/AlertNotification';
import useDashboard from '../../hooks/useDashboard';
import { AlertNotification as AlertNotificationType, AlertCategory, LoadingState } from '../../types/dashboard.types';
import { Severity } from '../../types/common.types';

interface Props {
  className?: string;
}

/**
 * Helper function to get the appropriate icon based on alert category
 * @param category 
 * @returns 
 */
const getAlertIcon = (category: AlertCategory): JSX.Element => {
  switch (category) {
    case AlertCategory.CLAIM:
      return <CheckCircleIcon />;
    case AlertCategory.PAYMENT:
      return <CheckCircleIcon />;
    case AlertCategory.AUTHORIZATION:
      return <CheckCircleIcon />;
    case AlertCategory.BILLING:
      return <CheckCircleIcon />;
    case AlertCategory.COMPLIANCE:
      return <CheckCircleIcon />;
    default:
      return <NotificationsIcon />;
  }
};

/**
 * Helper function to determine the action URL for an alert
 * @param alert 
 * @returns 
 */
const getActionUrl = (alert: AlertNotificationType): string => {
  if (alert.actionUrl) {
    return alert.actionUrl;
  }

  if (alert.entityType && alert.entityId) {
    switch (alert.entityType) {
      case 'claim':
        return `/claims/${alert.entityId}`;
      case 'payment':
        return `/payments/${alert.entityId}`;
      case 'authorization':
        return `/authorizations/${alert.entityId}`;
      default:
        return '';
    }
  }

  return '';
};

/**
 * Component that displays system alerts and notifications in the dashboard
 * @param props 
 * @returns 
 */
const AlertNotifications: React.FC<Props> = (props) => {
  const { className } = props;
  const {
    alertNotifications,
    loading,
    markAlertAsRead,
    unreadAlertCount
  } = useDashboard();

  const sortedAlerts = useMemo(() => {
    if (!alertNotifications) {
      return [];
    }

    return [...alertNotifications].sort((a, b) => {
      if (a.severity === Severity.ERROR && b.severity !== Severity.ERROR) {
        return -1;
      }
      if (a.severity !== Severity.ERROR && b.severity === Severity.ERROR) {
        return 1;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alertNotifications]);

  const handleMarkAsRead = (alertId: string, read: boolean) => {
    markAlertAsRead(alertId, read);
  };

  const handleAlertClick = (alert: AlertNotificationType) => {
    const actionUrl = getActionUrl(alert);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  return (
    <Card
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            Alerts
          </Typography>
          {unreadAlertCount > 0 && (
            <Badge badgeContent={unreadAlertCount} color="primary">
              <NotificationsIcon />
            </Badge>
          )}
          <Box>
            <Tooltip title="More options">
              <IconButton aria-label="options">
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      }
      className={className}
    >
      {loading === LoadingState.LOADING ? (
        <>
          <Skeleton variant="text" height={40} />
          <Skeleton variant="text" height={40} />
          <Skeleton variant="text" height={40} />
        </>
      ) : sortedAlerts.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No alerts to display.
        </Typography>
      ) : (
        <>
          {sortedAlerts.map((alert) => (
            <Box key={alert.id} sx={{ cursor: 'pointer' }} onClick={() => handleAlertClick(alert)}>
              <AlertNotification
                message={alert.message}
                severity={alert.severity}
                onDismiss={() => handleMarkAsRead(alert.id, true)}
              />
            </Box>
          ))}
          {unreadAlertCount > 0 && (
            <>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <Button size="small" color="primary" onClick={() => {
                  sortedAlerts.forEach(alert => {
                    if (!alert.read) {
                      handleMarkAsRead(alert.id, true);
                    }
                  });
                }}>
                  Mark All as Read
                </Button>
              </Box>
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default AlertNotifications;