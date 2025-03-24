import React from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4+
import { Box, Paper, Container, Typography } from '@mui/material'; // @mui/material v5.13+
import { HelpOutline as HelpIcon } from '@mui/icons-material'; // @mui/icons-material v5.13+

import MainLayout from './MainLayout';
import TabNavigation from '../navigation/TabNavigation';
import { HelpLayoutProps } from '../../types/ui.types';
import { ROUTES } from '../../constants/routes.constants';
import useResponsive from '../../hooks/useResponsive';

/**
 * A layout component that provides a tabbed interface for help and support pages
 * @param {HelpLayoutProps} props - The component props
 * @returns {JSX.Element} The rendered HelpLayout component
 */
const HelpLayout: React.FC<HelpLayoutProps> = ({ children, activeTab }) => {
  // Destructure props to extract children and activeTab
  // Get the router instance using useRouter hook
  const router = useRouter();

  // Get the isMobile flag from useResponsive hook
  const { isMobile } = useResponsive();

  // Determine the current active tab from props or router path
  // Define the help tabs configuration with labels, paths, and icons
  const HELP_TABS = [
    { id: 'overview', label: 'Help Center', path: ROUTES.HELP.ROOT },
    { id: 'knowledge-base', label: 'Knowledge Base', path: ROUTES.HELP.KNOWLEDGE_BASE },
    { id: 'tutorials', label: 'Tutorials', path: ROUTES.HELP.TUTORIALS },
    { id: 'support', label: 'Support', path: ROUTES.HELP.SUPPORT },
  ];

  /**
   * Handles tab change by navigating to the corresponding route
   * @param {string} value - The value of the selected tab
   * @returns {void} No return value
   */
  const handleTabChange = (value: string) => {
    // Find the selected tab in the tabs array
    const selectedTab = HELP_TABS.find((tab) => tab.id === value);

    // If the tab is found, navigate to its path
    if (selectedTab) {
      router.push(selectedTab.path);
    }
    // Otherwise, navigate to the help root path
    else {
      router.push(ROUTES.HELP.ROOT);
    }
  };

  // Render the MainLayout component as the base layout
  return (
    <MainLayout>
      {/* Render a Container component to center the content */}
      <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
        {/* Render a Paper component as the content container */}
        <Paper elevation={2} sx={{ overflow: 'hidden' }}>
          {/* Render a header with HelpIcon and Typography for the page title */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <HelpIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              Help & Support
            </Typography>
          </Box>
          {/* Render the TabNavigation component with help tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabNavigation
              tabs={HELP_TABS.map(tab => ({ label: tab.label, value: tab.id, path: tab.path }))}
              activeTab={activeTab || 'overview'}
              onChange={handleTabChange}
              queryParam="tab"
              orientation={isMobile ? 'vertical' : 'horizontal'}
            />
          </Box>
          {/* Render the children content below the tabs */}
          <Box sx={{ p: 3 }} role="main" aria-labelledby="help-title">
            {children}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
};

export default HelpLayout;