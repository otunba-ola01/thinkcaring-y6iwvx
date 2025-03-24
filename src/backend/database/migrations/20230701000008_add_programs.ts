import * as Knex from 'knex'; // v2.4.2
import { Transaction, MigrationTableName } from '../../types/database.types';

/**
 * Creates the programs table and related tables for HCBS service programs,
 * service codes, and rate schedules
 */
export async function up(knex: Knex): Promise<void> {
  // Create programs table
  await knex.schema.createTable('programs', (table) => {
    // Primary key
    table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic program information
    table.string('name', 255).notNullable();
    table.string('code', 50).notNullable().unique();
    table.text('description');
    table.string('type', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('active');
    
    // Program configuration
    table.string('funding_source', 100);
    table.string('billing_frequency', 50);
    table.date('start_date');
    table.date('end_date');
    
    // Billing configuration
    table.uuid('payer_id').references('id').inTable('payers').onDelete('SET NULL');
    table.string('contract_number', 100);
    table.boolean('requires_authorization').defaultTo(false);
    
    // Requirements
    table.jsonb('documentation_requirements');
    table.jsonb('billing_requirements');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['status', 'deleted_at']);
    table.index(['payer_id']);
  });

  // Create service_codes table
  await knex.schema.createTable('service_codes', (table) => {
    // Primary key
    table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key to programs
    table.uuid('program_id').references('id').inTable('programs').notNullable().onDelete('CASCADE');
    
    // Service code information
    table.string('code', 50).notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('category', 100);
    table.string('unit', 50); // hour, day, visit, etc.
    
    // Service limitations
    table.integer('max_units_per_day');
    table.integer('max_units_per_week');
    table.integer('max_units_per_month');
    
    // Service requirements
    table.boolean('requires_documentation').defaultTo(true);
    
    // Status
    table.string('status', 20).notNullable().defaultTo('active');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('deleted_at');
    
    // Unique constraint
    table.unique(['program_id', 'code']);
    
    // Indexes
    table.index(['program_id', 'status', 'deleted_at']);
  });

  // Create rate_schedules table
  await knex.schema.createTable('rate_schedules', (table) => {
    // Primary key
    table.uuid('id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign keys
    table.uuid('program_id').references('id').inTable('programs').notNullable().onDelete('CASCADE');
    table.uuid('service_code_id').references('id').inTable('service_codes').notNullable().onDelete('CASCADE');
    table.uuid('payer_id').references('id').inTable('payers').onDelete('SET NULL');
    
    // Rate information
    table.date('effective_date').notNullable();
    table.date('end_date');
    table.decimal('rate', 10, 2).notNullable();
    table.string('modifier', 50);
    table.string('description', 255);
    
    // Status
    table.string('status', 20).notNullable().defaultTo('active');
    
    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['program_id', 'service_code_id', 'status']);
    table.index(['effective_date', 'end_date']);
    table.index(['payer_id']);
  });
}

/**
 * Drops the programs table and related tables
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await knex.schema.dropTableIfExists('rate_schedules');
  await knex.schema.dropTableIfExists('service_codes');
  await knex.schema.dropTableIfExists('programs');
}