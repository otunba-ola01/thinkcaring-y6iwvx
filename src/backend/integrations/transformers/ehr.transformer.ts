import { IntegrationTransformer, DataFormat, EHRIntegrationConfig } from '../../types/integration.types';
import { ServiceImportDto } from '../../types/services.types';
import { CreateClientDto, Gender, ClientStatus } from '../../types/clients.types';
import { IntegrationError } from '../../errors/integration-error';
import logger from '../../utils/logger';
import { UUID, ISO8601Date, StatusType } from '../../types/common.types';
import * as xml2js from 'xml2js'; // v0.5.0

/**
 * Transformer for converting between EHR system data formats and internal system data structures
 */
export class EHRTransformer implements IntegrationTransformer {
  private formatHandlers: Record<string, Function>;

  /**
   * Creates a new EHR transformer with the provided configuration
   * 
   * @param config - Configuration for the EHR integration
   */
  constructor(private config: EHRIntegrationConfig) {
    logger.info('Initializing EHR transformer', { 
      ehrSystem: config.ehrSystem, 
      version: config.version,
      dataFormat: config.dataFormat
    });
    
    // Set up handlers for different data formats
    this.formatHandlers = {
      [DataFormat.JSON]: this.handleJsonFormat.bind(this),
      [DataFormat.XML]: this.handleXmlFormat.bind(this),
      [DataFormat.HL7]: this.handleHL7Format.bind(this),
      [DataFormat.FHIR]: this.handleFHIRFormat.bind(this)
    };
  }

  /**
   * Transforms request data from internal format to EHR system format
   * 
   * @param data - Data to transform
   * @param format - Format to transform to (optional, defaults to config.dataFormat)
   * @returns Transformed data in the target format
   * @throws IntegrationError if transformation fails
   */
  public transformRequest(data: any, format?: DataFormat): any {
    try {
      const handler = this.getFormatHandler(format);
      
      // Transform field names based on mapping configuration
      const mappedData = this.mapFieldNamesForRequest(data);
      
      // Apply format-specific transformation
      const result = handler(mappedData, true);
      
      logger.debug('Transformed request data', { 
        format: format || this.config.dataFormat,
        ehrSystem: this.config.ehrSystem
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to transform request data', { 
        error: error.message, 
        stack: error.stack,
        format: format || this.config.dataFormat
      });
      
      throw new IntegrationError({
        message: `Failed to transform request data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'transform',
        retryable: false
      });
    }
  }

  /**
   * Transforms response data from EHR system format to internal format
   * 
   * @param data - Data to transform
   * @param format - Format to transform from (optional, defaults to config.dataFormat)
   * @returns Transformed data in the internal format
   * @throws IntegrationError if transformation fails
   */
  public transformResponse(data: any, format?: DataFormat): any {
    try {
      const handler = this.getFormatHandler(format);
      
      // Parse response data using format handler
      const parsedData = handler(data, false);
      
      // Transform field names based on mapping configuration
      const mappedData = this.mapFieldNamesForResponse(parsedData);
      
      logger.debug('Transformed response data', { 
        format: format || this.config.dataFormat,
        ehrSystem: this.config.ehrSystem
      });
      
      return mappedData;
    } catch (error) {
      logger.error('Failed to transform response data', { 
        error: error.message, 
        stack: error.stack,
        format: format || this.config.dataFormat
      });
      
      throw new IntegrationError({
        message: `Failed to transform response data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'transform',
        retryable: false
      });
    }
  }

