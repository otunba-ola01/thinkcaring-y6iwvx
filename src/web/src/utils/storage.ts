/**
 * Utility functions for browser storage operations in the HCBS Revenue Management System frontend.
 * Provides type-safe wrappers around localStorage and sessionStorage APIs with error handling,
 * serialization/deserialization of complex objects, and storage availability detection.
 * 
 * @packageDocumentation
 */

import { isEmpty } from './object';

/**
 * Type definition for browser storage type
 */
type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Checks if a specific storage type (localStorage or sessionStorage) is available in the browser
 * 
 * @param storageType - The type of storage to check
 * @returns True if the storage is available, false otherwise
 * 
 * @example
 * ```ts
 * if (isStorageAvailable('localStorage')) {
 *   // Use localStorage safely
 * }
 * ```
 */
export function isStorageAvailable(storageType: StorageType): boolean {
  try {
    // Create a test key with a random value to avoid collisions
    const testKey = `__storage_test_${Math.random().toString(36).substring(2)}`;
    const storage = window[storageType];
    
    // Try to use the storage
    storage.setItem(testKey, 'test');
    const result = storage.getItem(testKey);
    storage.removeItem(testKey);
    
    // Verify the test worked correctly
    return result === 'test';
  } catch (e) {
    // Storage might not be available due to:
    // - Browser in private mode with quota exceeded
    // - Browsers with storage disabled
    // - Missing window object (SSR environments)
    return false;
  }
}

/**
 * Safely stores a value in localStorage with JSON serialization for complex objects
 * 
 * @param key - The key to store the value under
 * @param value - The value to store (will be JSON serialized)
 * @returns True if the operation succeeded, false otherwise
 * 
 * @example
 * ```ts
 * setLocalStorageItem('user', { id: 1, name: 'John' });
 * ```
 */
export function setLocalStorageItem(key: string, value: any): boolean {
  if (!isStorageAvailable('localStorage')) {
    return false;
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (e) {
    // Handle potential errors:
    // - QuotaExceededError when storage is full
    // - SecurityError when blocked by security policy
    console.error('Failed to set localStorage item:', e);
    return false;
  }
}

/**
 * Safely retrieves and parses a value from localStorage
 * 
 * @param key - The key to retrieve the value for
 * @param defaultValue - The default value to return if the key doesn't exist or retrieval fails
 * @returns The parsed value from localStorage or the defaultValue if not found
 * 
 * @example
 * ```ts
 * const user = getLocalStorageItem('user', { id: 0, name: 'Guest' });
 * ```
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (!isStorageAvailable('localStorage')) {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    return JSON.parse(item) as T;
  } catch (e) {
    // Handle parsing errors for malformed JSON
    console.error('Failed to get localStorage item:', e);
    return defaultValue;
  }
}

/**
 * Safely removes an item from localStorage
 * 
 * @param key - The key to remove
 * @returns True if the operation succeeded, false otherwise
 * 
 * @example
 * ```ts
 * removeLocalStorageItem('user');
 * ```
 */
export function removeLocalStorageItem(key: string): boolean {
  if (!isStorageAvailable('localStorage')) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to remove localStorage item:', e);
    return false;
  }
}

/**
 * Safely clears all items from localStorage
 * 
 * @returns True if the operation succeeded, false otherwise
 * 
 * @example
 * ```ts
 * clearLocalStorage();
 * ```
 */
export function clearLocalStorage(): boolean {
  if (!isStorageAvailable('localStorage')) {
    return false;
  }
  
  try {
    localStorage.clear();
    return true;
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
    return false;
  }
}

/**
 * Safely stores a value in sessionStorage with JSON serialization for complex objects
 * 
 * @param key - The key to store the value under
 * @param value - The value to store (will be JSON serialized)
 * @returns True if the operation succeeded, false otherwise
 * 
 * @example
 * ```ts
 * setSessionStorageItem('temporaryData', { step: 1, formData: {...} });
 * ```
 */
export function setSessionStorageItem(key: string, value: any): boolean {
  if (!isStorageAvailable('sessionStorage')) {
    return false;
  }
  
  try {
    const serializedValue = JSON.stringify(value);
    sessionStorage.setItem(key, serializedValue);
    return true;
  } catch (e) {
    console.error('Failed to set sessionStorage item:', e);
    return false;
  }
}

/**
 * Safely retrieves and parses a value from sessionStorage
 * 
 * @param key - The key to retrieve the value for
 * @param defaultValue - The default value to return if the key doesn't exist or retrieval fails
 * @returns The parsed value from sessionStorage or the defaultValue if not found
 * 
 * @example
 * ```ts
 * const formData = getSessionStorageItem('temporaryData', { step: 1, formData: {} });
 * ```
 */
export function getSessionStorageItem<T>(key: string, defaultValue: T): T {
  if (!isStorageAvailable('sessionStorage')) {
    return defaultValue;
  }
  
  try {
    const item = sessionStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }
    
    return JSON.parse(item) as T;
  } catch (e) {
    console.error('Failed to get sessionStorage item:', e);
    return defaultValue;
  }
}

/**
 * Safely removes an item from sessionStorage
 * 
 * @param key - The key to remove
 * @returns True if the operation succeeded, false otherwise
 * 
 * @example
 * ```ts
 * removeSessionStorageItem('temporaryData');
 * ```
 */
export function removeSessionStorageItem(key: string): boolean {
  if (!isStorageAvailable('sessionStorage')) {
    return false;
  }
  
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to remove sessionStorage item:', e);
    return false;
  }
}

/**
 * Safely clears all items from sessionStorage
 * 
 * @returns True if the operation succeeded, false otherwise
 * 
 * @example
 * ```ts
 * clearSessionStorage();
 * ```
 */
export function clearSessionStorage(): boolean {
  if (!isStorageAvailable('sessionStorage')) {
    return false;
  }
  
  try {
    sessionStorage.clear();
    return true;
  } catch (e) {
    console.error('Failed to clear sessionStorage:', e);
    return false;
  }
}

/**
 * Calculates the approximate size of data stored in a specific storage type
 * 
 * @param storageType - The type of storage to calculate size for
 * @returns Size in bytes of the storage data
 * 
 * @example
 * ```ts
 * const localStorageSize = getStorageSize('localStorage');
 * console.log(`localStorage is using approximately ${localStorageSize} bytes`);
 * ```
 */
export function getStorageSize(storageType: StorageType): number {
  if (!isStorageAvailable(storageType)) {
    return 0;
  }
  
  try {
    const storage = window[storageType];
    let size = 0;
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        // Add the size of the key (2 bytes per character in UTF-16)
        size += key.length * 2;
        
        // Add the size of the value (2 bytes per character in UTF-16)
        const value = storage.getItem(key) || '';
        size += value.length * 2;
      }
    }
    
    return size;
  } catch (e) {
    console.error('Failed to calculate storage size:', e);
    return 0;
  }
}