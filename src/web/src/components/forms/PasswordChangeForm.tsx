import React, { useState } from 'react'; // v18.2.0
import { 
  TextField, 
  Button, 
  Grid, 
  InputAdornment, 
  IconButton, 
  CircularProgress, 
  Box, 
  Typography, 
  Alert 
} from '@mui/material'; // v5.13.0
import { Visibility, VisibilityOff } from '@mui/icons-material'; // v5.13.0
import z from 'zod'; // v3.21.0

import useForm from '../../hooks/useForm';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import Card from '../ui/Card';
import { ChangePasswordRequest } from '../../types/auth.types';
import { changePassword } from '../../api/auth.api';
import { validationPatterns } from '../../config/validation.config';

/**
 * Interface for PasswordChangeForm props
 */
interface PasswordChangeFormProps {
  onSuccess?: () => void;
}

/**
 * A form component that allows users to change their password in the HCBS Revenue Management System.
 * Implements password policy enforcement, validation, and provides feedback on password strength.
 * 
 * @param onSuccess - Optional callback function to be called on successful password change
 * @returns The rendered password change form component
 */
const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSuccess }) => {
  // Define validation schema using Zod
  const validationSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(12, 'New password must be at least 12 characters long')
      .regex(
        validationPatterns.password, 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  }).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  ).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword']
    }
  );

  // Initialize form with validation schema
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    isSubmitting,
    watch 
  } = useForm({
    validationSchema,
    mode: 'onChange'
  });

  // Watch new password for strength indicator
  const watchedNewPassword = watch('newPassword', '');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Hooks
  const toast = useToast();
  const auth = useAuth();

  /**
   * Calculates password strength based on criteria
   * @param password - The password to evaluate
   * @returns Object containing strength level and label
   */
  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      return { strength: 0, label: 'Very Weak', color: '#ff0000' };
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 12) {
      strength += 2;
    } else if (password.length >= 8) {
      strength += 1;
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 1;
    
    // Number check
    if (/[0-9]/.test(password)) strength += 1;
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Return strength level, label, and color
    if (strength <= 1) {
      return { strength: 0.2, label: 'Very Weak', color: '#ff0000' };
    } else if (strength <= 3) {
      return { strength: 0.4, label: 'Weak', color: '#ff6600' };
    } else if (strength <= 4) {
      return { strength: 0.6, label: 'Medium', color: '#ffcc00' };
    } else if (strength <= 5) {
      return { strength: 0.8, label: 'Strong', color: '#99cc00' };
    } else {
      return { strength: 1, label: 'Very Strong', color: '#00cc00' };
    }
  };

  const passwordStrength = calculatePasswordStrength(watchedNewPassword);

  /**
   * Form submission handler
   * @param formData - The form data with password values
   */
  const onSubmit = async (formData: ChangePasswordRequest) => {
    try {
      // Call API to change password
      await changePassword(formData);
      
      // Show success message
      toast.success('Password changed successfully. Please log in with your new password.', {
        title: 'Success'
      });
      
      // Force logout after password change for security
      await auth.logout();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Show error message
      toast.error(
        error instanceof Error ? error.message : 'Failed to change password. Please try again.',
        {
          title: 'Error'
        }
      );
    }
  };

  return (
    <Card
      title="Change Password"
      subtitle="Update your account password"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Current Password Field */}
          <Grid item xs={12}>
            <TextField
              {...register('currentPassword')}
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="current-password"
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current password visibility"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* New Password Field */}
          <Grid item xs={12}>
            <TextField
              {...register('newPassword')}
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="new-password"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle new password visibility"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Password Strength Indicator */}
            {watchedNewPassword && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box
                    sx={{
                      height: 4,
                      flexGrow: 1,
                      borderRadius: 2,
                      bgcolor: 'grey.300',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${passwordStrength.strength * 100}%`,
                        bgcolor: passwordStrength.color,
                        position: 'absolute',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ ml: 1, color: passwordStrength.color, fontWeight: 'bold' }}
                  >
                    {passwordStrength.label}
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>

          {/* Confirm Password Field */}
          <Grid item xs={12}>
            <TextField
              {...register('confirmPassword')}
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Password Requirements */}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Password Requirements:
              </Typography>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>At least 12 characters long</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (e.g., @$!%*?&)</li>
              </ul>
            </Alert>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || !isValid}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ mt: 1 }}
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

export default PasswordChangeForm;