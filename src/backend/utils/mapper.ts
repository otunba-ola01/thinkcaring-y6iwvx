/**
 * Utility functions for mapping data between different structures in the HCBS Revenue Management System.
 * This file provides generic mapping functions to transform data between database records,
 * API responses, and domain models with type safety and consistent formatting.
 */

import { snakeToCamelCase, camelToSnakeCase } from './string';
import { pick, omit, deepClone } from './object';

/**
 * Maps object keys using a transformation function
 * 
 * @param obj - The object to transform
 * @param transformFn - Function to transform keys
 * @returns Object with transformed keys
 */
export function mapKeys(obj: Record<string, any>, transformFn: (key: string) => string): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const transformedKey = transformFn(key);
    result[transformedKey] = obj[key];
  });
  
  return result;
}

/**
 * Maps object values using a transformation function
 * 
 * @param obj - The object to transform
 * @param transformFn - Function to transform values
 * @returns Object with transformed values
 */
export function mapValues(obj: Record<string, any>, transformFn: (value: any, key: string) => any): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    result[key] = transformFn(obj[key], key);
  });
  
  return result;
}

/**
 * Maps both keys and values of an object using transformation functions
 * 
 * @param obj - The object to transform
 * @param keyTransformFn - Function to transform keys
 * @param valueTransformFn - Function to transform values
 * @returns Object with transformed keys and values
 */
export function mapObject(
  obj: Record<string, any>,
  keyTransformFn: (key: string) => string,
  valueTransformFn: (value: any, key: string) => any
): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const transformedKey = keyTransformFn(key);
    result[transformedKey] = valueTransformFn(obj[key], key);
  });
  
  return result;
}

/**
 * Converts all object keys from snake_case to camelCase
 * 
 * @param obj - The object to transform
 * @returns Object with camelCase keys
 */
export function snakeToCamelCaseObject(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  // Handle arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (item !== null && typeof item === 'object') {
        return snakeToCamelCaseObject(item);
      }
      return item;
    });
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const camelKey = snakeToCamelCase(key);
    const value = obj[key];
    
    // Recursively process nested objects and arrays
    if (value !== null && typeof value === 'object') {
      result[camelKey] = snakeToCamelCaseObject(value);
    } else {
      result[camelKey] = value;
    }
  });
  
  return result;
}

/**
 * Converts all object keys from camelCase to snake_case
 * 
 * @param obj - The object to transform
 * @returns Object with snake_case keys
 */
export function camelToSnakeCaseObject(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  // Handle arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (item !== null && typeof item === 'object') {
        return camelToSnakeCaseObject(item);
      }
      return item;
    });
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = camelToSnakeCase(key);
    const value = obj[key];
    
    // Recursively process nested objects and arrays
    if (value !== null && typeof value === 'object') {
      result[snakeKey] = camelToSnakeCaseObject(value);
    } else {
      result[snakeKey] = value;
    }
  });
  
  return result;
}

/**
 * Maps a database record to a model object with camelCase keys
 * 
 * @param dbRecord - Database record with snake_case keys
 * @returns Model object with camelCase keys
 */
export function dbToModel<T extends Record<string, any>>(dbRecord: Record<string, any>): T {
  if (!dbRecord) {
    return {} as T;
  }
  
  const model = snakeToCamelCaseObject(dbRecord);
  
  // Parse JSON string fields if needed
  Object.keys(model).forEach(key => {
    const value = model[key];
    
    // Check if it's a JSON string that needs parsing
    if (typeof value === 'string' && (
      (value.startsWith('{') && value.endsWith('}')) || 
      (value.startsWith('[') && value.endsWith(']'))
    )) {
      try {
        model[key] = JSON.parse(value);
      } catch (err) {
        // Keep as string if parsing fails
      }
    }
    
    // Convert date strings to Date objects if needed
    if (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        model[key] = date;
      }
    }
  });
  
  return model as T;
}

/**
 * Maps a model object to a database record with snake_case keys
 * 
 * @param modelObject - Model object with camelCase keys
 * @returns Database record with snake_case keys
 */
export function modelToDb<T extends Record<string, any>>(modelObject: T): Record<string, any> {
  if (!modelObject) {
    return {};
  }
  
  const dbRecord = camelToSnakeCaseObject(deepClone(modelObject));
  
  // Process special fields for database storage
  Object.keys(dbRecord).forEach(key => {
    const value = dbRecord[key];
    
    // Convert complex objects to JSON strings if needed
    if (value !== null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      // Check if this is an object that should be stored as JSON
      if (key.endsWith('_json') || key.endsWith('_data') || key.endsWith('_metadata')) {
        dbRecord[key] = JSON.stringify(value);
      }
    }
    
    // Format Date objects for database
    if (value instanceof Date) {
      // Use ISO string for timestamp columns
      if (key.endsWith('_at') || key.endsWith('_date') || key === 'created_at' || key === 'updated_at') {
        dbRecord[key] = value.toISOString();
      }
    }
  });
  
  return dbRecord;
}

/**
 * Maps an API request object to a model object
 * 
 * @param apiObject - API request object
 * @returns Model object
 */
