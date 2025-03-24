/**
 * Utility functions for array manipulation and transformation in the HCBS Revenue Management System frontend.
 * Provides reusable helper functions for common array operations used throughout the application,
 * with a focus on type safety and performance.
 */

/**
 * Checks if an array is empty, null, or undefined
 * @param arr - The array to check
 * @returns True if the array is empty, null, or undefined
 */
export const isEmpty = <T>(arr: Array<T> | null | undefined): boolean => {
  return arr === null || arr === undefined || arr.length === 0;
};

/**
 * Checks if an array is not empty (has at least one element)
 * @param arr - The array to check
 * @returns True if the array has at least one element
 */
export const isNotEmpty = <T>(arr: Array<T> | null | undefined): boolean => {
  return !isEmpty(arr);
};

/**
 * Splits an array into chunks of the specified size
 * @param arr - The array to split
 * @param size - The chunk size
 * @returns Array of chunks
 */
export const chunk = <T>(arr: Array<T>, size: number): Array<Array<T>> => {
  if (isEmpty(arr)) {
    return [];
  }
  
  const result: Array<Array<T>> = [];
  
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  
  return result;
};

/**
 * Returns a new array with duplicate elements removed
 * @param arr - The array to process
 * @returns Array with unique elements
 */
export const unique = <T>(arr: Array<T>): Array<T> => {
  return [...new Set(arr)];
};

/**
 * Returns a new array with duplicate elements removed based on a key selector function
 * @param arr - The array to process
 * @param keySelector - Function to extract the key for comparison
 * @returns Array with unique elements based on key selector
 */
