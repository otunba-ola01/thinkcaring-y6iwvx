import * as Knex from 'knex'; // v2.4.2
import { Transaction } from '../../types/database.types';
import { SettingDataType, SettingCategory } from '../../models/setting.model';

/**
 * Migration: Create Settings Table
 * 
 * This migration creates a table for storing system-wide configuration, organization settings,
 * and user preferences in the HCBS Revenue Management System. The settings table is designed
 * to store key-value pairs with additional metadata to control application behavior.
 * 
 * Each setting has a unique key, a value (stored as a string but typed with dataType),
 * a category for organizational purposes, and flags to control editability and visibility.
 */

/**
 * Creates the settings table with all necessary columns and constraints
 * 
 * @param {Knex} knex - The Knex instance
 * @returns {Promise<void>} A promise that resolves when the migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('settings');
  
  if (!tableExists) {
    await knex.schema.createTable('settings', (table) => {
      // Primary key
      table.uuid('id').primary().notNullable();
      
      // Core settings fields
      table.string('key').unique().notNullable().comment('Unique identifier for the setting');
      table.text('value').notNullable().comment('Setting value stored as string');
      table.string('description').notNullable().comment('Human-readable description of the setting');
      table.string('category').notNullable().comment('Category for grouping settings');
      table.string('data_type').notNullable().comment('Data type for type conversion');
      table.boolean('is_editable').notNullable().defaultTo(true).comment('Whether the setting can be edited by users');
      table.boolean('is_hidden').notNullable().defaultTo(false).comment('Whether the setting should be hidden in UI');
      table.jsonb('metadata').notNullable().defaultTo('{}').comment('Additional metadata (validation rules, options, etc.)');
      
      // Audit columns
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable();
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('updated_by').notNullable();
      
      // Indexes
      table.index('category');
      table.index('created_at');
    });
    
    // Add check constraints for enum values
    const categoryValues = Object.values(SettingCategory).map(v => `'${v}'`).join(', ');
    const dataTypeValues = Object.values(SettingDataType).map(v => `'${v}'`).join(', ');
    
    await knex.raw(`
      ALTER TABLE settings 
      ADD CONSTRAINT settings_category_check 
      CHECK (category IN (${categoryValues}))
    `);
    
    await knex.raw(`
      ALTER TABLE settings 
      ADD CONSTRAINT settings_data_type_check 
      CHECK (data_type IN (${dataTypeValues}))
    `);
  }
}

/**
 * Drops the settings table when rolling back the migration
 * 
 * @param {Knex} knex - The Knex instance
 * @returns {Promise<void>} A promise that resolves when the rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('settings');
  
  if (tableExists) {
    await knex.schema.dropTable('settings');
  }
}