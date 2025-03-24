import React from 'react'; // v18.2.0
import {
  Stepper as MuiStepper,
  Step,
  StepLabel,
  StepButton,
  StepContent,
  Box
} from '@mui/material'; // v5.13.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { StepperProps } from '../../types/ui.types';

/**
 * A customizable stepper component for multi-step processes and wizards.
 * Extends Material UI's Stepper component with additional functionality and consistent styling.
 * Used in complex workflows like claim creation and billing processes.
 *
 * @param props - The component props
 * @returns The rendered Stepper component
 */
const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepChange,
  orientation = 'horizontal',
  sx
}) => {
  /**
   * Handles click on a step if onStepChange is provided
   * @param step - The step index to change to
   */
  const handleStepClick = (step: number) => {
    if (onStepChange) {
      onStepChange(step);
    }
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <MuiStepper
        activeStep={activeStep}
        orientation={orientation}
        sx={{
          '& .MuiStepLabel-root': {
            color: 'text.secondary',
          },
          '& .MuiStepLabel-active': {
            color: 'primary.main',
            fontWeight: 'bold',
          },
          '& .MuiStepLabel-completed': {
            color: 'success.main',
          },
          '& .MuiStepIcon-root': {
            color: 'grey.400',
          },
          '& .MuiStepIcon-active': {
            color: 'primary.main',
          },
          '& .MuiStepIcon-completed': {
            color: 'success.main',
          },
          '& .MuiStepConnector-root': {
            left: 'calc(50% + 20px)',
            right: 'calc(-50% + 20px)',
          },
          '& .MuiStepConnector-line': {
            borderColor: 'grey.300',
          }
        }}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            {onStepChange ? (
              <StepButton onClick={() => handleStepClick(index)}>
                {label}
              </StepButton>
            ) : (
              <StepLabel>{label}</StepLabel>
            )}
            {orientation === 'vertical' && <StepContent />}
          </Step>
        ))}
      </MuiStepper>
    </Box>
  );
};

export default Stepper;