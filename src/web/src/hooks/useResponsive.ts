import { useMediaQuery } from '@mui/material'; // v5.13.0
import { useTheme, Theme } from '@mui/material/styles'; // v5.13.0
import { BREAKPOINTS } from '../constants/ui.constants';

// Define breakpoint keys
const BREAKPOINT_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
type BreakpointKey = typeof BREAKPOINT_KEYS[number];

// Define types for responsive value mapping
type ResponsiveValue<T> = Partial<Record<BreakpointKey, T>> & { default: T };

/**
 * A custom hook that provides responsive design utilities
 * for the HCBS Revenue Management System
 * 
 * This hook abstracts Material UI's useMediaQuery functionality and provides
 * a simple interface to check current viewport size, detect device types,
 * and apply responsive values based on screen size.
 * 
 * @returns An object containing responsive utility functions and current breakpoint information
 */
export function useResponsive() {
  const theme = useTheme();
  
  // Create media query matchers for each breakpoint
  const isXs = useMediaQuery(`(max-width: ${parseInt(BREAKPOINTS.sm, 10) - 0.01}px)`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${parseInt(BREAKPOINTS.md, 10) - 0.01}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${parseInt(BREAKPOINTS.lg, 10) - 0.01}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${parseInt(BREAKPOINTS.xl, 10) - 0.01}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${parseInt(BREAKPOINTS.xxl, 10) - 0.01}px)`);
  const isXxl = useMediaQuery(`(min-width: ${BREAKPOINTS.xxl}px)`);
  
  // Determine the current active breakpoint
  let breakpoint: BreakpointKey = 'xs';
  if (isXxl) breakpoint = 'xxl';
  else if (isXl) breakpoint = 'xl';
  else if (isLg) breakpoint = 'lg';
  else if (isMd) breakpoint = 'md';
  else if (isSm) breakpoint = 'sm';
  
  // Device type utilities
  const isMobile = isXs || isSm; // Mobile phones and small tablets
  const isTablet = isMd; // Tablets
  const isDesktop = isLg || isXl || isXxl; // Laptops and desktops
  
  /**
   * Checks if the current viewport is at or above a given breakpoint
   * @param key - The breakpoint to check against
   * @returns true if viewport width is at or above the specified breakpoint
   */
  const up = (key: BreakpointKey): boolean => {
    const breakpointIndex = BREAKPOINT_KEYS.indexOf(key);
    const currentIndex = BREAKPOINT_KEYS.indexOf(breakpoint);
    return currentIndex >= breakpointIndex;
  };
  
  /**
   * Checks if the current viewport is at or below a given breakpoint
   * @param key - The breakpoint to check against
   * @returns true if viewport width is at or below the specified breakpoint
   */
  const down = (key: BreakpointKey): boolean => {
    const breakpointIndex = BREAKPOINT_KEYS.indexOf(key);
    const currentIndex = BREAKPOINT_KEYS.indexOf(breakpoint);
    return currentIndex <= breakpointIndex;
  };
  
  /**
   * Checks if the current viewport is between two breakpoints (inclusive of start, exclusive of end)
   * @param start - The lower breakpoint (inclusive)
   * @param end - The upper breakpoint (exclusive)
   * @returns true if viewport width is between the specified breakpoints
   */
  const between = (start: BreakpointKey, end: BreakpointKey): boolean => {
    const startIndex = BREAKPOINT_KEYS.indexOf(start);
    const endIndex = BREAKPOINT_KEYS.indexOf(end);
    const currentIndex = BREAKPOINT_KEYS.indexOf(breakpoint);
    return currentIndex >= startIndex && currentIndex < endIndex;
  };
  
  /**
   * Returns a value based on the current breakpoint
   * @param values - An object mapping breakpoints to values with a default fallback
   * @returns The value for the current breakpoint or the closest lower breakpoint with a defined value
   * @example
   * const padding = getResponsiveValue({ xs: 8, md: 16, lg: 24, default: 8 });
   */
  const getResponsiveValue = <T>(values: ResponsiveValue<T>): T => {
    // Try to get the value for the current breakpoint
    const value = values[breakpoint];
    if (value !== undefined) {
      return value;
    }
    
    // If not found, try to find the closest lower breakpoint with a defined value
    const index = BREAKPOINT_KEYS.indexOf(breakpoint);
    for (let i = index - 1; i >= 0; i--) {
      const lowerBreakpoint = BREAKPOINT_KEYS[i];
      const lowerValue = values[lowerBreakpoint];
      if (lowerValue !== undefined) {
        return lowerValue;
      }
    }
    
    // Fallback to default if no matching breakpoint found
    return values.default;
  };
  
  return {
    // Current breakpoint information
    breakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    
    // Device type utilities
    isMobile,
    isTablet,
    isDesktop,
    
    // Breakpoint comparison utilities
    up,
    down,
    between,
    
    // Responsive value utility
    getResponsiveValue,
  };
}