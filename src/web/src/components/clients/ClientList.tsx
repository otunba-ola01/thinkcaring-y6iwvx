import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react v18.2+
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Typography, Card, CardContent, Button, Tooltip } from '@mui/material'; // @mui/material v5.13.0
import { Add, Visibility, Edit, Delete } from '@mui/icons-material'; // @mui/icons-material v5.13.0
import { format } from 'date-fns'; // date-fns v2.30.0

import DataTable from '../ui/DataTable';
import ActionButton from '../ui/ActionButton';
import ClientFilter, { ClientFilterProps } from './ClientFilter';
import { TableColumn } from '../../types/ui.types';
import { ClientSummary, ClientStatus } from '../../types/clients.types';
import useClients from '../../hooks/useClients';
import useResponsive from '../../hooks/useResponsive';
import { ROUTES } from '../../constants/routes.constants';
import { PAGINATION_OPTIONS } from '../../constants/ui.constants';

/**
 * Interface for ClientList component props
 */
interface ClientListProps {
  initialFilters?: Partial<ClientQueryParams>;
  onClientSelect?: (client: ClientSummary) => void;
}

/**
 * Component that displays a list of clients with filtering, sorting, and pagination
 * @param {ClientListProps} props - The props for the ClientList component
 * @returns {JSX.Element} The rendered ClientList component
 */