export function apiToModel<T extends Record<string, any>>(apiObject: Record<string, any>): T {
  if (!apiObject) {
    return {} as T;
  }
  
  // Create a deep clone to avoid mutating the input
  const model = deepClone(apiObject);
  
  // Transform specific fields as needed
  Object.keys(model).forEach(key => {
    const value = model[key];
    
    // Convert ISO date strings to Date objects
    if (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        model[key] = date;
      }
    }
    
    // Convert numeric strings to numbers if appropriate
    if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
      // Check if the field name suggests it should be a number
      if (key.endsWith('Id') || 
          key.endsWith('Count') || 
          key.endsWith('Amount') || 
          key.endsWith('Price') || 
          key.endsWith('Rate') ||
          key.endsWith('Quantity') ||
          key.endsWith('Units')) {
        model[key] = Number(value);
      }
    }
  });
  
  return model as T;
}

/**
 * Maps a model object to an API response object
 * 
 * @param modelObject - Model object
 * @returns API response object
 */
export function modelToApi<T extends Record<string, any>>(modelObject: T): Record<string, any> {
  if (!modelObject) {
    return {};
  }
  
  // Create a deep clone to avoid mutating the input
  const apiObject = deepClone(modelObject);
  
  // Remove sensitive or internal fields
  const sensitiveFields = ['password', 'passwordHash', 'internalNotes', 'metadata'];
  
  sensitiveFields.forEach(field => {
    if (field in apiObject) {
      delete apiObject[field];
    }
  });
  
  // Format data for API consumption
  Object.keys(apiObject).forEach(key => {
    const value = apiObject[key];
    
    // Format dates to ISO strings
    if (value instanceof Date) {
      apiObject[key] = value.toISOString();
    }
    
    // Format monetary values to have 2 decimal places
    if (typeof value === 'number' && (
      key.endsWith('Amount') || 
      key.endsWith('Price') || 
      key.endsWith('Rate')
    )) {
      apiObject[key] = Number(value.toFixed(2));
    }
  });
  
  return apiObject;
}

/**
 * Maps a collection of objects using a mapping function
 * 
 * @param collection - Array of objects to map
 * @param mapFn - Mapping function to apply to each item
 * @returns Mapped collection
 */
export function mapCollection<T extends Record<string, any>, U extends Record<string, any>>(
  collection: T[],
  mapFn: (item: T) => U
): U[] {
  if (!collection || !Array.isArray(collection) || collection.length === 0) {
    return [];
  }
  
  return collection.map(mapFn);
}

/**
 * Flattens a nested object structure into a single-level object with path-based keys
 * 
 * @param obj - The object to flatten
 * @param prefix - Optional prefix for keys
 * @param delimiter - Delimiter for path segments (default: '.')
 * @returns Flattened object
 */
export function flattenObject(
  obj: Record<string, any>, 
  prefix: string = '', 
  delimiter: string = '.'
): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const prefixedKey = prefix ? `${prefix}${delimiter}${key}` : key;
    const value = obj[key];
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value, prefixedKey, delimiter));
    } else {
      // Add leaf values to result
      result[prefixedKey] = value;
    }
  });
  
  return result;
}

/**
 * Converts a flattened object back into a nested object structure
 * 
 * @param obj - The flattened object
 * @param delimiter - Delimiter used in path segments (default: '.')
 * @returns Nested object
 */
export function unflattenObject(
  obj: Record<string, any>, 
  delimiter: string = '.'
): Record<string, any> {
  if (!obj) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    // Skip empty or undefined values
    if (obj[key] === undefined) return;
    
    const parts = key.split(delimiter);
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // Create path if it doesn't exist
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    // Set the value at the final path location
    current[parts[parts.length - 1]] = obj[key];
  });
  
  return result;
}

/**
 * Transforms date strings between different formats
 * 
 * @param date - Date string or Date object to transform
 * @param targetFormat - Format to convert to (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
 * @returns Formatted date string or null if input is invalid
 */
export function transformDate(
  date: string | Date | null | undefined,
  targetFormat: string
): string | null {
  if (!date) {
    return null;
  }
  
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  // Format the date according to targetFormat
  switch (targetFormat) {
    case 'ISO':
      return dateObj.toISOString();
    case 'YYYY-MM-DD':
      return dateObj.toISOString().split('T')[0];
    case 'MM/DD/YYYY': {
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${month}/${day}/${year}`;
    }
    case 'YYYY-MM-DD HH:mm:ss': {
      const date = dateObj.toISOString().split('T')[0];
      const time = dateObj.toTimeString().split(' ')[0];
      return `${date} ${time}`;
    }
    default:
      return dateObj.toISOString();
  }
}

/**
 * Maps enum values between different representations
 * 
 * @param value - Source enum value
 * @param sourceEnum - Source enum object
 * @param targetEnum - Target enum object
 * @returns Mapped enum value or null if mapping not found
 */
export function transformEnum<T extends string | number>(
  value: T | null | undefined,
  sourceEnum: Record<string, any>,
  targetEnum: Record<string, any>
): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Find the enum key that matches the value
  const key = Object.keys(sourceEnum).find(k => sourceEnum[k] === value);
  
  if (!key) {
    return null;
  }
  
  // Return the corresponding value from the target enum
  return targetEnum[key] !== undefined ? targetEnum[key] as T : null;
}