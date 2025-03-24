/**
 * Utility functions for responsive design in the HCBS Revenue Management System.
 * Provides helper functions to detect breakpoints, check device types, and apply
 * responsive values based on screen size.
 *
 * @version 1.0.0
 */

import { useMediaQuery } from '@mui/material'; // @mui/material v5.13+
import { useTheme, Theme } from '@mui/material/styles'; // @mui/material/styles v5.13+
import { BREAKPOINTS } from '../constants/ui.constants';

// Convert string breakpoints to numbers for comparison
const XS = 0;
const SM = parseInt(BREAKPOINTS.sm, 10);
const MD = parseInt(BREAKPOINTS.md, 10);
const LG = parseInt(BREAKPOINTS.lg, 10);
const XL = parseInt(BREAKPOINTS.xl, 10);
const XXL = parseInt(BREAKPOINTS.xxl, 10);

/**
 * Checks if the current viewport width matches the XS breakpoint
 * @returns True if the viewport width is within the XS breakpoint range
 */
export function isXs(): boolean {
  return useMediaQuery(`(min-width: ${XS}px) and (max-width: ${SM - 1}px)`);
}

/**
 * Checks if the current viewport width matches the SM breakpoint
 * @returns True if the viewport width is within the SM breakpoint range
 */
export function isSm(): boolean {
  return useMediaQuery(`(min-width: ${SM}px) and (max-width: ${MD - 1}px)`);
}

/**
 * Checks if the current viewport width matches the MD breakpoint
 * @returns True if the viewport width is within the MD breakpoint range
 */
export function isMd(): boolean {
  return useMediaQuery(`(min-width: ${MD}px) and (max-width: ${LG - 1}px)`);
}

/**
 * Checks if the current viewport width matches the LG breakpoint
 * @returns True if the viewport width is within the LG breakpoint range
 */
export function isLg(): boolean {
  return useMediaQuery(`(min-width: ${LG}px) and (max-width: ${XL - 1}px)`);
}

/**
 * Checks if the current viewport width matches the XL breakpoint
 * @returns True if the viewport width is within the XL breakpoint range
 */
export function isXl(): boolean {
  return useMediaQuery(`(min-width: ${XL}px) and (max-width: ${XXL - 1}px)`);
}

/**
 * Checks if the current viewport width matches the XXL breakpoint
 * @returns True if the viewport width is within the XXL breakpoint range
 */
export function isXxl(): boolean {
  return useMediaQuery(`(min-width: ${XXL}px)`);
}

/**
 * Checks if the current viewport width is in the mobile range (XS to SM)
 * @returns True if the viewport width is in the mobile range
 */
export function isMobile(): boolean {
  return useMediaQuery(`(max-width: ${MD - 1}px)`);
}

/**
 * Checks if the current viewport width is in the tablet range (MD to LG)
 * @returns True if the viewport width is in the tablet range
 */
export function isTablet(): boolean {
  return useMediaQuery(`(min-width: ${MD}px) and (max-width: ${LG - 1}px)`);
}

/**
 * Checks if the current viewport width is in the desktop range (LG and above)
 * @returns True if the viewport width is in the desktop range
 */
export function isDesktop(): boolean {
  return useMediaQuery(`(min-width: ${LG}px)`);
}

/**
 * Checks if the current viewport width is at or above the specified breakpoint
 * @param breakpoint The breakpoint to check against ('xs', 'sm', 'md', 'lg', 'xl', 'xxl')
 * @returns True if the viewport width is at or above the specified breakpoint
 */
export function up(breakpoint: string): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up(breakpoint));
}

/**
 * Checks if the current viewport width is at or below the specified breakpoint
 * @param breakpoint The breakpoint to check against ('xs', 'sm', 'md', 'lg', 'xl', 'xxl')
 * @returns True if the viewport width is at or below the specified breakpoint
 */
export function down(breakpoint: string): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(breakpoint));
}

/**
 * Checks if the current viewport width is between the specified breakpoints
 * @param start The lower breakpoint ('xs', 'sm', 'md', 'lg', 'xl')
 * @param end The upper breakpoint ('sm', 'md', 'lg', 'xl', 'xxl')
 * @returns True if the viewport width is between the specified breakpoints
 */
export function between(start: string, end: string): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between(start, end));
}

/**
 * Returns a value based on the current breakpoint
 * @param values Object containing values for different breakpoints (xs, sm, md, lg, xl, xxl)
 * @returns The value corresponding to the current breakpoint, falling back to smaller breakpoints if not defined
 */
export function getResponsiveValue<T>(values: Record<string, T>): T {
  if (isXxl() && values.xxl !== undefined) return values.xxl;
  if (isXl() && values.xl !== undefined) return values.xl;
  if (isLg() && values.lg !== undefined) return values.lg;
  if (isMd() && values.md !== undefined) return values.md;
  if (isSm() && values.sm !== undefined) return values.sm;
  return values.xs;
}

/**
 * Hook that returns the current active breakpoint name
 * @returns The name of the current active breakpoint ('xs', 'sm', 'md', 'lg', 'xl', 'xxl')
 */
export function useBreakpoint(): string {
  if (isXxl()) return 'xxl';
  if (isXl()) return 'xl';
  if (isLg()) return 'lg';
  if (isMd()) return 'md';
  if (isSm()) return 'sm';
  return 'xs';
}