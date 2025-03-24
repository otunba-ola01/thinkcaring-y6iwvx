import React, { useState, useEffect, useCallback, useMemo } from 'react'; // v18.2.0
import { Box, Typography, Button, Tooltip, Checkbox, IconButton, Divider, Chip, useTheme, SxProps, Theme } from '@mui/material'; // v5.13.0
import { FilterList, CheckCircle, Error, Warning, ArrowForward } from '@mui/icons-material'; // v5.13.0
import { useNavigate } from 'react-router-dom'; // v6.14.0
import { formatCurrency } from '../../utils/currency';
import { format as formatDate } from 'date-fns'; // v2.30.0

import DataTable from '../ui/DataTable';
import BillingFilter from './BillingFilter';
import StatusBadge from '../ui/StatusBadge';
import ActionButton from '../ui/ActionButton';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { BillingQueueFilter, ServiceSummary } from '../../types/billing.types';
import { DocumentationStatus, BillingStatus } from '../../types/services.types';
import { TableColumn } from '../../types/ui.types';
import { UUID } from '../../types/common.types';
import { billingApi } from '../../api/billing.api';
import useClaims from '../../hooks/useClaims';
import useToast from '../../hooks/useToast';

/**
 * Interface for BillingQueue component props
 */
interface BillingQueueProps {
  /**
   * Callback triggered when services are selected
   */
  onServiceSelect?: (serviceIds: UUID[]) => void;
  /**
   * Array of selected service IDs
   */
  selectedServices?: UUID[];
  /**
   * Custom styles to apply to the component
   */
  sx?: SxProps<Theme>;
}

/**
 * Component that displays a queue of services ready for billing with filtering, sorting, and selection capabilities
 */
