import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // v13.4+
import { BottomNavigation, BottomNavigationAction, Paper, styled } from '@mui/material'; // v5.13+
import * as Icons from '@mui/icons-material'; // v5.13+

import { MobileNavigationProps } from '../../types/ui.types';
import { MOBILE_NAVIGATION_ITEMS, NavigationItem } from '../../constants/navigation.constants';
import NavigationConfig from '../../config/navigation.config';
import { useAuthContext } from '../../context/AuthContext';
import useResponsive from '../../hooks/useResponsive';

// Styled component for the bottom navigation
const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  width: '100%',
  position: 'fixed',
  bottom: 0,
  left: 0,
  zIndex: theme.zIndex.appBar,
  borderTop: '1px solid',
  borderColor: theme.palette.divider,
}));

// Wrapper component to provide elevation and proper positioning
const NavigationWrapper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  elevation: 3
}));

/**
 * A mobile navigation component that provides a bottom navigation bar for the application
 * It displays simplified navigation items with icons and labels, and implements 
 * permission-based access control to ensure users only see navigation items 
 * they have access to.
 * 
 * @param props - The component props
 * @returns The rendered MobileNavigation component or null if not on mobile
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const router = useRouter();
  const { hasPermission } = useAuthContext();
  const { isMobile } = useResponsive();
  const [value, setValue] = useState('');

  /**
   * Handle navigation change when a user selects a navigation item
   * 
   * @param event - The change event
   * @param newValue - The new selected value
   */
  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    const selectedItem = MOBILE_NAVIGATION_ITEMS.find(item => item.id === newValue);
    if (selectedItem) {
      router.push(selectedItem.path);
    }
  };

  /**
   * Dynamically renders a Material UI icon based on icon name
   * 
   * @param iconName - The name of the icon to render
   * @returns The rendered icon or null if icon not found
   */
  const getIcon = (iconName: string): JSX.Element | null => {
    if (!iconName) return null;
    
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent />;
    }
    
    return null;
  };

  // Filter navigation items based on user permissions
  const filteredItems = NavigationConfig.filterByPermission(
    MOBILE_NAVIGATION_ITEMS,
    hasPermission
  );

  // Set the active navigation item based on the current route
  useEffect(() => {
    if (router.pathname) {
      const activeItem = NavigationConfig.getActiveItem(router.pathname);
      if (activeItem) {
        setValue(activeItem.id);
      }
    }
  }, [router.pathname]);

  // Only show navigation on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <NavigationWrapper className={className}>
      <StyledBottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
      >
        {filteredItems.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={item.label}
            value={item.id}
            icon={getIcon(item.icon)}
          />
        ))}
      </StyledBottomNavigation>
    </NavigationWrapper>
  );
};

export default MobileNavigation;