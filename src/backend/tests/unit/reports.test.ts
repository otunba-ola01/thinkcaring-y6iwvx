import { ReportsService } from '../../services/reports.service'; // Import ReportsService for testing
import { StandardReportsService } from '../../services/reports/standard-reports.service'; // Import StandardReportsService for mocking
import { CustomReportsService } from '../../services/reports/custom-reports.service'; // Import CustomReportsService for mocking
import { ScheduledReportsService } from '../../services/reports/scheduled-reports.service'; // Import ScheduledReportsService for mocking
import { ReportExportService } from '../../services/reports/export.service'; // Import ReportExportService for mocking
import { FinancialMetricsService } from '../../services/reports/financial-metrics.service'; // Import FinancialMetricsService for mocking
import { ReportType, ReportParameters, ReportData, ReportFormat, ScheduleFrequency, TimeFrame, FinancialMetric, MetricTrend } from '../../types/reports.types'; // Import type definitions for reports
import { DateRange, UUID } from '../../types/common.types'; // Import common type definitions
import { BusinessError } from '../../errors/business-error'; // Import BusinessError for testing error handling
import { NotFoundError } from '../../errors/not-found-error'; // Import NotFoundError for testing error handling

// Mock the dependencies of ReportsService
jest.mock('../../services/reports/standard-reports.service');
jest.mock('../../services/reports/custom-reports.service');
jest.mock('../../services/reports/scheduled-reports.service');
jest.mock('../../services/reports/export.service');
jest.mock('../../services/reports/financial-metrics.service');
jest.mock('../../models/report.model');

/**
 * Creates a mock instance of the ReportsService with all dependencies mocked
 * @returns {ReportsService} Mock ReportsService instance with mocked dependencies
 */
const createMockReportsService = (): ReportsService => {
  // Create mock instances of all dependencies (StandardReportsService, CustomReportsService, etc.)
  const mockStandardReportsService = new StandardReportsService(null, null, null, null);
  const mockCustomReportsService = new CustomReportsService(null, null, null, null, null);
  const mockScheduledReportsService = new ScheduledReportsService(null, null, null, null, null, null);
  const mockReportExportService = new ReportExportService();
  const mockFinancialMetricsService = new FinancialMetricsService();

  // Create mock instances of all repositories
  const mockReportDefinitionModel: any = {};
  const mockReportInstanceModel: any = {};

  // Create a new ReportsService instance with the mocked dependencies
  const reportsService = new ReportsService(
    mockStandardReportsService,
    mockCustomReportsService,
    mockScheduledReportsService,
    mockReportExportService,
    mockFinancialMetricsService,
    mockReportDefinitionModel,
    mockReportInstanceModel
  );

  // Return the configured ReportsService instance
  return reportsService;
};

/**
 * Creates mock report data for testing
 * @param {ReportType} reportType - The type of report to create mock data for
 * @returns {ReportData} Mock report data for the specified report type
 */
const createMockReportData = (reportType: ReportType): ReportData => {
  // Create mock metadata with report name, type, and generation timestamp
  const metadata = {
    reportName: 'Mock Report',
    reportType: reportType,
    generatedAt: new Date().toISOString(),
    parameters: {} as ReportParameters,
    organization: { id: 'org-123', name: 'Thinkcaring' }
  };

  // Create mock summary metrics appropriate for the report type
  const summaryMetrics = [
    { label: 'Total Revenue', value: 1000000, format: 'currency' },
    { label: 'Claims Submitted', value: 500, format: 'number' }
  ];

  // Create mock visualizations appropriate for the report type
  const visualizations = [
    { id: 'chart-1', title: 'Revenue by Program', type: 'bar', dataKey: 'revenueData', xAxis: { key: 'program', label: 'Program' }, yAxis: { key: 'revenue', label: 'Revenue' }, series: [] }
  ];

  // Create mock data appropriate for the report type
  const data = {
    revenueData: [
      { program: 'Personal Care', revenue: 400000 },
      { program: 'Residential', revenue: 300000 },
      { program: 'Day Services', revenue: 300000 }
    ]
  };

  // Return the complete ReportData object
  return {
    metadata,
    summaryMetrics,
    visualizations,
    data
  };
};

/**
 * Creates mock financial metrics for testing
 * @param {string} category - The category of metrics to create (revenue, claims, payments)
 * @returns {FinancialMetric[]} Array of mock financial metrics for the specified category
 */
