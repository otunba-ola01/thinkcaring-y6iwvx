/**
 * Utility functions for array manipulation used throughout the HCBS Revenue Management System.
 * These functions provide common array operations with type safety, error handling, 
 * and performance optimizations.
 */

import { ErrorCode } from '../types/error.types';

/**
 * Checks if an array is empty, null, or undefined.
 *
 * @param arr - The array to check
 * @returns True if the array is empty, null, or undefined; false otherwise
 */
export function isEmpty<T>(arr: Array<T> | null | undefined): boolean {
  return arr === null || arr === undefined || arr.length === 0;
}

/**
 * Checks if an array is not empty (has at least one element).
 *
 * @param arr - The array to check
 * @returns True if the array has at least one element; false otherwise
 */
export function isNotEmpty<T>(arr: Array<T> | null | undefined): boolean {
  return !isEmpty(arr);
}

/**
 * Splits an array into chunks of specified size.
 *
 * @param array - The array to split
 * @param size - The size of each chunk
 * @returns An array containing chunks of the original array
 * @throws Error if size is less than 1
 */
export function chunk<T>(array: Array<T>, size: number): Array<Array<T>> {
  if (isEmpty(array)) {
    return [];
  }
  
  if (size < 1) {
    throw new Error(`${ErrorCode.INVALID_INPUT}: Chunk size must be greater than 0`);
  }
  
  const result: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  
  return result;
}

/**
 * Flattens a nested array structure into a single-level array.
 *
 * @param array - The array to flatten
 * @param depth - The maximum recursion depth (default: Infinity)
 * @returns A new flattened array
 */
export function flatten<T>(array: Array<any>, depth: number = Infinity): Array<T> {
  if (isEmpty(array)) {
    return [];
  }
  
  return array.flat(depth) as Array<T>;
}

/**
 * Returns an array with duplicate elements removed.
 *
 * @param array - The array to process
 * @returns A new array with unique elements
 */
export function unique<T>(array: Array<T>): Array<T> {
  if (isEmpty(array)) {
    return [];
  }
  
  return [...new Set(array)];
}

/**
 * Returns an array with duplicate elements removed based on a key selector function.
 * Only the first occurrence of each unique key is kept.
 *
 * @param array - The array to process
 * @param keySelector - A function that extracts the key used to determine uniqueness
 * @returns A new array with unique elements based on the key selector
 * @throws Error if keySelector is not a function
 */
export function uniqueBy<T, K>(array: Array<T>, keySelector: (item: T) => K): Array<T> {
  if (isEmpty(array)) {
    return [];
  }
  
  if (typeof keySelector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: keySelector must be a function`);
  }
  
  const seen = new Map<K, boolean>();
  return array.filter(item => {
    const key = keySelector(item);
    if (seen.has(key)) {
      return false;
    }
    seen.set(key, true);
    return true;
  });
}

/**
 * Groups array elements by a key selector function.
 *
 * @param array - The array to group
 * @param keySelector - A function that extracts the key used for grouping
 * @returns A Map with keys and arrays of matching elements
 * @throws Error if keySelector is not a function
 */
export function groupBy<T, K>(array: Array<T>, keySelector: (item: T) => K): Map<K, Array<T>> {
  if (isEmpty(array)) {
    return new Map<K, Array<T>>();
  }
  
  if (typeof keySelector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: keySelector must be a function`);
  }
  
  const result = new Map<K, Array<T>>();
  
  for (const item of array) {
    const key = keySelector(item);
    if (!result.has(key)) {
      result.set(key, []);
    }
    result.get(key)!.push(item);
  }
  
  return result;
}

/**
 * Sorts an array based on a key selector function.
 *
 * @param array - The array to sort
 * @param keySelector - A function that extracts the key used for sorting
 * @param direction - Sort direction, 'asc' (default) or 'desc'
 * @returns A new sorted array
 * @throws Error if keySelector is not a function
 */
