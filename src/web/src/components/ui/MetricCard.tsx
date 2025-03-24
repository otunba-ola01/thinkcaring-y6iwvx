import React from 'react'; // v18.2.0
import { Box, Typography, Skeleton, Chip, useTheme } from '@mui/material'; // v5.13.0
import { TrendingUp, TrendingDown } from '@mui/icons-material'; // v5.13.0
import { MetricCardProps } from '../../types/ui.types';
import Card from './Card';

/**
 * A card component that displays a key metric with title, value, trend indicator, and optional icon
 * 
 * @param {MetricCardProps} props - The component props
 * @returns {JSX.Element} The rendered MetricCard component
 */
const MetricCard = ({
  title,
  value,
  trend,
  trendLabel,
  icon,
  loading = false,
  onClick,
  sx
}: MetricCardProps): JSX.Element => {
  const theme = useTheme();
  
  // Determine trend color based on value
  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'default';
    if (trend === 0) return 'default';
    return trend > 0 ? 'success' : 'error';
  };
  
  // Format the trend value with sign
  const formattedTrend = trend !== undefined && trend !== null 
    ? `${trend > 0 ? '+' : ''}${trend}%` 
    : null;
  
  // Format the value if it's a number
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString() 
    : value;
    
  return (
    <Card 
      loading={loading}
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        } : {},
        ...sx
      }}
    >
      <Box 
        sx={{ position: 'relative', paddingRight: icon ? 6 : 0 }}
        onClick={onClick}
      >
        {/* Title */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        {/* Value */}
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            my: 1, 
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {formattedValue}
        </Typography>
        
        {/* Trend indicator */}
        {trend !== undefined && trend !== null && (
          <Chip
            icon={trend > 0 ? <TrendingUp fontSize="small" /> : trend < 0 ? <TrendingDown fontSize="small" /> : null}
            label={trendLabel ? `${formattedTrend} ${trendLabel}` : formattedTrend}
            color={getTrendColor()}
            size="small"
            variant="outlined"
            sx={{ 
              fontWeight: 500,
              height: 24,
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        )}
        
        {/* Optional icon */}
        {icon && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            color: 'text.secondary'
          }}>
            {icon}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default MetricCard;