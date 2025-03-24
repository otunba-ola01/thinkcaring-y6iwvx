import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next/head v13.4+
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Paper,
  Divider
} from '@mui/material'; // @mui/material v5.13+
import { 
  Add, 
  Refresh, 
  Delete, 
  ContentCopy,
  Visibility,
  VisibilityOff,
  Key
} from '@mui/icons-material'; // @mui/icons-material v5.13+
import { useFormik } from 'formik'; // formik v2.4+
import * as Yup from 'yup'; // yup v1.2+

import ProfileLayout from '../../components/layout/ProfileLayout';
import { useAuthContext } from '../../context/AuthContext';
import { useApiRequest } from '../../hooks/useApiRequest';
import useToast from '../../hooks/useToast';
import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { formatDate } from '../../utils/date';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import ActionButton from '../../components/ui/ActionButton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';

/**
 * Interface defining the structure of an API key
 */
interface ApiKey {
  id: string;
  name: string;
  key?: string;
  prefix: string;
  permissions: string[];
  expiresAt: string;
  lastUsed: string | null;
  createdAt: string;
}

/**
 * Interface defining the structure of the API key creation request
 */
interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresAt: string;
}

/**
 * Available permissions that can be assigned to API keys
 */
const API_PERMISSIONS = [
  { value: 'api:read', label: 'Read Access', description: 'Allows reading data through the API' },
  { value: 'api:write', label: 'Write Access', description: 'Allows creating and updating data through the API' },
  { value: 'api:delete', label: 'Delete Access', description: 'Allows deleting data through the API' },
  { value: 'api:billing', label: 'Billing Access', description: 'Allows access to billing and claims operations' },
  { value: 'api:reports', label: 'Reports Access', description: 'Allows access to reporting functionality' },
];

/**
 * Available expiration period options for API keys
 */
const EXPIRATION_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
  { value: '365', label: '1 year' },
  { value: '730', label: '2 years' },
];

/**
 * Column definitions for the API keys data table
 */
const API_KEY_COLUMNS = [
  { id: 'name', label: 'Name', minWidth: 150 },
  { id: 'prefix', label: 'Key', minWidth: 120 },
  { id: 'permissions', label: 'Permissions', minWidth: 200, format: 'custom' },
  { id: 'createdAt', label: 'Created', minWidth: 120, format: 'date' },
  { id: 'expiresAt', label: 'Expires', minWidth: 120, format: 'date' },
  { id: 'lastUsed', label: 'Last Used', minWidth: 120, format: 'date' },
  { id: 'actions', label: 'Actions', minWidth: 150, align: 'right', format: 'custom' },
];

/**
 * The main page component for managing API keys
 * @returns {JSX.Element} The rendered API keys page
 */
