import React from 'react'; // v18.2.0
import { Chip, SxProps, Theme } from '@mui/material'; // v5.13.0
import { Size } from '../../types/common.types';
import { StatusBadgeProps } from '../../types/ui.types';
import { CLAIM_STATUS_COLORS, CLAIM_STATUS_LABELS } from '../../constants/claims.constants';
import { 
  DOCUMENTATION_STATUS_COLORS, 
  DOCUMENTATION_STATUS_LABELS,
  BILLING_STATUS_COLORS, 
  BILLING_STATUS_LABELS 
} from '../../constants/services.constants';
import { RECONCILIATION_STATUS_COLORS, RECONCILIATION_STATUS_LABELS } from '../../constants/payments.constants';

/**
 * Helper function to get the appropriate color for a status based on its type
 * @param status The status value
 * @param type The status type (claim, documentation, billing, reconciliation)
 * @returns The color code for the status
 */
const getStatusColor = (status: string, type: string): string => {
  switch (type) {
    case 'claim':
      return CLAIM_STATUS_COLORS[status] || '#616E7C'; // Default to neutral dark if status not found
    case 'documentation':
      return DOCUMENTATION_STATUS_COLORS[status] || '#616E7C';
    case 'billing':
      return BILLING_STATUS_COLORS[status] || '#616E7C';
    case 'reconciliation':
      return RECONCILIATION_STATUS_COLORS[status] || '#616E7C';
    default:
      return '#616E7C'; // Default color if type not recognized
  }
};

/**
 * Helper function to get the human-readable label for a status based on its type
 * @param status The status value
 * @param type The status type (claim, documentation, billing, reconciliation)
 * @returns The human-readable label for the status
 */
const getStatusLabel = (status: string, type: string): string => {
  switch (type) {
    case 'claim':
      return CLAIM_STATUS_LABELS[status] || status;
    case 'documentation':
      return DOCUMENTATION_STATUS_LABELS[status] || status;
    case 'billing':
      return BILLING_STATUS_LABELS[status] || status;
    case 'reconciliation':
      return RECONCILIATION_STATUS_LABELS[status] || status;
    default:
      return status; // Default to the status itself if type not recognized
  }
};

/**
 * A component that displays a status badge with appropriate styling based on the status value and type.
 * Used throughout the application to visually represent different status values for claims,
 * documentation, billing, and reconciliation processes.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type, 
  size = Size.MEDIUM, 
  sx 
}) => {
  const color = getStatusColor(status, type);
  const label = getStatusLabel(status, type);
  
  // Map the Size enum to Material UI Chip sizes
  const chipSize = size === Size.LARGE ? 'medium' : 'small';
  
  return (
    <Chip
      label={label}
      variant="outlined"
      size={chipSize}
      sx={{ 
        color,
        borderColor: color,
        fontWeight: 500,
        height: size === Size.SMALL ? 24 : size === Size.MEDIUM ? 32 : 40,
        '& .MuiChip-label': {
          padding: size === Size.SMALL ? '0 8px' : size === Size.MEDIUM ? '0 12px' : '0 16px',
          fontSize: size === Size.SMALL ? '0.75rem' : size === Size.MEDIUM ? '0.875rem' : '1rem',
        },
        ...sx 
      }}
    />
  );
};