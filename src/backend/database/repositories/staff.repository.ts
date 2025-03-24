import { BaseRepository } from './base.repository';
import { getKnexInstance } from '../connection';
import { 
  Staff, 
  StaffQualification, 
  StaffProgramAssignment, 
  StaffFilterParams, 
  StaffSummary 
} from '../../models/staff.model';
import { 
  UUID, 
  StatusType, 
  ISO8601Date 
} from '../../types/common.types';
import { 
  Transaction, 
  WhereCondition, 
  Pagination, 
  OrderBy, 
  PaginatedResult, 
  RepositoryOptions 
} from '../../types/database.types';
import { ServiceType } from '../../types/services.types';
import { DatabaseError } from '../../errors/database-error';
import { NotFoundError } from '../../errors/not-found-error';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0

/**
 * Repository class for staff-related database operations in the HCBS Revenue Management System.
 * Provides methods for managing staff records, qualifications, program assignments, and availability.
 */
export class StaffRepository extends BaseRepository<Staff> {
  private qualificationsTableName: string;
  private programAssignmentsTableName: string;
  private availabilityTableName: string;

  /**
   * Creates a new StaffRepository instance
   */
  constructor() {
    super('staff', 'id', true);
    this.qualificationsTableName = 'staff_qualifications';
    this.programAssignmentsTableName = 'staff_program_assignments';
    this.availabilityTableName = 'staff_availability';
  }

