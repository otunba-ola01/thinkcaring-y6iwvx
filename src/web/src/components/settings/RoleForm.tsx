import React, { useState, useEffect, useMemo } from 'react'; // v18.2.0
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  FormLabel, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  Typography, 
  Grid, 
  Box, 
  Divider, 
  CircularProgress, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Chip 
} from '@mui/material'; // v5.13.0
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'; // v5.13.0
import z from 'zod'; // v3.21.0

import Card from '../ui/Card';
import useForm from '../../hooks/useForm';
import useToast from '../../hooks/useToast';
import { 
  Role, 
  Permission, 
  PermissionCategory, 
  CreateRoleDto, 
  UpdateRoleDto 
} from '../../types/users.types';
import { createRole, updateRole } from '../../api/users.api';

/**
 * Props for the RoleForm component
 */
interface RoleFormProps {
  /** Controls whether the dialog is open */
  open: boolean;
  /** Callback function when the dialog is closed */
  onClose: () => void;
  /** Role data to edit (if undefined, creates a new role) */
  role?: Role;
  /** List of available permissions to assign to the role */
  permissions: Permission[];
  /** Callback function when a role is successfully created or updated */
  onSuccess?: (role: Role) => void;
}

/**
 * Groups permissions by their category for organized display
 * 
 * @param permissions - Array of permission objects
 * @returns Permissions grouped by category
 */
const groupPermissionsByCategory = (permissions: Permission[]): Record<PermissionCategory, Permission[]> => {
  // Initialize the grouped permissions object with empty arrays for each category
  const groupedPermissions: Record<PermissionCategory, Permission[]> = {
    [PermissionCategory.USERS]: [],
    [PermissionCategory.CLIENTS]: [],
    [PermissionCategory.SERVICES]: [],
    [PermissionCategory.CLAIMS]: [],
    [PermissionCategory.BILLING]: [],
    [PermissionCategory.PAYMENTS]: [],
    [PermissionCategory.REPORTS]: [],
    [PermissionCategory.SETTINGS]: [],
    [PermissionCategory.SYSTEM]: []
  };

  // Group each permission by its category
  permissions.forEach(permission => {
    groupedPermissions[permission.category].push(permission);
  });

  return groupedPermissions;
};

/**
 * Extracts selected permission IDs from form values
 * 
 * @param permissionValues - Record of permission selection state by ID
 * @returns Array of selected permission IDs
 */
const getSelectedPermissionIds = (permissionValues: Record<string, boolean>): string[] => {
  return Object.entries(permissionValues)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id);
};

/**
 * A form component for creating and editing roles in the HCBS Revenue Management System.
 * It provides a user interface for setting role name, description, and assigning permissions to roles,
 * supporting the role-based access control system.
 */
