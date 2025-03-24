import React, { useState, useEffect, useMemo, useCallback } from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // next/router
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  CircularProgress, 
  Divider 
} from '@mui/material'; // v5.13.0
import { ArrowBack, ArrowForward, Check, Error } from '@mui/icons-material'; // v5.13.0

import Stepper from '../ui/Stepper';
import Card from '../ui/Card';
import AlertNotification from '../ui/AlertNotification';
import ValidationResults from '../services/ValidationResults';
import ClaimEntryForm from '../forms/ClaimEntryForm';
import { billingApi } from '../../api/billing.api';
import { clientsApi } from '../../api/clients.api';
import { payersApi } from '../../api/settings.api';
import { servicesApi } from '../../api/services.api';
import { useToast } from '../../hooks/useToast';
import { UUID } from '../../types/common.types';
import { 
  BillingValidationResponse, 
  ServiceToClaimResponse, 
  BillingSubmissionResponse,
  SubmissionMethod,
} from '../../types/billing.types';
import { ClaimCreationWizardProps } from '../../types/billing.types';

/**
 * A wizard component that guides users through the step-by-step process of creating a claim from services
 * @param {ClaimCreationWizardProps} props
 * @returns {JSX.Element} The rendered wizard component
 */
const ClaimCreationWizard: React.FC<ClaimCreationWizardProps> = (props) => {
  // LD1: Destructure props to extract initialSelectedServices, onComplete, and onCancel
  const { initialSelectedServices, onComplete, onCancel } = props;

  // LD1: Set up state for the current step (default to 0)
  const [activeStep, setActiveStep] = useState<number>(0);

  // LD1: Set up state for selected services
  const [selectedServices, setSelectedServices] = useState<UUID[]>([]);

  // LD1: Set up state for validation results
  const [validationResults, setValidationResults] = useState<BillingValidationResponse | null>(null);

  // LD1: Set up state for claim creation results
  const [claimResults, setClaimResults] = useState<ServiceToClaimResponse | null>(null);

  // LD1: Set up state for submission results
  const [submissionResults, setSubmissionResults] = useState<BillingSubmissionResponse | null>(null);

  // LD1: Set up state for loading indicators
  const [validationLoading, setValidationLoading] = useState<boolean>(false);
  const [claimCreationLoading, setClaimCreationLoading] = useState<boolean>(false);
  const [submissionLoading, setSubmissionLoading] = useState<boolean>(false);

  // LD1: Set up state for error messages
  const [validationError, setValidationError] = useState<string | null>(null);
  const [claimCreationError, setClaimCreationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // LD1: Set up state for client and payer data
  const [clients, setClients] = useState<any[]>([]);
  const [payers, setPayers] = useState<any[]>([]);

  // LD1: Initialize toast notification hook
  const toast = useToast();

  // LD1: Initialize router for navigation
  const router = useRouter();

  // LD1: Define the steps of the wizard: 'Select Services', 'Review & Validate', 'Create Claim', 'Submit Claim'
  const steps = useMemo(() => ['Select Services', 'Review & Validate', 'Create Claim', 'Submit Claim'], []);

  // LD1: Create effect to load clients and payers on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const clientsResponse = await clientsApi.getClients({ page: 1, pageSize: 1000, sortField: 'lastName', sortDirection: 'asc', search: '', status: null, programId: null });
        setClients(clientsResponse.data.items.map(client => ({ value: client.id, label: `${client.lastName}, ${client.firstName}` })));

        const payersResponse = await payersApi.getPayers({ page: 1, pageSize: 1000, sortField: 'name', sortDirection: 'asc', search: '', type: null });
        setPayers(payersResponse.data.items.map(payer => ({ value: payer.id, label: payer.name })));
      } catch (error) {
        console.error('Failed to load clients or payers:', error);
      }
    };

    loadData();
  }, []);

  // LD1: Create effect to set selected services from initialSelectedServices prop
  useEffect(() => {
    if (initialSelectedServices) {
      setSelectedServices(initialSelectedServices);
    }
  }, [initialSelectedServices]);

  // LD1: Create function to handle service selection
  const handleServiceSelection = useCallback((serviceIds: UUID[]) => {
    setSelectedServices(serviceIds);
    setValidationResults(null);
    setClaimResults(null);
    setSubmissionResults(null);
    setValidationError(null);
  }, []);

  // LD1: Create function to handle service validation
  const handleValidateServices = useCallback(async () => {
    setValidationLoading(true);
    setValidationError(null);

    try {
      const request = { serviceIds: selectedServices };
      const response = await billingApi.validateServicesForBilling(request);
      setValidationResults(response.data);

      if (!response.data.isValid) {
        toast.error('Some services are not valid for billing. Please review the validation results.', { title: 'Validation Failed' });
      }
    } catch (error: any) {
      setValidationError(error.message || 'Failed to validate services.');
      toast.error(error.message || 'Failed to validate services.', { title: 'Validation Error' });
    } finally {
      setValidationLoading(false);
    }
  }, [selectedServices, toast]);

  // LD1: Create function to handle claim creation
  const handleCreateClaim = useCallback(async (claimData: any) => {
    setClaimCreationLoading(true);
    setClaimCreationError(null);

    try {
      const request = {
        serviceIds: selectedServices,
        payerId: claimData.payerId,
        notes: claimData.notes,
      };
      const response = await billingApi.convertServicesToClaim(request);
      setClaimResults(response.data);
    } catch (error: any) {
      setClaimCreationError(error.message || 'Failed to create claim.');
      toast.error(error.message || 'Failed to create claim.', { title: 'Claim Creation Error' });
    } finally {
      setClaimCreationLoading(false);
    }
  }, [selectedServices, toast]);

  // LD1: Create function to handle claim submission
  const handleSubmitClaim = useCallback(async (submissionMethod: SubmissionMethod) => {
    setSubmissionLoading(true);
    setSubmissionError(null);

    try {
      if (claimResults?.claim?.id) {
        const request = {
          claimId: claimResults.claim.id,
          submissionMethod: submissionMethod,
          submissionDate: new Date().toISOString().split('T')[0], // Today's date
          externalClaimId: null,
          notes: null,
        };
        const response = await billingApi.submitClaim(request);
        setSubmissionResults(response.data);
        toast.success('Claim submitted successfully!', { title: 'Claim Submitted' });
      }
    } catch (error: any) {
      setSubmissionError(error.message || 'Failed to submit claim.');
      toast.error(error.message || 'Failed to submit claim.', { title: 'Submission Error' });
    } finally {
      setSubmissionLoading(false);
    }
  }, [claimResults, toast]);

  // LD1: Create function to navigate to previous step
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep > 0 ? prevActiveStep - 1 : prevActiveStep);
  }, []);

  // LD1: Create function to navigate to next step
  const handleNext = useCallback(() => {
    if (activeStep === 0) {
      handleValidateServices();
    } else if (activeStep === 1 && validationResults?.isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else if (activeStep === 2 && claimResults?.claim) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  }, [activeStep, validationResults, claimResults, handleValidateServices]);

  // LD1: Create function to handle wizard completion
  const handleComplete = useCallback(() => {
    if (onComplete && submissionResults) {
      onComplete(submissionResults);
    }
    toast.success('Claim creation and submission complete!', { title: 'Billing Complete' });
    router.push('/claims');
  }, [onComplete, submissionResults, router, toast]);

  // LD1: Create function to handle wizard cancellation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    router.back();
  }, [onCancel, router]);

  // LD1: Create function to fix validation issues for a specific service
  const handleFixService = useCallback((serviceId: UUID) => {
    router.push(`/services/${serviceId}/edit`);
  }, [router]);

  // Function to render the content for the current step
  const renderStepContent = (step: number): JSX.Element | null => {
    switch (step) {
      case 0:
        return renderServiceSelectionStep();
      case 1:
        return renderValidationStep();
      case 2:
        return renderClaimCreationStep();
      case 3:
        return renderSubmissionStep();
      default:
        return null;
    }
  };

  // Function to render the service selection step
  const renderServiceSelectionStep = (): JSX.Element => {
    return (
      <Card title="Select Services">
        <Typography variant="body1" paragraph>
          Select the services you want to include in this claim.
        </Typography>
        {/* Render a form with client selection, date range filters, and service list */}
        {/* Placeholder for service selection form */}
        <Typography variant="body2">Selected Services: {selectedServices.length}</Typography>
        <Typography variant="body2">Total Amount: ${0}</Typography>
        {loadingServices && <CircularProgress />}
        {validationError && <AlertNotification message={validationError} severity="error" />}
      </Card>
    );
  };

  // Function to render the validation step
  const renderValidationStep = (): JSX.Element => {
    return (
      <Card title="Review & Validate">
        {validationLoading && <CircularProgress />}
        {validationError && <AlertNotification message={validationError} severity="error" />}
        {validationResults && (
          <ValidationResults
            validationResponse={validationResults}
            onFixService={handleFixService}
          />
        )}
      </Card>
    );
  };

  // Function to render the claim creation step
  const renderClaimCreationStep = (): JSX.Element => {
    return (
      <Card title="Create Claim">
        {claimCreationLoading && <CircularProgress />}
        {claimCreationError && <AlertNotification message={claimCreationError} severity="error" />}
        {validationResults && !claimResults && (
          <ClaimEntryForm
            claim={claimResults?.claim}
            onSubmit={handleCreateClaim}
            onCancel={handleCancel}
            clients={clients}
            payers={payers}
            services={[]}
            loading={claimCreationLoading}
            error={claimCreationError}
          />
        )}
        {claimResults?.claim && <AlertNotification message="Claim created successfully!" severity="success" />}
      </Card>
    );
  };

  // Function to render the submission step
  const renderSubmissionStep = (): JSX.Element => {
    return (
      <Card title="Submit Claim">
        {submissionLoading && <CircularProgress />}
        {submissionError && <AlertNotification message={submissionError} severity="error" />}
        {claimResults?.claim && !submissionResults && (
          <Box>
            <Typography variant="body1">Select submission method:</Typography>
            <Button variant="contained" onClick={() => handleSubmitClaim(SubmissionMethod.ELECTRONIC)}>
              Electronic Submission
            </Button>
          </Box>
        )}
        {submissionResults && <AlertNotification message="Claim submitted successfully!" severity="success" />}
      </Card>
    );
  };

  // LD1: Render the wizard component with a Paper container
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* LD1: Render the Stepper component with the defined steps and current step */}
      <Stepper steps={steps} activeStep={activeStep} onStepChange={setActiveStep} />

      {/* LD1: Render the current step content based on activeStep */}
      <Box sx={{ mt: 2 }}>
        {renderStepContent(activeStep)}
      </Box>

      {/* LD1: Render navigation buttons (Back, Next, Submit) based on current step */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBack />}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleComplete} endIcon={<Check />}>
            Complete
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />} disabled={validationLoading || claimCreationLoading || submissionLoading}>
            Next
          </Button>
        )}
      </Box>

      {/* LD1: Show loading indicators when operations are in progress */}
      {validationLoading && <CircularProgress />}
      {claimCreationLoading && <CircularProgress />}
      {submissionLoading && <CircularProgress />}

      {/* LD1: Show error messages when operations fail */}
      {validationError && <AlertNotification message={validationError} severity="error" />}
      {claimCreationError && <AlertNotification message={claimCreationError} severity="error" />}
      {submissionError && <AlertNotification message={submissionError} severity="error" />}
    </Paper>
  );
};

export default ClaimCreationWizard;