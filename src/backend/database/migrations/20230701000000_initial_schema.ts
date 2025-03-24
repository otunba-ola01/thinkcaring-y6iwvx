import { Knex } from 'knex'; // v2.4.2
import { Transaction, MigrationTableName } from '../../types/database.types';

/**
 * Initial database migration that establishes the core schema for the HCBS Revenue Management System.
 * This migration creates all foundational tables including users, roles, permissions, clients,
 * services, claims, payments, and other essential entities required for the application's data model.
 */
export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension if not already enabled
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // User Management Tables
  
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('username', 50).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('password').notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('last_login').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();
    
    // Indexes
    table.index(['username']);
    table.index(['email']);
    table.index(['status']);
  });

  // Create roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).notNullable().unique();
    table.string('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes
    table.index(['name']);
  });

  // Create permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique();
    table.string('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes
    table.index(['name']);
  });

  // Create role_permissions junction table
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('role_id').notNullable();
    table.uuid('permission_id').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    
    // Foreign keys
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    
    // Constraints
    table.unique(['role_id', 'permission_id']);
    
    // Indexes
    table.index(['role_id']);
    table.index(['permission_id']);
  });

  // Create user_roles junction table
  await knex.schema.createTable('user_roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.uuid('role_id').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    
    // Constraints
    table.unique(['user_id', 'role_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['role_id']);
  });

  // Program and Payer Tables
  
  // Create programs table
  await knex.schema.createTable('programs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.string('description').nullable();
    table.string('funding_source', 50).nullable();
    table.jsonb('settings').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();
    
    // Indexes
    table.index(['code']);
    table.index(['status']);
  });

  // Create payers table
  await knex.schema.createTable('payers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('payer_type', 50).notNullable();
    table.string('identifier', 50).nullable();
    table.jsonb('contact_info').nullable();
    table.jsonb('submission_settings').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();
    
    // Indexes
    table.index(['name']);
    table.index(['payer_type']);
    table.index(['status']);
  });

  // Create facilities table
  await knex.schema.createTable('facilities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.jsonb('address').notNullable();
    table.jsonb('contact_info').nullable();
    table.string('license_number', 50).nullable();
    table.date('license_expiration').nullable();
    table.string('npi', 50).nullable();
    table.string('tax_id', 50).nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();
    
    // Indexes
    table.index(['name']);
    table.index(['npi']);
    table.index(['status']);
  });

  // Client and Staff Tables
  
  // Create clients table
  await knex.schema.createTable('clients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.date('date_of_birth').notNullable();
    table.string('gender', 20).nullable();
    table.string('medicaid_id', 50).nullable().unique();
    table.string('medicare_id', 50).nullable().unique();
    table.jsonb('address').nullable();
    table.jsonb('contact_info').nullable();
    table.jsonb('identifiers').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Indexes
    table.index(['last_name', 'first_name']);
    table.index(['medicaid_id']);
    table.index(['medicare_id']);
    table.index(['status']);
    table.index(['date_of_birth']);
  });

  // Create staff table
  await knex.schema.createTable('staff', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.jsonb('contact_info').nullable();
    table.string('title', 100).nullable();
    table.string('npi', 50).nullable().unique();
    table.string('license_number', 50).nullable();
    table.date('license_expiration').nullable();
    table.jsonb('credentials').nullable();
    table.uuid('user_id').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['last_name', 'first_name']);
    table.index(['npi']);
    table.index(['status']);
    table.index(['user_id']);
  });

  // Service-related Tables
  
  // Create service_types table
  await knex.schema.createTable('service_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.string('description').nullable();
    table.uuid('program_id').nullable();
    table.decimal('default_rate', 10, 2).nullable();
    table.string('billing_unit', 20).nullable();
    table.jsonb('documentation_requirements').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Foreign keys
    table.foreign('program_id').references('id').inTable('programs').onDelete('SET NULL');
    
    // Indexes
    table.index(['code']);
    table.index(['program_id']);
    table.index(['status']);
  });

  // Create client_programs junction table
  await knex.schema.createTable('client_programs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable();
    table.uuid('program_id').notNullable();
    table.date('enrollment_date').notNullable();
    table.date('disenrollment_date').nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.jsonb('enrollment_details').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('program_id').references('id').inTable('programs').onDelete('CASCADE');
    
    // Indexes
    table.index(['client_id']);
    table.index(['program_id']);
    table.index(['status']);
    table.index(['enrollment_date', 'disenrollment_date']);
  });

  // Create authorizations table
  await knex.schema.createTable('authorizations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable();
    table.uuid('program_id').notNullable();
    table.uuid('service_type_id').notNullable();
    table.string('authorization_number', 100).nullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('authorized_units', 10, 2).notNullable();
    table.decimal('used_units', 10, 2).notNullable().defaultTo(0);
    table.decimal('rate', 10, 2).nullable();
    table.string('frequency', 50).nullable();
    table.string('status', 20).notNullable();
    table.jsonb('authorization_details').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('program_id').references('id').inTable('programs').onDelete('CASCADE');
    table.foreign('service_type_id').references('id').inTable('service_types').onDelete('CASCADE');
    
    // Indexes
    table.index(['client_id']);
    table.index(['authorization_number']);
    table.index(['start_date', 'end_date']);
    table.index(['status']);
    table.index(['service_type_id']);
  });

  // Create services table
  await knex.schema.createTable('services', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('client_id').notNullable();
    table.uuid('service_type_id').notNullable();
    table.uuid('staff_id').nullable();
    table.uuid('facility_id').nullable();
    table.uuid('authorization_id').nullable();
    table.date('service_date').notNullable();
    table.time('start_time').nullable();
    table.time('end_time').nullable();
    table.decimal('units', 10, 2).notNullable();
    table.decimal('rate', 10, 2).notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('documentation_status', 20).notNullable();
    table.string('billing_status', 20).notNullable();
    table.text('notes').nullable();
    table.jsonb('service_details').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('service_type_id').references('id').inTable('service_types').onDelete('CASCADE');
    table.foreign('staff_id').references('id').inTable('staff').onDelete('SET NULL');
    table.foreign('facility_id').references('id').inTable('facilities').onDelete('SET NULL');
    table.foreign('authorization_id').references('id').inTable('authorizations').onDelete('SET NULL');
    
    // Indexes
    table.index(['client_id']);
    table.index(['service_type_id']);
    table.index(['staff_id']);
    table.index(['service_date']);
    table.index(['documentation_status']);
    table.index(['billing_status']);
    table.index(['authorization_id']);
  });

  // Claim and Payment Tables
  
  // Create claims table
  await knex.schema.createTable('claims', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('claim_number', 100).nullable().unique();
    table.uuid('payer_id').notNullable();
    table.date('service_start_date').notNullable();
    table.date('service_end_date').notNullable();
    table.date('submission_date').nullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('status', 20).notNullable();
    table.string('claim_type', 50).nullable();
    table.date('adjudication_date').nullable();
    table.string('denial_reason', 100).nullable();
    table.jsonb('adjustment_codes').nullable();
    table.jsonb('claim_details').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Foreign keys
    table.foreign('payer_id').references('id').inTable('payers').onDelete('CASCADE');
    
    // Indexes
    table.index(['claim_number']);
    table.index(['payer_id']);
    table.index(['submission_date']);
    table.index(['status']);
    table.index(['service_start_date', 'service_end_date']);
    table.index(['adjudication_date']);
  });

  // Create service_claims junction table
  await knex.schema.createTable('service_claims', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('service_id').notNullable();
    table.uuid('claim_id').notNullable();
    table.integer('service_line_number').nullable();
    table.decimal('billed_units', 10, 2).notNullable();
    table.decimal('billed_amount', 10, 2).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();

    // Foreign keys
    table.foreign('service_id').references('id').inTable('services').onDelete('CASCADE');
    table.foreign('claim_id').references('id').inTable('claims').onDelete('CASCADE');
    
    // Constraints
    table.unique(['service_id', 'claim_id']);
    
    // Indexes
    table.index(['service_id']);
    table.index(['claim_id']);
  });

  // Create payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('payer_id').notNullable();
    table.date('payment_date').notNullable();
    table.decimal('payment_amount', 10, 2).notNullable();
    table.string('payment_method', 20).notNullable();
    table.string('reference_number', 100).nullable();
    table.string('remittance_id', 100).nullable();
    table.string('reconciliation_status', 20).notNullable();
    table.jsonb('payment_details').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();

    // Foreign keys
    table.foreign('payer_id').references('id').inTable('payers').onDelete('CASCADE');
    
    // Indexes
    table.index(['payer_id']);
    table.index(['payment_date']);
    table.index(['reference_number']);
    table.index(['remittance_id']);
    table.index(['reconciliation_status']);
  });

  // Create claim_payments junction table
  await knex.schema.createTable('claim_payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('claim_id').notNullable();
    table.uuid('payment_id').notNullable();
    table.decimal('paid_amount', 10, 2).notNullable();
    table.jsonb('adjustment_codes').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();

    // Foreign keys
    table.foreign('claim_id').references('id').inTable('claims').onDelete('CASCADE');
    table.foreign('payment_id').references('id').inTable('payments').onDelete('CASCADE');
    
    // Indexes
    table.index(['claim_id']);
    table.index(['payment_id']);
  });

  // Supporting Tables
  
  // Create documents table
  await knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('document_type', 50).notNullable();
    table.string('file_name', 255).notNullable();
    table.string('file_path', 255).notNullable();
    table.string('mime_type', 100).nullable();
    table.integer('file_size').nullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    table.uuid('deleted_by').nullable();
    
    // Indexes
    table.index(['entity_type', 'entity_id']);
    table.index(['document_type']);
    table.index(['status']);
  });

  // Create audit_logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').nullable();
    table.string('action', 50).notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').nullable();
    table.jsonb('old_values').nullable();
    table.jsonb('new_values').nullable();
    table.string('ip_address', 50).nullable();
    table.string('user_agent').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['entity_type', 'entity_id']);
    table.index(['user_id']);
    table.index(['action']);
    table.index(['created_at']);
  });

  // Create settings table
  await knex.schema.createTable('settings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('key', 100).notNullable().unique();
    table.jsonb('value').notNullable();
    table.string('group', 50).nullable();
    table.string('description').nullable();
    table.boolean('is_system').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes
    table.index(['key']);
    table.index(['group']);
  });

  // Create notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.string('type', 20).notNullable();
    table.string('entity_type', 50).nullable();
    table.uuid('entity_id').nullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['is_read']);
    table.index(['entity_type', 'entity_id']);
    table.index(['type']);
    table.index(['created_at']);
  });
}

/**
 * Rolls back the initial database migration by dropping all tables in the correct order
 * to respect foreign key constraints.
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to respect foreign key constraints
  
  // Drop supporting tables
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('documents');
  
  // Drop claim and payment tables
  await knex.schema.dropTableIfExists('claim_payments');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('service_claims');
  await knex.schema.dropTableIfExists('claims');
  
  // Drop service-related tables
  await knex.schema.dropTableIfExists('services');
  await knex.schema.dropTableIfExists('authorizations');
  await knex.schema.dropTableIfExists('client_programs');
  await knex.schema.dropTableIfExists('service_types');
  
  // Drop client and staff tables
  await knex.schema.dropTableIfExists('staff');
  await knex.schema.dropTableIfExists('clients');
  
  // Drop program and payer tables
  await knex.schema.dropTableIfExists('facilities');
  await knex.schema.dropTableIfExists('payers');
  await knex.schema.dropTableIfExists('programs');
  
  // Drop user management tables
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}