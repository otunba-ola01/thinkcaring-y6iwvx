import { v4 as uuidv4 } from 'uuid'; // uuid ^9.0.0
import { jest } from 'jest'; // jest ^29.5.0
import { initializeDatabase, closeDatabase, getKnexInstance, transaction } from '../../database/connection';
import { ReportsService } from '../../services/reports.service';
import { StandardReportsService } from '../../services/reports/standard-reports.service';
import { CustomReportsService } from '../../services/reports/custom-reports.service';
import { ScheduledReportsService } from '../../services/reports/scheduled-reports.service';
import { ReportExportService } from '../../services/reports/export.service';
import { FinancialMetricsService } from '../../services/reports/financial-metrics.service';
import { ReportDefinitionModel, ReportInstanceModel } from '../../models/report.model';
import { ReportType, ReportParameters, ReportData, ReportFormat, ScheduleFrequency, ScheduledReport, TimeFrame, ReportDefinition, FinancialMetric, ReportCategory, ChartType } from '../../types/reports.types';
import { UUID, DateRange } from '../../types/common.types';
import { BusinessError } from '../../errors/business-error';
import { NotFoundError } from '../../errors/not-found-error';
import { mockUsers } from '../fixtures/users.fixtures';

describe('ReportsService Integration Tests', () => {
  let reportsService: ReportsService;
  let reportDefinitionId: UUID;
  let organizationId: UUID;
  let userId: UUID;

  beforeAll(async () => {
    await initializeDatabase();
    const testData = await setupTestReportData();
    reportDefinitionId = testData.reportDefinitionId;
    organizationId = testData.organizationId;
    userId = testData.userId;
    reportsService = new ReportsService(
      new StandardReportsService(null, null, null, null),
      new CustomReportsService(null, null, null, null, null),
      new ScheduledReportsService(null, null, null, null, null, null),
      new ReportExportService(),
      new FinancialMetricsService(),
      new ReportDefinitionModel(),
      new ReportInstanceModel()
    );
  });

  afterAll(async () => {
    await cleanupTestReportData();
    await closeDatabase();
  });

  it('should initialize database connection successfully', () => {
    expect(getKnexInstance()).toBeDefined();
  });

  it('should create report definition successfully', async () => {
    const reportDefinition: Partial<ReportDefinition> = {
      name: 'Test Report',
      description: 'Test report definition',
      type: ReportType.REVENUE_BY_PROGRAM,
      category: ReportCategory.REVENUE,
      parameters: {
        timeFrame: TimeFrame.LAST_30_DAYS,
        dateRange: null,
        comparisonType: null
      }
    };
    const createdReportDefinition = await reportsService.createReportDefinition(reportDefinition);
    expect(createdReportDefinition).toBeDefined();
  });

  it('should retrieve report definition by ID', async () => {
    const retrievedReportDefinition = await reportsService.getReportDefinition(reportDefinitionId);
    expect(retrievedReportDefinition).toBeDefined();
    expect(retrievedReportDefinition.id).toEqual(reportDefinitionId);
  });

  it('should update report definition successfully', async () => {
    const updates: Partial<ReportDefinition> = {
      name: 'Updated Test Report'
    };
    const updatedReportDefinition = await reportsService.updateReportDefinition(reportDefinitionId, updates);
    expect(updatedReportDefinition).toBeDefined();
    expect(updatedReportDefinition.name).toEqual('Updated Test Report');
  });

  it('should list report definitions with pagination', async () => {
    const filters = { page: 1, limit: 10 };
    const reportDefinitions = await reportsService.getReportDefinitions(filters);
    expect(reportDefinitions).toBeDefined();
    expect(reportDefinitions.reportDefinitions).toBeInstanceOf(Array);
  });

  it('should generate standard report successfully', async () => {
    const parameters: ReportParameters = {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: null,
      comparisonType: null
    };
    const reportData = await reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, parameters, {});
    expect(reportData).toBeDefined();
    expect(reportData.metadata.reportType).toEqual(ReportType.REVENUE_BY_PROGRAM);
  });

  it('should generate report by definition ID', async () => {
    const parameters: ReportParameters = {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: null,
      comparisonType: null
    };
    const reportData = await reportsService.generateReportById(reportDefinitionId, parameters, {});
    expect(reportData).toBeDefined();
  });

  it('should handle invalid report parameters', async () => {
    const parameters: ReportParameters = {
      timeFrame: null,
      dateRange: null,
      comparisonType: null
    };
    await expect(reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, parameters, {}))
      .rejects.toThrow(BusinessError);
  });

  it('should export report in PDF format', async () => {
    const parameters: ReportParameters = {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: null,
      comparisonType: null
    };
    const reportData = await reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, parameters, {});
    const exportResult = await reportsService.exportReport(reportData, ReportFormat.PDF, organizationId);
    expect(exportResult).toBeDefined();
    expect(exportResult.url).toContain('.pdf');
  });

  it('should export report in Excel format', async () => {
    const parameters: ReportParameters = {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: null,
      comparisonType: null
    };
    const reportData = await reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, parameters, {});
    const exportResult = await reportsService.exportReport(reportData, ReportFormat.EXCEL, organizationId);
    expect(exportResult).toBeDefined();
    expect(exportResult.url).toContain('.xlsx');
  });

  it('should export report in CSV format', async () => {
    const parameters: ReportParameters = {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: null,
      comparisonType: null
    };
    const reportData = await reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, parameters, {});
    const exportResult = await reportsService.exportReport(reportData, ReportFormat.CSV, organizationId);
    expect(exportResult).toBeDefined();
    expect(exportResult.url).toContain('.csv');
  });

  it('should create scheduled report successfully', async () => {
    const scheduledReport: Partial<ScheduledReport> = {
      name: 'Test Scheduled Report',
      description: 'Test scheduled report',
      frequency: ScheduleFrequency.MONTHLY,
      dayOfMonth: 15,
      time: '12:00',
      formats: [ReportFormat.PDF],
      recipients: [{ email: 'test@example.com' }]
    };
    const createdScheduledReport = await reportsService.createScheduledReport(reportDefinitionId, scheduledReport, userId);
    expect(createdScheduledReport).toBeDefined();
  });

  it('should execute scheduled report immediately', async () => {
    const scheduledReport: Partial<ScheduledReport> = {
      name: 'Test Scheduled Report',
      description: 'Test scheduled report',
      frequency: ScheduleFrequency.MONTHLY,
      dayOfMonth: 15,
      time: '12:00',
      formats: [ReportFormat.PDF],
      recipients: [{ email: 'test@example.com' }]
    };
    const createdScheduledReport = await reportsService.createScheduledReport(reportDefinitionId, scheduledReport, userId);
    const reportInstanceId = await reportsService.executeScheduledReport(createdScheduledReport.id, userId);
    expect(reportInstanceId).toBeDefined();
  });

  it('should retrieve financial metrics successfully', async () => {
    const metrics = await reportsService.getFinancialMetrics(TimeFrame.LAST_30_DAYS, {});
    expect(metrics).toBeDefined();
    expect(metrics).toBeInstanceOf(Array);
  });

  it('should retrieve revenue metrics successfully', async () => {
    const metrics = await reportsService.getRevenueMetrics(TimeFrame.LAST_30_DAYS, {});
    expect(metrics).toBeDefined();
    expect(metrics).toBeInstanceOf(Array);
  });

  it('should delete report definition successfully', async () => {
    const deleted = await reportsService.deleteReportDefinition(reportDefinitionId);
    expect(deleted).toBe(true);
  });

  it('should throw NotFoundError when report definition not found', async () => {
    await expect(reportsService.getReportDefinition(reportDefinitionId))
      .rejects.toThrow(NotFoundError);
  });

  it('should throw BusinessError for invalid report parameters', async () => {
    const parameters: ReportParameters = {
      timeFrame: null,
      dateRange: null,
      comparisonType: null
    };
    await expect(reportsService.generateReport(ReportType.REVENUE_BY_PROGRAM, parameters, {}))
      .rejects.toThrow(BusinessError);
  });
});

