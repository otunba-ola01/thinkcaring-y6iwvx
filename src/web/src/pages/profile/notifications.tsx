import React, { useState, useEffect, useCallback } from 'react'; // react v18.2+
import { NextPage } from 'next'; // next v13.4+
import {
  Box,
  Typography,
  Switch,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Grid,
  Checkbox,
  Tooltip
} from '@mui/material'; // @mui/material v5.13+
import { Save as SaveIcon, Notifications as NotificationsIcon } from '@mui/icons-material'; // @mui/icons-material v5.13+

import ProfileLayout from '../../components/layout/ProfileLayout';
import Card from '../../components/ui/Card';
import AlertNotification from '../../components/ui/AlertNotification';
import { useNotificationContext } from '../../context/NotificationContext';
import useApiRequest from '../../hooks/useApiRequest';
import { getNotificationPreferences, updateNotificationPreferences } from '../../api/notifications.api';
import { NotificationType, NotificationSeverity, DeliveryMethod, NotificationFrequency, NotificationPreferences } from '../../types/notification.types';
import useToast from '../../hooks/useToast';

// Descriptions for each notification type to display in the UI
const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  CLAIM_STATUS: 'Updates when claim status changes (submitted, paid, denied, etc.)',
  PAYMENT_RECEIVED: 'Notifications when payments are received',
  AUTHORIZATION_EXPIRY: 'Alerts when service authorizations are approaching expiration',
  FILING_DEADLINE: 'Reminders about approaching claim filing deadlines',
  REPORT_READY: 'Notifications when scheduled reports are ready',
  SYSTEM_ERROR: 'Critical system error alerts',
  COMPLIANCE_ALERT: 'Compliance-related notifications and warnings',
  USER_INVITATION: 'Notifications about user invitations',
  PASSWORD_RESET: 'Password reset notifications',
  ACCOUNT_STATUS: 'Updates about account status changes',
};

// Descriptions for each delivery method to display in the UI
const DELIVERY_METHOD_DESCRIPTIONS: Record<DeliveryMethod, string> = {
  IN_APP: 'Notifications displayed within the application',
  EMAIL: 'Notifications sent to your email address',
  SMS: 'Text message notifications sent to your phone',
};

// Grouping of notification types by category for better organization in the UI
const NOTIFICATION_TYPE_CATEGORIES: Record<string, NotificationType[]> = {
  Financial: ['CLAIM_STATUS', 'PAYMENT_RECEIVED', 'FILING_DEADLINE'],
  Operational: ['AUTHORIZATION_EXPIRY', 'REPORT_READY', 'COMPLIANCE_ALERT'],
  System: ['SYSTEM_ERROR', 'USER_INVITATION', 'PASSWORD_RESET', 'ACCOUNT_STATUS'],
};

