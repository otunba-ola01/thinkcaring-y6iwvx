import { PDFDocument } from 'pdfkit'; // pdfkit ^3.0.1
import ExcelJS from 'exceljs'; // exceljs ^4.3.0
import { Parser as CSVParser } from 'json2csv'; // json2csv ^5.0.7
import * as fs from 'fs-extra'; // fs-extra ^11.1.1
import * as path from 'path'; // path ^0.12.7
import * as stream from 'stream'; // stream ^0.0.2
import { logger } from '../../utils/logger';
import {
  ReportData,
  ReportFormat,
  ReportVisualization,
  ReportSummaryMetric
} from '../../types/reports.types';
import { UUID } from '../../types/common.types';
import { BusinessError } from '../../errors/business-error';
import { IntegrationError } from '../../errors/integration-error';
import { formatUtils } from '../../utils/formatter';
import { fileUtils } from '../../utils/file';
import { config } from '../../config';

/**
 * Service for exporting reports in various formats (PDF, Excel, CSV, JSON)
 */
export class ReportExportService {
  /**
   * Creates a new instance of the ReportExportService
   */
  constructor() {
    // Initialize service dependencies
  }

  /**
   * Exports a report in the specified format
   * @param reportData - The report data to export
   * @param format - The format to export the report in
   * @param organizationId - The ID of the organization
   * @returns The URL, filename, and storage key of the exported report
   */
  async exportReport(
    reportData: ReportData,
    format: ReportFormat,
    organizationId: UUID
  ): Promise<{ url: string; filename: string; storageKey: string }> {
    logger.info(`Starting report export in ${format} format`, { reportName: reportData.metadata.reportName, format });

    // Validate report data structure
    this.validateReportData(reportData);

    // Generate filename based on report metadata and format
    const filename = this.generateFilename(reportData, format);

    let fileBuffer: Buffer;

    // Switch on format to call appropriate export method
    switch (format) {
      case ReportFormat.PDF:
        fileBuffer = await this.exportToPdf(reportData);
        break;
      case ReportFormat.EXCEL:
        fileBuffer = await this.exportToExcel(reportData);
        break;
      case ReportFormat.CSV:
        fileBuffer = await this.exportToCsv(reportData);
        break;
      case ReportFormat.JSON:
        fileBuffer = await this.exportToJson(reportData);
        break;
      default:
        throw new BusinessError(`Unsupported report format: ${format}`, null, 'report.export.unsupportedFormat');
    }

    // Generate storage key for the exported file
    const storageKey = fileUtils.generateStorageKey(`reports/${organizationId}`, filename);

    try {
      // Upload the exported file to S3 storage
      await fileUtils.uploadFileToS3(fileBuffer, storageKey, this.getExportMimeType(format));

      // Generate a signed download URL for the file
      const url = await fileUtils.getSignedDownloadUrl(storageKey);

      logger.info(`Report exported successfully and stored in S3`, { storageKey, format, url });

      // Return the download URL, filename, and storage key
      return { url, filename, storageKey };
    } catch (error) {
      logger.error('Error during report export and storage', {
        reportName: reportData.metadata.reportName,
        format,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   * Exports report data to PDF format
   * @param reportData - The report data to export
   * @returns The PDF file content as a Buffer
   */
  async exportToPdf(reportData: ReportData): Promise<Buffer> {
    try {
      logger.debug('Starting PDF export', { reportName: reportData.metadata.reportName });

      // Create a new PDFDocument instance with appropriate options
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Add report title and metadata (date, parameters)
      doc.fontSize(16).text(reportData.metadata.reportName, { align: 'center' });
      doc.fontSize(10).text(`Generated on: ${formatUtils.formatDisplayDateTime(reportData.metadata.generatedAt)}`, { align: 'center' });

      // Add summary metrics section with formatted values
      if (reportData.summaryMetrics && reportData.summaryMetrics.length > 0) {
        doc.moveDown().fontSize(12).text('Summary Metrics', { underline: true });
        reportData.summaryMetrics.forEach(metric => {
          let formattedValue: string;
          switch (metric.format) {
            case 'currency':
              formattedValue = formatUtils.formatCurrency(metric.value as number);
              break;
            case 'percentage':
              formattedValue = formatUtils.formatPercentage(metric.value as number);
              break;
            case 'number':
              formattedValue = formatUtils.formatNumber(metric.value as number);
              break;
            case 'date':
              formattedValue = formatUtils.formatDisplayDate(metric.value as string);
              break;
            default:
              formattedValue = String(metric.value);
          }
          doc.fontSize(10).text(`${metric.label}: ${formattedValue}`);
        });
      }

      // For each visualization in the report
      if (reportData.visualizations && reportData.visualizations.length > 0) {
        reportData.visualizations.forEach(visualization => {
          // Add visualization title
          doc.moveDown().fontSize(12).text(visualization.title, { underline: true });

          // Render chart based on visualization type (bar, line, pie)
          this.renderChartForPdf(doc, visualization, reportData.data[visualization.dataKey]);

          // Add legend if applicable
          if (visualization.options && visualization.options.legend) {
            doc.fontSize(8).text(visualization.options.legend, { indent: 20 });
          }
        });
      }

      // Add tabular data section with formatted data
      if (reportData.data && Object.keys(reportData.data).length > 0) {
        Object.keys(reportData.data).forEach(dataKey => {
          doc.moveDown().fontSize(12).text(`Data Section: ${dataKey}`, { underline: true });
          const data = reportData.data[dataKey];
          if (data && data.length > 0) {
            // Basic table rendering (can be enhanced with more sophisticated table libraries)
            const headers = Object.keys(data[0]);
            doc.fontSize(10).text(headers.join('\t'), { indent: 20 });
            data.forEach(row => {
              const values = headers.map(header => String(row[header]));
              doc.fontSize(8).text(values.join('\t'), { indent: 20 });
            });
          }
        });
      }

      // Add page numbers and organization information in footer
      let page = 1;
      const { width, height } = doc.page;
      doc.on('pageAdded', () => {
        page++;
        doc.fontSize(8).text(
          `Page ${page}`,
          width - 80,
          height - 30,
          { align: 'right' }
        );
        doc.fontSize(8).text(
          `© ${new Date().getFullYear()} Thinkcaring`,
          50,
          height - 30,
          { align: 'left' }
        );
      });

      doc.fontSize(8).text(
        `Page ${page}`,
        width - 80,
        height - 30,
        { align: 'right' }
      );
      doc.fontSize(8).text(
        `© ${new Date().getFullYear()} Thinkcaring`,
        50,
        height - 30,
        { align: 'left' }
      );

      // Finalize the PDF document
      doc.end();

      // Convert the PDF document to a Buffer
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
      });

      logger.debug('PDF export completed', { reportName: reportData.metadata.reportName, size: pdfBuffer.length });
      return pdfBuffer;
    } catch (error) {
      logger.error('Error during PDF export', {
        reportName: reportData.metadata.reportName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BusinessError(`Failed to export report to PDF: ${error instanceof Error ? error.message : String(error)}`, null, 'report.export.pdf');
    }
  }

  /**
   * Exports report data to Excel format
   * @param reportData - The report data to export
   * @returns The Excel file content as a Buffer
   */
  async exportToExcel(reportData: ReportData): Promise<Buffer> {
    try {
      logger.debug('Starting Excel export', { reportName: reportData.metadata.reportName });

      // Create a new Excel workbook
      const workbook = new ExcelJS.Workbook();

      // Create a summary worksheet with report metadata
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.addRow(['Report Name', reportData.metadata.reportName]);
      summarySheet.addRow(['Generated At', formatUtils.formatDisplayDateTime(reportData.metadata.generatedAt)]);

      // Add summary metrics to the summary worksheet
      if (reportData.summaryMetrics && reportData.summaryMetrics.length > 0) {
        summarySheet.addRow(['', '']); // Add a blank row for spacing
        summarySheet.addRow(['Summary Metrics']);
        reportData.summaryMetrics.forEach(metric => {
          let formattedValue: string;
          switch (metric.format) {
            case 'currency':
              formattedValue = formatUtils.formatCurrency(metric.value as number);
              break;
            case 'percentage':
              formattedValue = formatUtils.formatPercentage(metric.value as number);
              break;
            case 'number':
              formattedValue = formatUtils.formatNumber(metric.value as number);
              break;
            case 'date':
              formattedValue = formatUtils.formatDisplayDate(metric.value as string);
              break;
            default:
              formattedValue = String(metric.value);
          }
          summarySheet.addRow([metric.label, formattedValue]);
        });
      }

      // For each data section in the report
      if (reportData.data && Object.keys(reportData.data).length > 0) {
        Object.keys(reportData.data).forEach(dataKey => {
          // Create a new worksheet
          const worksheet = workbook.addWorksheet(dataKey);
          const data = reportData.data[dataKey];

          if (data && data.length > 0) {
            // Add headers based on data structure
            const headers = Object.keys(data[0]);
            worksheet.addRow(headers);

            // Add data rows with appropriate formatting
            data.forEach(row => {
              const values = headers.map(header => row[header]);
              worksheet.addRow(values);
            });

            // Apply styling (borders, colors, fonts)
            worksheet.columns.forEach(column => {
              column.width = 15; // Set default column width
            });
          }
        });
      }

      // Create charts based on visualizations in separate worksheets
      if (reportData.visualizations) {
        reportData.visualizations.forEach(visualization => {
          const chartSheet = workbook.addWorksheet(visualization.title);
          // Implement chart creation logic here (using ExcelJS charting capabilities)
        });
      }

      // Write workbook to buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      logger.debug('Excel export completed', { reportName: reportData.metadata.reportName, size: excelBuffer.length });
      return excelBuffer as Buffer;
    } catch (error) {
      logger.error('Error during Excel export', {
        reportName: reportData.metadata.reportName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BusinessError(`Failed to export report to Excel: ${error instanceof Error ? error.message : String(error)}`, null, 'report.export.excel');
    }
  }

  /**
   * Exports report data to CSV format
   * @param reportData - The report data to export
   * @returns The CSV file content as a Buffer
   */
  async exportToCsv(reportData: ReportData): Promise<Buffer> {
    try {
      logger.debug('Starting CSV export', { reportName: reportData.metadata.reportName });

      // Determine which data section to export (primary data)
      const dataKey = Object.keys(reportData.data)[0];
      const data = reportData.data[dataKey];

      if (!data || data.length === 0) {
        return Buffer.from(''); // Return empty CSV if no data
      }

      // Extract field names for CSV headers
      const fields = Object.keys(data[0]);

      // Create CSV parser with appropriate options
      const csvParser = new CSVParser({ fields });

      // Convert JSON data to CSV format
      const csvString = csvParser.parse(data);

      logger.debug('CSV export completed', { reportName: reportData.metadata.reportName, size: csvString.length });
      return Buffer.from(csvString);
    } catch (error) {
      logger.error('Error during CSV export', {
        reportName: reportData.metadata.reportName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BusinessError(`Failed to export report to CSV: ${error instanceof Error ? error.message : String(error)}`, null, 'report.export.csv');
    }
  }

  /**
   * Exports report data to JSON format
   * @param reportData - The report data to export
   * @returns The JSON file content as a Buffer
   */
  async exportToJson(reportData: ReportData): Promise<Buffer> {
    try {
      logger.debug('Starting JSON export', { reportName: reportData.metadata.reportName });

      // Create a structured JSON representation of the report
      const jsonData = {
        metadata: reportData.metadata,
        summaryMetrics: reportData.summaryMetrics,
        data: reportData.data,
      };

      // Stringify the JSON with proper formatting (indentation)
      const jsonString = JSON.stringify(jsonData, null, 2);

      logger.debug('JSON export completed', { reportName: reportData.metadata.reportName, size: jsonString.length });
      return Buffer.from(jsonString);
    } catch (error) {
      logger.error('Error during JSON export', {
        reportName: reportData.metadata.reportName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BusinessError(`Failed to export report to JSON: ${error instanceof Error ? error.message : String(error)}`, null, 'report.export.json');
    }
  }

  /**
   * Generates a filename for the exported report
   * @param reportData - The report data
   * @param format - The format to export the report in
   * @returns The generated filename
   */
  generateFilename(reportData: ReportData, format: ReportFormat): string {
    // Extract report name from metadata
    const reportName = reportData.metadata.reportName;

    // Sanitize report name to remove invalid characters
    const sanitizedName = reportName.replace(/[^a-zA-Z0-9\\s-]/g, '');

    // Add date stamp to filename
    const dateStamp = formatUtils.formatDate(new Date());

    // Add appropriate file extension based on format
    let extension: string;
    switch (format) {
      case ReportFormat.PDF:
        extension = 'pdf';
        break;
      case ReportFormat.EXCEL:
        extension = 'xlsx';
        break;
      case ReportFormat.CSV:
        extension = 'csv';
        break;
      case ReportFormat.JSON:
        extension = 'json';
        break;
      default:
        extension = 'txt';
    }

    // Return the complete filename
    return `${sanitizedName}-${dateStamp}.${extension}`;
  }

  /**
   * Renders a chart visualization in a PDF document
   * @param doc - The PDF document
   * @param visualization - The visualization configuration
   * @param data - The data for the visualization
   */
  renderChartForPdf(doc: PDFDocument, visualization: ReportVisualization, data: any[]): void {
    try {
      // Determine chart type from visualization
      const chartType = visualization.type;

      // Extract data series and configuration
      const dataSeries = visualization.series;
      const chartOptions = visualization.options;

      // Switch on chart type to render appropriate visualization
      switch (chartType) {
        case 'bar':
          // Implement bar chart rendering logic
          doc.fontSize(10).text('Bar chart rendering not yet implemented', { indent: 20 });
          break;
        case 'line':
          // Implement line chart rendering logic
          doc.fontSize(10).text('Line chart rendering not yet implemented', { indent: 20 });
          break;
        case 'pie':
          // Implement pie chart rendering logic
          doc.fontSize(10).text('Pie chart rendering not yet implemented', { indent: 20 });
          break;
        case 'area':
          // Implement area chart rendering logic
          doc.fontSize(10).text('Area chart rendering not yet implemented', { indent: 20 });
          break;
        case 'table':
          // Implement data table rendering logic
          doc.fontSize(10).text('Data table rendering not yet implemented', { indent: 20 });
          break;
        default:
          doc.fontSize(10).text(`Chart type "${chartType}" not supported`, { indent: 20 });
      }
    } catch (error) {
      logger.error('Error rendering chart for PDF', {
        visualizationTitle: visualization.title,
        error: error instanceof Error ? error.message : String(error),
      });
      doc.fontSize(8).text(`Error rendering chart: ${error instanceof Error ? error.message : String(error)}`, { indent: 20 });
    }
  }

  /**
   * Formats report data for export in various formats
   * @param reportData - The report data
   * @param format - The format to export the report in
   * @returns Formatted data appropriate for the export format
   */
  formatDataForExport(reportData: ReportData, format: ReportFormat): any {
    try {
      // Extract raw data from report
      const rawData = reportData.data;

      // Format data based on target export format
      let formattedData: any;
      switch (format) {
        case ReportFormat.PDF:
          // Format data for PDF export
          formattedData = rawData;
          break;
        case ReportFormat.EXCEL:
          // Format data for Excel export
          formattedData = rawData;
          break;
        case ReportFormat.CSV:
          // Format data for CSV export
          formattedData = rawData;
          break;
        case ReportFormat.JSON:
          // Format data for JSON export
          formattedData = rawData;
          break;
        default:
          formattedData = rawData;
      }

      // Apply appropriate transformations for dates, currency, etc.

      // Handle nested data structures based on format requirements

      // Return the formatted data
      return formattedData;
    } catch (error) {
      logger.error('Error formatting data for export', {
        reportName: reportData.metadata.reportName,
        format,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BusinessError(`Failed to format data for export: ${error instanceof Error ? error.message : String(error)}`, null, 'report.export.formatData');
    }
  }

  /**
   * Validates report data structure before export
   * @param reportData - The report data
   * @returns True if valid, throws error if invalid
   */
  validateReportData(reportData: ReportData): boolean {
    // Check that reportData contains required sections (metadata, data)
    if (!reportData || !reportData.metadata || !reportData.data) {
      throw new BusinessError('Report data is missing required sections (metadata, data)', null, 'report.export.validateData');
    }

    // Validate metadata structure
    if (!reportData.metadata.reportName || !reportData.metadata.reportType) {
      throw new BusinessError('Report metadata is missing required fields (reportName, reportType)', null, 'report.export.validateData');
    }

    // Validate that data sections exist and are properly structured
    if (typeof reportData.data !== 'object') {
      throw new BusinessError('Report data section is not a valid object', null, 'report.export.validateData');
    }

    // Return true if validation passes
    return true;
  }

  /**
   * Gets the MIME type for a report export format
   * @param format - The report format
   * @returns The MIME type for the format
   */
  getExportMimeType(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.PDF:
        return 'application/pdf';
      case ReportFormat.EXCEL:
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case ReportFormat.CSV:
        return 'text/csv';
      case ReportFormat.JSON:
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}