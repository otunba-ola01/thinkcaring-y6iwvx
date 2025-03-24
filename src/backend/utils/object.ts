/**
 * Utility functions for object manipulation used throughout the HCBS Revenue Management System.
 * These functions provide common object operations with type safety, error handling,
 * and performance optimizations for working with objects, maps, and records.
 */

import { ErrorCode } from '../types/error.types';

/**
 * Checks if an object is empty, null, or undefined
 * 
 * @param obj - The object to check
 * @returns True if object is empty, null, or undefined, false otherwise
 */
export function isEmpty(obj: Record<string, any> | null | undefined): boolean {
  return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

/**
 * Checks if an object is not empty, null, or undefined
 * 
 * @param obj - The object to check
 * @returns True if object has at least one property, false otherwise
 */
export function isNotEmpty(obj: Record<string, any> | null | undefined): boolean {
  return !isEmpty(obj);
}

/**
 * Creates a new object with only the specified properties from the source object
 * 
 * @param obj - The source object
 * @param keys - Array of keys to pick from the source object
 * @returns New object with only the picked properties
 * @throws Error if inputs are invalid
 */
export function pick(obj: Record<string, any>, keys: string[]): Record<string, any> {
  if (!obj || !keys || !Array.isArray(keys)) {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj) || keys.length === 0) {
    return {};
  }
  
  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Record<string, any>);
}

/**
 * Creates a new object excluding the specified properties from the source object
 * 
 * @param obj - The source object
 * @param keys - Array of keys to exclude from the source object
 * @returns New object without the omitted properties
 * @throws Error if inputs are invalid
 */
export function omit(obj: Record<string, any>, keys: string[]): Record<string, any> {
  if (!obj || !keys || !Array.isArray(keys)) {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  if (keys.length === 0) {
    return { ...obj };
  }
  
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  
  return result;
}

/**
 * Creates a deep clone of an object
 * 
 * @param obj - The object to clone
 * @returns Deep clone of the input object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const clone = {} as Record<string, any>;
  
  Object.keys(obj as Record<string, any>).forEach(key => {
    clone[key] = deepClone((obj as Record<string, any>)[key]);
  });
  
  return clone as T;
}

/**
 * Deeply merges two or more objects together
 * 
 * @param target - The target object to merge into
 * @param sources - Source objects to merge from
 * @returns Merged object
 * @throws Error if inputs are invalid
 */
export function merge(target: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
  if (!sources || !Array.isArray(sources)) {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  const result = deepClone(target || {});
  
  sources.forEach(source => {
    if (!source) return;
    
    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue && 
        typeof sourceValue === 'object' && 
        !Array.isArray(sourceValue) && 
        targetValue && 
        typeof targetValue === 'object' && 
        !Array.isArray(targetValue)
      ) {
        // Recursively merge nested objects
        result[key] = merge(targetValue, sourceValue);
      } else {
        // Directly assign non-object or array values
        result[key] = deepClone(sourceValue);
      }
    });
  });
  
  return result;
}

/**
 * Flattens a nested object structure into a single-level object with path-based keys
 * 
 * @param obj - The object to flatten
 * @param prefix - Prefix for flattened keys
 * @param delimiter - Delimiter for path segments
 * @returns Flattened object
 * @throws Error if inputs are invalid
 */
export function flatten(
  obj: Record<string, any>, 
  prefix: string = '', 
  delimiter: string = '.'
): Record<string, any> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const prefixedKey = prefix ? `${prefix}${delimiter}${key}` : key;
    
    if (
      obj[key] !== null && 
      typeof obj[key] === 'object' && 
      !Array.isArray(obj[key]) && 
      Object.keys(obj[key]).length > 0
    ) {
      // Recursively flatten nested objects
      Object.assign(acc, flatten(obj[key], prefixedKey, delimiter));
    } else {
      // Add leaf values to result
      acc[prefixedKey] = obj[key];
    }
    
    return acc;
  }, {} as Record<string, any>);
}

/**
 * Converts a flattened object back into a nested object structure
 * 
 * @param obj - The flattened object
 * @param delimiter - Delimiter used in path segments
 * @returns Nested object
 * @throws Error if inputs are invalid
 */
export function unflatten(obj: Record<string, any>, delimiter: string = '.'): Record<string, any> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
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
 * Creates a new object with the same keys but transformed values using a mapping function
 * 
 * @param obj - The source object
 * @param mapFn - Function to transform values
 * @returns Object with transformed values
 * @throws Error if inputs are invalid
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  mapFn: (value: T, key: string, object: Record<string, T>) => U
): Record<string, U> {
  if (!obj || typeof mapFn !== 'function') {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    result[key] = mapFn(obj[key], key, obj);
    return result;
  }, {} as Record<string, U>);
}

/**
 * Creates a new object with transformed keys using a mapping function but the same values
 * 
 * @param obj - The source object
 * @param mapFn - Function to transform keys
 * @returns Object with transformed keys
 * @throws Error if inputs are invalid
 */