const BillingQueue: React.FC<BillingQueueProps> = ({ onServiceSelect, selectedServices, sx }) => {
  // LD1: Initialize state for services, loading, pagination, filters, and selected services
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // LD1: Initialize hooks for toast notifications, navigation, and claims functionality
  const toast = useToast();
  const navigate = useNavigate();
  const { validateClaims } = useClaims();

  // LD1: Define table columns for the billing queue with appropriate formatting
  const tableColumns = useMemo(() => getTableColumns(), []);

  // LD1: Define function to fetch billing queue data based on current filters and pagination
  const fetchBillingQueue = useCallback(async (filter: BillingQueueFilter) => {
    setLoading(true);
    try {
      const response = await billingApi.getBillingQueue(filter);
      setServices(response.data.services);
      setTotalAmount(response.data.services.reduce((sum, service) => sum + service.amount, 0));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // LD1: Define function to handle filter changes and update state
  const handleFilterChange = useCallback((filterValues: any) => {
    fetchBillingQueue(filterValues);
  }, [fetchBillingQueue]);

  // LD1: Define function to handle service selection and update state
  const handleServiceSelect = useCallback((serviceId: UUID) => {
    if (onServiceSelect) {
      const newSelectedServices = selectedServices?.includes(serviceId)
        ? selectedServices.filter((id) => id !== serviceId)
        : [...(selectedServices || []), serviceId];
      onServiceSelect(newSelectedServices);
    }
  }, [onServiceSelect, selectedServices]);

  // LD1: Define function to handle row click for service details
  const handleRowClick = useCallback((service: ServiceSummary) => {
    // TODO: Navigate to service details page
    console.log('Clicked service:', service);
  }, []);

  // LD1: Define function to handle validation of selected services
  const handleValidateServices = useCallback(async () => {
    // LD1: Check if any services are selected
    if (!selectedServices || selectedServices.length === 0) {
      toast.warning('Please select at least one service to validate.');
      return;
    }

    // LD1: Set loading state to true
    setLoading(true);

    try {
      // LD1: Call validateServicesForBilling API with selected service IDs
      const validationResponse = await validateClaims(selectedServices);

      // LD1: Process validation results
      if (validationResponse && validationResponse.isValid) {
        // LD1: If validation successful, show success toast with summary
        toast.success(`Successfully validated ${selectedServices.length} services.`);
      } else if (validationResponse && !validationResponse.isValid && validationResponse.totalWarnings > 0) {
        // LD1: If validation has warnings, show warning toast
        toast.warning(`Validation completed with warnings. Please review the results.`);
      } else {
        // LD1: If validation fails, show error toast with details
        toast.error('Validation failed. Please review the errors.');
      }

      // LD1: Navigate to validation results page if validation was performed
      navigate('/billing/validation');
    } catch (error: any) {
      // LD1: If validation fails, show error toast with details
      toast.error(error.message);
    } finally {
      // LD1: Set loading state to false
      setLoading(false);
    }
  }, [selectedServices, toast, navigate, validateClaims]);

  // LD1: Define function to handle proceeding to claim creation with selected services
  const handleProceedToClaim = useCallback(() => {
    // LD1: Check if any services are selected
    if (!selectedServices || selectedServices.length === 0) {
      toast.warning('Please select at least one service to create a claim.');
      return;
    }

    // LD1: Navigate to claim creation page with selected service IDs as URL parameters
    navigate(`/billing/claim-creation?serviceIds=${selectedServices.join(',')}`);
  }, [selectedServices, toast, navigate]);

  // LD1: Use useEffect to fetch billing queue data on component mount and when dependencies change
  useEffect(() => {
    fetchBillingQueue({});
  }, [fetchBillingQueue]);

  return (
    <Card title="Billing Queue" sx={sx}>
      <BillingFilter onFilterChange={handleFilterChange} loading={loading} />
      {services && services.length > 0 ? (
        <>
          <DataTable
            columns={tableColumns}
            data={services}
            loading={loading}
            selectable={true}
            onSelectionChange={(selected) => {
              if (onServiceSelect) {
                onServiceSelect(selected.map((s) => s.id));
              }
            }}
            selectedRows={services.filter((s) => selectedServices?.includes(s.id))}
            onRowClick={handleRowClick}
          />
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">
              {selectedServices && selectedServices.length > 0
                ? `${selectedServices.length} services selected`
                : 'No services selected'}
            </Typography>
            <Typography variant="h6">
              Total Amount: {formatCurrency(totalAmount)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <ActionButton label="Validate Services" onClick={handleValidateServices} disabled={loading} />
            <ActionButton label="Proceed to Claim" onClick={handleProceedToClaim} disabled={loading} icon={<ArrowForward />} />
          </Box>
        </>
      ) : (
        <EmptyState title="No Services Available" description="There are no services available for billing at this time." />
      )}
    </Card>
  );
};

/**
 * Defines the columns configuration for the billing queue data table
 */
const getTableColumns = (): TableColumn[] => {
  return [
    {
      field: 'clientName',
      headerName: 'Client',
      width: 150,
    },
    {
      field: 'serviceType',
      headerName: 'Service Type',
      width: 150,
    },
    {
      field: 'serviceDate',
      headerName: 'Date',
      width: 100,
      valueFormatter: (value) => formatDate(new Date(value), 'MM/dd/yyyy'),
    },
    {
      field: 'units',
      headerName: 'Units',
      width: 80,
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 100,
      valueFormatter: formatCurrency,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      valueFormatter: formatCurrency,
    },
    {
      field: 'documentationStatus',
      headerName: 'Documentation',
      width: 140,
      type: 'status',
      statusType: 'documentation',
    },
    {
      field: 'billingStatus',
      headerName: 'Billing Status',
      width: 130,
      type: 'status',
      statusType: 'billing',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <>
          <Tooltip title="View Details">
            <IconButton size="small">
              <CheckCircle />
            </IconButton>
          </Tooltip>
          <Tooltip title="Documentation Issues">
            <IconButton size="small" color="warning">
              <Warning />
            </IconButton>
          </Tooltip>
          <Tooltip title="Billing Errors">
            <IconButton size="small" color="error">
              <Error />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];
};

/**
 * Handles the validation of selected services for billing
 * @param serviceIds - Array of service IDs to validate
 */
const handleValidateServices = async (serviceIds: UUID[]): Promise<void> => {
  // TODO: Implement validation logic
  console.log('Validating services:', serviceIds);
};

/**
 * Handles proceeding to claim creation with selected services
 * @param serviceIds - Array of service IDs to include in the claim
 */
const handleProceedToClaim = (serviceIds: UUID[]): void => {
  // TODO: Implement navigation to claim creation page
  console.log('Proceeding to claim creation with services:', serviceIds);
};

export default BillingQueue;

export type BillingQueueProps = BillingQueueProps;