import React from 'react'; // v18.2.0
import { Box, Typography, Grid, Divider, SxProps, Theme } from '@mui/material'; // v5.13.0
import Card from '../ui/Card';
import StatusBadge from './StatusBadge';
import { ClaimSummary as ClaimSummaryType, ClaimStatus } from '../../types/claims.types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Size } from '../../types/common.types';

/**
 * Props for the ClaimSummary component
 */
interface ClaimSummaryProps {
  /** The claim data to display */
  claim: ClaimSummaryType;
  /** Optional click handler for the claim card */
  onClick?: (claim: ClaimSummaryType) => void;
  /** Whether to display in compact mode for mobile or tight layouts */
  compact?: boolean;
  /** Additional styling for the component */
  sx?: SxProps<Theme>;
}

/**
 * Renders the service date range in a consistent format
 */
const renderDateRange = (startDate: string, endDate: string): string => {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  if (startDate === endDate) {
    return formattedStartDate;
  }

  return `${formattedStartDate} - ${formattedEndDate}`;
};

/**
 * A component that displays a summary of claim information in a compact format
 * Used in various contexts including related claims lists, mobile views, and dashboard widgets
 */
const ClaimSummary: React.FC<ClaimSummaryProps> = ({ 
  claim, 
  onClick, 
  compact = false,
  sx 
}) => {
  const { 
    claimNumber, 
    clientName, 
    payerName, 
    claimStatus, 
    totalAmount, 
    serviceStartDate, 
    serviceEndDate, 
    claimAge 
  } = claim;

  const formattedAmount = formatCurrency(totalAmount);
  const dateRange = renderDateRange(serviceStartDate, serviceEndDate);
  const badgeSize = compact ? Size.SMALL : Size.MEDIUM;

  return (
    <Card
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        ...(compact && { 
          '& .MuiCardContent-root': { 
            padding: '8px 12px' 
          } 
        }),
        ...sx
      }}
      onClick={onClick ? () => onClick(claim) : undefined}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: compact ? 0.5 : 1 
      }}>
        <Typography variant={compact ? "body2" : "subtitle2"} component="div">
          {claimNumber}
        </Typography>
        <StatusBadge status={claimStatus} size={badgeSize} />
      </Box>
      
      {!compact && <Divider sx={{ mb: 1 }} />}
      
      <Grid container spacing={compact ? 0.5 : 1}>
        <Grid item xs={12}>
          <Typography 
            variant="body2" 
            component="div" 
            sx={{ fontWeight: 'medium' }}
          >
            {clientName}
          </Typography>
        </Grid>
        
        <Grid item xs={compact ? 12 : 6}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            component="div"
          >
            {compact ? dateRange : `Service Date: ${dateRange}`}
          </Typography>
        </Grid>
        
        {!compact && (
          <Grid item xs={6}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              component="div"
            >
              Payer: {payerName}
            </Typography>
          </Grid>
        )}
        
        <Grid item xs={6}>
          <Typography 
            variant="body2" 
            component="div" 
            fontWeight="bold" 
            color="primary"
          >
            {formattedAmount}
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            component="div"
          >
            {claimAge} {compact ? 'd' : 'days'}
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default ClaimSummary;