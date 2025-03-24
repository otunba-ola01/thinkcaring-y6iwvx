import { ErrorCode } from '../types/error.types';
import { ApiError } from '../errors/api-error';
import { logger } from './logger';
import { deepClone } from './object';

/**
 * Options for customizing the serialization process
 */
export interface SerializationOptions {
  /**
   * Whether to handle circular references during serialization
   */
  circularReplacer?: boolean;
  
  /**
   * Whether to convert Date objects to ISO strings
   */
  dateToString?: boolean;
  
  /**
   * Whether to remove undefined values from the output
   */
  removeUndefined?: boolean;
  
  /**
   * Whether to remove null values from the output
   */
  removeNulls?: boolean;
  
  /**
   * Indentation space for pretty printing (number of spaces or string)
   */
  space?: number | string;
}

/**
 * Options for customizing the deserialization process
 */
export interface DeserializationOptions {
  /**
   * Whether to convert ISO date strings back to Date objects
   */
  stringToDate?: boolean;
  
  /**
   * Custom reviver function for JSON.parse
   */
  reviver?: (key: string, value: any) => any;
}

/**
 * Default serialization options
 */
export const DEFAULT_SERIALIZATION_OPTIONS: SerializationOptions = {
  circularReplacer: true,
  dateToString: true,
  removeUndefined: true,
  removeNulls: false
};

/**
 * Creates a replacer function that handles circular references in objects
 * 
 * @returns A replacer function for use with JSON.stringify
 */
export function createCircularReplacer(): (key: string, value: any) => any {
  const visited = new WeakMap();
  
  return function(key: string, value: any): any {
    // Handle primitives and null values
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    // Handle Date objects (preserve them for potential date replacer)
    if (value instanceof Date) {
      return value;
    }
    
    // Check for circular references
    if (visited.has(value)) {
      return '[Circular]';
    }
    
    // Add object to visited map and return the value
    visited.set(value, true);
    return value;
  };
}

/**
 * Creates a replacer function that converts Date objects to ISO strings
 * 
 * @returns A replacer function for use with JSON.stringify
 */
export function createDateReplacer(): (key: string, value: any) => any {
  return function(key: string, value: any): any {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };
}

/**
 * Creates a reviver function that converts ISO date strings back to Date objects
 * 
 * @returns A reviver function for use with JSON.parse
 */
export function createDateReviver(): (key: string, value: any) => any {
  return function(key: string, value: any): any {
    if (typeof value === 'string' && isISODateString(value)) {
      return new Date(value);
    }
    return value;
  };
}

/**
 * Checks if a string is in ISO date format
 * 
 * @param value - String to check
 * @returns True if the string is in ISO date format, false otherwise
 */
export function isISODateString(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // ISO 8601 date format regex pattern
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
  return isoDatePattern.test(value);
}

/**
 * Safely converts an object to a JSON string, handling circular references
 * and special data types
 * 
 * @param data - Data to serialize
 * @param options - Serialization options
 * @returns JSON string representation of the data
 */
export function safeStringify(data: any, options?: SerializationOptions): string {
  try {
    // Apply default options
    const opts = { ...DEFAULT_SERIALIZATION_OPTIONS, ...options };
    
    // Create a custom replacer function that combines all features
    const replacer = function(key: string, value: any): any {
      // Skip undefined values if enabled
      if (opts.removeUndefined && value === undefined) {
        return undefined;
      }
      
      // Skip null values if enabled
      if (opts.removeNulls && value === null) {
        return undefined;
      }
      
      // Handle Date objects if enabled
      if (opts.dateToString && value instanceof Date) {
        return value.toISOString();
      }
      
      return value;
    };
    
    // Handle circular references if enabled
    if (opts.circularReplacer) {
      const visited = new WeakMap();
      const circularReplacer = function(key: string, value: any): any {
        // Apply the standard replacer first
        let result = replacer(key, value);
        
        // Then handle circular references
        if (result !== null && typeof result === 'object') {
          if (visited.has(result)) {
            return '[Circular]';
          }
          visited.set(result, true);
        }
        
        return result;
      };
      
      return JSON.stringify(data, circularReplacer, opts.space);
    }
    
    // If circular replacer is disabled, use the standard replacer
    return JSON.stringify(data, replacer, opts.space);
  } catch (error) {
    logger.error('Error serializing data', { error });
    throw new ApiError({
      message: 'Failed to serialize data',
      code: ErrorCode.SERIALIZATION_ERROR
    });
  }
}

/**
 * Safely parses a JSON string to an object, handling errors and special data types
 * 
 * @param jsonString - JSON string to parse
 * @param options - Deserialization options
 * @returns Parsed object from the JSON string
 */
export function safeParse(jsonString: string, options?: DeserializationOptions): any {
  try {
    // Apply default options
    const opts: DeserializationOptions = {
      stringToDate: true,
      ...options
    };
    
    // Create a custom reviver function
    const reviver = function(key: string, value: any): any {
      // Convert ISO date strings to Date objects if enabled
      if (opts.stringToDate && typeof value === 'string' && isISODateString(value)) {
        return new Date(value);
      }
      
      // Apply custom reviver if provided
      if (opts.reviver) {
        return opts.reviver(key, value);
      }
      
      return value;
    };
    
    return JSON.parse(jsonString, reviver);
  } catch (error) {
    logger.error('Error parsing JSON', { error, jsonString: jsonString.substring(0, 100) + '...' });
    throw new ApiError({
      message: 'Failed to parse JSON data',
      code: ErrorCode.SERIALIZATION_ERROR
    });
  }
}

/**
 * Prepares an object for API response by serializing it with appropriate options
 * 
 * @param data - Data to prepare for response
 * @param options - Serialization options
 * @returns Serialized object ready for API response
 */
