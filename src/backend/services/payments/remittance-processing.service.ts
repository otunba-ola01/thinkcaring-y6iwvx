# src/backend/services/payments/remittance-processing.service.ts
```typescript
import { UUID, Money, RepositoryOptions } from '../../types/common.types'; // Import common type definitions used in remittance processing
import {
  Payment,
  PaymentWithRelations,
  RemittanceInfo,
  RemittanceDetail,
  ImportRemittanceDto,
  RemittanceProcessingResult,
  RemittanceFileType,
  ReconciliationStatus,
  PaymentMethod,
} from '../../types/payments.types'; // Import payment and remittance type definitions
import { Claim } from '../../types/claims.types'; // Import claim type definitions for matching remittance details to claims
import { paymentRepository } from '../../database/repositories/payment.repository'; // Access payment data in the database
import { claimRepository } from '../../database/repositories/claim.repository'; // Find claims matching remittance details
import { db } from '../../database/connection'; // Database transaction management for remittance processing
import { paymentMatchingService } from './payment-matching.service'; // Find potential claim matches for remittance details
import RemittanceAdapter from '../../integrations/adapters/remittance.adapter'; // Process remittance files from various sources and formats
import { ValidationError } from '../../errors/validation-error'; // Error handling for validation failures
import { IntegrationError } from '../../errors/integration-error'; // Error handling for integration failures
import { logger } from '../../utils/logger'; // Logging for remittance processing operations
import { parse } from 'path';

/**
 * Service for processing electronic remittance advice files and creating payment records
 */
export class RemittanceProcessingService {
  /** @property {RemittanceAdapter} remittanceAdapter - Adapter for processing remittance files */
  private remittanceAdapter: RemittanceAdapter;

  /**
   * Creates a new remittance processing service instance
   */
  constructor() {
    this.remittanceAdapter = new RemittanceAdapter({
      id: 'remittance-adapter-id' as UUID,
      name: 'Remittance Adapter',
      description: 'Processes remittance files from various sources',
      type: 0,
      protocol: 0,
      baseUrl: '',
      authType: 0,
      credentials: {},
      headers: {},
      status: 0,
      timeout: 5000,
      retryLimit: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, {
      sourceType: 'file',
      fileFormat: 0,
      importDirectory: '',
      archiveDirectory: '',
      errorDirectory: '',
      processingFrequency: '',
      lastProcessedDate: new Date(),
      archiveProcessedFiles: true,
      archiveFailedFiles: true,
    });
    // Initialize remittance adapter
    // Log service initialization
    logger.info('RemittanceProcessingService initialized');
  }

  /**
   * Processes a remittance file and creates payment records
   * @async
   * @method processRemittanceFile
   * @param {ImportRemittanceDto} importData - Data for importing the remittance file
   * @param {RepositoryOptions} options - Repository options
   * @returns {Promise<RemittanceProcessingResult>} Results of the remittance processing operation
   */
  async processRemittanceFile(
    importData: ImportRemittanceDto,
    options: RepositoryOptions = {}
  ): Promise<RemittanceProcessingResult> {
    // Validate import data (payerId, fileContent, fileType)
    this.validateImportData(importData);

    // Begin database transaction if not provided in options
    const transaction = options.transaction || (await db.getTransaction());
    const transactionOptions = { ...options, transaction };

    try {
      // Parse remittance file using appropriate parser based on fileType
      const parsedRemittance = await this.parseRemittanceFile(
        importData.fileContent.toString(),
        importData.fileType
      );

      // Extract payment information (date, amount, method, reference number)
      const { header, details } = parsedRemittance;

      // Create payment record using paymentRepository
      const payment = await this.createPaymentFromRemittance(
        importData.payerId,
        header,
        transactionOptions
      );

      // Create remittance info record
      const remittanceInfo = await this.createRemittanceInfo(
        payment.id,
        header,
        importData.fileType,
        importData.originalFilename,
        transactionOptions
      );

      // Process remittance details and create detail records
      const { details: remittanceDetails, claimsMatched } = await this.createRemittanceDetails(
        remittanceInfo.id,
        details,
        transactionOptions
      );

      // Calculate processing statistics (details processed, claims matched, etc.)
      const detailsProcessed = remittanceDetails.length;

      // Update payment reconciliation status based on matching results
      const reconciliationStatus = this.calculateReconciliationStatus(detailsProcessed, claimsMatched);
      await paymentRepository.updateReconciliationStatus(payment.id, reconciliationStatus, transactionOptions);

      // Commit transaction if started in this method
      if (!options.transaction) {
        await transaction.commit();
      }

      // Return processing results with payment, remittance info, and statistics
      logger.info('Remittance processing completed', {
        paymentId: payment.id,
        remittanceInfoId: remittanceInfo.id,
        detailsProcessed,
        claimsMatched,
      });

      return {
        payment: await paymentRepository.findByIdWithRelations(payment.id, transactionOptions),
        remittanceInfo,
        detailsProcessed,
        claimsMatched,
        claimsUnmatched: detailsProcessed - claimsMatched,
        totalAmount: payment.paymentAmount,
        matchedAmount: payment.paymentAmount, // TODO: Calculate matched amount
        unmatchedAmount: 0, // TODO: Calculate unmatched amount
        errors: [], // TODO: Implement error tracking
      } as RemittanceProcessingResult;
    } catch (error) {
      // Rollback transaction and rethrow
      if (!options.transaction) {
        await transaction.rollback(error);
      }
      logger.error('Error processing remittance file', {
        error,
        payerId: importData.payerId,
        fileType: importData.fileType,
        filename: importData.originalFilename,
      });
      throw error;
    }
  }

  /**
   * Parses a remittance file based on its format
   * @async
   * @method parseRemittanceFile
   * @param {string} fileContent - Content of the remittance file
   * @param {RemittanceFileType} fileType - Type of the remittance file
   * @returns {Promise<{ header: any; details: any[] }>} Parsed remittance data
   */
  async parseRemittanceFile(
    fileContent: string,
    fileType: RemittanceFileType
  ): Promise<{ header: any; details: any[] }> {
    // Validate file content and type
    if (!fileContent) {
      throw new IntegrationError({
        message: 'File content is required',
        service: 'RemittanceProcessingService',
        endpoint: 'parseRemittanceFile',
        retryable: false,
      });
    }
    if (!fileType) {
      throw new IntegrationError({
        message: 'File type is required',
        service: 'RemittanceProcessingService',
        endpoint: 'parseRemittanceFile',
        retryable: false,
      });
    }

    try {
      // Determine parser based on file type (EDI_835, CSV, PDF, EXCEL, CUSTOM)
      let parsedData: any;
      switch (fileType) {
        case RemittanceFileType.EDI_835:
          // Use x12-parser to parse EDI file
          // TODO: Implement EDI parsing logic
          parsedData = { header: {}, details: [] };
          break;
        case RemittanceFileType.CSV:
          // Use csv-parse to parse CSV file
          // TODO: Implement CSV parsing logic
          parsedData = { header: {}, details: [] };
          break;
        case RemittanceFileType.PDF:
          // Extract text and parse structured data
          // TODO: Implement PDF parsing logic
          parsedData = { header: {}, details: [] };
          break;
        case RemittanceFileType.EXCEL:
          // Parse Excel file data
          // TODO: Implement Excel parsing logic
          parsedData = { header: {}, details: [] };
          break;
        case RemittanceFileType.CUSTOM:
          // Use custom parser based on mapping configuration
          // TODO: Implement custom parsing logic
          parsedData = { header: {}, details: [] };
          break;
        default:
          throw new IntegrationError({
            message: `Unsupported file type: ${fileType}`,
            service: 'RemittanceProcessingService',
            endpoint: 'parseRemittanceFile',
            retryable: false,
          });
      }

      // Extract header information (remittance ID, payment date, amount, etc.)
      const header = parsedData.header;

      // Extract detail line items (claims, adjustments)
      const details = parsedData.details;

      // Return structured remittance data with header and details
      return { header, details };
    } catch (error) {
      // Handle parsing errors and throw IntegrationError with details
      logger.error('Error parsing remittance file', {
        error,
        fileType,
      });
      throw new IntegrationError({
        message: `Error parsing remittance file: ${error.message}`,
        service: 'RemittanceProcessingService',
        endpoint: 'parseRemittanceFile',
        retryable: false,
      });
    }
  }

  /**
   * Creates a payment record from remittance data
   * @async
   * @method createPaymentFromRemittance
   * @param {UUID} payerId - Payer ID
   * @param {any} remittanceHeader - Remittance header data
   * @param {RepositoryOptions} options - Repository options
   * @returns {Promise<Payment>} The created payment record
   */
  async createPaymentFromRemittance(
    payerId: UUID,
    remittanceHeader: any,
    options: RepositoryOptions = {}
  ): Promise<Payment> {
    // Extract payment information from remittance header
    const paymentDate = remittanceHeader.paymentDate;
    const paymentAmount = remittanceHeader.paymentAmount;
    const referenceNumber = remittanceHeader.referenceNumber;

    // Determine payment method based on remittance data
    const paymentMethod = this.determinePaymentMethod(remittanceHeader);

    // Create payment object with payerId, paymentDate, paymentAmount, etc.
    const paymentData: Payment = {
      id: null as any, // Assigned by database
      payerId,
      paymentDate,
      paymentAmount,
      paymentMethod,
      referenceNumber,
      checkNumber: null, // TODO: Extract check number from remittance
      remittanceId: null, // Assigned during remittance info creation
      reconciliationStatus: ReconciliationStatus.UNRECONCILED,
      notes: null,
      status: 0,
      createdAt: null as any, // Assigned by database
      updatedAt: null as any, // Assigned by database
      createdBy: null, // Assigned by database
      updatedBy: null, // Assigned by database
    };

    try {
      // Create payment record using paymentRepository
      const payment = await paymentRepository.create(paymentData, options);

      // Return created payment record
      logger.info('Payment created from remittance', {
        paymentId: payment.id,
        payerId,
        paymentAmount,
      });
      return payment;
    } catch (error) {
      logger.error('Error creating payment from remittance', {
        error,
        payerId,
        paymentAmount,
      });
      throw error;
    }
  }

  /**
   * Creates a remittance info record associated with a payment
   * @async
   * @method createRemittanceInfo
   * @param {UUID} paymentId - Payment ID
   * @param {any} remittanceHeader - Remittance header data
   * @param {RemittanceFileType} fileType - File type of the remittance
   * @param {string} originalFilename - Original filename of the remittance file
   * @param {RepositoryOptions} options - Repository options
   * @returns {Promise<RemittanceInfo>} The created remittance info record
   */
  async createRemittanceInfo(
    paymentId: UUID,
    remittanceHeader: any,
    fileType: RemittanceFileType,
    originalFilename: string,
    options: RepositoryOptions = {}
  ): Promise<RemittanceInfo> {
    // Create remittance info object with paymentId, remittance number, date, etc.
    const remittanceInfoData: RemittanceInfo = {
      id: null as any, // Assigned by database
      paymentId,
      remittanceNumber: remittanceHeader.remittanceNumber,
      remittanceDate: remittanceHeader.remittanceDate,
      payerIdentifier: remittanceHeader.payerIdentifier,
      payerName: remittanceHeader.payerName,
      totalAmount: remittanceHeader.totalAmount,
      claimCount: remittanceHeader.claimCount,
      fileType,
      originalFilename,
      storageLocation: null, // TODO: Implement storage and set location
      status: 0,
      createdAt: null as any, // Assigned by database
      updatedAt: null as any, // Assigned by database
    };

    try {
      // Store remittance information in the database
      const remittanceInfo = await paymentRepository.saveRemittanceInfo(paymentId, remittanceInfoData, options);

      // Return created remittance info record
      logger.info('Remittance info created', {
        paymentId,
        remittanceInfoId: remittanceInfo.id,
        fileType,
        originalFilename,
      });
      return remittanceInfo;
    } catch (error) {
      logger.error('Error creating remittance info', {
        error,
        paymentId,
        fileType,
        originalFilename,
      });
      throw error;
    }
  }

  /**
   * Creates remittance detail records associated with remittance info
   * @async
   * @method createRemittanceDetails
   * @param {UUID} remittanceInfoId - Remittance info ID
   * @param {any[]} remittanceDetails - Array of remittance detail items
   * @param {RepositoryOptions} options - Repository options
   * @returns {Promise<{ details: RemittanceDetail[]; claimsMatched: number }>} Created details and match count
   */
  async createRemittanceDetails(
    remittanceInfoId: UUID,
    remittanceDetails: any[],
    options: RepositoryOptions = {}
  ): Promise<{ details: RemittanceDetail[]; claimsMatched: number }> {
    let claimsMatched = 0;
    const details: RemittanceDetail[] = [];

    // Process each remittance detail item
    for (const detailItem of remittanceDetails) {
      // For each detail, attempt to find matching claim by claim number
      const claimId = await this.matchRemittanceDetailToClaim(detailItem, options);

      // Create remittance detail object with remittanceInfoId, claimNumber, etc.
      const remittanceDetailData: RemittanceDetail = {
        id: null as any, // Assigned by database
        remittanceInfoId,
        claimNumber: detailItem.claimNumber,
        claimId,
        serviceDate: detailItem.serviceDate,
        billedAmount: detailItem.billedAmount,
        paidAmount: detailItem.paidAmount,
        adjustmentAmount: detailItem.adjustmentAmount,
        adjustmentCodes: detailItem.adjustmentCodes,
        status: 0,
        createdAt: null as any, // Assigned by database
        updatedAt: null as any, // Assigned by database
      };

      try {
        // Store remittance detail records in the database
        // TODO: Implement remittance detail storage
        details.push(remittanceDetailData);

        // Link to claim if match found (set claimId)
        if (claimId) {
          claimsMatched++;
        }
      } catch (error) {
        logger.error('Error creating remittance detail', {
          error,
          remittanceInfoId,
          claimNumber: detailItem.claimNumber,
        });
        throw error;
      }
    }

    // Return created details and claims matched count
    logger.info('Remittance details created', {
      remittanceInfoId,
      detailsCount: details.length,
      claimsMatched,
    });
    return { details, claimsMatched };
  }

  /**
   * Attempts to match a remittance detail to a claim
   * @async
   * @method matchRemittanceDetailToClaim
   * @param {any} detailItem - Remittance detail item
   * @param {RepositoryOptions} options - Repository options
   * @returns {Promise<UUID | null>} Matched claim ID or null if no match found
   */
  async matchRemittanceDetailToClaim(
    detailItem: any,
    options: RepositoryOptions = {}
  ): Promise<UUID | null> {
    // Extract claim identifiers from detail item (claim number, patient info, etc.)
    const claimNumber = detailItem.claimNumber;

    try {
      // If claim number available, search by exact claim number
      if (claimNumber) {
        const claim = await claimRepository.findByClaimNumber(claimNumber, options);
        if (claim) {
          logger.debug('Claim matched by claim number', {
            claimNumber,
            claimId: claim.id,
          });
          return claim.id;
        }
      }

      // If no direct match, try alternative identifiers (patient ID, service date, amount)
      // TODO: Implement alternative matching logic

      // Return claim ID if match found, null otherwise
      logger.debug('No claim match found for remittance detail', {
        claimNumber,
      });
      return null;
    } catch (error) {
      logger.error('Error matching remittance detail to claim', {
        error,
        claimNumber,
      });
      throw error;
    }
  }

  /**
   * Calculates the reconciliation status based on matching results
   * @method calculateReconciliationStatus
   * @param {number} detailsCount - Number of remittance detail items
   * @param {number} matchedCount - Number of claims matched
   * @returns {ReconciliationStatus} The calculated reconciliation status
   */
  calculateReconciliationStatus(detailsCount: number, matchedCount: number): ReconciliationStatus {
    // If no details, return UNRECONCILED
    if (detailsCount === 0) {
      return ReconciliationStatus.UNRECONCILED;
    }
    // If all details matched (matchedCount === detailsCount), return RECONCILED
    if (matchedCount === detailsCount) {
      return ReconciliationStatus.RECONCILED;
    }
    // If some details matched (matchedCount > 0), return PARTIALLY_RECONCILED
    if (matchedCount > 0) {
      return ReconciliationStatus.PARTIALLY_RECONCILED;
    }
    // Otherwise, return UNRECONCILED
    return ReconciliationStatus.UNRECONCILED;
  }

  /**
   * Validates remittance import data
   * @method validateImportData
   * @param {ImportRemittanceDto} importData - Remittance import data
   * @returns {void} Throws ValidationError if validation fails
   */
  validateImportData(importData: ImportRemittanceDto): void {
    // Check if payerId is provided and valid
    if (!importData.payerId) {
      throw new ValidationError('Payer ID is required');
    }

    // Check if fileContent is provided and not empty
    if (!importData.fileContent) {
      throw new ValidationError('File content is required');
    }

    // Check if fileType is provided and valid
    if (!importData.fileType) {
      throw new ValidationError('File type is required');
    }
  }

  /**
   * Determines payment method from remittance data
   * @method determinePaymentMethod
   * @param {any} remittanceHeader - Remittance header data
   * @returns {PaymentMethod} The determined payment method
   */
  determinePaymentMethod(remittanceHeader: any): PaymentMethod {
    // Extract payment method indicator from remittance header
    const paymentMethodIndicator = remittanceHeader.paymentMethodIndicator;

    // Map external payment method code to internal PaymentMethod enum
    // For 835 EDI: Check BPR04 segment for payment method code
    // TODO: Implement payment method mapping logic

    // Return appropriate PaymentMethod (EFT, CHECK, CREDIT_CARD, etc.)
    return PaymentMethod.EFT; // Default to EFT if not determinable
  }
}

// Create a singleton instance of the service
const remittanceProcessingService = new RemittanceProcessingService();

// Export the service instance for use throughout the application
export { RemittanceProcessingService, remittanceProcessingService };