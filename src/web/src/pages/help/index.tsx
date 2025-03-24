import React from 'react'; // react v18.2.0
import { NextPage } from 'next'; // next v13.4+
import Head from 'next/head'; // next/head v13.4+
import { Grid, Typography, Box } from '@mui/material'; // @mui/material v5.13+
import { MenuBook as KnowledgeBaseIcon, VideoLibrary as TutorialsIcon, SupportAgent as SupportIcon } from '@mui/icons-material'; // @mui/icons-material v5.13+

import HelpLayout from '../../components/layout/HelpLayout';
import Card from '../../components/ui/Card';
import ActionButton from '../../components/ui/ActionButton';
import { ROUTES } from '../../constants/routes.constants';
import useResponsive from '../../hooks/useResponsive';

// Define the type for help resource objects
interface HelpResource {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  buttonText: string;
}

// Define the help resources
const HELP_RESOURCES: HelpResource[] = [
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Browse our comprehensive collection of articles covering all aspects of the HCBS Revenue Management System.',
    icon: 'KnowledgeBaseIcon',
    route: ROUTES.HELP.KNOWLEDGE_BASE,
    buttonText: 'Browse Articles',
  },
  {
    id: 'tutorials',
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides demonstrating how to use key features of the system.',
    icon: 'TutorialsIcon',
    route: ROUTES.HELP.TUTORIALS,
    buttonText: 'Watch Tutorials',
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Contact our support team, submit a ticket, or chat with us for personalized assistance.',
    icon: 'SupportIcon',
    route: ROUTES.HELP.SUPPORT,
    buttonText: 'Get Support',
  },
];

/**
 * The main Help Center page component that provides an overview of available help resources
 * @returns {JSX.Element} The rendered Help page component
 */
const HelpPage: NextPage = () => {
  // Get responsive design information using useResponsive hook
  const { isMobile } = useResponsive();

  // Render the HelpLayout component as the base layout
  return (
    <HelpLayout activeTab="overview">
      {/* Include Head component with page title and metadata */}
      <Head>
        <title>Help Center - HCBS Revenue Management</title>
        <meta name="description" content="Find help and support resources for the HCBS Revenue Management System." />
      </Head>

      {/* Render welcome section with introduction to help resources */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to the Help Center
        </Typography>
        <Typography variant="body1">
          How can we help you today? Explore the resources below to find answers to your questions and get the most out of the HCBS Revenue Management System.
        </Typography>
      </Box>

      {/* Create a grid layout for help resource cards */}
      <Grid container spacing={3}>
        {HELP_RESOURCES.map((resource) => (
          <Grid item xs={12} md={isMobile ? 12 : 4} key={resource.id}>
            {/* Render Knowledge Base card with description and navigation button */}
            <Card title={resource.title} elevation={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {resource.description}
              </Typography>
              <ActionButton
                label={resource.buttonText}
                icon={React.createElement(
                  // Dynamically render the icon component
                  (resource.icon === 'KnowledgeBaseIcon'
                    ? KnowledgeBaseIcon
                    : resource.icon === 'TutorialsIcon'
                      ? TutorialsIcon
                      : SupportIcon) as React.ComponentType
                )}
                onClick={() => {
                  // Navigate to the specified route when the button is clicked
                  window.location.href = resource.route;
                }}
                variant="contained"
                color="primary"
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </HelpLayout>
  );
};

export default HelpPage;