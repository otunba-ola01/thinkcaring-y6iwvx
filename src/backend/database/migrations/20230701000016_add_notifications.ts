import * as Knex from 'knex'; // v2.4.2
import { Transaction } from '../../types/database.types';
import { 
  NotificationType, 
  NotificationSeverity, 
  NotificationStatus, 
  DeliveryMethod, 
  NotificationFrequency 
} from '../../types/notification.types';

/**
 * Migration to create the notification system tables in the HCBS Revenue Management System.
 * 
 * This migration establishes tables for storing notifications, user preferences,
 * delivery logs, and digest queues to support the notification capabilities 
 * required for alerting users about critical financial events and updates.
 */
export async function up(knex: Knex): Promise<void> {
  // Create notifications table
  await knex.schema.createTable('notifications', table => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign key to users
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Notification details
    table.string('type', 50).notNullable();
    table.string('severity', 20).notNullable().defaultTo(NotificationSeverity.MEDIUM);
    table.string('status', 20).notNullable().defaultTo(NotificationStatus.UNREAD);
    
    // Content stored as JSON
    table.jsonb('content').notNullable(); // Stores title, message, and data
    table.jsonb('actions').defaultTo('[]'); // Available actions for the notification
    
    // Timestamps
    table.timestamp('read_at').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable(); // For soft delete
    
    // Indexes for better performance
    table.index('user_id');
    table.index('type');
    table.index('severity');
    table.index('status');
    table.index('created_at');
    
    // Add check constraints for enum-like behavior
    table.raw(`ALTER TABLE notifications ADD CONSTRAINT check_notification_type 
              CHECK (type IN (${Object.values(NotificationType).map(v => `'${v}'`).join(', ')}))`);
    table.raw(`ALTER TABLE notifications ADD CONSTRAINT check_notification_severity 
              CHECK (severity IN (${Object.values(NotificationSeverity).map(v => `'${v}'`).join(', ')}))`);
    table.raw(`ALTER TABLE notifications ADD CONSTRAINT check_notification_status 
              CHECK (status IN (${Object.values(NotificationStatus).map(v => `'${v}'`).join(', ')}))`);
  });
  
  // Create notification_preferences table
  await knex.schema.createTable('notification_preferences', table => {
    // Primary key is the user ID (one row per user)
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    
    // Preferences stored as JSON objects
    table.jsonb('notification_types').notNullable().defaultTo('{}'); // Type-specific preferences
    table.jsonb('delivery_methods').notNullable().defaultTo('{}'); // Delivery method settings
    table.jsonb('quiet_hours').defaultTo(JSON.stringify({
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York',
      bypassForSeverity: [NotificationSeverity.CRITICAL]
    }));
    
    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Create notification_delivery_logs table
  await knex.schema.createTable('notification_delivery_logs', table => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign keys
    table.uuid('notification_id').notNullable().references('id').inTable('notifications').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Delivery details
    table.string('method', 20).notNullable();
    table.boolean('success').notNullable().defaultTo(false);
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.text('error').nullable();
    table.jsonb('metadata').defaultTo('{}');
    
    // Indexes
    table.index('notification_id');
    table.index('user_id');
    table.index('method');
    table.index('success');
    
    // Add check constraint for method
    table.raw(`ALTER TABLE notification_delivery_logs ADD CONSTRAINT check_delivery_method 
              CHECK (method IN (${Object.values(DeliveryMethod).map(v => `'${v}'`).join(', ')}))`);
  });

  // Create notification_digest_queue table
  await knex.schema.createTable('notification_digest_queue', table => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Foreign keys
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('notification_id').notNullable().references('id').inTable('notifications').onDelete('CASCADE');
    
    // Digest details
    table.string('method', 20).notNullable();
    table.string('frequency', 20).notNullable();
    table.timestamp('queued_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('sent_at').nullable();
    table.jsonb('content').notNullable(); // Content specific to this digest item
    
    // Indexes
    table.index('user_id');
    table.index('method');
    table.index('frequency');
    table.index('queued_at');
    table.index('sent_at');
    
    // Add check constraints
    table.raw(`ALTER TABLE notification_digest_queue ADD CONSTRAINT check_digest_method 
              CHECK (method IN (${Object.values(DeliveryMethod).map(v => `'${v}'`).join(', ')}))`);
    table.raw(`ALTER TABLE notification_digest_queue ADD CONSTRAINT check_digest_frequency 
              CHECK (frequency IN (${Object.values(NotificationFrequency).map(v => `'${v}'`).join(', ')}))`);
  });
}

/**
 * Migration to drop the notification system tables from the database.
 * 
 * This function removes all notification-related tables in the correct order
 * to respect foreign key constraints.
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation to respect foreign key constraints
  await knex.schema.dropTableIfExists('notification_digest_queue');
  await knex.schema.dropTableIfExists('notification_delivery_logs');
  await knex.schema.dropTableIfExists('notification_preferences');
  await knex.schema.dropTableIfExists('notifications');
}