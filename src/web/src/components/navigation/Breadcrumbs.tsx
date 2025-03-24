import React, { useMemo } from 'react';
import { useRouter } from 'next/router'; // v13.4+
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box, SxProps, Theme } from '@mui/material'; // v5.13+
import { styled } from '@mui/material/styles'; // v5.13+
import { Home, NavigateNext } from '@mui/icons-material'; // v5.13+

import { BreadcrumbsProps } from '../../types/ui.types';
import { NavigationConfig } from '../../config/navigation.config';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Interface for a breadcrumb item
 */
interface BreadcrumbItem {
  label: string;
  path: string;
}

// Styled components
const StyledBreadcrumbs = styled(MuiBreadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const BreadcrumbLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.primary.main,
  },
}));

const HomeIcon = styled(Home)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  width: '20px',
  height: '20px',
}));

const BreadcrumbContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  display: 'flex',
  alignItems: 'center',
}));

/**
 * A breadcrumb navigation component that displays the current location
 * within the application hierarchy and allows users to navigate back
 * to previous levels.
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ sx }) => {
  const router = useRouter();
  
  // Generate breadcrumb items based on the current path
  const breadcrumbItems = useMemo(() => {
    return NavigationConfig.getBreadcrumbs(router.asPath)
      .filter(item => item.label && item.path); // Filter out any undefined items
  }, [router.asPath]);
  
  // If there are no breadcrumb items, don't render the component
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <BreadcrumbContainer sx={sx}>
      <StyledBreadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        aria-label="breadcrumb navigation"
      >
        {/* Home link as the first breadcrumb */}
        <BreadcrumbLink
          underline="hover"
          color="inherit"
          href={ROUTES.HOME}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            router.push(ROUTES.HOME);
          }}
          aria-label="Home"
        >
          <HomeIcon />
        </BreadcrumbLink>
        
        {/* Map through the breadcrumb items */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          // Last item is not a link
          if (isLast) {
            return (
              <Typography
                key={item.path}
                color="text.primary"
                aria-current="page"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {item.label}
              </Typography>
            );
          }
          
          // All other items are links
          return (
            <BreadcrumbLink
              key={item.path}
              underline="hover"
              color="inherit"
              href={item.path}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                router.push(item.path);
              }}
            >
              {item.label}
            </BreadcrumbLink>
          );
        })}
      </StyledBreadcrumbs>
    </BreadcrumbContainer>
  );
};

export default Breadcrumbs;