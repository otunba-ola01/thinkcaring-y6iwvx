import React from 'react'; // v18.2.0
import { useRouter } from 'next/router'; // v13.4.0
import {
  Box,
  Typography,
  Button,
  Divider,
  Grid,
  Paper,
  Chip
} from '@mui/material'; // v5.13.0
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'; // v5.13.0

import Card from '../ui/Card';
import AlertNotification from '../ui/AlertNotification';
import { BillingSubmissionResponse } from '../../types/billing.types';
import { ClaimStatus } from '../../types/claims.types';

/**
 * Interface for the SubmissionConfirmation component props
 */
interface SubmissionConfirmationProps {
  /**
   * The result of the billing submission process containing confirmation details
   */
  submissionResult: BillingSubmissionResponse;
  
  /**
   * Optional callback function for returning to the billing dashboard
   */
  onBackToDashboard?: () => void;
}

/**
 * A component that displays confirmation details after a successful claim submission
 * in the billing workflow. Shows submission status, confirmation number, 
 * submission date, and claim details, along with options to view the claim
 * or return to the billing dashboard.
 *
 * @param {SubmissionConfirmationProps} props - The component props
 * @returns {JSX.Element} The rendered confirmation component
 */
const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({
  submissionResult,
  onBackToDashboard
}) => {
  const router = useRouter();

  // Handler for navigating to claim detail page
  const handleViewClaim = () => {
    router.push(`/claims/${submissionResult.claimId}`);
  };

  // Handler for returning to the billing dashboard
  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      router.push('/billing');
    }
  };

  return (
    <Card
      elevation={2}
      sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}
    >
      <Box sx={{ mb: 3 }}>
        <AlertNotification
          message={submissionResult.message || "Claim submitted successfully!"}
          severity="success"
        />
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          color: 'success.main'
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 40, mr: 2 }} />
        <Box>
          <Typography variant="h5" component="h2">
            Submission Successful
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your claim has been successfully submitted for processing.
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Submission Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Confirmation Number
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {submissionResult.confirmationNumber || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Submission Date
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {new Date(submissionResult.submissionDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Claim ID
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {submissionResult.claimId}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Chip 
              label={ClaimStatus.SUBMITTED}
              color="primary"
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Grid>
        </Grid>
      </Paper>

      {submissionResult.validationResult && submissionResult.validationResult.warnings.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
          <Typography variant="subtitle2" color="warning.dark" gutterBottom>
            Submission Warnings
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {submissionResult.validationResult.warnings.map((warning, index) => (
              <Typography component="li" variant="body2" key={index}>
                {warning.message}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<VisibilityIcon />}
          onClick={handleViewClaim}
        >
          View Claim
        </Button>
      </Box>
    </Card>
  );
};

export default SubmissionConfirmation;