// Default notification preferences to use when no saved preferences exist
const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
  notificationTypes: {
    CLAIM_STATUS: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    PAYMENT_RECEIVED: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    AUTHORIZATION_EXPIRY: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    FILING_DEADLINE: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    REPORT_READY: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    SYSTEM_ERROR: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    COMPLIANCE_ALERT: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    USER_INVITATION: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    PASSWORD_RESET: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
    ACCOUNT_STATUS: { enabled: true, deliveryMethods: [DeliveryMethod.IN_APP] },
  },
  deliveryMethods: {
    IN_APP: { enabled: true, frequency: NotificationFrequency.REAL_TIME },
    EMAIL: { enabled: false, frequency: NotificationFrequency.DAILY },
    SMS: { enabled: false, frequency: NotificationFrequency.DAILY },
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
    timezone: 'America/New_York',
    bypassForSeverity: [NotificationSeverity.CRITICAL],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Page component for managing user notification preferences
 * @returns The rendered NotificationsPage component
 */
const NotificationsPage: NextPage = () => {
  // Initialize state for form values based on current preferences
  const [formValues, setFormValues] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Initialize state for alert message and loading state
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<NotificationSeverity>(NotificationSeverity.SUCCESS);

  // Fetch current notification preferences using useApiRequest hook
  const { data, loading, error, execute: fetchPreferences } = useApiRequest<NotificationPreferences>({
    url: '/settings/notifications', // Replace with your actual API endpoint
    method: 'GET',
  });

  // Access toast notifications for user feedback
  const { showToast } = useToast();

  // Update form values when preferences data is loaded
  useEffect(() => {
    if (data) {
      setFormValues(data);
    }
  }, [data]);

  // Handle form field changes to update state
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;

    setFormValues(prevValues => {
      let updatedValue: any = value;

      if (type === 'checkbox') {
        updatedValue = checked;
      }

      return {
        ...prevValues,
        [name]: updatedValue,
      };
    });
  };

  // Handle save operation to update notification preferences
  const handleSave = async () => {
    try {
      // Call updateNotificationPreferences API with current form values
      const response = await updateNotificationPreferences(formValues);

      // Handle successful response by showing success message
      setAlertMessage('Notification preferences saved successfully!');
      setAlertSeverity(NotificationSeverity.SUCCESS);
      showToast({
        message: 'Notification preferences saved successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      // Handle error response by showing error message
      setAlertMessage(err.message || 'Failed to save notification preferences.');
      setAlertSeverity(NotificationSeverity.ERROR);
      showToast({
        message: err.message || 'Failed to save notification preferences.',
        severity: 'error'
      });
    }
  };

  // Handles enabling/disabling a notification type
  const handleNotificationTypeChange = (type: NotificationType, enabled: boolean) => {
    setFormValues(prevValues => ({
      ...prevValues,
      notificationTypes: {
        ...prevValues.notificationTypes,
        [type]: {
          ...prevValues.notificationTypes[type],
          enabled: enabled,
        },
      },
    }));
  };

  // Handles enabling/disabling a delivery method for a notification type
  const handleDeliveryMethodChange = (type: NotificationType, method: DeliveryMethod, enabled: boolean) => {
    setFormValues(prevValues => {
      const deliveryMethods = prevValues.notificationTypes[type].deliveryMethods || [];
      const methodIndex = deliveryMethods.indexOf(method);

      let updatedDeliveryMethods = [...deliveryMethods];
      if (enabled) {
        if (methodIndex === -1) {
          updatedDeliveryMethods.push(method);
        }
      } else {
        if (methodIndex !== -1) {
          updatedDeliveryMethods.splice(methodIndex, 1);
        }
      }

      return {
        ...prevValues,
        notificationTypes: {
          ...prevValues.notificationTypes,
          [type]: {
            ...prevValues.notificationTypes[type],
            deliveryMethods: updatedDeliveryMethods,
          },
        },
      };
    });
  };

  return (
    <ProfileLayout activeTab="notifications">
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Notification Preferences
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure how and when you receive notifications from the system.
        </Typography>

        {alertMessage !== '' && (
          <AlertNotification message={alertMessage} severity={alertSeverity} onDismiss={() => setAlertMessage('')} />
        )}

        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <NotificationTypePreferences formValues={formValues} onChange={setFormValues} disabled={loading} />
            </Grid>
            <Grid item xs={12} md={6}>
              <DeliveryMethodPreferences formValues={formValues} onChange={setFormValues} disabled={loading} />
            </Grid>
            <Grid item xs={12} md={6}>
              <QuietHoursPreferences formValues={formValues} onChange={setFormValues} disabled={loading} />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading}>
            Save Preferences
          </Button>
        </Box>
      </Box>
    </ProfileLayout>
  );
};

interface NotificationTypePreferencesProps {
  formValues: NotificationPreferences;
  onChange: (values: NotificationPreferences) => void;
  disabled: boolean;
}

/**
 * Component for configuring preferences for different notification types
 * @param {NotificationTypePreferencesProps} { formValues, onChange, disabled } - Props for the component
 * @returns The rendered notification type preferences section
 */
const NotificationTypePreferences: React.FC<NotificationTypePreferencesProps> = ({ formValues, onChange, disabled }) => {
  return (
    <Card title="Notification Types">
      {Object.entries(NOTIFICATION_TYPE_CATEGORIES).map(([category, types]) => (
        <Box key={category} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {category}
          </Typography>
          <FormGroup>
            {types.map(type => (
              <FormControlLabel
                key={type}
                control={
                  <Switch
                    checked={formValues.notificationTypes[type].enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      onChange(prevValues => ({
                        ...prevValues,
                        notificationTypes: {
                          ...prevValues.notificationTypes,
                          [type]: {
                            ...prevValues.notificationTypes[type],
                            enabled: enabled,
                          },
                        },
                      }));
                    }}
                    name={type}
                    disabled={disabled}
                  />
                }
                label={
                  <Tooltip title={NOTIFICATION_TYPE_DESCRIPTIONS[type]}>
                    <Typography variant="body2">{type}</Typography>
                  </Tooltip>
                }
              />
            ))}
          </FormGroup>
          <Divider sx={{ my: 2 }} />
        </Box>
      ))}
    </Card>
  );
};

interface DeliveryMethodPreferencesProps {
  formValues: NotificationPreferences;
  onChange: (values: NotificationPreferences) => void;
  disabled: boolean;
}

/**
 * Component for configuring delivery method preferences
 * @param {DeliveryMethodPreferencesProps} { formValues, onChange, disabled } - Props for the component
 * @returns The rendered delivery method preferences section
 */
