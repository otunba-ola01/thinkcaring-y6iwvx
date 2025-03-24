import React, { useState, useEffect, useMemo, useCallback } from 'react'; // v18.2.0
import { Box, Typography, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Paper } from '@mui/material'; // v5.13.0
import { Add, Edit, Delete, FilterList } from '@mui/icons-material'; // v5.13.0

import DataTable from '../../components/ui/DataTable';
import FilterPanel from '../../components/ui/FilterPanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ServiceCodeForm from './ServiceCodeForm';
import StatusBadge from '../../components/ui/StatusBadge';
import useToast from '../../hooks/useToast';
import useApiRequest from '../../hooks/useApiRequest';
import { ServiceCode } from '../../types/settings.types';
import { ServiceType } from '../../types/services.types';
import { FilterType } from '../../types/ui.types';
import { TableColumn } from '../../types/ui.types';
import { getServiceCodes, createServiceCode, updateServiceCode, deleteServiceCode } from '../../api/settings.api';

interface ServiceCodeListProps {
  programs?: any[]; // TODO: Define the type for programs
  loading?: boolean;
}

/**
 * Component for displaying and managing service codes
 * @param {object} props - ServiceCodeListProps
 * @returns {JSX.Element} The rendered component
 */
const ServiceCodeList: React.FC<ServiceCodeListProps> = ({ programs, loading: programsLoading }) => {
  // Extract programs and loading props
  // Initialize state for service codes data
  const [serviceCodes, setServiceCodes] = useState<ServiceCode[]>([]);

  // Initialize state for pagination (page, pageSize, totalItems)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Initialize state for sorting (field, direction)
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');

  // Initialize state for filters (search, serviceType, active)
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [active, setActive] = useState('');

  // Initialize state for dialog management (open, type, selectedServiceCode)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add');
  const [selectedServiceCode, setSelectedServiceCode] = useState<ServiceCode | null>(null);

  // Initialize state for delete confirmation dialog
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Initialize toast notification hook
  const toast = useToast();

  // Initialize API request hook for loading states
  const { loading, execute: fetchServiceCodes } = useApiRequest<any>(
    {
      url: '/api/service-codes',
      method: 'GET',
    }
  );

  // Define columns configuration for the data table
  const columns: TableColumn[] = useMemo(() => [
    { field: 'code', headerName: 'Code', width: 150, sortable: true },
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    { field: 'description', headerName: 'Description', flex: 1 },
    { field: 'type', headerName: 'Type', width: 150, sortable: true },
    { field: 'rate', headerName: 'Rate', width: 120, sortable: true },
    { field: 'active', headerName: 'Active', width: 100, sortable: true },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        renderActionButtons(params.row, () => handleEditClick(params.row), () => handleDeleteClick(params.row))
      ),
    },
  ], [handleEditClick, handleDeleteClick]);

  // Define filter configuration for the filter panel
  const filters = useMemo(() => [
    { id: 'search', label: 'Search', type: FilterType.TEXT, field: 'search' },
    {
      id: 'serviceType',
      label: 'Service Type',
      type: FilterType.SELECT,
      field: 'type',
      options: Object.values(ServiceType).map((type) => ({
        value: type,
        label: getServiceTypeLabel(type),
      })),
    },
    {
      id: 'active',
      label: 'Active',
      type: FilterType.SELECT,
      field: 'active',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
  ], []);

  // Implement fetchServiceCodes function to load data with pagination, sorting, and filtering
  const loadServiceCodes = useCallback(async () => {
    try {
      const response = await getServiceCodes({
        pagination: { page, pageSize },
        sort: { field: sortField, direction: sortDirection },
        filters: [
          ...(search ? [{ field: 'search', operator: 'contains', value: search }] : []),
          ...(serviceType ? [{ field: 'type', operator: 'equals', value: serviceType }] : []),
          ...(active ? [{ field: 'active', operator: 'equals', value: active === 'true' }] : []),
        ],
      });

      setServiceCodes(response.data.items);
      setTotalItems(response.data.totalItems);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load service codes');
    }
  }, [page, pageSize, sortField, sortDirection, search, serviceType, active, toast]);

  // Implement handlePageChange function to update pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Implement handleSortChange function to update sorting
  const handleSortChange = (field: string) => {
    setSortField(field);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Implement handleFilterChange function to update filters
  const handleFilterChange = (filterValues: any) => {
    setSearch(filterValues.search || '');
    setServiceType(filterValues.serviceType || '');
    setActive(filterValues.active || '');
    setPage(1); // Reset page to 1 when filters change
  };

  // Implement handleAddClick function to open add dialog
  const handleAddClick = () => {
    setDialogType('add');
    setSelectedServiceCode(null);
    setDialogOpen(true);
  };

  // Implement handleEditClick function to open edit dialog
  const handleEditClick = (serviceCode: ServiceCode) => {
    setDialogType('edit');
    setSelectedServiceCode(serviceCode);
    setDialogOpen(true);
  };

  // Implement handleDeleteClick function to open delete confirmation
  const handleDeleteClick = (serviceCode: ServiceCode) => {
    setSelectedServiceCode(serviceCode);
    setDeleteConfirmationOpen(true);
  };

  // Implement handleDialogClose function to close dialogs
  const handleDialogClose = () => {
    setDialogOpen(false);
    setDeleteConfirmationOpen(false);
    setSelectedServiceCode(null);
  };

  // Implement handleServiceCodeSubmit function to create or update service codes
  const handleServiceCodeSubmit = async (data: ServiceCode) => {
    try {
      if (dialogType === 'add') {
        await createServiceCode(data);
        toast.success('Service code created successfully');
      } else {
        await updateServiceCode(selectedServiceCode!.id, data);
        toast.success('Service code updated successfully');
      }
      loadServiceCodes(); // Refresh service codes after submission
      handleDialogClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service code');
    }
  };

  // Implement handleDeleteConfirm function to delete service codes
  const handleDeleteConfirm = async () => {
    try {
      await deleteServiceCode(selectedServiceCode!.id);
      toast.success('Service code deleted successfully');
      loadServiceCodes(); // Refresh service codes after deletion
      handleDialogClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service code');
    }
  };

  // Implement useEffect to fetch service codes on component mount and when dependencies change
  useEffect(() => {
    loadServiceCodes();
  }, [loadServiceCodes]);

  // Render filter panel for searching and filtering service codes
  // Render add button for creating new service codes
  // Render data table with service codes data
  // Render service code form dialog for adding/editing
  // Render confirmation dialog for deleting
  return (
    <Box>
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddClick}>
          Add Service Code
        </Button>
      </Box>
      <DataTable
        columns={columns}
        data={serviceCodes}
        loading={loading}
        pagination={{ page, pageSize }}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onSortChange={(sortModel) => {
          if (sortModel && sortModel.length > 0) {
            setSortField(sortModel[0].field);
            setSortDirection(sortModel[0].direction);
          }
        }}
      />
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>{dialogType === 'add' ? 'Add Service Code' : 'Edit Service Code'}</DialogTitle>
        <DialogContent>
          <ServiceCodeForm
            serviceCode={selectedServiceCode || undefined}
            onSubmit={handleServiceCodeSubmit}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteConfirmationOpen}
        title="Delete Service Code"
        message="Are you sure you want to delete this service code? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDialogClose}
      />
    </Box>
  );
};

// Helper function to convert ServiceType enum values to human-readable labels
const getServiceTypeLabel = (serviceType: ServiceType): string => {
  switch (serviceType) {
    case ServiceType.PERSONAL_CARE:
      return 'Personal Care';
    case ServiceType.RESIDENTIAL:
      return 'Residential';
    case ServiceType.DAY_SERVICES:
      return 'Day Services';
    case ServiceType.RESPITE:
      return 'Respite';
    default:
      return 'Other';
  }
};

// Renders action buttons for each service code row
const renderActionButtons = (serviceCode: ServiceCode, onEdit: () => void, onDelete: () => void): JSX.Element => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Edit">
        <IconButton onClick={onEdit} aria-label="edit">
          <Edit />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton onClick={onDelete} aria-label="delete">
          <Delete />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ServiceCodeList;