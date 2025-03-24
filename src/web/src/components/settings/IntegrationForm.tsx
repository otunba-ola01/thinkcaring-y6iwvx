import React, { useState, useEffect, useMemo } from 'react'; // react v18.2.0
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  IconButton,
  InputAdornment
} from '@mui/material'; // v5.13.0
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PlayArrow as TestIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import Card from '../ui/Card';
import useForm from '../../hooks/useForm';
import useSettings from '../../hooks/useSettings';
import useToast from '../../hooks/useToast';
import FileUploader from '../ui/FileUploader';
import {
  IntegrationType,
  IntegrationStatus,
  CreateIntegrationConnectionDto,
  UpdateIntegrationConnectionDto,
  IntegrationConnection
} from '../../types/settings.types';
import { testIntegrationConnection, createIntegrationConnection, updateIntegrationConnection } from '../../api/settings.api';

/**
 * Component for creating or editing integration connections
 * @param props 
 * @returns The rendered integration form component
 */
const IntegrationForm: React.FC<{
  integration?: IntegrationConnection;
  onSubmit: (data: any) => void;
  onCancel: ()() => void;
}> = ({ integration, onSubmit, onCancel }) => {
  // 1. Extract integration, onSubmit, onCancel, and onTest from props
  // 2. Set up state for form submission, testing status, and password visibility
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 3. Initialize useSettings hook to access integration settings
  const settings = useSettings();

  // 4. Initialize useToast hook for displaying success and error messages
  const toast = useToast();

  // 5. Create validation schema using Zod for form validation
  const validationSchema = useMemo(() => {
    return z.object({
      name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
      type: z.nativeEnum(IntegrationType, {
        errorMap: () => ({ message: 'Please select an integration type' })
      }),
      provider: z.string().min(3, { message: 'Provider must be at least 3 characters' }),
      status: z.nativeEnum(IntegrationStatus, {
        errorMap: () => ({ message: 'Please select a status' })
      }),
      config: z.record(z.any()).optional(),
      credentials: z.record(z.any()).optional()
    });
  }, []);

  // 6. Initialize form with useForm hook, providing validation schema and default values
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<any>({
    validationSchema,
    defaultValues: {
      name: integration?.name || '',
      type: integration?.type || '',
      provider: integration?.provider || '',
      status: integration?.status || '',
      config: integration?.config || {},
      credentials: integration?.credentials || {}
    }
  });

  // 7. Create a function to handle form submission
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (integration) {
        // Update existing integration
        await settings.updateIntegrationSettings(data);
        toast.success('Integration updated successfully');
      } else {
        // Create new integration
        await settings.createIntegrationSettings(data);
        toast.success('Integration created successfully');
      }
      onSubmit(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Create a function to handle integration testing
  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      if (!integration) {
        toast.warning('Please save the integration before testing');
        return;
      }
      const testResult = await settings.testIntegrationConnection(integration.type, integration.config);
      if (testResult.success) {
        toast.success(testResult.message || 'Connection test successful');
      } else {
        toast.error(testResult.message || 'Connection test failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  // 9. Create a function to toggle password field visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  // 10. Create dynamic form fields based on integration type
  const integrationTypeOptions = useMemo(() => getIntegrationTypeOptions(), []);
  const integrationStatusOptions = useMemo(() => getIntegrationStatusOptions(), []);
  const providerOptions = useMemo(() => {
    return getProviderOptions(integration?.type as IntegrationType);
  }, [integration?.type]);
  const configFields = useMemo(() => {
    return getConfigFields(integration?.type as IntegrationType, integration?.provider || '');
  }, [integration?.type, integration?.provider]);
  const credentialFields = useMemo(() => {
    return getCredentialFields(integration?.type as IntegrationType, integration?.provider || '');
  }, [integration?.type, integration?.provider]);

  // 11. Render a Card component containing the integration form
  return (
    <Card title={integration ? 'Edit Integration' : 'Create Integration'}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          {/* 12. Render form fields for integration name, type, provider, and status */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Name"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel id="integration-type-label">Type</InputLabel>
              <Select
                labelId="integration-type-label"
                label="Type"
                {...register('type')}
              >
                {integrationTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <FormHelperText>{errors.type.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Provider"
              fullWidth
              {...register('provider')}
              error={!!errors.provider}
              helperText={errors.provider?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.status}>
              <InputLabel id="integration-status-label">Status</InputLabel>
              <Select
                labelId="integration-status-label"
                label="Status"
                {...register('status')}
              >
                {integrationStatusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* 13. Render dynamic configuration fields based on integration type */}
          {configFields.map((field) => (
            <Grid item xs={12} key={field.name}>
              <TextField
                label={field.label}
                fullWidth
                {...register(`config.${field.name}`)}
                helperText={field.helperText}
              />
            </Grid>
          ))}

          {/* 14. Render credential fields with secure password handling */}
          {credentialFields.map((field) => (
            <Grid item xs={12} key={field.name}>
              <TextField
                label={field.label}
                fullWidth
                type={field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type}
                {...register(`credentials.${field.name}`)}
                InputProps={field.type === 'password' ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                } : undefined}
                helperText={field.helperText}
              />
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {/* 15. Include test connection button for validating the integration */}
          <Button
            variant="outlined"
            startIcon={isTesting ? <CircularProgress size={16} /> : <TestIcon />}
            disabled={isTesting || isSubmitting}
            onClick={handleTestConnection}
            sx={{ mr: 2 }}
          >
            Test Connection
          </Button>

          {/* 16. Include submit and cancel buttons with appropriate loading states */}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
            type="submit"
            sx={{ mr: 1 }}
          >
            {isSubmitting ? <CircularProgress size={16} /> : 'Save'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Card>
  );
};

/**
 * Helper function to get integration type options for select field
 * @returns Array of select options for integration types
 */
const getIntegrationTypeOptions = () => {
  return Object.values(IntegrationType).map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));
};

/**
 * Helper function to get integration status options for select field
 * @returns Array of select options for integration statuses
 */
const getIntegrationStatusOptions = () => {
  return Object.values(IntegrationStatus).map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  }));
};

/**
 * Helper function to get provider options based on integration type
 * @param IntegrationType 
 * @returns Array of select options for providers
 */
const getProviderOptions = (integrationType: IntegrationType | undefined) => {
  switch (integrationType) {
    case IntegrationType.EHR:
      return [
        { value: 'therap', label: 'Therap' },
        { value: 'sandata', label: 'Sandata' },
        { value: 'อื่น ๆ', label: 'Other' },
      ];
    case IntegrationType.CLEARINGHOUSE:
      return [
        { value: 'changeHealthcare', label: 'Change Healthcare' },
        { value: 'availity', label: 'Availity' },
        { value: 'อื่น ๆ', label: 'Other' },
      ];
    case IntegrationType.ACCOUNTING:
      return [
        { value: 'quickbooks', label: 'QuickBooks' },
        { value: 'netsuite', label: 'NetSuite' },
        { value: 'sageIntacct', label: 'Sage Intacct' },
        { value: 'อื่น ๆ', label: 'Other' },
      ];
    case IntegrationType.MEDICAID:
      return [
        { value: 'stateMedicaid', label: 'State Medicaid Portal' },
        { value: 'อื่น ๆ', label: 'Other' },
      ];
    default:
      return [];
  }
};

/**
 * Helper function to get configuration fields based on integration type and provider
 * @param IntegrationType 
 * @param provider 
 * @returns Array of configuration field definitions
 */
const getConfigFields = (integrationType: IntegrationType | undefined, provider: string) => {
  switch (integrationType) {
    case IntegrationType.EHR:
      return [
        { name: 'apiUrl', label: 'API URL', type: 'text', helperText: 'Enter the base URL for the EHR API' },
        { name: 'apiVersion', label: 'API Version', type: 'text', helperText: 'Enter the version of the API' },
        { name: 'dataFormat', label: 'Data Format', type: 'text', helperText: 'Enter the format of the data (e.g., JSON, XML)' },
      ];
    case IntegrationType.CLEARINGHOUSE:
      return [
        { name: 'submissionUrl', label: 'Submission URL', type: 'text', helperText: 'Enter the URL for claim submission' },
        { name: 'responseUrl', label: 'Response URL', type: 'text', helperText: 'Enter the URL for receiving responses' },
        { name: 'dataFormat', label: 'Data Format', type: 'text', helperText: 'Enter the format of the data (e.g., EDI X12)' },
      ];
    case IntegrationType.ACCOUNTING:
      return [
        { name: 'apiUrl', label: 'API URL', type: 'text', helperText: 'Enter the base URL for the accounting API' },
        { name: 'syncFrequency', label: 'Sync Frequency', type: 'text', helperText: 'Enter the frequency for data synchronization' },
      ];
    case IntegrationType.MEDICAID:
      return [
        { name: 'portalUrl', label: 'Portal URL', type: 'text', helperText: 'Enter the URL for the Medicaid portal' },
        { name: 'submissionFormat', label: 'Submission Format', type: 'text', helperText: 'Enter the format for claim submission' },
      ];
    default:
      return [];
  }
};

/**
 * Helper function to get credential fields based on integration type and provider
 * @param IntegrationType 
 * @param provider 
 * @returns Array of credential field definitions
 */
const getCredentialFields = (integrationType: IntegrationType | undefined, provider: string) => {
  switch (integrationType) {
    case IntegrationType.EHR:
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', helperText: 'Enter the API key for authentication' },
        { name: 'clientId', label: 'Client ID', type: 'text', helperText: 'Enter the client ID' },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', helperText: 'Enter the client secret' },
      ];
    case IntegrationType.CLEARINGHOUSE:
      return [
        { name: 'username', label: 'Username', type: 'text', helperText: 'Enter the username for the clearinghouse' },
        { name: 'password', label: 'Password', type: 'password', helperText: 'Enter the password for the clearinghouse' },
        { name: 'submitterId', label: 'Submitter ID', type: 'text', helperText: 'Enter the submitter ID' },
      ];
    case IntegrationType.ACCOUNTING:
      return [
        { name: 'apiKey', label: 'API Key', type: 'password', helperText: 'Enter the API key for authentication' },
        { name: 'username', label: 'Username', type: 'text', helperText: 'Enter the username for the accounting system' },
        { name: 'password', label: 'Password', type: 'password', helperText: 'Enter the password for the accounting system' },
      ];
    case IntegrationType.MEDICAID:
      return [
        { name: 'username', label: 'Username', type: 'text', helperText: 'Enter the username for the Medicaid portal' },
        { name: 'password', label: 'Password', type: 'password', helperText: 'Enter the password for the Medicaid portal' },
        { name: 'providerId', label: 'Provider ID', type: 'text', helperText: 'Enter the provider ID' },
      ];
    default:
      return [];
  }
};

export default IntegrationForm;