const ClientList: React.FC<ClientListProps> = ({ initialFilters, onClientSelect }) => {
  // Destructure props to get initialFilters and onClientSelect
  
  // Initialize router using useRouter hook
  const router = useRouter();
  
  // Initialize responsive hook using useResponsive
  const { isMobile, isTablet } = useResponsive();
  
  // Initialize clients hook with initialFilters
  const { 
    clients, 
    loading, 
    filters,
    handlePageChange,
    handlePageSizeChange,
    handleSortChange,
    handleSearchChange,
    handleStatusChange,
    handleProgramChange,
    clearFilters,
    pagination
  } = useClients({ initialFilters });

  /**
   * Creates table column definitions for the client list
   * @param {boolean} isMobile - Whether the device is mobile
   * @param {boolean} isTablet - Whether the device is tablet
   * @param {function} handleEditClick - Function to handle edit button click
   * @param {function} handleDeleteClick - Function to handle delete button click
   * @returns {TableColumn[]} Array of table column definitions
   */
  const getClientColumns = useCallback((
    isMobile: boolean,
    isTablet: boolean,
    handleEditClick: (client: ClientSummary) => void,
    handleDeleteClick: (client: ClientSummary) => void
  ): TableColumn[] => {
    // Define base columns for all device sizes
    const baseColumns: TableColumn[] = [
      { 
        field: 'firstName', 
        headerName: 'Client',
        renderCell: (params) => renderClientName(params.row),
        sortable: true,
        filterable: true
      },
      { 
        field: 'dateOfBirth', 
        headerName: 'Date of Birth', 
        type: 'date', 
        sortable: true,
        filterable: false,
        valueFormatter: (value) => format(new Date(value), 'MM/dd/yyyy')
      },
      { 
        field: 'medicaidId', 
        headerName: 'Medicaid ID', 
        sortable: true,
        filterable: true
      },
      { 
        field: 'status', 
        headerName: 'Status', 
        type: 'status', 
        sortable: true,
        filterable: true,
        statusType: 'claim'
      },
      { 
        field: 'programs', 
        headerName: 'Programs', 
        sortable: false,
        filterable: false,
        renderCell: (params) => renderClientPrograms(params.row.programs)
      },
      { 
        field: 'actions', 
        headerName: 'Actions', 
        sortable: false,
        filterable: false,
        renderCell: (params) => renderActions(params.row, handleEditClick, handleDeleteClick)
      }
    ];

    // Filter columns based on device size (mobile, tablet, desktop)
    let columns = baseColumns;
    if (isMobile) {
      columns = baseColumns.filter(column => column.field !== 'medicaidId');
    } else if (isTablet) {
      columns = baseColumns.filter(column => column.field !== 'actions');
    }

    // Return the appropriate columns array
    return columns;
  }, []);

  /**
   * Renders a client's full name as a link to their details
   * @param {ClientSummary} client - The client object
   * @returns {JSX.Element} The rendered client name component
   */
  const renderClientName = useCallback((client: ClientSummary): JSX.Element => {
    // Create a Typography component with the client's full name
    return (
      <Typography
        component="a"
        href={`${ROUTES.CLIENTS.ROOT}/${client.id}`}
        sx={{
          textDecoration: 'none',
          color: 'primary.main',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        {client.firstName} {client.lastName}
      </Typography>
    );
  }, []);

  /**
   * Renders a list of client programs
   * @param {string[]} programs - Array of program names
   * @returns {JSX.Element} The rendered programs list
   */
  const renderClientPrograms = useCallback((programs: string[]): JSX.Element => {
    // If no programs, return 'None'
    if (!programs || programs.length === 0) {
      return <Typography>None</Typography>;
    }

    // If programs exist, join them with commas
    const programList = programs.join(', ');

    // Return a Typography component with the programs list
    return <Typography>{programList}</Typography>;
  }, []);

  /**
   * Renders action buttons for a client row
   * @param {ClientSummary} client - The client object
   * @param {function} handleEditClick - Function to handle edit button click
   * @param {function} handleDeleteClick - Function to handle delete button click
   * @returns {JSX.Element} The rendered action buttons
   */
  const renderActions = useCallback((
    client: ClientSummary,
    handleEditClick: (client: ClientSummary) => void,
    handleDeleteClick: (client: ClientSummary) => void
  ): JSX.Element => {
    // Create a Box component with flex layout
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Add View button with Visibility icon */}
        <ActionButton
          label="View"
          icon={<Visibility />}
          onClick={() => router.push(`${ROUTES.CLIENTS.ROOT}/${client.id}`)}
          size="small"
        />
        {/* Add Edit button with Edit icon */}
        <ActionButton
          label="Edit"
          icon={<Edit />}
          onClick={() => handleEditClick(client)}
          size="small"
        />
        {/* Add Delete button with Delete icon and confirmation */}
        <ActionButton
          label="Delete"
          icon={<Delete />}
          onClick={() => handleDeleteClick(client)}
          confirmText="Are you sure you want to delete this client?"
          size="small"
        />
      </Box>
    );
  }, [router]);

  /**
   * Handle row click to navigate to client details
   * @param {ClientSummary} client - The client object
   */
  const handleRowClick = useCallback((client: ClientSummary) => {
    if (onClientSelect) {
      onClientSelect(client);
    } else {
      router.push(`${ROUTES.CLIENTS.ROOT}/${client.id}`);
    }
  }, [onClientSelect, router]);

  /**
   * Handle add client button click to navigate to new client page
   */
  const handleAddClick = () => {
    router.push(ROUTES.CLIENTS.NEW);
  };

  /**
   * Handle edit client button click to navigate to edit client page
   * @param {ClientSummary} client - The client object
   */
  const handleEditClick = (client: ClientSummary) => {
    router.push(`${ROUTES.CLIENTS.ROOT}/${client.id}/edit`);
  };

  /**
   * Handle delete client button click with confirmation
   * @param {ClientSummary} client - The client object
   */
  const handleDeleteClick = (client: ClientSummary) => {
    // Implement delete logic here
    console.log(`Delete client ${client.id}`);
  };

  /**
   * Handle filter changes to update client list
   * @param {Record<string, any>} newFilters - The new filter values
   */
  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Implement filter logic here
    console.log('New filters:', newFilters);
  };

  /**
   * Handle pagination changes
   * @param {number} page - The new page number
   */
  const handlePageChange = (page: number) => {
    // Implement pagination logic here
    console.log('New page:', page);
  };

  /**
   * Handle sort changes
   * @param {string} field - The field to sort by
   * @param {'asc' | 'desc'} direction - The sort direction
   */
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    // Implement sort logic here
    console.log('New sort:', field, direction);
  };

  // Define table columns for client list
  const columns = useMemo(() => getClientColumns(isMobile, isTablet, handleEditClick, handleDeleteClick), [getClientColumns, isMobile, isTablet, handleEditClick, handleDeleteClick]);

  // Render the component with Box container
  return (
    <Box>
      {/* Render header with title and add button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Clients</Typography>
        <ActionButton label="Add Client" icon={<Add />} onClick={handleAddClick} />
      </Box>

      {/* Render ClientFilter component */}
      <ClientFilter
        onFilterChange={handleFilterChange}
        initialValues={filters}
        loading={loading === 'loading'}
      />

      {/* Render DataTable component with client data */}
      <DataTable
        columns={columns}
        data={clients}
        loading={loading === 'loading'}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize
        }}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
      />
    </Box>
  );
};

export default ClientList;
export type { ClientListProps };