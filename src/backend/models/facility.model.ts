/**
 * Facility Model
 * 
 * This file defines the Facility model for the HCBS Revenue Management System.
 * It represents service delivery locations where clients receive care and
 * provides interfaces, types, mapping functions, and a model class for
 * facility data management.
 */

import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import {
  UUID,
  ISO8601Date,
  AuditableEntity,
  Address,
  ContactInfo,
  StatusType
} from '../types/common.types';
import { DatabaseEntity } from '../types/database.types';

/**
 * Enum representing different types of facilities in the HCBS system
 */
export enum FacilityType {
  RESIDENTIAL = 'residential',
  DAY_PROGRAM = 'day_program',
  CLINIC = 'clinic',
  HOME = 'home',
  COMMUNITY = 'community',
  ADMINISTRATIVE = 'administrative',
  OTHER = 'other'
}

/**
 * Interface for the Facility model with all properties
 */
export interface Facility extends AuditableEntity {
  id: UUID;
  name: string;
  type: FacilityType;
  licenseNumber: string;
  licenseExpirationDate: ISO8601Date;
  address: Address;
  contactInfo: ContactInfo;
  status: StatusType;
  notes: string;
  createdAt: ISO8601Date;
  createdBy: UUID;
  updatedAt: ISO8601Date;
  updatedBy: UUID;
  deletedAt: ISO8601Date | null;
  deletedBy: UUID | null;
}

/**
 * Interface representing the facility entity in the database
 */
export interface FacilityEntity extends DatabaseEntity {
  id: UUID;
  name: string;
  type: string;
  license_number: string;
  license_expiration_date: string;
  address: string;
  contact_info: string;
  status: string;
  notes: string;
}

/**
 * Data transfer object for creating a new facility
 */
export interface CreateFacilityDto {
  name: string;
  type: FacilityType;
  licenseNumber: string;
  licenseExpirationDate: ISO8601Date;
  address: Address;
  contactInfo: ContactInfo;
  notes: string;
}

/**
 * Data transfer object for updating an existing facility
 */
export interface UpdateFacilityDto {
  name: string;
  type: FacilityType;
  licenseNumber: string;
  licenseExpirationDate: ISO8601Date;
  address: Address;
  contactInfo: ContactInfo;
  status: StatusType;
  notes: string;
}

/**
 * Query parameters for facility searches
 */
export interface FacilityQueryParams {
  search: string;
  type: FacilityType;
  status: StatusType;
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: string;
}

/**
 * Mapping object that maps facility model fields to database columns
 */
export const FacilityEntityMapping = {
  id: 'id',
  name: 'name',
  type: 'type',
  licenseNumber: 'license_number',
  licenseExpirationDate: 'license_expiration_date',
  address: 'address',
  contactInfo: 'contact_info',
  status: 'status',
  notes: 'notes',
  createdAt: 'created_at',
  createdBy: 'created_by',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
  deletedAt: 'deleted_at',
  deletedBy: 'deleted_by'
};

/**
 * Interface for facility service metrics
 */
export interface FacilityServiceMetrics {
  facilityId: UUID;
  facilityName: string;
  serviceCount: number;
  totalAmount: number;
}

/**
 * Interface for tracking facility revenue by program
 */
export interface FacilityRevenueByProgram {
  facilityId: UUID;
  facilityName: string;
  programId: UUID;
  programName: string;
  totalAmount: number;
}

/**
 * Maps a database record to a Facility object
 * 
 * @param dbRecord - Database record to map
 * @returns Mapped Facility object
 */
export const mapDbToFacility = (dbRecord: Record<string, any>): Facility => {
  try {
    // Parse JSON fields if they're stored as strings
    let address: Address;
    let contactInfo: ContactInfo;

    try {
      address = dbRecord.address ? 
        (typeof dbRecord.address === 'string' ? JSON.parse(dbRecord.address) : dbRecord.address) : 
        { street1: '', city: '', state: '', zipCode: '', country: '' };
    } catch (e) {
      address = { street1: '', city: '', state: '', zipCode: '', country: '' };
    }

    try {
      contactInfo = dbRecord.contact_info ? 
        (typeof dbRecord.contact_info === 'string' ? JSON.parse(dbRecord.contact_info) : dbRecord.contact_info) : 
        { email: '', phone: '' };
    } catch (e) {
      contactInfo = { email: '', phone: '' };
    }

    // Map the database record to a Facility object
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      type: dbRecord.type as FacilityType,
      licenseNumber: dbRecord.license_number,
      licenseExpirationDate: dbRecord.license_expiration_date,
      address,
      contactInfo,
      status: dbRecord.status as StatusType,
      notes: dbRecord.notes || '',
      createdAt: dbRecord.created_at,
      createdBy: dbRecord.created_by,
      updatedAt: dbRecord.updated_at,
      updatedBy: dbRecord.updated_by,
      deletedAt: dbRecord.deleted_at || null,
      deletedBy: dbRecord.deleted_by || null
    };
  } catch (error) {
    console.error('Error mapping database record to Facility:', error);
    throw new Error(`Failed to map database record to Facility: ${error.message}`);
  }
};

/**
 * Maps a Facility object to a database record
 * 
 * @param facility - Facility object to map
 * @returns Database record for insertion or update
 */
export const mapFacilityToDb = (facility: Facility): Record<string, any> => {
  try {
    // Convert facility object to database record
    return {
      id: facility.id,
      name: facility.name,
      type: facility.type,
      license_number: facility.licenseNumber,
      license_expiration_date: facility.licenseExpirationDate,
      address: JSON.stringify(facility.address),
      contact_info: JSON.stringify(facility.contactInfo),
      status: facility.status,
      notes: facility.notes,
      created_at: facility.createdAt,
      created_by: facility.createdBy,
      updated_at: facility.updatedAt,
      updated_by: facility.updatedBy,
      deleted_at: facility.deletedAt,
      deleted_by: facility.deletedBy
    };
  } catch (error) {
    console.error('Error mapping Facility to database record:', error);
    throw new Error(`Failed to map Facility to database record: ${error.message}`);
  }
};

/**
 * Model class for facility data with validation and transformation methods
 */
export class FacilityModel {
  tableName: string;

  /**
   * Creates a new FacilityModel instance
   */
  constructor() {
    this.tableName = 'facilities';
  }

  /**
   * Converts a database record to a Facility object
   * 
   * @param dbRecord - Database record
   * @returns Facility object
   */
  fromDb(dbRecord: Record<string, any>): Facility {
    return mapDbToFacility(dbRecord);
  }

  /**
   * Converts a Facility object to a database record
   * 
   * @param facility - Facility object
   * @returns Database record
   */
  toDb(facility: Facility): Record<string, any> {
    return mapFacilityToDb(facility);
  }
}

// Create and export an instance of the FacilityModel
const facilityModel = new FacilityModel();
export default facilityModel;