export function mapKeys<T>(
  obj: Record<string, T>,
  mapFn: (key: string, value: T, object: Record<string, T>) => string
): Record<string, T> {
  if (!obj || typeof mapFn !== 'function') {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const newKey = mapFn(key, obj[key], obj);
    result[newKey] = obj[key];
    return result;
  }, {} as Record<string, T>);
}

/**
 * Returns an array of key-value pairs from an object (type-safe version of Object.entries)
 * 
 * @param obj - The source object
 * @returns Array of key-value pairs
 * @throws Error if input is invalid
 */
export function entries<T>(obj: Record<string, T>): Array<[string, T]> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return [];
  }
  
  return Object.entries(obj);
}

/**
 * Creates an object from an array of key-value pairs (type-safe version of Object.fromEntries)
 * 
 * @param entries - Array of key-value pairs
 * @returns Object created from entries
 * @throws Error if input is invalid
 */
export function fromEntries<T>(entries: Array<[string, T]>): Record<string, T> {
  if (!entries || !Array.isArray(entries)) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (entries.length === 0) {
    return {};
  }
  
  return Object.fromEntries(entries) as Record<string, T>;
}

/**
 * Returns an array of object keys (type-safe version of Object.keys)
 * 
 * @param obj - The source object
 * @returns Array of object keys
 * @throws Error if input is invalid
 */
export function keys<T>(obj: Record<string, T>): string[] {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return [];
  }
  
  return Object.keys(obj);
}

/**
 * Returns an array of object values (type-safe version of Object.values)
 * 
 * @param obj - The source object
 * @returns Array of object values
 * @throws Error if input is invalid
 */
export function values<T>(obj: Record<string, T>): T[] {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return [];
  }
  
  return Object.values(obj);
}

/**
 * Checks if an object has a specific key (type-safe version of key in object)
 * 
 * @param obj - The source object
 * @param key - The key to check
 * @returns True if object has the key, false otherwise
 * @throws Error if inputs are invalid
 */
export function hasKey<T>(obj: Record<string, T>, key: string): boolean {
  if (!obj || key === undefined) {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return false;
  }
  
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Creates a new object with keys that satisfy a predicate function
 * 
 * @param obj - The source object
 * @param predicate - Function to test keys
 * @returns Filtered object
 * @throws Error if inputs are invalid
 */
export function filterKeys<T>(
  obj: Record<string, T>,
  predicate: (key: string, value: T, object: Record<string, T>) => boolean
): Record<string, T> {
  if (!obj || typeof predicate !== 'function') {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    if (predicate(key, obj[key], obj)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Record<string, T>);
}

/**
 * Creates a new object with values that satisfy a predicate function
 * 
 * @param obj - The source object
 * @param predicate - Function to test values
 * @returns Filtered object
 * @throws Error if inputs are invalid
 */
export function filterValues<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string, object: Record<string, T>) => boolean
): Record<string, T> {
  if (!obj || typeof predicate !== 'function') {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    if (predicate(obj[key], key, obj)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Record<string, T>);
}

/**
 * Groups object values by a key selector function
 * 
 * @param obj - The source object
 * @param keySelector - Function to determine the group key
 * @returns Grouped object
 * @throws Error if inputs are invalid
 */
export function groupBy<T>(
  obj: Record<string, T>,
  keySelector: (value: T, key: string, object: Record<string, T>) => string
): Record<string, Record<string, T>> {
  if (!obj || typeof keySelector !== 'function') {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const groupKey = keySelector(obj[key], key, obj);
    
    if (!result[groupKey]) {
      result[groupKey] = {};
    }
    
    result[groupKey][key] = obj[key];
    return result;
  }, {} as Record<string, Record<string, T>>);
}

/**
 * Transforms an object by applying a reducer function to each property
 * 
 * @param obj - The source object
 * @param reducer - Function to accumulate result
 * @param initialValue - Initial accumulator value
 * @returns Transformed object
 * @throws Error if inputs are invalid
 */
export function transform<T, U>(
  obj: Record<string, T>,
  reducer: (result: U, value: T, key: string, object: Record<string, T>) => U,
  initialValue?: U
): U {
  if (!obj || typeof reducer !== 'function') {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return initialValue || ({} as U);
  }
  
  return Object.keys(obj).reduce(
    (result, key) => reducer(result, obj[key], key, obj), 
    initialValue !== undefined ? initialValue : ({} as U)
  );
}

/**
 * Deeply compares two objects for equality
 * 
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal, false otherwise
 */
export function isEqual(obj1: any, obj2: any): boolean {
  // If both are null or undefined, they're equal
  if (obj1 === null && obj2 === null) return true;
  if (obj1 === undefined && obj2 === undefined) return true;
  
  // If only one is null or undefined, they're not equal
  if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
    return false;
  }
  
  // Different types means not equal
  if (typeof obj1 !== typeof obj2) return false;
  
  // For primitive types, direct comparison
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  // For dates, compare their time values
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  // For arrays, check length and each element
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    
    for (let i = 0; i < obj1.length; i++) {
      if (!isEqual(obj1[i], obj2[i])) return false;
    }
    
    return true;
  }
  
  // If one is array but the other isn't, they're not equal
  if (Array.isArray(obj1) || Array.isArray(obj2)) return false;
  
  // For objects, compare keys and then values
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => 
    Object.prototype.hasOwnProperty.call(obj2, key) && 
    isEqual(obj1[key], obj2[key])
  );
}

