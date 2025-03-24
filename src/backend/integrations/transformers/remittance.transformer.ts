import { UUID, Money } from '../../types/common.types';
import { 
  DataFormat, 
  IntegrationTransformer 
} from '../../types/integration.types';
import { 
  RemittanceInfo, 
  RemittanceDetail,
  RemittanceFileType 
} from '../../types/payments.types';
import ValidationError from '../../errors/validation-error';
import IntegrationError from '../../errors/integration-error';
import logger from '../../utils/logger';
import { formatDate, parseDate } from '../../utils/date';

// External dependencies
import * as x12Parser from 'x12-parser'; // version 1.0.0
import { parse as parseCsv } from 'csv-parse/sync'; // version 5.3.0

/**
 * Transformer for converting remittance data between external formats and internal data model.
 * Handles X12 835 EDI, CSV, and JSON formats for remittance advice processing.
 * 
 * This transformer supports:
 * - Parsing incoming remittance files (X12 835, CSV, JSON)
 * - Converting to standardized internal format
 * - Transforming internal format back to external formats when needed
 * - Validating data structure and contents
 */
export class RemittanceTransformer implements IntegrationTransformer {
  /**
   * Creates a new RemittanceTransformer instance
   */
  constructor() {
    logger.info('RemittanceTransformer initialized');
  }

  /**
   * Transforms request data from internal format to external format
   * 
   * @param data Internal data to transform to external format
   * @param format Target format (X12, CSV, JSON)
   * @returns Transformed data in the target format
   * @throws ValidationError if the data is invalid
   * @throws IntegrationError if transformation fails
   */
  public transformRequest(data: any, format: DataFormat): any {
    logger.debug('Transforming remittance request data', { format });
    
    try {
      // Validate input
      if (!data) {
        throw new ValidationError('No data provided for transformation');
      }
      
      // Transform based on target format
      switch (format) {
        case DataFormat.X12:
          return this.transformInternalToX12(data);
        case DataFormat.CSV:
          return this.transformInternalToCsv(data);
        case DataFormat.JSON:
          return this.transformInternalToJson(data);
        default:
          throw new ValidationError(`Unsupported format for remittance data: ${format}`);
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof IntegrationError) {
        throw error;
      }
      
      throw new IntegrationError({
        message: `Failed to transform remittance data to ${format}: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformRequest'
      });
    }
  }

  /**
   * Transforms response data from external format to internal format
   * 
   * @param data External data to transform to internal format
   * @param format Source format (X12, CSV, JSON)
   * @returns Transformed data in internal format
   * @throws ValidationError if the data is invalid
   * @throws IntegrationError if transformation fails
   */
  public transformResponse(data: any, format: DataFormat): { header: RemittanceInfo; details: RemittanceDetail[] } {
    logger.debug('Transforming remittance response data', { format });
    
    try {
      // Validate input
      if (!data) {
        throw new ValidationError('No data provided for transformation');
      }
      
      // Transform based on source format
      let result: { header: RemittanceInfo; details: RemittanceDetail[] };
      
      switch (format) {
        case DataFormat.X12:
          result = this.transformX12ToInternal(data);
          break;
        case DataFormat.CSV:
          result = this.transformCsvToInternal(data);
          break;
        case DataFormat.JSON:
          result = this.transformJsonToInternal(data);
          break;
        default:
          throw new ValidationError(`Unsupported format for remittance data: ${format}`);
      }
      
      // Normalize and validate the transformed data
      const normalized = this.normalizeRemittanceData(result.header, result.details);
      this.validateRemittanceData(normalized.header, normalized.details);
      
      logger.debug('Successfully transformed remittance data', { 
        format, 
        detailCount: normalized.details.length 
      });
      
      return normalized;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof IntegrationError) {
        throw error;
      }
      
      throw new IntegrationError({
        message: `Failed to transform remittance data from ${format}: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformResponse'
      });
    }
  }

