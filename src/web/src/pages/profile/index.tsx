import React, { useState, useEffect } from 'react'; // react v18.2.0
import { Box, Typography, CircularProgress } from '@mui/material'; // @mui/material v5.13.0
import Head from 'next/head'; // next/head v latest

import ProfileLayout from '../../components/layout/ProfileLayout';
import UserProfileForm from '../../components/forms/UserProfileForm';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { UserProfile } from '../../types/users.types';

/**
 * The main profile page component that displays the user profile form
 * @returns {JSX.Element} The rendered profile page component
 */
const ProfilePage: React.FC = () => {
  // Get the current user from useAuth hook
  const { user } = useAuth();

  // Get toast notification functions from useToast hook
  const { success } = useToast();

  // Set up loading state for initial data fetch
  const [loading, setLoading] = useState<boolean>(true);

  // Set up user profile state to store the profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  /**
   * Handler for successful profile updates
   * @returns {void} No return value
   */
  const handleProfileUpdateSuccess = () => {
    // Show a success toast notification
    success('Profile updated successfully!');

    // Optionally refresh user data if needed
  };

  // Effect to update the userProfile state when user data is available
  useEffect(() => {
    // If user data is available, set userProfile state with user data
    if (user) {
      setUserProfile(user);
    }

    // Set loading state to false once data is available
    setLoading(false);
  }, [user]);

  return (
    <ProfileLayout activeTab="profile">
      <Head>
        <title>Profile | HCBS Revenue Management</title>
        <meta name="description" content="Manage your personal information and preferences in the HCBS Revenue Management System" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom id="profile-title">
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your personal information and preferences
        </Typography>

        {/* Show loading indicator while user data is being fetched */}
        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Pass the user profile data to the UserProfileForm component */}
        {!loading && userProfile && (
          <UserProfileForm onSuccess={handleProfileUpdateSuccess} />
        )}
      </Box>
    </ProfileLayout>
  );
};

export default ProfilePage;