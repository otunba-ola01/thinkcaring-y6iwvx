import React, { useState, useRef } from 'react';
// v18.2.0
// v18.2.0
import { Box, Grid, CircularProgress } from '@mui/material'; // v5.13.0
import { PictureAsPdf, TableView, Code, Print, Schedule } from '@mui/icons-material'; // v5.13.0

import ActionButton from '../ui/ActionButton';
import { ReportExportProps, ReportFormat, ReportData } from '../../types/reports.types';
import { exportReport } from '../../utils/export';
import { reportsApi } from '../../api/reports.api';

/**
 * Component that provides export functionality for reports in various formats.
 * This component renders a set of action buttons that allow users to export report data in their preferred format.
 *
 * @param props - The component props
 * @returns The rendered ReportExport component
 */
const ReportExport: React.FC<ReportExportProps> = ({
  reportData,
  reportRef,
  onSchedule,
  showSchedule,
  fileName
}) => {
  // Initialize loading state for each export format
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingJSON, setLoadingJSON] = useState(false);

  /**
   * Handles exporting the report in different formats.
   * Sets the loading state for the corresponding format, calls the exportReport utility function,
   * and resets the loading state after completion.
   * @param format - The format to export the report in
   */
  const handleExport = async (format: ReportFormat) => {
    try {
      switch (format) {
        case ReportFormat.PDF:
          setLoadingPDF(true);
          break;
        case ReportFormat.EXCEL:
          setLoadingExcel(true);
          break;
        case ReportFormat.CSV:
          setLoadingCSV(true);
          break;
        case ReportFormat.JSON:
          setLoadingJSON(true);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      await exportReport(reportData, format, fileName);
    } catch (error) {
      console.error('Error exporting report:', error);
      // Handle error appropriately (e.g., display an error message)
    } finally {
      setLoadingPDF(false);
      setLoadingExcel(false);
      setLoadingCSV(false);
      setLoadingJSON(false);
    }
  };

  /**
   * Handles printing the report.
   * Triggers the browser's print functionality to print the report content.
   */
  const handlePrint = () => {
    if (reportRef && reportRef.current) {
      window.print();
    } else {
      console.warn('No report ref available for printing.');
      // Optionally, display an error message to the user
    }
  };

  return (
    <Grid container spacing={2} alignItems="center">
      {/* PDF Export Button */}
      <Grid item>
        <ActionButton
          label="Export PDF"
          icon={loadingPDF ? <CircularProgress size={20} /> : <PictureAsPdf />}
          onClick={() => handleExport(ReportFormat.PDF)}
          disabled={loadingPDF}
          sx={{ minWidth: '120px' }}
        />
      </Grid>

      {/* Excel Export Button */}
      <Grid item>
        <ActionButton
          label="Export Excel"
          icon={loadingExcel ? <CircularProgress size={20} /> : <TableView />}
          onClick={() => handleExport(ReportFormat.EXCEL)}
          disabled={loadingExcel}
          sx={{ minWidth: '120px' }}
        />
      </Grid>

      {/* CSV Export Button */}
      <Grid item>
        <ActionButton
          label="Export CSV"
          icon={loadingCSV ? <CircularProgress size={20} /> : <Code />}
          onClick={() => handleExport(ReportFormat.CSV)}
          disabled={loadingCSV}
          sx={{ minWidth: '120px' }}
        />
      </Grid>

      {/* JSON Export Button */}
      <Grid item>
        <ActionButton
          label="Export JSON"
          icon={loadingJSON ? <CircularProgress size={20} /> : <Code />}
          onClick={() => handleExport(ReportFormat.JSON)}
          disabled={loadingJSON}
          sx={{ minWidth: '120px' }}
        />
      </Grid>

      {/* Print Button */}
      <Grid item>
        <ActionButton
          label="Print"
          icon={<Print />}
          onClick={handlePrint}
          disabled={!reportRef || !reportRef.current}
          sx={{ minWidth: '100px' }}
        />
      </Grid>

      {/* Schedule Button (conditionally rendered) */}
      {showSchedule && (
        <Grid item>
          <ActionButton
            label="Schedule"
            icon={<Schedule />}
            onClick={onSchedule}
            sx={{ minWidth: '120px' }}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default ReportExport;