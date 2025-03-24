/**
 * Database migration to create staff-related tables for the HCBS Revenue Management System.
 * 
 * This migration creates the following tables:
 * - staff: Stores information about staff members who deliver services
 * - staff_qualifications: Tracks certifications and qualifications of staff members
 * - staff_program_assignments: Manages which programs staff members are assigned to
 * - staff_availability: Tracks scheduling and availability of staff members
 * 
 * The migration also creates appropriate foreign key constraints and indexes for performance.
 */

import * as Knex from 'knex'; // v2.4.2
import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import { Transaction } from '../../types/database.types';
import { StatusType } from '../../types/common.types';

/**
 * Creates staff-related tables in the database
 * 
 * @param knex - Knex instance
 * @returns Promise resolving when the migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Create staff table
  await knex.schema.createTable('staff', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('title').nullable();
    table.string('employee_id').unique().nullable();
    table.date('hire_date').nullable();
    table.date('termination_date').nullable();
    table.jsonb('contact_info').nullable();
    table.string('status').notNullable().defaultTo(StatusType.ACTIVE);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create staff_qualifications table
  await knex.schema.createTable('staff_qualifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.uuid('service_type_id').notNullable().references('id').inTable('service_types').onDelete('CASCADE');
    table.date('effective_date').notNullable();
    table.date('expiration_date').nullable();
    table.string('certification_number').nullable();
    table.text('notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create staff_program_assignments table
  await knex.schema.createTable('staff_program_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.uuid('program_id').notNullable().references('id').inTable('programs').onDelete('CASCADE');
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.boolean('is_primary').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create staff_availability table
  await knex.schema.createTable('staff_availability', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('staff_id').notNullable().references('id').inTable('staff').onDelete('CASCADE');
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.boolean('is_available').notNullable().defaultTo(true);
    table.text('notes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create indexes for performance
  await knex.schema.alterTable('staff', (table) => {
    table.index(['last_name', 'first_name'], 'idx_staff_name');
    table.index(['status'], 'idx_staff_status');
  });

  await knex.schema.alterTable('staff_qualifications', (table) => {
    table.index(['staff_id'], 'idx_staff_qualifications_staff_id');
    table.index(['service_type_id'], 'idx_staff_qualifications_service_type_id');
    table.index(['expiration_date'], 'idx_staff_qualifications_expiration');
  });

  await knex.schema.alterTable('staff_program_assignments', (table) => {
    table.index(['staff_id'], 'idx_staff_program_assignments_staff_id');
    table.index(['program_id'], 'idx_staff_program_assignments_program_id');
  });

  await knex.schema.alterTable('staff_availability', (table) => {
    table.index(['staff_id'], 'idx_staff_availability_staff_id');
    table.index(['date'], 'idx_staff_availability_date');
  });

  // Create sample data
  const staffIds = await createSampleStaff(knex);
  await createSampleQualifications(knex, staffIds);
  await createSampleProgramAssignments(knex, staffIds);
}

/**
 * Drops staff-related tables from the database
 * 
 * @param knex - Knex instance
 * @returns Promise resolving when the rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('staff_availability');
  await knex.schema.dropTableIfExists('staff_program_assignments');
  await knex.schema.dropTableIfExists('staff_qualifications');
  await knex.schema.dropTableIfExists('staff');
}

/**
 * Creates sample staff records for testing
 * 
 * @param knex - Knex instance
 * @returns Promise resolving to an array of created staff IDs
 */
