import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  FormControlLabel, 
  Checkbox 
} from '@mui/material';
import { z } from 'zod';

import { useAuth } from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { 
  MfaCredentials, 
  MfaMethod, 
  MfaResponse, 
  MfaFormProps 
} from '../../types/auth.types';
import { LoadingState } from '../../types/common.types';
import Card from '../ui/Card';
import AlertNotification from '../ui/AlertNotification';

/**
 * MFA verification form component displayed after successful username/password authentication
 * when multi-factor authentication is required.
 *
 * @param {MfaFormProps} props - Component props
 * @returns {JSX.Element} The MFA form component
 */
const MfaForm: React.FC<MfaFormProps> = ({ 
  mfaToken, 
  method, 
  onSuccess 
}) => {
  // Access auth context for verification functionality
  const { verifyMfa, error, loading } = useAuth();
  
  // State for remember device option
  const [rememberDevice, setRememberDevice] = useState<boolean>(false);
  
  // Create validation schema for verification code
  const validationSchema = z.object({
    code: z.string()
      .min(6, 'Verification code must be at least 6 characters')
      .max(6, 'Verification code must be exactly 6 characters')
      .regex(/^\d+$/, 'Verification code must contain only numbers')
  });
  
  // Initialize form with validation schema
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    validationSchema,
    defaultValues: {
      code: ''
    }
  });
  
  /**
   * Handle form submission to verify MFA code
   */
  const handleVerify = async (data: { code: string }) => {
    try {
      // Submit MFA verification
      const credentials: MfaCredentials = {
        mfaToken,
        code: data.code,
        rememberDevice
      };
      
      const response = await verifyMfa(credentials);
      
      // Call the onSuccess callback when verification succeeds
      if (response.user && response.tokens) {
        onSuccess(response);
      }
    } catch (err) {
      // Error handling is managed by the useAuth hook
      console.error('MFA verification failed', err);
    }
  };
  
  /**
   * Handle resending verification code
   */
  const handleResendCode = () => {
    // This would typically call an API to request a new code
    // For now, we'll just show a placeholder implementation
    console.log('Resend code requested for token:', mfaToken);
    // In a real implementation, you would call an API endpoint here
  };
  
  // Get a user-friendly description of the MFA method
  const getMfaMethodName = (method: MfaMethod): string => {
    switch (method) {
      case MfaMethod.APP:
        return 'Authenticator App';
      case MfaMethod.SMS:
        return 'SMS Text Message';
      case MfaMethod.EMAIL:
        return 'Email';
      default:
        return 'Verification Code';
    }
  };
  
  // Get instructions based on MFA method
  const getInstructions = (method: MfaMethod): string => {
    switch (method) {
      case MfaMethod.APP:
        return 'Enter the 6-digit code from your authenticator app.';
      case MfaMethod.SMS:
        return 'Enter the 6-digit code sent to your registered phone number.';
      case MfaMethod.EMAIL:
        return 'Enter the 6-digit code sent to your registered email address.';
      default:
        return 'Enter the verification code to continue.';
    }
  };
  
  return (
    <Card title="Two-Step Verification" sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Box component="form" onSubmit={handleSubmit(handleVerify)} noValidate>
        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
          {getMfaMethodName(method)}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {getInstructions(method)}
        </Typography>
        
        <TextField
          fullWidth
          label="Verification Code"
          {...register('code')}
          error={!!errors.code}
          helperText={errors.code?.message}
          placeholder="Enter 6-digit code"
          inputProps={{ maxLength: 6 }}
          margin="normal"
          autoFocus
          autoComplete="one-time-code"
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              color="primary"
            />
          }
          label="Remember this device for 30 days"
          sx={{ mb: 3 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading === LoadingState.LOADING}
            startIcon={loading === LoadingState.LOADING ? <CircularProgress size={20} /> : null}
          >
            Verify
          </Button>
          
          <Button
            variant="text"
            color="primary"
            onClick={handleResendCode}
            disabled={loading === LoadingState.LOADING}
          >
            Resend Code
          </Button>
        </Box>
        
        {error && (
          <Box sx={{ mt: 2 }}>
            <AlertNotification
              message={error.message || 'Verification failed. Please try again.'}
              severity="error"
            />
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default MfaForm;