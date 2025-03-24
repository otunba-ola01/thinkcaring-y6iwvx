/**
 * Authorization Model
 * 
 * This file defines the database model for service authorizations in the HCBS Revenue Management System.
 * Authorizations represent approved service limits for clients and are used to validate services
 * before billing to prevent claim denials due to authorization issues.
 * 
 * The model provides methods for authorization management, validation, and utilization tracking.
 */

import { 
  UUID, 
  ISO8601Date, 
  Units, 
  Money, 
  DateRange,
  AuditableEntity,
  AuthorizationStatus 
} from '../types/common.types';
import { 
  Authorization, 
  AuthorizationWithRelations, 
  AuthorizationUtilization,
  AuthorizationFrequency,
  AuthorizationValidationResult
} from '../types/services.types';
import { db } from '../database/connection';
import { DatabaseError } from '../errors/database-error';
import { NotFoundError } from '../errors/not-found-error';
import { BusinessError } from '../errors/business-error';
import { ProgramModel } from './program.model';
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.0

/**
 * Maps a database record to an Authorization object
 * 
 * @param dbRecord - Database record from the authorizations table
 * @returns Authorization object with properties mapped from the database record
 */
export const mapDbToAuthorization = (dbRecord: Record<string, any>): Authorization => {
  return {
    id: dbRecord.id,
    clientId: dbRecord.client_id,
    programId: dbRecord.program_id,
    number: dbRecord.number,
    status: dbRecord.status as AuthorizationStatus,
    startDate: dbRecord.start_date,
    endDate: dbRecord.end_date,
    authorizedUnits: dbRecord.authorized_units,
    frequency: dbRecord.frequency as AuthorizationFrequency,
    serviceTypeIds: dbRecord.service_type_ids || [],
    notes: dbRecord.notes,
    documentIds: dbRecord.document_ids || [],
    issuedBy: dbRecord.issued_by,
    issuedDate: dbRecord.issued_date,
    utilization: {
      usedUnits: dbRecord.used_units || 0,
      remainingUnits: dbRecord.authorized_units - (dbRecord.used_units || 0),
      utilizationPercentage: dbRecord.authorized_units > 0 
        ? ((dbRecord.used_units || 0) / dbRecord.authorized_units) * 100 
        : 0
    },
    createdAt: dbRecord.created_at,
    createdBy: dbRecord.created_by,
    updatedAt: dbRecord.updated_at,
    updatedBy: dbRecord.updated_by
  };
};

/**
 * Maps an Authorization object to a database record
 * 
 * @param authorization - Authorization object to map to database format
 * @returns Database record with properties mapped from the Authorization object
 */
export const mapAuthorizationToDb = (authorization: Authorization): Record<string, any> => {
  return {
    id: authorization.id,
    client_id: authorization.clientId,
    program_id: authorization.programId,
    number: authorization.number,
    status: authorization.status,
    start_date: authorization.startDate,
    end_date: authorization.endDate,
    authorized_units: authorization.authorizedUnits,
    frequency: authorization.frequency,
    notes: authorization.notes,
    document_ids: Array.isArray(authorization.documentIds) 
      ? authorization.documentIds 
      : [],
    issued_by: authorization.issuedBy,
    issued_date: authorization.issuedDate,
    created_at: authorization.createdAt,
    created_by: authorization.createdBy,
    updated_at: authorization.updatedAt,
    updated_by: authorization.updatedBy
  };
};

/**
 * Retrieves an authorization by its unique identifier
 * 
 * @param id - UUID of the authorization to retrieve
 * @returns Promise resolving to the authorization with relations or null if not found
 */
