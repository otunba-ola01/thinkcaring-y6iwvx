import React from 'react'; // v18.2.0
import { Skeleton as MuiSkeleton, Box } from '@mui/material'; // v5.13.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { SkeletonProps } from '../../types/ui.types';

/**
 * A component that renders skeleton placeholders for content that is still loading.
 * Extends Material UI's Skeleton with additional functionality like multiple placeholders.
 * 
 * @param props - The skeleton component props
 * @returns A skeleton placeholder or multiple placeholders
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  count = 1,
  sx
}) => {
  // Create an array based on the count to render multiple skeletons
  const items = Array.from({ length: count }, (_, index) => index);

  return (
    <Box sx={sx}>
      {items.map((item, index) => (
        <MuiSkeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ 
            mb: index < count - 1 ? 1 : 0, // Add margin bottom except for the last item
            borderRadius: variant === 'rounded' ? 1 : undefined
          }}
        />
      ))}
    </Box>
  );
};

export default Skeleton;