  /**
   * Finds a staff member by ID
   * 
   * @param id - Staff ID to find
   * @param options - Repository options including transaction
   * @returns Promise resolving to staff record if found, null otherwise
   */
  async findById(id: UUID, options: RepositoryOptions = {}): Promise<Staff | null> {
    try {
      return await super.findById(id, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findById');
    }
  }

  /**
   * Finds a staff member by email address
   * 
   * @param email - Email address to search for
   * @param options - Repository options including transaction
   * @returns Promise resolving to staff record if found, null otherwise
   */
  async findByEmail(email: string, options: RepositoryOptions = {}): Promise<Staff | null> {
    try {
      logger.debug(`Finding staff by email: ${email}`);
      const queryBuilder = this.getQueryBuilder(options.transaction);
      
      // Case insensitive email search
      const result = await queryBuilder
        .where('email', 'ilike', email)
        .first();
      
      return result || null;
    } catch (error) {
      this.handleDatabaseError(error, 'findByEmail');
    }
  }

  /**
   * Finds a staff member with their qualifications
   * 
   * @param id - Staff ID to find
   * @param options - Repository options including transaction
   * @returns Promise resolving to staff record with qualifications if found, null otherwise
   */
  async findWithQualifications(id: UUID, options: RepositoryOptions = {}): Promise<Staff | null> {
    try {
      logger.debug(`Finding staff with qualifications, ID: ${id}`);
      
      // First find the staff record
      const staff = await this.findById(id, options);
      if (!staff) {
        return null;
      }
      
      // Get qualifications for the staff member
      const qualifications = await this.getQualifications(id, options);
      
      // Return staff with qualifications
      return {
        ...staff,
        qualifications
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithQualifications');
    }
  }

  /**
   * Finds a staff member with their program assignments
   * 
   * @param id - Staff ID to find
   * @param options - Repository options including transaction
   * @returns Promise resolving to staff record with program assignments if found, null otherwise
   */
  async findWithProgramAssignments(id: UUID, options: RepositoryOptions = {}): Promise<Staff | null> {
    try {
      logger.debug(`Finding staff with program assignments, ID: ${id}`);
      
      // First find the staff record
      const staff = await this.findById(id, options);
      if (!staff) {
        return null;
      }
      
      // Get program assignments for the staff member
      const programAssignments = await this.getProgramAssignments(id, options);
      
      // Return staff with program assignments
      return {
        ...staff,
        programAssignments
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithProgramAssignments');
    }
  }

  /**
   * Finds a staff member with all related details (qualifications and program assignments)
   * 
   * @param id - Staff ID to find
   * @param options - Repository options including transaction
   * @returns Promise resolving to staff record with all details if found, null otherwise
   */
  async findWithDetails(id: UUID, options: RepositoryOptions = {}): Promise<Staff | null> {
    try {
      logger.debug(`Finding staff with all details, ID: ${id}`);
      
      // First find the staff record
      const staff = await this.findById(id, options);
      if (!staff) {
        return null;
      }
      
      // Get both qualifications and program assignments
      const [qualifications, programAssignments] = await Promise.all([
        this.getQualifications(id, options),
        this.getProgramAssignments(id, options)
      ]);
      
      // Return staff with all details
      return {
        ...staff,
        qualifications,
        programAssignments
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findWithDetails');
    }
  }

  /**
   * Finds all staff members with optional filtering
   * 
   * @param conditions - Where conditions to filter staff
   * @param pagination - Pagination options
   * @param orderBy - Sorting options
   * @param options - Repository options including transaction
   * @returns Promise resolving to paginated staff records
   */
  async findAll(
    conditions: WhereCondition = {},
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Staff>> {
    try {
      return await super.findAll(conditions, pagination, orderBy, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findAll');
    }
  }

  /**
   * Finds staff members using specialized filters
   * 
   * @param filters - Staff filter parameters
   * @param pagination - Pagination options
   * @param orderBy - Sorting options
   * @param options - Repository options including transaction
   * @returns Promise resolving to paginated staff records matching filters
   */
  async findByFilters(
    filters: StaffFilterParams,
    pagination: Pagination = { page: 1, limit: 25 },
    orderBy: OrderBy[] = [],
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Staff>> {
    try {
      logger.debug('Finding staff with filters', { filters });
      
      // Initialize where conditions
      const conditions: any = {};
      
      // Add status filter if provided
      if (filters.status) {
        conditions.status = filters.status;
      }
      
      // Handle program ID filter by joining with program assignments
      if (filters.programId) {
        return this.findStaffByProgram(filters.programId, pagination, options);
      }
      
      // Handle facility ID filter
      if (filters.facilityId) {
        conditions.facility_id = filters.facilityId;
      }
      
      // Handle service type filter by joining with qualifications
      if (filters.serviceTypeId) {
        return this.findQualifiedStaff(filters.serviceTypeId, pagination, options);
      }
      
      // Handle search filter
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        // Use findAll with custom query builder that adds search conditions
        const knex = getKnexInstance();
        const queryBuilder = this.getQueryBuilder(options.transaction);
        
        queryBuilder.where(function() {
          this.where('first_name', 'ilike', searchTerm)
            .orWhere('last_name', 'ilike', searchTerm)
            .orWhere('email', 'ilike', searchTerm)
            .orWhere('employee_id', 'ilike', searchTerm)
            .orWhereRaw("CONCAT(first_name, ' ', last_name) ilike ?", [searchTerm]);
        });
        
        // Continue with standard findAll approach but with the custom builder
        return await this.findAll(conditions, pagination, orderBy, {
          ...options,
          queryBuilder
        });
      }
      
      // Use standard findAll with the constructed conditions
      return await this.findAll(conditions, pagination, orderBy, options);
    } catch (error) {
      this.handleDatabaseError(error, 'findByFilters');
    }
  }

  /**
   * Creates a new staff member
   * 
   * @param data - Staff data to create
   * @param options - Repository options including transaction
   * @returns Promise resolving to the created staff record
   */
  async create(data: Partial<Staff>, options: RepositoryOptions = {}): Promise<Staff> {
    try {
      logger.debug('Creating new staff member', { data });
      
      // Generate UUID if not provided
      if (!data.id) {
        data.id = uuidv4();
      }
      
      // Set default status if not provided
      if (!data.status) {
        data.status = StatusType.ACTIVE;
      }
      
      // Call the parent create method
      return await super.create(data, options);
    } catch (error) {
      this.handleDatabaseError(error, 'create');
    }
  }

  /**
   * Updates an existing staff member
   * 
   * @param id - ID of staff to update
   * @param data - Staff data to update
   * @param options - Repository options including transaction
   * @returns Promise resolving to the updated staff record
   */
  async update(id: UUID, data: Partial<Staff>, options: RepositoryOptions = {}): Promise<Staff> {
    try {
      logger.debug(`Updating staff member with ID: ${id}`, { data });
      return await super.update(id, data, options);
    } catch (error) {
      this.handleDatabaseError(error, 'update');
    }
  }

  /**
   * Soft deletes a staff member
   * 
   * @param id - ID of staff to delete
   * @param options - Repository options including transaction
   * @returns Promise resolving to true if deletion was successful
   */
  async delete(id: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Deleting staff member with ID: ${id}`);
      return await super.delete(id, options);
    } catch (error) {
      this.handleDatabaseError(error, 'delete');
    }
  }

  /**
   * Activates a staff member
   * 
   * @param id - ID of staff to activate
   * @param updatedBy - ID of user making the update (optional)
   * @param options - Repository options including transaction
   * @returns Promise resolving to the updated staff record
   */
  async activate(id: UUID, updatedBy: UUID | null = null, options: RepositoryOptions = {}): Promise<Staff> {
    try {
      logger.debug(`Activating staff member with ID: ${id}`);
      
      const updateData: Partial<Staff> = {
        status: StatusType.ACTIVE
      };
      
      const updatedStaff = await this.update(id, updateData, {
        ...options,
        updatedBy
      });
      
      return updatedStaff;
    } catch (error) {
      this.handleDatabaseError(error, 'activate');
    }
  }

  /**
   * Deactivates a staff member
   * 
   * @param id - ID of staff to deactivate
   * @param updatedBy - ID of user making the update (optional)
   * @param options - Repository options including transaction
   * @returns Promise resolving to the updated staff record
   */
  async deactivate(id: UUID, updatedBy: UUID | null = null, options: RepositoryOptions = {}): Promise<Staff> {
    try {
      logger.debug(`Deactivating staff member with ID: ${id}`);
      
      const updateData: Partial<Staff> = {
        status: StatusType.INACTIVE
      };
      
      const updatedStaff = await this.update(id, updateData, {
        ...options,
        updatedBy
      });
      
      return updatedStaff;
    } catch (error) {
      this.handleDatabaseError(error, 'deactivate');
    }
  }

  /**
   * Gets qualifications for a staff member
   * 
   * @param staffId - ID of staff member
   * @param options - Repository options including transaction
   * @returns Promise resolving to array of staff qualifications
   */
  async getQualifications(staffId: UUID, options: RepositoryOptions = {}): Promise<StaffQualification[]> {
    try {
      logger.debug(`Getting qualifications for staff ID: ${staffId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.qualificationsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.qualificationsTableName);
      }
      
      // Join with service types to get service type names
      const qualifications = await queryBuilder
        .select([
          `${this.qualificationsTableName}.*`,
          'service_types.name as service_type_name'
        ])
        .leftJoin('service_types', `${this.qualificationsTableName}.service_type_id`, 'service_types.id')
        .where(`${this.qualificationsTableName}.staff_id`, staffId)
        .whereNull(`${this.qualificationsTableName}.deleted_at`)
        .orderBy(`${this.qualificationsTableName}.effective_date`, 'desc');
      
      return qualifications;
    } catch (error) {
      this.handleDatabaseError(error, 'getQualifications');
    }
  }

  /**
   * Adds a qualification to a staff member
   * 
   * @param staffId - ID of staff member to add qualification to
   * @param qualification - Qualification data to add
   * @param options - Repository options including transaction
   * @returns Promise resolving to the created qualification
   */
  async addQualification(
    staffId: UUID, 
    qualification: Partial<StaffQualification>, 
    options: RepositoryOptions = {}
  ): Promise<StaffQualification> {
    try {
      logger.debug(`Adding qualification to staff ID: ${staffId}`, { qualification });
      
      // Generate ID if not provided
      if (!qualification.id) {
        qualification.id = uuidv4();
      }
      
      // Set staff ID in qualification data
      qualification.staffId = staffId;
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.qualificationsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.qualificationsTableName);
      }
      
      // Add created_at and updated_at timestamps
      const now = new Date();
      const qualificationData = {
        ...qualification,
        staff_id: staffId, // Convert camelCase to snake_case
        created_at: now,
        updated_at: now,
        created_by: options.createdBy || null,
        updated_by: options.updatedBy || null
      };
      
      // Remove staffId from data to avoid duplicate keys with staff_id
      delete (qualificationData as any).staffId;
      
      // Add qualification
      const [result] = await queryBuilder
        .insert(qualificationData)
        .returning('*');
      
      // Get service type name for the created qualification
      const serviceTypeQuery = knex('service_types')
        .select('name')
        .where('id', result.service_type_id)
        .first();
      
      if (options.transaction) {
        serviceTypeQuery.transacting(options.transaction);
      }
      
      const serviceType = await serviceTypeQuery;
      
      // Convert snake_case to camelCase for response
      const createdQualification: StaffQualification = {
        id: result.id,
        staffId: result.staff_id,
        serviceTypeId: result.service_type_id,
        serviceTypeName: serviceType ? serviceType.name : '',
        effectiveDate: result.effective_date,
        expirationDate: result.expiration_date,
        certificationNumber: result.certification_number,
        notes: result.notes
      };
      
      return createdQualification;
    } catch (error) {
      this.handleDatabaseError(error, 'addQualification');
    }
  }

  /**
   * Updates a staff qualification
   * 
   * @param qualificationId - ID of qualification to update
   * @param data - Qualification data to update
   * @param options - Repository options including transaction
   * @returns Promise resolving to the updated qualification
   */
  async updateQualification(
    qualificationId: UUID, 
    data: Partial<StaffQualification>, 
    options: RepositoryOptions = {}
  ): Promise<StaffQualification> {
    try {
      logger.debug(`Updating qualification with ID: ${qualificationId}`, { data });
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.qualificationsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.qualificationsTableName);
      }
      
      // Prepare update data (convert camelCase to snake_case)
      const updateData: any = {
        updated_at: new Date(),
        updated_by: options.updatedBy || null
      };
      
      // Map properties from camelCase to snake_case
      if (data.serviceTypeId !== undefined) updateData.service_type_id = data.serviceTypeId;
      if (data.effectiveDate !== undefined) updateData.effective_date = data.effectiveDate;
      if (data.expirationDate !== undefined) updateData.expiration_date = data.expirationDate;
      if (data.certificationNumber !== undefined) updateData.certification_number = data.certificationNumber;
      if (data.notes !== undefined) updateData.notes = data.notes;
      
      // Update qualification
      const [result] = await queryBuilder
        .where('id', qualificationId)
        .update(updateData)
        .returning('*');
      
      if (!result) {
        throw new NotFoundError('Qualification not found', 'qualification', qualificationId);
      }
      
      // Get service type name for the updated qualification
      const serviceTypeQuery = knex('service_types')
        .select('name')
        .where('id', result.service_type_id)
        .first();
      
      if (options.transaction) {
        serviceTypeQuery.transacting(options.transaction);
      }
      
      const serviceType = await serviceTypeQuery;
      
      // Convert snake_case to camelCase for response
      const updatedQualification: StaffQualification = {
        id: result.id,
        staffId: result.staff_id,
        serviceTypeId: result.service_type_id,
        serviceTypeName: serviceType ? serviceType.name : '',
        effectiveDate: result.effective_date,
        expirationDate: result.expiration_date,
        certificationNumber: result.certification_number,
        notes: result.notes
      };
      
      return updatedQualification;
    } catch (error) {
      this.handleDatabaseError(error, 'updateQualification');
    }
  }

