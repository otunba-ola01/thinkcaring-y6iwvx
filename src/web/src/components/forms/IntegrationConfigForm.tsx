import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material'; // v5.13.0
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import useApiRequest from '../../hooks/useApiRequest';
import { settingsApi } from '../../api/settings.api';
import {
  IntegrationConnection,
  CreateIntegrationConnectionDto,
  UpdateIntegrationConnectionDto,
  IntegrationType,
  IntegrationStatus
} from '../../types/settings.types';

interface IntegrationConfigFormProps {
  integration?: IntegrationConnection;
  onSave: (integration: IntegrationConnection) => void;
  onCancel: () => void;
  onTest?: (integration: IntegrationConnection) => void;
}

/**
 * A form component for configuring external system integrations
 * @param props - The component props
 * @returns The rendered integration configuration form
 */
const IntegrationConfigForm: React.FC<IntegrationConfigFormProps> = ({
  integration,
  onSave,
  onCancel,
  onTest
}) => {
  // Initialize form with useForm hook using Zod validation schema
  const formMethods = useForm({
    defaultValues: getInitialValues(integration),
    validationSchema: getValidationSchema()
  });

  // Set up state for test connection status and result
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testConnectionResult, setTestConnectionResult] = useState<string | null>(null);

  // Initialize toast notification hook for success/error messages
  const toast = useToast();

  // Initialize API request hook for form submission
  const { execute: submitForm, loading: isSubmitting } = useApiRequest();

  // Create validation schema based on integration type
  const validationSchema = getValidationSchema();

  // Set initial form values based on provided integration or defaults
  useEffect(() => {
    formMethods.reset(getInitialValues(integration));
  }, [integration, formMethods.reset]);

  /**
   * Handler for form submission
   * @param data - The form data
   */
  const handleSave = formMethods.handleSubmit(async (data) => {
    try {
      if (integration) {
        // Update existing integration
        const updatedIntegration = await submitForm<IntegrationConnection>(() =>
          settingsApi.updateIntegrationConnection(integration.id, data as UpdateIntegrationConnectionDto)
        );
        toast.success('Integration connection updated successfully');
        onSave(updatedIntegration);
      } else {
        // Create new integration
        const newIntegration = await submitForm<IntegrationConnection>(() =>
          settingsApi.createIntegrationConnection(data as CreateIntegrationConnectionDto)
        );
        toast.success('Integration connection created successfully');
        onSave(newIntegration);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save integration connection');
    }
  });

  /**
   * Handler for testing the integration connection
   */
  const handleTestConnection = useCallback(async () => {
    if (!integration) {
      toast.error('Please save the integration before testing the connection.');
      return;
    }

    setTestConnectionStatus('loading');
    setTestConnectionResult(null);

    try {
      const testResult = await settingsApi.testIntegrationConnection(integration.id);
      setTestConnectionStatus('success');
      setTestConnectionResult(testResult.data.message || 'Connection successful');
      toast.success(testResult.data.message || 'Connection successful');
    } catch (error: any) {
      setTestConnectionStatus('error');
      setTestConnectionResult(error.message || 'Connection failed');
      toast.error(error.message || 'Connection failed');
    } finally {
      setTestConnectionStatus('idle');
    }
  }, [integration, toast]);

  /**
   * Handler for form cancellation
   */
  const handleCancelForm = () => {
    onCancel();
  };

  return (
    <Card title={integration ? 'Edit Integration Connection' : 'New Integration Connection'}>
      <Box component="form" onSubmit={handleSave} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Name"
              fullWidth
              {...formMethods.register('name')}
              error={!!formMethods.formState.errors.name}
              helperText={formMethods.formState.errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formMethods.formState.errors.type}>
              <InputLabel id="integration-type-label">Type</InputLabel>
              <Select
                labelId="integration-type-label"
                {...formMethods.register('type')}
                label="Type"
              >
                <MenuItem value={IntegrationType.EHR}>EHR</MenuItem>
                <MenuItem value={IntegrationType.CLEARINGHOUSE}>Clearinghouse</MenuItem>
                <MenuItem value={IntegrationType.ACCOUNTING}>Accounting</MenuItem>
                <MenuItem value={IntegrationType.MEDICAID}>Medicaid</MenuItem>
              </Select>
              {formMethods.formState.errors.type && (
                <FormHelperText>{formMethods.formState.errors.type.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Provider"
              fullWidth
              {...formMethods.register('provider')}
              error={!!formMethods.formState.errors.provider}
              helperText={formMethods.formState.errors.provider?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="integration-status-label">Status</InputLabel>
              <Select
                labelId="integration-status-label"
                {...formMethods.register('status')}
                label="Status"
              >
                <MenuItem value={IntegrationStatus.ACTIVE}>Active</MenuItem>
                <MenuItem value={IntegrationStatus.INACTIVE}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {getIntegrationTypeFields(formMethods.getValues().type, formMethods)}

        <Box sx={{ mt: 3 }}>
          <ActionButton
            label="Test Connection"
            icon={<TestIcon />}
            onClick={handleTestConnection}
            disabled={testConnectionStatus === 'loading'}
          />
          {testConnectionStatus === 'loading' && (
            <CircularProgress size={20} sx={{ ml: 1 }} />
          )}
          {testConnectionStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {testConnectionResult}
            </Alert>
          )}
          {testConnectionStatus === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {testConnectionResult}
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <ActionButton
            label="Cancel"
            icon={<CancelIcon />}
            onClick={handleCancelForm}
            variant="outlined"
          />
          <ActionButton
            label="Save"
            icon={<SaveIcon />}
            type="submit"
            disabled={isSubmitting}
          />
        </Box>
      </Box>
    </Card>
  );
};

/**
 * Helper function to create a validation schema based on integration type
 * @param type - type
 * @returns Zod validation schema for the integration form
 */
const getValidationSchema = () => {
  return z.object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
    type: z.nativeEnum(IntegrationType),
    provider: z.string().min(3, { message: 'Provider must be at least 3 characters' }),
    status: z.nativeEnum(IntegrationStatus),
    config: z.record(z.any()).optional(),
    credentials: z.record(z.any()).optional(),
  });
};

/**
 * Helper function to get initial form values based on integration data
 * @param integration - integration
 * @returns Initial form values
 */
const getInitialValues = (integration: IntegrationConnection | null) => {
  if (integration) {
    return {
      name: integration.name,
      type: integration.type,
      provider: integration.provider,
      status: integration.status,
      config: integration.config || {},
      credentials: integration.credentials || {},
    };
  } else {
    return {
      name: '',
      type: IntegrationType.EHR,
      provider: '',
      status: IntegrationStatus.INACTIVE,
      config: {},
      credentials: {},
    };
  }
};

/**
 * Helper function to render form fields based on integration type
 * @param type - type
 * @param formMethods - formMethods
 * @returns Form fields specific to the integration type
 */
const getIntegrationTypeFields = (type: IntegrationType, formMethods: any) => {
  switch (type) {
    case IntegrationType.EHR:
      return (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="API URL"
                fullWidth
                {...formMethods.register('config.apiUrl')}
                helperText="Enter the base URL for the EHR API"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Authentication Method"
                fullWidth
                {...formMethods.register('config.authMethod')}
                helperText="Select the authentication method for the EHR API"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="API Key"
                fullWidth
                {...formMethods.register('credentials.apiKey')}
                helperText="Enter the API key for the EHR API"
              />
            </Grid>
          </Grid>
        </>
      );
    case IntegrationType.CLEARINGHOUSE:
      return (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Submission Format"
                fullWidth
                {...formMethods.register('config.submissionFormat')}
                helperText="Enter the submission format for the clearinghouse"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Endpoint URL"
                fullWidth
                {...formMethods.register('config.endpointUrl')}
                helperText="Enter the endpoint URL for the clearinghouse"
              />
            </Grid>
          </Grid>
        </>
      );
    case IntegrationType.ACCOUNTING:
      return (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="API URL"
                fullWidth
                {...formMethods.register('config.apiUrl')}
                helperText="Enter the base URL for the Accounting API"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Export Format"
                fullWidth
                {...formMethods.register('config.exportFormat')}
                helperText="Select the export format for the Accounting API"
              />
            </Grid>
          </Grid>
        </>
      );
    case IntegrationType.MEDICAID:
      return (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Portal URL"
                fullWidth
                {...formMethods.register('config.portalUrl')}
                helperText="Enter the portal URL for Medicaid"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="State Code"
                fullWidth
                {...formMethods.register('config.stateCode')}
                helperText="Enter the state code for Medicaid"
              />
            </Grid>
          </Grid>
        </>
      );
    default:
      return <Typography>No additional fields for this integration type.</Typography>;
  }
};

export default IntegrationConfigForm;