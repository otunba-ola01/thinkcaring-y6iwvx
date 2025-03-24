import React from 'react'; // v18.2.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { StatusBadge as GenericStatusBadge } from '../ui/StatusBadge';
import { StatusBadgeProps } from '../../types/ui.types';
import { ClaimStatus } from '../../types/claims.types';
import { Size } from '../../types/common.types';

/**
 * Props interface for the claim-specific status badge
 */
export interface ClaimStatusBadgeProps {
  status: ClaimStatus | string;
  size?: Size;
  sx?: SxProps<Theme>;
}

/**
 * A component that displays a status badge specifically for claim statuses.
 * It extends the generic StatusBadge component to ensure consistent styling
 * for claim status badges throughout the application.
 */
export const StatusBadge: React.FC<ClaimStatusBadgeProps> = ({ 
  status, 
  size = Size.MEDIUM, 
  sx 
}) => {
  return (
    <GenericStatusBadge
      status={status}
      type="claim"
      size={size}
      sx={sx}
    />
  );
};