async function findById(id: UUID): Promise<AuthorizationWithRelations | null> {
  try {
    // Query the database for the authorization
    const result = await db.query(async (knex) => {
      const auth = await knex('authorizations')
        .where('id', id)
        .where('status', '!=', 'CANCELLED')
        .first();
      
      if (!auth) {
        return null;
      }
      
      // Map the database record to an Authorization object
      const authorization = mapDbToAuthorization(auth);
      
      // Get related entities
      const [client, program, serviceTypes, utilization] = await Promise.all([
        // Get client information
        knex('clients')
          .where('id', auth.client_id)
          .select('id', 'first_name', 'last_name', 'medicaid_id')
          .first(),
        
        // Get program information
        knex('programs')
          .where('id', auth.program_id)
          .select('id', 'name', 'code', 'type')
          .first(),
        
        // Get service type information
        knex('authorization_service_types')
          .join('service_types', 'authorization_service_types.service_type_id', '=', 'service_types.id')
          .where('authorization_service_types.authorization_id', id)
          .select('service_types.id', 'service_types.name', 'service_types.code'),
        
        // Get utilization information
        knex('authorization_utilization')
          .where('authorization_id', id)
          .select('used_units')
          .first()
      ]);
      
      // Combine into AuthorizationWithRelations
      const authWithRelations: AuthorizationWithRelations = {
        ...authorization,
        client: client ? {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          medicaidId: client.medicaid_id
        } : null,
        program: program ? {
          id: program.id,
          name: program.name,
          code: program.code,
          type: program.type
        } : null,
        serviceTypes: serviceTypes.map(st => ({
          id: st.id,
          name: st.name,
          code: st.code
        })),
        utilization: {
          usedUnits: utilization?.used_units || 0,
          remainingUnits: authorization.authorizedUnits - (utilization?.used_units || 0),
          utilizationPercentage: authorization.authorizedUnits > 0 
            ? ((utilization?.used_units || 0) / authorization.authorizedUnits) * 100 
            : 0
        }
      };
      
      return authWithRelations;
    });
    
    return result;
  } catch (error) {
    throw new DatabaseError('Error retrieving authorization', {
      operation: 'findById',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves an authorization by its authorization number
 * 
 * @param authNumber - Authorization number to search for
 * @returns Promise resolving to the authorization with relations or null if not found
 */
async function findByAuthNumber(authNumber: string): Promise<AuthorizationWithRelations | null> {
  try {
    // Query the database for the authorization
    const result = await db.query(async (knex) => {
      const auth = await knex('authorizations')
        .where('number', authNumber)
        .where('status', '!=', 'CANCELLED')
        .first();
      
      if (!auth) {
        return null;
      }
      
      return findById(auth.id);
    });
    
    return result;
  } catch (error) {
    throw new DatabaseError('Error retrieving authorization by number', {
      operation: 'findByAuthNumber',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves authorizations for a specific client
 * 
 * @param clientId - UUID of the client
 * @param params - Optional parameters for filtering, pagination, etc.
 * @returns Promise resolving to an object containing the list of authorizations and total count
 */
async function findByClientId(
  clientId: UUID, 
  params: {
    status?: AuthorizationStatus,
    dateRange?: DateRange,
    serviceTypeId?: UUID,
    page?: number,
    limit?: number
  } = {}
): Promise<{ authorizations: AuthorizationWithRelations[], total: number }> {
  try {
    const { status, dateRange, serviceTypeId, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;
    
    return await db.query(async (knex) => {
      // Build the base query
      let query = knex('authorizations')
        .where('client_id', clientId)
        .where('status', '!=', 'CANCELLED');
      
      // Add filters if provided
      if (status) {
        query = query.where('status', status);
      }
      
      if (dateRange) {
        query = query.where(function() {
          this.where(function() {
            this.where('start_date', '<=', dateRange.endDate)
              .where('end_date', '>=', dateRange.startDate);
          }).orWhere(function() {
            this.where('start_date', '<=', dateRange.endDate)
              .whereNull('end_date');
          });
        });
      }
      
      // If filtering by service type, join with the authorization_service_types table
      if (serviceTypeId) {
        query = query.whereExists(function() {
          this.select(knex.raw(1))
            .from('authorization_service_types')
            .whereRaw('authorization_service_types.authorization_id = authorizations.id')
            .where('authorization_service_types.service_type_id', serviceTypeId);
        });
      }
      
      // Count total records for pagination
      const countResult = await query.clone().count('id as total').first();
      const total = parseInt(countResult.total);
      
      // Execute the main query with pagination
      const authRecords = await query
        .orderBy('start_date', 'desc')
        .limit(limit)
        .offset(offset);
      
      // Get full authorization details with relations for each record
      const authorizations = await Promise.all(
        authRecords.map(auth => findById(auth.id))
      );
      
      return {
        authorizations: authorizations.filter(Boolean) as AuthorizationWithRelations[],
        total
      };
    });
  } catch (error) {
    throw new DatabaseError('Error retrieving authorizations for client', {
      operation: 'findByClientId',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves active authorizations for a specific client
 * 
 * @param clientId - UUID of the client
 * @returns Promise resolving to a list of active authorizations with relations
 */
async function findActiveByClientId(clientId: UUID): Promise<AuthorizationWithRelations[]> {
  try {
    const result = await findByClientId(clientId, { status: AuthorizationStatus.ACTIVE });
    return result.authorizations;
  } catch (error) {
    throw new DatabaseError('Error retrieving active authorizations for client', {
      operation: 'findActiveByClientId',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Finds authorizations that are expiring within a specified number of days
 * 
 * @param daysThreshold - Number of days threshold for expiration
 * @returns Promise resolving to a list of expiring authorizations
 */
async function findExpiringAuthorizations(daysThreshold: number): Promise<AuthorizationWithRelations[]> {
  try {
    return await db.query(async (knex) => {
      // Calculate the date threshold
      const today = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(today.getDate() + daysThreshold);
      
      // Query for authorizations expiring within the threshold
      const authRecords = await knex('authorizations')
        .where('status', AuthorizationStatus.ACTIVE)
        .where('end_date', '<=', thresholdDate.toISOString().split('T')[0])
        .where('end_date', '>=', today.toISOString().split('T')[0]);
      
      // Get full authorization details with relations for each record
      const authorizations = await Promise.all(
        authRecords.map(auth => findById(auth.id))
      );
      
      return authorizations.filter(Boolean) as AuthorizationWithRelations[];
    });
  } catch (error) {
    throw new DatabaseError('Error finding expiring authorizations', {
      operation: 'findExpiringAuthorizations',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Creates a new authorization in the database
 * 
 * @param authorizationData - Data for the new authorization
 * @param createdBy - UUID of the user creating the authorization
 * @returns Promise resolving to the newly created authorization with relations
 */
async function create(
  authorizationData: Omit<Authorization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'utilization'>,
  createdBy: UUID | null
): Promise<AuthorizationWithRelations> {
  try {
    return await db.transaction(async (trx) => {
      // Validate client exists
      const client = await trx('clients')
        .where('id', authorizationData.clientId)
        .first();
      
      if (!client) {
        throw new NotFoundError(
          'Client not found',
          'client',
          authorizationData.clientId
        );
      }
      
      // Validate program exists
      const program = await trx('programs')
        .where('id', authorizationData.programId)
        .first();
      
      if (!program) {
        throw new NotFoundError(
          'Program not found',
          'program',
          authorizationData.programId
        );
      }
      
      // Validate service types exist
      if (authorizationData.serviceTypeIds && authorizationData.serviceTypeIds.length > 0) {
        const serviceTypes = await trx('service_types')
          .whereIn('id', authorizationData.serviceTypeIds)
          .select('id');
        
        if (serviceTypes.length !== authorizationData.serviceTypeIds.length) {
          throw new BusinessError(
            'One or more service types not found',
            { 
              providedIds: authorizationData.serviceTypeIds,
              foundIds: serviceTypes.map(st => st.id)
            },
            'INVALID_SERVICE_TYPES'
          );
        }
      }
      
      // Check for overlapping authorizations
      const hasOverlap = await checkOverlappingAuthorizations(
        authorizationData.clientId,
        authorizationData.serviceTypeIds,
        {
          startDate: authorizationData.startDate,
          endDate: authorizationData.endDate
        },
        '' // No authorization ID to exclude for a new authorization
      );
      
      if (hasOverlap) {
        throw new BusinessError(
          'Overlapping authorization exists for this client, service type, and date range',
          {
            clientId: authorizationData.clientId,
            serviceTypeIds: authorizationData.serviceTypeIds,
            startDate: authorizationData.startDate,
            endDate: authorizationData.endDate
          },
          'OVERLAPPING_AUTHORIZATION'
        );
      }
      
      // Generate a UUID for the new authorization
      const id = uuidv4();
      
      // Set timestamp and default values
      const now = new Date().toISOString();
      const initialStatus = authorizationData.status || AuthorizationStatus.APPROVED;
      
      // Prepare the authorization record
      const authRecord = {
        id,
        client_id: authorizationData.clientId,
        program_id: authorizationData.programId,
        number: authorizationData.number,
        status: initialStatus,
        start_date: authorizationData.startDate,
        end_date: authorizationData.endDate,
        authorized_units: authorizationData.authorizedUnits,
        frequency: authorizationData.frequency,
        notes: authorizationData.notes,
        document_ids: Array.isArray(authorizationData.documentIds) 
          ? authorizationData.documentIds 
          : [],
        issued_by: authorizationData.issuedBy,
        issued_date: authorizationData.issuedDate,
        created_at: now,
        created_by: createdBy,
        updated_at: now,
        updated_by: createdBy
      };
      
      // Insert the authorization record
      await trx('authorizations').insert(authRecord);
      
      // Insert service type associations
      if (authorizationData.serviceTypeIds && authorizationData.serviceTypeIds.length > 0) {
        const serviceTypeRecords = authorizationData.serviceTypeIds.map(serviceTypeId => ({
          authorization_id: id,
          service_type_id: serviceTypeId,
          created_at: now,
          created_by: createdBy
        }));
        
        await trx('authorization_service_types').insert(serviceTypeRecords);
      }
      
      // Create initial utilization record
      await trx('authorization_utilization').insert({
        authorization_id: id,
        used_units: 0,
        last_updated: now,
        created_at: now,
        created_by: createdBy,
        updated_at: now,
        updated_by: createdBy
      });
      
      // Retrieve the complete authorization with relations
      const newAuthorization = await findById(id);
      
      if (!newAuthorization) {
        throw new DatabaseError('Failed to retrieve newly created authorization', {
          operation: 'create',
          entity: 'authorization'
        });
      }
      
      return newAuthorization;
    });
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error creating authorization', {
      operation: 'create',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Updates an existing authorization in the database
 * 
 * @param id - UUID of the authorization to update
 * @param authorizationData - Data to update the authorization with
 * @param updatedBy - UUID of the user updating the authorization
 * @returns Promise resolving to the updated authorization with relations
 */
async function update(
  id: UUID,
  authorizationData: Partial<Omit<Authorization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'utilization'>>,
  updatedBy: UUID | null
): Promise<AuthorizationWithRelations> {
  try {
    // Check if authorization exists
    const existingAuth = await findById(id);
    if (!existingAuth) {
      throw new NotFoundError('Authorization not found', 'authorization', id);
    }
    
    return await db.transaction(async (trx) => {
      // Validate client if changed
      if (authorizationData.clientId && authorizationData.clientId !== existingAuth.clientId) {
        const client = await trx('clients')
          .where('id', authorizationData.clientId)
          .first();
        
        if (!client) {
          throw new NotFoundError(
            'Client not found',
            'client',
            authorizationData.clientId
          );
        }
      }
      
      // Validate program if changed
      if (authorizationData.programId && authorizationData.programId !== existingAuth.programId) {
        const program = await trx('programs')
          .where('id', authorizationData.programId)
          .first();
        
        if (!program) {
          throw new NotFoundError(
            'Program not found',
            'program',
            authorizationData.programId
          );
        }
      }
      
      // Validate service types if changed
      if (authorizationData.serviceTypeIds && 
          JSON.stringify(authorizationData.serviceTypeIds.sort()) !== JSON.stringify(existingAuth.serviceTypeIds.sort())) {
        if (authorizationData.serviceTypeIds.length > 0) {
          const serviceTypes = await trx('service_types')
            .whereIn('id', authorizationData.serviceTypeIds)
            .select('id');
          
          if (serviceTypes.length !== authorizationData.serviceTypeIds.length) {
            throw new BusinessError(
              'One or more service types not found',
              { 
                providedIds: authorizationData.serviceTypeIds,
                foundIds: serviceTypes.map(st => st.id)
              },
              'INVALID_SERVICE_TYPES'
            );
          }
        }
      }
      
      // Check for overlapping authorizations if date range changed
      if ((authorizationData.startDate && authorizationData.startDate !== existingAuth.startDate) ||
          (authorizationData.endDate && authorizationData.endDate !== existingAuth.endDate) ||
          (authorizationData.serviceTypeIds && 
           JSON.stringify(authorizationData.serviceTypeIds.sort()) !== JSON.stringify(existingAuth.serviceTypeIds.sort()))) {
        
        const hasOverlap = await checkOverlappingAuthorizations(
          authorizationData.clientId || existingAuth.clientId,
          authorizationData.serviceTypeIds || existingAuth.serviceTypeIds,
          {
            startDate: authorizationData.startDate || existingAuth.startDate,
            endDate: authorizationData.endDate || existingAuth.endDate
          },
          id
        );
        
        if (hasOverlap) {
          throw new BusinessError(
            'Overlapping authorization exists for this client, service type, and date range',
            {
              clientId: authorizationData.clientId || existingAuth.clientId,
              serviceTypeIds: authorizationData.serviceTypeIds || existingAuth.serviceTypeIds,
              startDate: authorizationData.startDate || existingAuth.startDate,
              endDate: authorizationData.endDate || existingAuth.endDate
            },
            'OVERLAPPING_AUTHORIZATION'
          );
        }
      }
      
      // Set timestamp
      const now = new Date().toISOString();
      
      // Prepare the update record
      const updateRecord: Record<string, any> = {
        updated_at: now,
        updated_by: updatedBy
      };
      
      // Add fields that should be updated
      if (authorizationData.clientId) updateRecord.client_id = authorizationData.clientId;
      if (authorizationData.programId) updateRecord.program_id = authorizationData.programId;
      if (authorizationData.number) updateRecord.number = authorizationData.number;
      if (authorizationData.status) updateRecord.status = authorizationData.status;
      if (authorizationData.startDate) updateRecord.start_date = authorizationData.startDate;
      if (authorizationData.endDate !== undefined) updateRecord.end_date = authorizationData.endDate;
      if (authorizationData.authorizedUnits !== undefined) updateRecord.authorized_units = authorizationData.authorizedUnits;
      if (authorizationData.frequency) updateRecord.frequency = authorizationData.frequency;
      if (authorizationData.notes !== undefined) updateRecord.notes = authorizationData.notes;
      if (authorizationData.documentIds) updateRecord.document_ids = authorizationData.documentIds;
      if (authorizationData.issuedBy !== undefined) updateRecord.issued_by = authorizationData.issuedBy;
      if (authorizationData.issuedDate !== undefined) updateRecord.issued_date = authorizationData.issuedDate;
      
      // Update the authorization record
      await trx('authorizations')
        .where('id', id)
        .update(updateRecord);
      
      // Update service type associations if changed
      if (authorizationData.serviceTypeIds && 
          JSON.stringify(authorizationData.serviceTypeIds.sort()) !== JSON.stringify(existingAuth.serviceTypeIds.sort())) {
        // Delete existing associations
        await trx('authorization_service_types')
          .where('authorization_id', id)
          .delete();
        
        // Insert new associations
        if (authorizationData.serviceTypeIds.length > 0) {
          const serviceTypeRecords = authorizationData.serviceTypeIds.map(serviceTypeId => ({
            authorization_id: id,
            service_type_id: serviceTypeId,
            created_at: now,
            created_by: updatedBy
          }));
          
          await trx('authorization_service_types').insert(serviceTypeRecords);
        }
      }
      
      // Retrieve the updated authorization with relations
      const updatedAuthorization = await findById(id);
      
      if (!updatedAuthorization) {
        throw new DatabaseError('Failed to retrieve updated authorization', {
          operation: 'update',
          entity: 'authorization'
        });
      }
      
      return updatedAuthorization;
    });
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error updating authorization', {
      operation: 'update',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Updates an authorization's status
 * 
 * @param id - UUID of the authorization to update
 * @param status - New status for the authorization
 * @param updatedBy - UUID of the user updating the authorization
 * @returns Promise resolving to the updated authorization with relations
 */
async function updateStatus(
  id: UUID,
  status: AuthorizationStatus,
  updatedBy: UUID | null
): Promise<AuthorizationWithRelations> {
  try {
    // Check if authorization exists
    const existingAuth = await findById(id);
    if (!existingAuth) {
      throw new NotFoundError('Authorization not found', 'authorization', id);
    }
    
    // Validate status transition
    const validTransitions: Record<AuthorizationStatus, AuthorizationStatus[]> = {
      [AuthorizationStatus.REQUESTED]: [
        AuthorizationStatus.APPROVED, 
        AuthorizationStatus.DENIED, 
        AuthorizationStatus.CANCELLED
      ],
      [AuthorizationStatus.APPROVED]: [
        AuthorizationStatus.ACTIVE, 
        AuthorizationStatus.CANCELLED
      ],
      [AuthorizationStatus.ACTIVE]: [
        AuthorizationStatus.EXPIRING, 
        AuthorizationStatus.EXPIRED, 
        AuthorizationStatus.CANCELLED
      ],
      [AuthorizationStatus.EXPIRING]: [
        AuthorizationStatus.EXPIRED, 
        AuthorizationStatus.ACTIVE, 
        AuthorizationStatus.CANCELLED
      ],
      [AuthorizationStatus.EXPIRED]: [
        AuthorizationStatus.ACTIVE, 
        AuthorizationStatus.CANCELLED
      ],
      [AuthorizationStatus.DENIED]: [
        AuthorizationStatus.APPROVED, 
        AuthorizationStatus.CANCELLED
      ],
      [AuthorizationStatus.CANCELLED]: [
        AuthorizationStatus.REQUESTED
      ]
    };
    
    if (!validTransitions[existingAuth.status].includes(status)) {
      throw new BusinessError(
        `Invalid status transition: ${existingAuth.status} -> ${status}`,
        {
          currentStatus: existingAuth.status,
          newStatus: status
        },
        'INVALID_STATUS_TRANSITION'
      );
    }
    
    // Update the status
    const now = new Date().toISOString();
    await db.query(async (knex) => {
      await knex('authorizations')
        .where('id', id)
        .update({
          status,
          updated_at: now,
          updated_by: updatedBy
        });
    });
    
    // If status is changed to EXPIRED, check if there are services that need to be updated
    if (status === AuthorizationStatus.EXPIRED) {
      await db.query(async (knex) => {
        // Find services using this authorization that are still in a documentable state
        const affectedServices = await knex('services')
          .where('authorization_id', id)
          .whereIn('documentation_status', ['INCOMPLETE', 'PENDING_REVIEW'])
          .whereIn('billing_status', ['UNBILLED', 'READY_FOR_BILLING'])
          .select('id');
        
        if (affectedServices.length > 0) {
          // Update these services to indicate authorization issue
          await knex('services')
            .whereIn('id', affectedServices.map(s => s.id))
            .update({
              billing_status: 'UNBILLED',
              notes: knex.raw("notes || '\nAuthorization expired: " + now + "'"),
              updated_at: now,
              updated_by: updatedBy
            });
        }
      });
    }
    
    // Retrieve the updated authorization with relations
    const updatedAuthorization = await findById(id);
    
    if (!updatedAuthorization) {
      throw new DatabaseError('Failed to retrieve updated authorization', {
        operation: 'updateStatus',
        entity: 'authorization'
      });
    }
    
    return updatedAuthorization;
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error updating authorization status', {
      operation: 'updateStatus',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Updates the utilization tracking for an authorization
 * 
 * @param id - UUID of the authorization to update
 * @param units - Units to add or subtract
 * @param isAddition - True if adding units, false if subtracting
 * @param updatedBy - UUID of the user updating the utilization
 * @returns Promise resolving to the updated utilization information
 */
async function trackUtilization(
  id: UUID,
  units: Units,
  isAddition: boolean,
  updatedBy: UUID | null
): Promise<AuthorizationUtilization> {
  try {
    // Check if authorization exists
    const existingAuth = await findById(id);
    if (!existingAuth) {
      throw new NotFoundError('Authorization not found', 'authorization', id);
    }
    
    // Get current utilization
    const currentUtilization = await getUtilization(id);
    
    // Calculate new utilization
    let newUsedUnits = isAddition 
      ? currentUtilization.usedUnits + units 
      : currentUtilization.usedUnits - units;
    
    // Ensure used units doesn't go below zero
    if (newUsedUnits < 0) {
      newUsedUnits = 0;
    }
    
    // If adding units, validate against authorized units
    if (isAddition && newUsedUnits > existingAuth.authorizedUnits) {
      throw new BusinessError(
        'Exceeds authorized units',
        {
          authorizedUnits: existingAuth.authorizedUnits,
          currentlyUsed: currentUtilization.usedUnits,
          attemptingToAdd: units,
          wouldResult: newUsedUnits
        },
        'EXCEEDS_AUTHORIZED_UNITS'
      );
    }
    
    const now = new Date().toISOString();
    
    // Update utilization record
    await db.query(async (knex) => {
      await knex('authorization_utilization')
        .where('authorization_id', id)
        .update({
          used_units: newUsedUnits,
          last_updated: now,
          updated_at: now,
          updated_by: updatedBy
        });
      
      // Check if utilization is approaching limit and update status if needed
      const utilizationPercentage = (newUsedUnits / existingAuth.authorizedUnits) * 100;
      
      // If utilization exceeds threshold (e.g., 80%), update status to EXPIRING
      if (utilizationPercentage >= 80 && existingAuth.status === AuthorizationStatus.ACTIVE) {
        await knex('authorizations')
          .where('id', id)
          .update({
            status: AuthorizationStatus.EXPIRING,
            updated_at: now,
            updated_by: updatedBy
          });
        
        // TODO: Create alert notification for approaching authorization limit
      }
      
      // If utilization reaches 100%, create alert notification
      if (utilizationPercentage >= 100) {
        // TODO: Create alert notification for authorization limit reached
      }
    });
    
    // Calculate and return updated utilization
    const remainingUnits = existingAuth.authorizedUnits - newUsedUnits;
    const utilizationPercentage = (newUsedUnits / existingAuth.authorizedUnits) * 100;
    
    return {
      usedUnits: newUsedUnits,
      remainingUnits,
      utilizationPercentage
    };
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error tracking authorization utilization', {
      operation: 'trackUtilization',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves the current utilization for an authorization
 * 
 * @param id - UUID of the authorization
 * @returns Promise resolving to the current utilization information
 */
async function getUtilization(id: UUID): Promise<AuthorizationUtilization> {
  try {
    // Check if authorization exists
    const existingAuth = await findById(id);
    if (!existingAuth) {
      throw new NotFoundError('Authorization not found', 'authorization', id);
    }
    
    // Get utilization record
    const utilization = await db.query(async (knex) => {
      return await knex('authorization_utilization')
        .where('authorization_id', id)
        .select('used_units')
        .first();
    });
    
    const usedUnits = utilization ? utilization.used_units : 0;
    const remainingUnits = existingAuth.authorizedUnits - usedUnits;
    const utilizationPercentage = existingAuth.authorizedUnits > 0 
      ? (usedUnits / existingAuth.authorizedUnits) * 100 
      : 0;
    
    return {
      usedUnits,
      remainingUnits,
      utilizationPercentage
    };
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error getting authorization utilization', {
      operation: 'getUtilization',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Validates if a service meets the requirements of an authorization
 * 
 * @param service - Service object to validate
 * @param authorizationId - UUID of the authorization to validate against
 * @returns Promise resolving to a validation result object
 */
async function validateServiceAgainstAuthorization(
  service: {
    clientId: UUID;
    serviceTypeId: UUID;
    serviceDate: ISO8601Date;
    units: Units;
  },
  authorizationId: UUID
): Promise<AuthorizationValidationResult> {
  try {
    // Retrieve the authorization
    const authorization = await findById(authorizationId);
    if (!authorization) {
      return {
        isValid: false,
        errors: [{
          field: 'authorizationId',
          message: 'Authorization not found',
          code: 'AUTHORIZATION_NOT_FOUND'
        }],
        warnings: []
      };
    }
    
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];
    
    // Check if service date is within authorization date range
    const serviceDate = new Date(service.serviceDate);
    const startDate = new Date(authorization.startDate);
    const endDate = authorization.endDate ? new Date(authorization.endDate) : null;
    
    if (serviceDate < startDate) {
      errors.push({
        field: 'serviceDate',
        message: 'Service date is before authorization start date',
        code: 'SERVICE_DATE_BEFORE_AUTH_START'
      });
    }
    
    if (endDate && serviceDate > endDate) {
      errors.push({
        field: 'serviceDate',
        message: 'Service date is after authorization end date',
        code: 'SERVICE_DATE_AFTER_AUTH_END'
      });
    }
    
    // Check if service type is included in authorization
    const serviceTypeIds = authorization.serviceTypes.map(st => st.id);
    if (!serviceTypeIds.includes(service.serviceTypeId)) {
      errors.push({
        field: 'serviceTypeId',
        message: 'Service type is not included in authorization',
        code: 'SERVICE_TYPE_NOT_AUTHORIZED'
      });
    }
    
    // Check if adding service units would exceed authorized units
    const utilization = await getUtilization(authorizationId);
    const totalUnits = utilization.usedUnits + service.units;
    
    if (totalUnits > authorization.authorizedUnits) {
      errors.push({
        field: 'units',
        message: 'Service units would exceed authorized units',
        code: 'EXCEEDS_AUTHORIZED_UNITS'
      });
    } else if (totalUnits > authorization.authorizedUnits * 0.9) {
      warnings.push({
        field: 'units',
        message: 'Service will use 90% or more of authorized units',
        code: 'APPROACHING_AUTHORIZED_LIMIT'
      });
    }
    
    // Check if client matches
    if (service.clientId !== authorization.clientId) {
      errors.push({
        field: 'clientId',
        message: 'Service client does not match authorization client',
        code: 'CLIENT_MISMATCH'
      });
    }
    
    // Check authorization status
    if (authorization.status !== AuthorizationStatus.ACTIVE && authorization.status !== AuthorizationStatus.EXPIRING) {
      warnings.push({
        field: 'status',
        message: `Authorization status is ${authorization.status}, not ACTIVE`,
        code: 'AUTHORIZATION_NOT_ACTIVE'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error validating service against authorization', {
      operation: 'validateServiceAgainstAuthorization',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Checks for overlapping authorizations for the same client and service types
 * 
 * @param clientId - UUID of the client
 * @param serviceTypeIds - Array of service type UUIDs
 * @param dateRange - Date range to check for overlap
 * @param excludeAuthId - Authorization ID to exclude from the check (for updates)
 * @returns Promise resolving to true if overlapping authorizations exist
 */
async function checkOverlappingAuthorizations(
  clientId: UUID,
  serviceTypeIds: UUID[],
  dateRange: DateRange,
  excludeAuthId: UUID
): Promise<boolean> {
  try {
    if (!serviceTypeIds || serviceTypeIds.length === 0) {
      return false;
    }
    
    return await db.query(async (knex) => {
      // Build a query to find overlapping authorizations
      let query = knex('authorizations as a')
        .join('authorization_service_types as ast', 'a.id', '=', 'ast.authorization_id')
        .where('a.client_id', clientId)
        .whereIn('ast.service_type_id', serviceTypeIds)
        .whereIn('a.status', [
          AuthorizationStatus.ACTIVE,
          AuthorizationStatus.APPROVED,
          AuthorizationStatus.EXPIRING
        ])
        .whereNot('a.status', AuthorizationStatus.CANCELLED);
      
      // Add date range overlap condition
      query = query.where(function() {
        this.where(function() {
          // startA <= endB AND endA >= startB
          this.where('a.start_date', '<=', dateRange.endDate);
          if (dateRange.startDate) {
            this.where(function() {
              this.where('a.end_date', '>=', dateRange.startDate)
                .orWhereNull('a.end_date');
            });
          }
        });
      });
      
      // Exclude the current authorization if updating
      if (excludeAuthId) {
        query = query.whereNot('a.id', excludeAuthId);
      }
      
      // Count overlapping authorizations
      const result = await query
        .countDistinct('a.id as count')
        .first();
      
      return parseInt(result.count) > 0;
    });
  } catch (error) {
    throw new DatabaseError('Error checking overlapping authorizations', {
      operation: 'checkOverlappingAuthorizations',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Marks an authorization as deleted (soft delete)
 * 
 * @param id - UUID of the authorization to delete
 * @param updatedBy - UUID of the user deleting the authorization
 * @returns Promise resolving to true if authorization was deleted successfully
 */
async function delete_(
  id: UUID,
  updatedBy: UUID | null
): Promise<boolean> {
  try {
    // Check if authorization exists
    const existingAuth = await findById(id);
    if (!existingAuth) {
      throw new NotFoundError('Authorization not found', 'authorization', id);
    }
    
    // Check if authorization can be deleted (no associated services)
    const hasServices = await db.query(async (knex) => {
      const result = await knex('services')
        .where('authorization_id', id)
        .whereNot('billing_status', 'VOID')
        .count('id as count')
        .first();
      
      return parseInt(result.count) > 0;
    });
    
    if (hasServices) {
      throw new BusinessError(
        'Cannot delete authorization with associated services',
        { authorizationId: id },
        'AUTHORIZATION_HAS_SERVICES'
      );
    }
    
    // Set status to CANCELLED (soft delete)
    const now = new Date().toISOString();
    await db.query(async (knex) => {
      await knex('authorizations')
        .where('id', id)
        .update({
          status: AuthorizationStatus.CANCELLED,
          updated_at: now,
          updated_by: updatedBy
        });
    });
    
    return true;
  } catch (error) {
    // If the error is already one of our application errors, rethrow it
    if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Otherwise, wrap it in a DatabaseError
    throw new DatabaseError('Error deleting authorization', {
      operation: 'delete',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Authorization Model class for managing authorization data
 */
export class AuthorizationModel {
  /** Name of the authorizations table in the database */
  private tableName: string;
  
  /** Name of the authorization_service_types table in the database */
  private authServiceTypesTableName: string;
  
  /** Name of the authorization_utilization table in the database */
  private utilizationTableName: string;
  
  /**
   * Creates a new AuthorizationModel instance
   */
  constructor() {
    this.tableName = 'authorizations';
    this.authServiceTypesTableName = 'authorization_service_types';
    this.utilizationTableName = 'authorization_utilization';
  }
  
  /**
   * Converts a database record to an Authorization object
   * 
   * @param dbRecord - Database record to convert
   * @returns Authorization object
   */
  public fromDb(dbRecord: Record<string, any>): Authorization {
    return mapDbToAuthorization(dbRecord);
  }
  
  /**
   * Converts an Authorization object to a database record
   * 
   * @param authorization - Authorization object to convert
   * @returns Database record
   */
  public toDb(authorization: Authorization): Record<string, any> {
    return mapAuthorizationToDb(authorization);
  }
  
  /**
   * Finds an authorization by ID
   * 
   * @param id - UUID of the authorization to find
   * @returns Promise resolving to the authorization with relations or null if not found
   */
  public async findById(id: UUID): Promise<AuthorizationWithRelations | null> {
    return findById(id);
  }
  
  /**
   * Finds an authorization by authorization number
   * 
   * @param authNumber - Authorization number to search for
   * @returns Promise resolving to the authorization with relations or null if not found
   */
  public async findByAuthNumber(authNumber: string): Promise<AuthorizationWithRelations | null> {
    return findByAuthNumber(authNumber);
  }
  
  /**
   * Finds authorizations for a client
   * 
   * @param clientId - UUID of the client
   * @param params - Optional parameters for filtering, pagination, etc.
   * @returns Promise resolving to an object containing the list of authorizations and total count
   */
  public async findByClientId(
    clientId: UUID, 
    params: {
      status?: AuthorizationStatus,
      dateRange?: DateRange,
      serviceTypeId?: UUID,
      page?: number,
      limit?: number
    } = {}
  ): Promise<{ authorizations: AuthorizationWithRelations[], total: number }> {
    return findByClientId(clientId, params);
  }
  
  /**
   * Finds active authorizations for a client
   * 
   * @param clientId - UUID of the client
   * @returns Promise resolving to a list of active authorizations with relations
   */
  public async findActiveByClientId(clientId: UUID): Promise<AuthorizationWithRelations[]> {
    return findActiveByClientId(clientId);
  }
  
  /**
   * Finds authorizations that are expiring within a specified number of days
   * 
   * @param daysThreshold - Number of days threshold for expiration
   * @returns Promise resolving to a list of expiring authorizations
   */
  public async findExpiringAuthorizations(daysThreshold: number): Promise<AuthorizationWithRelations[]> {
    return findExpiringAuthorizations(daysThreshold);
  }
  
  /**
   * Creates a new authorization
   * 
   * @param authorizationData - Data for the new authorization
   * @param createdBy - UUID of the user creating the authorization
   * @returns Promise resolving to the newly created authorization with relations
   */
  public async create(
    authorizationData: Omit<Authorization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'utilization'>,
    createdBy: UUID | null
  ): Promise<AuthorizationWithRelations> {
    return create(authorizationData, createdBy);
  }
  
  /**
   * Updates an existing authorization
   * 
   * @param id - UUID of the authorization to update
   * @param authorizationData - Data to update the authorization with
   * @param updatedBy - UUID of the user updating the authorization
   * @returns Promise resolving to the updated authorization with relations
   */
  public async update(
    id: UUID,
    authorizationData: Partial<Omit<Authorization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'utilization'>>,
    updatedBy: UUID | null
  ): Promise<AuthorizationWithRelations> {
    return update(id, authorizationData, updatedBy);
  }
  
  /**
   * Updates an authorization's status
   * 
   * @param id - UUID of the authorization to update
   * @param status - New status for the authorization
   * @param updatedBy - UUID of the user updating the authorization
   * @returns Promise resolving to the updated authorization with relations
   */
  public async updateStatus(
    id: UUID,
    status: AuthorizationStatus,
    updatedBy: UUID | null
  ): Promise<AuthorizationWithRelations> {
    return updateStatus(id, status, updatedBy);
  }
  
  /**
   * Updates the utilization tracking for an authorization
   * 
   * @param id - UUID of the authorization to update
   * @param units - Units to add or subtract
   * @param isAddition - True if adding units, false if subtracting
   * @param updatedBy - UUID of the user updating the utilization
   * @returns Promise resolving to the updated utilization information
   */
  public async trackUtilization(
    id: UUID,
    units: Units,
    isAddition: boolean,
    updatedBy: UUID | null
  ): Promise<AuthorizationUtilization> {
    return trackUtilization(id, units, isAddition, updatedBy);
  }
  
  /**
   * Retrieves the current utilization for an authorization
   * 
   * @param id - UUID of the authorization
   * @returns Promise resolving to the current utilization information
   */
  public async getUtilization(id: UUID): Promise<AuthorizationUtilization> {
    return getUtilization(id);
  }
  
  /**
   * Validates if a service meets the requirements of an authorization
   * 
   * @param service - Service object to validate
   * @param authorizationId - UUID of the authorization to validate against
   * @returns Promise resolving to a validation result object
   */
  public async validateServiceAgainstAuthorization(
    service: {
      clientId: UUID;
      serviceTypeId: UUID;
      serviceDate: ISO8601Date;
      units: Units;
    },
    authorizationId: UUID
  ): Promise<AuthorizationValidationResult> {
    return validateServiceAgainstAuthorization(service, authorizationId);
  }
  
  /**
   * Checks for overlapping authorizations for the same client and service types
   * 
   * @param clientId - UUID of the client
   * @param serviceTypeIds - Array of service type UUIDs
   * @param dateRange - Date range to check for overlap
   * @param excludeAuthId - Authorization ID to exclude from the check (for updates)
   * @returns Promise resolving to true if overlapping authorizations exist
   */
  public async checkOverlappingAuthorizations(
    clientId: UUID,
    serviceTypeIds: UUID[],
    dateRange: DateRange,
    excludeAuthId: UUID = ''
  ): Promise<boolean> {
    return checkOverlappingAuthorizations(clientId, serviceTypeIds, dateRange, excludeAuthId);
  }
  
  /**
   * Marks an authorization as deleted (soft delete)
   * 
   * @param id - UUID of the authorization to delete
   * @param updatedBy - UUID of the user deleting the authorization
   * @returns Promise resolving to true if authorization was deleted successfully
   */
  public async delete(id: UUID, updatedBy: UUID | null): Promise<boolean> {
    return delete_(id, updatedBy);
  }
}

// Create and export an instance of the AuthorizationModel
export default new AuthorizationModel();