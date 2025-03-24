import React, { useState, useEffect } from 'react'; // v18.2.0
import { 
  Grid, 
  TextField, 
  MenuItem, 
  FormControlLabel, 
  Switch, 
  CircularProgress, 
  Alert, 
  Typography, 
  Select, 
  InputLabel, 
  FormControl, 
  FormHelperText 
} from '@mui/material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import useForm from '../../hooks/useForm';
import { 
  UserProfile, 
  CreateUserDto, 
  UpdateUserDto, 
  UserFormData, 
  UserStatus, 
  UserRole 
} from '../../types/users.types';
import { MfaMethod, AuthProvider } from '../../types/auth.types';
import { FormFieldType, FormConfig } from '../../types/form.types';
import { createUser, updateUser, getRoles } from '../../api/users.api';

/**
 * Creates a Zod validation schema for user creation form
 * 
 * @returns Zod schema for validating user creation data
 */
const createUserValidationSchema = () => {
  return z.object({
    email: z.string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    
    firstName: z.string()
      .min(1, 'First name is required')
      .max(100, 'First name cannot exceed 100 characters'),
    
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(100, 'Last name cannot exceed 100 characters'),
    
    password: z.string()
      .min(12, 'Password must be at least 12 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      ),
    
    confirmPassword: z.string(),
    
    roleId: z.string().min(1, 'Role is required'),
    
    mfaEnabled: z.boolean(),
    
    mfaMethod: z.union([
      z.literal(MfaMethod.APP),
      z.literal(MfaMethod.SMS),
      z.literal(MfaMethod.EMAIL),
      z.null()
    ]).nullable(),
    
    contactInfo: z.object({
      email: z.string().email('Please enter a valid email address').nullable().optional(),
      phone: z.string().nullable().optional(),
      alternatePhone: z.string().nullable().optional(),
      fax: z.string().nullable().optional()
    }),
    
    passwordResetRequired: z.boolean(),
    
    sendInvitation: z.boolean()
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }).refine(
    data => !data.mfaEnabled || (data.mfaEnabled && data.mfaMethod !== null),
    {
      message: 'MFA method is required when MFA is enabled',
      path: ['mfaMethod']
    }
  );
};

/**
 * Creates a Zod validation schema for user update form
 * 
 * @returns Zod schema for validating user update data
 */
const updateUserValidationSchema = () => {
  return z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(100, 'First name cannot exceed 100 characters'),
    
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(100, 'Last name cannot exceed 100 characters'),
    
    roleId: z.string().min(1, 'Role is required'),
    
    status: z.enum([
      UserStatus.ACTIVE, 
      UserStatus.INACTIVE, 
      UserStatus.PENDING, 
      UserStatus.LOCKED,
      UserStatus.PASSWORD_RESET
    ], {
      errorMap: () => ({ message: 'Status is required' })
    }),
    
    mfaEnabled: z.boolean(),
    
    mfaMethod: z.union([
      z.literal(MfaMethod.APP),
      z.literal(MfaMethod.SMS),
      z.literal(MfaMethod.EMAIL),
      z.null()
    ]).nullable(),
    
    contactInfo: z.object({
      email: z.string().email('Please enter a valid email address').nullable().optional(),
      phone: z.string().nullable().optional(),
      alternatePhone: z.string().nullable().optional(),
      fax: z.string().nullable().optional()
    })
  }).refine(
    data => !data.mfaEnabled || (data.mfaEnabled && data.mfaMethod !== null),
    {
      message: 'MFA method is required when MFA is enabled',
      path: ['mfaMethod']
    }
  );
};

interface UserFormProps {
  user?: UserProfile;
  onSuccess: (user: UserProfile) => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

/**
 * Component for creating and editing users in the system.
 * Provides fields for user details, role assignment, security settings,
 * and contact information with validation.
 * 
 * @param props - Component props
 * @returns Rendered user form component
 */
const UserForm: React.FC<UserFormProps> = ({
  user,
  onSuccess,
  onCancel,
  isEditMode = false
}) => {
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Select the appropriate validation schema based on form mode
  const validationSchema = isEditMode 
    ? updateUserValidationSchema()
    : createUserValidationSchema();

  // Set default values based on edit mode
  const defaultValues: Partial<UserFormData> = isEditMode && user 
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
        mfaMethod: user.mfaMethod,
        contactInfo: user.contactInfo
      }
    : {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        roleId: '',
        mfaEnabled: false,
        mfaMethod: null,
        status: UserStatus.ACTIVE,
        passwordResetRequired: true,
        sendInvitation: true,
        contactInfo: {
          email: null,
          phone: null,
          alternatePhone: null,
          fax: null
        }
      };

  // Initialize form using our custom hook
  const form = useForm({
    defaultValues,
    validationSchema,
    mode: 'onBlur'
  });

