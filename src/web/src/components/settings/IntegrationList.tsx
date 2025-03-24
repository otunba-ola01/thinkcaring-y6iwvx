import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { Box, Typography, Chip, Tooltip, CircularProgress } from '@mui/material'; // v5.13.0
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PlayArrow as TestIcon } from '@mui/icons-material'; // v5.13.0

import Card from '../ui/Card';
import DataTable from '../ui/DataTable';
import ActionButton from '../ui/ActionButton';
import StatusBadge from '../ui/StatusBadge';
import useSettings from '../../hooks/useSettings';
import useToast from '../../hooks/useToast';
import { IntegrationType, IntegrationStatus, IntegrationSettings } from '../../types/settings.types';
import { TableColumn } from '../../types/ui.types';
import { testIntegrationConnection } from '../../api/settings.api';

/**
 * Helper function to get a human-readable label for an integration type
 * @param type The integration type
 * @returns The human-readable label
 */
const getIntegrationTypeLabel = (type: string): string => {
  switch (type) {
    case IntegrationType.EHR:
      return 'EHR System';
    case IntegrationType.CLEARINGHOUSE:
      return 'Clearinghouse';
    case IntegrationType.ACCOUNTING:
      return 'Accounting System';
    case IntegrationType.MEDICAID:
      return 'Medicaid Portal';
    case IntegrationType.PAYMENT_GATEWAY:
      return 'Payment Gateway';
    case IntegrationType.EMAIL:
      return 'Email Service';
    case IntegrationType.SMS:
      return 'SMS Service';
    default:
      return type;
  }
};

/**
 * Helper function to get the appropriate color for an integration status
 * @param status The integration status
 * @returns The color name for the status badge
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case IntegrationStatus.ACTIVE:
      return 'success';
    case IntegrationStatus.ERROR:
      return 'error';
    case IntegrationStatus.PENDING:
      return 'warning';
    case IntegrationStatus.INACTIVE:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Component for displaying a list of external system integrations
 * @param props 
 * @returns 
 */
const IntegrationList: React.FC = (props) => {
  // Extract onAddIntegration and onEditIntegration from props
  const { onAddIntegration, onEditIntegration } = props;

  // Extract integrationSettings and loading from useSettings hook
  const { integrationSettings, loading, fetchIntegrationSettings } = useSettings();

  // Extract showSuccess and showError from useToast hook
  const { showSuccess, showError } = useToast();

  // Set up state for testing status and integration being tested
  const [testingStatus, setTestingStatus] = useState<{ [key: string]: boolean }>({});
  const [integrationBeingTested, setIntegrationBeingTested] = useState<string | null>(null);

  // Define table columns for the integration list
  const columns: TableColumn[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      valueFormatter: (value) => getIntegrationTypeLabel(value),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        renderStatusBadge(params.row)
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        renderActionButtons(params.row)
      ),
    },
  ], [testingStatus]);

  /**
   * Function to handle testing an integration connection
   * @param integration 
   */
  const handleTestIntegration = async (integration: any) => {
    setIntegrationBeingTested(integration.id);
    setTestingStatus((prev) => ({ ...prev, [integration.id]: true }));

    try {
      const result = await testIntegrationConnection(integration.type, integration.config);
      showSuccess(result.message || `Successfully tested ${integration.name} connection`);
    } catch (error: any) {
      showError(error.message || `Failed to test ${integration.name} connection`);
    } finally {
      setTestingStatus((prev) => ({ ...prev, [integration.id]: false }));
      setIntegrationBeingTested(null);
    }
  };

  /**
   * Function to handle editing an integration
   * @param integration 
   */
  const handleEditIntegration = (integration: any) => {
    if (onEditIntegration) {
      onEditIntegration(integration);
    }
  };

  /**
   * Function to handle deleting an integration
   * @param integration 
   */
  const handleDeleteIntegration = (integration: any) => {
    // Implement delete logic here
    console.log('Delete integration:', integration);
  };

  /**
   * Function to render action buttons for each integration
   * @param integration 
   * @returns 
   */
  const renderActionButtons = (integration: any) => (
    <Box>
      <Tooltip title="Test Connection">
        <ActionButton
          label=""
          icon={<TestIcon />}
          onClick={() => handleTestIntegration(integration)}
          disabled={testingStatus[integration.id] || false}
          size="small"
          variant="text"
        />
      </Tooltip>
      <Tooltip title="Edit">
        <ActionButton
          label=""
          icon={<EditIcon />}
          onClick={() => handleEditIntegration(integration)}
          size="small"
          variant="text"
        />
      </Tooltip>
      <Tooltip title="Delete">
        <ActionButton
          label=""
          icon={<DeleteIcon />}
          onClick={() => handleDeleteIntegration(integration)}
          size="small"
          variant="text"
        />
      </Tooltip>
      {integrationBeingTested === integration.id && (
        <CircularProgress size={20} sx={{ ml: 1 }} />
      )}
    </Box>
  );

  /**
   * Function to render the integration status badge
   * @param integration 
   * @returns 
   */
  const renderStatusBadge = (integration: any) => (
    <StatusBadge
      status={integration.status}
      type="integration"
    />
  );

  // Prepare the data for the DataTable component
  const integrationData = useMemo(() => {
    return integrationSettings?.connections || [];
  }, [integrationSettings]);

  return (
    <Card
      title="External System Integrations"
      actions={
        <ActionButton
          label="Add Integration"
          icon={<AddIcon />}
          onClick={() => onAddIntegration && onAddIntegration()}
        />
      }
      loading={loading}
    >
      <DataTable
        columns={columns}
        data={integrationData}
        loading={loading}
      />
    </Card>
  );
};

export default IntegrationList;