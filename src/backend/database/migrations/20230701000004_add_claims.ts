import { Transaction } from '../../types/database.types';
import * as Knex from 'knex'; // v2.4.2

/**
 * Migration to create claims-related tables for the HCBS Revenue Management System
 * 
 * Creates the following tables:
 * - claims: Main table for storing claim information
 * - claim_status_history: Table for tracking status changes
 * - service_claims: Junction table to associate services with claims
 * 
 * @param knex - Knex instance
 * @returns Promise resolving when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Create claims table
  await knex.schema.createTable('claims', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('claim_number', 50).unique().index();
    table.uuid('payer_id').notNullable().references('id').inTable('payers');
    table.uuid('client_id').notNullable().references('id').inTable('clients');
    table.date('submission_date');
    table.enum('claim_status', [
      'draft',
      'validated',
      'submitted',
      'acknowledged',
      'pending',
      'paid',
      'denied',
      'appealed',
      'void'
    ]).notNullable().defaultTo('draft');
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.date('adjudication_date');
    table.string('denial_reason', 100);
    table.jsonb('adjustment_codes');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').notNullable();

    // Indexes for performance
    table.index('claim_status');
    table.index('submission_date');
    table.index('payer_id');
    table.index('client_id');
  });

  // Create claim_status_history table
  await knex.schema.createTable('claim_status_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('claim_id').notNullable().references('id').inTable('claims').onDelete('CASCADE');
    table.enum('status', [
      'draft',
      'validated',
      'submitted',
      'acknowledged',
      'pending',
      'paid',
      'denied',
      'appealed',
      'void'
    ]).notNullable();
    table.timestamp('effective_date').notNullable().defaultTo(knex.fn.now());
    table.string('reason', 255);
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();

    // Indexes for performance
    table.index('claim_id');
    table.index('status');
    table.index('effective_date');
  });

  // Create service_claims junction table
  await knex.schema.createTable('service_claims', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('service_id').notNullable().references('id').inTable('services');
    table.uuid('claim_id').notNullable().references('id').inTable('claims').onDelete('CASCADE');
    table.integer('service_line_number').notNullable();
    table.decimal('billed_units', 8, 2).notNullable();
    table.decimal('billed_amount', 10, 2).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable();

    // Indexes for performance
    table.index('service_id');
    table.index('claim_id');
    
    // Composite unique constraint
    table.unique(['claim_id', 'service_line_number']);
    table.unique(['claim_id', 'service_id']);
  });
}

/**
 * Migration to drop claims-related tables
 * 
 * Drops the following tables:
 * - service_claims
 * - claim_status_history
 * - claims
 * 
 * @param knex - Knex instance
 * @returns Promise resolving when all tables are dropped
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order to avoid foreign key constraints
  await knex.schema.dropTableIfExists('service_claims');
  await knex.schema.dropTableIfExists('claim_status_history');
  await knex.schema.dropTableIfExists('claims');
}