# src/web/src/pages/profile/password.tsx
```tsx
import React from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Typography, Box, Paper, Container } from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v13.4+

import ProfileLayout from '../../components/layout/ProfileLayout';
import PasswordChangeForm from '../../components/forms/PasswordChangeForm';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Page component for changing user password
 * @returns {JSX.Element} The rendered password page component
 */
const PasswordPage: React.FC = () => {
  // Initialize router using useRouter hook
  const router = useRouter();

  // Initialize toast notification hook using useToast
  const toast = useToast();

  // Initialize auth hook using useAuth
  const auth = useAuth();

  /**
   * Handles successful password change
   */
  const handlePasswordChangeSuccess = () => {
    // Display success toast notification
    toast.success(
      'Password changed successfully. You will be redirected to the login page.',
      {
        title: 'Success',
      }
    );

    // Redirect to profile page after short delay
    setTimeout(() => {
      router.push(ROUTES.AUTH.LOGIN);
    }, 2000);
  };

  // Render the page with ProfileLayout component
  return (
    <ProfileLayout activeTab="password">
      {/* Set page title and meta tags using Head component */}
      <Head>
        <title>Change Password | HCBS Revenue Management</title>
        <meta name="description" content="Change your account password" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Render page heading and description */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Change Password
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Update your password to maintain account security. Your new password
          must be at least 12 characters long and include uppercase,
          lowercase, numbers, and special characters.
        </Typography>
      </Box>

      {/* Render PasswordChangeForm component with success handler */}
      <PasswordChangeForm onSuccess={handlePasswordChangeSuccess} />
    </ProfileLayout>
  );
};

// Export the password page component as the default export
export default PasswordPage;