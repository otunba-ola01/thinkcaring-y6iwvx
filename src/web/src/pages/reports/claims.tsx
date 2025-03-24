import React, { useState, useCallback, useEffect } from 'react'; // react v18.2.0
import { useRouter } from 'next/router'; // next/router v13.4.0
import Head from 'next/head'; // next/head v13.4.0
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Grid, 
  Button, 
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material'; // @mui/material v5.13.0
import { 
  Assessment, 
  BarChart, 
  PieChart, 
  TableChart 
} from '@mui/icons-material'; // @mui/icons-material v5.13.0

import MainLayout from '../../components/layout/MainLayout';
import ReportParameters from '../../components/reports/ReportParameters';
import ReportViewer from '../../components/reports/ReportViewer';
import useReports from '../../hooks/useReports';
import { 
  ReportType, 
  ReportParameters as ReportParametersType,
  ReportFormat 
} from '../../types/reports.types';
import { ROUTES } from '../../constants/routes.constants';
import { NextPageWithLayout } from '../../types/common.types';
import useToast from '../../hooks/useToast';

interface TabOption {
  value: ReportType;
  label: string;
  icon: React.ReactNode;
}

const CLAIMS_REPORT_TYPES: ReportType[] = [
  ReportType.CLAIMS_STATUS,
  ReportType.DENIAL_ANALYSIS,
  ReportType.PAYER_PERFORMANCE,
];

const ClaimsReportsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { 
    generateReport, 
    currentReportData, 
    isGeneratingReport, 
    generationError,
    exportReport,
  } = useReports();
  const toast = useToast();

  const [selectedReportType, setSelectedReportType] = useState<ReportType>(ReportType.CLAIMS_STATUS);
  const [reportParameters, setReportParameters] = useState<ReportParametersType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReportTypeChange = (event: React.SyntheticEvent, newValue: ReportType) => {
    setSelectedReportType(newValue);
  };

  const handleParameterChange = (parameters: ReportParametersType) => {
    setReportParameters(parameters);
  };

  const handleGenerateReport = async (parameters: ReportParametersType) => {
    setLoading(true);
    try {
      if (!selectedReportType) {
        throw new Error('Report type is required');
      }
      await generateReport({
        reportType: selectedReportType,
        name: getClaimsReportTitle(selectedReportType),
        parameters: parameters,
        formats: [ReportFormat.PDF, ReportFormat.EXCEL],
        saveDefinition: false
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: ReportFormat) => {
    if (!currentReportData?.metadata?.id) {
      toast.error('No report data available to export');
      return;
    }
    try {
      await exportReport(currentReportData.metadata.id, format);
    } catch (error: any) {
      toast.error(error.message || 'Failed to export report');
    }
  };

  const handlePrintReport = () => {
    // Implement print functionality here
  };

  const handleScheduleReport = () => {
    router.push(ROUTES.REPORTS.SCHEDULER);
  };

  const handleBack = () => {
    router.push(ROUTES.REPORTS.ROOT);
  };

  useEffect(() => {
    // Initialize report type from query parameters
    const reportTypeFromQuery = router.query.reportType as ReportType;
    if (reportTypeFromQuery && Object.values(ReportType).includes(reportTypeFromQuery)) {
      setSelectedReportType(reportTypeFromQuery);
    }
  }, [router.query]);

  useEffect(() => {
    // Reset report data when report type changes
    // setReportData(null);
  }, [selectedReportType]);

  const tabOptions: TabOption[] = useMemo(() => CLAIMS_REPORT_TYPES.map(reportType => ({
    value: reportType,
    label: getClaimsReportTitle(reportType),
    icon: getClaimsReportTypeIcon(reportType)
  })), []);

  return (
    <>
      <Head>
        <title>Claims Reports - ThinkCaring</title>
      </Head>
      <Box>
        <Typography variant="h4" gutterBottom>
          Claims Reports
        </Typography>
        <Tabs value={selectedReportType} onChange={handleReportTypeChange} aria-label="claims report types">
          {tabOptions.map(option => (
            <Tab key={option.value} value={option.value} label={option.label} icon={option.icon} />
          ))}
        </Tabs>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <ReportParameters
              reportType={selectedReportType}
              initialParameters={{}}
              onChange={handleParameterChange}
              onSubmit={handleGenerateReport}
              title="Report Parameters"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            {isGeneratingReport ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
              </Box>
            ) : (
              <ReportViewer
                reportData={currentReportData}
                onExport={handleExportReport}
                onPrint={handlePrintReport}
                onSchedule={handleScheduleReport}
                onShare={() => {}}
                onBack={handleBack}
                loading={loading}
                error={generationError}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

ClaimsReportsPage.getLayout = (page) => (
  <MainLayout>{page}</MainLayout>
);

const getClaimsReportTypeIcon = (reportType: ReportType): JSX.Element => {
  switch (reportType) {
    case ReportType.CLAIMS_STATUS:
      return <Assessment />;
    case ReportType.DENIAL_ANALYSIS:
      return <PieChart />;
    case ReportType.PAYER_PERFORMANCE:
      return <BarChart />;
    default:
      return <TableChart />;
  }
};

const getClaimsReportTitle = (reportType: ReportType): string => {
  switch (reportType) {
    case ReportType.CLAIMS_STATUS:
      return 'Claims Status Report';
    case ReportType.DENIAL_ANALYSIS:
      return 'Denial Analysis Report';
    case ReportType.PAYER_PERFORMANCE:
      return 'Payer Performance Report';
    default:
      return 'Claims Report';
  }
};

export default ClaimsReportsPage;