import React, { useState, useEffect, useCallback, useMemo } from 'react'; // react v18.2.0
import { Grid, Button, Typography, Box, Chip, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Badge } from '@mui/material'; // v5.13.0
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, MoreVert as MoreVertIcon, LockReset as LockResetIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon, Security as SecurityIcon } from '@mui/icons-material'; // v5.13.0
import { format as formatDate } from 'date-fns'; // v2.30.0

import DataTable from '../ui/DataTable';
import Card from '../ui/Card';
import UserForm from './UserForm';
import ConfirmDialog from '../ui/ConfirmDialog';
import FilterPanel from '../ui/FilterPanel';
import AlertNotification from '../ui/AlertNotification';
import { UserProfile, UserStatus, UserRole, UserFilterParams, Role } from '../../types/users.types';
import { MfaMethod, AuthProvider } from '../../types/auth.types';
import { TableColumn } from '../../types/ui.types';
import { PaginationParams, Severity, FilterType } from '../../types/common.types';
import { getUsers, getUserById, createUser, updateUser, deleteUser, activateUser, deactivateUser, resetUserPassword, getRoles } from '../../api/users.api';
import useToast from '../../hooks/useToast';

/**
 * Main component for managing users in the HCBS Revenue Management System
 * @returns Rendered user management interface
 */
