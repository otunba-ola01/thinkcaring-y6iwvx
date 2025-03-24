import { createTheme, responsiveFontSizes, Theme } from '@mui/material/styles'; // @mui/material/styles 5.13+
import { ThemeMode } from '../types/common.types';
import { 
  ThemeConfig, 
  ColorPalette, 
  CustomBreakpoints, 
  CustomSpacing, 
  CustomShadows 
} from '../types/theme.types';

/**
 * Default breakpoints for responsive design according to specification
 * XS: < 576px (Mobile phones)
 * SM: ≥ 576px (Large phones, small tablets)
 * MD: ≥ 768px (Tablets)
 * LG: ≥ 992px (Laptops, small desktops)
 * XL: ≥ 1200px (Large desktops)
 * XXL: ≥ 1400px (Extra large displays)
 */
export const breakpoints: CustomBreakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};

/**
 * Default spacing values for consistent layout
 */
export const spacing: CustomSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

/**
 * Default theme configuration
 */
export const defaultThemeConfig: ThemeConfig = {
  mode: ThemeMode.SYSTEM,
  direction: 'ltr',
  responsiveFontSizes: true,
  highContrast: false
};

/**
 * Returns the default theme configuration
 * @returns The default theme configuration
 */
export function getDefaultThemeConfig(): ThemeConfig {
  return {
    mode: ThemeMode.SYSTEM,
    direction: 'ltr',
    responsiveFontSizes: true,
    highContrast: false
  };
}

/**
 * Detects the system theme preference (light or dark)
 * @returns The detected system theme mode (LIGHT or DARK)
 */
export function getSystemThemeMode(): ThemeMode {
  // Check if window is defined (client-side rendering)
  if (typeof window !== 'undefined') {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return darkModeMediaQuery.matches ? ThemeMode.DARK : ThemeMode.LIGHT;
  }
  
  // Default to light mode if running on server-side
  return ThemeMode.LIGHT;
}

/**
 * Resolves the actual theme mode based on the configured mode and system preference
 * @param configuredMode The configured theme mode
 * @returns The resolved theme mode (LIGHT or DARK)
 */
export function resolveThemeMode(configuredMode: ThemeMode): ThemeMode {
  if (configuredMode === ThemeMode.SYSTEM) {
    return getSystemThemeMode();
  }
  return configuredMode;
}

/**
 * Returns the theme configuration with resolved mode
 * @param config Optional theme configuration
 * @returns Theme configuration with resolved mode
 */
export function getThemeConfig(config?: Partial<ThemeConfig>): ThemeConfig {
  // Get default theme config if no config is provided
  const defaultConfig = getDefaultThemeConfig();
  
  // Merge provided config with default config
  const mergedConfig: ThemeConfig = {
    ...defaultConfig,
    ...config
  };
  
  // Return the complete theme configuration with resolved mode
  return {
    ...mergedConfig,
    mode: resolveThemeMode(mergedConfig.mode)
  };
}

/**
 * Creates a Material UI theme based on the provided theme configuration
 * @param config Optional theme configuration
 * @returns A configured Material UI theme object
 */
export function createAppTheme(config?: Partial<ThemeConfig>): Theme {
  const themeConfig = getThemeConfig(config);
  const isDarkMode = themeConfig.mode === ThemeMode.DARK;
  const isHighContrast = themeConfig.highContrast;
  
  // Define color palettes based on the technical specifications
  const lightPalette: ColorPalette = {
    primary: {
      main: '#0F52BA', // Primary blue
      light: '#4B7DD8',
      dark: '#0A3980',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#4CAF50', // Secondary green
      light: '#7BC67F',
      dark: '#367D39',
      contrastText: '#FFFFFF'
    },
    accent: {
      main: '#FF6B35', // Accent orange
      light: '#FF9169',
      dark: '#E54E17',
      contrastText: '#FFFFFF'
    },
    success: {
      main: '#4CAF50', // Success green
      light: '#7BC67F',
      dark: '#367D39',
      contrastText: '#FFFFFF'
    },
    warning: {
      main: '#FFC107', // Warning amber
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: '#000000'
    },
    error: {
      main: '#F44336', // Error red
      light: '#F88078',
      dark: '#D32F2F',
      contrastText: '#FFFFFF'
    },
    info: {
      main: '#2196F3', // Info blue
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#FFFFFF'
    },
    grey: {
      50: '#F5F7FA', // Neutral Light
      100: '#E4E7EB', // Neutral Medium
      200: '#CBD2D9',
      300: '#9AA5B1',
      400: '#7B8794',
      500: '#616E7C', // Neutral Dark
      600: '#52606D',
      700: '#3E4C59',
      800: '#323F4B',
      900: '#1F2933',
      A100: '#F5F7FA',
      A200: '#E4E7EB',
      A400: '#616E7C',
      A700: '#3E4C59'
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1F2933',
      secondary: '#616E7C',
      disabled: '#9AA5B1'
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)'
    },
    border: {
      light: '#E4E7EB',
      main: '#CBD2D9',
      dark: '#9AA5B1'
    }
  };
  
  const darkPalette: ColorPalette = {
    primary: {
      main: '#4B7DD8', // Primary blue (lighter for dark mode)
      light: '#7DA1E8',
      dark: '#0F52BA',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#5BC760', // Secondary green (lighter for dark mode)
      light: '#8AD98C',
      dark: '#4CAF50',
      contrastText: '#000000'
    },
    accent: {
      main: '#FF8159', // Accent orange (lighter for dark mode)
      light: '#FFA68D',
      dark: '#FF6B35',
      contrastText: '#000000'
    },
    success: {
      main: '#5BC760', // Success green
      light: '#8AD98C',
      dark: '#4CAF50',
      contrastText: '#000000'
    },
    warning: {
      main: '#FFCD38', // Warning amber
      light: '#FFE57F',
      dark: '#FFC107',
      contrastText: '#000000'
    },
    error: {
      main: '#F77066', // Error red
      light: '#F9A09A',
      dark: '#F44336',
      contrastText: '#000000'
    },
    info: {
      main: '#53AFF6', // Info blue
      light: '#85CDFA',
      dark: '#2196F3',
      contrastText: '#000000'
    },
    grey: {
      50: '#1F2933',
      100: '#323F4B',
      200: '#3E4C59',
      300: '#52606D',
      400: '#616E7C',
      500: '#7B8794',
      600: '#9AA5B1',
      700: '#CBD2D9',
      800: '#E4E7EB',
      900: '#F5F7FA',
      A100: '#323F4B',
      A200: '#52606D',
      A400: '#9AA5B1',
      A700: '#E4E7EB'
    },
    background: {
      default: '#1F2933',
      paper: '#323F4B'
    },
    text: {
      primary: '#F5F7FA',
      secondary: '#CBD2D9',
      disabled: '#7B8794'
    },
    action: {
      active: 'rgba(255, 255, 255, 0.7)',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)'
    },
    border: {
      light: '#3E4C59',
      main: '#52606D',
      dark: '#616E7C'
    }
  };
  
  // High contrast palette adjustments for WCAG AA compliance
  const highContrastLightPalette: Partial<ColorPalette> = {
    primary: {
      main: '#0A3980', // Darker blue for better contrast
      light: '#0F52BA',
      dark: '#07285A',
      contrastText: '#FFFFFF'
    },
    text: {
      primary: '#000000',
      secondary: '#3E4C59',
      disabled: '#616E7C'
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F7FA'
    }
  };
  
  const highContrastDarkPalette: Partial<ColorPalette> = {
    primary: {
      main: '#7DA1E8', // Lighter blue for better contrast
      light: '#A5BFF0',
      dark: '#4B7DD8',
      contrastText: '#000000'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E4E7EB',
      disabled: '#9AA5B1'
    },
    background: {
      default: '#000000',
      paper: '#1F2933'
    }
  };
  
  // Select the appropriate color palette based on theme mode and contrast settings
  let selectedPalette = isDarkMode ? darkPalette : lightPalette;
  if (isHighContrast) {
    selectedPalette = {
      ...selectedPalette,
      ...(isDarkMode ? highContrastDarkPalette : highContrastLightPalette)
    };
  }
  
  // Define custom shadows
  const customShadows: CustomShadows = {
    card: isDarkMode 
      ? '0 4px 8px rgba(0, 0, 0, 0.5)' 
      : '0 2px 4px rgba(0, 0, 0, 0.1)',
    dropdown: isDarkMode 
      ? '0 6px 12px rgba(0, 0, 0, 0.6)' 
      : '0 4px 8px rgba(0, 0, 0, 0.15)',
    dialog: isDarkMode 
      ? '0 12px 24px rgba(0, 0, 0, 0.7)' 
      : '0 8px 16px rgba(0, 0, 0, 0.2)',
    button: isDarkMode 
      ? '0 2px 4px rgba(0, 0, 0, 0.4)' 
      : '0 1px 3px rgba(0, 0, 0, 0.12)',
    tooltip: isDarkMode 
      ? '0 2px 8px rgba(0, 0, 0, 0.8)' 
      : '0 2px 6px rgba(0, 0, 0, 0.25)'
  };
  
  // Create the base theme
  let theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: selectedPalette.primary,
      secondary: selectedPalette.secondary,
      error: selectedPalette.error,
      warning: selectedPalette.warning,
      info: selectedPalette.info,
      success: selectedPalette.success,
      grey: selectedPalette.grey,
      background: selectedPalette.background,
      text: selectedPalette.text,
      action: selectedPalette.action
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 600,
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.57
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.57
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.75,
        textTransform: 'none'
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.66
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        lineHeight: 2.5,
        textTransform: 'uppercase'
      }
    },
    breakpoints: {
      values: {
        xs: breakpoints.xs,
        sm: breakpoints.sm,
        md: breakpoints.md,
        lg: breakpoints.lg,
        xl: breakpoints.xl,
        xxl: breakpoints.xxl
      }
    },
    spacing: (factor: number) => `${factor * 4}px`,
    shape: {
      borderRadius: 4
    },
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195
      }
    },
    zIndex: {
      mobileStepper: 1000,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500
    },
    shadows: [
      'none',
      customShadows.button,
      customShadows.card,
      '0 3px 6px rgba(0,0,0,0.16)',
      '0 4px 8px rgba(0,0,0,0.18)',
      '0 5px 10px rgba(0,0,0,0.2)',
      '0 6px 12px rgba(0,0,0,0.22)',
      '0 7px 14px rgba(0,0,0,0.24)',
      customShadows.dropdown,
      '0 9px 18px rgba(0,0,0,0.28)',
      '0 10px 20px rgba(0,0,0,0.3)',
      '0 11px 22px rgba(0,0,0,0.32)',
      '0 12px 24px rgba(0,0,0,0.34)',
      '0 13px 26px rgba(0,0,0,0.36)',
      '0 14px 28px rgba(0,0,0,0.38)',
      customShadows.dialog,
      '0 16px 32px rgba(0,0,0,0.42)',
      '0 17px 34px rgba(0,0,0,0.44)',
      '0 18px 36px rgba(0,0,0,0.46)',
      '0 19px 38px rgba(0,0,0,0.48)',
      '0 20px 40px rgba(0,0,0,0.5)',
      '0 21px 42px rgba(0,0,0,0.52)',
      '0 22px 44px rgba(0,0,0,0.54)',
      '0 23px 46px rgba(0,0,0,0.56)',
      '0 24px 48px rgba(0,0,0,0.58)',
    ]
  });
  
  // Apply responsive font sizes if enabled in the config
  if (themeConfig.responsiveFontSizes) {
    theme = responsiveFontSizes(theme);
  }
  
  return theme;
}