async function createMockReportDefinition(overrides?: Partial<ReportDefinition>): ReportDefinition {
  const reportDefinitionId = uuidv4();
  const defaultReportDefinition: ReportDefinition = {
    id: reportDefinitionId,
    name: 'Test Report',
    description: 'A test report definition',
    type: ReportType.REVENUE_BY_PROGRAM,
    category: ReportCategory.REVENUE,
    parameters: {
      timeFrame: TimeFrame.LAST_30_DAYS,
      dateRange: null,
      comparisonType: null
    },
    visualizations: [],
    isTemplate: false,
    isSystem: false,
    organizationId: uuidv4()
  };

  const reportType = overrides?.type || ReportType.REVENUE_BY_PROGRAM;
  const reportCategory = overrides?.category || ReportCategory.REVENUE;

  const defaultParameters: ReportParameters = {
    timeFrame: TimeFrame.LAST_30_DAYS,
    dateRange: null,
    comparisonType: null
  };

  return {
    id: reportDefinitionId,
    name: 'Test Report',
    description: 'A test report definition',
    type: reportType,
    category: reportCategory,
    parameters: defaultParameters,
    visualizations: [],
    isTemplate: false,
    isSystem: false,
    organizationId: uuidv4(),
    ...overrides,
  };
}

async function createMockScheduledReport(reportDefinitionId: UUID, overrides?: Partial<ScheduledReport>): ScheduledReport {
  const scheduledReportId = uuidv4();
  const defaultScheduledReport: ScheduledReport = {
    id: scheduledReportId,
    reportDefinitionId: reportDefinitionId,
    name: 'Test Scheduled Report',
    description: 'A test scheduled report',
    frequency: ScheduleFrequency.MONTHLY,
    dayOfWeek: null,
    dayOfMonth: 15,
    time: '12:00',
    formats: [ReportFormat.PDF],
    recipients: [{ email: 'test@example.com' }],
    isActive: true,
    lastRunAt: null,
    nextRunAt: new Date(),
    organizationId: uuidv4()
  };

  return {
    id: scheduledReportId,
    reportDefinitionId: reportDefinitionId,
    name: 'Test Scheduled Report',
    description: 'A test scheduled report',
    frequency: ScheduleFrequency.MONTHLY,
    dayOfWeek: null,
    dayOfMonth: 15,
    time: '12:00',
    formats: [ReportFormat.PDF],
    recipients: [{ email: 'test@example.com' }],
    isActive: true,
    lastRunAt: null,
    nextRunAt: new Date(),
    organizationId: uuidv4(),
    ...overrides,
  };
}

