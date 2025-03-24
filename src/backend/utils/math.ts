/**
 * Utility functions for mathematical operations and financial calculations
 * used throughout the HCBS Revenue Management System.
 * 
 * This module provides standardized methods for common mathematical operations,
 * financial calculations, and numerical transformations to ensure consistency
 * and accuracy across the application.
 */

// Global constants for precision and comparison
/**
 * Default precision for decimal calculations
 */
export const DECIMAL_PRECISION = 2;

/**
 * Default precision for percentage calculations
 */
export const PERCENTAGE_PRECISION = 2;

/**
 * Default precision for currency calculations
 */
export const CURRENCY_PRECISION = 2;

/**
 * Small value used for floating-point comparison to avoid precision errors
 */
export const EPSILON = 1e-6;

/**
 * Rounds a number to a specified number of decimal places
 * 
 * @param value - The number to round
 * @param decimals - The number of decimal places (defaults to DECIMAL_PRECISION)
 * @returns The rounded value
 */
export function roundToDecimal(value: number, decimals: number = DECIMAL_PRECISION): number {
  // Validate input parameters
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  
  // Calculate multiplier as 10^decimals
  const multiplier = Math.pow(10, decimals);
  
  // Round the value using Math.round(value * multiplier) / multiplier
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Rounds a monetary value to 2 decimal places
 * 
 * @param value - The monetary value to round
 * @returns The rounded currency value
 */
export function roundCurrency(value: number): number {
  return roundToDecimal(value, CURRENCY_PRECISION);
}

/**
 * Calculates a percentage value from a part and a whole
 * 
 * @param part - The part value
 * @param whole - The whole value
 * @returns The percentage value (0-100)
 */
export function calculatePercentage(part: number, whole: number): number {
  // Validate input parameters
  if (part === null || part === undefined || isNaN(part)) {
    return 0;
  }
  
  if (whole === null || whole === undefined || isNaN(whole)) {
    return 0;
  }
  
  // If whole is 0 or close to 0 (less than EPSILON), return 0 to avoid division by zero
  if (Math.abs(whole) < EPSILON) {
    return 0;
  }
  
  // Calculate percentage as (part / whole) * 100
  const percentage = (part / whole) * 100;
  
  // Round to PERCENTAGE_PRECISION decimal places
  return roundToDecimal(percentage, PERCENTAGE_PRECISION);
}

/**
 * Calculates the percentage change between two values
 * 
 * @param currentValue - The current value
 * @param previousValue - The previous value
 * @returns The percentage change
 */
export function calculateChange(currentValue: number, previousValue: number): number {
  // Validate input parameters
  if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
    return 0;
  }
  
  if (previousValue === null || previousValue === undefined || isNaN(previousValue)) {
    return 0;
  }
  
  // If previousValue is 0 or close to 0 (less than EPSILON), handle as special case
  if (Math.abs(previousValue) < EPSILON) {
    // If currentValue is also 0, return 0 (no change)
    if (Math.abs(currentValue) < EPSILON) {
      return 0;
    }
    // If currentValue is positive, return 100 (new appearance)
    if (currentValue > 0) {
      return 100;
    }
    // If currentValue is negative, return -100 (new appearance but negative)
    return -100;
  }
  
  // Calculate change as ((currentValue - previousValue) / Math.abs(previousValue)) * 100
  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  
  // Round to PERCENTAGE_PRECISION decimal places
  return roundToDecimal(change, PERCENTAGE_PRECISION);
}

/**
 * Calculates the average of an array of numbers
 * 
 * @param values - Array of numbers to average
 * @returns The average value
 */
export function calculateAverage(values: number[]): number {
  // Validate input array
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  // Filter out any non-numeric values
  const validValues = values.filter(val => val !== null && val !== undefined && !isNaN(val));
  
  // If filtered array is empty, return 0
  if (validValues.length === 0) {
    return 0;
  }
  
  // Calculate sum of all values
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  
  // Calculate average as sum / array.length
  const average = sum / validValues.length;
  
  // Round to DECIMAL_PRECISION decimal places
  return roundToDecimal(average);
}

/**
 * Calculates the median of an array of numbers
 * 
 * @param values - Array of numbers to find median
 * @returns The median value
 */
export function calculateMedian(values: number[]): number {
  // Validate input array
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  // Filter out any non-numeric values
  const validValues = values.filter(val => val !== null && val !== undefined && !isNaN(val));
  
  // If filtered array is empty, return 0
  if (validValues.length === 0) {
    return 0;
  }
  
  // Sort the array in ascending order
  const sortedValues = [...validValues].sort((a, b) => a - b);
  
  const length = sortedValues.length;
  let median: number;
  
  // If array length is odd, return the middle value
  if (length % 2 === 1) {
    median = sortedValues[Math.floor(length / 2)];
  } else {
    // If array length is even, return the average of the two middle values
    const middle1 = sortedValues[length / 2 - 1];
    const middle2 = sortedValues[length / 2];
    median = (middle1 + middle2) / 2;
  }
  
  // Round to DECIMAL_PRECISION decimal places
  return roundToDecimal(median);
}

