/**
 * Theme type definitions for the HCBS Revenue Management System
 * This file defines the TypeScript interfaces and types used for theming,
 * including color palettes, typography, spacing, and other design elements.
 */

import { Theme, PaletteOptions, BreakpointOverrides as MuiBreakpointOverrides } from '@mui/material/styles'; // @mui/material/styles 5.13+
import { ThemeMode } from '../types/common.types';

/**
 * Theme configuration options
 */
export interface ThemeConfig {
  /** Theme mode (light, dark, or system) */
  mode: ThemeMode;
  /** Text direction */
  direction: 'ltr' | 'rtl';
  /** Whether to enable responsive font sizes */
  responsiveFontSizes: boolean;
  /** Whether to enable high contrast mode for accessibility */
  highContrast: boolean;
}

/**
 * Color palette definitions
 */
export interface ColorPalette {
  /** Primary colors used for main UI elements */
  primary: Record<string, string>;
  /** Secondary colors for supporting UI elements */
  secondary: Record<string, string>;
  /** Accent colors for highlights and emphasis */
  accent: Record<string, string>;
  /** Success colors for positive states */
  success: Record<string, string>;
  /** Warning colors for caution states */
  warning: Record<string, string>;
  /** Error colors for negative states */
  error: Record<string, string>;
  /** Information colors for neutral states */
  info: Record<string, string>;
  /** Grey scale for neutral UI elements */
  grey: Record<string, string>;
  /** Background colors for different surfaces */
  background: Record<string, string>;
  /** Text colors for different contexts */
  text: Record<string, string>;
  /** Colors for interactive elements */
  action: Record<string, string>;
  /** Border colors */
  border: Record<string, string>;
}

/**
 * Custom breakpoints for responsive design
 * Follows the specification in Technical Specifications/7.4 RESPONSIVE DESIGN APPROACH
 */
export interface CustomBreakpoints {
  /** Mobile phones (<576px) */
  xs: number;
  /** Large phones, small tablets (≥576px) */
  sm: number;
  /** Tablets (≥768px) */
  md: number;
  /** Laptops, small desktops (≥992px) */
  lg: number;
  /** Large desktops (≥1200px) */
  xl: number;
  /** Extra large displays (≥1400px) */
  xxl: number;
}

/**
 * Custom spacing values used throughout the application
 */
export interface CustomSpacing {
  /** Extra small spacing */
  xs: number;
  /** Small spacing */
  sm: number;
  /** Medium spacing */
  md: number;
  /** Large spacing */
  lg: number;
  /** Extra large spacing */
  xl: number;
}

/**
 * Custom shadow definitions for elevation
 */
export interface CustomShadows {
  /** Shadow for card components */
  card: string;
  /** Shadow for dropdown menus */
  dropdown: string;
  /** Shadow for dialog/modal components */
  dialog: string;
  /** Shadow for buttons */
  button: string;
  /** Shadow for tooltips */
  tooltip: string;
}

/**
 * Custom typography definitions based on Technical Specifications/7.1.1 Typography
 */
export interface CustomTypography {
  /** Primary font family (Inter) */
  fontFamily: string;
  /** Base font size */
  fontSize: number;
  /** Light font weight (300) */
  fontWeightLight: number;
  /** Regular font weight (400) */
  fontWeightRegular: number;
  /** Medium font weight (500) */
  fontWeightMedium: number;
  /** Bold font weight (600) */
  fontWeightBold: number;
  /** Page title styles (24px, 600) */
  pageTitle: Record<string, string | number>;
  /** Section header styles (18px, 600) */
  sectionHeader: Record<string, string | number>;
  /** Table header styles (14px, 600) */
  tableHeader: Record<string, string | number>;
  /** Label styles (12px, 400) */
  label: Record<string, string | number>;
  /** Button text styles (14px, 500) */
  buttonText: Record<string, string | number>;
}

/**
 * Extended Material UI Theme with custom properties
 */
export interface CustomTheme extends Theme {
  /** Custom shadows */
  customShadows: CustomShadows;
  /** Custom spacing */
  customSpacing: CustomSpacing;
}

/**
 * Theme context value interface
 */
export interface ThemeContextType {
  /** Current theme mode */
  themeMode: ThemeMode;
  /** Function to toggle between light and dark mode */
  toggleThemeMode: () => void;
  /** Function to set a specific theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** Whether high contrast mode is enabled */
  highContrast: boolean;
  /** Function to toggle high contrast mode */
  toggleHighContrast: () => void;
}

/**
 * Theme provider component props
 */
export interface ThemeProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Initial theme mode */
  initialThemeMode?: ThemeMode;
  /** Initial high contrast setting */
  initialHighContrast?: boolean;
}

/**
 * Breakpoint overrides to extend Material UI breakpoints with custom xxl breakpoint
 */
export interface BreakpointOverrides extends MuiBreakpointOverrides {
  xs: true;
  sm: true;
  md: true;
  lg: true;
  xl: true;
  xxl: true;
}