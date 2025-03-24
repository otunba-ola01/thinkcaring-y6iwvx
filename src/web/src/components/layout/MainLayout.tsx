import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Container, styled } from '@mui/material'; // @mui/material v5.13+

import Sidebar from '../navigation/Sidebar';
import Topbar from '../navigation/Topbar';
import MobileNavigation from '../navigation/MobileNavigation';
import Breadcrumbs from '../navigation/Breadcrumbs';
import useResponsive from '../../hooks/useResponsive';
import { useAuthContext } from '../../context/AuthContext';
import { MainLayoutProps } from '../../types/ui.types';

// Styled components for layout structure
const LayoutRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: 'theme.palette.background.default',
});

const MainContent = styled(Box)((props: { isMobile?: boolean }) => ({
  display: 'flex',
  flex: '1 1 auto',
  paddingTop: '64px',
  paddingBottom: props.isMobile ? '56px' : 0,
}));

const ContentContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  py: 3,
  px: { xs: 2, sm: 3 },
});

const SidebarContainer = styled(Box)({
  display: { xs: 'none', md: 'block' },
  width: '240px',
  flexShrink: 0,
});

/**
 * A layout component that provides the common structure for all authenticated pages
 * @param {object} { children } - The content to be rendered inside the layout
 * @returns {JSX.Element} The rendered MainLayout component
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Get the router instance using useRouter hook
  const router = useRouter();

  // Get the isMobile and isTablet flags from useResponsive hook
  const { isMobile, isTablet } = useResponsive();

  // Get the isAuthenticated flag from useAuthContext
  const { isAuthenticated } = useAuthContext();

  // Use useState to track sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Create a handleSidebarToggle function to toggle sidebar state
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Create a handleSidebarClose function to close the sidebar
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // Use useEffect to close sidebar on route change
  useEffect(() => {
    handleSidebarClose();
  }, [router.asPath]);

  // Use useEffect to close sidebar on mobile view
  useEffect(() => {
    if (isMobile) {
      handleSidebarClose();
    }
  }, [isMobile]);

  // Render the layout structure with appropriate components based on device size
  return (
    <LayoutRoot>
      {/* Render the Topbar component at the top of the layout */}
      <Topbar onSidebarToggle={handleSidebarToggle} />

      <MainContent isMobile={isMobile}>
        {/* Render the Sidebar component for desktop and tablet views */}
        <SidebarContainer>
          <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
        </SidebarContainer>

        <ContentContainer maxWidth="xl">
          {/* Render the Breadcrumbs component below the Topbar */}
          <Breadcrumbs />

          {/* Render the main content area with the children prop */}
          {children}
        </ContentContainer>
      </MainContent>

      {/* Render the MobileNavigation component for mobile view */}
      {isMobile && <MobileNavigation />}
    </LayoutRoot>
  );
};

export default MainLayout;