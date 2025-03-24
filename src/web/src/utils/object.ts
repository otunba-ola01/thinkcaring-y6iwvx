/**
 * Utility functions for object manipulation and transformation.
 * Provides type-safe helper functions for common object operations.
 * 
 * @packageDocumentation
 */

/**
 * Checks if an object is empty, null, or undefined
 * 
 * @param obj - The object to check
 * @returns True if the object is empty, null, or undefined
 * 
 * @example
 * ```ts
 * isEmpty(null); // true
 * isEmpty({}); // true
 * isEmpty({ key: 'value' }); // false
 * ```
 */
export function isEmpty(obj: Record<string, any> | null | undefined): boolean {
  return obj === null || obj === undefined || Object.keys(obj).length === 0;
}

/**
 * Checks if an object is not empty (has at least one property)
 * 
 * @param obj - The object to check
 * @returns True if the object has at least one property
 * 
 * @example
 * ```ts
 * isNotEmpty(null); // false
 * isNotEmpty({}); // false
 * isNotEmpty({ key: 'value' }); // true
 * ```
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
 * 
 * @example
 * ```ts
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }
 * ```
 */
export function pick<T extends Record<string, any>>(obj: T, keys: Array<keyof T>): Partial<T> {
  if (isEmpty(obj)) {
    return {};
  }
  
  return keys.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Partial<T>);
}

/**
 * Creates a new object without the specified properties from the source object
 * 
 * @param obj - The source object
 * @param keys - Array of keys to omit from the source object
 * @returns New object without the omitted properties
 * 
 * @example
 * ```ts
 * omit({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }
 * ```
 */
export function omit<T extends Record<string, any>>(obj: T, keys: Array<keyof T>): Partial<T> {
  if (isEmpty(obj)) {
    return {};
  }
  
  const result = { ...obj };
  
  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      delete result[key];
    }
  });
  
  return result;
}

/**
 * Merges multiple objects into a new object
 * 
 * @param objects - Array of objects to merge
 * @returns New object with merged properties
 * 
 * @example
 * ```ts
 * merge({ a: 1 }, { b: 2 }, { c: 3 }); // { a: 1, b: 2, c: 3 }
 * ```
 */
export function merge(...objects: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...objects);
}

/**
 * Recursively merges multiple objects into a new object
 * 
 * @param objects - Array of objects to merge deeply
 * @returns New object with deeply merged properties
 * 
 * @example
 * ```ts
 * deepMerge(
 *   { a: 1, b: { c: 2 } },
 *   { b: { d: 3 }, e: 4 }
 * ); // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 */
export function deepMerge(...objects: Record<string, any>[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  objects.forEach(obj => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const existing = result[key];
      
      if (existing && typeof existing === 'object' && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = deepMerge(existing, value);
      } else {
        result[key] = value;
      }
    });
  });
  
  return result;
}

/**
 * Creates a new object by transforming each value in the source object
 * 
 * @param obj - The source object
 * @param mapper - Function to transform each value
 * @returns New object with transformed values
 * 
 * @example
 * ```ts
 * mapValues({ a: 1, b: 2 }, (value) => value * 2); // { a: 2, b: 4 }
 * ```
 */
export function mapValues<K extends string | number | symbol, V, R>(
  obj: Record<K, V>,
  mapper: (value: V, key: K, object: Record<K, V>) => R
): Record<K, R> {
  if (isEmpty(obj)) {
    return {} as Record<K, R>;
  }
  
  return Object.entries(obj).reduce(
    (result, [key, value]) => {
      result[key as K] = mapper(value as V, key as K, obj);
      return result;
    },
    {} as Record<K, R>
  );
}

/**
 * Creates a new object by transforming each key in the source object
 * 
 * @param obj - The source object
 * @param mapper - Function to transform each key
 * @returns New object with transformed keys
 * 
 * @example
 * ```ts
 * mapKeys({ a: 1, b: 2 }, (key) => key.toUpperCase()); // { A: 1, B: 2 }
 * ```
 */