async function createSampleStaff(knex: Knex): Promise<string[]> {
  const now = new Date();
  
  const staffData = [
    {
      id: uuidv4(),
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      title: 'Clinical Director',
      employee_id: 'EMP001',
      hire_date: new Date('2020-03-15'),
      contact_info: JSON.stringify({
        phone: '555-123-4567',
        address: {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'CA',
          zipCode: '90210'
        }
      }),
      status: StatusType.ACTIVE,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.brown@example.com',
      title: 'Service Coordinator',
      employee_id: 'EMP002',
      hire_date: new Date('2021-06-10'),
      contact_info: JSON.stringify({
        phone: '555-987-6543',
        address: {
          street: '456 Oak Avenue',
          city: 'Somewhere',
          state: 'NY',
          zipCode: '10001'
        }
      }),
      status: StatusType.ACTIVE,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      first_name: 'Jennifer',
      last_name: 'Martinez',
      email: 'jennifer.martinez@example.com',
      title: 'Personal Care Assistant',
      employee_id: 'EMP003',
      hire_date: new Date('2022-01-05'),
      contact_info: JSON.stringify({
        phone: '555-456-7890',
        address: {
          street: '789 Pine Road',
          city: 'Elsewhere',
          state: 'TX',
          zipCode: '75001'
        }
      }),
      status: StatusType.ACTIVE,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      first_name: 'David',
      last_name: 'Wilson',
      email: 'david.wilson@example.com',
      title: 'Behavioral Specialist',
      employee_id: 'EMP004',
      hire_date: new Date('2019-11-20'),
      contact_info: JSON.stringify({
        phone: '555-789-0123',
        address: {
          street: '321 Cedar Boulevard',
          city: 'Nowhere',
          state: 'FL',
          zipCode: '33101'
        }
      }),
      status: StatusType.ACTIVE,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      first_name: 'Emily',
      last_name: 'Garcia',
      email: 'emily.garcia@example.com',
      title: 'Residential Support Specialist',
      employee_id: 'EMP005',
      hire_date: new Date('2021-08-15'),
      contact_info: JSON.stringify({
        phone: '555-234-5678',
        address: {
          street: '654 Maple Street',
          city: 'Somewhere Else',
          state: 'IL',
          zipCode: '60601'
        }
      }),
      status: StatusType.ACTIVE,
      created_at: now,
      updated_at: now
    }
  ];

  await knex('staff').insert(staffData);
  return staffData.map(staff => staff.id);
}

/**
 * Creates sample staff qualifications linked to the sample staff
 * 
 * @param knex - Knex instance
 * @param staffIds - Array of staff IDs to create qualifications for
 * @returns Promise resolving when sample qualifications are created
 */
async function createSampleQualifications(knex: Knex, staffIds: string[]): Promise<void> {
  // First, get service type IDs from the service_types table
  const serviceTypes = await knex('service_types').select('id').limit(5);
  if (serviceTypes.length === 0) {
    // If no service types exist, we can't create qualifications
    return;
  }

  const now = new Date();
  const qualificationsData = [];

  // Create qualifications for each staff member
  for (const staffId of staffIds) {
    // Each staff member gets 1-3 qualifications
    const numQualifications = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numQualifications; i++) {
      // Pick a random service type
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      
      // Create a qualification with random dates
      qualificationsData.push({
        id: uuidv4(),
        staff_id: staffId,
        service_type_id: serviceType.id,
        effective_date: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)), // Random date in the past year
        expiration_date: Math.random() > 0.3 ? new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)) : null, // 70% chance to have an expiration date
        certification_number: Math.random() > 0.5 ? `CERT-${Math.floor(Math.random() * 10000)}` : null, // 50% chance to have a certification number
        notes: Math.random() > 0.7 ? 'Sample qualification notes' : null, // 30% chance to have notes
        created_at: now,
        updated_at: now
      });
    }
  }

  if (qualificationsData.length > 0) {
    await knex('staff_qualifications').insert(qualificationsData);
  }
}

/**
 * Creates sample staff program assignments linked to the sample staff
 * 
 * @param knex - Knex instance
 * @param staffIds - Array of staff IDs to create program assignments for
 * @returns Promise resolving when sample program assignments are created
 */
async function createSampleProgramAssignments(knex: Knex, staffIds: string[]): Promise<void> {
  // First, get program IDs from the programs table
  const programs = await knex('programs').select('id').limit(5);
  if (programs.length === 0) {
    // If no programs exist, we can't create assignments
    return;
  }

  const now = new Date();
  const assignmentsData = [];

  // Create program assignments for each staff member
  for (const staffId of staffIds) {
    // Each staff member gets 1-2 program assignments
    const numAssignments = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numAssignments; i++) {
      // Pick a random program
      const program = programs[Math.floor(Math.random() * programs.length)];
      
      // Create an assignment with random dates
      assignmentsData.push({
        id: uuidv4(),
        staff_id: staffId,
        program_id: program.id,
        start_date: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)), // Random date in the past year
        end_date: Math.random() > 0.7 ? new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)) : null, // 30% chance to have an end date
        is_primary: i === 0, // First assignment is primary
        created_at: now,
        updated_at: now
      });
    }
  }

  if (assignmentsData.length > 0) {
    await knex('staff_program_assignments').insert(assignmentsData);
  }
}