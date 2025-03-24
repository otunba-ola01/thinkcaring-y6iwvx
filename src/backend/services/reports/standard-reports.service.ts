# src/backend/services/reports/standard-reports.service.ts
```typescript
import { logger } from '../../utils/logger'; // winston 3.8.2
import { ReportType, ReportParameters, ReportData, ReportVisualization, ReportSummaryMetric, ChartType, MetricTrend } from '../../types/reports.types';
import { UUID, DateRange, Money } from '../../types/common.types';
import { ClaimStatus } from '../../types/claims.types';
import { PaymentStatus, ReconciliationStatus } from '../../types/payments.types';
import { BusinessError } from '../../errors/business-error';
import { dateUtils } from '../../utils/date';
import { mathUtils } from '../../utils/math';
import { formatUtils } from '../../utils/formatter';
import { claimRepository } from '../../database/repositories/claim.repository';
import { paymentRepository } from '../../database/repositories/payment.repository';
import { programRepository } from '../../database/repositories/program.repository';
import { payerRepository } from '../../database/repositories/payer.repository';

/**
 * Service for generating standard financial reports in the HCBS Revenue Management System
 */
export class StandardReportsService {
  /**
   * Creates a new instance of the StandardReportsService
   * @param claimRepository 
   * @param paymentRepository 
   * @param programRepository 
   * @param payerRepository 
   */
  constructor(
    private claimRepository: typeof claimRepository,
    private paymentRepository: typeof paymentRepository,
    private programRepository: typeof programRepository,
    private payerRepository: typeof payerRepository
  ) {
    // Initialize repository dependencies
  }

  /**
   * Generates a standard report based on report type and parameters
   * @param reportType 
   * @param parameters 
   * @returns The generated report data
   */
  async generateReport(reportType: ReportType, parameters: ReportParameters): Promise<ReportData> {
    logger.debug(`Generating report: ${reportType} with parameters:`, parameters);

    // Validate report parameters
    if (!reportType || !parameters) {
      throw new BusinessError('Report type and parameters are required', null, 'report.missing_parameters');
    }

    // Convert timeFrame to DateRange if needed
    if (parameters.timeFrame && parameters.timeFrame !== 'custom' && !parameters.dateRange) {
      parameters.dateRange = dateUtils.getDateRangeFromPreset(parameters.timeFrame);
    }

    switch (reportType) {
      case ReportType.REVENUE_BY_PROGRAM:
        return this.generateRevenueByProgramReport(parameters);
      case ReportType.REVENUE_BY_PAYER:
        return this.generateRevenueByPayerReport(parameters);
      case ReportType.CLAIMS_STATUS:
        return this.generateClaimsStatusReport(parameters);
      case ReportType.AGING_ACCOUNTS_RECEIVABLE:
        return this.generateAgingAccountsReceivableReport(parameters);
      case ReportType.DENIAL_ANALYSIS:
        return this.generateDenialAnalysisReport(parameters);
      case ReportType.PAYER_PERFORMANCE:
        return this.generatePayerPerformanceReport(parameters);
      case ReportType.SERVICE_UTILIZATION:
        return this.generateServiceUtilizationReport(parameters);
      default:
        throw new BusinessError(`Unsupported report type: ${reportType}`, null, 'report.unsupported_type');
    }
  }

  /**
   * Generates a report showing revenue breakdown by program
   * @param parameters 
   * @returns The revenue by program report data
   */
  async generateRevenueByProgramReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Revenue by Program Report with parameters:', parameters);

    // Get date range from parameters
    const { dateRange } = parameters;
    if (!dateRange) {
      throw new BusinessError('Date range is required for Revenue by Program Report', null, 'report.missing_date_range');
    }

    // Get previous period date range for comparison
    const previousPeriodDateRange = dateUtils.getPreviousPeriodDateRange(dateRange.startDate, dateRange.endDate);

    // Get program list from programRepository
    const programList = await this.programRepository.findAllSummary();

    // Get revenue data by program for current period
    const revenueData = await this.programRepository.getRevenueByProgram(
      new Date(dateRange.startDate),
      new Date(dateRange.endDate)
    );

    // Get revenue data by program for previous period
    const previousRevenueData = await this.programRepository.getRevenueByProgram(
      new Date(previousPeriodDateRange.startDate),
      new Date(previousPeriodDateRange.endDate)
    );

    // Calculate total revenue for current and previous periods
    const totalRevenue = mathUtils.calculateSum(revenueData.map(item => item.revenue));
    const totalPreviousRevenue = mathUtils.calculateSum(previousRevenueData.map(item => item.revenue));

    // Calculate percentage change in revenue
    const revenueChange = mathUtils.calculateChange(totalRevenue, totalPreviousRevenue);

    // Calculate percentage of total for each program
    const programData = programList.map(program => {
      const programRevenue = revenueData.find(item => item.programId === program.id)?.revenue || 0;
      const percentOfTotal = mathUtils.calculatePercentage(programRevenue, totalRevenue);
      return {
        programId: program.id,
        programName: program.name,
        revenue: programRevenue,
        percentOfTotal
      };
    });

    // Create summary metrics (total revenue, YoY change, etc.)
    const summaryMetrics: ReportSummaryMetric[] = [
      this.createSummaryMetric('Total Revenue', formatUtils.formatCurrency(totalRevenue), formatUtils.formatCurrency(totalPreviousRevenue), 'currency'),
      this.createSummaryMetric('YoY Change', revenueChange, null, 'percentage')
    ];

    // Create visualizations (bar chart for program comparison, trend line for monthly data)
    const visualizations: ReportVisualization[] = [
      this.createVisualization(
        'revenue_by_program_bar',
        'Revenue by Program',
        ChartType.BAR,
        'revenue',
        { xAxis: { key: 'programName', label: 'Program' }, yAxis: { key: 'revenue', label: 'Revenue' } },
        programData.map(item => ({ key: item.programName, label: item.programName })),
        { }
      )
    ];

    // Format data for report
    const data = {
      revenueByProgram: programData
    };

    // Create and return ReportData object with metadata, summaryMetrics, visualizations, and data
    const metadata = this.createReportMetadata(ReportType.REVENUE_BY_PROGRAM, parameters);
    return {
      metadata,
      summaryMetrics,
      visualizations,
      data
    };
  }

  /**
   * Generates a report showing revenue breakdown by payer
   * @param parameters 
   * @returns The revenue by payer report data
   */
  async generateRevenueByPayerReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Revenue by Payer Report with parameters:', parameters);
    return {} as ReportData;
  }

  /**
   * Generates a report showing claims by status
   * @param parameters 
   * @returns The claims status report data
   */
  async generateClaimsStatusReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Claims Status Report with parameters:', parameters);
    return {} as ReportData;
  }

  /**
   * Generates a report showing aging accounts receivable
   * @param parameters 
   * @returns The aging accounts receivable report data
   */
  async generateAgingAccountsReceivableReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Aging Accounts Receivable Report with parameters:', parameters);
    return {} as ReportData;
  }

  /**
   * Generates a report analyzing claim denials
   * @param parameters 
   * @returns The denial analysis report data
   */
  async generateDenialAnalysisReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Denial Analysis Report with parameters:', parameters);
    return {} as ReportData;
  }

  /**
   * Generates a report comparing payer performance metrics
   * @param parameters 
   * @returns The payer performance report data
   */
  async generatePayerPerformanceReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Payer Performance Report with parameters:', parameters);
    return {} as ReportData;
  }

  /**
   * Generates a report showing service utilization metrics
   * @param parameters 
   * @returns The service utilization report data
   */
  async generateServiceUtilizationReport(parameters: ReportParameters): Promise<ReportData> {
    logger.debug('Generating Service Utilization Report with parameters:', parameters);
    return {} as ReportData;
  }

  /**
   * Creates metadata for a standard report
   * @param reportType 
   * @param parameters 
   * @returns The report metadata
   */
  createReportMetadata(reportType: ReportType, parameters: ReportParameters): object {
    // Create metadata object with report name based on report type
    let reportName: string;
    switch (reportType) {
      case ReportType.REVENUE_BY_PROGRAM:
        reportName = 'Revenue by Program';
        break;
      case ReportType.REVENUE_BY_PAYER:
        reportName = 'Revenue by Payer';
        break;
      case ReportType.CLAIMS_STATUS:
        reportName = 'Claims Status';
        break;
      case ReportType.AGING_ACCOUNTS_RECEIVABLE:
        reportName = 'Aging Accounts Receivable';
        break;
      case ReportType.DENIAL_ANALYSIS:
        reportName = 'Denial Analysis';
        break;
      case ReportType.PAYER_PERFORMANCE:
        reportName = 'Payer Performance';
        break;
      case ReportType.SERVICE_UTILIZATION:
        reportName = 'Service Utilization';
        break;
      default:
        reportName = 'Custom Report';
    }

    // Add report type to metadata
    const metadata = {
      reportName,
      reportType,
      generatedAt: new Date().toISOString(),
      parameters: parameters,
      organization: {
        id: 'org-123', // TODO: Replace with actual organization ID
        name: 'Thinkcaring' // TODO: Replace with actual organization name
      }
    };

    // Return complete metadata object
    return metadata;
  }

  /**
   * Creates a summary metric for report headers
   * @param label 
   * @param value 
   * @param previousValue 
   * @param format 
   * @returns Formatted summary metric
   */
  createSummaryMetric(label: string, value: number | string, previousValue: number | string | null, format: string): ReportSummaryMetric {
    // Calculate change if previousValue is provided
    let change: number | undefined;
    let trend: MetricTrend | undefined;

    if (previousValue !== null) {
      change = mathUtils.calculateChange(Number(value), Number(previousValue));
      if (change > 0) {
        trend = MetricTrend.UP;
      } else if (change < 0) {
        trend = MetricTrend.DOWN;
      } else {
        trend = MetricTrend.FLAT;
      }
    }

    // Create ReportSummaryMetric object with provided values
    const metric: ReportSummaryMetric = {
      label,
      value,
      previousValue,
      change,
      trend,
      format: format as 'currency' | 'percentage' | 'number' | 'date' | 'text'
    };

    // Return the formatted metric
    return metric;
  }

  /**
   * Creates a visualization configuration for reports
   * @param id 
   * @param title 
   * @param type 
   * @param dataKey 
   * @param axisConfig 
   * @param series 
   * @param options 
   * @returns Visualization configuration
   */
  createVisualization(
    id: string,
    title: string,
    type: ChartType,
    dataKey: string,
    axisConfig: { xAxis?: { key: string; label: string }; yAxis?: { key: string; label: string } },
    series: Array<{ key: string; label: string; color?: string }>,
    options: object = {}
  ): ReportVisualization {
    // Create ReportVisualization object with provided configuration
    const visualization: ReportVisualization = {
      id,
      title,
      type,
      dataKey,
      xAxis: axisConfig?.xAxis,
      yAxis: axisConfig?.yAxis,
      series,
      options
    };

    // Set default options if not provided
    visualization.options = options || {};

    // Return the visualization configuration
    return visualization;
  }
}

// Export the class instance
const standardReportsService = new StandardReportsService(claimRepository, paymentRepository, programRepository, payerRepository);

export { standardReportsService as StandardReportsService };