const createMockFinancialMetrics = (category: string): FinancialMetric[] => {
  // Create mock metrics appropriate for the specified category (revenue, claims, payments)
  let metrics: FinancialMetric[] = [];
  if (category === 'revenue') {
    metrics = [
      { id: 'totalRevenue', name: 'Total Revenue', description: 'Total revenue generated', category: 'revenue', value: 1000000, previousValue: 900000, change: 11.11, trend: MetricTrend.UP, format: 'currency', target: 1200000, threshold: { warning: 1100000, critical: 1000000 } },
      { id: 'averageRevenuePerClient', name: 'Average Revenue per Client', description: 'Average revenue generated per client', category: 'revenue', value: 2500, previousValue: 2200, change: 13.64, trend: MetricTrend.UP, format: 'currency', target: 2700, threshold: { warning: 2300, critical: 2000 } }
    ];
  } else if (category === 'claims') {
    metrics = [
      { id: 'totalClaims', name: 'Total Claims', description: 'Total number of claims submitted', category: 'claims', value: 500, previousValue: 450, change: 11.11, trend: MetricTrend.UP, format: 'number', target: 550, threshold: { warning: 480, critical: 400 } },
      { id: 'cleanClaimRate', name: 'Clean Claim Rate', description: 'Percentage of claims submitted without errors', category: 'claims', value: 95, previousValue: 92, change: 3.26, trend: MetricTrend.UP, format: 'percentage', target: 98, threshold: { warning: 90, critical: 85 } }
    ];
  } else if (category === 'payments') {
    metrics = [
      { id: 'totalPayments', name: 'Total Payments', description: 'Total amount of payments received', category: 'payments', value: 800000, previousValue: 700000, change: 14.29, trend: MetricTrend.UP, format: 'currency', target: 900000, threshold: { warning: 750000, critical: 600000 } },
      { id: 'dso', name: 'Days Sales Outstanding (DSO)', description: 'Average number of days to collect payment', category: 'payments', value: 45, previousValue: 50, change: -10, trend: MetricTrend.DOWN, format: 'days', target: 40, threshold: { warning: 50, critical: 60 } }
    ];
  }

  // Set appropriate values, trends, and formats for each metric
  // Return the array of financial metrics
  return metrics;
};

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let mockStandardReportsService: StandardReportsService;
  let mockCustomReportsService: CustomReportsService;
  let mockScheduledReportsService: ScheduledReportsService;
  let mockReportExportService: ReportExportService;
  let mockFinancialMetricsService: FinancialMetricsService;
  let mockReportDefinitionModel: any;
  let mockReportInstanceModel: any;

  beforeEach(() => {
    reportsService = createMockReportsService();
    mockStandardReportsService = (reportsService as any).standardReportsService;
    mockCustomReportsService = (reportsService as any).customReportsService;
    mockScheduledReportsService = (reportsService as any).scheduledReportsService;
    mockReportExportService = (reportsService as any).reportExportService;
    mockFinancialMetricsService = (reportsService as any).financialMetricsService;
    mockReportDefinitionModel = (reportsService as any).reportDefinitionModel;
    mockReportInstanceModel = (reportsService as any).reportInstanceModel;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate a standard report when reportType is not CUSTOM', async () => {
      // Arrange
      const reportType = ReportType.REVENUE_BY_PROGRAM;
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;
      const mockReportData = createMockReportData(reportType);
      (mockStandardReportsService.generateReport as jest.Mock).mockResolvedValue(mockReportData);

      // Act
      const reportData = await reportsService.generateReport(reportType, parameters, {});

      // Assert
      expect(mockStandardReportsService.generateReport).toHaveBeenCalledWith(reportType, parameters);
      expect(reportData).toEqual(mockReportData);
    });

    it('should throw a BusinessError when reportType is CUSTOM', async () => {
      // Arrange
      const reportType = ReportType.CUSTOM;
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;

      // Act & Assert
      await expect(reportsService.generateReport(reportType, parameters, {})).rejects.toThrow(BusinessError);
      expect(mockStandardReportsService.generateReport).not.toHaveBeenCalled();
    });

    it('should throw a BusinessError when reportType or parameters are missing', async () => {
      // Act & Assert
      await expect(reportsService.generateReport(null, {} as any, {})).rejects.toThrow(BusinessError);
      await expect(reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, null, {})).rejects.toThrow(BusinessError);
    });

    it('should handle errors during report generation', async () => {
      // Arrange
      const reportType = ReportType.REVENUE_BY_PROGRAM;
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;
      (mockStandardReportsService.generateReport as jest.Mock).mockRejectedValue(new Error('Report generation failed'));

      // Act & Assert
      await expect(reportsService.generateReport(reportType, parameters, {})).rejects.toThrow('Report generation failed');
    });
  });

  describe('generateReportById', () => {
    it('should generate a standard report by definition ID when report type is not CUSTOM', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'report-def-123';
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;
      const mockReportDefinition = { id: reportDefinitionId, type: ReportType.REVENUE_BY_PROGRAM, parameters: {} };
      const mockReportData = createMockReportData(ReportType.REVENUE_BY_PROGRAM);
      (reportsService as any).getReportDefinition = jest.fn().mockResolvedValue(mockReportDefinition);
      (mockStandardReportsService.generateReport as jest.Mock).mockResolvedValue(mockReportData);

      // Act
      const reportData = await reportsService.generateReportById(reportDefinitionId, parameters, {});

      // Assert
      expect((reportsService as any).getReportDefinition).toHaveBeenCalledWith(reportDefinitionId);
      expect(mockStandardReportsService.generateReport).toHaveBeenCalledWith(ReportType.REVENUE_BY_PROGRAM, parameters);
      expect(reportData).toEqual(mockReportData);
    });

    it('should generate a custom report by definition ID when report type is CUSTOM', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'report-def-456';
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;
      const mockReportDefinition = { id: reportDefinitionId, type: ReportType.CUSTOM, parameters: {} };
      const mockReportData = createMockReportData(ReportType.CUSTOM);
      (reportsService as any).getReportDefinition = jest.fn().mockResolvedValue(mockReportDefinition);
      (mockCustomReportsService.generateCustomReport as jest.Mock).mockResolvedValue(mockReportData);

      // Act
      const reportData = await reportsService.generateReportById(reportDefinitionId, parameters, {});

      // Assert
      expect((reportsService as any).getReportDefinition).toHaveBeenCalledWith(reportDefinitionId);
      expect(mockCustomReportsService.generateCustomReport).toHaveBeenCalledWith(reportDefinitionId, parameters);
      expect(reportData).toEqual(mockReportData);
    });

    it('should throw a NotFoundError when report definition is not found', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'non-existent-id';
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;
      (reportsService as any).getReportDefinition = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(reportsService.generateReportById(reportDefinitionId, parameters, {})).rejects.toThrow(NotFoundError);
      expect(mockStandardReportsService.generateReport).not.toHaveBeenCalled();
      expect(mockCustomReportsService.generateCustomReport).not.toHaveBeenCalled();
    });

    it('should handle errors during report generation by definition ID', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'report-def-123';
      const parameters: ReportParameters = { timeFrame: TimeFrame.LAST_MONTH } as any;
      const mockReportDefinition = { id: reportDefinitionId, type: ReportType.REVENUE_BY_PROGRAM, parameters: {} };
      (reportsService as any).getReportDefinition = jest.fn().mockResolvedValue(mockReportDefinition);
      (mockStandardReportsService.generateReport as jest.Mock).mockRejectedValue(new Error('Report generation failed'));

      // Act & Assert
      await expect(reportsService.generateReportById(reportDefinitionId, parameters, {})).rejects.toThrow('Report generation failed');
    });
  });

  describe('exportReport', () => {
    it('should export a report successfully', async () => {
      // Arrange
      const reportData = createMockReportData(ReportType.REVENUE_BY_PROGRAM);
      const format = ReportFormat.PDF;
      const organizationId: UUID = 'org-123';
      const mockExportResult = { url: 'http://example.com/report.pdf', filename: 'report.pdf', storageKey: 'reports/org-123/report.pdf' };
      (mockReportExportService.exportReport as jest.Mock).mockResolvedValue(mockExportResult);

      // Act
      const exportResult = await reportsService.exportReport(reportData, format, organizationId);

      // Assert
      expect(mockReportExportService.exportReport).toHaveBeenCalledWith(reportData, format, organizationId);
      expect(exportResult).toEqual(mockExportResult);
    });

    it('should throw a BusinessError when report data is missing required sections', async () => {
      // Arrange
      const reportData = { metadata: null, data: null, visualizations: null } as any;
      const format = ReportFormat.PDF;
      const organizationId: UUID = 'org-123';

      // Act & Assert
      await expect(reportsService.exportReport(reportData, format, organizationId)).rejects.toThrow(BusinessError);
      expect(mockReportExportService.exportReport).not.toHaveBeenCalled();
    });

    it('should handle errors during report export', async () => {
      // Arrange
      const reportData = createMockReportData(ReportType.REVENUE_BY_PROGRAM);
      const format = ReportFormat.PDF;
      const organizationId: UUID = 'org-123';
      (mockReportExportService.exportReport as jest.Mock).mockRejectedValue(new Error('Export failed'));

      // Act & Assert
      await expect(reportsService.exportReport(reportData, format, organizationId)).rejects.toThrow('Export failed');
    });
  });

  describe('getFinancialMetrics', () => {
    it('should retrieve financial metrics successfully', async () => {
      // Arrange
      const timeFrame = TimeFrame.LAST_MONTH;
      const filters = {};
      const mockMetrics = createMockFinancialMetrics('revenue');
      (mockFinancialMetricsService.getFinancialMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      // Act
      const metrics = await reportsService.getFinancialMetrics(timeFrame, filters);

      // Assert
      expect(mockFinancialMetricsService.getFinancialMetrics).toHaveBeenCalledWith(timeFrame, filters);
      expect(metrics).toEqual(mockMetrics);
    });

    it('should handle errors during financial metrics retrieval', async () => {
      // Arrange
      const timeFrame = TimeFrame.LAST_MONTH;
      const filters = {};
      (mockFinancialMetricsService.getFinancialMetrics as jest.Mock).mockRejectedValue(new Error('Metrics retrieval failed'));

      // Act & Assert
      await expect(reportsService.getFinancialMetrics(timeFrame, filters)).rejects.toThrow('Metrics retrieval failed');
    });
  });

  describe('createScheduledReport', () => {
    it('should create a scheduled report successfully', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'report-def-123';
      const scheduledReport = { name: 'Weekly Revenue Report', frequency: ScheduleFrequency.WEEKLY } as any;
      const userId: UUID = 'user-123';
      const mockReportDefinition = { id: reportDefinitionId, organizationId: 'org-123' };
      const mockScheduledReport = { id: 'scheduled-report-123', ...scheduledReport, reportDefinitionId, organizationId: 'org-123' };
      (reportsService as any).getReportDefinition = jest.fn().mockResolvedValue(mockReportDefinition);
      (mockScheduledReportsService.createScheduledReport as jest.Mock).mockResolvedValue(mockScheduledReport);

      // Act
      const createdReport = await reportsService.createScheduledReport(reportDefinitionId, scheduledReport, userId);

      // Assert
      expect((reportsService as any).getReportDefinition).toHaveBeenCalledWith(reportDefinitionId);
      expect(mockScheduledReportsService.createScheduledReport).toHaveBeenCalledWith(reportDefinitionId, scheduledReport, userId);
      expect(createdReport).toEqual(mockScheduledReport);
    });

    it('should throw a NotFoundError when report definition is not found', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'non-existent-id';
      const scheduledReport = { name: 'Weekly Revenue Report', frequency: ScheduleFrequency.WEEKLY } as any;
      const userId: UUID = 'user-123';
      (reportsService as any).getReportDefinition = jest.fn().mockRejectedValue(new NotFoundError('Report definition not found', 'ReportDefinition', reportDefinitionId));

      // Act & Assert
      await expect(reportsService.createScheduledReport(reportDefinitionId, scheduledReport, userId)).rejects.toThrow(NotFoundError);
      expect(mockScheduledReportsService.createScheduledReport).not.toHaveBeenCalled();
    });

    it('should handle errors during scheduled report creation', async () => {
      // Arrange
      const reportDefinitionId: UUID = 'report-def-123';
      const scheduledReport = { name: 'Weekly Revenue Report', frequency: ScheduleFrequency.WEEKLY } as any;
      const userId: UUID = 'user-123';
      (reportsService as any).getReportDefinition = jest.fn().mockResolvedValue({});
      (mockScheduledReportsService.createScheduledReport as jest.Mock).mockRejectedValue(new Error('Scheduled report creation failed'));

      // Act & Assert
      await expect(reportsService.createScheduledReport(reportDefinitionId, scheduledReport, userId)).rejects.toThrow('Scheduled report creation failed');
    });
  });
});