const DeliveryMethodPreferences: React.FC<DeliveryMethodPreferencesProps> = ({ formValues, onChange, disabled }) => {
  return (
    <Card title="Delivery Methods">
      {Object.values(DeliveryMethod).map(method => (
        <Box key={method} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formValues.deliveryMethods[method].enabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  onChange(prevValues => ({
                    ...prevValues,
                    deliveryMethods: {
                      ...prevValues.deliveryMethods,
                      [method]: {
                        ...prevValues.deliveryMethods[method],
                        enabled: enabled,
                      },
                    },
                  }));
                }}
                name={method}
                disabled={disabled}
              />
            }
            label={
              <Tooltip title={DELIVERY_METHOD_DESCRIPTIONS[method]}>
                <Typography variant="body2">{method}</Typography>
              </Tooltip>
            }
          />
          {formValues.deliveryMethods[method].enabled && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id={`${method}-frequency-label`}>Frequency</InputLabel>
              <Select
                labelId={`${method}-frequency-label`}
                value={formValues.deliveryMethods[method].frequency}
                onChange={(e) => {
                  const frequency = e.target.value as NotificationFrequency;
                  onChange(prevValues => ({
                    ...prevValues,
                    deliveryMethods: {
                      ...prevValues.deliveryMethods,
                      [method]: {
                        ...prevValues.deliveryMethods[method],
                        frequency: frequency,
                      },
                    },
                  }));
                }}
                name={`${method}-frequency`}
                disabled={disabled}
              >
                <MenuItem value={NotificationFrequency.REAL_TIME}>Real Time</MenuItem>
                <MenuItem value={NotificationFrequency.DAILY}>Daily</MenuItem>
                <MenuItem value={NotificationFrequency.WEEKLY}>Weekly</MenuItem>
              </Select>
            </FormControl>
          )}
          <Divider sx={{ my: 2 }} />
        </Box>
      ))}
    </Card>
  );
};

interface QuietHoursPreferencesProps {
  formValues: NotificationPreferences;
  onChange: (values: NotificationPreferences) => void;
  disabled: boolean;
}

/**
 * Component for configuring quiet hours settings
 * @param {QuietHoursPreferencesProps} { formValues, onChange, disabled } - Props for the component
 * @returns The rendered quiet hours preferences section
 */
const QuietHoursPreferences: React.FC<QuietHoursPreferencesProps> = ({ formValues, onChange, disabled }) => {
  return (
    <Card title="Quiet Hours">
      <FormControlLabel
        control={
          <Switch
            checked={formValues.quietHours.enabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              onChange(prevValues => ({
                ...prevValues,
                quietHours: {
                  ...prevValues.quietHours,
                  enabled: enabled,
                },
              }));
            }}
            name="quietHoursEnabled"
            disabled={disabled}
          />
        }
        label="Enable Quiet Hours"
      />
      {formValues.quietHours.enabled && (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Start Time"
            type="time"
            value={formValues.quietHours.start}
            onChange={(e) => {
              const start = e.target.value;
              onChange(prevValues => ({
                ...prevValues,
                quietHours: {
                  ...prevValues.quietHours,
                  start: start,
                },
              }));
            }}
            name="quietHoursStart"
            fullWidth
            margin="normal"
            disabled={disabled}
          />
          <TextField
            label="End Time"
            type="time"
            value={formValues.quietHours.end}
            onChange={(e) => {
              const end = e.target.value;
              onChange(prevValues => ({
                ...prevValues,
                quietHours: {
                  ...prevValues.quietHours,
                  end: end,
                },
              }));
            }}
            name="quietHoursEnd"
            fullWidth
            margin="normal"
            disabled={disabled}
          />
          <TextField
            label="Timezone"
            value={formValues.quietHours.timezone}
            onChange={(e) => {
              const timezone = e.target.value;
              onChange(prevValues => ({
                ...prevValues,
                quietHours: {
                  ...prevValues.quietHours,
                  timezone: timezone,
                },
              }));
            }}
            name="quietHoursTimezone"
            fullWidth
            margin="normal"
            disabled={disabled}
          />
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Bypass for Severity:
          </Typography>
          <FormGroup row>
            {Object.values(NotificationSeverity).map(severity => (
              <FormControlLabel
                key={severity}
                control={
                  <Checkbox
                    checked={formValues.quietHours.bypassForSeverity.includes(severity)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange(prevValues => {
                        let bypassForSeverity = [...prevValues.quietHours.bypassForSeverity];
                        if (checked) {
                          bypassForSeverity.push(severity);
                        } else {
                          bypassForSeverity = bypassForSeverity.filter(s => s !== severity);
                        }
                        return {
                          ...prevValues,
                          quietHours: {
                            ...prevValues.quietHours,
                            bypassForSeverity: bypassForSeverity,
                          },
                        };
                      });
                    }}
                    name={`bypassForSeverity-${severity}`}
                    disabled={disabled}
                  />
                }
                label={severity}
              />
            ))}
          </FormGroup>
        </Box>
      )}
    </Card>
  );
};

export default NotificationsPage;