export function sortBy<T, K>(
  array: Array<T>, 
  keySelector: (item: T) => K,
  direction: 'asc' | 'desc' = 'asc'
): Array<T> {
  if (isEmpty(array)) {
    return [];
  }
  
  if (typeof keySelector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: keySelector must be a function`);
  }
  
  const directionMultiplier = direction === 'asc' ? 1 : -1;
  
  return [...array].sort((a, b) => {
    const keyA = keySelector(a);
    const keyB = keySelector(b);
    
    if (keyA < keyB) return -1 * directionMultiplier;
    if (keyA > keyB) return 1 * directionMultiplier;
    return 0;
  });
}

/**
 * Returns a paginated subset of an array with pagination metadata.
 *
 * @param array - The array to paginate
 * @param page - The page number (1-based)
 * @param limit - The maximum number of items per page
 * @returns An object containing the paginated data and metadata
 * @throws Error if page or limit is less than 1
 */
export function paginate<T>(
  array: Array<T>, 
  page: number = 1, 
  limit: number = 10
): { 
  data: Array<T>, 
  total: number, 
  page: number, 
  limit: number, 
  totalPages: number 
} {
  if (isEmpty(array)) {
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
  
  if (page < 1) {
    throw new Error(`${ErrorCode.INVALID_INPUT}: Page must be greater than 0`);
  }
  
  if (limit < 1) {
    throw new Error(`${ErrorCode.INVALID_INPUT}: Limit must be greater than 0`);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    data: array.slice(startIndex, endIndex),
    total: totalItems,
    page,
    limit,
    totalPages
  };
}

/**
 * Returns elements in the first array that are not in the second array.
 *
 * @param array1 - First array
 * @param array2 - Second array
 * @returns A new array with elements unique to the first array
 */
export function difference<T>(array1: Array<T>, array2: Array<T>): Array<T> {
  if (isEmpty(array1)) {
    return [];
  }
  
  if (isEmpty(array2)) {
    return [...array1];
  }
  
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
}

/**
 * Returns elements common to both arrays (intersection).
 *
 * @param array1 - First array
 * @param array2 - Second array
 * @returns A new array with elements common to both arrays
 */
export function intersection<T>(array1: Array<T>, array2: Array<T>): Array<T> {
  if (isEmpty(array1) || isEmpty(array2)) {
    return [];
  }
  
  const set2 = new Set(array2);
  return array1.filter(item => set2.has(item));
}

/**
 * Calculates the sum of numeric array elements.
 *
 * @param array - The array of numbers
 * @returns The sum of all elements, or 0 for empty arrays
 */
export function sum(array: Array<number>): number {
  if (isEmpty(array)) {
    return 0;
  }
  
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculates the sum of array elements after applying a selector function.
 *
 * @param array - The array to process
 * @param selector - A function that extracts a numeric value from each element
 * @returns The sum of selected values, or 0 for empty arrays
 * @throws Error if selector is not a function
 */
export function sumBy<T>(array: Array<T>, selector: (item: T) => number): number {
  if (isEmpty(array)) {
    return 0;
  }
  
  if (typeof selector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: selector must be a function`);
  }
  
  return array.reduce((acc, item) => acc + selector(item), 0);
}

/**
 * Calculates the average of numeric array elements.
 *
 * @param array - The array of numbers
 * @returns The average of all elements, or 0 for empty arrays
 */
export function average(array: Array<number>): number {
  if (isEmpty(array)) {
    return 0;
  }
  
  return sum(array) / array.length;
}

/**
 * Calculates the average of array elements after applying a selector function.
 *
 * @param array - The array to process
 * @param selector - A function that extracts a numeric value from each element
 * @returns The average of selected values, or 0 for empty arrays
 * @throws Error if selector is not a function
 */
export function averageBy<T>(array: Array<T>, selector: (item: T) => number): number {
  if (isEmpty(array)) {
    return 0;
  }
  
  if (typeof selector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: selector must be a function`);
  }
  
  return sumBy(array, selector) / array.length;
}

/**
 * Finds the minimum value in a numeric array.
 *
 * @param array - The array of numbers
 * @returns The minimum value, or undefined for empty arrays
 */
export function min(array: Array<number>): number | undefined {
  if (isEmpty(array)) {
    return undefined;
  }
  
  return Math.min(...array);
}

/**
 * Finds the element with the minimum value after applying a selector function.
 *
 * @param array - The array to process
 * @param selector - A function that extracts a numeric value from each element
 * @returns The element with the minimum selected value, or undefined for empty arrays
 * @throws Error if selector is not a function
 */
export function minBy<T>(array: Array<T>, selector: (item: T) => number): T | undefined {
  if (isEmpty(array)) {
    return undefined;
  }
  
  if (typeof selector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: selector must be a function`);
  }
  
  if (array.length === 1) {
    return array[0];
  }
  
  return array.reduce((minItem, item) => {
    return selector(item) < selector(minItem) ? item : minItem;
  }, array[0]);
}

