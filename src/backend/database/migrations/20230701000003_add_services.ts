import { Knex } from 'knex'; // v2.4.2
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Transaction } from '../../types/database.types';
import { DocumentationStatus, BillingStatus, ServiceType } from '../../types/services.types';
import { StatusType } from '../../types/common.types';

/**
 * Migration function to add initial service data to the database
 */
export async function up(knex: Knex): Promise<void> {
  // Retrieve client IDs
  const clients = await knex('clients')
    .select('id', 'first_name', 'last_name')
    .where('status', StatusType.ACTIVE);
  
  // Create a map of client names to IDs for easier reference
  const clientMap = clients.reduce((map, client) => {
    map[`${client.first_name} ${client.last_name}`] = client.id;
    return map;
  }, {} as Record<string, string>);
  
  // Retrieve service type IDs
  const serviceTypes = await knex('service_types')
    .select('id', 'name')
    .where('status', StatusType.ACTIVE);
  
  // Create a map of service type names to IDs
  const serviceTypeMap = serviceTypes.reduce((map, type) => {
    map[type.name] = type.id;
    return map;
  }, {} as Record<string, string>);
  
  // Retrieve staff IDs
  const staff = await knex('staff')
    .select('id', 'first_name', 'last_name')
    .where('status', StatusType.ACTIVE);
  
  // Create a map of staff names to IDs
  const staffMap = staff.reduce((map, person) => {
    map[`${person.first_name} ${person.last_name}`] = person.id;
    return map;
  }, {} as Record<string, string>);
  
  // Retrieve facility IDs
  const facilities = await knex('facilities')
    .select('id', 'name')
    .where('status', StatusType.ACTIVE);
  
  // Create a map of facility names to IDs
  const facilityMap = facilities.reduce((map, facility) => {
    map[facility.name] = facility.id;
    return map;
  }, {} as Record<string, string>);
  
  // Retrieve program IDs
  const programs = await knex('programs')
    .select('id', 'name')
    .where('status', StatusType.ACTIVE);
  
  // Create a map of program names to IDs
  const programMap = programs.reduce((map, program) => {
    map[program.name] = program.id;
    return map;
  }, {} as Record<string, string>);
  
  // Retrieve authorization IDs
  const authorizations = await knex('service_authorizations')
    .select('id', 'client_id', 'authorization_number')
    .where('status', StatusType.ACTIVE);
  
  // Create a map of authorization numbers to IDs
  const authorizationMap = authorizations.reduce((map, auth) => {
    map[auth.authorization_number] = auth.id;
    return map;
  }, {} as Record<string, string>);
  
  // Create sample services
  const services = createSampleServices(
    clientMap,
    serviceTypeMap,
    staffMap,
    facilityMap,
    programMap,
    authorizationMap
  );
  
  // Insert services in batches to avoid potential issues with large inserts
  if (services.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);
      await knex('services').insert(batch);
    }
    console.log(`Added ${services.length} sample services`);
  }
}

/**
 * Migration function to remove initial service data from the database
 */
export async function down(knex: Knex): Promise<void> {
  // Delete all services created in this migration
  await knex('services').del();
  console.log('Removed all sample services');
}

/**
 * Helper function to create sample service records
 */
