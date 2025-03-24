import React from 'react'; // v18.2.0
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  StepConnector, 
  styled, 
  SxProps, 
  Theme 
} from '@mui/material'; // v5.13.0
import { Check, AccessTime } from '@mui/icons-material'; // v5.13.0
import StatusBadge from './StatusBadge';
import { ClaimTimelineEntry, ClaimStatus } from '../../types/claims.types';
import { Size } from '../../types/common.types';
import { CLAIM_STATUS_ICONS } from '../../constants/claims.constants';
import { formatDateTime } from '../../utils/format';

/**
 * Props for the ClaimTimeline component
 */
interface ClaimTimelineProps {
  /** Array of timeline entries showing claim status changes */
  timeline: ClaimTimelineEntry[];
  /** Orientation of the timeline (vertical or horizontal) */
  orientation?: 'vertical' | 'horizontal';
  /** Size of the timeline components */
  size?: Size;
  /** Additional styling props */
  sx?: SxProps<Theme>;
}

/**
 * Styled StepConnector component for custom timeline appearance
 */
const TimelineConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.divider,
    borderLeftWidth: 2,
  },
  '&.Mui-active': {
    '& .MuiStepConnector-line': {
      borderColor: theme.palette.primary.main,
    },
  },
  '&.Mui-completed': {
    '& .MuiStepConnector-line': {
      borderColor: theme.palette.success.main,
    },
  },
}));

/**
 * Styled Step component for custom timeline step appearance
 */
const TimelineStep = styled(Step)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    padding: theme.spacing(1, 0),
  },
  '& .MuiStepLabel-iconContainer': {
    paddingRight: theme.spacing(1),
  },
  '&.Mui-completed': {
    '& .MuiStepLabel-iconContainer': {
      color: theme.palette.success.main,
    },
  },
  '&.Mui-active': {
    '& .MuiStepLabel-label': {
      fontWeight: 600,
    },
  },
}));

/**
 * Helper function to get the appropriate icon for a claim status step
 * 
 * @param status The claim status
 * @returns The icon component for the status
 */
const getStepIcon = (status: ClaimStatus): JSX.Element => {
  // Use specific icons based on status, or fallback to a default icon (AccessTime)
  switch (status) {
    case ClaimStatus.PAID:
    case ClaimStatus.VALIDATED:
    case ClaimStatus.COMPLETE:
      return <Check />;
    default:
      return <AccessTime />;
  }
};

/**
 * A component that visualizes the status history of a claim as a timeline,
 * showing the progression of a claim through its lifecycle from creation to payment or denial.
 * It provides a clear visual representation of status changes with timestamps and associated information.
 */
const ClaimTimeline: React.FC<ClaimTimelineProps> = ({ 
  timeline, 
  orientation = 'vertical', 
  size = Size.MEDIUM, 
  sx 
}) => {
  // Sort timeline entries by timestamp in ascending order
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Set active step to the last item in the timeline (current status)
  const activeStep = sortedTimeline.length - 1;
  
  // Determine spacing based on size
  const getSpacing = (value: number) => {
    switch (size) {
      case Size.SMALL:
        return value * 0.75;
      case Size.LARGE:
        return value * 1.5;
      case Size.MEDIUM:
      default:
        return value;
    }
  };

  return (
    <Box sx={{ ...sx }}>
      <Stepper 
        orientation={orientation} 
        activeStep={activeStep} 
        connector={<TimelineConnector />}
        sx={{
          '& .MuiStepLabel-label': {
            fontSize: size === Size.SMALL ? '0.75rem' : size === Size.LARGE ? '1rem' : '0.875rem',
          },
          ...(orientation === 'horizontal' && {
            overflowX: 'auto',
            padding: theme => theme.spacing(1, 0),
            '& .MuiStep-root': {
              flex: 1,
              minWidth: size === Size.SMALL ? 100 : size === Size.LARGE ? 160 : 130,
            },
          }),
        }}
      >
        {sortedTimeline.map((entry, index) => (
          <TimelineStep key={index} completed={index < activeStep}>
            <StepLabel StepIconComponent={() => getStepIcon(entry.status)}>
              <Box display="flex" flexDirection="column" gap={0.5}>
                <StatusBadge 
                  status={entry.status} 
                  size={size}
                />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {formatDateTime(entry.timestamp)}
                </Typography>
              </Box>
            </StepLabel>
            {orientation === 'vertical' && (
              <StepContent>
                <Box 
                  sx={{ 
                    ml: getSpacing(2), 
                    pl: getSpacing(1), 
                    borderLeft: theme => `1px dashed ${theme.palette.divider}`,
                  }}
                >
                  {entry.userName && (
                    <Typography 
                      variant={size === Size.SMALL ? 'caption' : 'body2'} 
                      color="text.primary" 
                      fontWeight={500}
                    >
                      By: {entry.userName}
                    </Typography>
                  )}
                  {entry.notes && (
                    <Typography 
                      variant={size === Size.SMALL ? 'caption' : 'body2'} 
                      color="text.secondary"
                      sx={{ mt: 0.5, wordBreak: 'break-word' }}
                    >
                      {entry.notes}
                    </Typography>
                  )}
                </Box>
              </StepContent>
            )}
          </TimelineStep>
        ))}
      </Stepper>
      
      {/* For horizontal orientation, display additional details below the timeline */}
      {orientation === 'horizontal' && activeStep >= 0 && (
        <Box 
          sx={{ 
            mt: 2, 
            pt: 2,
            borderTop: theme => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Current Status: <StatusBadge status={sortedTimeline[activeStep].status} size={size} />
          </Typography>
          
          {sortedTimeline[activeStep].userName && (
            <Typography variant="body2" color="text.secondary">
              Last updated by: {sortedTimeline[activeStep].userName}
            </Typography>
          )}
          
          {sortedTimeline[activeStep].notes && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mt: 1, py: 1, px: 2, bgcolor: 'background.paper', borderRadius: 1 }}
            >
              {sortedTimeline[activeStep].notes}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ClaimTimeline;