/**
 * Calculates the sum of an array of numbers
 * 
 * @param values - Array of numbers to sum
 * @returns The sum of all values
 */
export function calculateSum(values: number[]): number {
  // Validate input array
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  // Filter out any non-numeric values
  const validValues = values.filter(val => val !== null && val !== undefined && !isNaN(val));
  
  // If filtered array is empty, return 0
  if (validValues.length === 0) {
    return 0;
  }
  
  // Calculate sum using reduce method
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  
  // Round to DECIMAL_PRECISION decimal places
  return roundToDecimal(sum);
}

/**
 * Calculates the weighted average of values with corresponding weights
 * 
 * @param values - Array of values
 * @param weights - Array of weights for each value
 * @returns The weighted average
 */
export function calculateWeightedAverage(values: number[], weights: number[]): number {
  // Validate input arrays
  if (!Array.isArray(values) || !Array.isArray(weights)) {
    return 0;
  }
  
  if (values.length === 0 || weights.length === 0) {
    return 0;
  }
  
  // If arrays have different lengths, throw an error
  if (values.length !== weights.length) {
    throw new Error('Values and weights arrays must have the same length');
  }
  
  // Filter out pairs with non-numeric values or weights
  let weightedSum = 0;
  let weightsSum = 0;
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const weight = weights[i];
    
    if (value !== null && value !== undefined && !isNaN(value) &&
        weight !== null && weight !== undefined && !isNaN(weight)) {
      weightedSum += value * weight;
      weightsSum += weight;
    }
  }
  
  // If sum of weights is 0, return 0 to avoid division by zero
  if (Math.abs(weightsSum) < EPSILON) {
    return 0;
  }
  
  // Calculate weighted average as sum of (value * weight) / sum of weights
  const weightedAverage = weightedSum / weightsSum;
  
  // Round to DECIMAL_PRECISION decimal places
  return roundToDecimal(weightedAverage);
}

/**
 * Checks if two numbers are equal within a specified tolerance
 * 
 * @param value1 - First value to compare
 * @param value2 - Second value to compare
 * @param tolerance - Tolerance for comparison (defaults to EPSILON)
 * @returns True if the values are within tolerance
 */
export function isWithinTolerance(value1: number, value2: number, tolerance: number = EPSILON): boolean {
  // Validate input parameters
  if (value1 === null || value1 === undefined || isNaN(value1) ||
      value2 === null || value2 === undefined || isNaN(value2)) {
    return false;
  }
  
  // Calculate absolute difference between value1 and value2
  const diff = Math.abs(value1 - value2);
  
  // Return true if difference is less than or equal to tolerance
  // Otherwise return false
  return diff <= tolerance;
}

/**
 * Constrains a number between a minimum and maximum value
 * 
 * @param value - Value to constrain
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  // Validate input parameters
  if (value === null || value === undefined || isNaN(value) ||
      min === null || min === undefined || isNaN(min) ||
      max === null || max === undefined || isNaN(max)) {
    return 0;
  }
  
  // If value is less than min, return min
  if (value < min) {
    return min;
  }
  
  // If value is greater than max, return max
  if (value > max) {
    return max;
  }
  
  // Otherwise return value
  return value;
}

/**
 * Calculates Days Sales Outstanding (DSO) financial metric
 * 
 * @param accountsReceivable - Total accounts receivable
 * @param averageDailyRevenue - Average daily revenue
 * @returns The DSO value in days
 */
export function calculateDSO(accountsReceivable: number, averageDailyRevenue: number): number {
  // Validate input parameters
  if (accountsReceivable === null || accountsReceivable === undefined || isNaN(accountsReceivable) ||
      averageDailyRevenue === null || averageDailyRevenue === undefined || isNaN(averageDailyRevenue)) {
    return 0;
  }
  
  // If averageDailyRevenue is 0 or close to 0 (less than EPSILON), return 0 to avoid division by zero
  if (Math.abs(averageDailyRevenue) < EPSILON) {
    return 0;
  }
  
  // Calculate DSO as accountsReceivable / averageDailyRevenue
  const dso = accountsReceivable / averageDailyRevenue;
  
  // Round to nearest whole number using Math.round
  return Math.round(dso);
}

