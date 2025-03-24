import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { Box, Typography, Button, CircularProgress, Divider, Paper } from '@mui/material'; // v5.13.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { ArrowBack, ArrowForward, CheckCircle, Error } from '@mui/icons-material'; // v5.13.0

import ValidationResults from '../services/ValidationResults';
import { UUID } from '../../types/common.types';
import { BillingValidationRequest, BillingValidationResponse } from '../../types/billing.types';
import { billingApi } from '../../api/billing.api';
import useToast from '../../hooks/useToast';
import StatusBadge from '../ui/StatusBadge';

/**
 * Interface defining the props for the ValidationForm component
 */
export interface ValidationFormProps {
  /** Array of service IDs to validate */
  serviceIds: UUID[];
  /** Callback function to handle fixing a service */
  onFixService: (serviceId: UUID) => void;
  /** Callback function to handle proceeding with valid service IDs */
  onProceed: (validServiceIds: UUID[]) => void;
  /** Callback function to handle navigation back */
  onBack: () => void;
  /** Flag to indicate if validation should be performed automatically */
  autoValidate: boolean;
  /** Optional sx prop for custom styling */
  sx?: SxProps<Theme>;
}

/**
 * Component that handles the validation of services for billing and displays the results
 * @param {ValidationFormProps} props - The props for the component
 * @returns {JSX.Element} The rendered ValidationForm component
 */
const ValidationForm: React.FC<ValidationFormProps> = ({
  serviceIds,
  onFixService,
  onProceed,
  onBack,
  autoValidate,
  sx
}) => {
  // State for storing the validation response
  const [validationResponse, setValidationResponse] = useState<BillingValidationResponse | null>(null);
  // State for tracking the loading state
  const [loading, setLoading] = useState<boolean>(false);
  // State for storing any error messages
  const [error, setError] = useState<string | null>(null);

  // Use the custom toast hook for displaying notifications
  const toast = useToast();

  /**
   * Function to validate services for billing by calling the billing API
   */
  const validateServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const request: BillingValidationRequest = { serviceIds };
      const response = await billingApi.validateServicesForBilling(request);
      setValidationResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to validate services.');
      toast.error(err.message || 'Failed to validate services.');
    } finally {
      setLoading(false);
    }
  }, [serviceIds, toast]);

  // Automatically validate services when autoValidate is true and serviceIds change
  useEffect(() => {
    if (autoValidate && serviceIds && serviceIds.length > 0) {
      validateServices();
    }
  }, [autoValidate, serviceIds, validateServices]);

  /**
   * Function to handle manual validation trigger
   */
  const handleValidate = () => {
    validateServices();
  };

  /**
   * Function to handle proceeding with valid service IDs
   */
  const handleProceed = () => {
    if (validationResponse) {
      const validServiceIds = validationResponse.results
        .filter(result => result.isValid)
        .map(result => result.serviceId);
      onProceed(validServiceIds);
    }
  };

  /**
   * Function to handle fixing a service
   * @param {UUID} serviceId - The ID of the service to fix
   */
  const handleFixService = (serviceId: UUID) => {
    onFixService(serviceId);
  };

  /**
   * Function to handle navigation back
   */
  const handleBack = () => {
    onBack();
  };

  return (
    <Box sx={{ ...sx }}>
      <Typography variant="h5" component="h3" gutterBottom>
        Validate Services
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      {validationResponse && (
        <ValidationResults
          validationResponse={validationResponse}
          onFixService={handleFixService}
        />
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
          Back to Billing Queue
        </Button>
        <Box>
          <Button variant="contained" onClick={handleValidate} sx={{ mr: 2 }}>
            Validate Services
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProceed}
            disabled={validationResponse ? !validationResponse.isValid : true}
            endIcon={<ArrowForward />}
          >
            Proceed to Claim Creation
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ValidationForm;