export const uniqueBy = <T, K>(arr: Array<T>, keySelector: (item: T) => K): Array<T> => {
  const map = new Map<K, T>();
  
  for (const item of arr) {
    const key = keySelector(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  
  return Array.from(map.values());
};

/**
 * Groups array elements by a key selector function
 * @param arr - The array to group
 * @param keySelector - Function to extract the key for grouping
 * @returns Object with groups of elements
 */
export const groupBy = <T, K extends string | number | symbol>(
  arr: Array<T>, 
  keySelector: (item: T) => K
): Record<string, Array<T>> => {
  const result: Record<string, Array<T>> = {} as Record<string, Array<T>>;
  
  for (const item of arr) {
    const key = String(keySelector(item));
    
    if (!result[key]) {
      result[key] = [];
    }
    
    result[key].push(item);
  }
  
  return result;
};

/**
 * Returns a new array sorted by a key selector function
 * @param arr - The array to sort
 * @param keySelector - Function to extract the key for sorting
 * @param descending - Whether to sort in descending order (default: false)
 * @returns Sorted array
 */
export const sortBy = <T, K>(
  arr: Array<T>, 
  keySelector: (item: T) => K,
  descending: boolean = false
): Array<T> => {
  const copy = [...arr];
  
  return copy.sort((a, b) => {
    const keyA = keySelector(a);
    const keyB = keySelector(b);
    
    if (keyA < keyB) {
      return descending ? 1 : -1;
    }
    if (keyA > keyB) {
      return descending ? -1 : 1;
    }
    return 0;
  });
};

/**
 * Flattens a nested array structure by one level
 * @param arr - The nested array to flatten
 * @returns Flattened array
 */
export const flatten = <T>(arr: Array<Array<T>>): Array<T> => {
  return arr.flat(1);
};

/**
 * Recursively flattens a deeply nested array structure
 * @param arr - The deeply nested array to flatten
 * @returns Deeply flattened array
 */
export const deepFlatten = <T>(arr: Array<any>): Array<T> => {
  return arr.flat(Infinity) as Array<T>;
};

/**
 * Calculates the sum of all elements in a numeric array
 * @param arr - The array of numbers
 * @returns Sum of all elements
 */
export const sum = (arr: Array<number>): number => {
  return arr.reduce((acc, val) => acc + val, 0);
};

/**
 * Calculates the sum of values returned by a selector function for each element
 * @param arr - The array to process
 * @param selector - Function to extract the numeric value from each element
 * @returns Sum of selected values
 */
export const sumBy = <T>(arr: Array<T>, selector: (item: T) => number): number => {
  return arr.reduce((acc, item) => acc + selector(item), 0);
};

/**
 * Calculates the average of all elements in a numeric array
 * @param arr - The array of numbers
 * @returns Average of all elements
 */
export const average = (arr: Array<number>): number => {
  if (isEmpty(arr)) {
    return 0;
  }
  
  return sum(arr) / arr.length;
};

/**
 * Calculates the average of values returned by a selector function for each element
 * @param arr - The array to process
 * @param selector - Function to extract the numeric value from each element
 * @returns Average of selected values
 */
export const averageBy = <T>(arr: Array<T>, selector: (item: T) => number): number => {
  if (isEmpty(arr)) {
    return 0;
  }
  
  return sumBy(arr, selector) / arr.length;
};

/**
 * Finds the minimum value in a numeric array
 * @param arr - The array of numbers
 * @returns Minimum value or undefined if array is empty
 */
export const min = (arr: Array<number>): number | undefined => {
  if (isEmpty(arr)) {
    return undefined;
  }
  
  return Math.min(...arr);
};

/**
 * Finds the minimum value returned by a selector function for each element
 * @param arr - The array to process
 * @param selector - Function to extract the numeric value from each element
 * @returns Element with minimum selected value or undefined if array is empty
 */
export const minBy = <T>(arr: Array<T>, selector: (item: T) => number): T | undefined => {
  if (isEmpty(arr)) {
    return undefined;
  }
  
  let minItem = arr[0];
  let minValue = selector(minItem);
  
  for (let i = 1; i < arr.length; i++) {
    const value = selector(arr[i]);
    if (value < minValue) {
      minItem = arr[i];
      minValue = value;
    }
  }
  
  return minItem;
};

/**
 * Finds the maximum value in a numeric array
 * @param arr - The array of numbers
 * @returns Maximum value or undefined if array is empty
 */
export const max = (arr: Array<number>): number | undefined => {
  if (isEmpty(arr)) {
    return undefined;
  }
  
  return Math.max(...arr);
};

/**
 * Finds the maximum value returned by a selector function for each element
 * @param arr - The array to process
 * @param selector - Function to extract the numeric value from each element
 * @returns Element with maximum selected value or undefined if array is empty
 */
export const maxBy = <T>(arr: Array<T>, selector: (item: T) => number): T | undefined => {
  if (isEmpty(arr)) {
    return undefined;
  }
  
  let maxItem = arr[0];
  let maxValue = selector(maxItem);
  
  for (let i = 1; i < arr.length; i++) {
    const value = selector(arr[i]);
    if (value > maxValue) {
      maxItem = arr[i];
      maxValue = value;
    }
  }
  
  return maxItem;
};

/**
 * Returns an array of elements that exist in all provided arrays
 * @param arr - The first array
 * @param arrays - Additional arrays to compare
 * @returns Array of common elements
 */
export const intersection = <T>(arr: Array<T>, ...arrays: Array<Array<T>>): Array<T> => {
  if (isEmpty(arr) || arrays.some(a => isEmpty(a))) {
    return [];
  }
  
  let result = new Set(arr);
  
  for (const array of arrays) {
    result = new Set(array.filter(item => result.has(item)));
  }
  
  return Array.from(result);
};

/**
 * Returns an array of elements that exist in the first array but not in the others
 * @param arr - The first array
 * @param arrays - Arrays to exclude elements from
 * @returns Array of elements unique to the first array
 */
export const difference = <T>(arr: Array<T>, ...arrays: Array<Array<T>>): Array<T> => {
  const excludeSet = new Set<T>(arrays.flat());
  
  return arr.filter(item => !excludeSet.has(item));
};

/**
 * Returns an array of unique elements from all provided arrays
 * @param arr - The first array
 * @param arrays - Additional arrays to include
 * @returns Array of unique elements from all arrays
 */
export const union = <T>(arr: Array<T>, ...arrays: Array<Array<T>>): Array<T> => {
  return unique([...arr, ...arrays.flat()]);
};

/**
 * Returns a new array with elements randomly shuffled
 * @param arr - The array to shuffle
 * @returns Shuffled array
 */
export const shuffle = <T>(arr: Array<T>): Array<T> => {
  const copy = [...arr];
  
  // Fisher-Yates shuffle algorithm
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  
  return copy;
};

/**
 * Creates an array of numbers progressing from start up to, but not including, end
 * @param start - The start of the range
 * @param end - The end of the range (exclusive)
 * @param step - The value to increment by (default: 1)
 * @returns Array of numbers in the specified range
 */
export const range = (start: number, end: number, step: number = 1): Array<number> => {
  const length = Math.max(Math.ceil((end - start) / step), 0);
  const result = Array(length);
  
  for (let i = 0; i < length; i++) {
    result[i] = start + i * step;
  }
  
  return result;
};

/**
 * Splits an array into two groups based on a predicate function
 * @param arr - The array to partition
 * @param predicate - Function to test each element
 * @returns Array containing two groups: elements that satisfy the predicate and elements that don't
 */
export const partition = <T>(arr: Array<T>, predicate: (item: T) => boolean): [Array<T>, Array<T>] => {
  const pass: Array<T> = [];
  const fail: Array<T> = [];
  
  for (const item of arr) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  
  return [pass, fail];
};

/**
 * Finds duplicate elements in an array
 * @param arr - The array to process
 * @returns Array of duplicate elements
 */
export const findDuplicates = <T>(arr: Array<T>): Array<T> => {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  
  return Array.from(duplicates);
};

/**
 * Finds duplicate elements in an array based on a key selector function
 * @param arr - The array to process
 * @param keySelector - Function to extract the key for comparison
 * @returns Array of duplicate elements based on key selector
 */
export const findDuplicatesBy = <T, K>(arr: Array<T>, keySelector: (item: T) => K): Array<T> => {
  const keyMap = new Map<K, T>();
  const duplicates: Array<T> = [];
  
  for (const item of arr) {
    const key = keySelector(item);
    
    if (keyMap.has(key)) {
      duplicates.push(item);
    } else {
      keyMap.set(key, item);
    }
  }
  
  return duplicates;
};

/**
 * Converts an array to a Map using a key selector function
 * @param arr - The array to convert
 * @param keySelector - Function to extract the key for each element
 * @returns Map with keys generated by the key selector
 */
export const toMap = <T, K>(arr: Array<T>, keySelector: (item: T) => K): Map<K, T> => {
  const map = new Map<K, T>();
  
  for (const item of arr) {
    map.set(keySelector(item), item);
  }
  
  return map;
};

/**
 * Converts an array to a Record object using a key selector function
 * @param arr - The array to convert
 * @param keySelector - Function to extract the key for each element
 * @returns Record object with keys generated by the key selector
 */
export const toRecord = <T>(arr: Array<T>, keySelector: (item: T) => string): Record<string, T> => {
  const record: Record<string, T> = {};
  
  for (const item of arr) {
    record[keySelector(item)] = item;
  }
  
  return record;
};