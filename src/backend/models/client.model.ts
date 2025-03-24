import { 
  UUID, 
  ISO8601Date, 
  Address, 
  ContactInfo, 
  AuditableEntity, 
  StatusType 
} from '../types/common.types';

import { 
  Client, 
  ClientProgram, 
  ClientInsurance, 
  ClientStatus, 
  Gender, 
  EmergencyContact 
} from '../types/clients.types';

/**
 * Maps a database record to a Client object
 * Converts snake_case database fields to camelCase object properties
 * 
 * @param dbRecord - Database record with snake_case field names
 * @returns Fully mapped Client object
 */
export function mapDbToClient(dbRecord: Record<string, any>): Client {
  // Convert dates to ISO format
  const dateOfBirth = dbRecord.date_of_birth ? 
    new Date(dbRecord.date_of_birth).toISOString() : null;
  const createdAt = dbRecord.created_at ? 
    new Date(dbRecord.created_at).toISOString() : null;
  const updatedAt = dbRecord.updated_at ? 
    new Date(dbRecord.updated_at).toISOString() : null;
  
  // Parse JSON fields
  const address = dbRecord.address ? 
    (typeof dbRecord.address === 'string' ? JSON.parse(dbRecord.address) : dbRecord.address) : null;
  const contactInfo = dbRecord.contact_info ? 
    (typeof dbRecord.contact_info === 'string' ? JSON.parse(dbRecord.contact_info) : dbRecord.contact_info) : null;
  const emergencyContact = dbRecord.emergency_contact ? 
    (typeof dbRecord.emergency_contact === 'string' ? JSON.parse(dbRecord.emergency_contact) : dbRecord.emergency_contact) : null;
  
  // Map status and gender to enum values
  const status = dbRecord.status as ClientStatus;
  const gender = dbRecord.gender as Gender;
  
  // Create the client object
  const client: Client = {
    id: dbRecord.id,
    firstName: dbRecord.first_name,
    lastName: dbRecord.last_name,
    middleName: dbRecord.middle_name || null,
    dateOfBirth,
    gender,
    medicaidId: dbRecord.medicaid_id || null,
    medicareId: dbRecord.medicare_id || null,
    ssn: dbRecord.ssn || null,
    address,
    contactInfo,
    emergencyContact,
    status,
    notes: dbRecord.notes || null,
    programs: dbRecord.programs || [],
    insurances: dbRecord.insurances || [],
    createdAt,
    updatedAt,
    createdBy: dbRecord.created_by || null,
    updatedBy: dbRecord.updated_by || null
  };
  
  return client;
}

/**
 * Maps a Client object to a database record
 * Converts camelCase object properties to snake_case database fields
 * 
 * @param client - Client object to map to database format
 * @returns Database record ready for insertion/update
 */
export function mapClientToDb(client: Client): Record<string, any> {
  // Convert dates to database format if needed
  const dateOfBirth = client.dateOfBirth ? 
    client.dateOfBirth : null;
  
  // Stringify JSON fields for database storage
  const address = client.address ? 
    (typeof client.address === 'string' ? client.address : JSON.stringify(client.address)) : null;
  const contactInfo = client.contactInfo ? 
    (typeof client.contactInfo === 'string' ? client.contactInfo : JSON.stringify(client.contactInfo)) : null;
  const emergencyContact = client.emergencyContact ? 
    (typeof client.emergencyContact === 'string' ? client.emergencyContact : JSON.stringify(client.emergencyContact)) : null;
  
  // Create the database record
  const dbRecord: Record<string, any> = {
    id: client.id,
    first_name: client.firstName,
    last_name: client.lastName,
    middle_name: client.middleName,
    date_of_birth: dateOfBirth,
    gender: client.gender,
    medicaid_id: client.medicaidId,
    medicare_id: client.medicareId,
    ssn: client.ssn,
    address,
    contact_info: contactInfo,
    emergency_contact: emergencyContact,
    status: client.status,
    notes: client.notes,
    // We don't include programs and insurances as they're stored in separate tables
  };
  
  return dbRecord;
}

/**
 * Maps a database record to a ClientProgram object
 * 
 * @param dbRecord - Database record with snake_case field names
 * @returns Mapped ClientProgram object
 */
