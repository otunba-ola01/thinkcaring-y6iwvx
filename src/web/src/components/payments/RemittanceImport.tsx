import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material'; // v5.13.0
import { CloudUpload, CheckCircle } from '@mui/icons-material'; // v5.11.16
import FileUploader from '../ui/FileUploader';
import Card from '../ui/Card';
import Stepper from '../ui/Stepper';
import usePayments from '../../hooks/usePayments';
import useToast from '../../hooks/useToast';
import { RemittanceFileType, ImportRemittanceDto } from '../../types/payments.types';

/**
 * Interface defining the props for the RemittanceImport component
 */
interface RemittanceImportProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Component for importing and processing remittance advice files
 * @param {RemittanceImportProps} props - The component props
 * @returns {JSX.Element} The rendered RemittanceImport component
 */
const RemittanceImport: React.FC<RemittanceImportProps> = ({ onComplete, onCancel }) => {
  // Initialize state for activeStep, selectedFileType, selectedFile, payerId, and mappingConfig
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedFileType, setSelectedFileType] = useState<RemittanceFileType>(RemittanceFileType.EDI_835);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [payerId, setPayerId] = useState<string>('');
  const [mappingConfig, setMappingConfig] = useState<Record<string, string> | null>(null);

  // Get importRemittance, remittanceResult, clearRemittanceResult, and isLoading from usePayments hook
  const { importRemittance, remittanceResult, clearRemittanceResult, isLoading } = usePayments();

  // Get toast notification functions from useToast hook
  const toast = useToast();

  // Define steps for the import process: 'Select File Type', 'Upload File', 'Map Fields', 'Process Remittance'
  const steps = ['Select File Type', 'Upload File', 'Map Fields', 'Process Remittance'];

  /**
   * Create handleFileTypeChange function to update selectedFileType state
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleFileTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFileType(event.target.value as RemittanceFileType);
  };

  /**
   * Create handleFileUpload function to store the uploaded file
   * @param {File[]} files - The uploaded files
   */
  const handleFileUpload = (files: File[]) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  /**
   * Create handlePayerChange function to update the selected payer
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handlePayerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPayerId(event.target.value);
  };

  /**
   * Create handleMappingChange function to update field mappings for custom file formats
   * @param {string} field - The field to map
   * @param {string} value - The value to map to
   */
  const handleMappingChange = (field: string, value: string) => {
    setMappingConfig(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Create handleProcessRemittance function to submit the file for processing
   */
  const handleProcessRemittance = () => {
    if (!selectedFile || !payerId) {
      toast.warning('Please select a file and a payer.');
      return;
    }

    const importData: ImportRemittanceDto = {
      payerId,
      fileType: selectedFileType,
      file: selectedFile,
      mappingConfig: selectedFileType === RemittanceFileType.CUSTOM ? mappingConfig : null,
    };

    importRemittance(importData);
  };

  /**
   * Create handleReset function to reset the form and start over
   */
  const handleReset = () => {
    setActiveStep(0);
    setSelectedFileType(RemittanceFileType.EDI_835);
    setSelectedFile(null);
    setPayerId('');
    setMappingConfig(null);
    clearRemittanceResult();
  };

  /**
   * Create handleNextStep and handlePrevStep functions to navigate through the steps
   */
  const handleNextStep = () => {
    setActiveStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setActiveStep(prev => prev - 1);
  };

  /**
   * Create renderStepContent function to render the appropriate content for each step
   * @param {number} step - The current step
   * @returns {JSX.Element | null} The content for the current step
   */
  const renderStepContent = (step: number): JSX.Element | null => {
    switch (step) {
      // For Step 1, render file type selection dropdown
      case 0:
        return (
          <FormControl fullWidth>
            <InputLabel id="file-type-select-label">File Type</InputLabel>
            <Select
              labelId="file-type-select-label"
              id="file-type-select"
              value={selectedFileType}
              label="File Type"
              onChange={handleFileTypeChange}
            >
              <MenuItem value={RemittanceFileType.EDI_835}>EDI 835</MenuItem>
              <MenuItem value={RemittanceFileType.CSV}>CSV</MenuItem>
              <MenuItem value={RemittanceFileType.EXCEL}>Excel</MenuItem>
              <MenuItem value={RemittanceFileType.PDF}>PDF</MenuItem>
              <MenuItem value={RemittanceFileType.CUSTOM}>Custom</MenuItem>
            </Select>
          </FormControl>
        );
      // For Step 2, render FileUploader component and payer selection
      case 1:
        return (
          <>
            <FileUploader
              acceptedTypes={['.txt', '.835', '.csv', '.xlsx', '.pdf']}
              maxSize={10485760} // 10MB
              onUpload={handleFileUpload}
              multiple={false}
            />
            <TextField
              fullWidth
              label="Payer ID"
              value={payerId}
              onChange={handlePayerChange}
              margin="normal"
            />
          </>
        );
      // For Step 3, render field mapping form if needed (for custom file formats)
      case 2:
        if (selectedFileType === RemittanceFileType.CUSTOM) {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Claim Number Field"
                  value={mappingConfig?.claimNumber || ''}
                  onChange={(e) => handleMappingChange('claimNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Amount Field"
                  value={mappingConfig?.paymentAmount || ''}
                  onChange={(e) => handleMappingChange('paymentAmount', e.target.value)}
                />
              </Grid>
            </Grid>
          );
        }
        return <Typography>No mapping required for selected file type.</Typography>;
      // For Step 4, render processing status and results
      case 3:
        return (
          <>
            {/* Show loading indicator when processing */}
            {isLoading && (
              <Box display="flex" justifyContent="center" alignItems="center">
                <CircularProgress />
                <Typography variant="body1" ml={2}>Processing Remittance...</Typography>
              </Box>
            )}

            {/* Show success message and summary when processing is complete */}
            {remittanceResult && (
              <Alert severity="success">
                <AlertTitle>Remittance Processed Successfully</AlertTitle>
                <Typography>
                  {remittanceResult.detailsProcessed} remittance details processed.
                </Typography>
                <Typography>
                  {remittanceResult.claimsMatched} claims matched.
                </Typography>
                <Typography>
                  Total Amount: ${remittanceResult.totalAmount}
                </Typography>
              </Alert>
            )}
          </>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (remittanceResult && onComplete) {
      onComplete();
    }
  }, [remittanceResult, onComplete]);

  useEffect(() => {
    if (activeStep > 0 && selectedFileType !== RemittanceFileType.CUSTOM) {
      setMappingConfig(null);
    }
  }, [activeStep, selectedFileType]);

  // Render the Card component containing the Stepper and step content
  return (
    <Card title="Import Remittance Advice">
      <Stepper steps={steps} activeStep={activeStep} onStepChange={setActiveStep} />
      <Divider sx={{ my: 2 }} />
      <Box sx={{ mt: 2 }}>
        {renderStepContent(activeStep)}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handlePrevStep}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessRemittance}
            disabled={isLoading}
            startIcon={isLoading ? null : <CheckCircle />}
          >
            {isLoading ? 'Processing...' : 'Complete'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextStep}
            disabled={!selectedFile && activeStep === 1}
          >
            Next
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default RemittanceImport;