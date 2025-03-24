import React, { useState, useEffect, useMemo, useCallback } from 'react'; // v18.2.0
import { Box, Typography, Button, Card, CardContent, Tooltip, IconButton } from '@mui/material'; // v5.13.0
import { Visibility, Edit, Delete, Add } from '@mui/icons-material'; // v5.13.0
import { format as formatDate } from 'date-fns'; // v2.30.0

import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';
import ServiceFilter from './ServiceFilter';
import EmptyState from '../ui/EmptyState';
import useServices from '../../hooks/useServices';
import useResponsive from '../../hooks/useResponsive';
import { ServiceListProps, ServiceSummary, DocumentationStatus, BillingStatus } from '../../types/services.types';
import { TableColumn } from '../../types/ui.types';
import { LoadingState } from '../../types/common.types';
import { DOCUMENTATION_STATUS_LABELS, BILLING_STATUS_LABELS } from '../../constants/services.constants';
import { formatCurrency } from '../../utils/currency';

/**
 * Component that displays a list of services with filtering, sorting, and pagination
 * @param props - ServiceListProps
 * @returns The rendered ServiceList component
 */
const ServiceList: React.FC<ServiceListProps> = (props: ServiceListProps) => {
  // LD1: Destructure props to extract clientId, programId, onServiceSelect, selectable, and sx
  const { clientId, programId, onServiceSelect, selectable, sx } = props;

  // LD1: Initialize useServices hook with clientId and programId
  const {
    services,
    loading,
    error,
    filterState,
    paginationState,
    sortState,
    fetchServices,
    totalItems,
    totalPages,
    isCreating,
    isUpdating,
    isDeleting,
    isValidating,
    isUpdatingBillingStatus,
    isUpdatingDocumentationStatus,
    isBulkUpdating,
    isFetchingMetrics,
  } = useServices({ clientId, programId });

  // LD1: Initialize useResponsive hook to determine current device size
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // LD1: Define table columns with appropriate configuration for service data
  const columns: TableColumn[] = useMemo(() => getServiceColumns(isMobile, isTablet), [isMobile, isTablet]);

  // LD1: Handle row click to call onServiceSelect callback if provided
  const handleRowClick = useCallback((service: ServiceSummary) => {
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  }, [onServiceSelect]);

  // LD1: Handle filter changes to update service list
  const handleFilterChange = useCallback((newFilters: any) => {
    fetchServices();
  }, [fetchServices]);

  // LD1: Handle pagination changes to update service list
  const handlePageChange = useCallback((newPage: number) => {
    fetchServices();
  }, [fetchServices]);

  // LD1: Handle sort changes to update service list
  const handleSortChange = useCallback(() => {
    fetchServices();
  }, [fetchServices]);

  // LD1: Render ServiceFilter component for filtering services
  // LD1: Render DataTable component with service data and column configuration
  // LD1: Render EmptyState component when no services are found
  // LD1: Apply responsive design based on screen size
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <ServiceFilter
        filters={filterState}
        onFilterChange={handleFilterChange}
        onClearFilters={() => fetchServices()}
        clientId={clientId}
        programId={programId}
      />
      {loading === LoadingState.LOADING ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : services.length > 0 ? (
        <DataTable
          columns={columns}
          data={services}
          loading={loading === LoadingState.LOADING}
          pagination={{ page: paginationState.page, pageSize: paginationState.pageSize }}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onRowClick={selectable ? handleRowClick : undefined}
          selectable={selectable}
        />
      ) : (
        <EmptyState title="No Services Found" description="No services match the current criteria." />
      )}
    </Box>
  );
};

/**
 * Helper function to generate table columns configuration for services
 * @param isMobile Whether the viewport is mobile
 * @param isTablet Whether the viewport is tablet
 * @returns Array of column configurations for the DataTable
 */
const getServiceColumns = (isMobile: boolean, isTablet: boolean): TableColumn[] => {
  // Define base columns for all device sizes
  const baseColumns: TableColumn[] = [
    {
      field: 'clientName',
      headerName: 'Client',
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      field: 'serviceType',
      headerName: 'Service Type',
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      field: 'serviceDate',
      headerName: 'Date',
      width: 100,
      sortable: true,
      filterable: true,
      valueFormatter: (value) => formatDate(new Date(value), 'MM/dd/yyyy'),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      sortable: true,
      filterable: true,
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: 'documentationStatus',
      headerName: 'Documentation',
      width: 140,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <StatusBadge status={params.value} type="documentation" />
      ),
    },
    {
      field: 'billingStatus',
      headerName: 'Billing Status',
      width: 130,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <StatusBadge status={params.value} type="billing" />
      ),
    },
    {
      field: 'programName',
      headerName: 'Program',
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => renderActionButtons(params.row, null), // TODO: Implement onServiceSelect
    },
  ];

  // For mobile, return only essential columns (client name, service type, amount, status)
  if (isMobile) {
    return baseColumns.filter(column => ['clientName', 'serviceType', 'amount', 'documentationStatus'].includes(column.field));
  }

  // For tablet, return medium set of columns
  if (isTablet) {
    return baseColumns.filter(column => !['programName'].includes(column.field));
  }

  // For desktop, return all columns
  return baseColumns;
};

/**
 * Helper function to render action buttons for each service row
 * @param service - ServiceSummary
 * @param onServiceSelect - Function to handle service selection
 * @returns React element containing action buttons
 */
const renderActionButtons = (service: ServiceSummary, onServiceSelect: ((service: ServiceSummary) => void) | null): JSX.Element => {
  return (
    <>
      <Tooltip title="View Service">
        <IconButton aria-label="view" size="small">
          <Visibility />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit Service">
        <IconButton aria-label="edit" size="small">
          <Edit />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Service">
        <IconButton aria-label="delete" size="small">
          <Delete />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default ServiceList;