const RoleForm: React.FC<RoleFormProps> = ({ 
  open, 
  onClose, 
  role, 
  permissions, 
  onSuccess 
}) => {
  // Determine if we're editing an existing role or creating a new one
  const isEditMode = !!role;
  
  // Create validation schema for the form
  const validationSchema = z.object({
    name: z.string()
      .min(1, 'Role name is required')
      .max(50, 'Role name must be less than 50 characters'),
    description: z.string()
      .max(200, 'Description must be less than 200 characters')
      .optional(),
    permissions: z.record(z.string(), z.boolean()).refine(
      (permissions) => Object.values(permissions).some(selected => selected), 
      { message: 'At least one permission must be selected' }
    )
  });

  // Setup form with validation schema
  const { 
    register, 
    handleSubmit, 
    formState, 
    reset, 
    setValue, 
    watch,
    getValues
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      permissions: {} as Record<string, boolean>
    },
    validationSchema
  });

  // Watch the permissions field to track changes
  const permissionValues = watch('permissions');
  
  // Initialize toast notifications
  const toast = useToast();
  
  // Initialize form with role data when in edit mode
  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      if (isEditMode && role) {
        // For edit mode, set values from existing role
        const permissionMap: Record<string, boolean> = {};
        
        // Initialize all permissions as unselected
        permissions.forEach(permission => {
          permissionMap[permission.id] = false;
        });
        
        // Mark selected permissions in the role
        role.permissions.forEach(permission => {
          permissionMap[permission.id] = true;
        });
        
        reset({
          name: role.name,
          description: role.description,
          permissions: permissionMap
        });
      } else {
        // For create mode, start with a fresh form
        const permissionMap: Record<string, boolean> = {};
        permissions.forEach(permission => {
          permissionMap[permission.id] = false;
        });
        
        reset({
          name: '',
          description: '',
          permissions: permissionMap
        });
      }
    }
  }, [open, role, permissions, reset, isEditMode]);

  // Group permissions by category for organized display
  const groupedPermissions = useMemo(() => 
    groupPermissionsByCategory(permissions), [permissions]);

  // Handle toggling all permissions in a category
  const handleToggleCategory = (category: PermissionCategory) => {
    const categoryPermissions = groupedPermissions[category];
    
    // Check if all permissions in the category are currently selected
    const allSelected = categoryPermissions.every(p => permissionValues[p.id]);
    
    // Toggle all permissions in the category
    categoryPermissions.forEach(permission => {
      setValue(`permissions.${permission.id}`, !allSelected);
    });
  };

  // Handle form submission for create/update
  const handleSaveRole = handleSubmit(async (formData) => {
    try {
      const selectedPermissionIds = getSelectedPermissionIds(formData.permissions);
      
      let result: Role;

      if (isEditMode && role) {
        // Update existing role
        const updateData: UpdateRoleDto = {
          name: formData.name,
          description: formData.description || '',
          permissionIds: selectedPermissionIds
        };
        
        result = await updateRole(role.id, updateData);
        toast.success(`Role '${result.name}' was updated successfully`);
      } else {
        // Create new role
        const createData: CreateRoleDto = {
          name: formData.name,
          description: formData.description || '',
          permissionIds: selectedPermissionIds
        };
        
        result = await createRole(createData);
        toast.success(`Role '${result.name}' was created successfully`);
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save role');
    }
  });

  // Check if any permission in a category is selected
  const isCategoryPartiallySelected = (category: PermissionCategory): boolean => {
    const categoryPermissions = groupedPermissions[category];
    const selectedCount = categoryPermissions.filter(p => permissionValues[p.id]).length;
    return selectedCount > 0 && selectedCount < categoryPermissions.length;
  };

  // Check if all permissions in a category are selected
  const isCategoryFullySelected = (category: PermissionCategory): boolean => {
    const categoryPermissions = groupedPermissions[category];
    return categoryPermissions.length > 0 && categoryPermissions.every(p => permissionValues[p.id]);
  };

  // Get the count of selected permissions in a category
  const getCategorySelectedCount = (category: PermissionCategory): number => {
    return groupedPermissions[category].filter(p => permissionValues[p.id]).length;
  };

  // Dialog title based on mode (create or edit)
  const dialogTitle = isEditMode ? 'Edit Role' : 'Create New Role';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="role-form-dialog-title"
    >
      <DialogTitle id="role-form-dialog-title">{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Role information section */}
          <Grid item xs={12}>
            <Card title="Role Information">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Role Name"
                    fullWidth
                    required
                    {...register('name')}
                    error={!!formState.errors.name}
                    helperText={formState.errors.name?.message}
                    disabled={formState.isSubmitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    {...register('description')}
                    error={!!formState.errors.description}
                    helperText={formState.errors.description?.message}
                    disabled={formState.isSubmitting}
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Permissions section */}
          <Grid item xs={12}>
            <Card title="Permissions">
              {formState.errors.permissions && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  {formState.errors.permissions.message}
                </Typography>
              )}

              {/* Permissions accordions grouped by category */}
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                // Skip categories with no permissions
                if (categoryPermissions.length === 0) return null;
                
                const isPartiallySelected = isCategoryPartiallySelected(category as PermissionCategory);
                const isFullySelected = isCategoryFullySelected(category as PermissionCategory);
                const selectedCount = getCategorySelectedCount(category as PermissionCategory);
                
                return (
                  <Accordion key={category} defaultExpanded={isEditMode && isPartiallySelected}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" width="100%">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isFullySelected}
                              indeterminate={isPartiallySelected}
                              onChange={() => handleToggleCategory(category as PermissionCategory)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={formState.isSubmitting}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              <Typography variant="subtitle1">
                                {category}
                              </Typography>
                              {selectedCount > 0 && (
                                <Chip 
                                  size="small" 
                                  label={`${selectedCount}/${categoryPermissions.length}`} 
                                  color={isFullySelected ? "primary" : "default"}
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                          onClick={(e) => e.stopPropagation()}
                          sx={{ width: '100%', m: 0 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl component="fieldset" sx={{ width: '100%' }}>
                        <FormGroup>
                          <Grid container spacing={1}>
                            {categoryPermissions.map((permission) => (
                              <Grid item xs={12} sm={6} md={4} key={permission.id}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      {...register(`permissions.${permission.id}`)}
                                      disabled={formState.isSubmitting}
                                    />
                                  }
                                  label={
                                    <Typography variant="body2">{permission.name}</Typography>
                                  }
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </FormGroup>
                      </FormControl>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={formState.isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveRole} 
          color="primary" 
          disabled={formState.isSubmitting}
          startIcon={formState.isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isEditMode ? 'Update Role' : 'Create Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleForm;