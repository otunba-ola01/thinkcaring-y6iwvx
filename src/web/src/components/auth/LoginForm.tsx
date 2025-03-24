import React, { useState, useEffect } from 'react'; // react v18.2.0
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  FormControlLabel, 
  Checkbox, 
  Paper,
  Link
} from '@mui/material'; // v5.13.0
import { useRouter } from 'next/router'; // v13.4.0
import { z } from 'zod'; // ^3.21.4

import { useAuth } from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { 
  LoginCredentials,
  LoginFormProps
} from '../../types/auth.types';
import { LoadingState } from '../../types/common.types';
import AlertNotification from '../ui/AlertNotification';
import MfaForm from './MfaForm';
import { AUTH_ROUTES } from '../../constants/auth.constants';

/**
 * Component that renders the login form with email and password inputs
 * @param {LoginFormProps} props - props
 * @returns {JSX.Element} The rendered login form component
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  // Destructure onSuccess from props
  // Initialize router with useRouter hook
  const router = useRouter();

  // Initialize authentication hooks with useAuth
  const { login, error, loading } = useAuth();

  // Set up state for remember me checkbox
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  // Set up state for showing MFA form
  const [showMfaForm, setShowMfaForm] = useState<boolean>(false);

  // Set up state for MFA token and method
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<string | null>(null);

  // Create validation schema using Zod for email and password validation
  const validationSchema = z.object({
    email: z.string()
      .email('Please enter a valid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
  });

  // Initialize form handling with useForm hook, using validation schema
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginCredentials>({
    validationSchema,
  });

  /**
   * Create handleLogin function to process form submission
   * Handle MFA requirement in login response if needed
   */
  const handleLogin = async (data: LoginCredentials) => {
    try {
      const response = await login({ ...data, rememberMe });
      if (response.mfaRequired && response.mfaResponse) {
        // Handle MFA requirement in login response if needed
        setShowMfaForm(true);
        setMfaToken(response.mfaResponse.mfaToken);
        setMfaMethod(response.mfaResponse.method);
      } else if (response.user && response.tokens) {
        // Call the onSuccess callback when login succeeds
        onSuccess(response);
      }
    } catch (err: any) {
      // Display error notification if login fails
      console.error('Login failed', err);
    }
  };

  /**
   * Create handleMfaSuccess function to handle successful MFA verification
   */
  const handleMfaSuccess = (response: any) => {
    // Call the onSuccess callback when MFA verification succeeds
    onSuccess(response);
  };

  /**
   * Create handleForgotPassword function to navigate to forgot password page
   */
  const handleForgotPassword = () => {
    // Navigate to forgot password page
    router.push(AUTH_ROUTES.FORGOT_PASSWORD);
  };

  // Render MFA form if MFA is required
  if (showMfaForm && mfaToken && mfaMethod) {
    return (
      <MfaForm
        mfaToken={mfaToken}
        method={mfaMethod}
        onSuccess={handleMfaSuccess}
      />
    );
  }

  // Otherwise render login form with Material UI components
  return (
    <Paper elevation={3} sx={{ padding: 4, maxWidth: 500, margin: 'auto' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Login
      </Typography>
      <Box component="form" onSubmit={handleSubmit(handleLogin)} noValidate sx={{ mt: 1 }}>
        {/* Include email input field with validation */}
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        {/* Include password input field with validation */}
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        {/* Include remember me checkbox */}
        <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        {/* Include forgot password link */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Link component="button" variant="body2" onClick={handleForgotPassword}>
            Forgot password?
          </Link>
        </Box>
        {/* Include login button with loading state */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading === LoadingState.LOADING}
          startIcon={loading === LoadingState.LOADING ? <CircularProgress size={24} /> : null}
          sx={{ mt: 3, mb: 2 }}
        >
          Sign In
        </Button>
        {/* Display error notification if login fails */}
        {error && (
          <Box sx={{ mt: 2 }}>
            <AlertNotification message={error.message || 'Login failed. Please try again.'} severity="error" />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LoginForm;