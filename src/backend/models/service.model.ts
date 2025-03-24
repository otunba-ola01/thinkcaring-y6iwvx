import { 
  UUID, 
  ISO8601Date, 
  Money, 
  Units, 
  AuditableEntity, 
  StatusType, 
  DateRange 
} from '../types/common.types';

import { 
  Service, 
  ServiceWithRelations, 
  ServiceSummary, 
  DocumentationStatus, 
  BillingStatus, 
  ServiceType, 
  CreateServiceDto, 
  UpdateServiceDto, 
  UpdateServiceBillingStatusDto, 
  UpdateServiceDocumentationStatusDto, 
  ServiceQueryParams, 
  ServiceValidationResult 
} from '../types/services.types';

import { Authorization } from '../types/services.types';
import { v4 as uuidv4 } from 'uuid'; // uuid 9.0.0
import db from '../database/connection';
import { DatabaseError } from '../errors/database-error';
import { NotFoundError } from '../errors/not-found-error';
import { BusinessError } from '../errors/business-error';
import ClientModel from './client.model';

/**
 * Maps a database record to a Service object
 * Converts snake_case database fields to camelCase object properties
 * 
 * @param dbRecord - Database record with snake_case field names
 * @returns Fully mapped Service object
 */
export function mapDbToService(dbRecord: Record<string, any>): Service {
  // Convert dates to ISO format if needed
  const serviceDate = dbRecord.service_date ? 
    new Date(dbRecord.service_date).toISOString() : null;
  
  const createdAt = dbRecord.created_at ? 
    new Date(dbRecord.created_at).toISOString() : null;
  
  const updatedAt = dbRecord.updated_at ? 
    new Date(dbRecord.updated_at).toISOString() : null;
  
  // Parse JSON fields if needed
  const documentIds = dbRecord.document_ids ? 
    (typeof dbRecord.document_ids === 'string' ? JSON.parse(dbRecord.document_ids) : dbRecord.document_ids) : [];
  
  // Map enum values
  const documentationStatus = dbRecord.documentation_status as DocumentationStatus;
  const billingStatus = dbRecord.billing_status as BillingStatus;
  const status = dbRecord.status as StatusType;
  
  // Create the service object
  const service: Service = {
    id: dbRecord.id,
    clientId: dbRecord.client_id,
    serviceTypeId: dbRecord.service_type_id,
    serviceCode: dbRecord.service_code,
    serviceDate,
    startTime: dbRecord.start_time || null,
    endTime: dbRecord.end_time || null,
    units: dbRecord.units,
    rate: dbRecord.rate,
    amount: dbRecord.amount,
    staffId: dbRecord.staff_id || null,
    facilityId: dbRecord.facility_id || null,
    programId: dbRecord.program_id,
    authorizationId: dbRecord.authorization_id || null,
    documentationStatus,
    billingStatus,
    claimId: dbRecord.claim_id || null,
    notes: dbRecord.notes || null,
    documentIds,
    status,
    createdAt,
    updatedAt,
    createdBy: dbRecord.created_by || null,
    updatedBy: dbRecord.updated_by || null
  };
  
  return service;
}

/**
 * Maps a Service object to a database record
 * Converts camelCase object properties to snake_case database fields
 * 
 * @param service - Service object to map to database format
 * @returns Database record ready for insertion/update
 */
export function mapServiceToDb(service: Service): Record<string, any> {
  // Convert dates to database format if needed
  const serviceDate = service.serviceDate ? 
    service.serviceDate : null;
  
  // Stringify JSON fields for database storage
  const documentIds = service.documentIds ? 
    (typeof service.documentIds === 'string' ? service.documentIds : JSON.stringify(service.documentIds)) : null;
  
  // Create the database record
  const dbRecord: Record<string, any> = {
    id: service.id,
    client_id: service.clientId,
    service_type_id: service.serviceTypeId,
    service_code: service.serviceCode,
    service_date: serviceDate,
    start_time: service.startTime,
    end_time: service.endTime,
    units: service.units,
    rate: service.rate,
    amount: service.amount,
    staff_id: service.staffId,
    facility_id: service.facilityId,
    program_id: service.programId,
    authorization_id: service.authorizationId,
    documentation_status: service.documentationStatus,
    billing_status: service.billingStatus,
    claim_id: service.claimId,
    notes: service.notes,
    document_ids: documentIds,
    status: service.status,
    created_at: service.createdAt,
    updated_at: service.updatedAt,
    created_by: service.createdBy,
    updated_by: service.updatedBy
  };
  
  return dbRecord;
}

/**
 * Retrieves a service by its unique identifier
 * 
 * @param id - Unique identifier of the service to retrieve
 * @returns The service with related entities if found, null otherwise
 */
