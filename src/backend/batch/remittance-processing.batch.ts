import path from 'path'; // version 0.12.7
import fs from 'fs-extra'; // version 11.1.0

import { batchManager, registerJobHandler } from './batch-manager';
import { remittanceProcessingService } from '../services/payments/remittance-processing.service';
import { UUID } from '../types/common.types';
import { RemittanceFileType, ImportRemittanceDto } from '../types/payments.types';
import { IntegrationType, IntegrationProtocol, DataFormat, RemittanceIntegrationConfig } from '../types/integration.types';
import { db } from '../database/connection';
import { payerRepository } from '../database/repositories/payer.repository';
import RemittanceAdapter from '../integrations/adapters/remittance.adapter';
import { IntegrationError } from '../errors/integration-error';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notification.service'; // Import NotificationService
const REMITTANCE_JOB_TYPE = 'remittance-processing';
const DEFAULT_BATCH_SIZE = 50;

/**
 * Processes remittance files from configured sources
 * @param jobData - Data for the job including payerId, fromDate, toDate, and batchSize
 * @returns Results of the remittance processing operation
 */
async function processRemittanceFiles(jobData: any): Promise<{ processed: number; failed: number; totalAmount: number }> {
  // Extract parameters from jobData (payerId, fromDate, toDate, batchSize)
  const payerId: UUID | undefined = jobData.payerId;
  const fromDate: Date | undefined = jobData.fromDate ? new Date(jobData.fromDate) : undefined;
  const toDate: Date | undefined = jobData.toDate ? new Date(jobData.toDate) : undefined;
  const batchSize: number = jobData.batchSize || DEFAULT_BATCH_SIZE;

  // Set default values for missing parameters
  logger.info('Processing remittance files', { payerId, fromDate, toDate, batchSize });

  // Retrieve payer information if payerId is provided
  let payer: any = null;
  if (payerId) {
    payer = await payerRepository.findById(payerId);
    if (!payer) {
      throw new Error(`Payer with ID ${payerId} not found`);
    }
  }

  // Get integration configuration for the payer
  const integrationConfig = await getRemittanceIntegrationConfig(payer);

  // Initialize RemittanceAdapter with configuration
  if (!integrationConfig) {
    throw new Error(`No remittance integration configured for payer ${payerId}`);
  }
  const remittanceAdapter = new RemittanceAdapter(integrationConfig, integrationConfig.remittanceConfig);

  // Connect to the remittance source
  await remittanceAdapter.connect();

  // List available remittance files based on date range
  const files = await remittanceAdapter.listRemittanceFiles(fromDate, toDate);

  // Process files up to the specified batch size
  let processed = 0;
  let failed = 0;
  let totalAmount = 0;
  for (const file of files.slice(0, batchSize)) {
    try {
      // Retrieve content and metadata for the file
      const { content, metadata } = await remittanceAdapter.getRemittanceFile(file.fileName);

      // Process the remittance file
      const fileType = mapFileTypeToRemittanceType(metadata.fileFormat);
      const result = await processRemittanceFile(payerId, content, fileType, file.fileName);

      // Archive successfully processed files
      if (result.success) {
        await remittanceAdapter.archiveRemittanceFile(file.fileName, true);
        processed++;
        totalAmount += result.amount;
      } else {
        await remittanceAdapter.archiveRemittanceFile(file.fileName, false);
        failed++;
      }
    } catch (error) {
      logger.error(`Error processing remittance file ${file.fileName}`, { error });
      failed++;
    }
  }

  // Disconnect from the remittance source
  await remittanceAdapter.disconnect();

  // Send notification with processing results
  await NotificationService.sendSystemNotification(
    'system',
    'remittance_processing_complete',
    'info',
    { processed, failed, totalAmount }
  );

  // Return processing statistics (processed, failed, totalAmount)
  return { processed, failed, totalAmount };
}

/**
 * Processes a single remittance file
 * @param payerId - Payer ID
 * @param fileContent - Content of the file
 * @param fileType - Type of the file
 * @param fileName - Name of the file
 * @returns Result of processing a single file
 */
