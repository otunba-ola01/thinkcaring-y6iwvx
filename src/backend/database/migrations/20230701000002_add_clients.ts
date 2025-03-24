/**
 * Database migration to add initial client data to the HCBS Revenue Management System.
 * This migration creates sample clients with demographic information, program enrollments,
 * and insurance details to support the client management functionality of the application.
 * 
 * @module database/migrations
 */

import { Transaction } from '../../types/database.types';
import { Gender, ClientStatus } from '../../types/clients.types';
import { InsuranceType } from '../../types/clients.types';
import { StatusType } from '../../types/common.types';
import * as Knex from 'knex'; // v2.4.2
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

/**
 * Migration function to add initial client data to the database
 * @param knex Knex instance
 * @returns Promise resolving when all client data is created successfully
 */
export async function up(knex: Knex): Promise<void> {
  // Get program IDs to reference in client program enrollments
  const programs = await knex('programs').select('id', 'name');
  const programMap: Record<string, string> = {};
  programs.forEach(program => {
    programMap[program.name] = program.id;
  });

  // Get payer IDs to reference in client insurance records
  const payers = await knex('payers').select('id', 'name');
  const payerMap: Record<string, string> = {};
  payers.forEach(payer => {
    payerMap[payer.name] = payer.id;
  });

  // Create sample client data
  const clients = createSampleClients();
  
  // Create client program enrollments
  const clientPrograms = createClientPrograms(clients, programMap);
  
  // Create client insurance records
  const clientInsurances = createClientInsurances(clients, payerMap);

  // Insert all the data in a transaction
  await knex.transaction(async (trx: Transaction) => {
    // Insert clients
    await trx('clients').insert(clients);
    
    // Insert client program enrollments
    await trx('client_programs').insert(clientPrograms);
    
    // Insert client insurance records
    await trx('client_insurances').insert(clientInsurances);
  });
}

/**
 * Migration function to remove initial client data from the database
 * @param knex Knex instance
 * @returns Promise resolving when all initial client data is removed
 */
export async function down(knex: Knex): Promise<void> {
  // Get the IDs of the sample clients
  const clientIds = await knex('clients')
    .whereIn('first_name', [
      'John', 'Jane', 'Robert', 'Sarah', 'Michael', 
      'Emily', 'David', 'Jessica', 'James', 'Lisa'
    ])
    .andWhereIn('last_name', [
      'Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 
      'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez'
    ])
    .select('id');
    
  const ids = clientIds.map(client => client.id);
  
  // Delete in a transaction to maintain referential integrity
  await knex.transaction(async (trx: Transaction) => {
    // Delete client insurance records for the sample clients
    await trx('client_insurances')
      .whereIn('client_id', ids)
      .delete();
    
    // Delete client program enrollments for the sample clients
    await trx('client_programs')
      .whereIn('client_id', ids)
      .delete();
    
    // Delete the sample client records
    await trx('clients')
      .whereIn('id', ids)
      .delete();
  });
}

/**
 * Helper function to create sample client records
 * @returns Array of client records to be inserted into the database
 */
