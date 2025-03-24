/**
 * UI Constants for the HCBS Revenue Management System
 * This file defines all UI-related constants to ensure consistency across the application
 * Version: 1.0.0
 */

/**
 * Screen size breakpoints for responsive design (in pixels)
 * Values align with Technical Specifications section 7.4.1
 */
export const BREAKPOINTS = {
  xs: '0',    // Mobile phones (portrait)
  sm: '576',  // Mobile phones (landscape), small tablets
  md: '768',  // Tablets
  lg: '992',  // Laptops, small desktops
  xl: '1200', // Large desktops
  xxl: '1400' // Extra large displays
};

/**
 * Spacing values for consistent layout spacing (in pixels)
 */
export const SPACING = {
  xs: '4',   // Extra small spacing
  sm: '8',   // Small spacing
  md: '16',  // Medium spacing
  lg: '24',  // Large spacing
  xl: '32',  // Extra large spacing
  xxl: '48'  // Extra extra large spacing
};

/**
 * Animation durations for UI transitions (in milliseconds)
 * Ensures animations are consistent and performant across the application
 */
export const ANIMATION_DURATION = {
  shortest: '150',      // Minimal animations
  shorter: '200',       // Quick animations
  short: '250',         // Brief animations
  standard: '300',      // Standard animations
  complex: '375',       // Complex animations
  enteringScreen: '225', // Entering screen transitions
  leavingScreen: '195'   // Leaving screen transitions
};

/**
 * Z-index values for layering UI elements
 * Provides a consistent stacking order for components
 */
export const Z_INDEX = {
  mobileStepper: '1000', // Mobile stepper component
  speedDial: '1050',     // Speed dial component
  appBar: '1100',        // Application bar
  drawer: '1200',        // Drawer/sidebar
  modal: '1300',         // Modal dialogs
  snackbar: '1400',      // Snackbar notifications
  tooltip: '1500',       // Tooltips
  dropdown: '1600'       // Dropdown menus
};

/**
 * Shadow values for elevation effects
 * Creates consistent depth perception across the application
 */
export const SHADOWS = {
  card: '0 2px 8px rgba(0, 0, 0, 0.1)',       // Card elements
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.15)', // Dropdown menus
  dialog: '0 8px 24px rgba(0, 0, 0, 0.2)',    // Dialog windows
  button: '0 2px 4px rgba(0, 0, 0, 0.1)',     // Button elements
  tooltip: '0 2px 8px rgba(0, 0, 0, 0.2)'     // Tooltip elements
};

/**
 * Border radius values for UI elements
 * Ensures consistent corner rounding
 */
export const BORDER_RADIUS = {
  small: '2px',    // Subtle rounding
  medium: '4px',   // Standard rounding
  large: '8px',    // Prominent rounding
  round: '50%'     // Circular elements
};

/**
 * Row height values for different table densities (in pixels)
 * Supports different data density needs
 */
export const TABLE_DENSITY = {
  compact: '36',      // Dense data presentation
  standard: '48',     // Default row height
  comfortable: '60'   // Spacious data presentation
};

/**
 * Size values for form controls
 * Maintains consistent sizing across form elements
 */
export const FORM_CONTROL_SIZE = {
  small: {
    height: '32px',
    fontSize: '0.75rem'
  },
  medium: {
    height: '40px',
    fontSize: '0.875rem'
  },
  large: {
    height: '48px',
    fontSize: '1rem'
  }
};

/**
 * Maps status values to their corresponding colors
 * Used for visual representation of status across the application
 */
export const STATUS_COLORS = {
  claim: {
    DRAFT: '#9AA5B1',         // Gray
    VALIDATED: '#2196F3',     // Blue
    SUBMITTED: '#FF9800',     // Orange
    ACKNOWLEDGED: '#FF9800',  // Orange
    PENDING: '#FF9800',       // Orange
    PAID: '#4CAF50',          // Green
    DENIED: '#F44336',        // Red
    APPEALED: '#9C27B0',      // Purple
    PARTIAL_PAID: '#FFC107',  // Amber
    VOIDED: '#616E7C'         // Dark Gray
  },
  documentation: {
    DOCUMENTED: '#4CAF50',    // Green
    INCOMPLETE: '#F44336',    // Red
    VALIDATED: '#2196F3'      // Blue
  },
  billing: {
    BILLABLE: '#2196F3',      // Blue
    BILLED: '#4CAF50',        // Green
    UNBILLED: '#FF9800'       // Orange
  },
  reconciliation: {
    RECEIVED: '#FF9800',      // Orange
    MATCHED: '#2196F3',       // Blue
    RECONCILED: '#4CAF50',    // Green
    POSTED: '#4CAF50',        // Green
    EXCEPTION: '#F44336'      // Red
  }
};

/**
 * Defines preset date ranges for date pickers
 * Provides common date range options for filtering
 */
export const DATE_RANGE_PRESETS = [
  {
    label: 'Today',
    value: 'today',
    range: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    range: {
      startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0]
    }
  },
  {
    label: 'Last 7 Days',
    value: 'last7Days',
    range: {
      startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Last 30 Days',
    value: 'last30Days',
    range: {
      startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'This Month',
    value: 'thisMonth',
    range: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Last Month',
    value: 'lastMonth',
    range: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    }
  },
  {
    label: 'This Quarter',
    value: 'thisQuarter',
    range: {
      startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Year to Date',
    value: 'yearToDate',
    range: {
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  }
];

/**
 * Page size options for pagination components
 */
export const PAGINATION_OPTIONS = [10, 25, 50, 100];

/**
 * Default page size for tables and lists
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Debounce delay times for different actions (in milliseconds)
 * Improves performance by limiting the frequency of operations
 */
export const DEBOUNCE_DELAY = {
  search: '300', // Search input debounce
  filter: '500', // Filter changes debounce
  resize: '200'  // Window resize debounce
};

/**
 * Duration values for toast notifications (in milliseconds)
 */
export const TOAST_DURATION = {
  short: '3000',   // Brief notifications
  medium: '5000',  // Standard notifications
  long: '8000'     // Detailed notifications
};

/**
 * Size configurations for modal dialogs
 */
export const MODAL_SIZES = {
  small: {
    width: '400px'
  },
  medium: {
    width: '600px'
  },
  large: {
    width: '800px'
  },
  fullWidth: {
    width: '90%',
    maxWidth: '1200px'
  }
};

/**
 * Size configurations for charts and visualizations
 */
export const CHART_SIZES = {
  small: {
    height: '200px'
  },
  medium: {
    height: '300px'
  },
  large: {
    height: '400px'
  }
};

/**
 * Color palette for charts and visualizations
 * Follows the design system's color guidelines
 */
export const CHART_COLORS = [
  '#0F52BA', // Primary blue
  '#4CAF50', // Green
  '#FF6B35', // Orange
  '#FFC107', // Amber
  '#F44336', // Red
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63'  // Pink
];