  /**
   * Transforms X12 835 EDI data to internal format
   * 
   * @param x12Data X12 835 EDI data as string
   * @returns Transformed remittance data
   * @throws IntegrationError if parsing fails
   */
  private transformX12ToInternal(x12Data: string): { header: RemittanceInfo; details: RemittanceDetail[] } {
    logger.debug('Transforming X12 835 data to internal format');
    
    try {
      // Parse X12 835 data using x12-parser
      const parsedData = x12Parser.parse(x12Data);
      
      if (!parsedData || !parsedData.interchanges || parsedData.interchanges.length === 0) {
        throw new Error('Invalid X12 835 format or empty file');
      }
      
      // Extract the transaction sets
      const interchange = parsedData.interchanges[0];
      const groups = interchange.groups || [];
      
      if (groups.length === 0 || !groups[0].transactions || groups[0].transactions.length === 0) {
        throw new Error('No transactions found in X12 835 file');
      }
      
      const transaction = groups[0].transactions[0];
      
      // Extract financial information from BPR segment
      const bprSegment = transaction.segments.find((s: any) => s.id === 'BPR');
      if (!bprSegment) {
        throw new Error('BPR segment not found in X12 835 file');
      }
      
      // Extract payer information from N1 segment
      const payerSegment = transaction.segments.find(
        (s: any) => s.id === 'N1' && s.elements[0] === 'PR'
      );
      if (!payerSegment) {
        throw new Error('Payer information not found in X12 835 file');
      }
      
      // Extract remittance identification from TRN segment
      const trnSegment = transaction.segments.find((s: any) => s.id === 'TRN');
      if (!trnSegment) {
        throw new Error('TRN segment not found in X12 835 file');
      }
      
      // Create header information
      const header: RemittanceInfo = {
        id: '' as UUID, // Will be assigned by the database
        paymentId: '' as UUID, // Will be assigned when payment is created
        remittanceNumber: trnSegment.elements[2] || '',
        remittanceDate: formatDate(new Date()) || '',
        payerIdentifier: payerSegment.elements[3] || '',
        payerName: payerSegment.elements[1] || '',
        totalAmount: Number(bprSegment.elements[1]) * 100, // Convert to cents
        claimCount: 0, // Will be calculated based on claims found
        fileType: RemittanceFileType.EDI_835,
        originalFilename: '',
        storageLocation: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Extract claim payment information from CLP segments
      const clpSegments = transaction.segments.filter((s: any) => s.id === 'CLP');
      const details: RemittanceDetail[] = [];
      let currentClp: any = null;
      let currentSvc: any[] = [];
      let currentCas: any[] = [];
      
      // Process all segments to extract claims, services, and adjustments
      for (const segment of transaction.segments) {
        if (segment.id === 'CLP') {
          // If we were processing a previous CLP, add it to details
          if (currentClp) {
            details.push(this.createDetailFromClp(currentClp, currentSvc, currentCas));
          }
          
          // Start processing new CLP
          currentClp = segment;
          currentSvc = [];
          currentCas = [];
        } else if (segment.id === 'SVC' && currentClp) {
          // Service line
          currentSvc.push(segment);
        } else if (segment.id === 'CAS' && currentClp) {
          // Adjustment information
          currentCas.push(segment);
        }
      }
      
      // Add the last CLP if any
      if (currentClp) {
        details.push(this.createDetailFromClp(currentClp, currentSvc, currentCas));
      }
      
      // Update header with claim count
      header.claimCount = details.length;
      
      return { header, details };
    } catch (error) {
      throw new IntegrationError({
        message: `Failed to parse X12 835 data: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformX12ToInternal'
      });
    }
  }

  /**
   * Creates a remittance detail object from CLP, SVC, and CAS segments
   * 
   * @param clp CLP segment data
   * @param svc SVC segment data array
   * @param cas CAS segment data array
   * @returns RemittanceDetail object
   */
  private createDetailFromClp(clp: any, svc: any[], cas: any[]): RemittanceDetail {
    // Extract claim information
    const claimNumber = clp.elements[1] || '';
    const billedAmount = Number(clp.elements[3]) * 100; // Convert to cents
    const paidAmount = Number(clp.elements[4]) * 100; // Convert to cents
    
    // Get service date from SVC segment if available
    let serviceDate = '';
    if (svc.length > 0 && svc[0].elements.length >= 6) {
      serviceDate = svc[0].elements[5] || '';
      // Format date if needed (YYYYMMDD to YYYY-MM-DD)
      if (serviceDate.length === 8) {
        serviceDate = `${serviceDate.substring(0, 4)}-${serviceDate.substring(4, 6)}-${serviceDate.substring(6, 8)}`;
      }
    }
    
    // Process adjustment codes from CAS segments
    const adjustmentCodes: Record<string, string> = {};
    const adjustmentAmount = billedAmount - paidAmount;
    
    cas.forEach(casSegment => {
      const adjustmentGroup = casSegment.elements[0] || '';
      const reason = casSegment.elements[1] || '';
      const amount = casSegment.elements[2] || '0';
      
      adjustmentCodes[`${adjustmentGroup}${reason}`] = `${adjustmentGroup}:${reason}:${amount}`;
    });
    
    return {
      id: '' as UUID, // Will be assigned by the database
      remittanceInfoId: '' as UUID, // Will be linked to the header
      claimNumber,
      claimId: null, // Will be linked later if claim is found
      serviceDate: serviceDate || formatDate(new Date()) || '',
      billedAmount,
      paidAmount,
      adjustmentAmount,
      adjustmentCodes,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transforms CSV data to internal format
   * 
   * @param csvData CSV data as string
   * @returns Transformed remittance data
   * @throws IntegrationError if parsing fails
   */
  private transformCsvToInternal(csvData: string): { header: RemittanceInfo; details: RemittanceDetail[] } {
    logger.debug('Transforming CSV data to internal format');
    
    try {
      // Parse CSV data
      const records = parseCsv(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      if (!records || records.length === 0) {
        throw new Error('No data found in CSV file');
      }
      
      // Try to identify column mappings
      const firstRecord = records[0];
      const columnMap = this.inferCsvColumnMapping(Object.keys(firstRecord));
      
      // Extract header information (might be from first row or need to be derived)
      const headerInfo = this.extractHeaderFromCsv(records, columnMap);
      
      // Create header
      const header: RemittanceInfo = {
        id: '' as UUID,
        paymentId: '' as UUID,
        remittanceNumber: headerInfo.remittanceNumber || '',
        remittanceDate: headerInfo.remittanceDate || formatDate(new Date()) || '',
        payerIdentifier: headerInfo.payerIdentifier || '',
        payerName: headerInfo.payerName || '',
        totalAmount: headerInfo.totalAmount || 0,
        claimCount: records.length,
        fileType: RemittanceFileType.CSV,
        originalFilename: '',
        storageLocation: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Process detail records
      const details: RemittanceDetail[] = records.map(record => {
        const detail: RemittanceDetail = {
          id: '' as UUID,
          remittanceInfoId: '' as UUID,
          claimNumber: this.getColumnValue(record, columnMap.claimNumber, ''),
          claimId: null,
          serviceDate: this.getColumnValue(record, columnMap.serviceDate, formatDate(new Date()) || ''),
          billedAmount: this.parseAmount(this.getColumnValue(record, columnMap.billedAmount, '0')),
          paidAmount: this.parseAmount(this.getColumnValue(record, columnMap.paidAmount, '0')),
          adjustmentAmount: this.parseAmount(this.getColumnValue(record, columnMap.adjustmentAmount, '0')),
          adjustmentCodes: this.parseAdjustmentCodes(record, columnMap),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return detail;
      });
      
      return { header, details };
    } catch (error) {
      throw new IntegrationError({
        message: `Failed to parse CSV data: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformCsvToInternal'
      });
    }
  }

  /**
   * Infers CSV column mapping based on column headers
   * 
   * @param columns Column headers from CSV
   * @returns Mapping of semantic fields to CSV columns
   */
  private inferCsvColumnMapping(columns: string[]): Record<string, string> {
    const mapping: Record<string, string> = {
      claimNumber: '',
      serviceDate: '',
      billedAmount: '',
      paidAmount: '',
      adjustmentAmount: '',
      adjustmentCodes: '',
      remittanceNumber: '',
      payerIdentifier: '',
      payerName: '',
      remittanceDate: ''
    };
    
    // Map column headers to semantic fields based on pattern matching
    columns.forEach(column => {
      const lowerColumn = column.toLowerCase();
      
      if (/claim.?(number|id|identifier)/i.test(lowerColumn)) {
        mapping.claimNumber = column;
      } else if (/service.?date/i.test(lowerColumn)) {
        mapping.serviceDate = column;
      } else if (/(billed|charged|submitted).?(amount|amt|total)/i.test(lowerColumn)) {
        mapping.billedAmount = column;
      } else if (/(paid|payment).?(amount|amt|total)/i.test(lowerColumn)) {
        mapping.paidAmount = column;
      } else if (/(adjustment|adj).?(amount|amt|total)/i.test(lowerColumn)) {
        mapping.adjustmentAmount = column;
      } else if (/(adjustment|adj).?code/i.test(lowerColumn)) {
        mapping.adjustmentCodes = column;
      } else if (/(remittance|remit).?(number|id|identifier)/i.test(lowerColumn)) {
        mapping.remittanceNumber = column;
      } else if (/(payer|payor).?(identifier|id|number)/i.test(lowerColumn)) {
        mapping.payerIdentifier = column;
      } else if (/(payer|payor).?name/i.test(lowerColumn)) {
        mapping.payerName = column;
      } else if (/(remittance|remit|payment).?date/i.test(lowerColumn)) {
        mapping.remittanceDate = column;
      }
    });
    
    // For fields we couldn't map, try some fallbacks for common alternative names
    if (!mapping.claimNumber) {
      mapping.claimNumber = columns.find(c => 
        /claim/i.test(c) || /invoice/i.test(c) || /reference/i.test(c)
      ) || '';
    }
    
    if (!mapping.serviceDate) {
      mapping.serviceDate = columns.find(c => 
        /date.*service/i.test(c) || /dos/i.test(c) || /date/i.test(c)
      ) || '';
    }
    
    if (!mapping.billedAmount) {
      mapping.billedAmount = columns.find(c => 
        /billed/i.test(c) || /charged/i.test(c) || /submitted/i.test(c)
      ) || '';
    }
    
    if (!mapping.paidAmount) {
      mapping.paidAmount = columns.find(c => 
        /paid/i.test(c) || /payment/i.test(c) || /reimbursed/i.test(c) || /allowed/i.test(c)
      ) || '';
    }
    
    return mapping;
  }

  /**
   * Extracts header information from CSV records
   * 
   * @param records CSV records
   * @param columnMap Column mapping
   * @returns Header information
   */
  private extractHeaderFromCsv(
    records: Record<string, string>[], 
    columnMap: Record<string, string>
  ): {
    remittanceNumber: string;
    remittanceDate: string;
    payerIdentifier: string;
    payerName: string;
    totalAmount: number;
  } {
    // Try to find header information in the records
    // Header information might be in a specific row or need to be derived
    
    // Check if any record has the remittance number and date
    const headerRecord = records.find(r => 
      this.getColumnValue(r, columnMap.remittanceNumber, '') !== '' &&
      this.getColumnValue(r, columnMap.remittanceDate, '') !== ''
    );
    
    if (headerRecord) {
      // If we found a header record, use it
      return {
        remittanceNumber: this.getColumnValue(headerRecord, columnMap.remittanceNumber, ''),
        remittanceDate: this.getColumnValue(headerRecord, columnMap.remittanceDate, ''),
        payerIdentifier: this.getColumnValue(headerRecord, columnMap.payerIdentifier, ''),
        payerName: this.getColumnValue(headerRecord, columnMap.payerName, ''),
        totalAmount: this.calculateTotalFromRecords(records, columnMap.paidAmount)
      };
    }
    
    // If we didn't find a header record, try to derive the information
    // Use the first record for remittance info if available
    const firstRecord = records[0];
    
    // Generate a remittance number if none found
    const remittanceNumber = this.getColumnValue(firstRecord, columnMap.remittanceNumber, '') || 
      `CSV-${new Date().toISOString().replace(/[:\-T]/g, '')}`;
    
    // Use current date if no remittance date found
    const remittanceDate = this.getColumnValue(firstRecord, columnMap.remittanceDate, '') || 
      formatDate(new Date()) || '';
    
    return {
      remittanceNumber,
      remittanceDate,
      payerIdentifier: this.getColumnValue(firstRecord, columnMap.payerIdentifier, ''),
      payerName: this.getColumnValue(firstRecord, columnMap.payerName, ''),
      totalAmount: this.calculateTotalFromRecords(records, columnMap.paidAmount)
    };
  }

  /**
   * Calculates total amount from a column in CSV records
   * 
   * @param records CSV records
   * @param column Column name with amount values
   * @returns Total amount in cents
   */
  private calculateTotalFromRecords(records: Record<string, string>[], column: string): number {
    if (!column) return 0;
    
    return records.reduce((total, record) => {
      const amount = this.parseAmount(this.getColumnValue(record, column, '0'));
      return total + amount;
    }, 0);
  }

  /**
   * Gets a value from a record using column mapping
   * 
   * @param record CSV record
   * @param column Column name
   * @param defaultValue Default value if column not found
   * @returns Value from record or default
   */
  private getColumnValue(record: Record<string, string>, column: string, defaultValue: string): string {
    if (!column || !record[column]) {
      return defaultValue;
    }
    return record[column];
  }

  /**
   * Parses adjustment codes from a CSV record
   * 
   * @param record CSV record
   * @param columnMap Column mapping
   * @returns Adjustment codes object
   */
  private parseAdjustmentCodes(
    record: Record<string, string>, 
    columnMap: Record<string, string>
  ): Record<string, string> {
    const adjustmentCodes: Record<string, string> = {};
    
    // Check if we have a specific column for adjustment codes
    if (columnMap.adjustmentCodes && record[columnMap.adjustmentCodes]) {
      const codes = record[columnMap.adjustmentCodes].split(',');
      codes.forEach((code, index) => {
        code = code.trim();
        if (code) {
          adjustmentCodes[`ADJ${index}`] = code;
        }
      });
    } else {
      // Look for columns that might contain adjustment codes
      // Common patterns: ADJ1, ADJCODE1, REASON1, etc.
      Object.keys(record).forEach(column => {
        if (/adj.*\d+/i.test(column) || /reason.*\d+/i.test(column) || /code.*\d+/i.test(column)) {
          const value = record[column].trim();
          if (value) {
            adjustmentCodes[column] = value;
          }
        }
      });
    }
    
    return adjustmentCodes;
  }

  /**
   * Transforms JSON data to internal format
   * 
   * @param jsonData JSON data as string
   * @returns Transformed remittance data
   * @throws IntegrationError if parsing fails
   */
  private transformJsonToInternal(jsonData: string): { header: RemittanceInfo; details: RemittanceDetail[] } {
    logger.debug('Transforming JSON data to internal format');
    
    try {
      // Parse JSON string to object
      const parsedData = JSON.parse(jsonData);
      
      if (!parsedData) {
        throw new Error('Invalid JSON data or empty file');
      }
      
      // Check if this is an array (multiple remittance records) or object (single remittance)
      const jsonHeader = parsedData.header || parsedData.remittance || parsedData;
      const jsonDetails = parsedData.details || parsedData.claims || parsedData.lines || [];
      
      // Validate essential header information
      if (!jsonHeader.remittanceNumber && !jsonHeader.number && !jsonHeader.id) {
        throw new Error('Remittance number not found in JSON data');
      }
      
      // Create header
      const header: RemittanceInfo = {
        id: '' as UUID,
        paymentId: '' as UUID,
        remittanceNumber: jsonHeader.remittanceNumber || jsonHeader.number || jsonHeader.id || '',
        remittanceDate: jsonHeader.remittanceDate || jsonHeader.date || formatDate(new Date()) || '',
        payerIdentifier: jsonHeader.payerIdentifier || jsonHeader.payerId || '',
        payerName: jsonHeader.payerName || jsonHeader.payer || '',
        totalAmount: this.parseAmount(jsonHeader.totalAmount || jsonHeader.amount || '0'),
        claimCount: Array.isArray(jsonDetails) ? jsonDetails.length : 0,
        fileType: RemittanceFileType.CUSTOM,
        originalFilename: '',
        storageLocation: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Process details
      const details: RemittanceDetail[] = [];
      
      if (Array.isArray(jsonDetails)) {
        jsonDetails.forEach(detail => {
          // Normalize field names as JSON formats can vary widely
          const detailObj: RemittanceDetail = {
            id: '' as UUID,
            remittanceInfoId: '' as UUID,
            claimNumber: detail.claimNumber || detail.claim || detail.id || '',
            claimId: null,
            serviceDate: detail.serviceDate || detail.date || formatDate(new Date()) || '',
            billedAmount: this.parseAmount(detail.billedAmount || detail.billed || detail.charged || '0'),
            paidAmount: this.parseAmount(detail.paidAmount || detail.paid || detail.payment || '0'),
            adjustmentAmount: this.parseAmount(detail.adjustmentAmount || detail.adjustment || '0'),
            adjustmentCodes: this.parseJsonAdjustmentCodes(detail),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          details.push(detailObj);
        });
      }
      
      return { header, details };
    } catch (error) {
      throw new IntegrationError({
        message: `Failed to parse JSON data: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformJsonToInternal'
      });
    }
  }

  /**
   * Parses adjustment codes from a JSON detail object
   * 
   * @param detail JSON detail object
   * @returns Adjustment codes object
   */
  private parseJsonAdjustmentCodes(detail: any): Record<string, string> {
    const adjustmentCodes: Record<string, string> = {};
    
    // Check various possible field names for adjustment codes
    if (detail.adjustmentCodes && typeof detail.adjustmentCodes === 'object') {
      // If adjustment codes are provided as an object, use them directly
      return detail.adjustmentCodes;
    } else if (detail.adjustments && Array.isArray(detail.adjustments)) {
      // If adjustments are provided as an array of objects
      detail.adjustments.forEach((adjustment: any, index: number) => {
        const code = adjustment.code || adjustment.reason || '';
        const amount = adjustment.amount || '0';
        if (code) {
          adjustmentCodes[`ADJ${index}`] = `${code}:${amount}`;
        }
      });
    } else if (detail.adjustmentCode && detail.adjustmentAmount) {
      // Single adjustment with code and amount
      adjustmentCodes.ADJ = `${detail.adjustmentCode}:${detail.adjustmentAmount}`;
    }
    
    return adjustmentCodes;
  }

  /**
   * Transforms internal data to X12 835 EDI format
   * 
   * @param data Internal remittance data
   * @returns X12 835 EDI formatted string
   * @throws IntegrationError if transformation fails
   */
  private transformInternalToX12(data: any): string {
    logger.debug('Transforming internal data to X12 835 format');
    
    try {
      // Validate expected data structure
      if (!data || !data.header || !Array.isArray(data.details)) {
        throw new Error('Invalid remittance data structure');
      }
      
      const { header, details } = data;
      
      // Create X12 835 document
      // This is a simplified implementation - in a real system, this would be more complex
      // and would use a dedicated X12 generation library
      
      // Generate unique control numbers
      const isaControlNumber = this.generateControlNumber(9);
      const gsControlNumber = this.generateControlNumber(9);
      const stControlNumber = this.generateControlNumber(4);
      const transactionCount = details.length;
      
      // Format current date for EDI
      const now = new Date();
      const ediDate = now.toISOString().substring(2, 4) + 
                     now.toISOString().substring(5, 7) + 
                     now.toISOString().substring(8, 10);
      const ediTime = now.toISOString().substring(11, 13) + 
                     now.toISOString().substring(14, 16);
      
      // Format payment date
      let paymentDate = header.remittanceDate;
      // Convert from ISO format to YYYYMMDD
      if (paymentDate.includes('-')) {
        paymentDate = paymentDate.replace(/\-/g, '');
      }
      if (paymentDate.length > 8) {
        paymentDate = paymentDate.substring(0, 8);
      }
      
      // Start building the X12 835 document
      let x12 = '';
      
      // ISA - Interchange Control Header
      x12 += 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *';
      x12 += `${ediDate}*${ediTime}*^*00501*${isaControlNumber}*0*P*:~\n`;
      
      // GS - Functional Group Header
      x12 += `GS*HP*SENDER*RECEIVER*${ediDate}*${ediTime}*${gsControlNumber}*X*005010X221A1~\n`;
      
      // ST - Transaction Set Header
      x12 += `ST*835*${stControlNumber}*005010X221A1~\n`;
      
      // BPR - Financial Information
      const totalAmount = (header.totalAmount / 100).toFixed(2); // Convert from cents to dollars
      x12 += `BPR*I*${totalAmount}*C*ACH*CCP*01*${header.payerIdentifier}*DA*123456789*1512345678**01*999999999*DA*987654321*${paymentDate}~\n`;
      
      // TRN - Trace Number
      x12 += `TRN*1*${header.remittanceNumber}*${header.payerIdentifier}~\n`;
      
      // N1 - Payer Identification
      x12 += `N1*PR*${header.payerName}*XV*${header.payerIdentifier}~\n`;
      
      // N1 - Payee Identification
      x12 += 'N1*PE*PROVIDER NAME*XX*1234567890~\n';
      
      // Process each claim
      let segmentCount = 6; // Initial count includes ST, BPR, TRN, N1*PR, N1*PE segments
      
      for (const detail of details) {
        // CLP - Claim Payment Information
        const billedAmount = (detail.billedAmount / 100).toFixed(2);
        const paidAmount = (detail.paidAmount / 100).toFixed(2);
        const adjustmentAmount = (detail.adjustmentAmount / 100).toFixed(2);
        x12 += `CLP*${detail.claimNumber}*1*${billedAmount}*${paidAmount}*${adjustmentAmount}*CO*~\n`;
        segmentCount++;
        
        // Format service date
        let serviceDate = detail.serviceDate;
        // Convert from ISO format to YYYYMMDD
        if (serviceDate.includes('-')) {
          serviceDate = serviceDate.replace(/\-/g, '');
        }
        if (serviceDate.length > 8) {
          serviceDate = serviceDate.substring(0, 8);
        }
        
        // SVC - Service Payment Information
        x12 += `SVC*HC:99999*${billedAmount}*${paidAmount}**${serviceDate}~\n`;
        segmentCount++;
        
        // Add CAS segments for adjustments if present
        for (const [key, value] of Object.entries(detail.adjustmentCodes || {})) {
          // Parse adjustment code format (e.g., "CO:45:123.45")
          const parts = value.split(':');
          if (parts.length >= 2) {
            const group = parts[0] || 'CO';
            const reason = parts[1] || '45';
            const amount = parts[2] ? (Number(parts[2]) / 100).toFixed(2) : adjustmentAmount;
            
            x12 += `CAS*${group}*${reason}*${amount}*1~\n`;
            segmentCount++;
          }
        }
      }
      
      // SE - Transaction Set Trailer
      x12 += `SE*${segmentCount + 1}*${stControlNumber}~\n`;
      
      // GE - Functional Group Trailer
      x12 += `GE*1*${gsControlNumber}~\n`;
      
      // IEA - Interchange Control Trailer
      x12 += `IEA*1*${isaControlNumber}~`;
      
      return x12;
    } catch (error) {
      throw new IntegrationError({
        message: `Failed to transform to X12 835 format: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformInternalToX12'
      });
    }
  }

  /**
   * Transforms internal data to CSV format
   * 
   * @param data Internal remittance data
   * @returns CSV formatted string
   * @throws IntegrationError if transformation fails
   */
  private transformInternalToCsv(data: any): string {
    logger.debug('Transforming internal data to CSV format');
    
    try {
      // Validate expected data structure
      if (!data || !data.header || !Array.isArray(data.details)) {
        throw new Error('Invalid remittance data structure');
      }
      
      const { header, details } = data;
      
      // Define CSV columns
      const columns = [
        'Remittance Number',
        'Remittance Date',
        'Payer Name',
        'Payer ID',
        'Claim Number',
        'Service Date',
        'Billed Amount',
        'Paid Amount',
        'Adjustment Amount',
        'Adjustment Codes'
      ];
      
      // Start with header row
      let csv = columns.join(',') + '\n';
      
      // Add detail rows
      details.forEach(detail => {
        const billedAmount = (detail.billedAmount / 100).toFixed(2);
        const paidAmount = (detail.paidAmount / 100).toFixed(2);
        const adjustmentAmount = (detail.adjustmentAmount / 100).toFixed(2);
        
        // Format adjustment codes
        let adjustmentCodesStr = '';
        if (detail.adjustmentCodes) {
          adjustmentCodesStr = Object.values(detail.adjustmentCodes).join(';');
        }
        
        // Quote strings that might contain commas
        const row = [
          this.csvEscape(header.remittanceNumber),
          this.csvEscape(header.remittanceDate),
          this.csvEscape(header.payerName),
          this.csvEscape(header.payerIdentifier),
          this.csvEscape(detail.claimNumber),
          this.csvEscape(detail.serviceDate),
          billedAmount,
          paidAmount,
          adjustmentAmount,
          this.csvEscape(adjustmentCodesStr)
        ];
        
        csv += row.join(',') + '\n';
      });
      
      return csv;
    } catch (error) {
      throw new IntegrationError({
        message: `Failed to transform to CSV format: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformInternalToCsv'
      });
    }
  }

  /**
   * Escapes a string for CSV output
   * 
   * @param value String to escape
   * @returns Escaped string
   */
  private csvEscape(value: string): string {
    if (!value) return '""';
    
    // Quote the value if it contains commas, quotes, or newlines
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Double any quotes in the value
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  /**
   * Transforms internal data to JSON format
   * 
   * @param data Internal remittance data
   * @returns JSON formatted string
   * @throws IntegrationError if transformation fails
   */
  private transformInternalToJson(data: any): string {
    logger.debug('Transforming internal data to JSON format');
    
    try {
      // Validate expected data structure
      if (!data || !data.header || !Array.isArray(data.details)) {
        throw new Error('Invalid remittance data structure');
      }
      
      // Create a clean version of the data without internal IDs and metadata
      const result = {
        header: {
          remittanceNumber: data.header.remittanceNumber,
          remittanceDate: data.header.remittanceDate,
          payerIdentifier: data.header.payerIdentifier,
          payerName: data.header.payerName,
          totalAmount: (data.header.totalAmount / 100).toFixed(2),
          claimCount: data.details.length
        },
        details: data.details.map((detail: RemittanceDetail) => ({
          claimNumber: detail.claimNumber,
          serviceDate: detail.serviceDate,
          billedAmount: (detail.billedAmount / 100).toFixed(2),
          paidAmount: (detail.paidAmount / 100).toFixed(2),
          adjustmentAmount: (detail.adjustmentAmount / 100).toFixed(2),
          adjustmentCodes: detail.adjustmentCodes
        }))
      };
      
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new IntegrationError({
        message: `Failed to transform to JSON format: ${error.message}`,
        service: 'RemittanceTransformer',
        endpoint: 'transformInternalToJson'
      });
    }
  }

  /**
   * Validates transformed remittance data for completeness and correctness
   * 
   * @param header Remittance header information
   * @param details Remittance detail records
   * @returns True if validation passes, throws error otherwise
   * @throws ValidationError if validation fails
   */
  private validateRemittanceData(
    header: RemittanceInfo, 
    details: RemittanceDetail[]
  ): boolean {
    logger.debug('Validating remittance data');
    
    const validationErrors: string[] = [];
    
    // Validate header
    if (!header.remittanceNumber) {
      validationErrors.push('Remittance number is required');
    }
    
    if (!header.remittanceDate) {
      validationErrors.push('Remittance date is required');
    }
    
    if (header.totalAmount === undefined || header.totalAmount === null) {
      validationErrors.push('Total amount is required');
    }
    
    // Validate details
    if (!details || details.length === 0) {
      validationErrors.push('Remittance must contain at least one detail record');
    } else {
      // Check each detail record
      details.forEach((detail, index) => {
        if (!detail.claimNumber) {
          validationErrors.push(`Detail record ${index + 1} is missing claim number`);
        }
        
        if (!detail.serviceDate) {
          validationErrors.push(`Detail record ${index + 1} is missing service date`);
        }
        
        if (detail.billedAmount === undefined || detail.billedAmount === null) {
          validationErrors.push(`Detail record ${index + 1} is missing billed amount`);
        }
        
        if (detail.paidAmount === undefined || detail.paidAmount === null) {
          validationErrors.push(`Detail record ${index + 1} is missing paid amount`);
        }
      });
      
      // Validate that the total amount matches the sum of paid amounts
      const detailTotal = details.reduce((sum, detail) => sum + (detail.paidAmount || 0), 0);
      
      // Allow for small rounding differences (less than a cent)
      if (Math.abs(header.totalAmount - detailTotal) > 1) {
        validationErrors.push(`Total amount in header (${header.totalAmount / 100}) does not match sum of paid amounts (${detailTotal / 100})`);
      }
    }
    
    // If validation errors exist, throw error
    if (validationErrors.length > 0) {
      throw new ValidationError({
        message: 'Remittance data validation failed',
        validationErrors: validationErrors.map(message => ({
          field: '',
          message,
          value: '',
          code: 'INVALID_FORMAT'
        }))
      });
    }
    
    return true;
  }

  /**
   * Normalizes remittance data to ensure consistent format and values
   * 
   * @param header Remittance header information
   * @param details Remittance detail records
   * @returns Normalized remittance data
   */
  private normalizeRemittanceData(
    header: RemittanceInfo, 
    details: RemittanceDetail[]
  ): { header: RemittanceInfo; details: RemittanceDetail[] } {
    logger.debug('Normalizing remittance data');
    
    // Create a copy of the header to avoid mutating the original
    const normalizedHeader: RemittanceInfo = { ...header };
    
    // Ensure remittance date is in ISO format (YYYY-MM-DD)
    if (normalizedHeader.remittanceDate) {
      const parsedDate = parseDate(normalizedHeader.remittanceDate);
      if (parsedDate) {
        normalizedHeader.remittanceDate = formatDate(parsedDate) || normalizedHeader.remittanceDate;
      }
    }
    
    // Ensure totalAmount is a number and stored in cents
    if (typeof normalizedHeader.totalAmount === 'string') {
      normalizedHeader.totalAmount = this.parseAmount(normalizedHeader.totalAmount as any);
    }
    
    // Create copies of detail records to avoid mutating the originals
    const normalizedDetails: RemittanceDetail[] = details.map(detail => {
      const normalizedDetail: RemittanceDetail = { ...detail };
      
      // Ensure serviceDate is in ISO format
      if (normalizedDetail.serviceDate) {
        const parsedDate = parseDate(normalizedDetail.serviceDate);
        if (parsedDate) {
          normalizedDetail.serviceDate = formatDate(parsedDate) || normalizedDetail.serviceDate;
        }
      }
      
      // Ensure monetary amounts are numbers and stored in cents
      if (typeof normalizedDetail.billedAmount === 'string') {
        normalizedDetail.billedAmount = this.parseAmount(normalizedDetail.billedAmount as any);
      }
      
      if (typeof normalizedDetail.paidAmount === 'string') {
        normalizedDetail.paidAmount = this.parseAmount(normalizedDetail.paidAmount as any);
      }
      
      if (typeof normalizedDetail.adjustmentAmount === 'string') {
        normalizedDetail.adjustmentAmount = this.parseAmount(normalizedDetail.adjustmentAmount as any);
      } else if (normalizedDetail.adjustmentAmount === undefined || normalizedDetail.adjustmentAmount === null) {
        // If adjustment amount is not provided, calculate it
        normalizedDetail.adjustmentAmount = normalizedDetail.billedAmount - normalizedDetail.paidAmount;
      }
      
      return normalizedDetail;
    });
    
    // Recalculate and update the total amount to match the sum of paid amounts
    const detailTotal = normalizedDetails.reduce((sum, detail) => sum + (detail.paidAmount || 0), 0);
    normalizedHeader.totalAmount = detailTotal;
    
    // Update claim count
    normalizedHeader.claimCount = normalizedDetails.length;
    
    return {
      header: normalizedHeader,
      details: normalizedDetails
    };
  }

  /**
   * Maps DataFormat enum to RemittanceFileType enum
   * 
   * @param format DataFormat enum value
   * @returns Corresponding RemittanceFileType enum value
   */
  private mapDataFormatToFileType(format: DataFormat): RemittanceFileType {
    switch (format) {
      case DataFormat.X12:
        return RemittanceFileType.EDI_835;
      case DataFormat.CSV:
        return RemittanceFileType.CSV;
      case DataFormat.JSON:
        return RemittanceFileType.CUSTOM;
      default:
        return RemittanceFileType.CUSTOM;
    }
  }

  /**
   * Parses a monetary amount string to number in cents
   * 
   * @param amount Amount string or number
   * @returns Amount in cents as integer
   */
  private parseAmount(amount: string | number): number {
    if (typeof amount === 'number') {
      // If already a number, convert to cents
      return Math.round(amount * 100);
    }
    
    if (!amount) return 0;
    
    // Remove currency symbols, commas, and other non-numeric characters except decimal point
    const sanitized = amount.replace(/[^0-9.-]/g, '');
    
    // Parse as float and convert to cents
    return Math.round(parseFloat(sanitized) * 100);
  }

  /**
   * Generates a random control number for EDI documents
   * 
   * @param length Length of the control number
   * @returns Control number string
   */
  private generateControlNumber(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }
}

// Create singleton instance for export
export const remittanceTransformer = new RemittanceTransformer();

// Export class and singleton instance
export default remittanceTransformer;