export function mapKeys<K extends string | number | symbol, V, R extends string | number | symbol>(
  obj: Record<K, V>,
  mapper: (key: K, value: V, object: Record<K, V>) => R
): Record<R, V> {
  if (isEmpty(obj)) {
    return {} as Record<R, V>;
  }
  
  return Object.entries(obj).reduce(
    (result, [key, value]) => {
      const newKey = mapper(key as K, value as V, obj);
      result[newKey] = value as V;
      return result;
    },
    {} as Record<R, V>
  );
}

/**
 * Returns an array of key-value pairs from the object
 * 
 * @param obj - The source object
 * @returns Array of key-value pairs
 * 
 * @example
 * ```ts
 * entries({ a: 1, b: 2 }); // [['a', 1], ['b', 2]]
 * ```
 */
export function entries<K extends string | number | symbol, V>(obj: Record<K, V>): Array<[K, V]> {
  return Object.entries(obj) as Array<[K, V]>;
}

/**
 * Creates an object from an array of key-value pairs
 * 
 * @param entries - Array of key-value pairs
 * @returns Object created from key-value pairs
 * 
 * @example
 * ```ts
 * fromEntries([['a', 1], ['b', 2]]); // { a: 1, b: 2 }
 * ```
 */
export function fromEntries<K extends string | number | symbol, V>(entries: Array<[K, V]>): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

/**
 * Returns an array of the object's keys
 * 
 * @param obj - The source object
 * @returns Array of keys
 * 
 * @example
 * ```ts
 * keys({ a: 1, b: 2 }); // ['a', 'b']
 * ```
 */
export function keys<K extends string | number | symbol, V>(obj: Record<K, V>): Array<K> {
  return Object.keys(obj) as Array<K>;
}

/**
 * Returns an array of the object's values
 * 
 * @param obj - The source object
 * @returns Array of values
 * 
 * @example
 * ```ts
 * values({ a: 1, b: 2 }); // [1, 2]
 * ```
 */
export function values<K extends string | number | symbol, V>(obj: Record<K, V>): Array<V> {
  return Object.values(obj) as Array<V>;
}

/**
 * Checks if an object has a specific key
 * 
 * @param obj - The source object
 * @param key - The key to check
 * @returns True if the object has the specified key
 * 
 * @example
 * ```ts
 * hasKey({ a: 1, b: 2 }, 'a'); // true
 * hasKey({ a: 1, b: 2 }, 'c'); // false
 * ```
 */
export function hasKey(obj: Record<string, any>, key: string): boolean {
  if (isEmpty(obj)) {
    return false;
  }
  
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Creates a deep copy of an object
 * 
 * @param obj - The object to clone
 * @returns Deep copy of the object
 * 
 * @example
 * ```ts
 * const original = { a: 1, b: { c: 2 } };
 * const clone = deepClone(original);
 * clone.b.c = 3; // original.b.c is still 2
 * ```
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Creates a shallow copy of an object
 * 
 * @param obj - The object to clone
 * @returns Shallow copy of the object
 * 
 * @example
 * ```ts
 * const original = { a: 1, b: { c: 2 } };
 * const clone = shallowClone(original);
 * clone.a = 3; // original.a is still 1
 * clone.b.c = 3; // original.b.c is also 3 (shared reference)
 * ```
 */
export function shallowClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  return Object.assign({}, obj);
}

/**
 * Creates a new object with properties that satisfy a predicate function
 * 
 * @param obj - The source object
 * @param predicate - Function to test each property
 * @returns Filtered object
 * 
 * @example
 * ```ts
 * filterObject({ a: 1, b: 2, c: 3 }, (value) => value > 1); // { b: 2, c: 3 }
 * ```
 */