/**
 * Finds the maximum value in a numeric array.
 *
 * @param array - The array of numbers
 * @returns The maximum value, or undefined for empty arrays
 */
export function max(array: Array<number>): number | undefined {
  if (isEmpty(array)) {
    return undefined;
  }
  
  return Math.max(...array);
}

/**
 * Finds the element with the maximum value after applying a selector function.
 *
 * @param array - The array to process
 * @param selector - A function that extracts a numeric value from each element
 * @returns The element with the maximum selected value, or undefined for empty arrays
 * @throws Error if selector is not a function
 */
export function maxBy<T>(array: Array<T>, selector: (item: T) => number): T | undefined {
  if (isEmpty(array)) {
    return undefined;
  }
  
  if (typeof selector !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: selector must be a function`);
  }
  
  if (array.length === 1) {
    return array[0];
  }
  
  return array.reduce((maxItem, item) => {
    return selector(item) > selector(maxItem) ? item : maxItem;
  }, array[0]);
}

/**
 * Randomly shuffles array elements using the Fisher-Yates algorithm.
 *
 * @param array - The array to shuffle
 * @returns A new array with shuffled elements
 */
export function shuffle<T>(array: Array<T>): Array<T> {
  if (isEmpty(array)) {
    return [];
  }
  
  const result = [...array];
  
  // Implementation of Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Creates an array of numbers within a specified range.
 *
 * @param start - The start of the range
 * @param end - The end of the range (inclusive)
 * @param step - The step between values (default: 1)
 * @returns An array of numbers in the specified range
 * @throws Error if step is zero or in the wrong direction
 */
export function range(start: number, end: number, step: number = 1): Array<number> {
  if (step === 0) {
    throw new Error(`${ErrorCode.INVALID_INPUT}: Step cannot be zero`);
  }
  
  if ((start < end && step < 0) || (start > end && step > 0)) {
    throw new Error(`${ErrorCode.INVALID_INPUT}: Invalid step direction`);
  }
  
  const length = Math.floor(Math.abs((end - start) / step)) + 1;
  return Array.from({ length }, (_, i) => start + (i * step));
}

/**
 * Creates an array of grouped elements from multiple arrays.
 * The first element of the result contains the first elements of the input arrays, etc.
 *
 * @param arrays - The arrays to zip together
 * @returns A new array of grouped elements
 */
export function zip(...arrays: Array<Array<any>>): Array<Array<any>> {
  if (isEmpty(arrays) || arrays.some(arr => isEmpty(arr))) {
    return [];
  }
  
  const minLength = Math.min(...arrays.map(arr => arr.length));
  const result = [];
  
  for (let i = 0; i < minLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  
  return result;
}

/**
 * Splits an array into two groups based on a predicate function.
 *
 * @param array - The array to partition
 * @param predicate - A function that determines which group an element belongs to
 * @returns A tuple of two arrays: elements that pass the predicate and elements that don't
 * @throws Error if predicate is not a function
 */
export function partition<T>(array: Array<T>, predicate: (item: T) => boolean): [Array<T>, Array<T>] {
  if (isEmpty(array)) {
    return [[], []];
  }
  
  if (typeof predicate !== 'function') {
    throw new Error(`${ErrorCode.INVALID_INPUT}: predicate must be a function`);
  }
  
  const matches: Array<T> = [];
  const nonMatches: Array<T> = [];
  
  for (const item of array) {
    if (predicate(item)) {
      matches.push(item);
    } else {
      nonMatches.push(item);
    }
  }
  
  return [matches, nonMatches];
}