/**
 * Migration: Create audit_logs table
 * 
 * This migration creates the audit_logs table for comprehensive tracking of user activities,
 * system events, and data changes in the HCBS Revenue Management System. It supports
 * HIPAA compliance requirements for maintaining detailed audit trails.
 * 
 * The audit_logs table captures the following information:
 * - User identification (who performed the action)
 * - Timestamp (when the action occurred)
 * - Event type and resource type (what kind of action on what type of resource)
 * - Resource identifier (which specific entity was affected)
 * - Before and after states (what changed)
 * - Contextual information (IP address, user agent, severity, etc.)
 */

import { Knex } from 'knex'; // v2.4.2
import { Transaction, MigrationTableName } from '../../types/database.types';

/**
 * Creates the audit_logs table.
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when the migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Check if the table already exists
  const tableExists = await knex.schema.hasTable('audit_logs');
  
  if (!tableExists) {
    // Create the audit_logs table
    await knex.schema.createTable('audit_logs', (table) => {
      // Primary key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      
      // When the event occurred
      table.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      
      // Who performed the action (if a user was involved)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('user_name', 255).nullable().comment('Denormalized username for easier querying');
      
      // What kind of action and what type of resource
      table.string('event_type', 50).notNullable().comment('CREATE, READ, UPDATE, DELETE, LOGIN, etc.');
      table.string('resource_type', 50).notNullable().comment('USER, CLIENT, SERVICE, CLAIM, etc.');
      table.uuid('resource_id').nullable().comment('Identifier of the specific resource affected');
      
      // Description of what happened
      table.text('description').notNullable();
      
      // Source information
      table.string('ip_address', 45).nullable().comment('Source IP address (IPv4 or IPv6)');
      table.string('user_agent', 512).nullable().comment('Browser/client information');
      
      // Importance level
      table.string('severity', 20).notNullable().defaultTo('INFO')
        .comment('INFO, WARNING, ERROR, CRITICAL');
      
      // Additional context and state data
      table.jsonb('metadata').nullable().comment('Additional contextual information');
      table.jsonb('before_state').nullable().comment('State of the resource before changes');
      table.jsonb('after_state').nullable().comment('State of the resource after changes');
    });

    // Create indexes for common query patterns
    await knex.schema.raw(`
      CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);
      CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
      CREATE INDEX idx_audit_logs_event_type ON audit_logs (event_type);
      CREATE INDEX idx_audit_logs_resource_type ON audit_logs (resource_type);
      CREATE INDEX idx_audit_logs_resource_id ON audit_logs (resource_id);
      CREATE INDEX idx_audit_logs_severity ON audit_logs (severity);
    `);

    // Create a composite index for common filtering scenarios
    await knex.schema.raw(`
      CREATE INDEX idx_audit_logs_resource_event ON audit_logs (resource_type, event_type, timestamp DESC);
    `);

    console.log('Created audit_logs table');
  } else {
    console.log('audit_logs table already exists, skipping creation');
  }
}

/**
 * Drops the audit_logs table.
 * 
 * @param knex - The Knex instance
 * @returns Promise that resolves when the migration is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop the table if it exists
  if (await knex.schema.hasTable('audit_logs')) {
    await knex.schema.dropTable('audit_logs');
    console.log('Dropped audit_logs table');
  }
}