import React, { useState, useEffect, useMemo, useCallback } from 'react'; // v18.2.0
import { Box, Typography, Button, Paper, Divider, Alert, AlertTitle, CircularProgress, Stack } from '@mui/material'; // v5.13.0
import { useRouter } from 'next/router'; // next/router v13.4+

import Stepper from '../ui/Stepper';
import ClaimList from './ClaimList';
import ClaimFilter from './ClaimFilter';
import StatusBadge from './StatusBadge';
import useClaims from '../../hooks/useClaims';
import useToast from '../../hooks/useToast';
import { 
  ClaimSummary, 
  ClaimStatus, 
  ClaimValidationResponse, 
  BatchSubmitClaimsDto, 
  SubmitClaimDto, 
  ClaimBatchResult 
} from '../../types/claims.types';
import { formatDate, formatCurrency } from '../../utils/format';
import { SUBMISSION_METHODS } from '../../constants/claims.constants';

/**
 * Interface for the BatchClaimProcess component props
 */
interface BatchClaimProcessProps {
  /** Callback function to execute when the batch process is complete */
  onComplete: (result: ClaimBatchResult) => void;
  /** Array of initial claims to pre-select in the claim list */
  initialClaims?: ClaimSummary[];
  /** Custom styles for the component */
  sx?: object;
}

/**
 * A component that implements a step-by-step wizard for batch processing of claims,
 * including selection, validation, and submission. This component supports the
 * batch claims processing feature of the HCBS Revenue Management System.
 */
