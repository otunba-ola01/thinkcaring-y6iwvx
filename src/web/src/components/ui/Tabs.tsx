import React from 'react';
import { Tabs as MuiTabs, Tab as MuiTab, Box } from '@mui/material'; // v5.13.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { TabsProps } from '../../types/ui.types';

/**
 * A customizable tabs component for organizing content into separate views
 * throughout the HCBS Revenue Management System.
 * 
 * @param {TabsProps} props - The component props
 * @returns {JSX.Element} The rendered Tabs component
 */
const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onChange, 
  orientation = 'horizontal', 
  sx 
}) => {
  /**
   * Handles tab change events
   * 
   * @param {React.SyntheticEvent} event - The event object
   * @param {string} newValue - The new tab value
   */
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onChange(newValue);
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        borderBottom: orientation === 'horizontal' ? 1 : 0,
        borderRight: orientation === 'vertical' ? 1 : 0,
        borderColor: 'divider',
        ...sx 
      }}
    >
      <MuiTabs
        value={activeTab}
        onChange={handleChange}
        orientation={orientation}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="navigation tabs"
        sx={{
          '.MuiTab-root': {
            minHeight: '48px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
          },
          '.Mui-selected': {
            fontWeight: 600,
          },
        }}
      >
        {tabs.map((tab) => (
          <MuiTab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            disabled={tab.disabled}
            aria-selected={activeTab === tab.value}
            id={`tab-${tab.value}`}
            aria-controls={`tabpanel-${tab.value}`}
          />
        ))}
      </MuiTabs>
    </Box>
  );
};

export default Tabs;