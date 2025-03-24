/**
 * Utility functions for route manipulation and URL handling in the HCBS Revenue Management System frontend.
 * This file provides reusable helper functions for building routes, parsing and constructing query strings,
 * and managing URL parameters.
 */

import { ROUTES, ROUTE_PARAMS, QUERY_PARAMS } from '../constants/routes.constants';
import { isEmpty } from './object';
import { ParsedUrlQuery } from 'querystring';

/**
 * Builds a route path by replacing parameter placeholders with actual values
 * 
 * @param route - Route path with parameter placeholders (e.g., "/clients/[id]")
 * @param params - Object containing parameter values (e.g., { id: '123' })
 * @returns Route with parameters replaced
 * 
 * @example
 * ```ts
 * buildRoute('/clients/[id]', { id: '123' }); // '/clients/123'
 * ```
 */
export function buildRoute(route: string, params: Record<string, string>): string {
  if (!route) {
    return '';
  }

  if (isEmpty(params)) {
    return route;
  }

  return route.replace(/\[([^\]]+)\]/g, (_, paramName) => {
    return params[paramName] || paramName;
  });
}

/**
 * Builds a query string from an object of parameters
 * 
 * @param params - Object containing query parameters
 * @returns URL query string (without the leading ?)
 * 
 * @example
 * ```ts
 * buildQueryString({ page: 1, limit: 10 }); // 'page=1&limit=10'
 * ```
 */
export function buildQueryString(params: Record<string, any>): string {
  if (isEmpty(params)) {
    return '';
  }

  return Object.entries(params)
    // Filter out null and undefined values
    .filter(([_, value]) => value != null)
    // Convert each parameter to key=value format with proper URL encoding
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    // Join all parameters with '&'
    .join('&');
}

/**
 * Parses a query string or query object into a structured object with typed values
 * 
 * @param query - Query string or parsed query object
 * @returns Parsed query parameters with appropriate types
 * 
 * @example
 * ```ts
 * parseQueryString('page=1&limit=10&active=true'); 
 * // { page: 1, limit: 10, active: true }
 * ```
 */
export function parseQueryString(query: ParsedUrlQuery | string): Record<string, any> {
  if (!query) {
    return {};
  }

  let queryObj: Record<string, string | string[]>;

  if (typeof query === 'string') {
    // If query is a string, parse it into an object
    queryObj = Object.fromEntries(
      query.replace(/^\?/, '')
        .split('&')
        .filter(Boolean)
        .map(part => {
          const [key, value] = part.split('=').map(decodeURIComponent);
          return [key, value];
        })
    );
  } else {
    // If query is already an object, use it directly
    queryObj = query;
  }

  // Convert values to appropriate types
  return Object.entries(queryObj).reduce((result, [key, value]) => {
    if (Array.isArray(value)) {
      // Handle array values
      result[key] = value.map(item => convertQueryValue(item));
    } else {
      // Handle single values
      result[key] = convertQueryValue(value);
    }
    return result;
  }, {} as Record<string, any>);
}

/**
 * Combines a route path with query parameters
 * 
 * @param route - Base route path
 * @param query - Query parameters to append
 * @returns Complete URL with query string
 * 
 * @example
 * ```ts
 * getRouteWithQuery('/clients', { page: 1, limit: 10 }); 
 * // '/clients?page=1&limit=10'
 * ```
 */
export function getRouteWithQuery(route: string, query: Record<string, any>): string {
  if (!route) {
    return '';
  }

  const queryString = buildQueryString(query);
  return queryString ? `${route}?${queryString}` : route;
}

/**
 * Checks if a URL is external (absolute URL)
 * 
 * @param url - URL to check
 * @returns True if the URL is external
 * 
 * @example
 * ```ts
 * isExternalUrl('https://example.com'); // true
 * isExternalUrl('/clients'); // false
 * ```
 */
export function isExternalUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('//');
}

/**
 * Checks if a given route matches the current path
 * 
 * @param route - Route to check
 * @param currentPath - Current browser path
 * @param exact - Whether to check for exact match
 * @returns True if the route is active
 * 
 * @example
 * ```ts
 * isActiveRoute('/clients', '/clients/123', false); // true
 * isActiveRoute('/clients', '/clients/123', true); // false
 * ```
 */
export function isActiveRoute(route: string, currentPath: string, exact: boolean = false): boolean {
  if (!route || !currentPath) {
    return false;
  }

  if (exact) {
    return route === currentPath;
  }

  return currentPath.startsWith(route);
}

/**
 * Gets the parent route of a given path
 * 
 * @param path - Current path
 * @returns Parent route path
 * 
 * @example
 * ```ts
 * getParentRoute('/clients/123/edit'); // '/clients/123'
 * getParentRoute('/dashboard'); // '/'
 * ```
 */
export function getParentRoute(path: string): string {
  if (!path) {
    return '/';
  }

  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) {
    return '/';
  }

  parts.pop();
  return parts.length === 0 ? '/' : `/${parts.join('/')}`;
}

/**
 * Helper function to convert query string values to appropriate types
 * 
 * @param value - Query string value
 * @returns Converted value with appropriate type
 */
function convertQueryValue(value: string): any {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (value === 'null') {
    return null;
  }
  if (value === 'undefined') {
    return undefined;
  }
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  return value;
}

// Re-export route constants
export { ROUTES, ROUTE_PARAMS, QUERY_PARAMS };