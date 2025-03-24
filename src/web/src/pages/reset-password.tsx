import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import { Head } from 'next/head'; // next/head v13.4.0
import { Box, Typography, Alert } from '@mui/material'; // @mui/material v5.13.0

import AuthLayout from '../components/layout/AuthLayout';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import { SEO_CONFIG } from '../config/seo.config';
import { AUTH_ROUTES } from '../constants/auth.constants';

/**
 * Page component that renders the password reset page
 * @returns {JSX.Element} The rendered reset password page
 */
const ResetPasswordPage: React.FC = () => {
  // LD1: Initialize router with useRouter hook to access query parameters
  const router = useRouter();

  // LD1: Extract token from query parameters
  const { token } = router.query;

  // LD1: Set up state for invalid token error
  const [invalidToken, setInvalidToken] = useState<boolean>(false);

  // LD1: Use useEffect to check if token exists in query parameters
  useEffect(() => {
    // LD1: If token doesn't exist, set invalid token error state to true
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  /**
   * LD1: Create handleSuccess function to handle successful password reset
   */
  const handleSuccess = () => {
    // LD1: Redirect to login page after successful password reset
    router.push(AUTH_ROUTES.LOGIN);
  };

  return (
    <>
      {/* LD1: Render Head component with page title */}
      <Head>
        <title>{SEO_CONFIG.TITLES.RESET_PASSWORD}</title>
      </Head>

      {/* LD1: Render AuthLayout component with 'Reset Password' title */}
      <AuthLayout title="Reset Password">
        {/* LD1: If invalid token error, display error message with link to login page */}
        {invalidToken ? (
          <Box sx={{ mt: 3 }}>
            <Alert severity="error">
              Invalid or missing reset token. Please check your email and try again.
              <Box mt={2}>
                <Typography variant="body2">
                  <a href={AUTH_ROUTES.LOGIN}>Back to Login</a>
                </Typography>
              </Box>
            </Alert>
          </Box>
        ) : (
          /* LD1: Otherwise, render ResetPasswordForm component with token and success handler */
          <ResetPasswordForm token={token as string} onSuccess={handleSuccess} />
        )}
      </AuthLayout>
    </>
  );
};

// IE3: Export the ResetPasswordPage component as the default export
export default ResetPasswordPage;