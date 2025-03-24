import React, { useState } from 'react';
import { Button } from '@mui/material'; // v5.13.0
import { ActionButtonProps } from '../../types/ui.types';
import { Severity } from '../../types/common.types';
import ConfirmDialog from './ConfirmDialog';

/**
 * A reusable button component with enhanced functionality including icon support and confirmation dialogs.
 * Used throughout the application to maintain consistent interaction patterns and styling.
 * 
 * Features:
 * - Optional icon display alongside text
 * - Confirmation dialog for destructive or important actions
 * - Consistent styling using Material UI Button component
 * - Accessibility support with proper ARIA attributes
 * 
 * @param props - The component props
 * @returns The rendered ActionButton component
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onClick,
  confirmText,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  disabled = false,
  sx
}) => {
  // State for confirmation dialog visibility
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Handle button click based on whether confirmation is required
  const handleClick = () => {
    if (confirmText) {
      setShowConfirmation(true);
    } else {
      onClick();
    }
  };

  // Handle confirmation dialog confirmation
  const handleConfirm = () => {
    onClick();
    setShowConfirmation(false);
  };

  // Handle confirmation dialog cancellation
  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        disabled={disabled}
        onClick={handleClick}
        startIcon={icon}
        sx={sx}
      >
        {label}
      </Button>

      {confirmText && (
        <ConfirmDialog
          open={showConfirmation}
          title={`Confirm: ${label}`}
          message={confirmText}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          severity={Severity.WARNING}
        />
      )}
    </>
  );
};

export default ActionButton;