  // Function to handle form submission
  const handleSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (isEditMode && user) {
        // Prepare update data
        const updateData: UpdateUserDto = {
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          status: data.status as UserStatus,
          mfaEnabled: data.mfaEnabled,
          mfaMethod: data.mfaEnabled ? data.mfaMethod : null,
          contactInfo: data.contactInfo
        };
        
        // Call API to update user
        result = await updateUser(user.id, updateData);
      } else {
        // Prepare create data
        const createData: CreateUserDto = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
          roleId: data.roleId,
          mfaEnabled: data.mfaEnabled,
          mfaMethod: data.mfaEnabled ? data.mfaMethod : null,
          contactInfo: data.contactInfo,
          passwordResetRequired: data.passwordResetRequired,
          authProvider: AuthProvider.LOCAL,
          sendInvitation: data.sendInvitation
        };
        
        // Call API to create user
        result = await createUser(createData);
      }
      
      // Call success callback with the result
      onSuccess(result);
    } catch (err: any) {
      setError(err.error?.message || 'An error occurred while saving the user');
    } finally {
      setLoading(false);
    }
  };

  // Load available roles when component mounts
  const loadRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.items.map(role => ({ 
        id: role.id, 
        name: role.name 
      })));
    } catch (err: any) {
      setError('Unable to load user roles');
      console.error('Error loading roles:', err);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Form configuration with fields grouped by sections
  const formConfig: FormConfig = {
    id: 'user-form',
    fields: [
      // User details section
      {
        name: 'email',
        label: 'Email',
        type: FormFieldType.EMAIL,
        placeholder: 'user@example.com',
        fullWidth: true,
        gridSize: { xs: 12, sm: 12 },
        hidden: isEditMode,
        validation: [{ rule: 'required' }, { rule: 'email' }]
      },
      {
        name: 'firstName',
        label: 'First Name',
        type: FormFieldType.TEXT,
        placeholder: 'Enter first name',
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        validation: [{ rule: 'required' }]
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: FormFieldType.TEXT,
        placeholder: 'Enter last name',
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        validation: [{ rule: 'required' }]
      },
      
      // Role and status
      {
        name: 'roleId',
        label: 'Role',
        type: FormFieldType.SELECT,
        options: roles.map(role => ({ value: role.id, label: role.name, disabled: false })),
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        validation: [{ rule: 'required' }]
      },
      {
        name: 'status',
        label: 'Status',
        type: FormFieldType.SELECT,
        options: [
          { value: UserStatus.ACTIVE, label: 'Active', disabled: false },
          { value: UserStatus.INACTIVE, label: 'Inactive', disabled: false },
          { value: UserStatus.PENDING, label: 'Pending', disabled: false },
          { value: UserStatus.LOCKED, label: 'Locked', disabled: false },
          { value: UserStatus.PASSWORD_RESET, label: 'Password Reset', disabled: false }
        ],
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        hidden: !isEditMode,
        validation: [{ rule: 'required' }]
      },
      
      // Password fields for creation
      {
        name: 'password',
        label: 'Password',
        type: FormFieldType.PASSWORD,
        placeholder: 'Enter password',
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        hidden: isEditMode,
        validation: [{ rule: 'required' }, { rule: 'password' }]
      },
      {
        name: 'confirmPassword',
        label: 'Confirm Password',
        type: FormFieldType.PASSWORD,
        placeholder: 'Confirm password',
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        hidden: isEditMode,
        validation: [{ rule: 'required' }]
      },
      
      // Options for new users
      {
        name: 'passwordResetRequired',
        label: 'Require Password Reset',
        type: FormFieldType.SWITCH,
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        hidden: isEditMode
      },
      {
        name: 'sendInvitation',
        label: 'Send Welcome Email',
        type: FormFieldType.SWITCH,
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 },
        hidden: isEditMode
      },
      
      // Security settings
      {
        name: 'mfaEnabled',
        label: 'Enable Multi-Factor Authentication',
        type: FormFieldType.SWITCH,
        fullWidth: true,
        gridSize: { xs: 12, sm: 12 }
      },
      {
        name: 'mfaMethod',
        label: 'MFA Method',
        type: FormFieldType.SELECT,
        options: [
          { value: MfaMethod.APP, label: 'Authenticator App', disabled: false },
          { value: MfaMethod.SMS, label: 'SMS', disabled: false },
          { value: MfaMethod.EMAIL, label: 'Email', disabled: false }
        ],
        fullWidth: true,
        gridSize: { xs: 12, sm: 12 }
      },
      
      // Contact information
      {
        name: 'contactInfo.phone',
        label: 'Phone',
        type: FormFieldType.PHONE,
        placeholder: '(123) 456-7890',
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 }
      },
      {
        name: 'contactInfo.alternatePhone',
        label: 'Alternate Phone',
        type: FormFieldType.PHONE,
        placeholder: '(123) 456-7890',
        fullWidth: true,
        gridSize: { xs: 12, sm: 6 }
      }
    ],
    onSubmit: handleSubmit
  };

  return (
    <Card 
      title={isEditMode ? 'Edit User' : 'Create New User'}
      subtitle={isEditMode ? 'Modify user details, role, and settings' : 'Add a new user to the system'}
      actions={
        <>
          <ActionButton 
            label="Cancel" 
            variant="outlined" 
            color="inherit" 
            onClick={onCancel}
            disabled={loading}
          />
          <ActionButton
            label={isEditMode ? "Save Changes" : "Create User"}
            variant="contained"
            color="primary"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={loading}
          />
        </>
      }
    >
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* User Details Section */}
          <Grid item xs={12}>
            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
              User Details
            </Typography>
          </Grid>

          {!isEditMode && (
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                {...form.register('email')}
                error={!!form.formState.errors.email}
                helperText={form.formState.errors.email?.message}
                disabled={loading}
                required
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              label="First Name"
              fullWidth
              {...form.register('firstName')}
              error={!!form.formState.errors.firstName}
              helperText={form.formState.errors.firstName?.message}
              disabled={loading}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Last Name"
              fullWidth
              {...form.register('lastName')}
              error={!!form.formState.errors.lastName}
              helperText={form.formState.errors.lastName?.message}
              disabled={loading}
              required
            />
          </Grid>

          {/* Security Settings Section */}
          <Grid item xs={12}>
            <Typography variant="h6" component="h3" sx={{ mb: 1, mt: 2 }}>
              Security Settings
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!form.formState.errors.roleId}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                {...form.register('roleId')}
                disabled={loading}
                required
              >
                {roles.map(role => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{form.formState.errors.roleId?.message}</FormHelperText>
            </FormControl>
          </Grid>

          {isEditMode && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!form.formState.errors.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Status"
                  {...form.register('status')}
                  disabled={loading}
                  required
                >
                  <MenuItem value={UserStatus.ACTIVE}>Active</MenuItem>
                  <MenuItem value={UserStatus.INACTIVE}>Inactive</MenuItem>
                  <MenuItem value={UserStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={UserStatus.LOCKED}>Locked</MenuItem>
                  <MenuItem value={UserStatus.PASSWORD_RESET}>Password Reset</MenuItem>
                </Select>
                <FormHelperText>{form.formState.errors.status?.message}</FormHelperText>
              </FormControl>
            </Grid>
          )}

          {!isEditMode && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  {...form.register('password')}
                  error={!!form.formState.errors.password}
                  helperText={form.formState.errors.password?.message}
                  disabled={loading}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  {...form.register('confirmPassword')}
                  error={!!form.formState.errors.confirmPassword}
                  helperText={form.formState.errors.confirmPassword?.message}
                  disabled={loading}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      {...form.register('passwordResetRequired')}
                      checked={form.watch('passwordResetRequired')}
                      disabled={loading}
                    />
                  }
                  label="Require Password Reset on First Login"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      {...form.register('sendInvitation')}
                      checked={form.watch('sendInvitation')}
                      disabled={loading}
                    />
                  }
                  label="Send Welcome Email"
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  {...form.register('mfaEnabled')}
                  checked={form.watch('mfaEnabled')}
                  disabled={loading}
                />
              }
              label="Enable Multi-Factor Authentication"
            />
          </Grid>

          {form.watch('mfaEnabled') && (
            <Grid item xs={12}>
              <FormControl fullWidth error={!!form.formState.errors.mfaMethod}>
                <InputLabel id="mfa-method-label">MFA Method</InputLabel>
                <Select
                  labelId="mfa-method-label"
                  label="MFA Method"
                  {...form.register('mfaMethod')}
                  disabled={loading}
                  required
                >
                  <MenuItem value={MfaMethod.APP}>Authenticator App</MenuItem>
                  <MenuItem value={MfaMethod.SMS}>SMS</MenuItem>
                  <MenuItem value={MfaMethod.EMAIL}>Email</MenuItem>
                </Select>
                <FormHelperText>{form.formState.errors.mfaMethod?.message}</FormHelperText>
              </FormControl>
            </Grid>
          )}

          {/* Contact Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" component="h3" sx={{ mb: 1, mt: 2 }}>
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone"
              fullWidth
              {...form.register('contactInfo.phone')}
              error={!!form.formState.errors.contactInfo?.phone}
              helperText={form.formState.errors.contactInfo?.phone?.message}
              disabled={loading}
              placeholder="(123) 456-7890"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Alternate Phone"
              fullWidth
              {...form.register('contactInfo.alternatePhone')}
              error={!!form.formState.errors.contactInfo?.alternatePhone}
              helperText={form.formState.errors.contactInfo?.alternatePhone?.message}
              disabled={loading}
              placeholder="(123) 456-7890"
            />
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </form>
    </Card>
  );
};

export default UserForm;