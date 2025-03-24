import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { SxProps, Theme } from '@mui/material';
import Tabs from '../ui/Tabs';
import useQueryParams from '../../hooks/useQueryParams';
import useResponsive from '../../hooks/useResponsive';

/**
 * Default query parameter name for tab state
 */
const DEFAULT_QUERY_PARAM = 'tab';

/**
 * Props for the TabNavigation component
 */
interface TabNavigationProps {
  /**
   * Array of tab definitions with label, value, optional disabled flag, and optional path
   */
  tabs: { label: string; value: string; disabled?: boolean; path?: string }[];
  /**
   * The currently active tab value
   */
  activeTab?: string;
  /**
   * Callback function called when a tab is selected
   */
  onChange?: (value: string) => void;
  /**
   * URL query parameter name to sync tab state with URL
   */
  queryParam?: string;
  /**
   * Orientation of the tabs, defaults to horizontal
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Custom styling using Material UI's sx prop
   */
  sx?: SxProps<Theme>;
}

/**
 * A navigation component that provides a tab-based interface with URL integration
 * 
 * This component extends Material UI's Tabs with additional functionality:
 * - Synchronizes tab state with URL query parameters for shareable links
 * - Adapts to different screen sizes, automatically switching to horizontal
 *   orientation on mobile devices
 * - Integrates with Next.js routing
 * - Provides accessibility support for keyboard navigation and screen readers
 * 
 * @param {TabNavigationProps} props - The component props
 * @returns {JSX.Element} The rendered TabNavigation component
 */
const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onChange = () => {}, // Default empty function to avoid null reference errors
  queryParam,
  orientation = 'horizontal',
  sx
}) => {
  const router = useRouter();
  const { getQueryParam, setQueryParam } = useQueryParams();
  const { isMobile } = useResponsive();

  // Determine effective orientation based on screen size and prop
  const effectiveOrientation = useMemo(() => {
    // Force horizontal orientation for mobile layout
    if (isMobile) {
      return 'horizontal';
    }
    return orientation;
  }, [orientation, isMobile]);

  // Determine the current active tab
  const paramName = queryParam || DEFAULT_QUERY_PARAM;
  const currentTabFromQuery = getQueryParam(paramName, '');
  const currentTab = activeTab || currentTabFromQuery || (tabs.length > 0 ? tabs[0].value : '');

  // Handle tab change
  const handleTabChange = (value: string) => {
    // Update URL query parameter if specified
    if (queryParam) {
      setQueryParam(queryParam, value, { replace: true });
    }

    // Call onChange prop
    onChange(value);
  };

  // Sync active tab with URL on initial load if queryParam is provided
  useEffect(() => {
    if (queryParam && activeTab && activeTab !== currentTabFromQuery) {
      setQueryParam(queryParam, activeTab, { replace: true });
    }
  }, [queryParam, activeTab, currentTabFromQuery, setQueryParam]);

  return (
    <Tabs
      tabs={tabs}
      activeTab={currentTab}
      onChange={handleTabChange}
      orientation={effectiveOrientation}
      sx={sx}
    />
  );
};

export default TabNavigation;