async function findById(id: UUID): Promise<ServiceWithRelations | null> {
  try {
    const query = `
      SELECT s.*, 
             c.first_name as client_first_name, 
             c.last_name as client_last_name,
             c.medicaid_id as client_medicaid_id,
             st.id as service_type_id, 
             st.name as service_type_name,
             st.code as service_type_code,
             staff.id as staff_id, 
             staff.first_name as staff_first_name,
             staff.last_name as staff_last_name,
             staff.title as staff_title,
             f.id as facility_id, 
             f.name as facility_name,
             f.type as facility_type,
             p.id as program_id, 
             p.name as program_name,
             p.code as program_code,
             a.id as auth_id, 
             a.number as auth_number,
             a.start_date as auth_start_date,
             a.end_date as auth_end_date,
             a.authorized_units as auth_authorized_units,
             a.used_units as auth_used_units,
             cl.id as claim_id, 
             cl.claim_number as claim_number,
             cl.status as claim_status
      FROM services s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN service_types st ON s.service_type_id = st.id
      LEFT JOIN staff ON s.staff_id = staff.id
      LEFT JOIN facilities f ON s.facility_id = f.id
      LEFT JOIN programs p ON s.program_id = p.id
      LEFT JOIN authorizations a ON s.authorization_id = a.id
      LEFT JOIN claims cl ON s.claim_id = cl.id
      WHERE s.id = ? AND s.status != 'deleted'
    `;
    
    const result = await db.query(async (conn) => {
      return await conn.raw(query, [id]);
    });
    
    const rows = result.rows || [];
    if (rows.length === 0) {
      return null;
    }
    
    const serviceData = rows[0];
    const service = mapDbToService(serviceData);
    
    // Fetch documents associated with this service
    const documentsQuery = `
      SELECT d.id, d.file_name, d.file_size, d.mime_type
      FROM service_documents sd
      JOIN documents d ON sd.document_id = d.id
      WHERE sd.service_id = ?
    `;
    
    const documentsResult = await db.query(async (conn) => {
      return await conn.raw(documentsQuery, [id]);
    });
    
    const documents = (documentsResult.rows || []).map((doc: any) => ({
      id: doc.id,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      mimeType: doc.mime_type
    }));
    
    // Construct the service with relations
    const serviceWithRelations: ServiceWithRelations = {
      ...service,
      client: {
        id: serviceData.client_id,
        firstName: serviceData.client_first_name,
        lastName: serviceData.client_last_name,
        medicaidId: serviceData.client_medicaid_id
      },
      serviceType: {
        id: serviceData.service_type_id,
        name: serviceData.service_type_name,
        code: serviceData.service_type_code
      },
      staff: serviceData.staff_id ? {
        id: serviceData.staff_id,
        firstName: serviceData.staff_first_name,
        lastName: serviceData.staff_last_name,
        title: serviceData.staff_title
      } : null,
      facility: serviceData.facility_id ? {
        id: serviceData.facility_id,
        name: serviceData.facility_name,
        type: serviceData.facility_type
      } : null,
      program: {
        id: serviceData.program_id,
        name: serviceData.program_name,
        code: serviceData.program_code
      },
      authorization: serviceData.auth_id ? {
        id: serviceData.auth_id,
        number: serviceData.auth_number,
        startDate: new Date(serviceData.auth_start_date).toISOString(),
        endDate: new Date(serviceData.auth_end_date).toISOString(),
        authorizedUnits: serviceData.auth_authorized_units,
        usedUnits: serviceData.auth_used_units
      } : null,
      claim: serviceData.claim_id ? {
        id: serviceData.claim_id,
        claimNumber: serviceData.claim_number,
        status: serviceData.claim_status
      } : null,
      documents
    };
    
    return serviceWithRelations;
  } catch (error) {
    throw new DatabaseError(`Error retrieving service with ID ${id}`, {
      operation: 'findById',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves services for a specific client
 * 
 * @param clientId - Client identifier to filter services by
 * @param params - Query parameters for filtering and pagination
 * @returns List of client services and total count
 */
async function findByClientId(clientId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  // Modify the params to include clientId filter
  const clientParams: ServiceQueryParams = {
    ...params,
    clientId
  };
  
  // Delegate to findAll with the client filter
  return await findAll(clientParams);
}

/**
 * Retrieves services associated with a specific authorization
 * 
 * @param authorizationId - Authorization identifier to filter services by
 * @param params - Query parameters for filtering and pagination
 * @returns List of services under the authorization and total count
 */
async function findByAuthorizationId(authorizationId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  // Modify the params to include authorizationId filter
  const authParams: ServiceQueryParams = {
    ...params,
    authorizationId
  };
  
  // Delegate to findAll with the authorization filter
  return await findAll(authParams);
}

/**
 * Retrieves services included in a specific claim
 * 
 * @param claimId - Claim identifier to filter services by
 * @param params - Query parameters for filtering and pagination
 * @returns List of services in the claim and total count
 */
async function findByClaimId(claimId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  // Modify the params to include claimId filter
  const claimParams: ServiceQueryParams = {
    ...params,
    claimId
  };
  
  // Delegate to findAll with the claim filter
  return await findAll(claimParams);
}

/**
 * Retrieves all services with optional filtering and pagination
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns List of services and total count
 */
async function findAll(params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
  try {
    // Extract pagination parameters
    const page = params.pagination?.page || 1;
    const limit = params.pagination?.limit || 10;
    const offset = (page - 1) * limit;
    
    // Build base query
    let query = `
      SELECT s.*, 
             c.first_name as client_first_name, 
             c.last_name as client_last_name,
             c.medicaid_id as client_medicaid_id,
             st.id as service_type_id, 
             st.name as service_type_name,
             st.code as service_type_code,
             staff.id as staff_id, 
             staff.first_name as staff_first_name,
             staff.last_name as staff_last_name,
             staff.title as staff_title,
             f.id as facility_id, 
             f.name as facility_name,
             f.type as facility_type,
             p.id as program_id, 
             p.name as program_name,
             p.code as program_code,
             a.id as auth_id, 
             a.number as auth_number,
             a.start_date as auth_start_date,
             a.end_date as auth_end_date,
             a.authorized_units as auth_authorized_units,
             a.used_units as auth_used_units,
             cl.id as claim_id, 
             cl.claim_number as claim_number,
             cl.status as claim_status
      FROM services s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN service_types st ON s.service_type_id = st.id
      LEFT JOIN staff ON s.staff_id = staff.id
      LEFT JOIN facilities f ON s.facility_id = f.id
      LEFT JOIN programs p ON s.program_id = p.id
      LEFT JOIN authorizations a ON s.authorization_id = a.id
      LEFT JOIN claims cl ON s.claim_id = cl.id
      WHERE s.status != 'deleted'
    `;
    
    // Add filters based on params
    const whereConditions = [];
    const queryParams = [];
    
    if (params.clientId) {
      whereConditions.push("s.client_id = ?");
      queryParams.push(params.clientId);
    }
    
    if (params.programId) {
      whereConditions.push("s.program_id = ?");
      queryParams.push(params.programId);
    }
    
    if (params.serviceTypeId) {
      whereConditions.push("s.service_type_id = ?");
      queryParams.push(params.serviceTypeId);
    }
    
    if (params.status) {
      whereConditions.push("s.status = ?");
      queryParams.push(params.status);
    }
    
    if (params.documentationStatus) {
      whereConditions.push("s.documentation_status = ?");
      queryParams.push(params.documentationStatus);
    }
    
    if (params.billingStatus) {
      whereConditions.push("s.billing_status = ?");
      queryParams.push(params.billingStatus);
    }
    
    if (params.dateRange) {
      whereConditions.push("s.service_date BETWEEN ? AND ?");
      queryParams.push(params.dateRange.startDate, params.dateRange.endDate);
    }
    
    if (params.search) {
      whereConditions.push("(c.first_name LIKE ? OR c.last_name LIKE ? OR s.service_code LIKE ?)");
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add WHERE conditions to query
    if (whereConditions.length > 0) {
      query += ` AND ${whereConditions.join(" AND ")}`;
    }
    
    // Add sorting
    const sortField = params.sort?.sortBy || 'service_date';
    const sortDirection = params.sort?.sortDirection || 'desc';
    query += ` ORDER BY s.${sortField} ${sortDirection}`;
    
    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    // Execute query
    const result = await db.query(async (conn) => {
      return await conn.raw(query, queryParams);
    });
    
    // Execute count query to get total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      WHERE s.status != 'deleted'
    `;
    
    if (whereConditions.length > 0) {
      countQuery += ` AND ${whereConditions.join(" AND ")}`;
    }
    
    const countResult = await db.query(async (conn) => {
      return await conn.raw(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
    });
    
    const total = parseInt(countResult.rows[0].total);
    
    // Process results
    const rows = result.rows || [];
    const services: ServiceWithRelations[] = [];
    
    for (const row of rows) {
      const service = mapDbToService(row);
      
      // Fetch documents for this service
      const documentsQuery = `
        SELECT d.id, d.file_name, d.file_size, d.mime_type
        FROM service_documents sd
        JOIN documents d ON sd.document_id = d.id
        WHERE sd.service_id = ?
      `;
      
      const documentsResult = await db.query(async (conn) => {
        return await conn.raw(documentsQuery, [row.id]);
      });
      
      const documents = (documentsResult.rows || []).map((doc: any) => ({
        id: doc.id,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type
      }));
      
      // Construct service with relations
      const serviceWithRelations: ServiceWithRelations = {
        ...service,
        client: {
          id: row.client_id,
          firstName: row.client_first_name,
          lastName: row.client_last_name,
          medicaidId: row.client_medicaid_id
        },
        serviceType: {
          id: row.service_type_id,
          name: row.service_type_name,
          code: row.service_type_code
        },
        staff: row.staff_id ? {
          id: row.staff_id,
          firstName: row.staff_first_name,
          lastName: row.staff_last_name,
          title: row.staff_title
        } : null,
        facility: row.facility_id ? {
          id: row.facility_id,
          name: row.facility_name,
          type: row.facility_type
        } : null,
        program: {
          id: row.program_id,
          name: row.program_name,
          code: row.program_code
        },
        authorization: row.auth_id ? {
          id: row.auth_id,
          number: row.auth_number,
          startDate: new Date(row.auth_start_date).toISOString(),
          endDate: new Date(row.auth_end_date).toISOString(),
          authorizedUnits: row.auth_authorized_units,
          usedUnits: row.auth_used_units
        } : null,
        claim: row.claim_id ? {
          id: row.claim_id,
          claimNumber: row.claim_number,
          status: row.claim_status
        } : null,
        documents
      };
      
      services.push(serviceWithRelations);
    }
    
    return { services, total };
  } catch (error) {
    throw new DatabaseError('Error retrieving services', {
      operation: 'findAll',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves authorization information for validation and utilization tracking
 * 
 * @param authorizationId - Authorization identifier
 * @returns Authorization details if found
 */
async function getAuthorizationById(authorizationId: UUID): Promise<Authorization | null> {
  try {
    const query = `
      SELECT a.id, a.client_id, a.program_id, a.service_type_id, 
             a.number, a.start_date, a.end_date, 
             a.authorized_units, a.used_units, a.units_measure,
             a.status, a.payer_id
      FROM authorizations a
      WHERE a.id = ? AND a.status != 'deleted'
    `;
    
    const result = await db.query(async (conn) => {
      return await conn.raw(query, [authorizationId]);
    });
    
    const rows = result.rows || [];
    if (rows.length === 0) {
      return null;
    }
    
    const authData = rows[0];
    const authorization: Authorization = {
      id: authData.id,
      clientId: authData.client_id,
      programId: authData.program_id,
      serviceTypeId: authData.service_type_id,
      number: authData.number,
      startDate: new Date(authData.start_date).toISOString(),
      endDate: new Date(authData.end_date).toISOString(),
      authorizedUnits: authData.authorized_units,
      usedUnits: authData.used_units,
      unitsMeasure: authData.units_measure,
      status: authData.status,
      payerId: authData.payer_id
    };
    
    return authorization;
  } catch (error) {
    throw new DatabaseError(`Error retrieving authorization with ID ${authorizationId}`, {
      operation: 'getAuthorizationById',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Internal function to validate if a service meets authorization requirements
 * 
 * @param service - Service to validate
 * @param authorization - Authorization to validate against
 * @returns Validation results
 */
async function validateServiceAgainstAuthorizationInternal(
  service: Service, 
  authorization: Authorization
): Promise<{ isValid: boolean, errors: string[], warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if service date is within authorization date range
  const serviceDate = new Date(service.serviceDate);
  const authStartDate = new Date(authorization.startDate);
  const authEndDate = new Date(authorization.endDate);
  
  if (serviceDate < authStartDate || serviceDate > authEndDate) {
    errors.push(`Service date ${service.serviceDate} is outside the authorization period (${authorization.startDate} to ${authorization.endDate})`);
  }
  
  // Check if service type matches authorized service type
  if (service.serviceTypeId !== authorization.serviceTypeId) {
    errors.push('Service type does not match the authorized service type');
  }
  
  // Check if there are enough units remaining in the authorization
  const remainingUnits = authorization.authorizedUnits - authorization.usedUnits;
  if (service.units > remainingUnits) {
    errors.push(`Service units (${service.units}) exceed the remaining authorized units (${remainingUnits})`);
  } else if (remainingUnits - service.units < 10) {
    warnings.push(`Only ${remainingUnits - service.units} units will remain after this service`);
  }
  
  // Check if the client matches
  if (service.clientId !== authorization.clientId) {
    errors.push('Service client does not match the authorization client');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Internal function to update authorization utilization with service units
 * 
 * @param authorizationId - Authorization to update
 * @param units - Units to add or subtract
 * @param isAddition - Whether to add (true) or subtract (false) units
 */
async function trackUtilizationInternal(
  authorizationId: UUID, 
  units: Units, 
  isAddition: boolean
): Promise<void> {
  try {
    // Get current authorization to calculate new utilization
    const query = `
      SELECT used_units, authorized_units
      FROM authorizations
      WHERE id = ?
    `;
    
    const result = await db.query(async (conn) => {
      return await conn.raw(query, [authorizationId]);
    });
    
    if (!result.rows || result.rows.length === 0) {
      throw new NotFoundError('Authorization not found', 'authorization', authorizationId);
    }
    
    const currentUsed = result.rows[0].used_units;
    const authorizedUnits = result.rows[0].authorized_units;
    
    // Calculate new utilization
    let newUsed = isAddition ? currentUsed + units : currentUsed - units;
    
    // Ensure we don't go below zero
    if (newUsed < 0) newUsed = 0;
    
    // Update the authorization
    const updateQuery = `
      UPDATE authorizations
      SET used_units = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    
    await db.query(async (conn) => {
      return await conn.raw(updateQuery, [newUsed, authorizationId]);
    });
    
    // Check if utilization is approaching limit and create alert if needed
    const utilizationPercentage = (newUsed / authorizedUnits) * 100;
    if (utilizationPercentage >= 80 && utilizationPercentage < 90) {
      // Create warning alert (authorization approaching limit)
      // This would typically call an alert service or similar
      console.log(`WARNING: Authorization ${authorizationId} is at ${utilizationPercentage.toFixed(1)}% utilization`);
    } else if (utilizationPercentage >= 90) {
      // Create critical alert (authorization nearly exhausted)
      console.log(`CRITICAL: Authorization ${authorizationId} is at ${utilizationPercentage.toFixed(1)}% utilization`);
    }
  } catch (error) {
    throw new DatabaseError(`Error updating authorization utilization for ID ${authorizationId}`, {
      operation: 'trackUtilization',
      entity: 'authorization',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Creates a new service in the database
 * 
 * @param serviceData - Data for the new service
 * @param createdBy - User creating the service
 * @returns The newly created service
 */
async function create(serviceData: CreateServiceDto, createdBy: UUID | null = null): Promise<ServiceWithRelations> {
  let trx;
  
  try {
    // Start a transaction
    trx = await db.getTransaction();
    
    // Validate client exists
    const client = await ClientModel.findById(serviceData.clientId);
    if (!client) {
      throw new NotFoundError('Client not found', 'client', serviceData.clientId);
    }
    
    // Generate a new UUID for the service
    const serviceId = uuidv4();
    
    // Calculate amount based on units and rate
    const amount = serviceData.units * serviceData.rate;
    
    // Set default values
    const now = new Date().toISOString();
    
    // Create new service object
    const newService: Service = {
      id: serviceId,
      clientId: serviceData.clientId,
      serviceTypeId: serviceData.serviceTypeId,
      serviceCode: serviceData.serviceCode,
      serviceDate: serviceData.serviceDate,
      startTime: serviceData.startTime,
      endTime: serviceData.endTime,
      units: serviceData.units,
      rate: serviceData.rate,
      amount,
      staffId: serviceData.staffId,
      facilityId: serviceData.facilityId,
      programId: serviceData.programId,
      authorizationId: serviceData.authorizationId,
      documentationStatus: serviceData.documentationStatus,
      billingStatus: BillingStatus.UNBILLED,
      claimId: null,
      notes: serviceData.notes,
      documentIds: serviceData.documentIds || [],
      status: StatusType.ACTIVE,
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy,
      updatedBy: createdBy
    };
    
    // Validate service against authorization if provided
    let authorization: Authorization | null = null;
    if (serviceData.authorizationId) {
      authorization = await getAuthorizationById(serviceData.authorizationId);
      if (!authorization) {
        throw new NotFoundError('Authorization not found', 'authorization', serviceData.authorizationId);
      }
      
      // Validate service against authorization
      const validationResult = await validateServiceAgainstAuthorizationInternal(newService, authorization);
      if (!validationResult.isValid) {
        throw new BusinessError(
          'Service does not meet authorization requirements',
          { errors: validationResult.errors },
          'authorization-validation'
        );
      }
    }
    
    // Map service to database record
    const dbRecord = mapServiceToDb(newService);
    
    // Construct SQL query
    const fields = Object.keys(dbRecord).map(k => `"${k}"`).join(', ');
    const placeholders = Object.keys(dbRecord).map(() => '?').join(', ');
    const values = Object.values(dbRecord);
    
    const query = `
      INSERT INTO services (${fields})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    // Execute query
    const result = await trx.raw(query, values);
    
    // Create document associations if needed
    if (serviceData.documentIds && serviceData.documentIds.length > 0) {
      const documentValues = serviceData.documentIds.map(docId => {
        return `('${uuidv4()}', '${serviceId}', '${docId}', NOW(), '${createdBy || serviceId}')`;
      }).join(', ');
      
      const docQuery = `
        INSERT INTO service_documents (id, service_id, document_id, created_at, created_by)
        VALUES ${documentValues}
      `;
      
      await trx.raw(docQuery);
    }
    
    // Update authorization utilization if needed
    if (serviceData.authorizationId && authorization) {
      await trackUtilizationInternal(serviceData.authorizationId, serviceData.units, true);
    }
    
    // Commit the transaction
    await trx.commit();
    
    // Fetch the complete service with relations
    const createdService = await findById(serviceId);
    if (!createdService) {
      throw new DatabaseError('Failed to retrieve created service', {
        operation: 'create',
        entity: 'service'
      });
    }
    
    return createdService;
  } catch (error) {
    // Rollback the transaction if it exists
    if (trx) {
      await trx.rollback();
    }
    
    // Rethrow specific errors
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error;
    }
    
    // Wrap other errors
    throw new DatabaseError('Failed to create service', {
      operation: 'create',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Updates an existing service in the database
 * 
 * @param id - ID of the service to update
 * @param serviceData - Updated service data
 * @param updatedBy - User updating the service
 * @returns The updated service
 */
async function update(id: UUID, serviceData: UpdateServiceDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
  let trx;
  
  try {
    // Check if service exists
    const existingService = await findById(id);
    if (!existingService) {
      throw new NotFoundError('Service not found', 'service', id);
    }
    
    // Validate that service can be updated (not in a terminal state)
    if (existingService.billingStatus === BillingStatus.PAID || 
        existingService.billingStatus === BillingStatus.VOID) {
      throw new BusinessError(
        'Cannot update a service that has been paid or voided',
        { billingStatus: existingService.billingStatus },
        'service-update-restriction'
      );
    }
    
    // Start a transaction
    trx = await db.getTransaction();
    
    // Calculate amount if units or rate has changed
    let amount = existingService.amount;
    if (serviceData.units !== existingService.units || serviceData.rate !== existingService.rate) {
      amount = serviceData.units * serviceData.rate;
    }
    
    // Set updated timestamp
    const now = new Date().toISOString();
    
    // Create updated service object
    const updatedService: Service = {
      ...existingService,
      serviceTypeId: serviceData.serviceTypeId,
      serviceCode: serviceData.serviceCode,
      serviceDate: serviceData.serviceDate,
      startTime: serviceData.startTime,
      endTime: serviceData.endTime,
      units: serviceData.units,
      rate: serviceData.rate,
      amount,
      staffId: serviceData.staffId,
      facilityId: serviceData.facilityId,
      programId: serviceData.programId,
      authorizationId: serviceData.authorizationId,
      documentationStatus: serviceData.documentationStatus,
      billingStatus: serviceData.billingStatus,
      notes: serviceData.notes,
      documentIds: serviceData.documentIds || [],
      status: serviceData.status,
      updatedAt: now,
      updatedBy: updatedBy
    };
    
    // Check if authorization has changed
    const oldAuthId = existingService.authorizationId;
    const newAuthId = serviceData.authorizationId;
    
    // If the authorization has changed, we need to release utilization from old auth and update new auth
    let oldAuthorization: Authorization | null = null;
    let newAuthorization: Authorization | null = null;
    
    if (oldAuthId !== newAuthId) {
      // Release utilization from old authorization if it exists
      if (oldAuthId) {
        oldAuthorization = await getAuthorizationById(oldAuthId);
        if (oldAuthorization) {
          await trackUtilizationInternal(oldAuthId, existingService.units, false);
        }
      }
      
      // Validate against new authorization if provided
      if (newAuthId) {
        newAuthorization = await getAuthorizationById(newAuthId);
        if (!newAuthorization) {
          throw new NotFoundError('Authorization not found', 'authorization', newAuthId);
        }
        
        // Validate service against authorization
        const validationResult = await validateServiceAgainstAuthorizationInternal(updatedService, newAuthorization);
        if (!validationResult.isValid) {
          throw new BusinessError(
            'Service does not meet authorization requirements',
            { errors: validationResult.errors },
            'authorization-validation'
          );
        }
      }
    } else if (newAuthId && serviceData.units !== existingService.units) {
      // If authorization hasn't changed but units have, we need to update utilization
      newAuthorization = await getAuthorizationById(newAuthId);
      if (!newAuthorization) {
        throw new NotFoundError('Authorization not found', 'authorization', newAuthId);
      }
      
      // Adjust utilization by the difference in units
      const unitsDifference = serviceData.units - existingService.units;
      if (unitsDifference !== 0) {
        // Validate that there are enough units available if increasing
        if (unitsDifference > 0) {
          const remainingUnits = newAuthorization.authorizedUnits - newAuthorization.usedUnits;
          if (unitsDifference > remainingUnits) {
            throw new BusinessError(
              'Insufficient authorized units available',
              { 
                unitsRequested: unitsDifference,
                unitsAvailable: remainingUnits
              },
              'authorization-units-exceeded'
            );
          }
        }
        
        // Update authorization utilization
        await trackUtilizationInternal(newAuthId, Math.abs(unitsDifference), unitsDifference > 0);
      }
    }
    
    // Map service to database record
    const dbRecord = mapServiceToDb(updatedService);
    
    // Construct SQL query
    const updateFields = Object.keys(dbRecord)
      .filter(k => k !== 'id') // Don't update ID
      .map(k => `${k} = ?`)
      .join(', ');
    
    const values = Object.keys(dbRecord)
      .filter(k => k !== 'id')
      .map(k => dbRecord[k]);
    
    values.push(id); // Add ID for WHERE clause
    
    const query = `
      UPDATE services
      SET ${updateFields}
      WHERE id = ?
      RETURNING *
    `;
    
    // Execute query
    await trx.raw(query, values);
    
    // Update document associations if changed
    if (serviceData.documentIds) {
      // Delete existing associations
      await trx.raw(`DELETE FROM service_documents WHERE service_id = ?`, [id]);
      
      // Create new associations
      if (serviceData.documentIds.length > 0) {
        const documentValues = serviceData.documentIds.map(docId => {
          return `('${uuidv4()}', '${id}', '${docId}', NOW(), '${updatedBy || id}')`;
        }).join(', ');
        
        const docQuery = `
          INSERT INTO service_documents (id, service_id, document_id, created_at, created_by)
          VALUES ${documentValues}
        `;
        
        await trx.raw(docQuery);
      }
    }
    
    // Track utilization on new authorization if changed and not already handled
    if (newAuthId && oldAuthId !== newAuthId && !newAuthorization) {
      newAuthorization = await getAuthorizationById(newAuthId);
      if (newAuthorization) {
        await trackUtilizationInternal(newAuthId, updatedService.units, true);
      }
    }
    
    // Commit the transaction
    await trx.commit();
    
    // Fetch the complete updated service with relations
    const updatedServiceWithRelations = await findById(id);
    if (!updatedServiceWithRelations) {
      throw new DatabaseError('Failed to retrieve updated service', {
        operation: 'update',
        entity: 'service'
      });
    }
    
    return updatedServiceWithRelations;
  } catch (error) {
    // Rollback the transaction if it exists
    if (trx) {
      await trx.rollback();
    }
    
    // Rethrow specific errors
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error;
    }
    
    // Wrap other errors
    throw new DatabaseError('Failed to update service', {
      operation: 'update',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Updates a service's billing status
 * 
 * @param id - ID of the service to update
 * @param statusData - New billing status data
 * @param updatedBy - User updating the service
 * @returns The updated service
 */
async function updateBillingStatus(
  id: UUID, 
  statusData: UpdateServiceBillingStatusDto, 
  updatedBy: UUID | null = null
): Promise<ServiceWithRelations> {
  let trx;
  
  try {
    // Check if service exists
    const existingService = await findById(id);
    if (!existingService) {
      throw new NotFoundError('Service not found', 'service', id);
    }
    
    // Validate billing status transition
    const currentStatus = existingService.billingStatus;
    const newStatus = statusData.billingStatus;
    
    // Define valid transitions
    const validTransitions: { [key: string]: BillingStatus[] } = {
      [BillingStatus.UNBILLED]: [BillingStatus.READY_FOR_BILLING, BillingStatus.VOID],
      [BillingStatus.READY_FOR_BILLING]: [BillingStatus.UNBILLED, BillingStatus.IN_CLAIM, BillingStatus.VOID],
      [BillingStatus.IN_CLAIM]: [BillingStatus.BILLED, BillingStatus.READY_FOR_BILLING, BillingStatus.UNBILLED, BillingStatus.VOID],
      [BillingStatus.BILLED]: [BillingStatus.PAID, BillingStatus.DENIED, BillingStatus.VOID],
      [BillingStatus.DENIED]: [BillingStatus.READY_FOR_BILLING, BillingStatus.VOID],
      [BillingStatus.PAID]: [BillingStatus.VOID],
      [BillingStatus.VOID]: []
    };
    
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BusinessError(
        `Invalid billing status transition from ${currentStatus} to ${newStatus}`,
        { 
          currentStatus,
          newStatus,
          validTransitions: validTransitions[currentStatus]
        },
        'invalid-billing-status-transition'
      );
    }
    
    // Start a transaction
    trx = await db.getTransaction();
    
    // Set updated timestamp
    const now = new Date().toISOString();
    
    // Update billing status
    let query = `
      UPDATE services
      SET billing_status = ?,
          updated_at = ?,
          updated_by = ?
    `;
    
    const queryParams = [newStatus, now, updatedBy];
    
    // Update claim ID if provided or required
    if (statusData.claimId) {
      query += `, claim_id = ?`;
      queryParams.push(statusData.claimId);
    } else if (newStatus === BillingStatus.UNBILLED || newStatus === BillingStatus.VOID) {
      // Clear claim ID when reverting to unbilled or voiding
      query += `, claim_id = NULL`;
    }
    
    query += ` WHERE id = ?`;
    queryParams.push(id);
    
    // Execute query
    await trx.raw(query, queryParams);
    
    // Commit the transaction
    await trx.commit();
    
    // Fetch the complete updated service with relations
    const updatedService = await findById(id);
    if (!updatedService) {
      throw new DatabaseError('Failed to retrieve updated service', {
        operation: 'updateBillingStatus',
        entity: 'service'
      });
    }
    
    return updatedService;
  } catch (error) {
    // Rollback the transaction if it exists
    if (trx) {
      await trx.rollback();
    }
    
    // Rethrow specific errors
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error;
    }
    
    // Wrap other errors
    throw new DatabaseError('Failed to update service billing status', {
      operation: 'updateBillingStatus',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Updates a service's documentation status
 * 
 * @param id - ID of the service to update
 * @param statusData - New documentation status data
 * @param updatedBy - User updating the service
 * @returns The updated service
 */
async function updateDocumentationStatus(
  id: UUID, 
  statusData: UpdateServiceDocumentationStatusDto, 
  updatedBy: UUID | null = null
): Promise<ServiceWithRelations> {
  let trx;
  
  try {
    // Check if service exists
    const existingService = await findById(id);
    if (!existingService) {
      throw new NotFoundError('Service not found', 'service', id);
    }
    
    // Start a transaction
    trx = await db.getTransaction();
    
    // Set updated timestamp
    const now = new Date().toISOString();
    
    // Update documentation status
    const query = `
      UPDATE services
      SET documentation_status = ?,
          updated_at = ?,
          updated_by = ?
      WHERE id = ?
    `;
    
    await trx.raw(query, [
      statusData.documentationStatus,
      now,
      updatedBy,
      id
    ]);
    
    // Update document associations if provided
    if (statusData.documentIds) {
      // Delete existing associations
      await trx.raw(`DELETE FROM service_documents WHERE service_id = ?`, [id]);
      
      // Create new associations
      if (statusData.documentIds.length > 0) {
        const documentValues = statusData.documentIds.map(docId => {
          return `('${uuidv4()}', '${id}', '${docId}', NOW(), '${updatedBy || id}')`;
        }).join(', ');
        
        const docQuery = `
          INSERT INTO service_documents (id, service_id, document_id, created_at, created_by)
          VALUES ${documentValues}
        `;
        
        await trx.raw(docQuery);
      }
    }
    
    // Commit the transaction
    await trx.commit();
    
    // Fetch the complete updated service with relations
    const updatedService = await findById(id);
    if (!updatedService) {
      throw new DatabaseError('Failed to retrieve updated service', {
        operation: 'updateDocumentationStatus',
        entity: 'service'
      });
    }
    
    return updatedService;
  } catch (error) {
    // Rollback the transaction if it exists
    if (trx) {
      await trx.rollback();
    }
    
    // Rethrow specific errors
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error;
    }
    
    // Wrap other errors
    throw new DatabaseError('Failed to update service documentation status', {
      operation: 'updateDocumentationStatus',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Marks a service as deleted (soft delete)
 * 
 * @param id - ID of the service to delete
 * @param updatedBy - User deleting the service
 * @returns True if service was deleted successfully
 */
async function deleteService(id: UUID, updatedBy: UUID | null = null): Promise<boolean> {
  let trx;
  
  try {
    // Check if service exists
    const existingService = await findById(id);
    if (!existingService) {
      throw new NotFoundError('Service not found', 'service', id);
    }
    
    // Validate that service can be deleted (not in BILLED or PAID status)
    if (existingService.billingStatus === BillingStatus.BILLED || 
        existingService.billingStatus === BillingStatus.PAID) {
      throw new BusinessError(
        'Cannot delete a service that has been billed or paid',
        { billingStatus: existingService.billingStatus },
        'service-delete-restriction'
      );
    }
    
    // Start a transaction
    trx = await db.getTransaction();
    
    // Set updated timestamp
    const now = new Date().toISOString();
    
    // Update service to deleted status
    const query = `
      UPDATE services
      SET status = ?,
          updated_at = ?,
          updated_by = ?
      WHERE id = ?
    `;
    
    await trx.raw(query, [
      StatusType.DELETED,
      now,
      updatedBy,
      id
    ]);
    
    // If service had an authorization, release utilization
    if (existingService.authorizationId) {
      await trackUtilizationInternal(
        existingService.authorizationId,
        existingService.units,
        false
      );
    }
    
    // Commit the transaction
    await trx.commit();
    
    return true;
  } catch (error) {
    // Rollback the transaction if it exists
    if (trx) {
      await trx.rollback();
    }
    
    // Rethrow specific errors
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error;
    }
    
    // Wrap other errors
    throw new DatabaseError('Failed to delete service', {
      operation: 'delete',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Validates a service for billing readiness
 * 
 * @param id - ID of the service to validate
 * @returns Validation results for the service
 */
async function validateService(id: UUID): Promise<ServiceValidationResult> {
  try {
    // Check if service exists
    const service = await findById(id);
    if (!service) {
      throw new NotFoundError('Service not found', 'service', id);
    }
    
    // Initialize validation result
    const validationResult: ServiceValidationResult = {
      serviceId: id,
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Check if client is active and eligible
    // This would typically call a client validation function
    
    // Check if service has complete documentation
    if (service.documentationStatus !== DocumentationStatus.COMPLETE) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: 'INCOMPLETE_DOCUMENTATION',
        message: 'Service documentation is not complete',
        field: 'documentationStatus'
      });
    }
    
    // Check if service date is valid (not in future)
    const serviceDate = new Date(service.serviceDate);
    const today = new Date();
    if (serviceDate > today) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: 'FUTURE_SERVICE_DATE',
        message: 'Service date cannot be in the future',
        field: 'serviceDate'
      });
    }
    
    // Check if service has valid rate and units
    if (service.rate <= 0) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: 'INVALID_RATE',
        message: 'Service rate must be greater than zero',
        field: 'rate'
      });
    }
    
    if (service.units <= 0) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: 'INVALID_UNITS',
        message: 'Service units must be greater than zero',
        field: 'units'
      });
    }
    
    // If authorization exists, validate against it
    if (service.authorizationId) {
      const authorization = await getAuthorizationById(service.authorizationId);
      if (!authorization) {
        validationResult.isValid = false;
        validationResult.errors.push({
          code: 'AUTHORIZATION_NOT_FOUND',
          message: 'Referenced authorization not found',
          field: 'authorizationId'
        });
      } else {
        // Validate service against authorization
        const authValidation = await validateServiceAgainstAuthorizationInternal(service, authorization);
        if (!authValidation.isValid) {
          validationResult.isValid = false;
          
          // Add each error from authorization validation
          authValidation.errors.forEach(error => {
            validationResult.errors.push({
              code: 'AUTHORIZATION_VALIDATION',
              message: error,
              field: 'authorizationId'
            });
          });
        }
        
        // Add warnings from authorization validation
        authValidation.warnings.forEach(warning => {
          validationResult.warnings.push({
            code: 'AUTHORIZATION_WARNING',
            message: warning,
            field: 'authorizationId'
          });
        });
      }
    }
    
    // Check if service is within timely filing period
    const serviceTimestamp = new Date(service.serviceDate).getTime();
    const currentTimestamp = new Date().getTime();
    const daysDifference = Math.floor((currentTimestamp - serviceTimestamp) / (1000 * 60 * 60 * 24));
    
    // Most payers require filing within 365 days
    const timelyFilingLimit = 365;
    
    if (daysDifference > timelyFilingLimit) {
      validationResult.isValid = false;
      validationResult.errors.push({
        code: 'TIMELY_FILING_EXCEEDED',
        message: `Service date exceeds timely filing limit of ${timelyFilingLimit} days`,
        field: 'serviceDate'
      });
    } else if (daysDifference > (timelyFilingLimit - 30)) {
      // Warning if approaching timely filing limit
      validationResult.warnings.push({
        code: 'APPROACHING_TIMELY_FILING',
        message: `Service is approaching timely filing limit (${timelyFilingLimit - daysDifference} days remaining)`,
        field: 'serviceDate'
      });
    }
    
    // If service is valid for billing and not already marked as ready, update status
    if (validationResult.isValid && service.billingStatus === BillingStatus.UNBILLED) {
      await updateBillingStatus(
        id,
        { billingStatus: BillingStatus.READY_FOR_BILLING, claimId: null },
        null
      );
    }
    
    return validationResult;
  } catch (error) {
    // Rethrow specific errors
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      throw error;
    }
    
    // Wrap other errors
    throw new DatabaseError('Failed to validate service', {
      operation: 'validateService',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Validates multiple services for billing readiness
 * 
 * @param serviceIds - IDs of the services to validate
 * @returns Batch validation results
 */
async function validateServices(
  serviceIds: UUID[]
): Promise<{ 
  results: ServiceValidationResult[], 
  isValid: boolean, 
  totalErrors: number, 
  totalWarnings: number
}> {
  try {
    // Initialize results
    const results: ServiceValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    
    // Validate each service
    for (const serviceId of serviceIds) {
      try {
        const validationResult = await validateService(serviceId);
        results.push(validationResult);
        
        totalErrors += validationResult.errors.length;
        totalWarnings += validationResult.warnings.length;
      } catch (error) {
        // If service not found or other error, add to results
        results.push({
          serviceId,
          isValid: false,
          errors: [{
            code: error instanceof NotFoundError ? 'SERVICE_NOT_FOUND' : 'VALIDATION_ERROR',
            message: error.message,
            field: null
          }],
          warnings: []
        });
        
        totalErrors += 1;
      }
    }
    
    // Calculate overall validity
    const isValid = totalErrors === 0;
    
    return {
      results,
      isValid,
      totalErrors,
      totalWarnings
    };
  } catch (error) {
    throw new DatabaseError('Failed to validate services batch', {
      operation: 'validateServices',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves summarized service information for lists and dashboards
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns List of service summaries and total count
 */
async function getServiceSummaries(
  params: ServiceQueryParams
): Promise<{ services: ServiceSummary[], total: number }> {
  try {
    // Extract pagination parameters
    const page = params.pagination?.page || 1;
    const limit = params.pagination?.limit || 10;
    const offset = (page - 1) * limit;
    
    // Build base query
    let query = `
      SELECT 
        s.id, 
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        st.name as service_type,
        s.service_date,
        s.units,
        s.amount,
        s.documentation_status,
        s.billing_status,
        p.name as program_name
      FROM services s
      JOIN clients c ON s.client_id = c.id
      JOIN service_types st ON s.service_type_id = st.id
      JOIN programs p ON s.program_id = p.id
      WHERE s.status != 'deleted'
    `;
    
    // Add filters based on params
    const whereConditions = [];
    const queryParams = [];
    
    if (params.clientId) {
      whereConditions.push("s.client_id = ?");
      queryParams.push(params.clientId);
    }
    
    if (params.programId) {
      whereConditions.push("s.program_id = ?");
      queryParams.push(params.programId);
    }
    
    if (params.serviceTypeId) {
      whereConditions.push("s.service_type_id = ?");
      queryParams.push(params.serviceTypeId);
    }
    
    if (params.documentationStatus) {
      whereConditions.push("s.documentation_status = ?");
      queryParams.push(params.documentationStatus);
    }
    
    if (params.billingStatus) {
      whereConditions.push("s.billing_status = ?");
      queryParams.push(params.billingStatus);
    }
    
    if (params.dateRange) {
      whereConditions.push("s.service_date BETWEEN ? AND ?");
      queryParams.push(params.dateRange.startDate, params.dateRange.endDate);
    }
    
    if (params.search) {
      whereConditions.push("(c.first_name LIKE ? OR c.last_name LIKE ? OR s.service_code LIKE ?)");
      const searchTerm = `%${params.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add WHERE conditions to query
    if (whereConditions.length > 0) {
      query += ` AND ${whereConditions.join(" AND ")}`;
    }
    
    // Add sorting
    const sortField = params.sort?.sortBy || 'service_date';
    const sortDirection = params.sort?.sortDirection || 'desc';
    query += ` ORDER BY s.${sortField} ${sortDirection}`;
    
    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    // Execute query
    const result = await db.query(async (conn) => {
      return await conn.raw(query, queryParams);
    });
    
    // Execute count query to get total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      JOIN clients c ON s.client_id = c.id
      JOIN service_types st ON s.service_type_id = st.id
      JOIN programs p ON s.program_id = p.id
      WHERE s.status != 'deleted'
    `;
    
    if (whereConditions.length > 0) {
      countQuery += ` AND ${whereConditions.join(" AND ")}`;
    }
    
    const countResult = await db.query(async (conn) => {
      return await conn.raw(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
    });
    
    const total = parseInt(countResult.rows[0].total);
    
    // Process results
    const rows = result.rows || [];
    const services: ServiceSummary[] = rows.map(row => ({
      id: row.id,
      clientName: row.client_name,
      serviceType: row.service_type,
      serviceDate: row.service_date,
      units: row.units,
      amount: row.amount,
      documentationStatus: row.documentation_status,
      billingStatus: row.billing_status,
      programName: row.program_name
    }));
    
    return { services, total };
  } catch (error) {
    throw new DatabaseError('Failed to retrieve service summaries', {
      operation: 'getServiceSummaries',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Retrieves services that are ready for billing
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns List of unbilled services and total count
 */
async function getUnbilledServices(
  params: ServiceQueryParams
): Promise<{ services: ServiceWithRelations[], total: number }> {
  // Modify params to filter for ready-for-billing status and complete documentation
  const billingParams: ServiceQueryParams = {
    ...params,
    billingStatus: BillingStatus.READY_FOR_BILLING,
    documentationStatus: DocumentationStatus.COMPLETE
  };
  
  // Delegate to findAll with the billing status filter
  return await findAll(billingParams);
}

/**
 * Retrieves service metrics for dashboard and reporting
 * 
 * @param options - Options for filtering metrics
 * @returns Service metrics data
 */
async function getServiceMetrics(options: any): Promise<{
  totalServices: number,
  totalUnbilledServices: number,
  totalUnbilledAmount: Money,
  incompleteDocumentation: number,
  servicesByProgram: Array<{ programId: UUID, programName: string, count: number, amount: Money }>,
  servicesByType: Array<{ serviceTypeId: UUID, serviceTypeName: string, count: number, amount: Money }>
}> {
  try {
    // Extract filter options
    const dateRange = options.dateRange || null;
    const programId = options.programId || null;
    const clientId = options.clientId || null;
    
    // Build WHERE clause for queries
    let whereClause = "s.status != 'deleted'";
    const queryParams: any[] = [];
    
    if (dateRange) {
      whereClause += " AND s.service_date BETWEEN ? AND ?";
      queryParams.push(dateRange.startDate, dateRange.endDate);
    }
    
    if (programId) {
      whereClause += " AND s.program_id = ?";
      queryParams.push(programId);
    }
    
    if (clientId) {
      whereClause += " AND s.client_id = ?";
      queryParams.push(clientId);
    }
    
    // Get total services
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM services s
      WHERE ${whereClause}
    `;
    
    const totalResult = await db.query(async (conn) => {
      return await conn.raw(totalQuery, queryParams);
    });
    
    const totalServices = parseInt(totalResult.rows[0].total);
    
    // Get unbilled services
    const unbilledQuery = `
      SELECT COUNT(*) as count, SUM(amount) as total_amount
      FROM services s
      WHERE ${whereClause} AND s.billing_status = ?
    `;
    
    const unbilledParams = [...queryParams, BillingStatus.READY_FOR_BILLING];
    
    const unbilledResult = await db.query(async (conn) => {
      return await conn.raw(unbilledQuery, unbilledParams);
    });
    
    const totalUnbilledServices = parseInt(unbilledResult.rows[0].count) || 0;
    const totalUnbilledAmount = parseFloat(unbilledResult.rows[0].total_amount) || 0;
    
    // Get incomplete documentation
    const incompleteQuery = `
      SELECT COUNT(*) as count
      FROM services s
      WHERE ${whereClause} AND s.documentation_status = ?
    `;
    
    const incompleteParams = [...queryParams, DocumentationStatus.INCOMPLETE];
    
    const incompleteResult = await db.query(async (conn) => {
      return await conn.raw(incompleteQuery, incompleteParams);
    });
    
    const incompleteDocumentation = parseInt(incompleteResult.rows[0].count);
    
    // Get services by program
    const programQuery = `
      SELECT 
        p.id as program_id,
        p.name as program_name,
        COUNT(*) as count,
        SUM(s.amount) as total_amount
      FROM services s
      JOIN programs p ON s.program_id = p.id
      WHERE ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY count DESC
    `;
    
    const programResult = await db.query(async (conn) => {
      return await conn.raw(programQuery, queryParams);
    });
    
    const servicesByProgram = programResult.rows.map((row: any) => ({
      programId: row.program_id,
      programName: row.program_name,
      count: parseInt(row.count),
      amount: parseFloat(row.total_amount)
    }));
    
    // Get services by type
    const typeQuery = `
      SELECT 
        st.id as service_type_id,
        st.name as service_type_name,
        COUNT(*) as count,
        SUM(s.amount) as total_amount
      FROM services s
      JOIN service_types st ON s.service_type_id = st.id
      WHERE ${whereClause}
      GROUP BY st.id, st.name
      ORDER BY count DESC
    `;
    
    const typeResult = await db.query(async (conn) => {
      return await conn.raw(typeQuery, queryParams);
    });
    
    const servicesByType = typeResult.rows.map((row: any) => ({
      serviceTypeId: row.service_type_id,
      serviceTypeName: row.service_type_name,
      count: parseInt(row.count),
      amount: parseFloat(row.total_amount)
    }));
    
    return {
      totalServices,
      totalUnbilledServices,
      totalUnbilledAmount,
      incompleteDocumentation,
      servicesByProgram,
      servicesByType
    };
  } catch (error) {
    throw new DatabaseError('Failed to retrieve service metrics', {
      operation: 'getServiceMetrics',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Imports services from external systems
 * 
 * @param services - Array of services to import
 * @param createdBy - User importing the services
 * @returns Import results
 */
async function importServices(services: any[], createdBy: UUID | null = null): Promise<{
  totalProcessed: number,
  successCount: number,
  errorCount: number,
  errors: Array<{ index: number, message: string }>,
  processedServices: UUID[]
}> {
  let trx;
  
  try {
    // Initialize result counters
    const result = {
      totalProcessed: services.length,
      successCount: 0,
      errorCount: 0,
      errors: [] as Array<{ index: number, message: string }>,
      processedServices: [] as UUID[]
    };
    
    // Start transaction
    trx = await db.getTransaction();
    
    // Process each service in the import array
    for (let i = 0; i < services.length; i++) {
      const serviceData = services[i];
      
      try {
        // Validate required fields
        if (!serviceData.clientId) {
          throw new Error('Client ID is required');
        }
        
        if (!serviceData.serviceTypeId) {
          throw new Error('Service type ID is required');
        }
        
        if (!serviceData.serviceDate) {
          throw new Error('Service date is required');
        }
        
        if (!serviceData.programId) {
          throw new Error('Program ID is required');
        }
        
        if (serviceData.units <= 0) {
          throw new Error('Units must be greater than zero');
        }
        
        if (serviceData.rate <= 0) {
          throw new Error('Rate must be greater than zero');
        }
        
        // Check for duplicate services (same client, date, service type)
        const duplicateQuery = `
          SELECT COUNT(*) as count
          FROM services
          WHERE client_id = ?
            AND service_date = ?
            AND service_type_id = ?
            AND status != 'deleted'
        `;
        
        const duplicateResult = await trx.raw(duplicateQuery, [
          serviceData.clientId,
          serviceData.serviceDate,
          serviceData.serviceTypeId
        ]);
        
        if (parseInt(duplicateResult.rows[0].count) > 0) {
          throw new Error('Duplicate service exists for this client, date, and service type');
        }
        
        // Create service using the existing create function, but with our transaction
        const createDto: CreateServiceDto = {
          ...serviceData,
          documentIds: [],
          documentationStatus: DocumentationStatus.INCOMPLETE
        };
        
        // Call create function
        const createdService = await create(createDto, createdBy);
        
        // Update success counter and add to processed services
        result.successCount++;
        result.processedServices.push(createdService.id);
      } catch (error) {
        // Record the error and continue
        result.errorCount++;
        result.errors.push({
          index: i,
          message: error.message
        });
      }
    }
    
    // Commit transaction
    await trx.commit();
    
    return result;
  } catch (error) {
    // Rollback transaction if it exists
    if (trx) {
      await trx.rollback();
    }
    
    throw new DatabaseError('Failed to import services', {
      operation: 'importServices',
      entity: 'service',
      code: error.code,
      message: error.message
    }, error);
  }
}

/**
 * Model class for service data with validation and transformation methods
 */
export class ServiceModel {
  /**
   * Name of the services database table
   */
  public tableName: string;
  
  /**
   * Name of the service documents junction table
   */
  public serviceDocumentsTableName: string;
  
  /**
   * Name of the authorizations table
   */
  public authorizationTableName: string;
  
  /**
   * Creates a new ServiceModel instance
   */
  constructor() {
    this.tableName = 'services';
    this.serviceDocumentsTableName = 'service_documents';
    this.authorizationTableName = 'authorizations';
  }
  
  /**
   * Converts a database record to a Service object
   * 
   * @param dbRecord - Database record to convert
   * @returns Service object
   */
  fromDb(dbRecord: Record<string, any>): Service {
    return mapDbToService(dbRecord);
  }
  
  /**
   * Converts a Service object to a database record
   * 
   * @param service - Service object to convert
   * @returns Database record
   */
  toDb(service: Service): Record<string, any> {
    return mapServiceToDb(service);
  }
  
  /**
   * Finds a service by ID
   * 
   * @param id - Service ID to find
   * @returns Service with relations or null if not found
   */
  async findById(id: UUID): Promise<ServiceWithRelations | null> {
    return await findById(id);
  }
  
  /**
   * Finds services with optional filtering
   * 
   * @param params - Query parameters
   * @returns Services and total count
   */
  async findAll(params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
    return await findAll(params);
  }
  
  /**
   * Finds services for a specific client
   * 
   * @param clientId - Client ID to filter by
   * @param params - Query parameters
   * @returns Client services and total count
   */
  async findByClientId(clientId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
    return await findByClientId(clientId, params);
  }
  
  /**
   * Finds services for a specific authorization
   * 
   * @param authorizationId - Authorization ID to filter by
   * @param params - Query parameters
   * @returns Authorization services and total count
   */
  async findByAuthorizationId(authorizationId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
    return await findByAuthorizationId(authorizationId, params);
  }
  
  /**
   * Finds services for a specific claim
   * 
   * @param claimId - Claim ID to filter by
   * @param params - Query parameters
   * @returns Claim services and total count
   */
  async findByClaimId(claimId: UUID, params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
    return await findByClaimId(claimId, params);
  }
  
  /**
   * Gets authorization details by ID
   * 
   * @param authorizationId - Authorization ID to get
   * @returns Authorization details if found
   */
  async getAuthorizationById(authorizationId: UUID): Promise<Authorization | null> {
    return await getAuthorizationById(authorizationId);
  }
  
  /**
   * Validates service against authorization internally
   * 
   * @param service - Service to validate
   * @param authorization - Authorization to validate against
   * @returns Validation results
   */
  async validateServiceAgainstAuthorizationInternal(service: Service, authorization: Authorization): Promise<{ isValid: boolean, errors: string[], warnings: string[] }> {
    return await validateServiceAgainstAuthorizationInternal(service, authorization);
  }
  
  /**
   * Updates authorization utilization internally
   * 
   * @param authorizationId - Authorization to update
   * @param units - Units to add or subtract
   * @param isAddition - Whether to add (true) or subtract (false) units
   */
  async trackUtilizationInternal(authorizationId: UUID, units: Units, isAddition: boolean): Promise<void> {
    return await trackUtilizationInternal(authorizationId, units, isAddition);
  }
  
  /**
   * Creates a new service
   * 
   * @param serviceData - Service data to create
   * @param createdBy - User creating the service
   * @returns Newly created service
   */
  async create(serviceData: CreateServiceDto, createdBy: UUID | null = null): Promise<ServiceWithRelations> {
    return await create(serviceData, createdBy);
  }
  
  /**
   * Updates an existing service
   * 
   * @param id - Service ID to update
   * @param serviceData - Updated service data
   * @param updatedBy - User updating the service
   * @returns Updated service
   */
  async update(id: UUID, serviceData: UpdateServiceDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
    return await update(id, serviceData, updatedBy);
  }
  
  /**
   * Updates a service's billing status
   * 
   * @param id - Service ID to update
   * @param statusData - New billing status data
   * @param updatedBy - User updating the service
   * @returns Updated service
   */
  async updateBillingStatus(id: UUID, statusData: UpdateServiceBillingStatusDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
    return await updateBillingStatus(id, statusData, updatedBy);
  }
  
  /**
   * Updates a service's documentation status
   * 
   * @param id - Service ID to update
   * @param statusData - New documentation status data
   * @param updatedBy - User updating the service
   * @returns Updated service
   */
  async updateDocumentationStatus(id: UUID, statusData: UpdateServiceDocumentationStatusDto, updatedBy: UUID | null = null): Promise<ServiceWithRelations> {
    return await updateDocumentationStatus(id, statusData, updatedBy);
  }
  
  /**
   * Soft deletes a service
   * 
   * @param id - Service ID to delete
   * @param updatedBy - User deleting the service
   * @returns True if successful
   */
  async delete(id: UUID, updatedBy: UUID | null = null): Promise<boolean> {
    return await deleteService(id, updatedBy);
  }
  
  /**
   * Validates a service for billing
   * 
   * @param id - Service ID to validate
   * @returns Validation result
   */
  async validateService(id: UUID): Promise<ServiceValidationResult> {
    return await validateService(id);
  }
  
  /**
   * Validates multiple services for billing
   * 
   * @param serviceIds - Service IDs to validate
   * @returns Batch validation results
   */
  async validateServices(serviceIds: UUID[]): Promise<{ results: ServiceValidationResult[], isValid: boolean, totalErrors: number, totalWarnings: number }> {
    return await validateServices(serviceIds);
  }
  
  /**
   * Gets summarized service information
   * 
   * @param params - Query parameters
   * @returns Service summaries and total count
   */
  async getServiceSummaries(params: ServiceQueryParams): Promise<{ services: ServiceSummary[], total: number }> {
    return await getServiceSummaries(params);
  }
  
  /**
   * Gets services ready for billing
   * 
   * @param params - Query parameters
   * @returns Unbilled services and total count
   */
  async getUnbilledServices(params: ServiceQueryParams): Promise<{ services: ServiceWithRelations[], total: number }> {
    return await getUnbilledServices(params);
  }
  
  /**
   * Gets service metrics for reporting
   * 
   * @param options - Options for filtering metrics
   * @returns Service metrics
   */
  async getServiceMetrics(options: object): Promise<any> {
    return await getServiceMetrics(options);
  }
  
  /**
   * Imports services from external systems
   * 
   * @param services - Services to import
   * @param createdBy - User importing the services
   * @returns Import results
   */
  async importServices(services: any[], createdBy: UUID | null = null): Promise<{ totalProcessed: number, successCount: number, errorCount: number, errors: Array<{ index: number, message: string }>, processedServices: UUID[] }> {
    return await importServices(services, createdBy);
  }
}

// Create and export the service model
const serviceModel = new ServiceModel();
export default serviceModel;