import { Transaction } from '../../types/database.types';
import * as Knex from 'knex'; // v2.4.2

/**
 * Migration to create authorization tables for tracking service authorizations
 * 
 * This migration creates three tables:
 * 1. authorizations - Main table for service authorizations
 * 2. authorization_service_types - Junction table linking authorizations to service types
 * 3. authorization_utilization - Table for tracking utilization of authorized units
 * 
 * These tables support the Authorization Tracking requirement (F-403) which
 * prevents billing for unauthorized services by tracking service authorizations
 * and limits.
 * 
 * @param knex - Knex instance
 */
export async function up(knex: Knex): Promise<void> {
  // Create authorizations table
  await knex.schema.createTable('authorizations', (table) => {
    table.uuid('id').primary();
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE')
      .comment('Reference to the client receiving services');
    table.uuid('program_id').notNullable().references('id').inTable('programs').onDelete('CASCADE')
      .comment('Reference to the program providing services');
    table.string('authorization_number', 100).notNullable()
      .comment('External authorization reference number');
    table.enum('status', [
      'requested', 'approved', 'active', 'expiring', 'expired', 'denied', 'cancelled'
    ]).notNullable().defaultTo('active')
      .comment('Current status of the authorization');
    table.date('start_date').notNullable()
      .comment('Date when the authorization becomes effective');
    table.date('end_date').notNullable()
      .comment('Date when the authorization expires');
    table.string('authorized_by', 255).nullable()
      .comment('Name or ID of authorizing entity');
    table.date('authorized_date').nullable()
      .comment('Date when authorization was granted');
    table.text('notes').nullable()
      .comment('Additional notes or comments about the authorization');
    
    // Auditing fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').nullable();
    table.uuid('updated_by').nullable();
    
    // Indexes for frequent queries
    table.index(['client_id']);
    table.index(['program_id']);
    table.index(['status']);
    table.index(['start_date', 'end_date']);
    table.index(['authorization_number']);
  });
  
  // Create authorization_service_types junction table
  await knex.schema.createTable('authorization_service_types', (table) => {
    table.uuid('id').primary();
    table.uuid('authorization_id').notNullable()
      .references('id').inTable('authorizations').onDelete('CASCADE')
      .comment('Reference to the parent authorization');
    table.uuid('service_type_id').notNullable()
      .references('id').inTable('service_types').onDelete('CASCADE')
      .comment('Reference to the authorized service type');
    table.decimal('authorized_units', 12, 2).notNullable().defaultTo(0)
      .comment('Total authorized units for this service type');
    table.decimal('units_per_day', 8, 2).nullable()
      .comment('Maximum units allowed per day, if applicable');
    table.decimal('units_per_week', 8, 2).nullable()
      .comment('Maximum units allowed per week, if applicable');
    table.decimal('units_per_month', 10, 2).nullable()
      .comment('Maximum units allowed per month, if applicable');
    table.decimal('rate', 10, 2).nullable()
      .comment('Authorized rate for this service, if specified');
    table.date('effective_date').nullable()
      .comment('Date when this service authorization becomes effective, defaults to authorization start_date if null');
    table.date('end_date').nullable()
      .comment('Date when this service authorization expires, defaults to authorization end_date if null');
    
    // Auditing fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Unique constraint to prevent duplicates
    table.unique(['authorization_id', 'service_type_id']);
    
    // Indexes for frequent queries
    table.index(['authorization_id']);
    table.index(['service_type_id']);
  });
  
  // Create authorization_utilization table for tracking usage
  await knex.schema.createTable('authorization_utilization', (table) => {
    table.uuid('id').primary();
    table.uuid('authorization_id').notNullable()
      .references('id').inTable('authorizations').onDelete('CASCADE')
      .comment('Reference to the parent authorization');
    table.uuid('service_type_id').notNullable()
      .references('id').inTable('service_types').onDelete('CASCADE')
      .comment('Reference to the service type being tracked');
    table.decimal('used_units', 12, 2).notNullable().defaultTo(0)
      .comment('Total units used against this authorization');
    table.decimal('remaining_units', 12, 2).notNullable()
      .comment('Remaining available units');
    table.decimal('last_update_amount', 12, 2).nullable()
      .comment('Amount of units in the last update');
    table.timestamp('last_updated').notNullable().defaultTo(knex.fn.now())
      .comment('Timestamp of the last utilization update');
    table.uuid('last_updated_by').nullable()
      .comment('User who last updated utilization');
    
    // Unique constraint to prevent duplicates
    table.unique(['authorization_id', 'service_type_id']);
    
    // Indexes for frequent queries
    table.index(['authorization_id']);
    table.index(['service_type_id']);
  });
}

/**
 * Migration to drop authorization tables
 * 
 * This drops all tables created in the up migration in reverse order
 * to respect foreign key constraints.
 * 
 * @param knex - Knex instance
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('authorization_utilization');
  await knex.schema.dropTableIfExists('authorization_service_types');
  await knex.schema.dropTableIfExists('authorizations');
}