export function mapDbToClientProgram(dbRecord: Record<string, any>): ClientProgram {
  // Convert dates to ISO format
  const startDate = dbRecord.start_date ? 
    new Date(dbRecord.start_date).toISOString() : null;
  const endDate = dbRecord.end_date ? 
    new Date(dbRecord.end_date).toISOString() : null;
  
  // Create the program object
  const program: ClientProgram = {
    id: dbRecord.id,
    clientId: dbRecord.client_id,
    programId: dbRecord.program_id,
    program: dbRecord.program ? {
      id: dbRecord.program.id,
      name: dbRecord.program.name
    } : null,
    startDate,
    endDate,
    status: dbRecord.status as StatusType,
    notes: dbRecord.notes || null
  };
  
  return program;
}

/**
 * Maps a ClientProgram object to a database record
 * 
 * @param program - ClientProgram object to map to database format
 * @returns Database record ready for insertion/update
 */
export function mapClientProgramToDb(program: ClientProgram): Record<string, any> {
  // Convert dates to database format if needed
  const startDate = program.startDate ? 
    program.startDate : null;
  const endDate = program.endDate ? 
    program.endDate : null;
  
  // Create the database record
  const dbRecord: Record<string, any> = {
    id: program.id,
    client_id: program.clientId,
    program_id: program.programId,
    start_date: startDate,
    end_date: endDate,
    status: program.status,
    notes: program.notes
    // We don't include program as it's handled through foreign key
  };
  
  return dbRecord;
}

/**
 * Maps a database record to a ClientInsurance object
 * 
 * @param dbRecord - Database record with snake_case field names
 * @returns Mapped ClientInsurance object
 */
export function mapDbToClientInsurance(dbRecord: Record<string, any>): ClientInsurance {
  // Convert dates to ISO format
  const effectiveDate = dbRecord.effective_date ? 
    new Date(dbRecord.effective_date).toISOString() : null;
  const terminationDate = dbRecord.termination_date ? 
    new Date(dbRecord.termination_date).toISOString() : null;
  
  // Create the insurance object
  const insurance: ClientInsurance = {
    id: dbRecord.id,
    clientId: dbRecord.client_id,
    type: dbRecord.type,
    payerId: dbRecord.payer_id,
    payer: dbRecord.payer ? {
      id: dbRecord.payer.id,
      name: dbRecord.payer.name
    } : null,
    policyNumber: dbRecord.policy_number,
    groupNumber: dbRecord.group_number || null,
    subscriberName: dbRecord.subscriber_name || null,
    subscriberRelationship: dbRecord.subscriber_relationship || null,
    effectiveDate,
    terminationDate,
    isPrimary: dbRecord.is_primary,
    status: dbRecord.status as StatusType
  };
  
  return insurance;
}

/**
 * Maps a ClientInsurance object to a database record
 * 
 * @param insurance - ClientInsurance object to map to database format
 * @returns Database record ready for insertion/update
 */
export function mapClientInsuranceToDb(insurance: ClientInsurance): Record<string, any> {
  // Convert dates to database format if needed
  const effectiveDate = insurance.effectiveDate ? 
    insurance.effectiveDate : null;
  const terminationDate = insurance.terminationDate ? 
    insurance.terminationDate : null;
  
  // Create the database record
  const dbRecord: Record<string, any> = {
    id: insurance.id,
    client_id: insurance.clientId,
    type: insurance.type,
    payer_id: insurance.payerId,
    policy_number: insurance.policyNumber,
    group_number: insurance.groupNumber,
    subscriber_name: insurance.subscriberName,
    subscriber_relationship: insurance.subscriberRelationship,
    effective_date: effectiveDate,
    termination_date: terminationDate,
    is_primary: insurance.isPrimary,
    status: insurance.status
    // We don't include payer as it's handled through foreign key
  };
  
  return dbRecord;
}

/**
 * Validates a client object for data integrity
 * 
 * @param client - Partial client object to validate
 * @returns Validation result with any error messages
 */
