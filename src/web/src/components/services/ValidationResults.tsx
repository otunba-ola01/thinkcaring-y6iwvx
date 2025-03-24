import React, { useMemo } from 'react'; // v18.2.0
import { 
  Box, 
  Typography, 
  Button, 
  Divider, 
  Collapse, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Chip 
} from '@mui/material'; // v5.13.0
import { SxProps, Theme } from '@mui/material'; // v5.13.0
import { 
  CheckCircle, 
  Error, 
  Warning, 
  Info, 
  ArrowForward 
} from '@mui/icons-material'; // v5.13.0

import Card from '../ui/Card';
import AlertNotification from '../ui/AlertNotification';
import { UUID } from '../../types/common.types';
import { ValidationError, ValidationWarning, Severity } from '../../types/common.types';
import { 
  BillingValidationResult, 
  BillingValidationResponse, 
  ServiceValidationError, 
  ServiceValidationWarning 
} from '../../types/billing.types';
import { 
  ServiceValidationResult, 
  ServiceValidationResponse 
} from '../../types/services.types';

/**
 * Props interface for the ValidationResults component
 */
export interface ValidationResultsProps {
  /** Validation response containing results for services */
  validationResponse: BillingValidationResponse | ServiceValidationResponse;
  /** Optional callback function when user wants to fix a service */
  onFixService?: (serviceId: UUID) => void;
  /** Optional sx prop for custom styling */
  sx?: SxProps<Theme>;
}

/**
 * Helper function to calculate summary statistics from validation results
 * 
 * @param validationResponse The validation response object containing results
 * @returns Object with summary statistics: total, valid, invalid, errorCount, warningCount
 */
const getValidationSummary = (
  validationResponse: BillingValidationResponse | ServiceValidationResponse
) => {
  const results = validationResponse.results;
  const total = results.length;
  const valid = results.filter(result => result.isValid).length;
  const invalid = results.filter(result => !result.isValid).length;
  const errorCount = results.reduce((count, result) => count + result.errors.length, 0);
  const warningCount = results.reduce((count, result) => count + result.warnings.length, 0);

  return {
    total,
    valid,
    invalid,
    errorCount,
    warningCount
  };
};

/**
 * Helper function to generate a readable label for a service
 * 
 * @param result The validation result for a service
 * @returns A formatted string representing the service
 */
const getServiceLabel = (result: BillingValidationResult | ServiceValidationResult): string => {
  return `Service ID: ${result.serviceId}`;
};

/**
 * Component that displays validation results for services, showing errors and warnings 
 * with appropriate UI elements. Used in the billing workflow to help users identify and 
 * fix issues before services can be converted to claims.
 * 
 * @param props Component props
 * @returns The rendered ValidationResults component
 */
const ValidationResults: React.FC<ValidationResultsProps> = ({
  validationResponse,
  onFixService,
  sx
}) => {
  // Calculate validation summary statistics using useMemo to optimize performance
  const summary = useMemo(() => getValidationSummary(validationResponse), [validationResponse]);

  return (
    <Box sx={{ ...sx }}>
      {/* Summary section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Validation Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip 
            label={`Total Services: ${summary.total}`} 
            variant="outlined" 
            color="default"
          />
          <Chip 
            label={`Valid: ${summary.valid}`} 
            variant="outlined" 
            color="success"
            icon={<CheckCircle fontSize="small" />}
          />
          {summary.invalid > 0 && (
            <Chip 
              label={`Invalid: ${summary.invalid}`} 
              variant="outlined" 
              color="error"
              icon={<Error fontSize="small" />}
            />
          )}
          {summary.errorCount > 0 && (
            <Chip 
              label={`Errors: ${summary.errorCount}`} 
              variant="outlined" 
              color="error"
              icon={<Error fontSize="small" />}
            />
          )}
          {summary.warningCount > 0 && (
            <Chip 
              label={`Warnings: ${summary.warningCount}`} 
              variant="outlined" 
              color="warning"
              icon={<Warning fontSize="small" />}
            />
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
      </Box>

      {/* Display success message if no errors or warnings */}
      {summary.errorCount === 0 && summary.warningCount === 0 ? (
        <AlertNotification
          message="All services passed validation! The services are ready to be processed."
          severity={Severity.SUCCESS}
        />
      ) : (
        // Display services with errors or warnings
        <Box>
          {validationResponse.results
            .filter(result => !result.isValid || result.warnings.length > 0)
            .map(result => (
              <Box key={result.serviceId} sx={{ mb: 3 }}>
                <Card
                  title={getServiceLabel(result)}
                  subtitle={result.isValid 
                    ? `Valid with ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}` 
                    : `Invalid with ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`
                  }
                  actions={
                    !result.isValid && onFixService ? (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => onFixService(result.serviceId)}
                        endIcon={<ArrowForward />}
                      >
                        Fix Issues
                      </Button>
                    ) : undefined
                  }
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Display errors */}
                    {result.errors.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          Errors:
                        </Typography>
                        {result.errors.map((error, index) => (
                          <AlertNotification
                            key={`error-${index}`}
                            message={error.message}
                            severity={Severity.ERROR}
                          />
                        ))}
                      </Box>
                    )}
                    
                    {/* Display warnings */}
                    {result.warnings.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="warning.main" gutterBottom>
                          Warnings:
                        </Typography>
                        {result.warnings.map((warning, index) => (
                          <AlertNotification
                            key={`warning-${index}`}
                            message={warning.message}
                            severity={Severity.WARNING}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
};

export default ValidationResults;