export function serializeForResponse(data: any, options?: SerializationOptions): any {
  try {
    // Apply response-specific options
    const responseOptions: SerializationOptions = {
      ...DEFAULT_SERIALIZATION_OPTIONS,
      removeNulls: false, // Keep nulls in responses for consistent field presence
      ...options
    };
    
    // Create a deep clone to avoid modifying the original data
    const clonedData = deepClone(data);
    
    // Transform complex objects into simplified representations
    const transformedData = transformComplexTypes(clonedData);
    
    // For API responses, we often want to ensure the data is properly serializable
    // Stringify and parse to ensure all special types are properly transformed
    const jsonString = safeStringify(transformedData, responseOptions);
    return JSON.parse(jsonString);
  } catch (error) {
    logger.debug('Error serializing for response', { error });
    throw new ApiError({
      message: 'Failed to serialize data for response',
      code: ErrorCode.SERIALIZATION_ERROR
    });
  }
}

/**
 * Prepares an object for database storage by serializing it with appropriate options
 * 
 * @param data - Data to prepare for storage
 * @param options - Serialization options
 * @returns Serialized object ready for database storage
 */
export function serializeForStorage(data: any, options?: SerializationOptions): any {
  try {
    // Apply storage-specific options
    const storageOptions: SerializationOptions = {
      ...DEFAULT_SERIALIZATION_OPTIONS,
      removeNulls: true, // Remove nulls for storage efficiency
      ...options
    };
    
    // Create a deep clone to avoid modifying the original data
    const clonedData = deepClone(data);
    
    // Transform complex types to storage-friendly formats
    return transformForStorage(clonedData);
  } catch (error) {
    logger.debug('Error serializing for storage', { error });
    throw new ApiError({
      message: 'Failed to serialize data for storage',
      code: ErrorCode.SERIALIZATION_ERROR
    });
  }
}

/**
 * Converts database-retrieved data back into application objects
 * 
 * @param data - Data retrieved from database
 * @param options - Deserialization options
 * @returns Deserialized object for application use
 */
export function deserializeFromStorage(data: any, options?: DeserializationOptions): any {
  try {
    // Apply storage-specific deserialization options
    const storageOptions: DeserializationOptions = {
      stringToDate: true,
      ...options
    };
    
    // Create a deep clone to avoid modifying the original data
    const clonedData = deepClone(data);
    
    // Transform storage formats back to application types
    return transformFromStorage(clonedData);
  } catch (error) {
    logger.debug('Error deserializing from storage', { error });
    throw new ApiError({
      message: 'Failed to deserialize data from storage',
      code: ErrorCode.SERIALIZATION_ERROR
    });
  }
}

/**
 * Transforms complex types into JSON-serializable representations
 */
function transformComplexTypes(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data; // Will be converted to ISO string during serialization
  }
  
  // Handle Buffer objects
  if (Buffer.isBuffer(data)) {
    return {
      __type: 'Buffer',
      data: data.toString('base64')
    };
  }
  
  // Handle Set objects
  if (data instanceof Set) {
    return {
      __type: 'Set',
      values: Array.from(data)
    };
  }
  
  // Handle Map objects
  if (data instanceof Map) {
    return {
      __type: 'Map',
      entries: Array.from(data.entries()).map(([k, v]) => ({
        key: transformComplexTypes(k),
        value: transformComplexTypes(v)
      }))
    };
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformComplexTypes(item));
  }
  
  // Handle regular objects
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = transformComplexTypes(data[key]);
      }
    }
    
    return result;
  }
  
  // Return primitives unchanged
  return data;
}

/**
 * Transforms data for database storage
 */
function transformForStorage(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle Buffer objects
  if (Buffer.isBuffer(data)) {
    return {
      __type: 'Buffer',
      data: data.toString('base64')
    };
  }
  
  // Handle Set objects
  if (data instanceof Set) {
    return {
      __type: 'Set',
      values: Array.from(data).map(value => transformForStorage(value))
    };
  }
  
  // Handle Map objects
  if (data instanceof Map) {
    return {
      __type: 'Map',
      entries: Array.from(data.entries()).map(([k, v]) => ({
        key: transformForStorage(k),
        value: transformForStorage(v)
      }))
    };
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformForStorage(item));
  }
  
  // Handle regular objects
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Skip undefined values
        if (data[key] === undefined) {
          continue;
        }
        
        result[key] = transformForStorage(data[key]);
      }
    }
    
    return result;
  }
  
  // Return primitives unchanged
  return data;
}

/**
 * Transforms data from database storage back to application types
 */
function transformFromStorage(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle ISO date strings
  if (typeof data === 'string' && isISODateString(data)) {
    return new Date(data);
  }
  
  // Handle serialized Buffer objects
  if (data && typeof data === 'object' && data.__type === 'Buffer' && data.data) {
    return Buffer.from(data.data, 'base64');
  }
  
  // Handle serialized Set objects
  if (data && typeof data === 'object' && data.__type === 'Set' && Array.isArray(data.values)) {
    return new Set(data.values.map((item: any) => transformFromStorage(item)));
  }
  
  // Handle serialized Map objects
  if (data && typeof data === 'object' && data.__type === 'Map' && Array.isArray(data.entries)) {
    return new Map(
      data.entries.map((entry: {key: any, value: any}) => [
        transformFromStorage(entry.key),
        transformFromStorage(entry.value)
      ])
    );
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformFromStorage(item));
  }
  
  // Handle regular objects
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = transformFromStorage(data[key]);
      }
    }
    
    return result;
  }
  
  // Return primitives unchanged
  return data;
}