const UserManagement: React.FC = () => {
  // Initialize state for users, roles, loading, pagination, filters, selected user, form dialog, confirm dialog, and alerts
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, pageSize: 10 });
  const [filters, setFilters] = useState<UserFilterParams>({ status: null, roleId: null, search: '', mfaEnabled: null, createdAfter: null, createdBefore: null, lastLoginAfter: null, lastLoginBefore: null });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ message: string; severity: Severity } | null>(null);
  const toast = useToast();

  // Define table columns with user information and action buttons
  const columns: TableColumn[] = useMemo(() => [
    { field: 'firstName', headerName: 'First Name', width: 150, sortable: true },
    { field: 'lastName', headerName: 'Last Name', width: 150, sortable: true },
    { field: 'email', headerName: 'Email', width: 250, sortable: true },
    { field: 'roleName', headerName: 'Role', width: 150, sortable: true },
    { field: 'status', headerName: 'Status', width: 120, sortable: true, renderCell: (params) => formatUserStatus(params.value) },
    { field: 'mfaEnabled', headerName: 'MFA', width: 100, sortable: true, renderCell: (params) => formatMfaStatus(params.value, null) },
    { field: 'lastLogin', headerName: 'Last Login', width: 150, sortable: true, renderCell: (params) => formatLastLogin(params.value) },
    { field: 'actions', headerName: 'Actions', width: 120, sortable: false, renderCell: (params) => <UserActionsMenu user={params.row} onDelete={handleDeleteUser} onEdit={handleEditUser} onResetPassword={handleResetPassword} onActivate={handleActivateDeactivateUser} /> },
  ], [handleDeleteUser, handleEditUser, handleResetPassword, handleActivateDeactivateUser]);

  // Create function to load users with pagination and filters
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUsers({ pagination, sort: null, filter: filters });
      setUsers(response.items);
      setPagination({ ...pagination, totalItems: response.totalItems });
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users', { title: 'Error' });
    } finally {
      setLoading(false);
    }
  }, [pagination, filters, toast]);

  // Create function to load available roles
  const loadRoles = useCallback(async () => {
    try {
      const response = await getRoles();
      setRoles(response.items);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load roles', { title: 'Error' });
    }
  }, [toast]);

  // Create function to handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setPagination({ ...pagination, page });
  }, [pagination]);

  // Create function to handle filter changes
  const handleFilterChange = useCallback((newFilters: UserFilterParams) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  }, [pagination]);

  // Create function to handle row selection
  const handleEditUser = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  }, []);

  // Create function to open user form for creating new user
  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  }, []);

  // Create function to handle user form submission success
  const handleFormSuccess = useCallback((newUser: UserProfile) => {
    setFormDialogOpen(false);
    setSelectedUser(null);
    loadUsers();
    toast.success(`User ${newUser.firstName} ${newUser.lastName} saved successfully`, { title: 'Success' });
  }, [loadUsers, toast]);

  // Create function to close user form dialog
  const closeFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setSelectedUser(null);
  }, []);

  // Create function to open confirm dialog for user deletion
  const handleDeleteUser = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setConfirmDialogOpen(true);
  }, []);

  // Create function to handle user deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      setConfirmDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      toast.success(`User ${selectedUser.firstName} ${selectedUser.lastName} deleted successfully`, { title: 'Success' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user', { title: 'Error' });
    }
  }, [selectedUser, loadUsers, toast]);

  // Create function to handle user activation/deactivation
  const handleActivateDeactivateUser = useCallback(async (user: UserProfile) => {
    try {
      const updatedUser = user.status === UserStatus.ACTIVE ? await deactivateUser(user.id) : await activateUser(user.id);
      setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? updatedUser : u));
      toast.success(`User ${user.firstName} ${user.lastName} ${user.status === UserStatus.ACTIVE ? 'deactivated' : 'activated'} successfully`, { title: 'Success' });
    } catch (error: any) {
      toast.error(error.message || `Failed to ${user.status === UserStatus.ACTIVE ? 'deactivate' : 'activate'} user`, { title: 'Error' });
    }
  }, [toast]);

  // Create function to handle password reset
  const handleResetPassword = useCallback(async (user: UserProfile) => {
    try {
      await resetUserPassword(user.id);
      toast.success(`Password reset email sent to ${user.email}`, { title: 'Success' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password', { title: 'Error' });
    }
  }, [toast]);

  // Use useEffect to load users and roles when component mounts
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  // Define filter configurations
  const filterConfigs = useMemo(() => [
    { id: 'search', label: 'Search', type: FilterType.TEXT, field: 'search' },
    { id: 'status', label: 'Status', type: FilterType.SELECT, field: 'status', options: Object.values(UserStatus).map(status => ({ value: status, label: status, disabled: false })) },
    { id: 'roleId', label: 'Role', type: FilterType.SELECT, field: 'roleId', options: roles.map(role => ({ value: role.id, label: role.name, disabled: false })) },
  ], [roles]);

  // Render the Card component containing the user management interface
  return (
    <Card title="User Management" subtitle="Manage user accounts and roles within the system">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser}>
          Add User
        </Button>
      </Box>

      {/* Render FilterPanel for filtering users */}
      <FilterPanel filters={filterConfigs} onFilterChange={handleFilterChange} />

      {/* Render DataTable with user data */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
      />

      {/* Render UserForm dialog for creating/editing users */}
      <UserForm
        user={selectedUser}
        onSuccess={handleFormSuccess}
        onCancel={closeFormDialog}
        isEditMode={!!selectedUser}
      />

      {/* Render ConfirmDialog for confirming deletion or password reset */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete user ${selectedUser?.firstName} ${selectedUser?.lastName}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialogOpen(false)}
        severity={Severity.WARNING}
      />
    </Card>
  );
};

/**
 * Formats the user status for display in the UI
 * @param status The status value
 * @returns Chip component with status indicator
 */
const formatUserStatus = (status: UserStatus): JSX.Element => {
  let color = 'primary';
  switch (status) {
    case UserStatus.ACTIVE:
      color = 'success';
      break;
    case UserStatus.INACTIVE:
    case UserStatus.LOCKED:
      color = 'error';
      break;
    case UserStatus.PENDING:
    case UserStatus.PASSWORD_RESET:
      color = 'warning';
      break;
    default:
      color = 'primary';
  }

  return <Chip label={status} color={color} size="small" />;
};

/**
 * Formats the MFA status for display in the UI
 * @param mfaEnabled Whether MFA is enabled
 * @param mfaMethod The MFA method used
 * @returns Chip or text indicating MFA status
 */
const formatMfaStatus = (mfaEnabled: boolean, mfaMethod: MfaMethod | null): JSX.Element => {
  if (mfaEnabled) {
    return <Chip label={mfaMethod ? mfaMethod : 'Enabled'} color="success" size="small" />;
  } else {
    return <span>Not Enabled</span>;
  }
};

/**
 * Formats the last login date for display in the UI
 * @param lastLogin The last login date
 * @returns Formatted date string or 'Never'
 */
const formatLastLogin = (lastLogin: string | null): string => {
  return lastLogin ? formatDate(lastLogin, 'MM/dd/yyyy') : 'Never';
};

interface UserActionsMenuProps {
  user: UserProfile;
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onActivate: (user: UserProfile) => void;
}

/**
 * Component for displaying user action menu
 * @param props The component props
 * @returns Menu with user actions
 */
const UserActionsMenu: React.FC<UserActionsMenuProps> = ({ user, onEdit, onDelete, onResetPassword, onActivate }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    handleClose();
    switch (action) {
      case 'edit':
        onEdit(user);
        break;
      case 'delete':
        onDelete(user);
        break;
      case 'resetPassword':
        onResetPassword(user);
        break;
      case 'activate':
      case 'deactivate':
        onActivate(user);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: '20ch',
          },
        }}
      >
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        {user.status === UserStatus.ACTIVE ? (
          <MenuItem onClick={() => handleAction('deactivate')}>
            <ListItemIcon>
              <BlockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Deactivate</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleAction('activate')}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Activate</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleAction('resetPassword')} disabled={user.authProvider !== AuthProvider.LOCAL}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default UserManagement;