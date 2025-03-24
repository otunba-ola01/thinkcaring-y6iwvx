import React from 'react'; // v18.2.0
import { Box, Typography, Paper, SxProps, Theme } from '@mui/material'; // v5.13.0
import { SearchOff as SearchOffIcon } from '@mui/icons-material'; // v5.13.0
import { EmptyStateProps } from '../../types/ui.types';

/**
 * A reusable component that displays a placeholder when there is no data to show.
 * It provides a consistent empty state visualization with customizable icon, title, description, and action.
 *
 * @param {EmptyStateProps} props - The component props
 * @returns {JSX.Element} The rendered EmptyState component
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There are no items to display at this time.',
  icon,
  action,
  sx
}) => {
  // Use the default icon if none is provided
  const displayIcon = icon || <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.7 }} />;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 2,
        backgroundColor: 'background.default',
        ...sx 
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
          px: 2
        }}
      >
        {/* Icon */}
        <Box sx={{ mb: 2 }}>
          {displayIcon}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          color="text.primary"
          gutterBottom
        >
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: action ? 3 : 0, maxWidth: '80%' }}
        >
          {description}
        </Typography>

        {/* Optional action button */}
        {action && (
          <Box sx={{ mt: 2 }}>
            {action}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;