/**
 * Calculates the collection rate as a percentage of payments received vs expected
 * 
 * @param paymentsReceived - Total payments received
 * @param expectedPayments - Total payments expected
 * @returns The collection rate as a percentage
 */
export function calculateCollectionRate(paymentsReceived: number, expectedPayments: number): number {
  // Validate input parameters
  if (paymentsReceived === null || paymentsReceived === undefined || isNaN(paymentsReceived) ||
      expectedPayments === null || expectedPayments === undefined || isNaN(expectedPayments)) {
    return 0;
  }
  
  // If expectedPayments is 0 or close to 0 (less than EPSILON), return 0 to avoid division by zero
  if (Math.abs(expectedPayments) < EPSILON) {
    return 0;
  }
  
  // Calculate collection rate as (paymentsReceived / expectedPayments) * 100
  const collectionRate = (paymentsReceived / expectedPayments) * 100;
  
  // Round to PERCENTAGE_PRECISION decimal places
  return roundToDecimal(collectionRate, PERCENTAGE_PRECISION);
}

/**
 * Calculates the clean claim rate as a percentage of claims accepted without errors
 * 
 * @param totalClaims - Total number of claims submitted
 * @param rejectedClaims - Number of claims rejected due to errors
 * @returns The clean claim rate as a percentage
 */
export function calculateCleanClaimRate(totalClaims: number, rejectedClaims: number): number {
  // Validate input parameters
  if (totalClaims === null || totalClaims === undefined || isNaN(totalClaims) ||
      rejectedClaims === null || rejectedClaims === undefined || isNaN(rejectedClaims)) {
    return 0;
  }
  
  // If totalClaims is 0, return 0 to avoid division by zero
  if (totalClaims === 0) {
    return 0;
  }
  
  // Calculate clean claims as (totalClaims - rejectedClaims)
  const cleanClaims = totalClaims - rejectedClaims;
  
  // Calculate clean claim rate as (cleanClaims / totalClaims) * 100
  const cleanClaimRate = (cleanClaims / totalClaims) * 100;
  
  // Round to PERCENTAGE_PRECISION decimal places
  return roundToDecimal(cleanClaimRate, PERCENTAGE_PRECISION);
}

/**
 * Calculates the denial rate as a percentage of claims denied
 * 
 * @param deniedClaims - Number of claims denied
 * @param totalClaims - Total number of claims
 * @returns The denial rate as a percentage
 */
export function calculateDenialRate(deniedClaims: number, totalClaims: number): number {
  // Validate input parameters
  if (deniedClaims === null || deniedClaims === undefined || isNaN(deniedClaims) ||
      totalClaims === null || totalClaims === undefined || isNaN(totalClaims)) {
    return 0;
  }
  
  // If totalClaims is 0, return 0 to avoid division by zero
  if (totalClaims === 0) {
    return 0;
  }
  
  // Calculate denial rate as (deniedClaims / totalClaims) * 100
  const denialRate = (deniedClaims / totalClaims) * 100;
  
  // Round to PERCENTAGE_PRECISION decimal places
  return roundToDecimal(denialRate, PERCENTAGE_PRECISION);
}

/**
 * Calculates linear regression parameters (slope and intercept) for a set of data points
 * 
 * @param xValues - Array of x-coordinate values
 * @param yValues - Array of y-coordinate values
 * @returns Object containing slope, intercept, and R-squared value
 */
export function calculateLinearRegression(xValues: number[], yValues: number[]): { slope: number; intercept: number; r2: number } {
  // Validate input arrays
  if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
    throw new Error('xValues and yValues must be arrays');
  }
  
  if (xValues.length === 0 || yValues.length === 0) {
    throw new Error('xValues and yValues cannot be empty');
  }
  
  if (xValues.length !== yValues.length) {
    throw new Error('xValues and yValues must have the same length');
  }
  
  // Filter out pairs with non-numeric values
  const validPairs: [number, number][] = [];
  
  for (let i = 0; i < xValues.length; i++) {
    const x = xValues[i];
    const y = yValues[i];
    
    if (x !== null && x !== undefined && !isNaN(x) &&
        y !== null && y !== undefined && !isNaN(y)) {
      validPairs.push([x, y]);
    }
  }
  
  if (validPairs.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }
  
  // Calculate means of x and y values
  let sumX = 0;
  let sumY = 0;
  
  for (const [x, y] of validPairs) {
    sumX += x;
    sumY += y;
  }
  
  const meanX = sumX / validPairs.length;
  const meanY = sumY / validPairs.length;
  
  // Calculate sum of squares and sum of products
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;
  
  for (const [x, y] of validPairs) {
    const xDiff = x - meanX;
    const yDiff = y - meanY;
    
    sumXY += xDiff * yDiff;
    sumXX += xDiff * xDiff;
    sumYY += yDiff * yDiff;
  }
  
  // Calculate slope as sum of products divided by sum of squares
  const slope = sumXX === 0 ? 0 : sumXY / sumXX;
  
  // Calculate intercept as mean of y minus slope times mean of x
  const intercept = meanY - slope * meanX;
  
  // Calculate R-squared (coefficient of determination)
  const r2 = sumXX === 0 || sumYY === 0 ? 0 : (sumXY * sumXY) / (sumXX * sumYY);
  
  return {
    slope: roundToDecimal(slope),
    intercept: roundToDecimal(intercept),
    r2: roundToDecimal(r2, 4)
  };
}