async function setupTestReportData(): Promise<{ reportDefinitionId: UUID; organizationId: UUID; userId: UUID; }> {
  const knex = getKnexInstance();

  const organizationId = uuidv4();
  const programId = uuidv4();
  const payerId = uuidv4();
  const clientId = uuidv4();
  const serviceId = uuidv4();
  const claimId = uuidv4();
  const paymentId = uuidv4();
  const reportDefinitionId = uuidv4();
  const userId = mockUsers[0].id;

  await knex('organizations').insert({ id: organizationId, name: 'Test Organization' });
  await knex('programs').insert({ id: programId, name: 'Test Program', organization_id: organizationId });
  await knex('payers').insert({ id: payerId, name: 'Test Payer', organization_id: organizationId });
  await knex('clients').insert({ id: clientId, first_name: 'Test', last_name: 'Client', organization_id: organizationId });
  await knex('services').insert({ id: serviceId, client_id: clientId, program_id: programId, organization_id: organizationId });
  await knex('claims').insert({ id: claimId, client_id: clientId, payer_id: payerId, organization_id: organizationId });
  await knex('payments').insert({ id: paymentId, claim_id: claimId, payer_id: payerId, organization_id: organizationId });
  await knex('report_definitions').insert({
    id: reportDefinitionId,
    name: 'Test Report Definition',
    description: 'Test Report Definition',
    type: 'revenue_by_program',
    category: 'revenue',
    parameters: JSON.stringify({ timeFrame: 'last_30_days' }),
    visualizations: JSON.stringify([]),
    is_template: false,
    is_system: false,
    organization_id: organizationId
  });

  return { reportDefinitionId, organizationId, userId };
}

async function cleanupTestReportData(): Promise<void> {
  const knex = getKnexInstance();
  await knex('report_instances').del();
  await knex('report_definitions').del();
  await knex('scheduled_reports').del();
  await knex('payments').del();
  await knex('claims').del();
  await knex('services').del();
  await knex('clients').del();
  await knex('payers').del();
  await knex('programs').del();
  await knex('organizations').del();
}