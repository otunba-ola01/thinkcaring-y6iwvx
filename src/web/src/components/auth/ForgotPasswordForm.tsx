import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Link 
} from '@mui/material'; // v5.13.0
import { useRouter } from 'next/router'; // v13.4.0
import { z } from 'zod'; // v3.21.4

import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { ForgotPasswordRequest, ForgotPasswordFormProps } from '../../types/auth.types';
import { LoadingState } from '../../types/common.types';
import { AUTH_ROUTES } from '../../constants/auth.constants';
import AlertNotification from '../ui/AlertNotification';

/**
 * ForgotPasswordForm component allows users to request a password reset by entering their email address.
 * It handles form validation, submission, and displays appropriate success or error messages.
 */
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { forgotPassword, error, loading } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);

  // Create validation schema for the email field
  const validationSchema = z.object({
    email: z.string()
      .email('Please enter a valid email address')
      .min(1, 'Email is required')
  });

  // Initialize form with validation schema
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    validationSchema,
    defaultValues: {
      email: ''
    }
  });

  /**
   * Handles form submission to request password reset
   * @param data Form data containing email address
   */
  const handleForgotPassword = async (data: ForgotPasswordRequest) => {
    try {
      // Call the API to send password reset email
      await forgotPassword(data.email);
      
      // Show success message
      setIsSuccess(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is handled by the useAuth hook and displayed via AlertNotification
      console.error('Password reset request failed:', error);
    }
  };

  /**
   * Navigates back to the login page
   */
  const handleBackToLogin = () => {
    router.push(AUTH_ROUTES.LOGIN);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%', mx: 'auto' }}>
      {isSuccess ? (
        // Success message after form submission
        <Box textAlign="center">
          <Typography variant="h5" gutterBottom color="primary">
            Reset Link Sent
          </Typography>
          <Typography variant="body1" paragraph>
            If an account exists with the email you entered, you will receive password reset instructions shortly.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBackToLogin}
            fullWidth
            sx={{ mt: 2 }}
          >
            Back to Login
          </Button>
        </Box>
      ) : (
        // Forgot password form
        <Box component="form" onSubmit={handleSubmit(handleForgotPassword)} noValidate>
          <Typography variant="h5" gutterBottom align="center" color="primary">
            Forgot Password
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>
          
          {/* Display error message if submission fails */}
          {error && (
            <Box mb={2}>
              <AlertNotification 
                message={error.message || 'An error occurred. Please try again.'} 
                severity="error" 
              />
            </Box>
          )}
          
          {/* Email input */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            autoComplete="email"
            autoFocus
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading === LoadingState.LOADING}
          />
          
          {/* Submit button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading === LoadingState.LOADING}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading === LoadingState.LOADING ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Reset Password'
            )}
          </Button>
          
          {/* Back to login link */}
          <Box textAlign="center">
            <Link 
              component="button"
              variant="body2"
              onClick={handleBackToLogin}
              sx={{ textDecoration: 'none' }}
            >
              Back to Login
            </Link>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ForgotPasswordForm;