function createSampleClients(): Array<object> {
  const now = new Date().toISOString();
  
  return [
    {
      id: uuidv4(),
      first_name: 'John',
      last_name: 'Smith',
      middle_name: 'Robert',
      date_of_birth: '1978-05-12',
      gender: Gender.MALE,
      medicaid_id: 'MD12345678',
      medicare_id: null,
      ssn: '123-45-6789',
      address: JSON.stringify({
        street1: '123 Main St',
        street2: 'Apt 4B',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'john.smith@example.com',
        phone: '(217) 555-1234',
        alternatePhone: null,
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Mary Smith',
        relationship: 'Spouse',
        phone: '(217) 555-5678',
        alternatePhone: null,
        email: 'mary.smith@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Requires assistance with daily activities',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Jane',
      last_name: 'Doe',
      middle_name: null,
      date_of_birth: '1985-09-23',
      gender: Gender.FEMALE,
      medicaid_id: 'MD23456789',
      medicare_id: null,
      ssn: '234-56-7890',
      address: JSON.stringify({
        street1: '456 Oak Ave',
        street2: null,
        city: 'Riverdale',
        state: 'NY',
        zipCode: '10471',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'jane.doe@example.com',
        phone: '(718) 555-2345',
        alternatePhone: '(718) 555-3456',
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'John Doe',
        relationship: 'Brother',
        phone: '(718) 555-4567',
        alternatePhone: null,
        email: 'john.doe@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Prefers morning appointments',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Robert',
      last_name: 'Johnson',
      middle_name: 'James',
      date_of_birth: '1965-03-17',
      gender: Gender.MALE,
      medicaid_id: 'MD34567890',
      medicare_id: 'MC12345678',
      ssn: '345-67-8901',
      address: JSON.stringify({
        street1: '789 Pine St',
        street2: null,
        city: 'Portland',
        state: 'OR',
        zipCode: '97205',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'robert.johnson@example.com',
        phone: '(503) 555-3456',
        alternatePhone: null,
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Susan Johnson',
        relationship: 'Daughter',
        phone: '(503) 555-6789',
        alternatePhone: null,
        email: 'susan.johnson@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Has mobility challenges, needs transportation assistance',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Sarah',
      last_name: 'Williams',
      middle_name: 'Lynn',
      date_of_birth: '1992-11-05',
      gender: Gender.FEMALE,
      medicaid_id: 'MD45678901',
      medicare_id: null,
      ssn: '456-78-9012',
      address: JSON.stringify({
        street1: '101 Maple Dr',
        street2: 'Unit 202',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'sarah.williams@example.com',
        phone: '(512) 555-4567',
        alternatePhone: '(512) 555-7890',
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Michael Williams',
        relationship: 'Father',
        phone: '(512) 555-8901',
        alternatePhone: null,
        email: 'michael.williams@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Allergic to penicillin',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Michael',
      last_name: 'Brown',
      middle_name: 'Thomas',
      date_of_birth: '1973-08-30',
      gender: Gender.MALE,
      medicaid_id: 'MD56789012',
      medicare_id: null,
      ssn: '567-89-0123',
      address: JSON.stringify({
        street1: '222 Cedar Ln',
        street2: null,
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'michael.brown@example.com',
        phone: '(312) 555-5678',
        alternatePhone: null,
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Patricia Brown',
        relationship: 'Spouse',
        phone: '(312) 555-9012',
        alternatePhone: null,
        email: 'patricia.brown@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Requires wheelchair accessibility',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Emily',
      last_name: 'Jones',
      middle_name: 'Grace',
      date_of_birth: '1988-04-15',
      gender: Gender.FEMALE,
      medicaid_id: 'MD67890123',
      medicare_id: null,
      ssn: '678-90-1234',
      address: JSON.stringify({
        street1: '333 Birch Ave',
        street2: 'Apt 5C',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'emily.jones@example.com',
        phone: '(303) 555-6789',
        alternatePhone: null,
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Daniel Jones',
        relationship: 'Husband',
        phone: '(303) 555-0123',
        alternatePhone: null,
        email: 'daniel.jones@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Prefers female care providers',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'David',
      last_name: 'Garcia',
      middle_name: null,
      date_of_birth: '1980-12-08',
      gender: Gender.MALE,
      medicaid_id: 'MD78901234',
      medicare_id: null,
      ssn: '789-01-2345',
      address: JSON.stringify({
        street1: '444 Redwood St',
        street2: null,
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'david.garcia@example.com',
        phone: '(619) 555-7890',
        alternatePhone: '(619) 555-1234',
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Maria Garcia',
        relationship: 'Mother',
        phone: '(619) 555-2345',
        alternatePhone: null,
        email: 'maria.garcia@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Bilingual (English/Spanish)',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Jessica',
      last_name: 'Miller',
      middle_name: 'Ann',
      date_of_birth: '1990-07-22',
      gender: Gender.FEMALE,
      medicaid_id: 'MD89012345',
      medicare_id: null,
      ssn: '890-12-3456',
      address: JSON.stringify({
        street1: '555 Spruce Dr',
        street2: 'Unit 3D',
        city: 'Philadelphia',
        state: 'PA',
        zipCode: '19103',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'jessica.miller@example.com',
        phone: '(215) 555-8901',
        alternatePhone: null,
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Richard Miller',
        relationship: 'Father',
        phone: '(215) 555-3456',
        alternatePhone: null,
        email: 'richard.miller@example.com'
      }),
      status: ClientStatus.PENDING,
      notes: 'Initial assessment scheduled',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'James',
      last_name: 'Davis',
      middle_name: 'Edward',
      date_of_birth: '1960-02-28',
      gender: Gender.MALE,
      medicaid_id: null,
      medicare_id: 'MC23456789',
      ssn: '901-23-4567',
      address: JSON.stringify({
        street1: '666 Elm St',
        street2: null,
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'james.davis@example.com',
        phone: '(206) 555-9012',
        alternatePhone: null,
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Jennifer Davis',
        relationship: 'Daughter',
        phone: '(206) 555-4567',
        alternatePhone: null,
        email: 'jennifer.davis@example.com'
      }),
      status: ClientStatus.ON_HOLD,
      notes: 'Services temporarily suspended due to hospitalization',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    },
    {
      id: uuidv4(),
      first_name: 'Lisa',
      last_name: 'Rodriguez',
      middle_name: 'Marie',
      date_of_birth: '1975-10-18',
      gender: Gender.FEMALE,
      medicaid_id: 'MD90123456',
      medicare_id: null,
      ssn: '012-34-5678',
      address: JSON.stringify({
        street1: '777 Willow Ave',
        street2: 'Apt 12B',
        city: 'Miami',
        state: 'FL',
        zipCode: '33130',
        country: 'USA'
      }),
      contact_info: JSON.stringify({
        email: 'lisa.rodriguez@example.com',
        phone: '(305) 555-0123',
        alternatePhone: '(305) 555-5678',
        fax: null
      }),
      emergency_contact: JSON.stringify({
        name: 'Carlos Rodriguez',
        relationship: 'Brother',
        phone: '(305) 555-9012',
        alternatePhone: null,
        email: 'carlos.rodriguez@example.com'
      }),
      status: ClientStatus.ACTIVE,
      notes: 'Prefers appointment reminders via text',
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null
    }
  ];
}

/**
 * Helper function to create program enrollments for sample clients
 * @param clients Array of client records
 * @param programMap Map of program names to program IDs
 * @returns Array of client program enrollment records
 */
function createClientPrograms(clients: Array<any>, programMap: Record<string, string>): Array<object> {
  const now = new Date().toISOString();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const oneYearFromNowStr = oneYearFromNow.toISOString().split('T')[0];
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
  
  const clientPrograms: Array<object> = [];
  
  // For each client, create 1-3 program enrollments based on their needs
  clients.forEach((client, index) => {
    // Assign different program combinations based on client index
    if (index % 3 === 0 && programMap['Personal Care']) {
      // Personal Care program enrollment
      clientPrograms.push({
        id: uuidv4(),
        client_id: client.id,
        program_id: programMap['Personal Care'],
        start_date: sixMonthsAgoStr,
        end_date: oneYearFromNowStr,
        status: StatusType.ACTIVE,
        notes: 'Regular personal care assistance',
        created_at: now,
        updated_at: now
      });
    }
    
    if (index % 4 === 0 && programMap['Residential']) {
      // Residential program enrollment
      clientPrograms.push({
        id: uuidv4(),
        client_id: client.id,
        program_id: programMap['Residential'],
        start_date: threeMonthsAgoStr,
        end_date: oneYearFromNowStr,
        status: StatusType.ACTIVE,
        notes: 'Group home placement',
        created_at: now,
        updated_at: now
      });
    }
    
    if (index % 5 === 0 && programMap['Day Services']) {
      // Day Services program enrollment
      clientPrograms.push({
        id: uuidv4(),
        client_id: client.id,
        program_id: programMap['Day Services'],
        start_date: sixMonthsAgoStr,
        end_date: oneYearFromNowStr,
        status: StatusType.ACTIVE,
        notes: 'Weekday day program attendance',
        created_at: now,
        updated_at: now
      });
    }
    
    if (index % 6 === 0 && programMap['Respite']) {
      // Respite program enrollment
      clientPrograms.push({
        id: uuidv4(),
        client_id: client.id,
        program_id: programMap['Respite'],
        start_date: threeMonthsAgoStr,
        end_date: oneYearFromNowStr,
        status: StatusType.ACTIVE,
        notes: 'Monthly respite care',
        created_at: now,
        updated_at: now
      });
    }
    
    // Ensure every client has at least one program enrollment
    if (clientPrograms.filter(p => (p as any).client_id === client.id).length === 0) {
      // Default to Personal Care if no other programs assigned
      clientPrograms.push({
        id: uuidv4(),
        client_id: client.id,
        program_id: programMap['Personal Care'] || Object.values(programMap)[0], // Fallback to first available program
        start_date: threeMonthsAgoStr,
        end_date: oneYearFromNowStr,
        status: StatusType.ACTIVE,
        notes: 'Basic care services',
        created_at: now,
        updated_at: now
      });
    }
  });
  
  return clientPrograms;
}

/**
 * Helper function to create insurance records for sample clients
 * @param clients Array of client records
 * @param payerMap Map of payer names to payer IDs
 * @returns Array of client insurance records
 */
function createClientInsurances(clients: Array<any>, payerMap: Record<string, string>): Array<object> {
  const now = new Date().toISOString();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const oneYearFromNowStr = oneYearFromNow.toISOString().split('T')[0];
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
  
  const clientInsurances: Array<object> = [];
  
  // Create insurance records for each client
  clients.forEach((client) => {
    // Primary insurance - most clients have Medicaid
    if (client.medicaid_id) {
      clientInsurances.push({
        id: uuidv4(),
        client_id: client.id,
        type: InsuranceType.MEDICAID,
        payer_id: payerMap['Medicaid'] || null,
        policy_number: client.medicaid_id,
        group_number: null,
        subscriber_name: `${client.first_name} ${client.last_name}`,
        subscriber_relationship: 'Self',
        effective_date: sixMonthsAgoStr,
        termination_date: oneYearFromNowStr,
        is_primary: true,
        status: StatusType.ACTIVE,
        created_at: now,
        updated_at: now
      });
    }
    
    // Secondary insurance - some clients have Medicare
    if (client.medicare_id) {
      clientInsurances.push({
        id: uuidv4(),
        client_id: client.id,
        type: InsuranceType.MEDICARE,
        payer_id: payerMap['Medicare'] || null,
        policy_number: client.medicare_id,
        group_number: null,
        subscriber_name: `${client.first_name} ${client.last_name}`,
        subscriber_relationship: 'Self',
        effective_date: sixMonthsAgoStr,
        termination_date: oneYearFromNowStr,
        is_primary: !client.medicaid_id, // Primary only if no Medicaid
        status: StatusType.ACTIVE,
        created_at: now,
        updated_at: now
      });
    }
    
    // Private insurance for some clients
    if (!client.medicaid_id && !client.medicare_id) {
      // For clients without public insurance, create private insurance
      clientInsurances.push({
        id: uuidv4(),
        client_id: client.id,
        type: InsuranceType.PRIVATE,
        payer_id: payerMap['Blue Cross Blue Shield'] || payerMap['Aetna'] || null,
        policy_number: `PRIV${Math.floor(1000000 + Math.random() * 9000000)}`,
        group_number: `GRP${Math.floor(10000 + Math.random() * 90000)}`,
        subscriber_name: `${client.first_name} ${client.last_name}`,
        subscriber_relationship: 'Self',
        effective_date: sixMonthsAgoStr,
        termination_date: oneYearFromNowStr,
        is_primary: true,
        status: StatusType.ACTIVE,
        created_at: now,
        updated_at: now
      });
    }
    
    // Ensure every client has at least one insurance record
    if (clientInsurances.filter(i => (i as any).client_id === client.id).length === 0) {
      // Default to Medicaid if no other insurance assigned
      clientInsurances.push({
        id: uuidv4(),
        client_id: client.id,
        type: InsuranceType.MEDICAID,
        payer_id: payerMap['Medicaid'] || null,
        policy_number: `MD${Math.floor(10000000 + Math.random() * 90000000)}`,
        group_number: null,
        subscriber_name: `${client.first_name} ${client.last_name}`,
        subscriber_relationship: 'Self',
        effective_date: sixMonthsAgoStr,
        termination_date: oneYearFromNowStr,
        is_primary: true,
        status: StatusType.ACTIVE,
        created_at: now,
        updated_at: now
      });
    }
  });
  
  return clientInsurances;
}