export function filterObject<K extends string | number | symbol, V>(
  obj: Record<K, V>,
  predicate: (value: V, key: K, object: Record<K, V>) => boolean
): Record<K, V> {
  if (isEmpty(obj)) {
    return {} as Record<K, V>;
  }
  
  return Object.entries(obj).reduce(
    (result, [key, value]) => {
      if (predicate(value as V, key as K, obj)) {
        result[key as K] = value as V;
      }
      return result;
    },
    {} as Record<K, V>
  );
}

/**
 * Flattens a nested object structure into a single-level object with path-based keys
 * 
 * @param obj - The nested object to flatten
 * @param prefix - Optional prefix for flattened keys
 * @returns Flattened object
 * 
 * @example
 * ```ts
 * flattenObject({ a: 1, b: { c: 2, d: { e: 3 } } });
 * // { 'a': 1, 'b.c': 2, 'b.d.e': 3 }
 * ```
 */
export function flattenObject(
  obj: Record<string, any>,
  prefix: string = ''
): Record<string, any> {
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.entries(obj).reduce((result, [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
    
    return result;
  }, {} as Record<string, any>);
}

/**
 * Converts a flattened object with path-based keys back into a nested object structure
 * 
 * @param obj - The flattened object to unflatten
 * @returns Nested object
 * 
 * @example
 * ```ts
 * unflattenObject({ 'a': 1, 'b.c': 2, 'b.d.e': 3 });
 * // { a: 1, b: { c: 2, d: { e: 3 } } }
 * ```
 */
export function unflattenObject(obj: Record<string, any>): Record<string, any> {
  if (isEmpty(obj)) {
    return {};
  }
  
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      current[part] = current[part] || {};
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  });
  
  return result;
}

/**
 * Creates a new object with properties sorted by keys
 * 
 * @param obj - The object to sort
 * @returns Sorted object
 * 
 * @example
 * ```ts
 * sortObject({ c: 3, a: 1, b: 2 }); // { a: 1, b: 2, c: 3 }
 * ```
 */
export function sortObject(obj: Record<string, any>): Record<string, any> {
  if (isEmpty(obj)) {
    return {};
  }
  
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {} as Record<string, any>);
}

/**
 * Checks if two objects are deeply equal
 * 
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if the objects are deeply equal
 * 
 * @example
 * ```ts
 * isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }); // true
 * isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } }); // false
 * ```
 */
export function isEqual(obj1: any, obj2: any): boolean {
  // Handle null/undefined cases
  if (obj1 === null && obj2 === null) return true;
  if (obj1 === null || obj2 === null) return false;
  if (obj1 === undefined && obj2 === undefined) return true;
  if (obj1 === undefined || obj2 === undefined) return false;
  
  // Handle primitive types
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }
  
  // Handle array case
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    
    for (let i = 0; i < obj1.length; i++) {
      if (!isEqual(obj1[i], obj2[i])) return false;
    }
    
    return true;
  }
  
  // Handle different types
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  // Handle object case
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
 * @returns Object containing the differences
 * 
 * @example
 * ```ts
 * diff({ a: 1, b: 2, c: 3 }, { a: 1, b: 3, d: 4 });
 * // { b: { old: 2, new: 3 }, c: { old: 3 }, d: { new: 4 } }
 * ```
 */
export function diff(
  obj1: Record<string, any>,
  obj2: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  const allKeys = Array.from(new Set([...Object.keys(obj1), ...Object.keys(obj2)]));
  
  allKeys.forEach(key => {
    // Key in both objects but values differ
    if (hasKey(obj1, key) && hasKey(obj2, key)) {
      if (!isEqual(obj1[key], obj2[key])) {
        result[key] = {
          old: obj1[key],
          new: obj2[key]
        };
      }
    } 
    // Key only in obj1
    else if (hasKey(obj1, key)) {
      result[key] = {
        old: obj1[key]
      };
    } 
    // Key only in obj2
    else if (hasKey(obj2, key)) {
      result[key] = {
        new: obj2[key]
      };
    }
  });
  
  return result;
}