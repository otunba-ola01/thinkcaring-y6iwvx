import React, { useState, useEffect, useCallback } from 'react'; // v18.2+ React library and hooks for component creation and state management
import { Box, Grid, Typography, Switch, FormControl, FormControlLabel, FormGroup, InputLabel, Select, MenuItem, TextField, Divider, Chip, IconButton, Tooltip } from '@mui/material'; // v5.13+ Material UI components for building the notification settings interface
import { Save as SaveIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'; // v5.13+ Material UI icons for action buttons

import Card from '../ui/Card'; // Container component for each settings section
import Tabs from '../ui/Tabs'; // Tab navigation for different notification settings sections
import ActionButton from '../ui/ActionButton'; // Button component for saving settings changes
import AlertNotification from '../ui/AlertNotification'; // Display success or error messages after settings operations
import FilterPanel from '../ui/FilterPanel'; // Filter controls for notification types list
import DataTable from '../ui/DataTable'; // Table component for displaying notification types
import useSettings from '../../hooks/useSettings'; // Hook for accessing and updating notification settings
import { NotificationSettings, UpdateNotificationSettingsDto, NotificationChannel, NotificationFrequency } from '../../types/settings.types'; // Type definitions for notification settings data
import { NotificationType, NotificationSeverity } from '../../types/notification.types'; // Enums for notification types and severity levels
import { LoadingState } from '../../types/common.types'; // Enum for loading state values

/**
 * Main component for managing notification settings
 *
 * @returns {JSX.Element} The rendered NotificationSettings component
 */
const NotificationSettings: React.FC = () => {
  // 1. Fetch notification settings using useSettings hook
  const {
    notificationSettings,
    updateNotificationSettings,
    loading,
    error,
    fetchNotificationSettings
  } = useSettings();

  // 2. Initialize state for form values based on current settings
  const [formValues, setFormValues] = useState<NotificationSettings | null>(null);

  // 3. Initialize state for active tab, alert state, and edit mode
  const [activeTab, setActiveTab] = useState('general');
  const [alert, setAlert] = useState<{ message: string; severity: string } | null>(null);

  // Fetch settings on component mount
  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  // Update form values when notification settings change
  useEffect(() => {
    if (notificationSettings) {
      setFormValues(notificationSettings);
    }
  }, [notificationSettings]);

  // 4. Handle tab changes to switch between different settings sections
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  // 5. Handle form field changes to update state
  const handleFormChange = (key: string, value: any) => {
    setFormValues(prev => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  // 6. Handle save operation to update notification settings
  const handleSave = async () => {
    if (!formValues) return;

    try {
      await updateNotificationSettings(formValues);
      setAlert({ message: 'Notification settings updated successfully', severity: 'success' });
    } catch (err: any) {
      setAlert({ message: err.message || 'Failed to update notification settings', severity: 'error' });
    }
  };

  // 7. Render tabs for General Settings, Delivery Channels, and Alert Types
  const tabs = [
    { label: 'General Settings', value: 'general' },
    { label: 'Delivery Channels', value: 'delivery' },
    { label: 'Alert Types', value: 'alertTypes' }
  ];

  // 8. Render form controls for each settings section
  return (
    <Card title="Notification Settings" loading={loading === LoadingState.LOADING}>
      {alert && (
        <AlertNotification
          message={alert.message}
          severity={alert.severity as any}
          onDismiss={() => setAlert(null)}
        />
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

      {formValues && (
        <Box mt={3}>
          {activeTab === 'general' && (
            <GeneralSettingsTab
              formValues={formValues}
              onChange={handleFormChange}
              disabled={loading === LoadingState.LOADING}
            />
          )}
          {activeTab === 'delivery' && (
            <DeliveryChannelsTab
              formValues={formValues}
              onChange={handleFormChange}
              disabled={loading === LoadingState.LOADING}
            />
          )}
          {activeTab === 'alertTypes' && (
            <AlertTypesTab
              formValues={formValues}
              onChange={handleFormChange}
              disabled={loading === LoadingState.LOADING}
            />
          )}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="flex-end">
            <ActionButton
              label="Save Changes"
              icon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading === LoadingState.LOADING}
            />
          </Box>
        </Box>
      )}
    </Card>
  );
};

interface GeneralSettingsTabProps {
  formValues: NotificationSettings;
  onChange: (key: string, value: any) => void;
  disabled: boolean;
}

/**
 * Component for general notification settings
 *
 * @param {GeneralSettingsTabProps} { formValues, onChange, disabled } - Props for the component
 * @returns {JSX.Element} The rendered general settings form
 */
const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ formValues, onChange, disabled }) => {
  // 1. Render switches for enabling/disabling notification channels (email, SMS, push, in-app)
  // 2. Render digest settings controls (enable/disable, frequency, time)
  // 3. Handle form field changes and propagate to parent component
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch
            checked={formValues.emailEnabled}
            onChange={e => onChange('emailEnabled', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Enable Email Notifications"
      />
      <FormControlLabel
        control={
          <Switch
            checked={formValues.smsEnabled}
            onChange={e => onChange('smsEnabled', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Enable SMS Notifications"
      />
      <FormControlLabel
        control={
          <Switch
            checked={formValues.pushEnabled}
            onChange={e => onChange('pushEnabled', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Enable Push Notifications"
      />
      <FormControlLabel
        control={
          <Switch
            checked={formValues.inAppEnabled}
            onChange={e => onChange('inAppEnabled', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Enable In-App Notifications"
      />
      <Divider sx={{ my: 2 }} />
      <FormControlLabel
        control={
          <Switch
            checked={formValues.digestEnabled}
            onChange={e => onChange('digestEnabled', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Enable Daily Digest"
      />
      {formValues.digestEnabled && (
        <Grid container spacing={2} mt={1}>
          <Grid item xs={6}>
            <FormControl fullWidth variant="outlined" size="small" disabled={disabled}>
              <InputLabel id="digest-frequency-label">Frequency</InputLabel>
              <Select
                labelId="digest-frequency-label"
                value={formValues.digestFrequency}
                onChange={e => onChange('digestFrequency', e.target.value)}
                label="Frequency"
              >
                <MenuItem value={NotificationFrequency.DAILY}>Daily</MenuItem>
                <MenuItem value={NotificationFrequency.WEEKLY}>Weekly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Time"
              type="time"
              value={formValues.digestTime}
              onChange={e => onChange('digestTime', e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
              size="small"
              disabled={disabled}
            />
          </Grid>
        </Grid>
      )}
    </FormGroup>
  );
};

interface DeliveryChannelsTabProps {
  formValues: NotificationSettings;
  onChange: (key: string, value: any) => void;
  disabled: boolean;
}

/**
 * Component for notification delivery channel settings
 *
 * @param {DeliveryChannelsTabProps} { formValues, onChange, disabled } - Props for the component
 * @returns {JSX.Element} The rendered delivery channels form
 */
const DeliveryChannelsTab: React.FC<DeliveryChannelsTabProps> = ({ formValues, onChange, disabled }) => {
  // 1. Render email configuration settings (from address, template)
  // 2. Render SMS configuration settings (template)
  // 3. Render in-app notification settings
  // 4. Render push notification settings
  // 5. Handle form field changes and propagate to parent component
  return (
    <FormGroup>
      <TextField
        fullWidth
        label="Email From Address"
        value={formValues.emailFrom}
        onChange={e => onChange('emailFrom', e.target.value)}
        size="small"
        disabled={disabled}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Email Template"
        multiline
        rows={4}
        value={formValues.emailTemplate}
        onChange={e => onChange('emailTemplate', e.target.value)}
        size="small"
        disabled={disabled}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="SMS Template"
        multiline
        rows={4}
        value={formValues.smsTemplate}
        onChange={e => onChange('smsTemplate', e.target.value)}
        size="small"
        disabled={disabled}
        sx={{ mb: 2 }}
      />
      {/* Add more settings for in-app and push notifications as needed */}
    </FormGroup>
  );
};

interface AlertTypesTabProps {
  formValues: NotificationSettings;
  onChange: (key: string, value: any) => void;
  disabled: boolean;
}

/**
 * Component for managing notification alert types
 *
 * @param {AlertTypesTabProps} { formValues, onChange, disabled } - Props for the component
 * @returns {JSX.Element} The rendered alert types management interface
 */
const AlertTypesTab: React.FC<AlertTypesTabProps> = ({ formValues, onChange, disabled }) => {
  // 1. Render filter panel for searching and filtering alert types
  // 2. Render data table with alert type configurations
  // 3. Provide edit functionality for each alert type
  // 4. Handle adding new alert type configurations
  // 5. Handle deleting alert type configurations
  // 6. Render modal dialog for editing alert type details

  const [selectedAlertType, setSelectedAlertType] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = (alertType: any) => {
    setSelectedAlertType(alertType);
    setIsEditDialogOpen(true);
  };

  const handleSaveAlertType = (updatedAlertType: any) => {
    // Update the alert type in the form values
    const updatedAlertTypes = formValues.alertTypes.map(alertType =>
      alertType.type === updatedAlertType.type ? updatedAlertType : alertType
    );
    onChange('alertTypes', updatedAlertTypes);
    setIsEditDialogOpen(false);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  const alertTypeFilters = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      field: 'name',
      operator: 'contains'
    }
  ];

  const alertTypeColumns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    {
      field: 'channels',
      headerName: 'Channels',
      flex: 1,
      renderCell: (params: any) => (
        <Box>
          {params.value.map((channel: string) => (
            <Chip key={channel} label={channel} size="small" sx={{ mr: 0.5 }} />
          ))}
        </Box>
      )
    },
    {
      field: 'frequency',
      headerName: 'Frequency',
      flex: 1
    },
    {
      field: 'enabled',
      headerName: 'Enabled',
      type: 'boolean',
      width: 80
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 100,
      renderCell: (params: any) => (
        <Tooltip title="Edit">
          <IconButton onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box>
      <FilterPanel filters={alertTypeFilters} onFilterChange={() => {}} />
      <DataTable
        columns={alertTypeColumns}
        data={formValues.alertTypes}
        loading={disabled}
      />
      {selectedAlertType && (
        <AlertTypeEditDialog
          alertType={selectedAlertType}
          open={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onSave={handleSaveAlertType}
        />
      )}
    </Box>
  );
};

interface AlertTypeEditDialogProps {
  alertType: any;
  open: boolean;
  onClose: () => void;
  onSave: (alertType: any) => void;
}

/**
 * Dialog for editing alert type settings
 *
 * @param {AlertTypeEditDialogProps} { alertType, open, onClose, onSave } - Props for the component
 * @returns {JSX.Element} The rendered edit dialog
 */
const AlertTypeEditDialog: React.FC<AlertTypeEditDialogProps> = ({ alertType, open, onClose, onSave }) => {
  // 1. Initialize form state with alert type data
  // 2. Render form fields for alert type properties (name, description, enabled)
  // 3. Render channel selection with checkboxes
  // 4. Render frequency selection dropdown
  // 5. Handle form submission and validation
  // 6. Provide save and cancel buttons

  const [name, setName] = useState(alertType.name);
  const [description, setDescription] = useState(alertType.description);
  const [enabled, setEnabled] = useState(alertType.enabled);
  const [channels, setChannels] = useState(alertType.channels);
  const [frequency, setFrequency] = useState(alertType.frequency);

  const handleSave = () => {
    // Create updated alert type object
    const updatedAlertType = {
      ...alertType,
      name,
      description,
      enabled,
      channels,
      frequency
    };
    onSave(updatedAlertType);
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="alert-type-edit-dialog">
      <DialogTitle id="alert-type-edit-dialog">Edit Alert Type</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="dense"
        />
        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          margin="dense"
          multiline
          rows={3}
        />
        <FormControlLabel
          control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
          label="Enabled"
        />
        <FormControl fullWidth margin="dense">
          <InputLabel id="channel-select-label">Channels</InputLabel>
          <Select
            labelId="channel-select-label"
            multiple
            value={channels}
            onChange={e => setChannels(e.target.value as NotificationChannel[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            <MenuItem value={NotificationChannel.EMAIL}>Email</MenuItem>
            <MenuItem value={NotificationChannel.SMS}>SMS</MenuItem>
            <MenuItem value={NotificationChannel.IN_APP}>In-App</MenuItem>
            <MenuItem value={NotificationChannel.PUSH}>Push</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="dense">
          <InputLabel id="frequency-select-label">Frequency</InputLabel>
          <Select
            labelId="frequency-select-label"
            value={frequency}
            onChange={e => setFrequency(e.target.value as NotificationFrequency)}
            label="Frequency"
          >
            <MenuItem value={NotificationFrequency.IMMEDIATE}>Immediate</MenuItem>
            <MenuItem value={NotificationFrequency.DAILY}>Daily</MenuItem>
            <MenuItem value={NotificationFrequency.WEEKLY}>Weekly</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettings;