import { createTheme, Theme, PaletteOptions, alpha, darken, lighten } from '@mui/material/styles'; // @mui/material/styles 5.13+
import { ThemeMode } from '../types/common.types';
import { 
  ThemeConfig, 
  ColorPalette, 
  CustomBreakpoints, 
  CustomSpacing, 
  CustomShadows, 
  CustomTheme 
} from '../types/theme.types';
import { breakpoints, spacing } from '../config/theme.config';

/**
 * Creates a color palette based on theme mode and contrast settings
 * @param isDarkMode Whether dark mode is active
 * @param isHighContrast Whether high contrast mode is active
 * @returns Complete color palette object
 */
export const createColorPalette = (isDarkMode: boolean, isHighContrast: boolean): ColorPalette => {
  // Base palette selection based on theme mode
  const basePalette = isDarkMode ? darkPalette : lightPalette;
  
  // Apply high contrast adjustments if needed
  if (isHighContrast) {
    const contrastPalette = isDarkMode ? highContrastDarkPalette : highContrastLightPalette;
    
    return {
      ...basePalette,
      primary: {
        ...basePalette.primary,
        ...contrastPalette.primary
      },
      secondary: {
        ...basePalette.secondary,
        ...contrastPalette.secondary
      },
      background: {
        ...basePalette.background,
        ...contrastPalette.background
      },
      text: {
        ...basePalette.text,
        ...contrastPalette.text
      },
      action: {
        ...basePalette.action,
        ...contrastPalette.action
      }
    };
  }
  
  return basePalette;
};

/**
 * Light mode color palette as specified in Technical Specifications/7.1.2
 */
export const lightPalette: ColorPalette = {
  primary: {
    main: '#0F52BA', // Primary blue
    light: '#4D7CC3',
    dark: '#0A3B85',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#4CAF50', // Secondary green
    light: '#7BC67E',
    dark: '#357A38',
    contrastText: '#FFFFFF'
  },
  accent: {
    main: '#FF6B35', // Accent orange
    light: '#FF8F69',
    dark: '#B24A25',
    contrastText: '#FFFFFF'
  },
  success: {
    main: '#4CAF50', // Success green
    light: '#7BC67E',
    dark: '#357A38',
    contrastText: '#FFFFFF'
  },
  warning: {
    main: '#FFC107', // Warning amber
    light: '#FFD54F',
    dark: '#B28704',
    contrastText: '#000000'
  },
  error: {
    main: '#F44336', // Error red
    light: '#F88078',
    dark: '#AA2E25',
    contrastText: '#FFFFFF'
  },
  info: {
    main: '#2196F3', // Info blue
    light: '#64B5F6',
    dark: '#1769AA',
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

/**
 * Dark mode color palette with adjusted colors for better visibility in dark environments
 */
export const darkPalette: ColorPalette = {
  primary: {
    main: '#4D7CC3', // Lighter blue for dark mode
    light: '#7B9CD4',
    dark: '#0F52BA',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#7BC67E', // Lighter green for dark mode
    light: '#A5D7A7',
    dark: '#4CAF50',
    contrastText: '#000000'
  },
  accent: {
    main: '#FF8F69', // Lighter orange for dark mode
    light: '#FFAB90',
    dark: '#FF6B35',
    contrastText: '#000000'
  },
  success: {
    main: '#7BC67E', // Lighter green for dark mode
    light: '#A5D7A7',
    dark: '#4CAF50',
    contrastText: '#000000'
  },
  warning: {
    main: '#FFD54F', // Lighter amber for dark mode
    light: '#FFE082',
    dark: '#FFC107',
    contrastText: '#000000'
  },
  error: {
    main: '#F88078', // Lighter red for dark mode
    light: '#FFAB9D',
    dark: '#F44336',
    contrastText: '#000000'
  },
  info: {
    main: '#64B5F6', // Lighter blue for dark mode
    light: '#90CAF9',
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

/**
 * High contrast light mode palette for accessibility
 * Provides enhanced contrast in light theme for users with visual impairments
 */
export const highContrastLightPalette: Partial<ColorPalette> = {
  primary: {
    main: '#0A3B85', // Darker blue for better contrast against light backgrounds
    light: '#0F52BA',
    dark: '#072A5F',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#357A38', // Darker green for better contrast
    light: '#4CAF50',
    dark: '#255626',
    contrastText: '#FFFFFF'
  },
  accent: {
    main: '#B24A25', // Darker orange for better contrast
    light: '#FF6B35',
    dark: '#8A391C',
    contrastText: '#FFFFFF'
  },
  text: {
    primary: '#000000', // Black text for maximum contrast
    secondary: '#3E4C59', // Darker secondary text
    disabled: '#52606D' // Darker disabled text
  },
  background: {
    default: '#FFFFFF', // Pure white background
    paper: '#F5F7FA' // Light paper background
  },
  action: {
    active: 'rgba(0, 0, 0, 0.8)', // Higher opacity for active actions
    hover: 'rgba(0, 0, 0, 0.1)', // Higher opacity for hover state
    selected: 'rgba(0, 0, 0, 0.14)', // Higher opacity for selected state
    disabled: 'rgba(0, 0, 0, 0.4)', // Higher opacity for disabled state
    disabledBackground: 'rgba(0, 0, 0, 0.16)' // Higher opacity for disabled background
  }
};

/**
 * High contrast dark mode palette for accessibility
 * Provides enhanced contrast in dark theme for users with visual impairments
 */
export const highContrastDarkPalette: Partial<ColorPalette> = {
  primary: {
    main: '#7B9CD4', // Even lighter blue for better contrast against dark backgrounds
    light: '#A6BDE3',
    dark: '#4D7CC3',
    contrastText: '#000000'
  },
  secondary: {
    main: '#A5D7A7', // Even lighter green for better contrast
    light: '#C8E6C9',
    dark: '#7BC67E',
    contrastText: '#000000'
  },
  accent: {
    main: '#FFAB90', // Even lighter orange for better contrast
    light: '#FFC8B7',
    dark: '#FF8F69',
    contrastText: '#000000'
  },
  text: {
    primary: '#FFFFFF', // Pure white text for maximum contrast
    secondary: '#E4E7EB', // Lighter secondary text
    disabled: '#9AA5B1' // Lighter disabled text
  },
  background: {
    default: '#000000', // Pure black background
    paper: '#1F2933' // Darker paper background
  },
  action: {
    active: 'rgba(255, 255, 255, 0.85)', // Higher opacity for active actions
    hover: 'rgba(255, 255, 255, 0.12)', // Higher opacity for hover state
    selected: 'rgba(255, 255, 255, 0.24)', // Higher opacity for selected state
    disabled: 'rgba(255, 255, 255, 0.4)', // Higher opacity for disabled state
    disabledBackground: 'rgba(255, 255, 255, 0.16)' // Higher opacity for disabled background
  }
};

/**
 * Creates typography settings for the theme
 * @returns Typography configuration object
 */
const createTypography = () => {
  // Based on Technical Specifications/7.1.1 Typography
  return {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '2.5rem', // 40px
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem', // 32px
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem', // 28px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    // Custom typography variants based on specifications
    pageTitle: {
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    sectionHeader: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.4,
    },
    tableHeader: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
      lineHeight: 1.5,
    },
  };
};

/**
 * Creates shadow definitions for the theme
 * @param isDarkMode Whether dark mode is active
 * @returns Shadow configuration object
 */
const createShadows = (isDarkMode: boolean): CustomShadows => {
  // Shadow opacity is slightly higher in dark mode for better visibility
  const opacity = isDarkMode ? 0.5 : 0.1;
  const mediumOpacity = isDarkMode ? 0.6 : 0.15;
  const highOpacity = isDarkMode ? 0.7 : 0.2;

  return {
    card: `0px 2px 4px rgba(0, 0, 0, ${opacity})`,
    dropdown: `0px 4px 8px rgba(0, 0, 0, ${mediumOpacity})`,
    dialog: `0px 8px 16px rgba(0, 0, 0, ${highOpacity})`,
    button: `0px 1px 2px rgba(0, 0, 0, ${opacity / 2})`,
    tooltip: `0px 2px 4px rgba(0, 0, 0, ${mediumOpacity})`
  };
};

/**
 * Creates component overrides for the theme
 * @param palette Color palette to use
 * @param isDarkMode Whether dark mode is active
 * @returns Component overrides configuration
 */
const createThemeComponents = (palette: ColorPalette, isDarkMode: boolean) => {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          boxShadow: 'none',
          fontWeight: 500,
          padding: '6px 16px',
          '&:hover': {
            boxShadow: `0px 1px 2px ${alpha(palette.primary.main, 0.2)}`,
          },
        },
        contained: {
          boxShadow: `0px 1px 2px ${alpha('#000000', isDarkMode ? 0.4 : 0.2)}`,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: palette.primary.dark,
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: palette.secondary.dark,
          },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha(palette.primary.main, 0.04),
          },
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '8px 22px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: palette.border.main,
            },
            '&:hover fieldset': {
              borderColor: palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.primary.main,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: createShadows(isDarkMode).card,
          overflow: 'hidden',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode 
            ? alpha(palette.background.paper, 0.5) 
            : alpha(palette.primary.main, 0.05),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.875rem',
          color: palette.text.primary,
        },
        root: {
          borderBottom: `1px solid ${palette.border.light}`,
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: isDarkMode 
              ? alpha(palette.action.hover, 2) 
              : palette.action.hover,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minWidth: 100,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          alignItems: 'center',
        },
        standardSuccess: {
          backgroundColor: alpha(palette.success.main, 0.1),
          color: palette.success.dark,
        },
        standardWarning: {
          backgroundColor: alpha(palette.warning.main, 0.1),
          color: palette.warning.dark,
        },
        standardError: {
          backgroundColor: alpha(palette.error.main, 0.1),
          color: palette.error.dark,
        },
        standardInfo: {
          backgroundColor: alpha(palette.info.main, 0.1),
          color: palette.info.dark,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: createShadows(isDarkMode).dialog,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: palette.border.light,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: createShadows(isDarkMode).card,
        },
        elevation8: {
          boxShadow: createShadows(isDarkMode).dropdown,
        },
        elevation24: {
          boxShadow: createShadows(isDarkMode).dialog,
        },
      },
    },
  };
};

/**
 * Creates a complete Material UI theme based on configuration
 * @param config Theme configuration options
 * @returns Complete Material UI theme object
 */
export const createAppTheme = (config: ThemeConfig): Theme => {
  // Determine if dark mode is active
  const isDarkMode = config.mode === ThemeMode.DARK;
  
  // Determine if high contrast mode is active
  const isHighContrast = config.highContrast;
  
  // Create color palette
  const palette = createColorPalette(isDarkMode, isHighContrast);
  
  // Create typography settings
  const typography = createTypography();
  
  // Create shadow definitions
  const customShadows = createShadows(isDarkMode);
  
  // Create component overrides
  const components = createThemeComponents(palette, isDarkMode);
  
  // Create Material UI theme with all our settings
  const baseTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: palette.primary,
      secondary: palette.secondary,
      error: palette.error,
      warning: palette.warning,
      info: palette.info,
      success: palette.success,
      background: palette.background,
      text: palette.text,
      action: palette.action,
      grey: palette.grey,
    } as PaletteOptions,
    typography,
    breakpoints: {
      values: breakpoints,
    },
    shape: {
      borderRadius: 4,
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
    ],
    components,
  });
  
  // Add custom properties to the theme
  return {
    ...baseTheme,
    customShadows,
    customSpacing: spacing,
  } as CustomTheme;
};