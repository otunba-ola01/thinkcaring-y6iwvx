import React, { useState, useEffect } from 'react'; // react v18.2.0
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Link,
  InputAdornment,
  IconButton
} from '@mui/material'; // v5.13.0
import { Visibility, VisibilityOff } from '@mui/icons-material'; // v5.13.0
import { useRouter } from 'next/router'; // v13.4.0
import { z } from 'zod'; // v3.21.4

import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { ResetPasswordRequest, ResetPasswordFormProps } from '../../types/auth.types';
import { LoadingState } from '../../types/common.types';
import { AUTH_ROUTES, PASSWORD_POLICY } from '../../constants/auth.constants';
import AlertNotification from '../ui/AlertNotification';

/**
 * Component that renders a password reset form to create a new password
 * after receiving a password reset link.
 * 
 * @param {ResetPasswordFormProps} props - Props containing the reset token and success callback
 * @returns {JSX.Element} - The rendered reset password form component
 */
const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token, onSuccess }) => {
  // Initialize router for navigation
  const router = useRouter();
  
  // Get authentication-related functions and state
  const { resetPassword, error, loading } = useAuth();
  
  // State management
  const [success, setSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Create password validation schema using Zod
  const validationSchema = z
    .object({
      password: z
        .string()
        .min(
          PASSWORD_POLICY.MIN_LENGTH,
          `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`
        ),
      confirmPassword: z.string()
    })
    .refine(data => {
      if (PASSWORD_POLICY.REQUIRE_UPPERCASE) {
        return /[A-Z]/.test(data.password);
      }
      return true;
    }, {
      message: "Password must contain at least one uppercase letter",
      path: ["password"]
    })
    .refine(data => {
      if (PASSWORD_POLICY.REQUIRE_LOWERCASE) {
        return /[a-z]/.test(data.password);
      }
      return true;
    }, {
      message: "Password must contain at least one lowercase letter",
      path: ["password"]
    })
    .refine(data => {
      if (PASSWORD_POLICY.REQUIRE_NUMBERS) {
        return /\d/.test(data.password);
      }
      return true;
    }, {
      message: "Password must contain at least one number",
      path: ["password"]
    })
    .refine(data => {
      if (PASSWORD_POLICY.REQUIRE_SYMBOLS) {
        return /[^A-Za-z0-9]/.test(data.password);
      }
      return true;
    }, {
      message: "Password must contain at least one special character",
      path: ["password"]
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });

  // Initialize form handling with validation schema
  const { 
    register, 
    handleSubmit, 
    formState, 
    watch 
  } = useForm({
    validationSchema,
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Watch password field for confirm password validation
  const password = watch('password');

  /**
   * Handle password reset form submission
   * @param data - Form data containing password and confirmPassword
   */
  const handleResetPassword = async (data: ResetPasswordRequest) => {
    try {
      // Call API to reset password
      await resetPassword({ 
        token, 
        password: data.password, 
        confirmPassword: data.confirmPassword 
      });
      
      // Set success state to true on successful submission
      setSuccess(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is handled by useAuth hook and displayed via AlertNotification
      console.error('Password reset failed:', error);
    }
  };

  /**
   * Handle navigation back to login page
   */
  const handleBackToLogin = () => {
    router.push(AUTH_ROUTES.LOGIN);
  };

  // Toggle password visibility handlers
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  // If password reset was successful, show success message
  if (success) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', mx: 'auto' }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Password Reset Successful
        </Typography>
        <Typography variant="body1" paragraph align="center">
          Your password has been successfully reset. You can now log in with your new password.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBackToLogin}
            fullWidth
          >
            Back to Login
          </Button>
        </Box>
      </Paper>
    );
  }

  // Render the reset password form
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Reset Your Password
      </Typography>
      <Typography variant="body2" paragraph align="center">
        Please enter your new password below.
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <AlertNotification 
            message={error.message} 
            severity="error"
          />
        </Box>
      )}

      <form onSubmit={handleSubmit(handleResetPassword)}>
        <TextField
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          {...register('password')}
          error={!!formState.errors.password}
          helperText={formState.errors.password?.message as string}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          {...register('confirmPassword')}
          error={!!formState.errors.confirmPassword}
          helperText={formState.errors.confirmPassword?.message as string}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={toggleConfirmPasswordVisibility}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="textSecondary" gutterBottom component="div">
            Password must contain:
            <ul>
              <li>At least {PASSWORD_POLICY.MIN_LENGTH} characters</li>
              {PASSWORD_POLICY.REQUIRE_UPPERCASE && <li>At least one uppercase letter</li>}
              {PASSWORD_POLICY.REQUIRE_LOWERCASE && <li>At least one lowercase letter</li>}
              {PASSWORD_POLICY.REQUIRE_NUMBERS && <li>At least one number</li>}
              {PASSWORD_POLICY.REQUIRE_SYMBOLS && <li>At least one special character</li>}
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading === LoadingState.LOADING}
          >
            {loading === LoadingState.LOADING ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Reset Password'
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={handleBackToLogin}
          >
            Back to Login
          </Link>
        </Box>
      </form>
    </Paper>
  );
};

export default ResetPasswordForm;