/**
 * Finds the differences between two objects
 * 
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns Object containing added, removed, and updated properties
 * @throws Error if inputs are invalid
 */
export function diff(
  obj1: Record<string, any>, 
  obj2: Record<string, any>
): { added: Record<string, any>, removed: Record<string, any>, updated: Record<string, any> } {
  if (!obj1 || !obj2) {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  const result = {
    added: {} as Record<string, any>,
    removed: {} as Record<string, any>,
    updated: {} as Record<string, any>
  };
  
  // Find keys present in obj2 but not in obj1 (added)
  Object.keys(obj2).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
      result.added[key] = obj2[key];
    }
  });
  
  // Find keys present in obj1 but not in obj2 (removed)
  Object.keys(obj1).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
      result.removed[key] = obj1[key];
    }
  });
  
  // Find keys present in both but with different values (updated)
  Object.keys(obj1).forEach(key => {
    if (
      Object.prototype.hasOwnProperty.call(obj2, key) && 
      !isEqual(obj1[key], obj2[key])
    ) {
      result.updated[key] = obj2[key];
    }
  });
  
  return result;
}

/**
 * Safely gets a nested value from an object using a path string
 * 
 * @param obj - The source object
 * @param path - Path to the desired property (e.g., 'user.address.city')
 * @param defaultValue - Value to return if path doesn't exist
 * @returns The value at the specified path or the default value if not found
 */
export function getNestedValue(
  obj: Record<string, any> | null | undefined, 
  path: string, 
  defaultValue: any = undefined
): any {
  if (!obj || !path) {
    return defaultValue;
  }
  
  const segments = path.split('.');
  let current = obj;
  
  for (const segment of segments) {
    if (current === null || current === undefined || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return defaultValue;
    }
    
    current = current[segment];
  }
  
  return current !== undefined ? current : defaultValue;
}

/**
 * Sets a nested value in an object using a path string
 * 
 * @param obj - The source object
 * @param path - Path to the property to set (e.g., 'user.address.city')
 * @param value - Value to set at the specified path
 * @returns The modified object
 * @throws Error if inputs are invalid
 */
export function setNestedValue(
  obj: Record<string, any>,
  path: string,
  value: any
): Record<string, any> {
  if (!obj || !path) {
    throw new Error(`Invalid input parameters: ${ErrorCode.INVALID_INPUT}`);
  }
  
  const result = deepClone(obj);
  const segments = path.split('.');
  let current = result;
  
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    
    if (current[segment] === undefined || current[segment] === null || typeof current[segment] !== 'object') {
      current[segment] = {};
    }
    
    current = current[segment];
  }
  
  current[segments[segments.length - 1]] = value;
  return result;
}

/**
 * Removes null, undefined, and empty string values from an object
 * 
 * @param obj - The source object
 * @returns Object with empty values removed
 * @throws Error if input is invalid
 */
export function removeEmpty(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const value = obj[key];
    
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
    
    return result;
  }, {} as Record<string, any>);
}

/**
 * Removes null and undefined values from an object
 * 
 * @param obj - The source object
 * @returns Object with null and undefined values removed
 * @throws Error if input is invalid
 */
export function removeNulls(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const value = obj[key];
    
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
    
    return result;
  }, {} as Record<string, any>);
}

/**
 * Converts object keys from snake_case to camelCase
 * 
 * @param obj - The source object
 * @returns Object with camelCase keys
 * @throws Error if input is invalid
 */
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Recursively convert nested objects and arrays
    const value = obj[key];
    let transformedValue = value;
    
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformedValue = value.map(item => 
          item !== null && typeof item === 'object' ? toCamelCase(item) : item
        );
      } else {
        transformedValue = toCamelCase(value);
      }
    }
    
    result[camelKey] = transformedValue;
    return result;
  }, {} as Record<string, any>);
}

/**
 * Converts object keys from camelCase to snake_case
 * 
 * @param obj - The source object
 * @returns Object with snake_case keys
 * @throws Error if input is invalid
 */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (!obj) {
    throw new Error(`Invalid input parameter: ${ErrorCode.INVALID_INPUT}`);
  }
  
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Recursively convert nested objects and arrays
    const value = obj[key];
    let transformedValue = value;
    
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        transformedValue = value.map(item => 
          item !== null && typeof item === 'object' ? toSnakeCase(item) : item
        );
      } else {
        transformedValue = toSnakeCase(value);
      }
    }
    
    result[snakeKey] = transformedValue;
    return result;
  }, {} as Record<string, any>);
}