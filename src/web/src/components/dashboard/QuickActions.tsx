import React from 'react';
import { useRouter } from 'next/router'; // v13.4+
import { Grid, Box, Typography } from '@mui/material'; // v5.13.0
import { Add, FileUpload, Assessment, Receipt } from '@mui/icons-material'; // v5.13.0
import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import useResponsive from '../../hooks/useResponsive';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Helper function that returns the configuration for quick action buttons
 * @param {Object} params - Parameters for configuring the action buttons
 * @param {Object} params.router - Next.js router for navigation
 * @param {boolean} params.isMobile - Flag indicating if the device is mobile
 * @returns {Array<object>} Array of action button configurations
 */
const getActionButtons = ({ router, isMobile }) => [
  {
    label: 'Create Claim',
    icon: <Add />,
    onClick: () => router.push(ROUTES.CLAIMS.NEW),
    description: 'Generate a new claim',
    color: 'primary'
  },
  {
    label: 'Import Remittance',
    icon: <FileUpload />,
    onClick: () => router.push(ROUTES.PAYMENTS.NEW),
    description: 'Process 835 remittance files',
    color: 'secondary'
  },
  {
    label: 'Generate Report',
    icon: <Assessment />,
    onClick: () => router.push(ROUTES.REPORTS.SELECTION),
    description: 'Create financial reports',
    color: 'info'
  },
  {
    label: 'View Payments',
    icon: <Receipt />,
    onClick: () => router.push(ROUTES.PAYMENTS.ROOT),
    description: 'Manage payment reconciliation',
    color: 'success'
  }
];

/**
 * Component that displays quick action buttons for common operations on the dashboard
 * Provides easy access to frequently used functions to improve user efficiency
 * 
 * @returns {JSX.Element} The rendered QuickActions component
 */
const QuickActions = (): JSX.Element => {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  
  // Get action buttons configuration
  const actionButtons = getActionButtons({ router, isMobile });
  
  // Calculate grid sizing based on responsive breakpoints
  const gridSize = isMobile ? 12 : isTablet ? 6 : 6;
  
  return (
    <Card 
      title="Quick Actions" 
      sx={{ 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column'
      }}
    >
      <Grid container spacing={2}>
        {actionButtons.map((button, index) => (
          <Grid item xs={12} sm={gridSize} key={index}>
            <Box 
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <ActionButton
                label={button.label}
                icon={button.icon}
                onClick={button.onClick}
                color={button.color}
                variant="contained"
                size={isMobile ? 'medium' : 'large'}
                sx={{ 
                  width: '100%',
                  py: isMobile ? 1 : 1.5,
                  justifyContent: 'flex-start'
                }}
              />
              {!isMobile && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ mt: 0.5, px: 1 }}
                >
                  {button.description}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

export default QuickActions;