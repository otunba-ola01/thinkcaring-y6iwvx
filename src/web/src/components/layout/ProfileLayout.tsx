import React, { ReactNode, useMemo } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Paper, Container } from '@mui/material'; // @mui/material v5.13+

import MainLayout from './MainLayout';
import TabNavigation from '../navigation/TabNavigation';
import { ROUTES } from '../../constants/routes.constants';
import useResponsive from '../../hooks/useResponsive';
import { useAuthContext } from '../../context/AuthContext';

/**
 * Interface defining the props for the ProfileLayout component
 */
interface ProfileLayoutProps {
  /**
   * The content to be rendered inside the layout
   */
  children: ReactNode;
  /**
   * The currently active profile tab
   */
  activeTab?: string;
}

/**
 * A layout component that provides a consistent structure for all profile-related pages
 * @param {ProfileLayoutProps} props - The props for the ProfileLayout component
 * @returns {JSX.Element} The rendered ProfileLayout component
 */
const ProfileLayout: React.FC<ProfileLayoutProps> = (props) => {
  // LD1: Destructure props to extract children and activeTab
  const { children, activeTab } = props;

  // LD1: Get the router instance using useRouter hook
  const router = useRouter();

  // LD1: Get the isMobile flag from useResponsive hook
  const { isMobile } = useResponsive();

  // LD1: Get the user from useAuthContext
  const { user, hasPermission } = useAuthContext();

  // LD1: Define profile tabs based on user permissions
  const profileTabs = useMemo(
    () => [
      { label: 'Profile', value: 'profile', path: ROUTES.PROFILE.ROOT },
      { label: 'Password', value: 'password', path: ROUTES.PROFILE.PASSWORD },
      { label: 'Notifications', value: 'notifications', path: ROUTES.PROFILE.NOTIFICATIONS },
      { label: 'Theme', value: 'theme', path: ROUTES.PROFILE.THEME },
      {
        label: 'API Keys',
        value: 'api-keys',
        path: ROUTES.PROFILE.API_KEYS,
        // IE1: Check if the user has the 'api:manage' permission before including the 'API Keys' tab
        requiredPermission: 'api:manage',
      },
    ],
    [hasPermission]
  );

  // IE1: Filter the profile tabs based on user permissions
  const filteredTabs = useMemo(() => {
    return profileTabs.filter(tab => {
      return !tab.requiredPermission || hasPermission(tab.requiredPermission);
    });
  }, [profileTabs, hasPermission]);

  // LD1: Handle tab change by navigating to the corresponding route
  const handleTabChange = (value: string) => {
    // Find the selected tab in the tabs array
    const selectedTab = filteredTabs.find((tab) => tab.value === value);

    // If the tab is found, navigate to its path
    if (selectedTab) {
      router.push(selectedTab.path);
    }
    // Otherwise, navigate to the profile root path
    else {
      router.push(ROUTES.PROFILE.ROOT);
    }
  };

  // LD1: Render the MainLayout component as the base layout
  return (
    <MainLayout>
      {/* LD1: Render a Container with appropriate spacing */}
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        {/* LD1: Render a Paper component to contain the profile content */}
        <Paper elevation={2} sx={{ overflow: 'hidden' }}>
          {/* LD1: Render a Box for the tab navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {/* LD1: Render the TabNavigation component with profile tabs */}
            <TabNavigation
              tabs={filteredTabs}
              activeTab={activeTab || 'profile'}
              onChange={handleTabChange}
              queryParam="tab"
              orientation={isMobile ? 'vertical' : 'horizontal'}
            />
          </Box>
          {/* LD1: Render the children content below the tabs */}
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

// LD2: Export the ProfileLayout component as the default export
export default ProfileLayout;