/**
 * Calculates a trend line for a series of values
 * 
 * @param values - Array of values to calculate trend for
 * @returns Array of trend line values
 */
export function calculateTrend(values: number[]): number[] {
  // Validate input array
  if (!Array.isArray(values) || values.length < 2) {
    return [...values];
  }
  
  // Create x values array as indices (0, 1, 2, ...)
  const xValues = values.map((_, index) => index);
  
  // Calculate linear regression parameters using calculateLinearRegression
  const { slope, intercept } = calculateLinearRegression(xValues, values);
  
  // Generate trend line values using the regression formula
  const trendValues = xValues.map(x => slope * x + intercept);
  
  // Round each value to DECIMAL_PRECISION decimal places
  return trendValues.map(value => roundToDecimal(value));
}

/**
 * Calculates a moving average for a series of values
 * 
 * @param values - Array of values to calculate moving average for
 * @param windowSize - Size of the moving average window
 * @returns Array of moving average values
 */
export function calculateMovingAverage(values: number[], windowSize: number): number[] {
  // Validate input array and windowSize
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  
  if (windowSize <= 0 || !Number.isInteger(windowSize)) {
    throw new Error('Window size must be a positive integer');
  }
  
  // If array has fewer values than windowSize, return array of averages with available values
  if (values.length < windowSize) {
    // Return cumulative averages for the available data
    const result: number[] = [];
    let sum = 0;
    
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      result.push(roundToDecimal(sum / (i + 1)));
    }
    
    return result;
  }
  
  // Initialize result array
  const result: number[] = [];
  
  // For each position in the result
  for (let i = 0; i <= values.length - windowSize; i++) {
    // Calculate average of values in the current window
    let sum = 0;
    
    for (let j = 0; j < windowSize; j++) {
      sum += values[i + j];
    }
    
    const average = sum / windowSize;
    
    // Add to result array
    result.push(roundToDecimal(average));
  }
  
  // Round each value to DECIMAL_PRECISION decimal places
  return result;
}

/**
 * Calculates the standard deviation of a set of values
 * 
 * @param values - Array of values to calculate standard deviation for
 * @returns The standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  // Validate input array
  if (!Array.isArray(values) || values.length < 2) {
    return 0;
  }
  
  // Filter out any non-numeric values
  const validValues = values.filter(val => val !== null && val !== undefined && !isNaN(val));
  
  if (validValues.length < 2) {
    return 0;
  }
  
  // Calculate mean of values
  const mean = calculateAverage(validValues);
  
  // Calculate sum of squared differences from mean
  const sumSquaredDiff = validValues.reduce((acc, val) => {
    const diff = val - mean;
    return acc + diff * diff;
  }, 0);
  
  // Calculate variance as sum of squares divided by (n-1)
  const variance = sumSquaredDiff / (validValues.length - 1);
  
  // Calculate standard deviation as square root of variance
  const stdDev = Math.sqrt(variance);
  
  // Round to DECIMAL_PRECISION decimal places
  return roundToDecimal(stdDev);
}

/**
 * Calculates the difference between payment amount and sum of allocated amounts
 * 
 * @param paymentAmount - Total payment amount
 * @param allocatedAmounts - Array of amounts allocated to claims
 * @returns The difference amount
 */
export function calculatePaymentReconciliationDifference(paymentAmount: number, allocatedAmounts: number[]): number {
  // Validate input parameters
  if (paymentAmount === null || paymentAmount === undefined || isNaN(paymentAmount)) {
    return 0;
  }
  
  if (!Array.isArray(allocatedAmounts)) {
    return paymentAmount;
  }
  
  // Calculate sum of allocated amounts
  const totalAllocated = calculateSum(allocatedAmounts);
  
  // Calculate difference as paymentAmount minus sum of allocated amounts
  const difference = paymentAmount - totalAllocated;
  
  // Round to CURRENCY_PRECISION decimal places
  return roundToDecimal(difference, CURRENCY_PRECISION);
}