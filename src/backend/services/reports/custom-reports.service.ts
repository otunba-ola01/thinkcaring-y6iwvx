# src/backend/services/reports/custom-reports.service.ts
```typescript
import { logger } from '../../utils/logger'; // winston 3.8.2
import { ReportType, ReportParameters, ReportData, ReportVisualization, ReportSummaryMetric, ChartType, MetricTrend, ReportDefinition, CustomReportField } from '../../types/reports.types';
import { UUID, DateRange, Money } from '../../types/common.types';
import { BusinessError } from '../../errors/business-error';
import { dateUtils } from '../../utils/date';
import { ReportDefinitionRepository, ReportInstanceRepository } from '../../database/repositories/report.repository';
import { claimRepository } from '../../database/repositories/claim.repository';
import { paymentRepository } from '../../database/repositories/payment.repository';
import { StandardReportsService } from './standard-reports.service';

/**
 * Service for generating custom reports based on user-defined parameters and data sources
 */
export class CustomReportsService {
  /**
   * Creates a new instance of the CustomReportsService
   * @param reportDefinitionRepository 
   * @param reportInstanceRepository 
   * @param claimRepository 
   * @param paymentRepository 
   */
  constructor(
    private reportDefinitionRepository: ReportDefinitionRepository,
    private reportInstanceRepository: ReportInstanceRepository,
    private claimRepository: typeof claimRepository,
    private paymentRepository: typeof paymentRepository,
    private standardReportsService: StandardReportsService
  ) {
    // Initialize repository dependencies
    logger.debug('CustomReportsService initialized');
  }

  /**
   * Generates a custom report based on a report definition and parameters
   * @param reportDefinitionId 
   * @param parameters 
   * @returns The generated custom report data
   */
  async generateCustomReport(reportDefinitionId: UUID, parameters: ReportParameters): Promise<ReportData> {
    logger.debug(`Generating custom report start with reportDefinitionId=${reportDefinitionId} and parameters=${JSON.stringify(parameters)}`);

    try {
      // Retrieve report definition from repository
      const reportDefinition = await this.reportDefinitionRepository.findById(reportDefinitionId);

      // If report definition not found, throw BusinessError
      if (!reportDefinition) {
        throw new BusinessError(`Report definition with ID ${reportDefinitionId} not found`, null, 'report.definition_not_found');
      }

      // Merge provided parameters with default parameters from definition
      const mergedParameters = { ...reportDefinition.parameters, ...parameters };

      // Validate merged parameters
      this.validateCustomReportDefinition(reportDefinition);

      // Convert timeFrame to DateRange if needed using dateUtils.getDateRange
      if (mergedParameters.timeFrame && mergedParameters.timeFrame !== 'custom' && !mergedParameters.dateRange) {
        mergedParameters.dateRange = dateUtils.getDateRangeFromPreset(mergedParameters.timeFrame);
      }

      // Determine data source based on report definition
      const dataSource = reportDefinition.parameters.customParameters?.dataSource;

      // Execute custom query based on report definition and parameters
      const queryResults = await this.executeCustomQuery(reportDefinition, mergedParameters);

      // Process query results according to report definition
      const processedData = queryResults.map(item => {
        const processedItem: Record<string, any> = {};
        reportDefinition.parameters.customParameters?.fields?.forEach((field: CustomReportField) => {
          processedItem[field.name] = item[field.sourceField];
        });
        return processedItem;
      });

      // Generate visualizations based on report definition
      const visualizations = this.createCustomVisualization(reportDefinition, processedData);

      // Create summary metrics based on report results
      const summaryMetrics = this.createCustomSummaryMetrics(reportDefinition, processedData);

      // Create and return ReportData object with metadata, summaryMetrics, visualizations, and data
      const metadata = this.standardReportsService.createReportMetadata(ReportType.CUSTOM, mergedParameters);
      const reportData: ReportData = {
        metadata: {
          ...metadata,
          reportName: reportDefinition.name,
        },
        summaryMetrics,
        visualizations,
        data: {
          [dataSource]: processedData,
        },
      };

      return reportData;
    } catch (error) {
      logger.error(`Error generating custom report with ID ${reportDefinitionId}:`, error);
      throw error;
    }
  }

  /**
   * Saves a custom report definition for future use
   * @param reportDefinition 
   * @returns The saved report definition with ID
   */
  async saveCustomReportDefinition(reportDefinition: ReportDefinition): Promise<ReportDefinition> {
    try {
      logger.debug(`Saving custom report definition: ${reportDefinition.name}`);

      // Validate report definition structure
      this.validateCustomReportDefinition(reportDefinition);

      // Set report type to ReportType.CUSTOM
      reportDefinition.type = ReportType.CUSTOM;

      let savedReportDefinition: ReportDefinition;

      // If report definition has an ID, update existing definition
      if (reportDefinition.id) {
        savedReportDefinition = await this.reportDefinitionRepository.update(reportDefinition.id, reportDefinition) as ReportDefinition;
      } else {
        // Otherwise, create new report definition
        savedReportDefinition = await this.reportDefinitionRepository.create(reportDefinition) as ReportDefinition;
      }

      // Return saved report definition with ID
      return savedReportDefinition;
    } catch (error) {
      logger.error(`Error saving custom report definition: ${reportDefinition.name}`, error);
      throw error;
    }
  }

  /**
   * Retrieves a custom report definition by ID
   * @param reportDefinitionId 
   * @returns The requested report definition
   */
  async getCustomReportDefinition(reportDefinitionId: UUID): Promise<ReportDefinition> {
    try {
      logger.debug(`Retrieving custom report definition with ID: ${reportDefinitionId}`);

      // Retrieve report definition from repository
      const reportDefinition = await this.reportDefinitionRepository.findById(reportDefinitionId);

      // If report definition not found, throw BusinessError
      if (!reportDefinition) {
        throw new BusinessError(`Report definition with ID ${reportDefinitionId} not found`, null, 'report.definition_not_found');
      }

      // Return the report definition
      return reportDefinition;
    } catch (error) {
      logger.error(`Error retrieving custom report definition with ID ${reportDefinitionId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all custom report definitions for an organization
   * @param organizationId 
   * @param pagination 
   * @returns Paginated list of report definitions
   */
  async getCustomReportDefinitions(organizationId: UUID, pagination: { page: number; limit: number }): Promise<{ data: ReportDefinition[]; total: number; page: number; pageSize: number; }> {
    try {
      logger.debug(`Retrieving custom report definitions for organization: ${organizationId}`);

      // Retrieve report definitions from repository with organization filter
      const paginatedResult = await this.reportDefinitionRepository.findByOrganization(organizationId, pagination);

      // Return paginated result with report definitions
      return {
        data: paginatedResult.data,
        total: paginatedResult.total,
        page: paginatedResult.page,
        pageSize: paginatedResult.limit,
      };
    } catch (error) {
      logger.error(`Error retrieving custom report definitions for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a custom report definition
   * @param reportDefinitionId 
   * @returns Void on successful deletion
   */
  async deleteCustomReportDefinition(reportDefinitionId: UUID): Promise<void> {
    try {
      logger.debug(`Deleting custom report definition with ID: ${reportDefinitionId}`);

      // Retrieve report definition to verify it exists
      const reportDefinition = await this.reportDefinitionRepository.findById(reportDefinitionId);

      // If report definition not found, throw BusinessError
      if (!reportDefinition) {
        throw new BusinessError(`Report definition with ID ${reportDefinitionId} not found`, null, 'report.definition_not_found');
      }

      // If report definition is a system template, throw BusinessError
      if (reportDefinition.isSystem) {
        throw new BusinessError('Cannot delete system report template', null, 'report.cannot_delete_system_template');
      }

      // Delete report definition from repository
      await this.reportDefinitionRepository.delete(reportDefinitionId);
    } catch (error) {
      logger.error(`Error deleting custom report definition with ID ${reportDefinitionId}:`, error);
      throw error;
    }
  }

  /**
   * Executes a custom query based on report definition and parameters
   * @param reportDefinition 
   * @param parameters 
   * @returns Query results as array of data objects
   */
  async executeCustomQuery(reportDefinition: ReportDefinition, parameters: ReportParameters): Promise<any[]> {
    try {
      logger.debug(`Executing custom query for report definition: ${reportDefinition.name}`);

      // Determine data source from report definition
      const dataSource = reportDefinition.parameters.customParameters?.dataSource;

      // Build query conditions based on parameters
      const queryConditions = {
        ...parameters,
        dateRange: parameters.dateRange,
        programIds: parameters.programIds,
        payerIds: parameters.payerIds,
      };

      // Add filters for date range, programs, payers, etc.
      const filters = {
        dateRange: queryConditions.dateRange,
        programIds: queryConditions.programIds,
        payerIds: queryConditions.payerIds,
      };

      // Add grouping based on report definition
      const groupBy = reportDefinition.parameters.groupBy;

      // Add sorting based on report definition
      const sortBy = reportDefinition.parameters.sortBy;

      // Execute query against appropriate repository
      let queryResults: any[];
      switch (dataSource) {
        case 'claims':
          queryResults = await this.claimRepository.findWithAdvancedQuery({
            pagination: { page: 1, limit: 1000 }, // Adjust pagination as needed
            sort: { sortBy: sortBy || 'createdAt', sortDirection: 'desc' },
            filter: { conditions: [], logicalOperator: 'AND' }, // Add filters as needed
            search: '',
            clientId: null,
            payerId: null,
            claimStatus: null,
            dateRange: filters.dateRange,
            claimType: null,
            includeServices: false,
            includeStatusHistory: false,
          });
          break;
        case 'payments':
          queryResults = await this.paymentRepository.findAllWithRelations({
            pagination: { page: 1, limit: 1000 }, // Adjust pagination as needed
            sort: { sortBy: sortBy || 'paymentDate', sortDirection: 'desc' },
            filter: { conditions: [], logicalOperator: 'AND' }, // Add filters as needed
            search: '',
            payerId: null,
            reconciliationStatus: null,
            paymentMethod: null,
            dateRange: filters.dateRange,
            includeRemittance: false,
          });
          break;
        default:
          throw new BusinessError(`Unsupported data source: ${dataSource}`, null, 'report.unsupported_data_source');
      }

      // Transform results according to field mappings in report definition
      const transformedResults = queryResults.map(item => {
        const transformedItem: Record<string, any> = {};
        reportDefinition.parameters.customParameters?.fields?.forEach((field: CustomReportField) => {
          transformedItem[field.name] = item[field.sourceField];
        });
        return transformedItem;
      });

      // Return query results
      return transformedResults;
    } catch (error) {
      logger.error(`Error executing custom query for report definition ${reportDefinition.name}:`, error);
      throw error;
    }
  }

  /**
   * Creates visualizations for custom report based on definition
   * @param reportDefinition 
   * @param data 
   * @returns Array of visualization configurations
   */
  createCustomVisualization(reportDefinition: ReportDefinition, data: any[]): ReportVisualization[] {
    try {
      logger.debug(`Creating custom visualizations for report definition: ${reportDefinition.name}`);

      // Initialize empty visualizations array
      const visualizations: ReportVisualization[] = [];

      // For each visualization in report definition:
      reportDefinition.visualizations.forEach(visualization => {
        // Determine chart type and data mapping
        const chartType = visualization.type;
        const dataKey = visualization.dataKey;

        // Configure axes and series based on definition
        const xAxis = visualization.xAxis;
        const yAxis = visualization.yAxis;
        const series = visualization.series;

        // Create visualization using standardReportsService.createVisualization
        const newVisualization = this.standardReportsService.createVisualization(
          visualization.id,
          visualization.title,
          chartType,
          dataKey,
          { xAxis, yAxis },
          series,
          visualization.options
        );

        // Add visualization to array
        visualizations.push(newVisualization);
      });

      // Return array of visualizations
      return visualizations;
    } catch (error) {
      logger.error(`Error creating custom visualizations for report definition ${reportDefinition.name}:`, error);
      throw error;
    }
  }

  /**
   * Creates summary metrics for custom report based on definition and data
   * @param reportDefinition 
   * @param data 
   * @returns Array of summary metrics
   */
  createCustomSummaryMetrics(reportDefinition: ReportDefinition, data: any[]): ReportSummaryMetric[] {
    try {
      logger.debug(`Creating custom summary metrics for report definition: ${reportDefinition.name}`);

      // Initialize empty metrics array
      const metrics: ReportSummaryMetric[] = [];

      // For each metric in report definition:
      reportDefinition.parameters.customParameters?.metrics?.forEach(metric => {
        // Calculate metric value from data
        const metricValue = data.reduce((acc, item) => acc + item[metric.field], 0);

        // Determine format based on metric type
        const format = metric.format;

        // Create summary metric using standardReportsService.createSummaryMetric
        const newMetric = this.standardReportsService.createSummaryMetric(
          metric.label,
          metricValue,
          null,
          format
        );

        // Add metric to array
        metrics.push(newMetric);
      });

      // Return array of summary metrics
      return metrics;
    } catch (error) {
      logger.error(`Error creating custom summary metrics for report definition ${reportDefinition.name}:`, error);
      throw error;
    }
  }

  /**
   * Validates a custom report definition structure
   * @param reportDefinition 
   * @returns True if valid, throws error if invalid
   */
  validateCustomReportDefinition(reportDefinition: ReportDefinition): boolean {
    try {
      logger.debug(`Validating custom report definition: ${reportDefinition.name}`);

      // Check required fields (name, description, parameters)
      if (!reportDefinition.name || !reportDefinition.description || !reportDefinition.parameters) {
        throw new BusinessError('Report definition must have a name, description, and parameters', null, 'report.missing_required_fields');
      }

      // Validate data source configuration
      if (!reportDefinition.parameters.customParameters?.dataSource) {
        throw new BusinessError('Report definition must have a data source', null, 'report.missing_data_source');
      }

      // Validate field mappings
      if (!reportDefinition.parameters.customParameters?.fields || reportDefinition.parameters.customParameters?.fields.length === 0) {
        throw new BusinessError('Report definition must have field mappings', null, 'report.missing_field_mappings');
      }

      // Validate visualization configurations
      if (!reportDefinition.visualizations || reportDefinition.visualizations.length === 0) {
        throw new BusinessError('Report definition must have at least one visualization', null, 'report.missing_visualizations');
      }

      // Return true if all validations pass
      return true;
    } catch (error) {
      logger.error(`Error validating custom report definition ${reportDefinition.name}:`, error);
      throw error;
    }
  }

  /**
   * Creates a custom report definition from a template
   * @param templateId 
   * @param customizations 
   * @returns The new report definition based on the template
   */
  async createReportFromTemplate(templateId: UUID, customizations: object): Promise<ReportDefinition> {
    try {
      logger.debug(`Creating report from template with ID: ${templateId}`);

      // Retrieve template report definition
      const templateReportDefinition = await this.reportDefinitionRepository.findById(templateId);

      // If template not found, throw BusinessError
      if (!templateReportDefinition) {
        throw new BusinessError(`Template report definition with ID ${templateId} not found`, null, 'report.template_not_found');
      }

      // Create new report definition based on template
      const newReportDefinition = { ...templateReportDefinition };
      delete newReportDefinition.id; // Ensure a new ID is generated

      // Apply customizations to the new definition
      Object.assign(newReportDefinition, customizations);

      // Save the new report definition
      const savedReportDefinition = await this.reportDefinitionRepository.create(newReportDefinition) as ReportDefinition;

      // Return the saved report definition
      return savedReportDefinition;
    } catch (error) {
      logger.error(`Error creating report from template with ID ${templateId}:`, error);
      throw error;
    }
  }
}