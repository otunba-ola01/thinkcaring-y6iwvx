# src/web/src/components/settings/RoleManagement.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { Box, Button, Typography, Paper, Tooltip, IconButton, Card, CardContent, CardHeader, Divider } from '@mui/material'; // v5.13.0
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'; // v5.13.0

import DataTable from '../ui/DataTable';
import RoleForm from './RoleForm';
import ConfirmDialog from '../ui/ConfirmDialog';
import useToast from '../../hooks/useToast';
import { Role, Permission } from '../../types/users.types';
import { getRoles, getPermissions, deleteRole } from '../../api/users.api';

/**
 * Main component for role management functionality
 * @returns Rendered role management component
 */
const RoleManagement: React.FC = () => {
  // Initialize state for roles, permissions, loading state, pagination, selected role, role form dialog, and delete confirmation dialog
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormOpen, setRoleFormOpen] = useState<boolean>(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);

  // Create toast notification handler using useToast hook
  const toast = useToast();

  // Define function to fetch roles from the API
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRoles();
      setRoles(response.items);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Define function to fetch permissions from the API
  const fetchPermissions = useCallback(async () => {
    try {
      const permissionsData = await getPermissions();
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load permissions');
    }
  }, [toast]);

  // Define function to handle role creation success
  const handleRoleCreateSuccess = useCallback((newRole: Role) => {
    setRoles(prevRoles => [...prevRoles, newRole]);
  }, []);

  // Define function to handle role update success
  const handleRoleUpdateSuccess = useCallback((updatedRole: Role) => {
    setRoles(prevRoles =>
      prevRoles.map(role => (role.id === updatedRole.id ? updatedRole : role))
    );
  }, []);

  // Define function to handle role deletion
  const handleRoleDelete = useCallback(async () => {
    if (selectedRole) {
      try {
        await deleteRole(selectedRole.id);
        setRoles(prevRoles => prevRoles.filter(role => role.id !== selectedRole.id));
        toast.success(`Role '${selectedRole.name}' was deleted successfully`);
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete role');
      } finally {
        setDeleteConfirmationOpen(false);
        setSelectedRole(null);
      }
    }
  }, [selectedRole, toast]);

  // Define function to handle role deletion confirmation
  const handleDeleteConfirmation = useCallback((role: Role) => {
    setSelectedRole(role);
    setDeleteConfirmationOpen(true);
  }, []);

  // Define function to handle pagination changes
  const handlePageChange = (page: number) => {
    // Pagination is not implemented in this component, so this function is empty
  };

  // Define function to open role form dialog for creating a new role
  const handleOpenRoleForm = () => {
    setSelectedRole(null);
    setRoleFormOpen(true);
  };

  // Define function to open role form dialog for editing an existing role
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleFormOpen(true);
  };

  // Define function to close role form dialog
  const handleCloseRoleForm = () => {
    setRoleFormOpen(false);
  };

  // Define function to open delete confirmation dialog
  const handleOpenDeleteConfirmation = (role: Role) => {
    setSelectedRole(role);
    setDeleteConfirmationOpen(true);
  };

  // Define function to close delete confirmation dialog
  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
    setSelectedRole(null);
  };

  // Use useEffect to fetch roles and permissions on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  // Define table columns for the roles data table
  const columns = useMemo(() => [
    { field: 'name', headerName: 'Role Name', width: 200, sortable: true },
    { field: 'description', headerName: 'Description', width: 300, sortable: false },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: any) => (
        <>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEditRole(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDeleteConfirmation(params.row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ], [handleEditRole, handleDeleteConfirmation]);

  // Render the component with a card containing header, action buttons, and data table
  return (
    <Card
      title="Role Management"
      actions={
        <>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRoleForm}
            disabled={loading}
          >
            Create Role
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchRoles} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </>
      }
    >
      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        pagination={{ page: 1, pageSize: 10 }}
        totalItems={roles.length}
        onPageChange={handlePageChange}
        onRowClick={(params) => handleEditRole(params)}
      />

      {/* Render RoleForm dialog when form dialog is open */}
      <RoleForm
        open={roleFormOpen}
        onClose={handleCloseRoleForm}
        role={selectedRole || undefined}
        permissions={permissions}
        onSuccess={selectedRole ? handleRoleUpdateSuccess : handleRoleCreateSuccess}
      />

      {/* Render ConfirmDialog when delete confirmation dialog is open */}
      <ConfirmDialog
        open={deleteConfirmationOpen}
        title="Delete Role?"
        message={`Are you sure you want to delete role "${selectedRole?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleRoleDelete}
        onCancel={handleCloseDeleteConfirmation}
      />
    </Card>
  );
};

export default RoleManagement;