async function processRemittanceFile(payerId: UUID, fileContent: string, fileType: RemittanceFileType, fileName: string): Promise<{ success: boolean; paymentId?: UUID; amount: number; error?: string }> {
  // Create ImportRemittanceDto with payerId, fileContent, and fileType
  const importData: ImportRemittanceDto = {
    payerId,
    fileContent,
    fileType,
    originalFilename: fileName,
    mappingConfig: null // TODO: Implement mapping configuration
  };

  // Begin database transaction
  const transaction = await db.transaction();

  try {
    // Call remittanceProcessingService.processRemittanceFile
    const result = await remittanceProcessingService.processRemittanceFile(importData, { transaction });

    // Extract payment information from processing result
    const paymentId = result.payment?.id;
    const amount = result.payment?.paymentAmount;

    // Commit transaction if successful
    await transaction.commit();

    // Return success result with payment ID and amount
    return { success: true, paymentId, amount };
  } catch (error) {
    // Rollback transaction
    await transaction.rollback(error);

    // Log error details
    logger.error(`Error processing remittance file ${fileName}`, { error });

    // Return failure result with error message
    return { success: false, error: error.message, amount: 0 };
  }
}

/**
 * Schedules remittance processing jobs for all payers
 */
async function scheduleRemittanceProcessing(): Promise<void> {
  // Retrieve all active payers from the database
  const payers = await payerRepository.findAll();

  // For each payer with remittance integration configured:
  for (const payer of payers) {
    try {
      // Get integration configuration for the payer
      const integrationConfig = await getRemittanceIntegrationConfig(payer);

      // Determine appropriate schedule based on payer configuration
      if (integrationConfig) {
        // Schedule recurring job for the payer
        const jobData = { payerId: payer.id };
        await batchManager.scheduleJob(REMITTANCE_JOB_TYPE, integrationConfig.remittanceConfig.processingFrequency, jobData);
        logger.info(`Scheduled remittance processing job for payer ${payer.id}`, { payerId: payer.id, schedule: integrationConfig.remittanceConfig.processingFrequency });
      }
    } catch (error) {
      // Log error and continue to next payer
      logger.error(`Error scheduling remittance processing job for payer ${payer.id}`, { error });
    }
  }
}

/**
 * Retrieves remittance integration configuration for a payer
 * @param payer - Payer object
 * @returns Integration configuration if available, null otherwise
 */
async function getRemittanceIntegrationConfig(payer: any): Promise<RemittanceIntegrationConfig | null> {
  // Check if payer has integrations configured
  if (!payer?.integrations) {
    return null;
  }

  // Find remittance integration configuration
  const remittanceIntegration = payer.integrations.find(
    (integration: any) => integration.type === IntegrationType.REMITTANCE
  );

  // Return configuration if found, null otherwise
  return remittanceIntegration || null;
}

/**
 * Maps file format to remittance file type
 * @param format - Data format
 * @returns The corresponding remittance file type
 */
function mapFileTypeToRemittanceType(format: DataFormat): RemittanceFileType {
  switch (format) {
    case DataFormat.X12:
      return RemittanceFileType.EDI_835;
    case DataFormat.CSV:
      return RemittanceFileType.CSV;
    case DataFormat.JSON:
      return RemittanceFileType.CUSTOM;
    case DataFormat.PDF:
      return RemittanceFileType.PDF;
    case DataFormat.EXCEL:
      return RemittanceFileType.EXCEL;
    default:
      return RemittanceFileType.CUSTOM;
  }
}

/**
 * Initializes the remittance processing job handler
 */
function initializeRemittanceProcessingJob(): void {
  // Register job handler for REMITTANCE_JOB_TYPE
  registerJobHandler(REMITTANCE_JOB_TYPE, processRemittanceFiles);

  // Log job handler registration
  logger.info('Registered remittance processing job handler');
}

// Export functions
export { processRemittanceFiles, scheduleRemittanceProcessing, initializeRemittanceProcessingJob };