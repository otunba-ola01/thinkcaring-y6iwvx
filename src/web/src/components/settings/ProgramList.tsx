import React, { useState, useEffect, useCallback } from 'react'; // react v18.2+ React hooks for state management and side effects
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material'; // @mui/material v5.13.0 Material UI components for layout and UI elements
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'; // @mui/icons-material v5.13.0 Material UI icons for action buttons
import { useNavigate } from 'react-router-dom'; // react-router-dom v6.11.2 React Router hook for navigation

import DataTable from '../ui/DataTable'; // Reusable data table component for displaying program list
import FilterPanel from '../ui/FilterPanel'; // Component for filtering program list
import ActionButton from '../ui/ActionButton'; // Button component for program actions (add, edit, delete)
import Card from '../ui/Card'; // Container component for the program list
import StatusBadge from '../ui/StatusBadge'; // Component for displaying program status
import useSettings from '../../hooks/useSettings'; // Hook for accessing and managing program settings
import useToast from '../../hooks/useToast'; // Hook for displaying toast notifications
import { FilterConfig, FilterType } from '../../types/ui.types'; // Types for filter configuration
import { TableColumn } from '../../types/ui.types'; // Type for table column configuration
import { Status } from '../../types/common.types'; // Enum for program status values
import { PaginationParams } from '../../types/common.types'; // Interface for pagination parameters

/**
 * Main component for displaying and managing the list of programs
 * @returns {JSX.Element} The rendered ProgramList component
 */
const ProgramList: React.FC = () => {
  // 1. Initialize navigate function from useNavigate
  const navigate = useNavigate();

  // 2. Initialize state for programs, loading, pagination, and selected program
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, pageSize: 10 });
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  // 3. Use useSettings hook to access program-related settings and operations
  const { settings, fetchSettings, deleteSetting } = useSettings();

  // 4. Use useToast hook for displaying notifications
  const { success, error } = useToast();

  // 5. Define filter configurations for program filtering
  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      label: 'Search',
      type: FilterType.TEXT,
      field: 'name',
      operator: 'contains',
      placeholder: 'Search by program name'
    },
    {
      id: 'status',
      label: 'Status',
      type: FilterType.SELECT,
      field: 'status',
      options: [
        { value: Status.ACTIVE, label: 'Active' },
        { value: Status.INACTIVE, label: 'Inactive' }
      ]
    }
  ];

  // 6. Define table columns for the program list
  const columns: TableColumn[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'status', headerName: 'Status', width: 120, type: 'status', statusType: 'billing' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => renderActionButtons(params.row)
    }
  ];

  // 7. Implement useEffect to fetch programs on component mount
  useEffect(() => {
    fetchPrograms();
  }, [fetchSettings, pagination]);

  // 8. Implement handlePageChange function to handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  // 9. Implement handleFilterChange function to handle filtering
  const handleFilterChange = (newFilters: any) => {
    console.log('newFilters', newFilters);
  };

  // 10. Implement handleSortChange function to handle sorting
  const handleSortChange = (sortModel: any) => {
    console.log('sortModel', sortModel);
  };

  // 11. Implement handleAddProgram function to navigate to program creation page
  const handleAddProgram = () => {
    navigate('/settings/programs/new');
  };

  // 12. Implement handleEditProgram function to navigate to program edit page
  const handleEditProgram = (program: any) => {
    navigate(`/settings/programs/${program.id}/edit`);
  };

  // 13. Implement handleDeleteProgram function to delete a program
  const handleDeleteProgram = async (programId: string) => {
    try {
      setLoading(true);
      await deleteSetting(programId);
      success('Program deleted successfully');
      fetchPrograms();
    } catch (e: any) {
      error(`Failed to delete program: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 14. Implement fetchPrograms function to fetch programs data
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      // const response = await fetchSettings({ pagination, filters: {} });
      // setPrograms(response.items);
      setPrograms([
        { id: '1', name: 'Program 1', code: 'P1', status: 'active' },
        { id: '2', name: 'Program 2', code: 'P2', status: 'inactive' },
      ]);
    } catch (e: any) {
      error(`Failed to fetch programs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renders action buttons for a program row
   * @param {object} program
   * @returns {JSX.Element} The rendered action buttons
   */
  const renderActionButtons = (program: any): JSX.Element => {
    return (
      <Box>
        <Tooltip title="Edit">
          <IconButton onClick={() => handleEditProgram(program)} aria-label="edit">
            <EditIcon />
          </IconButton>
        </Tooltip>
        <ActionButton
          label="Delete"
          icon={<DeleteIcon />}
          onClick={() => handleDeleteProgram(program.id)}
          confirmText="Are you sure you want to delete this program?"
        />
      </Box>
    );
  };

  // 15. Render the component
  return (
    <Card>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Programs</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddProgram}>
          Add Program
        </Button>
      </Box>
      <FilterPanel filters={filterConfigs} onFilterChange={handleFilterChange} />
      <DataTable
        columns={columns}
        data={programs}
        loading={loading}
        pagination={pagination}
        totalItems={programs.length}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
      />
    </Card>
  );
};

// 16. Export the ProgramList component as the default export
export default ProgramList;