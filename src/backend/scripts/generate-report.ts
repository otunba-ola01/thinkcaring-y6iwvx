import yargs from 'yargs'; // yargs ^17.7.2
import fs from 'fs-extra'; // fs-extra ^11.1.1
import path from 'path'; // path ^0.12.7
import { logger } from '../utils/logger';
import { ReportType, ReportFormat, ReportParameters, TimeFrame } from '../types/reports.types';
import { UUID } from '../types/common.types';
import { ReportsService } from '../services/reports.service';
import { StandardReportsService } from '../services/reports/standard-reports.service';
import { ReportExportService } from '../services/reports/export.service';
import { dateUtils } from '../utils/date';
import { fileUtils } from '../utils/file';
import { claimRepository } from '../database/repositories/claim.repository';
import { paymentRepository } from '../database/repositories/payment.repository';
import { programRepository } from '../database/repositories/program.repository';
import { payerRepository } from '../database/repositories/payer.repository';
import { database } from '../database';

/**
 * Parses and validates the report type from command-line input.
 * @param reportTypeArg The report type argument from the command line.
 * @returns The validated report type enum value.
 * @throws Error if the input is not a valid report type.
 */
function parseReportType(reportTypeArg: string): ReportType {
  const reportType = reportTypeArg.toUpperCase() as ReportType;
  if (!(Object.values(ReportType) as string[]).includes(reportType)) {
    throw new Error(`Invalid report type: ${reportTypeArg}`);
  }
  return reportType;
}

/**
 * Parses and validates the report format from command-line input.
 * @param formatArg The format argument from the command line.
 * @returns The validated report format enum value.
 * @throws Error if the input is not a valid report format.
 */
function parseReportFormat(formatArg: string): ReportFormat {
  if (!formatArg) {
    return ReportFormat.PDF; // Default to PDF if not specified
  }

  const format = formatArg.toUpperCase() as ReportFormat;
  if (!(Object.values(ReportFormat) as string[]).includes(format)) {
    throw new Error(`Invalid report format: ${formatArg}`);
  }
  return format;
}

/**
 * Parses and validates the time frame from command-line input.
 * @param timeFrameArg The time frame argument from the command line.
 * @returns The validated time frame enum value.
 * @throws Error if the input is not a valid time frame.
 */
function parseTimeFrame(timeFrameArg: string): TimeFrame {
  if (!timeFrameArg) {
    return TimeFrame.LAST_30_DAYS; // Default to LAST_30_DAYS if not specified
  }

  const timeFrame = timeFrameArg.toUpperCase() as TimeFrame;
  if (!(Object.values(TimeFrame) as string[]).includes(timeFrame)) {
    throw new Error(`Invalid time frame: ${timeFrameArg}`);
  }
  return timeFrame;
}

/**
 * Builds report parameters object from command-line arguments.
 * @param args The command-line arguments.
 * @returns The constructed report parameters.
 */
function buildReportParameters(args: any): ReportParameters {
  const reportParameters: ReportParameters = {
    timeFrame: parseTimeFrame(args.timeFrame),
    dateRange: args.startDate && args.endDate ? { startDate: args.startDate, endDate: args.endDate } : null,
    programIds: args.program ? [args.program] : null,
    payerIds: args.payer ? [args.payer] : null,
    facilityIds: args.facility ? [args.facility] : null,
    customParameters: args.customParameters ? JSON.parse(args.customParameters) : null
  };
  return reportParameters;
}

/**
 * Saves the exported report to a file.
 * @param reportData The report data as a Buffer.
 * @param outputPath The output path for the report file.
 * @param filename The name of the report file.
 * @returns The full path to the saved file.
 * @throws Error if there is an error saving the report to a file.
 */
async function saveReportToFile(reportData: Buffer, outputPath: string, filename: string): Promise<string> {
  try {
    // Ensure the output directory exists
    await fs.ensureDir(outputPath);

    // Construct the full output file path
    const fullPath = path.join(outputPath, filename);

    // Write the report data to the file
    await fs.writeFile(fullPath, reportData);

    // Return the full path to the saved file
    return fullPath;
  } catch (error) {
    // Handle errors by logging and re-throwing
    logger.error('Error saving report to file', { error, outputPath, filename });
    throw new Error(`Error saving report to file: ${error.message}`);
  }
}