const ApiKeysPage: NextPage = () => {
  // Get user and hasPermission from useAuthContext
  const { user, hasPermission } = useAuthContext();

  // Initialize state for API keys, loading state, and dialog visibility
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  // Initialize toast notification hook
  const toast = useToast();

  // Hook for making API requests with loading state management
  const { execute: createApiKeyRequest } = useApiRequest<ApiKey>({
    method: 'post',
    url: `${API_ENDPOINTS.AUTH.MFA}/api-keys`,
  });

  // Hook for making API requests with loading state management
  const { execute: regenerateApiKeyRequest } = useApiRequest<ApiKey>({
    method: 'post',
    url: `${API_ENDPOINTS.AUTH.MFA}/api-keys/[id]/regenerate`,
  });

  // Hook for making API requests with loading state management
  const { execute: revokeApiKeyRequest } = useApiRequest<ApiKey>({
    method: 'delete',
    url: `${API_ENDPOINTS.AUTH.MFA}/api-keys/[id]`,
  });

  // Check if user has permission to manage API keys
  const canManageApiKeys = hasPermission('api:manage');

  // Fetch API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<ApiKey[]>(`${API_ENDPOINTS.AUTH.MFA}/api-keys`);
        setApiKeys(response);
      } catch (error: any) {
        toast.error(`Failed to fetch API keys: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, [toast]);

  // Formik form for creating API keys
  const formik = useFormik({
    initialValues: {
      name: '',
      permissions: [],
      expiresIn: '365',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      permissions: Yup.array().min(1, 'At least one permission is required'),
      expiresIn: Yup.string().required('Expiration is required'),
    }),
    onSubmit: async (values: CreateApiKeyRequest) => {
      try {
        const response = await apiClient.post<ApiKey>(`${API_ENDPOINTS.AUTH.MFA}/api-keys`, values);
        setNewApiKey(response.key || '');
        setApiKeys([...apiKeys, response]);
        toast.success(`API key "${response.name}" created successfully!`);
      } catch (error: any) {
        toast.error(`Failed to create API key: ${error.message}`);
      } finally {
        toggleCreateDialog();
        formik.resetForm();
      }
    },
  });

  // Function to fetch API keys
  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<ApiKey[]>(`${API_ENDPOINTS.AUTH.MFA}/api-keys`);
      setApiKeys(response);
    } catch (error: any) {
      toast.error(`Failed to fetch API keys: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Function to create a new API key
  const handleCreateApiKey = useCallback(async (values: CreateApiKeyRequest) => {
    try {
      const response = await apiClient.post<ApiKey>(`${API_ENDPOINTS.AUTH.MFA}/api-keys`, values);
      setNewApiKey(response.key || '');
      setApiKeys([...apiKeys, response]);
      toast.success(`API key "${response.name}" created successfully!`);
    } catch (error: any) {
      toast.error(`Failed to create API key: ${error.message}`);
    } finally {
      toggleCreateDialog();
      formik.resetForm();
    }
  }, [apiKeys, toast, formik]);

  // Function to regenerate an existing API key
  const handleRegenerateApiKey = useCallback(async (id: string) => {
    try {
      const response = await apiClient.post<ApiKey>(`${API_ENDPOINTS.AUTH.MFA}/api-keys/${id}/regenerate`);
      setNewApiKey(response.key || '');
      setApiKeys(apiKeys.map(key => (key.id === id ? response : key)));
      toast.success(`API key "${response.name}" regenerated successfully!`);
    } catch (error: any) {
      toast.error(`Failed to regenerate API key: ${error.message}`);
    } finally {
      toggleViewKeyDialog(null);
    }
  }, [apiKeys, toast]);

  // Function to revoke (delete) an API key
  const handleRevokeApiKey = useCallback(async (id: string) => {
    try {
      await apiClient.del(`${API_ENDPOINTS.AUTH.MFA}/api-keys/${id}`);
      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success('API key revoked successfully!');
    } catch (error: any) {
      toast.error(`Failed to revoke API key: ${error.message}`);
    } finally {
      toggleViewKeyDialog(null);
    }
  }, [apiKeys, toast]);

  // Function to copy an API key to the clipboard
  const handleCopyApiKey = useCallback(async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('API key copied to clipboard!');
    } catch (error: any) {
      toast.error('Failed to copy API key to clipboard.');
    }
  }, [toast]);

  // Function to toggle the visibility of the create API key dialog
  const toggleCreateDialog = useCallback(() => {
    setCreateDialogOpen(!createDialogOpen);
    formik.resetForm();
  }, [createDialogOpen, formik]);

  // Function to toggle the visibility of the view API key dialog
  const toggleViewKeyDialog = useCallback((key: ApiKey | null) => {
    setSelectedApiKey(key);
    setViewDialogOpen(!!key);
  }, [setViewDialogOpen, setSelectedApiKey]);

  // Function to render custom cells in the data table
  const renderCell = (column: any, row: any) => {
    switch (column.id) {
      case 'permissions':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {row.permissions.map((permission: string) => (
              <Chip label={getPermissionLabel(permission)} key={permission} size="small" />
            ))}
          </Box>
        );
      case 'createdAt':
      case 'expiresAt':
      case 'lastUsed':
        return row[column.id] ? formatDate(row[column.id]) : 'Never';
      case 'actions':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="View API Key">
              <IconButton size="small" onClick={() => toggleViewKeyDialog(row)}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <ActionButton
              label="Revoke"
              icon={<Delete fontSize="small" />}
              onClick={() => handleRevokeApiKey(row.id)}
              confirmText="Are you sure you want to revoke this API key? This action cannot be undone."
              variant="outlined"
              color="error"
              size="small"
              disabled={!canManageApiKeys}
            />
          </Box>
        );
      default:
        return row[column.id];
    }
  };

  // Function to get the label for a permission
  const getPermissionLabel = (permission: string) => {
    const permissionObj = API_PERMISSIONS.find(p => p.value === permission);
    return permissionObj ? permissionObj.label : permission;
  };

  // Function to render permission chips in the create API key dialog
  const renderPermissionChips = (selected: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((value) => (
        <Chip key={value} label={getPermissionLabel(value)} />
      ))}
    </Box>
  );

  // Render the page with ProfileLayout
  return (
    <ProfileLayout activeTab="api-keys">
      <Head>
        <title>API Keys - HCBS Revenue Management</title>
      </Head>
      <Box sx={{ mb: 4 }} aria-labelledby="api-keys-title" role="main">
        <Typography variant="h4" component="h1" gutterBottom id="api-keys-title">
          API Keys
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your API keys for integrating with external systems. API keys provide secure access to the HCBS Revenue Management System API.
        </Typography>
      </Box>
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Your API Keys</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={toggleCreateDialog} disabled={!canManageApiKeys}>
            Create API Key
          </Button>
        </Box>
        <DataTable 
          columns={API_KEY_COLUMNS} 
          data={apiKeys} 
          loading={loading} 
          emptyState={
            <EmptyState 
              title="No API Keys" 
              description="You haven't created any API keys yet. Click the 'Create API Key' button to get started." 
              icon={<Key fontSize="large" />} 
            />
          }
          renderCell={renderCell}
          aria-label="API Keys"
        />
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onClose={toggleCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              id="name"
              name="name"
              label="API Key Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <FormControl fullWidth margin="normal" error={formik.touched.permissions && Boolean(formik.errors.permissions)}>
              <InputLabel id="permissions-label">Permissions</InputLabel>
              <Select
                labelId="permissions-label"
                id="permissions"
                name="permissions"
                multiple
                value={formik.values.permissions}
                onChange={formik.handleChange}
                renderValue={(selected) => renderPermissionChips(selected as string[])}
              >
                {API_PERMISSIONS.map((permission) => (
                  <MenuItem value={permission.value} key={permission.value}>
                    {permission.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{formik.touched.permissions && formik.errors.permissions}</FormHelperText>
            </FormControl>
            <FormControl fullWidth margin="normal" error={formik.touched.expiresIn && Boolean(formik.errors.expiresIn)}>
              <InputLabel id="expiration-label">Expiration</InputLabel>
              <Select
                labelId="expiration-label"
                id="expiresIn"
                name="expiresIn"
                value={formik.values.expiresIn}
                onChange={formik.handleChange}
              >
                {EXPIRATION_OPTIONS.map((option) => (
                  <MenuItem value={option.value} key={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{formik.touched.expiresIn && formik.errors.expiresIn}</FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleCreateDialog}>Cancel</Button>
          <Button type="submit" variant="contained" onClick={formik.handleSubmit} disabled={formik.isSubmitting}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* View API Key Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => toggleViewKeyDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Name</Typography>
            <Typography variant="body1" gutterBottom>{selectedApiKey?.name}</Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Key Prefix</Typography>
            <Typography variant="body1" gutterBottom>{selectedApiKey?.prefix}</Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>Permissions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {selectedApiKey?.permissions?.map(permission => (
                <Chip label={getPermissionLabel(permission)} key={permission} size="small" />
              )) || []}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Created</Typography>
                <Typography variant="body2">{formatDate(selectedApiKey?.createdAt)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Expires</Typography>
                <Typography variant="body2">{formatDate(selectedApiKey?.expiresAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Last Used</Typography>
                <Typography variant="body2">{selectedApiKey?.lastUsed ? formatDate(selectedApiKey.lastUsed) : 'Never'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => toggleViewKeyDialog(null)}>Close</Button>
          <Button variant="outlined" color="primary" startIcon={<Refresh />} onClick={() => handleRegenerateApiKey(selectedApiKey?.id || '')} disabled={!canManageApiKeys}>
            Regenerate
          </Button>
          <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => handleRevokeApiKey(selectedApiKey?.id || '')} disabled={!canManageApiKeys}>
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {/* New API Key Dialog */}
      <Dialog open={!!newApiKey} onClose={() => setNewApiKey(null)} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Created</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Your new API key has been created. Please copy it now as you won't be able to see it again.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2, backgroundColor: 'grey.100', fontFamily: 'monospace', position: 'relative' }}>
              <Typography variant="body2" component="div" sx={{ wordBreak: 'break-all' }}>
                {newApiKey}
              </Typography>
              <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => handleCopyApiKey(newApiKey || '')}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Paper>
            <Typography variant="body2" color="error">
              Important: Store this API key securely. For security reasons, we cannot show it again.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewApiKey(null)}>Close</Button>
          <Button variant="contained" onClick={() => handleCopyApiKey(newApiKey || '')}>
            Copy API Key
          </Button>
        </DialogActions>
      </Dialog>
    </ProfileLayout>
  );
};

export default ApiKeysPage;