  /**
   * Transforms service data from EHR system format to internal ServiceImportDto format
   * 
   * @param serviceData - Service data from EHR system
   * @returns Transformed service data ready for import
   * @throws IntegrationError if transformation fails
   */
  public transformServiceData(serviceData: Record<string, any>): ServiceImportDto {
    try {
      const result: Partial<ServiceImportDto> = {};
      
      // Apply field mappings from configuration
      for (const [internalField, externalField] of Object.entries(this.config.serviceMapping)) {
        if (serviceData[externalField] !== undefined) {
          result[internalField] = serviceData[externalField];
        }
      }
      
      // Process specific fields with special handling
      
      // Client ID mapping (may need to look up by external ID)
      if (!result.clientId && serviceData[this.config.serviceMapping.clientId]) {
        result.clientId = serviceData[this.config.serviceMapping.clientId] as UUID;
      }
      
      // Map service type and code
      if (!result.serviceTypeId && serviceData[this.config.serviceMapping.serviceTypeId]) {
        result.serviceTypeId = serviceData[this.config.serviceMapping.serviceTypeId] as UUID;
      }
      
      if (!result.serviceCode && serviceData[this.config.serviceMapping.serviceCode]) {
        result.serviceCode = serviceData[this.config.serviceMapping.serviceCode];
      }
      
      // Format service date if present
      if (serviceData[this.config.serviceMapping.serviceDate]) {
        result.serviceDate = this.formatDate(serviceData[this.config.serviceMapping.serviceDate]);
      }
      
      // Convert units and rate to numeric values
      if (serviceData[this.config.serviceMapping.units]) {
        result.units = Number(serviceData[this.config.serviceMapping.units]);
      }
      
      if (serviceData[this.config.serviceMapping.rate]) {
        result.rate = Number(serviceData[this.config.serviceMapping.rate]);
      }
      
      // Map staff identifier if available
      if (serviceData[this.config.serviceMapping.staffId]) {
        result.staffId = serviceData[this.config.serviceMapping.staffId] as UUID;
      }
      
      // Map program identifier
      if (serviceData[this.config.serviceMapping.programId]) {
        result.programId = serviceData[this.config.serviceMapping.programId] as UUID;
      }
      
      // Extract notes or comments
      if (serviceData[this.config.serviceMapping.notes]) {
        result.notes = serviceData[this.config.serviceMapping.notes];
      }
      
      // Validate required fields
      const requiredFields: Array<keyof ServiceImportDto> = ['clientId', 'serviceTypeId', 'serviceCode', 'serviceDate', 'units', 'rate', 'programId'];
      const missingFields = requiredFields.filter(field => result[field] === undefined);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for service import: ${missingFields.join(', ')}`);
      }
      
      return result as ServiceImportDto;
    } catch (error) {
      logger.error('Failed to transform service data', { 
        error: error.message, 
        stack: error.stack,
        ehrSystem: this.config.ehrSystem
      });
      
      throw new IntegrationError({
        message: `Failed to transform service data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'transformServiceData',
        retryable: false
      });
    }
  }

  /**
   * Transforms client data from EHR system format to internal CreateClientDto format
   * 
   * @param clientData - Client data from EHR system
   * @returns Transformed client data ready for import
   * @throws IntegrationError if transformation fails
   */
  public transformClientData(clientData: Record<string, any>): CreateClientDto {
    try {
      const result: Partial<CreateClientDto> = {};
      
      // Apply field mappings from configuration
      for (const [internalField, externalField] of Object.entries(this.config.clientMapping)) {
        if (clientData[externalField] !== undefined) {
          result[internalField] = clientData[externalField];
        }
      }
      
      // Extract and format name fields
      if (clientData[this.config.clientMapping.firstName]) {
        result.firstName = clientData[this.config.clientMapping.firstName];
      }
      
      if (clientData[this.config.clientMapping.lastName]) {
        result.lastName = clientData[this.config.clientMapping.lastName];
      }
      
      if (clientData[this.config.clientMapping.middleName]) {
        result.middleName = clientData[this.config.clientMapping.middleName];
      }
      
      // Format date of birth
      if (clientData[this.config.clientMapping.dateOfBirth]) {
        result.dateOfBirth = this.formatDate(clientData[this.config.clientMapping.dateOfBirth]);
      }
      
      // Map gender
      if (clientData[this.config.clientMapping.gender]) {
        result.gender = this.mapGender(clientData[this.config.clientMapping.gender]);
      }
      
      // Extract identifiers
      if (clientData[this.config.clientMapping.medicaidId]) {
        result.medicaidId = clientData[this.config.clientMapping.medicaidId];
      }
      
      if (clientData[this.config.clientMapping.medicareId]) {
        result.medicareId = clientData[this.config.clientMapping.medicareId];
      }
      
      if (clientData[this.config.clientMapping.ssn]) {
        result.ssn = clientData[this.config.clientMapping.ssn];
      }
      
      // Format address information
      if (this.hasAddressFields(clientData)) {
        result.address = {
          street1: clientData[this.config.clientMapping['address.street1']] || '',
          street2: clientData[this.config.clientMapping['address.street2']],
          city: clientData[this.config.clientMapping['address.city']] || '',
          state: clientData[this.config.clientMapping['address.state']] || '',
          zipCode: clientData[this.config.clientMapping['address.zipCode']] || '',
          country: clientData[this.config.clientMapping['address.country']] || 'US'
        };
      }
      
      // Format contact information
      if (this.hasContactFields(clientData)) {
        result.contactInfo = {
          email: clientData[this.config.clientMapping['contactInfo.email']] || '',
          phone: clientData[this.config.clientMapping['contactInfo.phone']] || '',
          alternatePhone: clientData[this.config.clientMapping['contactInfo.alternatePhone']],
          fax: clientData[this.config.clientMapping['contactInfo.fax']]
        };
      }
      
      // Extract emergency contact if available
      if (this.hasEmergencyContactFields(clientData)) {
        result.emergencyContact = {
          name: clientData[this.config.clientMapping['emergencyContact.name']] || '',
          relationship: clientData[this.config.clientMapping['emergencyContact.relationship']] || '',
          phone: clientData[this.config.clientMapping['emergencyContact.phone']] || '',
          alternatePhone: clientData[this.config.clientMapping['emergencyContact.alternatePhone']],
          email: clientData[this.config.clientMapping['emergencyContact.email']]
        };
      }
      
      // Map client status
      if (clientData[this.config.clientMapping.status]) {
        result.status = this.mapClientStatus(clientData[this.config.clientMapping.status]);
      } else {
        // Default to ACTIVE if not specified
        result.status = ClientStatus.ACTIVE;
      }
      
      // Initialize empty arrays for programs and insurances
      result.programs = [];
      result.insurances = [];
      
      // Extract program enrollments if available
      if (clientData.programs && Array.isArray(clientData.programs)) {
        result.programs = clientData.programs.map(program => ({
          programId: program.programId,
          startDate: this.formatDate(program.startDate),
          endDate: program.endDate ? this.formatDate(program.endDate) : null,
          status: program.status || StatusType.ACTIVE,
          notes: program.notes || null
        }));
      }
      
      // Extract insurance information if available
      if (clientData.insurances && Array.isArray(clientData.insurances)) {
        result.insurances = clientData.insurances.map(insurance => ({
          type: insurance.type,
          payerId: insurance.payerId,
          policyNumber: insurance.policyNumber,
          groupNumber: insurance.groupNumber || null,
          subscriberName: insurance.subscriberName || null,
          subscriberRelationship: insurance.subscriberRelationship || null,
          effectiveDate: this.formatDate(insurance.effectiveDate),
          terminationDate: insurance.terminationDate ? this.formatDate(insurance.terminationDate) : null,
          isPrimary: insurance.isPrimary || false,
          status: insurance.status || StatusType.ACTIVE
        }));
      }
      
      // Extract notes or comments
      if (clientData[this.config.clientMapping.notes]) {
        result.notes = clientData[this.config.clientMapping.notes];
      }
      
      // Validate required fields
      const requiredFields: Array<keyof CreateClientDto> = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'status'];
      const missingFields = requiredFields.filter(field => result[field] === undefined);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for client import: ${missingFields.join(', ')}`);
      }
      
      return result as CreateClientDto;
    } catch (error) {
      logger.error('Failed to transform client data', { 
        error: error.message, 
        stack: error.stack,
        ehrSystem: this.config.ehrSystem
      });
      
      throw new IntegrationError({
        message: `Failed to transform client data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'transformClientData',
        retryable: false
      });
    }
  }

  /**
   * Transforms authorization data from EHR system format to internal authorization format
   * 
   * @param authorizationData - Authorization data from EHR system
   * @returns Transformed authorization data ready for import
   * @throws IntegrationError if transformation fails
   */
  public transformAuthorizationData(authorizationData: Record<string, any>): Record<string, any> {
    try {
      const result: Record<string, any> = {};
      
      // Apply field mappings from configuration
      for (const [internalField, externalField] of Object.entries(this.config.authorizationMapping)) {
        if (authorizationData[externalField] !== undefined) {
          result[internalField] = authorizationData[externalField];
        }
      }
      
      // Format specific fields
      
      // Authorization number
      if (authorizationData[this.config.authorizationMapping.authorizationNumber]) {
        result.authorizationNumber = authorizationData[this.config.authorizationMapping.authorizationNumber];
      }
      
      // Format dates
      if (authorizationData[this.config.authorizationMapping.startDate]) {
        result.startDate = this.formatDate(authorizationData[this.config.authorizationMapping.startDate]);
      }
      
      if (authorizationData[this.config.authorizationMapping.endDate]) {
        result.endDate = this.formatDate(authorizationData[this.config.authorizationMapping.endDate]);
      }
      
      // Convert authorized units to number
      if (authorizationData[this.config.authorizationMapping.authorizedUnits]) {
        result.authorizedUnits = Number(authorizationData[this.config.authorizationMapping.authorizedUnits]);
      }
      
      // Map service types
      if (authorizationData[this.config.authorizationMapping.serviceTypeIds] && 
          Array.isArray(authorizationData[this.config.authorizationMapping.serviceTypeIds])) {
        result.serviceTypeIds = authorizationData[this.config.authorizationMapping.serviceTypeIds];
      }
      
      // Map status
      if (authorizationData[this.config.authorizationMapping.status]) {
        result.status = this.mapAuthorizationStatus(authorizationData[this.config.authorizationMapping.status]);
      } else {
        // Default to ACTIVE if not specified
        result.status = StatusType.ACTIVE;
      }
      
      // Extract frequency information if available
      if (authorizationData[this.config.authorizationMapping.frequency]) {
        result.frequency = authorizationData[this.config.authorizationMapping.frequency];
      }
      
      // Extract notes or comments
      if (authorizationData[this.config.authorizationMapping.notes]) {
        result.notes = authorizationData[this.config.authorizationMapping.notes];
      }
      
      // Validate required fields
      const requiredFields = ['authorizationNumber', 'startDate', 'endDate', 'authorizedUnits', 'serviceTypeIds'];
      const missingFields = requiredFields.filter(field => result[field] === undefined);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for authorization import: ${missingFields.join(', ')}`);
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to transform authorization data', { 
        error: error.message, 
        stack: error.stack,
        ehrSystem: this.config.ehrSystem
      });
      
      throw new IntegrationError({
        message: `Failed to transform authorization data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'transformAuthorizationData',
        retryable: false
      });
    }
  }

  /**
   * Handles transformation for JSON format data
   * 
   * @param data - Data to process
   * @param isRequest - Whether this is a request (true) or response (false)
   * @returns Processed JSON data
   * @throws IntegrationError if JSON processing fails
   */
  private handleJsonFormat(data: any, isRequest: boolean): any {
    try {
      // If data is already an object, we can use it directly
      if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data)) {
        return isRequest ? JSON.stringify(data) : data;
      }
      
      // If data is a string, parse it as JSON
      if (typeof data === 'string') {
        return isRequest ? data : JSON.parse(data);
      }
      
      throw new Error('Invalid data format for JSON processing');
    } catch (error) {
      logger.error('Failed to process JSON data', { 
        error: error.message,
        isRequest
      });
      
      throw new IntegrationError({
        message: `Failed to process JSON data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'jsonFormat',
        retryable: false
      });
    }
  }

  /**
   * Handles transformation for XML format data
   * 
   * @param data - Data to process
   * @param isRequest - Whether this is a request (true) or response (false)
   * @returns Processed XML data
   * @throws IntegrationError if XML processing fails
   */
  private handleXmlFormat(data: any, isRequest: boolean): any {
    try {
      // For requests, convert object to XML
      if (isRequest) {
        if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data)) {
          const builder = new xml2js.Builder();
          return builder.buildObject(data);
        }
        return data;
      }
      
      // For responses, parse XML to object
      if (typeof data === 'string') {
        const parser = new xml2js.Parser({ explicitArray: false });
        return parser.parseStringPromise(data);
      }
      
      return data;
    } catch (error) {
      logger.error('Failed to process XML data', { 
        error: error.message,
        isRequest
      });
      
      throw new IntegrationError({
        message: `Failed to process XML data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'xmlFormat',
        retryable: false
      });
    }
  }

  /**
   * Handles transformation for HL7 format data
   * 
   * @param data - Data to process
   * @param isRequest - Whether this is a request (true) or response (false)
   * @returns Processed HL7 data
   * @throws IntegrationError if HL7 processing fails
   */
  private handleHL7Format(data: any, isRequest: boolean): any {
    try {
      // This would require a full HL7 parser/generator library
      // This is a simplified implementation for basic HL7 handling
      
      if (isRequest) {
        // Convert internal data format to HL7
        const segments = [];
        
        // MSH segment (Message Header)
        segments.push(`MSH|^~\\&|${this.config.ehrSystem}|HCBS|RECEIVING_APP|RECEIVING_FACILITY|${new Date().toISOString()}||${data.messageType || 'ADT^A01'}|${data.messageId || Math.floor(Math.random() * 1000000)}|P|2.5`);
        
        // PID segment (Patient Identification) if patient data present
        if (data.patient) {
          segments.push(`PID|||${data.patient.id || ''}||${data.patient.lastName || ''}^${data.patient.firstName || ''}^${data.patient.middleName || ''}||${data.patient.dateOfBirth || ''}|${data.patient.gender || ''}`);
        }
        
        // Additional segments would be added based on the message type and data
        
        return segments.join('\r');
      } else {
        // Parse HL7 message to structured object
        if (typeof data !== 'string') {
          return data;
        }
        
        const segments = data.split('\r');
        const result: Record<string, any> = {
          segments: {}
        };
        
        segments.forEach(segment => {
          const segmentParts = segment.split('|');
          const segmentType = segmentParts[0];
          
          result.segments[segmentType] = segmentParts;
          
          // Extract key data based on segment type
          if (segmentType === 'MSH') {
            result.sendingApplication = segmentParts[3];
            result.receivingApplication = segmentParts[5];
            result.messageTimestamp = segmentParts[7];
            result.messageType = segmentParts[9];
            result.messageId = segmentParts[10];
          } else if (segmentType === 'PID') {
            result.patient = {
              id: segmentParts[3],
              name: segmentParts[5],
              dateOfBirth: segmentParts[7],
              gender: segmentParts[8]
            };
          }
          // Additional segment parsing would be added based on requirements
        });
        
        return result;
      }
    } catch (error) {
      logger.error('Failed to process HL7 data', { 
        error: error.message,
        isRequest
      });
      
      throw new IntegrationError({
        message: `Failed to process HL7 data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'hl7Format',
        retryable: false
      });
    }
  }

  /**
   * Handles transformation for FHIR format data
   * 
   * @param data - Data to process
   * @param isRequest - Whether this is a request (true) or response (false)
   * @returns Processed FHIR data
   * @throws IntegrationError if FHIR processing fails
   */
  private handleFHIRFormat(data: any, isRequest: boolean): any {
    try {
      // This implementation provides basic FHIR support
      // A full implementation would use a dedicated FHIR library
      
      if (isRequest) {
        // Convert internal data to FHIR resource format
        // Example for Patient resource
        if (data.resourceType === 'Patient' || (!data.resourceType && data.firstName)) {
          return {
            resourceType: 'Patient',
            id: data.id,
            identifier: [
              data.ssn ? {
                system: 'http://hl7.org/fhir/sid/us-ssn',
                value: data.ssn
              } : null,
              data.medicareId ? {
                system: 'http://hl7.org/fhir/sid/us-medicare',
                value: data.medicareId
              } : null,
              data.medicaidId ? {
                system: 'http://hl7.org/fhir/sid/us-medicaid',
                value: data.medicaidId
              } : null
            ].filter(Boolean), // Filter out null values
            name: [
              {
                family: data.lastName,
                given: [data.firstName, data.middleName].filter(Boolean),
                use: 'official'
              }
            ],
            gender: data.gender?.toLowerCase(),
            birthDate: data.dateOfBirth,
            address: data.address ? [
              {
                line: [data.address.street1, data.address.street2].filter(Boolean),
                city: data.address.city,
                state: data.address.state,
                postalCode: data.address.zipCode,
                country: data.address.country
              }
            ] : undefined,
            telecom: data.contactInfo ? [
              data.contactInfo.phone ? { system: 'phone', value: data.contactInfo.phone, use: 'home' } : null,
              data.contactInfo.alternatePhone ? { system: 'phone', value: data.contactInfo.alternatePhone, use: 'work' } : null,
              data.contactInfo.email ? { system: 'email', value: data.contactInfo.email } : null
            ].filter(Boolean) : undefined,
            active: data.status === ClientStatus.ACTIVE
          };
        }
        
        // Return data as is if not a supported resource type for transformation
        return data;
      } else {
        // Convert FHIR resource to internal data format
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        
        // Process Patient resource
        if (data.resourceType === 'Patient') {
          const result: Record<string, any> = {
            id: data.id
          };
          
          // Extract name components
          if (data.name && data.name.length > 0) {
            const name = data.name[0];
            result.lastName = name.family;
            if (name.given && name.given.length > 0) {
              result.firstName = name.given[0];
              if (name.given.length > 1) {
                result.middleName = name.given[1];
              }
            }
          }
          
          // Extract identifiers
          if (data.identifier && Array.isArray(data.identifier)) {
            for (const identifier of data.identifier) {
              if (identifier.system === 'http://hl7.org/fhir/sid/us-ssn') {
                result.ssn = identifier.value;
              } else if (identifier.system === 'http://hl7.org/fhir/sid/us-medicare') {
                result.medicareId = identifier.value;
              } else if (identifier.system === 'http://hl7.org/fhir/sid/us-medicaid') {
                result.medicaidId = identifier.value;
              }
            }
          }
          
          // Extract other fields
          result.gender = this.mapGender(data.gender);
          result.dateOfBirth = data.birthDate;
          
          // Extract address
          if (data.address && data.address.length > 0) {
            const address = data.address[0];
            result.address = {
              street1: address.line && address.line.length > 0 ? address.line[0] : '',
              street2: address.line && address.line.length > 1 ? address.line[1] : undefined,
              city: address.city || '',
              state: address.state || '',
              zipCode: address.postalCode || '',
              country: address.country || 'US'
            };
          }
          
          // Extract contact info
          if (data.telecom && data.telecom.length > 0) {
            result.contactInfo = {
              phone: '',
              email: ''
            };
            
            for (const telecom of data.telecom) {
              if (telecom.system === 'phone') {
                if (telecom.use === 'home' || !result.contactInfo.phone) {
                  result.contactInfo.phone = telecom.value;
                } else if (telecom.use === 'work' || !result.contactInfo.alternatePhone) {
                  result.contactInfo.alternatePhone = telecom.value;
                }
              } else if (telecom.system === 'email') {
                result.contactInfo.email = telecom.value;
              }
            }
          }
          
          // Map active status
          result.status = data.active ? ClientStatus.ACTIVE : ClientStatus.INACTIVE;
          
          return result;
        }
        
        // Return data as is if not a supported resource type for transformation
        return data;
      }
    } catch (error) {
      logger.error('Failed to process FHIR data', { 
        error: error.message,
        isRequest
      });
      
      throw new IntegrationError({
        message: `Failed to process FHIR data: ${error.message}`,
        service: this.config.ehrSystem,
        endpoint: 'fhirFormat',
        retryable: false
      });
    }
  }

  /**
   * Maps EHR system gender values to internal Gender enum
   * 
   * @param ehrGender - Gender value from EHR system
   * @returns Internal Gender enum value
   */
  private mapGender(ehrGender: string): Gender {
    if (!ehrGender) {
      return Gender.OTHER;
    }
    
    const normalizedGender = ehrGender.toLowerCase().trim();
    
    switch (normalizedGender) {
      case 'm':
      case 'male':
      case 'man':
      case 'boy':
      case '1':
        return Gender.MALE;
        
      case 'f':
      case 'female':
      case 'woman':
      case 'girl':
      case '2':
        return Gender.FEMALE;
        
      case 'nb':
      case 'non-binary':
      case 'nonbinary':
      case 'non binary':
      case 'genderqueer':
        return Gender.NON_BINARY;
        
      case 'na':
      case 'not specified':
      case 'prefer not to say':
      case 'unknown':
      case 'undisclosed':
        return Gender.PREFER_NOT_TO_SAY;
        
      default:
        return Gender.OTHER;
    }
  }

  /**
   * Maps EHR system client status values to internal ClientStatus enum
   * 
   * @param ehrStatus - Status value from EHR system
   * @returns Internal ClientStatus enum value
   */
  private mapClientStatus(ehrStatus: string): ClientStatus {
    if (!ehrStatus) {
      return ClientStatus.ACTIVE;
    }
    
    const normalizedStatus = ehrStatus.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'active':
      case 'current':
      case 'enrolled':
      case 'open':
      case '1':
        return ClientStatus.ACTIVE;
        
      case 'inactive':
      case 'closed':
      case 'not active':
      case '0':
        return ClientStatus.INACTIVE;
        
      case 'pending':
      case 'in process':
      case 'waiting':
      case 'waitlist':
        return ClientStatus.PENDING;
        
      case 'discharged':
      case 'terminated':
      case 'completed':
      case 'graduated':
        return ClientStatus.DISCHARGED;
        
      case 'hold':
      case 'on hold':
      case 'suspended':
      case 'temporary':
        return ClientStatus.ON_HOLD;
        
      case 'deceased':
      case 'dead':
      case 'expired':
        return ClientStatus.DECEASED;
        
      default:
        return ClientStatus.ACTIVE;
    }
  }

  /**
   * Maps EHR system authorization status values to internal StatusType enum
   * 
   * @param ehrStatus - Status value from EHR system
   * @returns Internal StatusType enum value
   */
  private mapAuthorizationStatus(ehrStatus: string): StatusType {
    if (!ehrStatus) {
      return StatusType.ACTIVE;
    }
    
    const normalizedStatus = ehrStatus.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'active':
      case 'current':
      case 'approved':
      case 'valid':
      case '1':
        return StatusType.ACTIVE;
        
      case 'inactive':
      case 'expired':
      case 'closed':
      case 'not active':
      case '0':
        return StatusType.INACTIVE;
        
      case 'pending':
      case 'in process':
      case 'waiting':
      case 'review':
        return StatusType.PENDING;
        
      case 'deleted':
      case 'removed':
      case 'cancelled':
      case 'voided':
        return StatusType.DELETED;
        
      default:
        return StatusType.ACTIVE;
    }
  }

  /**
   * Formats a date string from EHR system to ISO8601 format
   * 
   * @param dateString - Date string from EHR system
   * @returns Formatted ISO8601 date string
   * @throws Error if date cannot be parsed
   */
  private formatDate(dateString: string): ISO8601Date {
    if (!dateString) {
      throw new Error('Date string is required');
    }
    
    // Try to parse the date
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Try common formats if standard parsing fails
      
      // MM/DD/YYYY
      let match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const parsedDate = new Date(year, month, day);
        return parsedDate.toISOString().split('T')[0];
      }
      
      // DD/MM/YYYY
      match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match && this.config.ehrSystem === 'international') {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const parsedDate = new Date(year, month, day);
        return parsedDate.toISOString().split('T')[0];
      }
      
      // MM-DD-YYYY
      match = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (match) {
        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const parsedDate = new Date(year, month, day);
        return parsedDate.toISOString().split('T')[0];
      }
      
      // If all parsing attempts fail
      throw new Error(`Invalid date format: ${dateString}`);
    }
    
    // Return the date in ISO8601 format (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  }

  /**
   * Gets the appropriate format handler based on data format
   * 
   * @param format - Format to get handler for (optional, defaults to config.dataFormat)
   * @returns Format handler function
   * @throws IntegrationError if format is not supported
   */
  private getFormatHandler(format?: DataFormat): Function {
    const effectiveFormat = format || this.config.dataFormat;
    const handler = this.formatHandlers[effectiveFormat];
    
    if (!handler) {
      throw new IntegrationError({
        message: `Unsupported data format: ${effectiveFormat}`,
        service: this.config.ehrSystem,
        endpoint: 'transform',
        retryable: false
      });
    }
    
    return handler;
  }

  /**
   * Maps field names from internal format to EHR system format for requests
   * 
   * @param data - Data with internal field names
   * @returns Data with EHR system field names
   */
  private mapFieldNamesForRequest(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const result = Array.isArray(data) ? [] : {};
    
    // Determine which mapping to use based on data structure
    let mapping: Record<string, string> = {};
    
    if (data.firstName && data.lastName) {
      // Looks like client data
      mapping = this.reverseMapping(this.config.clientMapping);
    } else if (data.serviceCode && data.units) {
      // Looks like service data
      mapping = this.reverseMapping(this.config.serviceMapping);
    } else if (data.authorizationNumber) {
      // Looks like authorization data
      mapping = this.reverseMapping(this.config.authorizationMapping);
    }
    
    // Apply the mapping
    if (Array.isArray(data)) {
      return data.map(item => this.mapFieldNamesForRequest(item));
    } else {
      for (const [key, value] of Object.entries(data)) {
        // Use mapped field name if available, otherwise use original
        const mappedKey = mapping[key] || key;
        
        // Recursively map nested objects
        if (value !== null && typeof value === 'object') {
          result[mappedKey] = this.mapFieldNamesForRequest(value);
        } else {
          result[mappedKey] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Maps field names from EHR system format to internal format for responses
   * 
   * @param data - Data with EHR system field names
   * @returns Data with internal field names
   */
  private mapFieldNamesForResponse(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const result = Array.isArray(data) ? [] : {};
    
    // Apply the mapping
    if (Array.isArray(data)) {
      return data.map(item => this.mapFieldNamesForResponse(item));
    } else {
      // Determine data type to select appropriate mapping
      let mapping: Record<string, string> = {};
      
      // Try to detect data type based on fields present
      if (data[this.config.clientMapping.firstName] || data[this.config.clientMapping.lastName]) {
        // Likely client data
        mapping = this.config.clientMapping;
      } else if (data[this.config.serviceMapping.serviceCode]) {
        // Likely service data
        mapping = this.config.serviceMapping;
      } else if (data[this.config.authorizationMapping.authorizationNumber]) {
        // Likely authorization data
        mapping = this.config.authorizationMapping;
      }
      
      // Apply mapping and handle nested objects
      for (const [key, value] of Object.entries(data)) {
        // Find internal field name that maps to this external field
        const internalField = Object.entries(mapping).find(([_, ext]) => ext === key)?.[0];
        const targetKey = internalField || key;
        
        // Recursively map nested objects
        if (value !== null && typeof value === 'object') {
          result[targetKey] = this.mapFieldNamesForResponse(value);
        } else {
          result[targetKey] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Creates a reverse mapping (values to keys)
   * 
   * @param mapping - Original mapping from keys to values
   * @returns Reversed mapping from values to keys
   */
  private reverseMapping(mapping: Record<string, string>): Record<string, string> {
    const reversed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(mapping)) {
      reversed[key] = value;
    }
    
    return reversed;
  }

  /**
   * Checks if the client data has address fields
   * 
   * @param clientData - Client data to check
   * @returns Whether the client data has address fields
   */
  private hasAddressFields(clientData: Record<string, any>): boolean {
    const addressFields = [
      'address.street1',
      'address.city',
      'address.state',
      'address.zipCode'
    ];
    
    return addressFields.some(field => 
      this.config.clientMapping[field] && clientData[this.config.clientMapping[field]] !== undefined
    );
  }

  /**
   * Checks if the client data has contact fields
   * 
   * @param clientData - Client data to check
   * @returns Whether the client data has contact fields
   */
  private hasContactFields(clientData: Record<string, any>): boolean {
    const contactFields = [
      'contactInfo.email',
      'contactInfo.phone'
    ];
    
    return contactFields.some(field => 
      this.config.clientMapping[field] && clientData[this.config.clientMapping[field]] !== undefined
    );
  }

  /**
   * Checks if the client data has emergency contact fields
   * 
   * @param clientData - Client data to check
   * @returns Whether the client data has emergency contact fields
   */
  private hasEmergencyContactFields(clientData: Record<string, any>): boolean {
    const emergencyContactFields = [
      'emergencyContact.name',
      'emergencyContact.phone'
    ];
    
    return emergencyContactFields.some(field => 
      this.config.clientMapping[field] && clientData[this.config.clientMapping[field]] !== undefined
    );
  }
}

// Export the class as both named and default export
export default EHRTransformer;