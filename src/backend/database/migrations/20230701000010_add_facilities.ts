import { Knex } from 'knex'; // v2.4.2
import { Transaction, MigrationTableName } from '../../types/database.types';

/**
 * Migration function to create the facilities table
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when the facilities table is created
 */
export async function up(knex: Knex): Promise<void> {
  // Create the facilities table
  await knex.schema.createTable('facilities', (table) => {
    // Primary key
    // Note: This assumes uuid-ossp extension is enabled in PostgreSQL
    // If not available, remove defaultTo and generate UUIDs in the application
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Facility information
    table.string('name', 255).notNullable();
    table.string('type', 50).notNullable().comment('RESIDENTIAL, DAY_PROGRAM, CLINIC, HOME, COMMUNITY, ADMINISTRATIVE, OTHER');
    table.string('license_number', 100);
    table.date('license_expiration_date');
    table.jsonb('address').comment('Structured address data');
    table.jsonb('contact_info').comment('Phone, email, website, contact person');
    table.string('status', 20).notNullable().defaultTo('ACTIVE').comment('ACTIVE, INACTIVE, PENDING');
    table.text('notes');
    
    // Audit columns
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('deleted_at');
    table.uuid('deleted_by');
    
    // Indexes for performance
    table.index(['name'], 'idx_facilities_name');
    table.index(['type'], 'idx_facilities_type');
    table.index(['status'], 'idx_facilities_status');
    table.unique(['name', 'type'], 'uq_facilities_name_type');
  });
}

/**
 * Migration function to drop the facilities table
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when the facilities table is dropped
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('facilities');
}