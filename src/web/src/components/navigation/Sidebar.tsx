import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  IconButton,
  Box,
  Tooltip,
  styled
} from '@mui/material'; // v5.13+
import {
  ChevronLeft,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material'; // v5.13+
import * as Icons from '@mui/icons-material'; // v5.13+

import { SidebarProps } from '../../types/ui.types';
import {
  NAVIGATION_ITEMS,
  SECONDARY_NAVIGATION_ITEMS,
  NavigationItem
} from '../../constants/navigation.constants';
import NavigationConfig from '../../config/navigation.config';
import { useAuthContext } from '../../context/AuthContext';
import useResponsive from '../../hooks/useResponsive';

// Styled components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  '& .MuiDrawer-paper': {
    width: 240,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    borderRight: '1px solid',
    borderColor: theme.palette.divider,
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  minHeight: 64,
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  '& img': {
    height: 32,
  },
}));

const NavItemStyled = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'level',
})<{ active: number; level: number }>(({ theme, active, level }) => ({
  paddingLeft: theme.spacing(level * 2),
  borderLeft: active ? `3px solid ${theme.palette.primary.main}` : 'none',
  backgroundColor: active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
}));

/**
 * A sidebar navigation component that provides access to the main sections of the application
 * 
 * @param props - The sidebar props
 * @returns The rendered Sidebar component
 */
const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const router = useRouter();
  const { hasPermission } = useAuthContext();
  const { isMobile } = useResponsive();
  
  // State for expanded sections
  const [expanded, setExpanded] = useState<string[]>([]);
  // State for active navigation item
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Handle navigation item click
  const handleNavItemClick = useCallback((item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      // Toggle expanded state if item has children
      setExpanded(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id) 
          : [...prev, item.id]
      );
    } else {
      // Navigate to the item's path
      router.push(item.path);
      
      // Close the sidebar if on mobile
      if (isMobile) {
        onClose();
      }
    }
  }, [router, isMobile, onClose]);

  // Handle expand/collapse click
  const handleExpandClick = useCallback((itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpanded(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  }, []);

  // Get icon component by name
  const getIcon = (iconName: string): JSX.Element | null => {
    if (!iconName) return null;
    
    // @ts-ignore - Icons has dynamic properties
    const IconComponent = Icons[iconName];
    
    if (IconComponent) {
      return <IconComponent />;
    }
    
    return null;
  };

  // Filter navigation items based on user permissions
  const filteredPrimaryItems = NavigationConfig.filterByPermission(
    NAVIGATION_ITEMS,
    hasPermission
  );
  
  const filteredSecondaryItems = NavigationConfig.filterByPermission(
    SECONDARY_NAVIGATION_ITEMS,
    hasPermission
  );

  // Set active item based on current path
  useEffect(() => {
    const currentPath = router.asPath;
    const activeItem = NavigationConfig.getActiveItem(currentPath);
    
    if (activeItem) {
      setActiveItem(activeItem.id);
    }
  }, [router.asPath]);

  // Expand sections that contain the active item
  useEffect(() => {
    if (activeItem) {
      // Helper function to find parent items
      const findParentItems = (
        items: NavigationItem[],
        targetId: string,
        parents: string[] = []
      ): string[] => {
        for (const item of items) {
          if (item.id === targetId) {
            return parents;
          }
          
          if (item.children && item.children.length > 0) {
            const foundParents = findParentItems(
              item.children,
              targetId,
              [...parents, item.id]
            );
            
            if (foundParents.length > 0) {
              return foundParents;
            }
          }
        }
        
        return [];
      };
      
      // Find all parent items that should be expanded
      const parentItems = [
        ...findParentItems(NAVIGATION_ITEMS, activeItem),
        ...findParentItems(SECONDARY_NAVIGATION_ITEMS, activeItem)
      ];
      
      if (parentItems.length > 0) {
        setExpanded(prev => {
          const newExpanded = [...prev];
          
          // Add parents that aren't already expanded
          for (const parent of parentItems) {
            if (!newExpanded.includes(parent)) {
              newExpanded.push(parent);
            }
          }
          
          return newExpanded;
        });
      }
    }
  }, [activeItem]);

  // Renders a navigation item with proper styling and event handling
  const NavItem = ({ 
    item, 
    level = 1, 
    expanded, 
    activeItem, 
    onItemClick, 
    onExpandClick 
  }: {
    item: NavigationItem;
    level?: number;
    expanded: string[];
    activeItem: string | null;
    onItemClick: (item: NavigationItem) => void;
    onExpandClick: (itemId: string, event: React.MouseEvent) => void;
  }): JSX.Element => {
    const isActive = item.id === activeItem;
    const isExpanded = expanded.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <>
        <NavItemStyled
          button
          level={level}
          active={isActive ? 1 : 0}
          onClick={() => onItemClick(item)}
        >
          {item.icon && (
            <ListItemIcon>
              {getIcon(item.icon)}
            </ListItemIcon>
          )}
          <ListItemText primary={item.label} />
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => onExpandClick(item.id, e)}
              sx={{ ml: 'auto' }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </NavItemStyled>
        
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <NavItem
                  key={child.id}
                  item={child}
                  level={level + 1}
                  expanded={expanded}
                  activeItem={activeItem}
                  onItemClick={onItemClick}
                  onExpandClick={onExpandClick}
                />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  return (
    <StyledDrawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? 240 : 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 0,
        },
      }}
    >
      <DrawerHeader>
        <Logo>
          <img src="/logo.png" alt="HCBS Revenue Management" />
        </Logo>
        <IconButton onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </DrawerHeader>
      
      {/* Primary Navigation */}
      <List>
        {filteredPrimaryItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            expanded={expanded}
            activeItem={activeItem}
            onItemClick={handleNavItemClick}
            onExpandClick={handleExpandClick}
          />
        ))}
      </List>
      
      <Divider />
      
      {/* Secondary Navigation */}
      <List>
        {filteredSecondaryItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            expanded={expanded}
            activeItem={activeItem}
            onItemClick={handleNavItemClick}
            onExpandClick={handleExpandClick}
          />
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar;