import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { z } from 'zod'; // v3.21.0
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  Box,
  Typography,
  Button
} from '@mui/material'; // v5.13.0
import {
  ReportType,
  ReportParameters,
} from '../../types/reports.types';
import { DateRange } from '../../types/common.types';
import ReportParametersForm from '../forms/ReportParametersForm';
import Card from '../ui/Card';
import useReports from '../../hooks/useReports';
import { getDefaultReportParameters } from '../../config/report.config';

/**
 * Interface defining the props for the ReportParameters component
 */
export interface ReportParametersProps {
  reportType: ReportType;
  initialParameters?: Partial<ReportParameters>;
  onChange: (parameters: ReportParameters) => void;
  onSubmit: (parameters: ReportParameters) => void;
  title: string;
  loading: boolean;
}

/**
 * A component that displays and manages report parameters
 * @param props - The props for the component
 * @returns Rendered component
 */
const ReportParameters: React.FC<ReportParametersProps> = ({
  reportType,
  initialParameters,
  onChange,
  onSubmit,
  title,
  loading,
}) => {
  // Initialize state for parameters
  const [parameters, setParameters] = useState<ReportParameters>(
    initialParameters as ReportParameters || getDefaultReportParameters(reportType)
  );

  // Create a handleParameterChange function to update parameters state
  const handleParameterChange = useCallback(
    (newParameters: ReportParameters) => {
      setParameters(newParameters);
      onChange(newParameters);
    },
    [onChange]
  );

  // Create a handleSubmit function to call onSubmit prop with current parameters
  const handleSubmit = useCallback(() => {
    onSubmit(parameters);
  }, [onSubmit, parameters]);

  // Use useEffect to update parameters when reportType or initialParameters change
  useEffect(() => {
    setParameters(
      initialParameters as ReportParameters || getDefaultReportParameters(reportType)
    );
  }, [reportType, initialParameters]);

  // Render the component
  return (
    <Card title={title} loading={loading}>
      <ReportParametersForm
        reportType={reportType}
        initialValues={parameters}
        onChange={handleParameterChange}
        onSubmit={handleSubmit}
      />
    </Card>
  );
};

export default ReportParameters;