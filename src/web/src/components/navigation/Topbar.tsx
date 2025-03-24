import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Settings,
  Help,
  AccountCircle,
  Logout,
  Brightness4,
  Brightness7,
  Search
} from '@mui/icons-material';

import { TopbarProps } from '../../types/ui.types';
import { useAuthContext } from '../../context/AuthContext';
import useResponsive from '../../hooks/useResponsive';
import SearchInput from '../ui/SearchInput';
import { ROUTES } from '../../constants/routes.constants';

// Helper function to get initials from a user's name for the avatar
function getInitials(name?: string): string {
  if (!name) return 'U';
  
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  
  return initials;
}

// Styled components for the Topbar
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  zIndex: theme.zIndex.drawer + 1
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginRight: theme.spacing(2)
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: { xs: 'none', sm: 'flex' },
  maxWidth: '500px'
}));

const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center'
}));

const UserInfo = styled(Box)(({ theme }) => ({
  display: { xs: 'none', md: 'flex' },
  alignItems: 'center',
  marginLeft: theme.spacing(1),
  cursor: 'pointer'
}));

const UserName = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontWeight: 500
}));

// Notification interface for type safety
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
}

const Topbar: React.FC<TopbarProps> = ({ onSidebarToggle }) => {
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const { isMobile, isTablet } = useResponsive();
  
  // State for search input
  const [searchValue, setSearchValue] = useState<string>('');
  
  // State for user menu and notifications menu
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  
  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);
  
  // Handle user menu open/close
  const handleUserMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  }, []);
  
  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchor(null);
  }, []);
  
  // Handle notifications menu open/close
  const handleNotificationsOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  }, []);
  
  const handleNotificationsClose = useCallback(() => {
    setNotificationsAnchor(null);
  }, []);
  
  // Handle logout action
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push(ROUTES.AUTH.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleUserMenuClose();
  }, [logout, router, handleUserMenuClose]);
  
  // Handle navigation actions
  const handleProfileClick = useCallback(() => {
    router.push(ROUTES.PROFILE.ROOT);
    handleUserMenuClose();
  }, [router, handleUserMenuClose]);
  
  const handleSettingsClick = useCallback(() => {
    router.push(ROUTES.SETTINGS.ROOT);
    handleUserMenuClose();
  }, [router, handleUserMenuClose]);
  
  const handleHelpClick = useCallback(() => {
    router.push(ROUTES.HELP.ROOT);
    handleUserMenuClose();
  }, [router, handleUserMenuClose]);
  
  // Handle search submit
  const handleSearch = useCallback((value: string) => {
    console.log('Searching for:', value);
    // In a real app, this would navigate to search results or filter the current view
    // router.push({ pathname: '/search', query: { q: value } });
  }, []);
  
  // Sample notifications - in a real app, these would come from a notifications service/context
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Claim Denied',
      message: 'Claim #C10043 has been denied by Medicare',
      timestamp: '2023-06-01T10:30:00Z',
      read: false,
      type: 'error'
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'Payment #P5045 has been received from Medicaid',
      timestamp: '2023-06-01T09:15:00Z',
      read: false,
      type: 'success'
    },
    {
      id: '3',
      title: 'Authorization Expiring',
      message: 'Service authorization for John Smith expires in 5 days',
      timestamp: '2023-05-31T16:45:00Z',
      read: true,
      type: 'warning'
    }
  ];
  
  // Count unread notifications for the badge
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        {/* Sidebar toggle button (desktop and tablet only) */}
        {!isMobile && (
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            edge="start"
            onClick={onSidebarToggle}
            sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {/* Logo and App Name */}
        <LogoContainer>
          <Box
            sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              borderRadius: '4px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              mr: 1
            }}
          >
            TC
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            ThinkCaring
          </Typography>
        </LogoContainer>
        
        {/* Global Search */}
        <SearchContainer>
          <SearchInput
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            sx={{ width: '100%' }}
          />
        </SearchContainer>
        
        {/* Actions Container */}
        <ActionsContainer>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              aria-label="show notifications"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Menu Trigger */}
          <Tooltip title="Account settings">
            <Box onClick={handleUserMenuOpen} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                alt={user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
              >
                {getInitials(`${user?.firstName || ''} ${user?.lastName || ''}`)}
              </Avatar>
              
              {/* Show user name on medium screens and up */}
              <UserInfo>
                <UserName variant="body2" noWrap>
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
                </UserName>
              </UserInfo>
            </Box>
          </Tooltip>
        </ActionsContainer>
        
        {/* User Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          id="user-menu"
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 220,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <MenuItem onClick={handleHelpClick}>
            <ListItemIcon>
              <Help fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Help" />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>
        
        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          id="notifications-menu"
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 360,
              maxHeight: 400,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">Notifications</Typography>
          </Box>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <MenuItem 
                key={notification.id} 
                onClick={handleNotificationsClose}
                sx={{ 
                  py: 1.5,
                  borderLeft: '4px solid',
                  borderColor: notification.type === 'error' 
                    ? 'error.main' 
                    : notification.type === 'warning' 
                    ? 'warning.main' 
                    : notification.type === 'success' 
                    ? 'success.main' 
                    : 'info.main',
                  bgcolor: notification.read ? 'inherit' : 'action.hover'
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">{notification.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {notification.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" align="center" sx={{ py: 2, width: '100%' }}>
                No notifications
              </Typography>
            </MenuItem>
          )}
          {notifications.length > 0 && (
            <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography 
                component="button"
                variant="body2"
                color="primary"
                sx={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  '&:hover': { textDecoration: 'underline' } 
                }}
                onClick={handleNotificationsClose}
              >
                View all notifications
              </Typography>
            </Box>
          )}
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Topbar;