  /**
   * Removes a qualification from a staff member
   * 
   * @param qualificationId - ID of qualification to remove
   * @param options - Repository options including transaction
   * @returns Promise resolving to true if removal was successful
   */
  async removeQualification(qualificationId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Removing qualification with ID: ${qualificationId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.qualificationsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.qualificationsTableName);
      }
      
      // Check if qualification exists
      const qualification = await queryBuilder
        .where('id', qualificationId)
        .first();
      
      if (!qualification) {
        throw new NotFoundError('Qualification not found', 'qualification', qualificationId);
      }
      
      // Delete qualification (soft delete if field exists)
      let result;
      if (await this.hasColumn(this.qualificationsTableName, 'deleted_at')) {
        result = await queryBuilder
          .where('id', qualificationId)
          .update({
            deleted_at: new Date(),
            updated_at: new Date(),
            deleted_by: options.deletedBy || null,
            updated_by: options.updatedBy || null
          });
      } else {
        result = await queryBuilder
          .where('id', qualificationId)
          .delete();
      }
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'removeQualification');
    }
  }

  /**
   * Gets program assignments for a staff member
   * 
   * @param staffId - ID of staff member
   * @param options - Repository options including transaction
   * @returns Promise resolving to array of staff program assignments
   */
  async getProgramAssignments(staffId: UUID, options: RepositoryOptions = {}): Promise<StaffProgramAssignment[]> {
    try {
      logger.debug(`Getting program assignments for staff ID: ${staffId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.programAssignmentsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.programAssignmentsTableName);
      }
      
      // Join with programs to get program names
      const assignments = await queryBuilder
        .select([
          `${this.programAssignmentsTableName}.*`,
          'programs.name as program_name'
        ])
        .leftJoin('programs', `${this.programAssignmentsTableName}.program_id`, 'programs.id')
        .where(`${this.programAssignmentsTableName}.staff_id`, staffId)
        .whereNull(`${this.programAssignmentsTableName}.deleted_at`)
        .orderBy(`${this.programAssignmentsTableName}.start_date`, 'desc');
      
      // Convert snake_case to camelCase for response
      return assignments.map(assignment => ({
        id: assignment.id,
        staffId: assignment.staff_id,
        programId: assignment.program_id,
        programName: assignment.program_name,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        isPrimary: assignment.is_primary
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getProgramAssignments');
    }
  }

  /**
   * Assigns a staff member to a program
   * 
   * @param staffId - ID of staff member to assign
   * @param assignment - Program assignment data
   * @param options - Repository options including transaction
   * @returns Promise resolving to the created program assignment
   */
  async assignToProgram(
    staffId: UUID, 
    assignment: Partial<StaffProgramAssignment>, 
    options: RepositoryOptions = {}
  ): Promise<StaffProgramAssignment> {
    try {
      logger.debug(`Assigning staff ID: ${staffId} to program`, { assignment });
      
      // Generate ID if not provided
      if (!assignment.id) {
        assignment.id = uuidv4();
      }
      
      // Set staff ID in assignment data
      assignment.staffId = staffId;
      
      // Set start date to current date if not provided
      if (!assignment.startDate) {
        assignment.startDate = new Date().toISOString() as ISO8601Date;
      }
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.programAssignmentsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.programAssignmentsTableName);
      }
      
      // Add created_at and updated_at timestamps
      const now = new Date();
      const assignmentData = {
        ...assignment,
        staff_id: staffId, // Convert camelCase to snake_case
        program_id: assignment.programId,
        start_date: assignment.startDate,
        end_date: assignment.endDate,
        is_primary: assignment.isPrimary || false,
        created_at: now,
        updated_at: now,
        created_by: options.createdBy || null,
        updated_by: options.updatedBy || null
      };
      
      // Remove camelCase properties to avoid duplicate keys
      delete (assignmentData as any).staffId;
      delete (assignmentData as any).programId;
      delete (assignmentData as any).startDate;
      delete (assignmentData as any).endDate;
      delete (assignmentData as any).isPrimary;
      
      // Add assignment
      const [result] = await queryBuilder
        .insert(assignmentData)
        .returning('*');
      
      // Get program name for the created assignment
      const programQuery = knex('programs')
        .select('name')
        .where('id', result.program_id)
        .first();
      
      if (options.transaction) {
        programQuery.transacting(options.transaction);
      }
      
      const program = await programQuery;
      
      // Convert snake_case to camelCase for response
      const createdAssignment: StaffProgramAssignment = {
        id: result.id,
        staffId: result.staff_id,
        programId: result.program_id,
        programName: program ? program.name : '',
        startDate: result.start_date,
        endDate: result.end_date,
        isPrimary: result.is_primary
      };
      
      return createdAssignment;
    } catch (error) {
      this.handleDatabaseError(error, 'assignToProgram');
    }
  }

  /**
   * Updates a staff program assignment
   * 
   * @param assignmentId - ID of assignment to update
   * @param data - Assignment data to update
   * @param options - Repository options including transaction
   * @returns Promise resolving to the updated program assignment
   */
  async updateProgramAssignment(
    assignmentId: UUID, 
    data: Partial<StaffProgramAssignment>, 
    options: RepositoryOptions = {}
  ): Promise<StaffProgramAssignment> {
    try {
      logger.debug(`Updating program assignment with ID: ${assignmentId}`, { data });
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.programAssignmentsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.programAssignmentsTableName);
      }
      
      // Prepare update data (convert camelCase to snake_case)
      const updateData: any = {
        updated_at: new Date(),
        updated_by: options.updatedBy || null
      };
      
      // Map properties from camelCase to snake_case
      if (data.programId !== undefined) updateData.program_id = data.programId;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.isPrimary !== undefined) updateData.is_primary = data.isPrimary;
      
      // Update assignment
      const [result] = await queryBuilder
        .where('id', assignmentId)
        .update(updateData)
        .returning('*');
      
      if (!result) {
        throw new NotFoundError('Program assignment not found', 'program_assignment', assignmentId);
      }
      
      // Get program name for the updated assignment
      const programQuery = knex('programs')
        .select('name')
        .where('id', result.program_id)
        .first();
      
      if (options.transaction) {
        programQuery.transacting(options.transaction);
      }
      
      const program = await programQuery;
      
      // Convert snake_case to camelCase for response
      const updatedAssignment: StaffProgramAssignment = {
        id: result.id,
        staffId: result.staff_id,
        programId: result.program_id,
        programName: program ? program.name : '',
        startDate: result.start_date,
        endDate: result.end_date,
        isPrimary: result.is_primary
      };
      
      return updatedAssignment;
    } catch (error) {
      this.handleDatabaseError(error, 'updateProgramAssignment');
    }
  }

  /**
   * Removes a staff member from a program
   * 
   * @param assignmentId - ID of assignment to remove
   * @param options - Repository options including transaction
   * @returns Promise resolving to true if removal was successful
   */
  async removeFromProgram(assignmentId: UUID, options: RepositoryOptions = {}): Promise<boolean> {
    try {
      logger.debug(`Removing program assignment with ID: ${assignmentId}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.programAssignmentsTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.programAssignmentsTableName);
      }
      
      // Check if assignment exists
      const assignment = await queryBuilder
        .where('id', assignmentId)
        .first();
      
      if (!assignment) {
        throw new NotFoundError('Program assignment not found', 'program_assignment', assignmentId);
      }
      
      // Delete assignment (soft delete if field exists)
      let result;
      if (await this.hasColumn(this.programAssignmentsTableName, 'deleted_at')) {
        result = await queryBuilder
          .where('id', assignmentId)
          .update({
            deleted_at: new Date(),
            updated_at: new Date(),
            deleted_by: options.deletedBy || null,
            updated_by: options.updatedBy || null
          });
      } else {
        result = await queryBuilder
          .where('id', assignmentId)
          .delete();
      }
      
      return result > 0;
    } catch (error) {
      this.handleDatabaseError(error, 'removeFromProgram');
    }
  }

  /**
   * Checks if a staff member is available for a specific date and time
   * 
   * @param staffId - ID of staff member to check
   * @param date - Date to check availability for
   * @param startTime - Start time for availability check
   * @param endTime - End time for availability check
   * @param options - Repository options including transaction
   * @returns Promise resolving to true if staff is available, false otherwise
   */
  async checkAvailability(
    staffId: UUID, 
    date: ISO8601Date, 
    startTime: string, 
    endTime: string, 
    options: RepositoryOptions = {}
  ): Promise<boolean> {
    try {
      logger.debug(`Checking availability for staff ID: ${staffId} on ${date} from ${startTime} to ${endTime}`);
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.availabilityTableName);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.availabilityTableName);
      }
      
      // Count conflicts in staff availability for the specified date and time range
      const conflicts = await queryBuilder
        .where('staff_id', staffId)
        .where('date', date)
        .where(function() {
          // Check for time range overlaps
          this.where(function() {
            // Conflict if start time is between existing start and end times
            this.where('start_time', '<=', startTime)
              .where('end_time', '>', startTime);
          }).orWhere(function() {
            // Conflict if end time is between existing start and end times
            this.where('start_time', '<', endTime)
              .where('end_time', '>=', endTime);
          }).orWhere(function() {
            // Conflict if existing time range is contained within requested range
            this.where('start_time', '>=', startTime)
              .where('end_time', '<=', endTime);
          });
        })
        .count('id as count')
        .first();
      
      // Staff is available if no conflicts are found
      return parseInt(conflicts.count, 10) === 0;
    } catch (error) {
      this.handleDatabaseError(error, 'checkAvailability');
    }
  }

  /**
   * Gets summarized staff information for dropdowns and references
   * 
   * @param filters - Optional filters to apply
   * @param options - Repository options including transaction
   * @returns Promise resolving to array of staff summaries
   */
  async getStaffSummaries(
    filters: StaffFilterParams = {}, 
    options: RepositoryOptions = {}
  ): Promise<StaffSummary[]> {
    try {
      logger.debug('Getting staff summaries', { filters });
      
      const knex = getKnexInstance();
      let queryBuilder = knex(this.tableName)
        .select([
          'id',
          'first_name as firstName',
          'last_name as lastName',
          'title',
          'status'
        ]);
      
      if (options.transaction) {
        queryBuilder = options.transaction(this.tableName);
      }
      
      // Add soft delete filter
      if (this.softDelete) {
        queryBuilder.whereNull('deleted_at');
      }
      
      // Apply filters if provided
      if (filters.status) {
        queryBuilder.where('status', filters.status);
      }
      
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        queryBuilder.where(function() {
          this.where('first_name', 'ilike', searchTerm)
            .orWhere('last_name', 'ilike', searchTerm)
            .orWhereRaw("CONCAT(first_name, ' ', last_name) ilike ?", [searchTerm]);
        });
      }
      
      const results = await queryBuilder.orderBy('last_name').orderBy('first_name');
      
      // Map results to StaffSummary objects with computed fullName
      return results.map(staff => ({
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: `${staff.firstName} ${staff.lastName}`,
        title: staff.title,
        status: staff.status
      }));
    } catch (error) {
      this.handleDatabaseError(error, 'getStaffSummaries');
    }
  }

  /**
   * Finds staff members qualified for a specific service type
   * 
   * @param serviceTypeId - Service type ID to check qualifications for
   * @param pagination - Pagination options
   * @param options - Repository options including transaction
   * @returns Promise resolving to paginated staff records qualified for the service
   */
  async findQualifiedStaff(
    serviceTypeId: UUID, 
    pagination: Pagination = { page: 1, limit: 25 }, 
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Staff>> {
    try {
      logger.debug(`Finding staff qualified for service type ID: ${serviceTypeId}`);
      
      const knex = getKnexInstance();
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      // Build query to find staff with valid qualifications for the service type
      let queryBuilder = knex(this.tableName)
        .select(`${this.tableName}.*`)
        .join(
          this.qualificationsTableName,
          `${this.tableName}.id`,
          `${this.qualificationsTableName}.staff_id`
        )
        .where(`${this.qualificationsTableName}.service_type_id`, serviceTypeId)
        .where(`${this.tableName}.status`, StatusType.ACTIVE)
        .where(function() {
          this.whereNull(`${this.qualificationsTableName}.expiration_date`)
            .orWhere(`${this.qualificationsTableName}.expiration_date`, '>=', new Date());
        })
        .whereNull(`${this.tableName}.deleted_at`)
        .whereNull(`${this.qualificationsTableName}.deleted_at`)
        .groupBy(`${this.tableName}.id`);
      
      if (options.transaction) {
        queryBuilder = options.transaction.table(this.tableName)
          .select(`${this.tableName}.*`)
          .join(
            this.qualificationsTableName,
            `${this.tableName}.id`,
            `${this.qualificationsTableName}.staff_id`
          )
          .where(`${this.qualificationsTableName}.service_type_id`, serviceTypeId)
          .where(`${this.tableName}.status`, StatusType.ACTIVE)
          .where(function() {
            this.whereNull(`${this.qualificationsTableName}.expiration_date`)
              .orWhere(`${this.qualificationsTableName}.expiration_date`, '>=', new Date());
          })
          .whereNull(`${this.tableName}.deleted_at`)
          .whereNull(`${this.qualificationsTableName}.deleted_at`)
          .groupBy(`${this.tableName}.id`);
      }
      
      // Create count query
      const countQuery = queryBuilder.clone().clearSelect().count('* as count').first();
      
      // Add pagination to main query
      queryBuilder = queryBuilder.limit(limit).offset(offset);
      
      // Execute both queries
      const [data, countResult] = await Promise.all([
        queryBuilder,
        countQuery
      ]);
      
      const total = parseInt(countResult.count, 10);
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findQualifiedStaff');
    }
  }

  /**
   * Finds staff members assigned to a specific program
   * 
   * @param programId - Program ID to find staff for
   * @param pagination - Pagination options
   * @param options - Repository options including transaction
   * @returns Promise resolving to paginated staff records for the program
   */
  async findStaffByProgram(
    programId: UUID, 
    pagination: Pagination = { page: 1, limit: 25 }, 
    options: RepositoryOptions = {}
  ): Promise<PaginatedResult<Staff>> {
    try {
      logger.debug(`Finding staff assigned to program ID: ${programId}`);
      
      const knex = getKnexInstance();
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      // Build query to find staff assigned to the program
      let queryBuilder = knex(this.tableName)
        .select(`${this.tableName}.*`)
        .join(
          this.programAssignmentsTableName,
          `${this.tableName}.id`,
          `${this.programAssignmentsTableName}.staff_id`
        )
        .where(`${this.programAssignmentsTableName}.program_id`, programId)
        .where(`${this.tableName}.status`, StatusType.ACTIVE)
        .where(function() {
          this.whereNull(`${this.programAssignmentsTableName}.end_date`)
            .orWhere(`${this.programAssignmentsTableName}.end_date`, '>=', new Date());
        })
        .whereNull(`${this.tableName}.deleted_at`)
        .whereNull(`${this.programAssignmentsTableName}.deleted_at`)
        .groupBy(`${this.tableName}.id`);
      
      if (options.transaction) {
        queryBuilder = options.transaction.table(this.tableName)
          .select(`${this.tableName}.*`)
          .join(
            this.programAssignmentsTableName,
            `${this.tableName}.id`,
            `${this.programAssignmentsTableName}.staff_id`
          )
          .where(`${this.programAssignmentsTableName}.program_id`, programId)
          .where(`${this.tableName}.status`, StatusType.ACTIVE)
          .where(function() {
            this.whereNull(`${this.programAssignmentsTableName}.end_date`)
              .orWhere(`${this.programAssignmentsTableName}.end_date`, '>=', new Date());
          })
          .whereNull(`${this.tableName}.deleted_at`)
          .whereNull(`${this.programAssignmentsTableName}.deleted_at`)
          .groupBy(`${this.tableName}.id`);
      }
      
      // Create count query
      const countQuery = queryBuilder.clone().clearSelect().count('* as count').first();
      
      // Add pagination to main query
      queryBuilder = queryBuilder.limit(limit).offset(offset);
      
      // Execute both queries
      const [data, countResult] = await Promise.all([
        queryBuilder,
        countQuery
      ]);
      
      const total = parseInt(countResult.count, 10);
      const totalPages = Math.ceil(total / limit);
      
      return {
        data,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError(error, 'findStaffByProgram');
    }
  }

  /**
   * Helper method to check if a table has a specific column
   * Used for determining if soft delete is supported
   * 
   * @param tableName - Name of the table to check
   * @param columnName - Name of the column to check for
   * @returns Promise resolving to true if the column exists
   */
  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    try {
      const knex = getKnexInstance();
      const hasColumn = await knex.schema.hasColumn(tableName, columnName);
      return hasColumn;
    } catch (error) {
      logger.error(`Error checking if table ${tableName} has column ${columnName}`, { error });
      return false;
    }
  }
}

export default StaffRepository;