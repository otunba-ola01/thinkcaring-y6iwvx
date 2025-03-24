# src/web/src/components/forms/UserProfileForm.tsx
```typescript
import React, { useState, useEffect } from 'react'; // v18.2.0
import { Grid, TextField, Box, Typography, CircularProgress, Alert, FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel } from '@mui/material'; // v5.13.0
import { z } from 'zod'; // v3.21.0

import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import useForm from '../../hooks/useForm';
import { updateUser } from '../../api/users.api';
import { useAuthContext } from '../../context/AuthContext';
import { UserProfile, UpdateUserDto, ContactInfo } from '../../types/users.types';
import { FormFieldType } from '../../types/form.types';

/**
 * Creates a Zod validation schema for the user profile form
 * @returns {z.ZodObject} Zod validation schema for user profile data
 */
const createProfileValidationSchema = () => {
  // Create a Zod object schema with validation rules for each field
  return z.object({
    firstName: z.string()
      .min(2, { message: "First name must be at least 2 characters" })
      .max(50, { message: "First name must be less than 50 characters" }),
    lastName: z.string()
      .min(2, { message: "Last name must be at least 2 characters" })
      .max(50, { message: "Last name must be less than 50 characters" }),
    contactInfo: z.object({
      email: z.string().email({ message: "Invalid email address" }),
      phone: z.string().optional(),
      alternatePhone: z.string().optional(),
      fax: z.string().optional(),
    }).required(),
  });
};

/**
 * Form component for editing user profile information
 * @param {Function} onSuccess - Function called when profile is successfully updated
 */
const UserProfileForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  // Hook to access the current user data from authentication context
  const { user } = useAuthContext();

  // React hook for component state management
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Custom form hook for handling form state and validation
  const form = useForm<UpdateUserDto>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      contactInfo: {
        email: user?.email || '',
        phone: user?.contactInfo?.phone || '',
        alternatePhone: user?.contactInfo?.alternatePhone || '',
        fax: user?.contactInfo?.fax || '',
      },
    },
    validationSchema: createProfileValidationSchema(),
    onSubmit: async (formData: UpdateUserDto) => {
      // Handles form submission and profile update
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        // Call updateUser API with user ID and form data
        if (user) {
          await updateUser(user.id, formData);
          setSuccessMessage('Profile updated successfully!');
          onSuccess();
        } else {
          setError('User not found. Please refresh the page.');
        }
      } catch (err: any) {
        // If error occurs, set error message
        setError(err.message || 'Failed to update profile. Please try again.');
      } finally {
        // Set loading state to false regardless of outcome
        setLoading(false);
      }
    },
  });

  // useEffect to initialize form with user data when it becomes available
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactInfo: {
          email: user.email || '',
          phone: user.contactInfo?.phone || '',
          alternatePhone: user.contactInfo?.alternatePhone || '',
          fax: user.contactInfo?.fax || '',
        },
      });
    }
  }, [user, form.reset]);

  return (
    <Card title="User Profile" subtitle="Update your personal information and preferences" loading={loading}>
      <form onSubmit={form.handleSubmit(form.onSubmit)}>
        <Grid container spacing={2}>
          {/* Personal Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6">Personal Information</Typography>
            <TextField
              label="First Name"
              fullWidth
              margin="normal"
              {...form.register('firstName')}
              error={!!form.formState.errors.firstName}
              helperText={form.formState.errors.firstName?.message}
            />
            <TextField
              label="Last Name"
              fullWidth
              margin="normal"
              {...form.register('lastName')}
              error={!!form.formState.errors.lastName}
              helperText={form.formState.errors.lastName?.message}
            />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              InputProps={{
                readOnly: true,
              }}
              {...form.register('contactInfo.email')}
              error={!!form.formState.errors.contactInfo?.email}
              helperText={form.formState.errors.contactInfo?.email?.message}
            />
          </Grid>

          {/* Contact Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6">Contact Information</Typography>
            <TextField
              label="Phone"
              fullWidth
              margin="normal"
              {...form.register('contactInfo.phone')}
              error={!!form.formState.errors.contactInfo?.phone}
              helperText={form.formState.errors.contactInfo?.phone?.message}
            />
            <TextField
              label="Alternate Phone"
              fullWidth
              margin="normal"
              {...form.register('contactInfo.alternatePhone')}
              error={!!form.formState.errors.contactInfo?.alternatePhone}
              helperText={form.formState.errors.contactInfo?.alternatePhone?.message}
            />
            <TextField
              label="Fax"
              fullWidth
              margin="normal"
              {...form.register('contactInfo.fax')}
              error={!!form.formState.errors.contactInfo?.fax}
              helperText={form.formState.errors.contactInfo?.fax?.message}
            />
          </Grid>

          {/* Preferences Section */}
          <Grid item xs={12}>
            <Typography variant="h6">Preferences</Typography>
          </Grid>

          {/* Error and Success Messages */}
          <Grid item xs={12}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12} display="flex" justifyContent="flex-end">
            <ActionButton label="Save Changes" type="submit" disabled={form.formState.isSubmitting} />
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

export default UserProfileForm;