/**
 * Prints usage information for the script.
 */
function printUsage(): void {
  console.log('Usage: generate-report --reportType <reportType> --timeFrame <timeFrame> --outputPath <outputPath>');
  console.log('Available options:');
  console.log('  --reportType <reportType> (required): Type of report to generate');
  console.log('  --timeFrame <timeFrame>: Time frame for the report (e.g., LAST_30_DAYS, THIS_MONTH)');
  console.log('  --outputPath <outputPath>: Path to save the generated report');
  console.log('  --format <format>: Report format (PDF, EXCEL, CSV, JSON)');
  console.log('  --startDate <startDate>: Start date for custom date range (YYYY-MM-DD)');
  console.log('  --endDate <endDate>: End date for custom date range (YYYY-MM-DD)');
  console.log('  --program <programId>: Filter by program ID');
  console.log('  --payer <payerId>: Filter by payer ID');
  console.log('  --facility <facilityId>: Filter by facility ID');
  console.log('  --customParameters <json>: Custom parameters for the report (JSON string)');
  console.log('Available report types:');
  Object.values(ReportType).forEach(type => console.log(`  - ${type}`));
  console.log('Available report formats:');
  Object.values(ReportFormat).forEach(format => console.log(`  - ${format}`));
  console.log('Available time frames:');
  Object.values(TimeFrame).forEach(timeFrame => console.log(`  - ${timeFrame}`));
}

/**
 * Main function that parses command-line arguments and generates a report.
 */
async function main(): Promise<void> {
  try {
    // Parse command-line arguments using yargs
    const args: any = yargs(process.argv.slice(2))
      .usage('Usage: $0 --reportType <reportType> --timeFrame <timeFrame> --outputPath <outputPath>')
      .option('reportType', { describe: 'Type of report to generate', type: 'string', demandOption: true })
      .option('timeFrame', { describe: 'Time frame for the report', type: 'string' })
      .option('outputPath', { describe: 'Path to save the generated report', type: 'string' })
      .option('format', { describe: 'Report format', type: 'string' })
      .option('startDate', { describe: 'Start date for custom date range (YYYY-MM-DD)', type: 'string' })
      .option('endDate', { describe: 'End date for custom date range (YYYY-MM-DD)', type: 'string' })
      .option('program', { describe: 'Filter by program ID', type: 'string' })
      .option('payer', { describe: 'Filter by payer ID', type: 'string' })
      .option('facility', { describe: 'Filter by facility ID', type: 'string' })
      .option('customParameters', { describe: 'Custom parameters for the report (JSON string)', type: 'string' })
      .help()
      .argv;

    // Validate required arguments (reportType)
    if (!args.reportType) {
      console.error('Error: --reportType is required');
      printUsage();
      process.exit(1);
    }

    // Connect to the database
    await database.initialize();

    // Initialize required services (StandardReportsService, ReportExportService, ReportsService)
    const standardReportsService = new StandardReportsService(claimRepository, paymentRepository, programRepository, payerRepository);
    const reportExportService = new ReportExportService();
    const reportsService = new ReportsService(standardReportsService, null, null, reportExportService, null, null, null);

    // Build report parameters from command-line arguments
    const reportParameters = buildReportParameters(args);

    // Generate the report using ReportsService
    const reportData = await reportsService.generateReport(parseReportType(args.reportType), reportParameters, {});

    // Export the report in the specified format if requested
    if (args.format) {
      const format = parseReportFormat(args.format);
      const exportResult = await reportsService.exportReport(reportData, format, 'org-123' as UUID);

      // Save the exported report to the specified output path
      if (args.outputPath) {
        const fullPath = await saveReportToFile(Buffer.from(exportResult.url), args.outputPath, exportResult.filename);
        logger.info(`Report saved to ${fullPath}`);
      } else {
        logger.info(`Report URL: ${exportResult.url}`);
      }
    }

    // Log success message with report details
    logger.info('Report generated successfully', { reportType: args.reportType, timeFrame: args.timeFrame });

    // Disconnect from the database
    await database.close();
  } catch (error) {
    // Handle errors by logging and exiting with non-zero code
    logger.error('Error generating report', { error });
    console.error(error.message);
    process.exit(1);
  }
}

// Execute the main function
main();