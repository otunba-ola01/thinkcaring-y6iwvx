import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react'; // react 18.2.0
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'; // @mui/material/styles 5.13+
import CssBaseline from '@mui/material/CssBaseline'; // @mui/material 5.13+

import { ThemeMode } from '../types/common.types';
import { ThemeContextType, ThemeProviderProps } from '../types/theme.types';
import { createAppTheme } from '../styles/theme';
import { getSystemThemeMode, resolveThemeMode } from '../config/theme.config';
import useLocalStorage from '../hooks/useLocalStorage';

// Constants for localStorage keys
const THEME_MODE_STORAGE_KEY = 'thinkcaringapp_theme_mode';
const HIGH_CONTRAST_STORAGE_KEY = 'thinkcaringapp_high_contrast';

// Create the theme context
const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Theme provider component that manages theme state and provides it to the application
 * Handles theme mode (light/dark/system) and high contrast mode
 * Persists preferences in localStorage and syncs with system preferences
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialThemeMode = ThemeMode.SYSTEM,
  initialHighContrast = false
}) => {
  // Use localStorage to persist theme preferences
  const [themeMode, setThemeMode] = useLocalStorage<ThemeMode>(
    THEME_MODE_STORAGE_KEY,
    initialThemeMode
  );

  const [highContrast, setHighContrast] = useLocalStorage<boolean>(
    HIGH_CONTRAST_STORAGE_KEY,
    initialHighContrast
  );

  // Toggle between light, dark, and system theme modes
  const toggleThemeMode = useCallback(() => {
    setThemeMode((prevMode) => {
      switch (prevMode) {
        case ThemeMode.LIGHT:
          return ThemeMode.DARK;
        case ThemeMode.DARK:
          return ThemeMode.SYSTEM;
        case ThemeMode.SYSTEM:
        default:
          return ThemeMode.LIGHT;
      }
    });
  }, [setThemeMode]);

  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    setHighContrast((prevValue) => !prevValue);
  }, [setHighContrast]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (themeMode !== ThemeMode.SYSTEM) {
      return;
    }

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Update theme when system preference changes
    const handleSystemThemeChange = () => {
      // Force a rerender to apply the new system theme preference
      setThemeMode(ThemeMode.SYSTEM);
    };

    // Add event listener for system theme changes
    darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Clean up event listener on unmount or when themeMode changes
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themeMode, setThemeMode]);

  // Create the Material UI theme based on the current theme mode and high contrast setting
  const theme = useMemo(() => {
    return createAppTheme({
      mode: themeMode,
      highContrast,
      responsiveFontSizes: true,
      direction: 'ltr'
    });
  }, [themeMode, highContrast]);

  // Create the context value object
  const contextValue = useMemo<ThemeContextType>(
    () => ({
      themeMode,
      toggleThemeMode,
      setThemeMode,
      highContrast,
      toggleHighContrast
    }),
    [themeMode, toggleThemeMode, setThemeMode, highContrast, toggleHighContrast]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the theme context
 * Must be used within a ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// Export the theme context
export default ThemeContext;