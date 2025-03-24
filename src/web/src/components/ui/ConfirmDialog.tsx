import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { ConfirmDialogProps } from '../../types/ui.types';
import { Severity } from '../../types/common.types';

/**
 * Helper function to get the appropriate icon based on severity level
 * @param severity - The severity level to display (warning, error, info)
 * @returns The corresponding icon component or null if no severity provided
 */
const getSeverityIcon = (severity?: Severity): JSX.Element | null => {
  if (!severity) return null;
  
  switch (severity) {
    case Severity.WARNING:
      return <WarningIcon color="warning" />;
    case Severity.ERROR:
      return <ErrorIcon color="error" />;
    case Severity.INFO:
      return <InfoIcon color="info" />;
    default:
      return null;
  }
};

/**
 * A dialog component that prompts users to confirm or cancel an action.
 * Used throughout the application to prevent accidental actions and provide
 * clear feedback about the consequences of user choices.
 * 
 * Implements WCAG 2.1 AA accessibility standards with proper focus management
 * and ARIA attributes.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  severity
}) => {
  const icon = getSeverityIcon(severity);
  
  // Determine button color based on severity
  const buttonColor = severity === Severity.ERROR ? 'error' : 'primary';
  
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title" sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="close"
          onClick={onCancel}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>{icon}</span>}
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {cancelLabel}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={buttonColor} 
          variant="contained" 
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;