const BatchClaimProcess: React.FC<BatchClaimProcessProps> = ({ onComplete, initialClaims, sx }) => {
  // Destructure props to extract onComplete, initialClaims, and sx
  
  // Initialize router for navigation
  const router = useRouter();

  // Initialize toast hook for notifications
  const toast = useToast();

  // Initialize useClaims hook for claims management functionality
  const { 
    validateClaims,
    batchSubmitClaims,
    clearValidationResults,
    clearBatchResults,
    validationResults,
    batchResults,
    isLoading,
  } = useClaims({ autoFetch: false });

  // Set up state for active step, selected claims, validation results, submission data, and batch results
  const [activeStep, setActiveStep] = useState(0);
  const [selectedClaims, setSelectedClaims] = useState<ClaimSummary[]>(initialClaims || []);
  const [submissionData, setSubmissionData] = useState<BatchSubmitClaimsDto>({
    claimIds: [],
    submissionMethod: 'electronic', // Default submission method
    submissionDate: new Date().toISOString().split('T')[0], // Today's date
    notes: null,
  });

  // Define steps for the wizard: 'Select Claims', 'Review & Validate', 'Submit Claims'
  const steps = ['Select Claims', 'Review & Validate', 'Submit Claims'];

  // Define handleStepChange function to navigate between steps
  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  // Define handleClaimSelection function to update selected claims
  const handleClaimSelection = (claims: ClaimSummary[]) => {
    setSelectedClaims(claims);
  };

  // Define handleValidateClaims function to validate selected claims
  const handleValidateClaims = async () => {
    if (selectedClaims.length === 0) {
      toast.warning('Please select claims to validate.');
      return;
    }

    const claimIds = selectedClaims.map(claim => claim.id);
    await validateClaims(claimIds);
    setActiveStep(1);
  };

  // Define handleSubmitClaims function to submit validated claims
  const handleSubmitClaims = async () => {
    if (!validationResults?.isValid) {
      toast.error('Please validate claims before submitting.');
      return;
    }

    const claimIds = selectedClaims.map(claim => claim.id);
    const submissionDataWithClaimIds: BatchSubmitClaimsDto = {
      ...submissionData,
      claimIds: claimIds,
    };
    await batchSubmitClaims(submissionDataWithClaimIds);
    setActiveStep(2);
  };

  // Define handleCancel function to cancel the process and navigate back
  const handleCancel = () => {
    clearValidationResults();
    clearBatchResults();
    router.back();
  };

  // Define handleComplete function to finish the process and call onComplete callback
  const handleComplete = () => {
    onComplete(batchResults);
    clearValidationResults();
    clearBatchResults();
    router.back();
  };

  // Render a Paper container for the entire component
  return (
    <Paper elevation={3} sx={{ p: 3, ...sx }}>
      {/* Render a header section with title and step indicator */}
      <Typography variant="h4" gutterBottom>
        Batch Claim Processing
      </Typography>
      <Typography variant="body1" paragraph>
        Process multiple claims in a streamlined workflow.
      </Typography>

      {/* Render a Stepper component with the defined steps and active step */}
      <Stepper steps={steps} activeStep={activeStep} onStepChange={handleStepChange} />

      {/* Render the appropriate step content based on activeStep */}
      {activeStep === 0 && (
        <SelectClaimsStep
          selectedClaims={selectedClaims}
          onClaimSelection={handleClaimSelection}
          initialClaims={initialClaims}
        />
      )}
      {activeStep === 1 && (
        <ReviewValidateStep
          selectedClaims={selectedClaims}
          validationResults={validationResults}
          onValidate={handleValidateClaims}
          loading={isLoading}
        />
      )}
      {activeStep === 2 && (
        <SubmitClaimsStep
          selectedClaims={selectedClaims}
          validationResults={validationResults}
          submissionData={submissionData}
          batchResults={batchResults}
          onSubmissionDataChange={(data) => setSubmissionData(data)}
          onSubmit={handleSubmitClaims}
          loading={isLoading}
        />
      )}

      {/* Render navigation buttons for moving between steps */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button disabled={activeStep === 0} onClick={() => handleStepChange(activeStep - 1)}>
          Back
        </Button>
        {activeStep === 0 && (
          <Button variant="contained" onClick={handleValidateClaims} disabled={selectedClaims.length === 0}>
            Validate Claims
          </Button>
        )}
        {activeStep === 1 && (
          <Button variant="contained" onClick={handleSubmitClaims} disabled={!validationResults?.isValid}>
            Submit Claims
          </Button>
        )}
        {activeStep === 2 && (
          <Button variant="contained" onClick={handleComplete}>
            Complete
          </Button>
        )}
        {activeStep === 0 && (
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </Box>
    </Paper>
  );
};

/**
 * Renders the first step for selecting claims to process
 */
function SelectClaimsStep({ selectedClaims, onClaimSelection, initialClaims }: { selectedClaims: ClaimSummary[]; onClaimSelection: (claims: ClaimSummary[]) => void; initialClaims?: ClaimSummary[] }): JSX.Element {
  // Render a Box container for the step content
  return (
    <Box>
      {/* Render instructions for selecting claims */}
      <Typography variant="body1" paragraph>
        Select the claims you want to process in this batch.
      </Typography>

      {/* Render ClaimList component with selection capability */}
      <ClaimList selectable onSelectionChange={onClaimSelection} initialClaims={initialClaims} />
    </Box>
  );
}

/**
 * Renders the second step for reviewing and validating selected claims
 */
function ReviewValidateStep({ selectedClaims, validationResults, onValidate, loading }: { selectedClaims: ClaimSummary[]; validationResults: ClaimValidationResponse | null; onValidate: () => void; loading: boolean }): JSX.Element {
  // Render a Box container for the step content
  return (
    <Box>
      {/* Render instructions for reviewing and validating claims */}
      <Typography variant="body1" paragraph>
        Review the selected claims and validate them before submission.
      </Typography>

      {/* Render a summary of selected claims (count, total amount) */}
      <Typography variant="subtitle1">
        Selected Claims: {selectedClaims.length}
      </Typography>
      <Typography variant="body2">
        Total Amount: {formatCurrency(selectedClaims.reduce((sum, claim) => sum + claim.totalAmount, 0))}
      </Typography>

      {/* Render a button to validate claims if not yet validated */}
      {!validationResults && (
        <Button variant="contained" onClick={onValidate} disabled={loading}>
          Validate Claims
        </Button>
      )}

      {/* If loading, render a loading indicator */}
      {loading && <CircularProgress />}

      {/* If validationResults exist, render validation summary */}
      {validationResults && (
        <ValidationResultsSummary validationResults={validationResults} />
      )}

      {/* If validationResults exist, render detailed validation results for each claim */}
      {validationResults && (
        <ValidationResultsDetail validationResults={validationResults} selectedClaims={selectedClaims} />
      )}
    </Box>
  );
}

/**
 * Renders the third step for submitting validated claims
 */
function SubmitClaimsStep({ selectedClaims, validationResults, submissionData, batchResults, onSubmissionDataChange, onSubmit, loading }: { selectedClaims: ClaimSummary[]; validationResults: ClaimValidationResponse | null; submissionData: BatchSubmitClaimsDto; batchResults: ClaimBatchResult | null; onSubmissionDataChange: (data: BatchSubmitClaimsDto) => void; onSubmit: () => void; loading: boolean }): JSX.Element {
  // Render a Box container for the step content
  return (
    <Box>
      {/* Render instructions for submitting claims */}
      <Typography variant="body1" paragraph>
        Enter the submission details and submit the validated claims.
      </Typography>

      {/* Render form for submission data (submission method, date, notes) */}
      <SubmissionForm submissionData={submissionData} onSubmissionDataChange={onSubmissionDataChange} />

      {/* Render a summary of claims to be submitted */}
      <Typography variant="subtitle1">
        Claims to Submit: {selectedClaims.length}
      </Typography>

      {/* Render a submit button if not yet submitted */}
      {!batchResults && (
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          Submit Claims
        </Button>
      )}

      {/* If loading, render a loading indicator */}
      {loading && <CircularProgress />}

      {/* If batchResults exist, render submission results */}
      {batchResults && (
        <SubmissionResults batchResults={batchResults} />
      )}
    </Box>
  );
}

/**
 * Renders a summary of validation results
 */
function ValidationResultsSummary({ validationResults }: { validationResults: ClaimValidationResponse }): JSX.Element {
  // Render a Box container for the validation summary
  return (
    <Box>
      {/* Display overall validation status (valid/invalid) */}
      <Typography variant="subtitle1">
        Validation Summary:
      </Typography>

      {/* Display count of total errors and warnings */}
      <Typography variant="body2">
        Total Errors: {validationResults.totalErrors}
      </Typography>
      <Typography variant="body2">
        Total Warnings: {validationResults.totalWarnings}
      </Typography>

      {/* If validation failed, render an Alert with error message */}
      {!validationResults.isValid && (
        <Alert severity="error">
          <AlertTitle>Validation Failed</AlertTitle>
          Some claims have validation errors. Please review and fix them before submitting.
        </Alert>
      )}

      {/* If validation passed with warnings, render a warning Alert */}
      {validationResults.isValid && validationResults.totalWarnings > 0 && (
        <Alert severity="warning">
          <AlertTitle>Validation Passed with Warnings</AlertTitle>
          Some claims have warnings. Please review them before submitting.
        </Alert>
      )}

      {/* If validation passed without warnings, render a success Alert */}
      {validationResults.isValid && validationResults.totalWarnings === 0 && (
        <Alert severity="success">
          <AlertTitle>Validation Passed</AlertTitle>
          All claims are valid and ready for submission.
        </Alert>
      )}
    </Box>
  );
}

/**
 * Renders detailed validation results for each claim
 */
function ValidationResultsDetail({ validationResults, selectedClaims }: { validationResults: ClaimValidationResponse; selectedClaims: ClaimSummary[] }): JSX.Element {
  // Render a Box container for the validation details
  return (
    <Box mt={2}>
      {/* Group validation results by claim */}
      {selectedClaims.map(claim => {
        const claimResult = validationResults.results.find(result => result.claimId === claim.id);
        return (
          <Box key={claim.id} mb={2}>
            {/* For each claim, render a section with claim details */}
            <Typography variant="subtitle2">
              Claim #{claim.claimNumber} - {claim.clientName} - {formatCurrency(claim.totalAmount)}
            </Typography>

            {/* Display validation status for the claim */}
            <Typography variant="body2">
              Status: {claimResult?.isValid ? 'Valid' : 'Invalid'}
            </Typography>

            {/* List all errors and warnings for the claim */}
            {claimResult?.errors.length > 0 && (
              <Box ml={2}>
                <Typography variant="body2" color="error">
                  Errors:
                </Typography>
                <ul>
                  {claimResult.errors.map(error => (
                    <li key={error.code}>{error.message}</li>
                  ))}
                </ul>
              </Box>
            )}
            {claimResult?.warnings.length > 0 && (
              <Box ml={2}>
                <Typography variant="body2" color="warning">
                  Warnings:
                </Typography>
                <ul>
                  {claimResult.warnings.map(warning => (
                    <li key={warning.code}>{warning.message}</li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Renders a form for entering claim submission data
 */
function SubmissionForm({ submissionData, onSubmissionDataChange }: { submissionData: BatchSubmitClaimsDto; onSubmissionDataChange: (data: BatchSubmitClaimsDto) => void }): JSX.Element {
  // Render a Box container for the submission form
  return (
    <Box>
      {/* Render a dropdown for selecting submission method */}
      <Typography variant="subtitle2">Submission Method</Typography>
      <select
        value={submissionData.submissionMethod}
        onChange={(e) => onSubmissionDataChange({ ...submissionData, submissionMethod: e.target.value })}
      >
        {Object.entries(SUBMISSION_METHODS).map(([key, value]) => (
          <option key={key} value={key}>{value}</option>
        ))}
      </select>

      {/* Render a date picker for submission date */}
      <Typography variant="subtitle2">Submission Date</Typography>
      <input
        type="date"
        value={submissionData.submissionDate}
        onChange={(e) => onSubmissionDataChange({ ...submissionData, submissionDate: e.target.value })}
      />

      {/* Render a text field for notes */}
      <Typography variant="subtitle2">Notes</Typography>
      <textarea
        value={submissionData.notes || ''}
        onChange={(e) => onSubmissionDataChange({ ...submissionData, notes: e.target.value })}
      />
    </Box>
  );
}

/**
 * Renders the results of a batch claim submission
 */
function SubmissionResults({ batchResults }: { batchResults: ClaimBatchResult }): JSX.Element {
  // Render a Box container for the submission results
  return (
    <Box>
      {/* Display summary of submission results */}
      <Typography variant="subtitle1">Submission Results:</Typography>
      <Typography variant="body2">Total Processed: {batchResults.totalProcessed}</Typography>
      <Typography variant="body2">Successful: {batchResults.successCount}</Typography>
      <Typography variant="body2">Failed: {batchResults.errorCount}</Typography>

      {/* If there are errors, render an Alert with error details */}
      {batchResults.errors.length > 0 && (
        <Alert severity="error">
          <AlertTitle>Submission Errors</AlertTitle>
          <ul>
            {batchResults.errors.map(error => (
              <li key={error.claimId}>Claim {error.claimId}: {error.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* If all claims were successful, render a success Alert */}
      {batchResults.errorCount === 0 && (
        <Alert severity="success">
          <AlertTitle>Submission Successful</AlertTitle>
          All claims were submitted successfully!
        </Alert>
      )}
    </Box>
  );
}

export default BatchClaimProcess;

// Export the BatchClaimProcess component as the default export
export type { BatchClaimProcessProps };