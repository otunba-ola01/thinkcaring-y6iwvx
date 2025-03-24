import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next v13.4+
import { Box, Typography, Container, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'; // @mui/material v5.13.0
import { Add as AddIcon } from '@mui/icons-material'; // @mui/icons-material v5.13.0

import SettingsLayout from '../../components/layout/SettingsLayout';
import IntegrationList from '../../components/settings/IntegrationList';
import IntegrationForm from '../../components/settings/IntegrationForm';
import useSettings from '../../hooks/useSettings';
import useToast from '../../hooks/useToast';
import { ROUTES } from '../../constants/routes.constants';
import { IntegrationType, IntegrationStatus, IntegrationConnection, CreateIntegrationConnectionDto, UpdateIntegrationConnectionDto } from '../../types/settings.types';
import { createIntegrationConnection, updateIntegrationConnection, deleteIntegrationConnection, testIntegrationConnection } from '../../api/settings.api';

/**
 * Page component for managing integration settings
 */
const IntegrationsPage: NextPage = () => {
  // LD1: Initialize state for dialog visibility, selected integration, and form mode
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConnection | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // LD1: Get integration settings and loading state from useSettings hook
  const { integrationSettings, fetchIntegrationSettings, loading } = useSettings();

  // LD1: Get toast notification functions from useToast hook
  const { showSuccess, showError } = useToast();

  // LD1: Fetch integration settings on component mount
  useEffect(() => {
    fetchIntegrationSettings();
  }, [fetchIntegrationSettings]);

  // LD1: Define handler for opening the add integration dialog
  const handleOpenAddIntegrationDialog = useCallback(() => {
    setSelectedIntegration(null);
    setFormMode('add');
    setIsDialogOpen(true);
  }, []);

  // LD1: Define handler for opening the edit integration dialog
  const handleOpenEditIntegrationDialog = useCallback((integration: IntegrationConnection) => {
    setSelectedIntegration(integration);
    setFormMode('edit');
    setIsDialogOpen(true);
  }, []);

  // LD1: Define handler for closing the integration dialog
  const handleCloseIntegrationDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // LD1: Define handler for creating a new integration connection
  const handleCreateIntegration = useCallback(async (data: CreateIntegrationConnectionDto) => {
    try {
      await createIntegrationConnection(data);
      showSuccess('Integration created successfully');
      await fetchIntegrationSettings();
    } catch (error: any) {
      showError(error.message || 'Failed to create integration');
    } finally {
      handleCloseIntegrationDialog();
    }
  }, [fetchIntegrationSettings, showSuccess, showError, handleCloseIntegrationDialog]);

  // LD1: Define handler for updating an existing integration connection
  const handleUpdateIntegration = useCallback(async (id: string, data: UpdateIntegrationConnectionDto) => {
    try {
      await updateIntegrationConnection(id, data);
      showSuccess('Integration updated successfully');
      await fetchIntegrationSettings();
    } catch (error: any) {
      showError(error.message || 'Failed to update integration');
    } finally {
      handleCloseIntegrationDialog();
    }
  }, [fetchIntegrationSettings, showSuccess, showError, handleCloseIntegrationDialog]);

  // LD1: Define handler for deleting an integration connection
  const handleDeleteIntegration = useCallback(async (id: string) => {
    try {
      await deleteIntegrationConnection(id);
      showSuccess('Integration deleted successfully');
      await fetchIntegrationSettings();
    } catch (error: any) {
      showError(error.message || 'Failed to delete integration');
    }
  }, [fetchIntegrationSettings, showSuccess, showError]);

  // LD1: Define handler for testing an integration connection
  const handleTestIntegration = useCallback(async (integrationType: IntegrationType, connectionData: Record<string, any>) => {
    try {
      const testResult = await testIntegrationConnection(integrationType, connectionData);
      showSuccess(testResult.message || 'Connection test successful');
    } catch (error: any) {
      showError(error.message || 'Connection test failed');
    }
  }, [showSuccess, showError]);

  // LD1: Render the page with SettingsLayout wrapper
  return (
    <>
      <Head>
        <title>Integrations - ThinkCaring</title>
      </Head>
      <SettingsLayout activeTab={ROUTES.SETTINGS.INTEGRATIONS}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Integrations
          </Typography>
          {/* LD1: Render the IntegrationList component with appropriate handlers */}
          <IntegrationList
            onAddIntegration={handleOpenAddIntegrationDialog}
            onEditIntegration={handleOpenEditIntegrationDialog}
          />
          {/* LD1: Render a dialog for adding/editing integrations */}
          <Dialog open={isDialogOpen} onClose={handleCloseIntegrationDialog} fullWidth maxWidth="md">
            <DialogTitle>{formMode === 'add' ? 'Add Integration' : 'Edit Integration'}</DialogTitle>
            <DialogContent>
              {/* LD1: Render the IntegrationForm component inside the dialog when open */}
              <IntegrationForm
                integration={selectedIntegration || undefined}
                onSubmit={formMode === 'add' ? handleCreateIntegration : (data) => handleUpdateIntegration(selectedIntegration!.id, data)}
                onCancel={handleCloseIntegrationDialog}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseIntegrationDialog}>Cancel</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </SettingsLayout>
    </>
  );
};

// IE3: Export the IntegrationsPage component as the default export
export default IntegrationsPage;