export function validateClient(client: Partial<Client>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!client.firstName) {
    errors.push('First name is required');
  }
  
  if (!client.lastName) {
    errors.push('Last name is required');
  }
  
  if (!client.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!dateRegex.test(client.dateOfBirth)) {
      errors.push('Date of birth must be in ISO8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');
    }
  }
  
  // Validate gender
  if (!client.gender) {
    errors.push('Gender is required');
  } else if (!Object.values(Gender).includes(client.gender)) {
    errors.push('Invalid gender value');
  }
  
  // Validate status
  if (!client.status) {
    errors.push('Status is required');
  } else if (!Object.values(ClientStatus).includes(client.status)) {
    errors.push('Invalid status value');
  }
  
  // Validate address structure if provided
  if (client.address) {
    if (!client.address.street1) {
      errors.push('Address street1 is required');
    }
    if (!client.address.city) {
      errors.push('Address city is required');
    }
    if (!client.address.state) {
      errors.push('Address state is required');
    }
    if (!client.address.zipCode) {
      errors.push('Address zipCode is required');
    }
    if (!client.address.country) {
      errors.push('Address country is required');
    }
  }
  
  // Validate contact information if provided
  if (client.contactInfo) {
    if (!client.contactInfo.email && !client.contactInfo.phone) {
      errors.push('At least one contact method (email or phone) is required');
    }
    
    if (client.contactInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(client.contactInfo.email)) {
        errors.push('Invalid email format');
      }
    }
    
    if (client.contactInfo.phone) {
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
      if (!phoneRegex.test(client.contactInfo.phone)) {
        errors.push('Phone number should be in the format XXX-XXX-XXXX');
      }
    }
  }
  
  // Validate emergency contact if provided
  if (client.emergencyContact) {
    if (!client.emergencyContact.name) {
      errors.push('Emergency contact name is required');
    }
    if (!client.emergencyContact.relationship) {
      errors.push('Emergency contact relationship is required');
    }
    if (!client.emergencyContact.phone) {
      errors.push('Emergency contact phone is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a copy of a client with sensitive data masked for logging or display
 * Implements HIPAA-compliant data masking for Protected Health Information (PHI)
 * 
 * @param client - Client object with sensitive data
 * @returns Client with masked sensitive data
 */
export function maskSensitiveData(client: Client): Client {
  // Create a deep copy of the client
  const maskedClient: Client = JSON.parse(JSON.stringify(client));
  
  // Mask SSN: Display only last 4 digits
  if (maskedClient.ssn) {
    maskedClient.ssn = `XXX-XX-${maskedClient.ssn.slice(-4)}`;
  }
  
  // Mask Medicaid ID: Display first 2 and last 4 characters
  if (maskedClient.medicaidId && maskedClient.medicaidId.length > 6) {
    const firstTwo = maskedClient.medicaidId.slice(0, 2);
    const lastFour = maskedClient.medicaidId.slice(-4);
    const maskedPortion = 'X'.repeat(maskedClient.medicaidId.length - 6);
    maskedClient.medicaidId = `${firstTwo}${maskedPortion}${lastFour}`;
  }
  
  // Mask Medicare ID: Display first 2 and last 4 characters
  if (maskedClient.medicareId && maskedClient.medicareId.length > 6) {
    const firstTwo = maskedClient.medicareId.slice(0, 2);
    const lastFour = maskedClient.medicareId.slice(-4);
    const maskedPortion = 'X'.repeat(maskedClient.medicareId.length - 6);
    maskedClient.medicareId = `${firstTwo}${maskedPortion}${lastFour}`;
  }
  
  // Truncate address to just city and state
  if (maskedClient.address) {
    maskedClient.address = {
      street1: 'XXXXX',
      street2: null,
      city: maskedClient.address.city,
      state: maskedClient.address.state,
      zipCode: 'XXXXX',
      country: maskedClient.address.country
    };
  }
  
  // Partially mask email address
  if (maskedClient.contactInfo && maskedClient.contactInfo.email) {
    const emailParts = maskedClient.contactInfo.email.split('@');
    if (emailParts.length === 2) {
      const username = emailParts[0];
      const domain = emailParts[1];
      
      // Mask all but first character of username
      const maskedUsername = username.charAt(0) + 'X'.repeat(username.length - 1);
      maskedClient.contactInfo.email = `${maskedUsername}@${domain}`;
    }
  }
  
  // Mask phone numbers (show only last 4 digits)
  if (maskedClient.contactInfo && maskedClient.contactInfo.phone) {
    maskedClient.contactInfo.phone = `XXX-XXX-${maskedClient.contactInfo.phone.slice(-4)}`;
  }
  
  if (maskedClient.contactInfo && maskedClient.contactInfo.alternatePhone) {
    maskedClient.contactInfo.alternatePhone = `XXX-XXX-${maskedClient.contactInfo.alternatePhone.slice(-4)}`;
  }
  
  return maskedClient;
}

/**
 * Model class for client data with validation and transformation methods
 * Provides methods for converting between database and application representations of client data
 */
export class ClientModel {
  /**
   * Name of the clients database table
   */
  public tableName: string;
  
  /**
   * Name of the client programs database table
   */
  public programsTableName: string;
  
  /**
   * Name of the client insurances database table
   */
  public insurancesTableName: string;
  
  /**
   * Creates a new ClientModel instance
   */
  constructor() {
    this.tableName = 'clients';
    this.programsTableName = 'client_programs';
    this.insurancesTableName = 'client_insurances';
  }
  
  /**
   * Converts a database record to a Client object
   * 
   * @param dbRecord - Database record to convert
   * @returns Client object
   */
  fromDb(dbRecord: Record<string, any>): Client {
    return mapDbToClient(dbRecord);
  }
  
  /**
   * Converts a Client object to a database record
   * 
   * @param client - Client object to convert
   * @returns Database record
   */
  toDb(client: Client): Record<string, any> {
    return mapClientToDb(client);
  }
  
  /**
   * Converts a database record to a ClientProgram object
   * 
   * @param dbRecord - Database record to convert
   * @returns ClientProgram object
   */
  programFromDb(dbRecord: Record<string, any>): ClientProgram {
    return mapDbToClientProgram(dbRecord);
  }
  
  /**
   * Converts a ClientProgram object to a database record
   * 
   * @param program - ClientProgram object to convert
   * @returns Database record
   */
  programToDb(program: ClientProgram): Record<string, any> {
    return mapClientProgramToDb(program);
  }
  
  /**
   * Converts a database record to a ClientInsurance object
   * 
   * @param dbRecord - Database record to convert
   * @returns ClientInsurance object
   */
  insuranceFromDb(dbRecord: Record<string, any>): ClientInsurance {
    return mapDbToClientInsurance(dbRecord);
  }
  
  /**
   * Converts a ClientInsurance object to a database record
   * 
   * @param insurance - ClientInsurance object to convert
   * @returns Database record
   */
  insuranceToDb(insurance: ClientInsurance): Record<string, any> {
    return mapClientInsuranceToDb(insurance);
  }
  
  /**
   * Validates a client object
   * 
   * @param client - Client object to validate
   * @returns Validation result with any error messages
   */
  validate(client: Partial<Client>): { isValid: boolean; errors: string[] } {
    return validateClient(client);
  }
  
  /**
   * Masks sensitive client data for logging or display
   * 
   * @param client - Client object with sensitive data
   * @returns Client with masked sensitive data
   */
  maskSensitiveData(client: Client): Client {
    return maskSensitiveData(client);
  }
  
  /**
   * Gets the full name of a client
   * 
   * @param client - Client object
   * @returns Full name (first, middle if present, last)
   */
  getFullName(client: Client): string {
    if (client.middleName) {
      return `${client.firstName} ${client.middleName} ${client.lastName}`;
    }
    return `${client.firstName} ${client.lastName}`;
  }
  
  /**
   * Calculates the age of a client based on date of birth
   * 
   * @param client - Client object
   * @returns Age in years
   */
  getAge(client: Client): number {
    const today = new Date();
    const birthDate = new Date(client.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Checks if a client is enrolled in an active program
   * 
   * @param client - Client object
   * @param programId - Program ID to check
   * @returns True if client has active enrollment in the specified program
   */
  hasActiveProgram(client: Client, programId: UUID): boolean {
    if (!client.programs || client.programs.length === 0) {
      return false;
    }
    
    return client.programs.some(program => 
      program.programId === programId && 
      program.status === StatusType.ACTIVE &&
      (!program.endDate || new Date(program.endDate) >= new Date())
    );
  }
  
  /**
   * Gets the primary insurance for a client
   * 
   * @param client - Client object
   * @returns Primary insurance or null if none
   */
  getPrimaryInsurance(client: Client): ClientInsurance | null {
    if (!client.insurances || client.insurances.length === 0) {
      return null;
    }
    
    const primaryInsurance = client.insurances.find(insurance => 
      insurance.isPrimary === true && 
      insurance.status === StatusType.ACTIVE
    );
    
    return primaryInsurance || null;
  }
}

// Default export of the ClientModel class
export default ClientModel;