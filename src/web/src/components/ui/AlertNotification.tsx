import React, { useEffect, useState } from 'react'; // v18.2.0
import { 
  Alert, 
  Collapse, 
  IconButton, 
  Box, 
  SxProps, 
  Theme 
} from '@mui/material'; // v5.13.0
import { 
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material'; // v5.13.0
import { AlertNotificationProps } from '../../types/ui.types';
import { Severity } from '../../types/common.types';

/**
 * Helper function to get the appropriate icon based on severity level
 */
const getSeverityIcon = (severity: Severity): JSX.Element => {
  switch (severity) {
    case Severity.SUCCESS:
      return <CheckCircleIcon />;
    case Severity.INFO:
      return <InfoIcon />;
    case Severity.WARNING:
      return <WarningIcon />;
    case Severity.ERROR:
      return <ErrorIcon />;
    default:
      return <InfoIcon />;
  }
};

/**
 * A reusable component that displays alert notifications with different severity levels.
 * Used throughout the application to provide feedback about operations, errors, and important information.
 * 
 * @example
 * // Basic usage
 * <AlertNotification message="Operation successful" severity={Severity.SUCCESS} />
 * 
 * // With auto-hide and dismiss handler
 * <AlertNotification 
 *   message="Changes saved" 
 *   severity={Severity.SUCCESS} 
 *   autoHideDuration={5000}
 *   onDismiss={() => console.log('Alert dismissed')} 
 * />
 * 
 * // With custom action
 * <AlertNotification 
 *   message="Please review your changes" 
 *   severity={Severity.WARNING}
 *   action={<Button color="inherit" size="small">Review</Button>}
 * />
 */
const AlertNotification: React.FC<AlertNotificationProps> = ({
  message,
  severity = Severity.INFO,
  onDismiss,
  action,
  autoHideDuration,
  sx
}) => {
  const [open, setOpen] = useState<boolean>(true);

  // Auto-hide the alert after specified duration if provided
  useEffect(() => {
    if (autoHideDuration && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setOpen(false);
        if (onDismiss) {
          onDismiss();
        }
      }, autoHideDuration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [autoHideDuration, onDismiss]);

  const handleClose = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const icon = getSeverityIcon(severity);

  return (
    <Collapse in={open}>
      <Alert
        severity={severity}
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          ...sx
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {action}
            {onDismiss && (
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleClose}
                sx={{ ml: action ? 1 : 0 }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        }
        icon={icon}
      >
        {message}
      </Alert>
    </Collapse>
  );
};

export default AlertNotification;