function createSampleServices(
  clientMap: Record<string, string>,
  serviceTypeMap: Record<string, string>,
  staffMap: Record<string, string>,
  facilityMap: Record<string, string>,
  programMap: Record<string, string>,
  authorizationMap: Record<string, string>
): Array<object> {
  // Check if we have the necessary data
  if (
    Object.keys(clientMap).length === 0 ||
    Object.keys(serviceTypeMap).length === 0 ||
    Object.keys(programMap).length === 0
  ) {
    console.warn('Missing required reference data for creating sample services');
    return [];
  }
  
  // Generate service dates for the last 90 days (roughly 3 months)
  const serviceDates = generateServiceDates(90, 100);
  
  // Define service data
  const services = [];
  
  // Create services for each client
  for (const [clientName, clientId] of Object.entries(clientMap)) {
    // Personal Care services
    if (serviceTypeMap[ServiceType.PERSONAL_CARE]) {
      // Get 10-15 random dates for personal care services
      const pcDates = serviceDates.slice(0, Math.floor(Math.random() * 6) + 10);
      
      for (const date of pcDates) {
        const units = Math.floor(Math.random() * 6) + 1; // 1-6 units
        const rate = 25.50; // $25.50 per unit
        const amount = +(units * rate).toFixed(2); // Ensure proper decimal precision
        
        services.push({
          id: uuidv4(),
          client_id: clientId,
          service_type_id: serviceTypeMap[ServiceType.PERSONAL_CARE],
          service_code: 'PC001',
          service_date: date,
          start_time: null, // Could be set to actual times if needed
          end_time: null,
          units,
          rate,
          amount,
          staff_id: Object.values(staffMap)[Math.floor(Math.random() * Object.values(staffMap).length)],
          facility_id: null, // Personal care often happens at client home
          program_id: programMap['Personal Care Program'] || Object.values(programMap)[0],
          authorization_id: Object.values(authorizationMap)[Math.floor(Math.random() * Object.values(authorizationMap).length)],
          documentation_status: Math.random() > 0.2 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE,
          billing_status: Math.random() > 0.3 ? BillingStatus.READY_FOR_BILLING : BillingStatus.UNBILLED,
          claim_id: null,
          notes: 'Sample personal care service',
          document_ids: JSON.stringify([]),
          status: StatusType.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: Object.values(staffMap)[0], // First staff as creator
          updated_by: Object.values(staffMap)[0],
        });
      }
    }
    
    // Day Services
    if (serviceTypeMap[ServiceType.DAY_SERVICES]) {
      // Get 5-10 random dates for day services
      const dsDates = serviceDates.slice(15, Math.floor(Math.random() * 6) + 20);
      
      for (const date of dsDates) {
        const units = 6; // Typically 6 hours for day program
        const rate = 45.75; // $45.75 per unit
        const amount = +(units * rate).toFixed(2);
        
        services.push({
          id: uuidv4(),
          client_id: clientId,
          service_type_id: serviceTypeMap[ServiceType.DAY_SERVICES],
          service_code: 'DS001',
          service_date: date,
          start_time: null,
          end_time: null,
          units,
          rate,
          amount,
          staff_id: Object.values(staffMap)[Math.floor(Math.random() * Object.values(staffMap).length)],
          facility_id: Object.values(facilityMap)[Math.floor(Math.random() * Object.values(facilityMap).length)],
          program_id: programMap['Day Services Program'] || Object.values(programMap)[0],
          authorization_id: Object.values(authorizationMap)[Math.floor(Math.random() * Object.values(authorizationMap).length)],
          documentation_status: Math.random() > 0.2 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE,
          billing_status: Math.random() > 0.3 ? BillingStatus.READY_FOR_BILLING : BillingStatus.UNBILLED,
          claim_id: null,
          notes: 'Sample day services',
          document_ids: JSON.stringify([]),
          status: StatusType.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: Object.values(staffMap)[0],
          updated_by: Object.values(staffMap)[0],
        });
      }
    }
    
    // Residential Services
    if (serviceTypeMap[ServiceType.RESIDENTIAL]) {
      // Get 3-5 random dates for residential services
      const rsDates = serviceDates.slice(30, Math.floor(Math.random() * 3) + 33);
      
      for (const date of rsDates) {
        const units = 1; // Typically 1 day for residential
        const rate = 250.00; // $250.00 per day
        const amount = +(units * rate).toFixed(2);
        
        services.push({
          id: uuidv4(),
          client_id: clientId,
          service_type_id: serviceTypeMap[ServiceType.RESIDENTIAL],
          service_code: 'RS001',
          service_date: date,
          start_time: null,
          end_time: null,
          units,
          rate,
          amount,
          staff_id: Object.values(staffMap)[Math.floor(Math.random() * Object.values(staffMap).length)],
          facility_id: Object.values(facilityMap)[Math.floor(Math.random() * Object.values(facilityMap).length)],
          program_id: programMap['Residential Program'] || Object.values(programMap)[0],
          authorization_id: Object.values(authorizationMap)[Math.floor(Math.random() * Object.values(authorizationMap).length)],
          documentation_status: Math.random() > 0.1 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE,
          billing_status: Math.random() > 0.2 ? BillingStatus.READY_FOR_BILLING : BillingStatus.UNBILLED,
          claim_id: null,
          notes: 'Sample residential service',
          document_ids: JSON.stringify([]),
          status: StatusType.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: Object.values(staffMap)[0],
          updated_by: Object.values(staffMap)[0],
        });
      }
    }
    
    // Respite Services
    if (serviceTypeMap[ServiceType.RESPITE]) {
      // Get 2-4 random dates for respite services
      const rspDates = serviceDates.slice(40, Math.floor(Math.random() * 3) + 42);
      
      for (const date of rspDates) {
        const units = Math.floor(Math.random() * 6) + 2; // 2-7 units
        const rate = 35.25; // $35.25 per unit
        const amount = +(units * rate).toFixed(2);
        
        services.push({
          id: uuidv4(),
          client_id: clientId,
          service_type_id: serviceTypeMap[ServiceType.RESPITE],
          service_code: 'RSP001',
          service_date: date,
          start_time: null,
          end_time: null,
          units,
          rate,
          amount,
          staff_id: Object.values(staffMap)[Math.floor(Math.random() * Object.values(staffMap).length)],
          facility_id: Math.random() > 0.5 ? Object.values(facilityMap)[Math.floor(Math.random() * Object.values(facilityMap).length)] : null,
          program_id: programMap['Respite Program'] || Object.values(programMap)[0],
          authorization_id: Object.values(authorizationMap)[Math.floor(Math.random() * Object.values(authorizationMap).length)],
          documentation_status: Math.random() > 0.2 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE,
          billing_status: Math.random() > 0.3 ? BillingStatus.READY_FOR_BILLING : BillingStatus.UNBILLED,
          claim_id: null,
          notes: 'Sample respite service',
          document_ids: JSON.stringify([]),
          status: StatusType.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: Object.values(staffMap)[0],
          updated_by: Object.values(staffMap)[0],
        });
      }
    }
    
    // Therapy Services
    if (serviceTypeMap[ServiceType.THERAPY]) {
      // Get 1-3 random dates for therapy services
      const thDates = serviceDates.slice(50, Math.floor(Math.random() * 3) + 51);
      
      for (const date of thDates) {
        const units = Math.floor(Math.random() * 2) + 1; // 1-2 units
        const rate = 85.00; // $85.00 per unit
        const amount = +(units * rate).toFixed(2);
        
        services.push({
          id: uuidv4(),
          client_id: clientId,
          service_type_id: serviceTypeMap[ServiceType.THERAPY],
          service_code: 'TH001',
          service_date: date,
          start_time: null,
          end_time: null,
          units,
          rate,
          amount,
          staff_id: Object.values(staffMap)[Math.floor(Math.random() * Object.values(staffMap).length)],
          facility_id: Object.values(facilityMap)[Math.floor(Math.random() * Object.values(facilityMap).length)],
          program_id: programMap['Therapy Program'] || Object.values(programMap)[0],
          authorization_id: Object.values(authorizationMap)[Math.floor(Math.random() * Object.values(authorizationMap).length)],
          documentation_status: Math.random() > 0.1 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE,
          billing_status: Math.random() > 0.2 ? BillingStatus.READY_FOR_BILLING : BillingStatus.UNBILLED,
          claim_id: null,
          notes: 'Sample therapy service',
          document_ids: JSON.stringify([]),
          status: StatusType.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: Object.values(staffMap)[0],
          updated_by: Object.values(staffMap)[0],
        });
      }
    }
    
    // Transportation Services
    if (serviceTypeMap[ServiceType.TRANSPORTATION]) {
      // Get 2-5 random dates for transportation services
      const trDates = serviceDates.slice(60, Math.floor(Math.random() * 4) + 62);
      
      for (const date of trDates) {
        const units = Math.floor(Math.random() * 20) + 5; // 5-24 miles
        const rate = 0.65; // $0.65 per mile
        const amount = +(units * rate).toFixed(2);
        
        services.push({
          id: uuidv4(),
          client_id: clientId,
          service_type_id: serviceTypeMap[ServiceType.TRANSPORTATION],
          service_code: 'TR001',
          service_date: date,
          start_time: null,
          end_time: null,
          units,
          rate,
          amount,
          staff_id: Object.values(staffMap)[Math.floor(Math.random() * Object.values(staffMap).length)],
          facility_id: null,
          program_id: programMap['Transportation Program'] || Object.values(programMap)[0],
          authorization_id: Object.values(authorizationMap)[Math.floor(Math.random() * Object.values(authorizationMap).length)],
          documentation_status: Math.random() > 0.15 ? DocumentationStatus.COMPLETE : DocumentationStatus.INCOMPLETE,
          billing_status: Math.random() > 0.25 ? BillingStatus.READY_FOR_BILLING : BillingStatus.UNBILLED,
          claim_id: null,
          notes: 'Sample transportation service',
          document_ids: JSON.stringify([]),
          status: StatusType.ACTIVE,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: Object.values(staffMap)[0],
          updated_by: Object.values(staffMap)[0],
        });
      }
    }
  }
  
  return services;
}

/**
 * Helper function to generate realistic service dates
 */
function generateServiceDates(daysBack: number, count: number): Array<string> {
  const dates: string[] = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - daysBack);
  
  // Create array of potential dates
  for (let i = 0; i <= daysBack; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Shuffle the dates to create a more realistic distribution
  for (let i = dates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dates[i], dates[j]] = [dates[j], dates[i]];
  }
  
  // Return the requested number of dates
  return dates.slice(0, count);
}