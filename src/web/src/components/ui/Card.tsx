import React from 'react'; // v18.2.0
import { Card as MuiCard, CardContent, CardHeader, CardActions, Typography, Box, Skeleton, Divider } from '@mui/material'; // v5.13.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { CardProps } from '../../types/ui.types';

/**
 * A reusable card component that provides a consistent container with title,
 * subtitle, content area, and optional action buttons.
 * 
 * @param {CardProps} props - The component props
 * @returns {JSX.Element} The rendered Card component
 */
const Card = ({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  sx,
  elevation = 1
}: CardProps): JSX.Element => {
  // Render a skeleton version if loading
  if (loading) {
    return (
      <MuiCard elevation={elevation} sx={{ ...sx }}>
        {title && (
          <CardHeader
            title={<Skeleton variant="text" width="60%" height={28} />}
            subheader={subtitle && <Skeleton variant="text" width="40%" height={20} />}
          />
        )}
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={100} />
            <Skeleton variant="rectangular" width="100%" height={20} />
            <Skeleton variant="rectangular" width="80%" height={20} />
          </Box>
        </CardContent>
        {actions && (
          <>
            <Divider />
            <CardActions>
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1, ml: 1 }} />
            </CardActions>
          </>
        )}
      </MuiCard>
    );
  }

  // Render the actual card
  return (
    <MuiCard elevation={elevation} sx={{ ...sx }}>
      {title && (
        <CardHeader
          title={
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          }
          subheader={
            subtitle && (
              <Typography variant="subtitle2" color="text.secondary">
                {subtitle}
              </Typography>
            )
          }
        />
      )}
      <CardContent>{children}</CardContent>
      {actions && (
        <>
          <Divider />
          <CardActions>{actions}</CardActions>
        </>
      )}
    </MuiCard>
  );
};

export default Card;