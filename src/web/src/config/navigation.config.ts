/**
 * Navigation Configuration
 * 
 * This file provides navigation settings and utilities for the HCBS Revenue Management System.
 * It defines the navigation structure, handles permission-based access to navigation items,
 * and provides helper functions for navigation-related operations.
 */

import {
  NAVIGATION_ITEMS,
  SECONDARY_NAVIGATION_ITEMS,
  MOBILE_NAVIGATION_ITEMS,
  NAVIGATION_ICONS,
  NavigationItem
} from '../constants/navigation.constants';
import { ROUTES } from '../constants/routes.constants';

/**
 * Finds a navigation item by its path
 *
 * @param path - The path to search for
 * @param items - Navigation items to search within (defaults to all items)
 * @returns The found navigation item or undefined
 */
export const getNavigationItemByPath = (
  path: string,
  items: NavigationItem[] = [...NAVIGATION_ITEMS, ...SECONDARY_NAVIGATION_ITEMS, ...MOBILE_NAVIGATION_ITEMS]
): NavigationItem | undefined => {
  for (const item of items) {
    // Check for exact path match
    if (item.path === path) {
      return item;
    }
    
    // Check for dynamic route match (e.g., /clients/[id] should match /clients/123)
    if (item.path.includes('[') && item.path.includes(']')) {
      // Convert route pattern to regex
      const regexPattern = item.path
        .replace(/\//g, '\\/') // Escape slashes
        .replace(/\[([^\]]+)\]/g, '([^\\/]+)'); // Convert [param] to capture group
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(path)) {
        return item;
      }
    }

    // Recursively check children if the item has children
    if (item.children && item.children.length > 0) {
      const childMatch = getNavigationItemByPath(path, item.children);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return undefined;
};

/**
 * Finds a navigation item by its ID
 *
 * @param id - The ID to search for
 * @param items - Navigation items to search within (defaults to all items)
 * @returns The found navigation item or undefined
 */
export const getNavigationItemById = (
  id: string,
  items: NavigationItem[] = [...NAVIGATION_ITEMS, ...SECONDARY_NAVIGATION_ITEMS, ...MOBILE_NAVIGATION_ITEMS]
): NavigationItem | undefined => {
  for (const item of items) {
    // Check if current item matches the ID
    if (item.id === id) {
      return item;
    }

    // Recursively check children if the item has children
    if (item.children && item.children.length > 0) {
      const childMatch = getNavigationItemById(id, item.children);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return undefined;
};

/**
 * Filters navigation items based on user permissions
 *
 * @param items - Navigation items to filter
 * @param hasPermission - Function that checks if user has a permission
 * @returns Filtered navigation items
 */
export const filterNavigationItemsByPermission = (
  items: NavigationItem[],
  hasPermission: (permission: string) => boolean
): NavigationItem[] => {
  return items
    .filter(item => {
      // Check if user has all required permissions for this item
      const hasRequiredPermissions = 
        !item.requiredPermissions || 
        item.requiredPermissions.length === 0 || 
        item.requiredPermissions.every(permission => hasPermission(permission));
      
      // If user doesn't have permissions, filter out this item
      if (!hasRequiredPermissions) {
        return false;
      }
      
      // If item has children, check if at least one child will be visible
      if (item.children && item.children.length > 0) {
        const hasVisibleChild = item.children.some(child => {
          const childHasPermission = 
            !child.requiredPermissions || 
            child.requiredPermissions.length === 0 || 
            child.requiredPermissions.every(permission => hasPermission(permission));
          
          return childHasPermission;
        });
        
        // Only keep parent items that have at least one visible child
        // or explicitly have permission themselves
        return hasVisibleChild || hasRequiredPermissions;
      }
      
      return true;
    })
    .map(item => {
      // If item has children, recursively filter them
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: filterNavigationItemsByPermission(item.children, hasPermission)
        };
      }
      return item;
    });
};

/**
 * Generates breadcrumb items based on the current path
 *
 * @param currentPath - The current path
 * @returns Array of breadcrumb items with label and path
 */
export const getBreadcrumbItems = (
  currentPath: string
): Array<{ label: string; path: string }> => {
  const breadcrumbs: Array<{ label: string; path: string }> = [];
  let pathSoFar = '';
  
  // Split the path into segments
  const segments = currentPath.split('/').filter(Boolean);
  
  // Start with root/dashboard if the path is not empty
  if (segments.length > 0) {
    const dashboardItem = getNavigationItemByPath(ROUTES.DASHBOARD.ROOT);
    if (dashboardItem) {
      breadcrumbs.push({
        label: dashboardItem.label,
        path: dashboardItem.path,
      });
    }
  }
  
  // Build path segments incrementally
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    pathSoFar += `/${segment}`;
    
    // Try to find an exact match first
    let item = getNavigationItemByPath(pathSoFar);
    
    if (item) {
      breadcrumbs.push({
        label: item.label,
        path: item.path,
      });
    } else {
      // If no exact match, check for dynamic routes
      // Find the parent section
      const parentPath = i > 0 ? '/' + segments.slice(0, i).join('/') : '/';
      const parent = getNavigationItemByPath(parentPath);
      
      if (parent && parent.children) {
        // Look for a dynamic route match in the parent's children
        const dynamicChild = parent.children.find(child => 
          child.path.includes('[') && 
          child.path.replace(/\[([^\]]+)\]/g, () => segment) === pathSoFar
        );
        
        if (dynamicChild) {
          const dynamicPathParam = segment;
          // Try to create a more meaningful label if we can
          breadcrumbs.push({
            label: dynamicChild.label.replace(/\[\w+\]/g, dynamicPathParam),
            path: pathSoFar,
          });
        } else {
          // As a fallback, just use the segment as the label
          breadcrumbs.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            path: pathSoFar,
          });
        }
      } else {
        // Fallback: use the segment itself as the label
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          path: pathSoFar,
        });
      }
    }
  }
  
  return breadcrumbs;
};

/**
 * Gets the active navigation item based on the current path
 *
 * @param currentPath - The current path
 * @returns The active navigation item or undefined
 */
export const getActiveNavigationItem = (
  currentPath: string
): NavigationItem | undefined => {
  // Combine all navigation items
  const allItems = [...NAVIGATION_ITEMS, ...SECONDARY_NAVIGATION_ITEMS, ...MOBILE_NAVIGATION_ITEMS];
  
  // Find the item with the longest matching path
  let bestMatch: NavigationItem | undefined;
  let bestMatchLength = 0;
  
  const checkItem = (item: NavigationItem) => {
    const itemPath = item.path;
    
    // Check for exact match first
    if (currentPath === itemPath) {
      bestMatch = item;
      bestMatchLength = itemPath.length;
      return true; // Found exact match
    }
    
    // Check if this is a prefix match and longer than our current best match
    if (
      currentPath.startsWith(itemPath + '/') && // Ensure we match at path boundaries
      itemPath.length > bestMatchLength
    ) {
      bestMatch = item;
      bestMatchLength = itemPath.length;
    }
    
    // Check for dynamic route matches (e.g., /clients/[id] should match /clients/123)
    if (
      itemPath.includes('[') && 
      itemPath.includes(']') &&
      itemPath.length > bestMatchLength
    ) {
      // Convert route pattern to regex
      const regexPattern = itemPath
        .replace(/\//g, '\\/') // Escape slashes
        .replace(/\[([^\]]+)\]/g, '([^\\/]+)'); // Convert [param] to capture group
      
      const regex = new RegExp(`^${regexPattern}(?:\\/|$)`);
      
      if (regex.test(currentPath)) {
        bestMatch = item;
        bestMatchLength = itemPath.length;
      }
    }
    
    // Check children
    if (item.children) {
      for (const child of item.children) {
        if (checkItem(child)) {
          // If we found an exact match in a child, we can stop searching
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Start checking from top-level items
  for (const item of allItems) {
    if (checkItem(item)) {
      break; // Found exact match, no need to continue
    }
  }
  
  return bestMatch;
};

/**
 * Navigation configuration object that provides navigation settings and utilities
 */
export const NavigationConfig = {
  // Navigation structure
  items: NAVIGATION_ITEMS,
  secondaryItems: SECONDARY_NAVIGATION_ITEMS,
  mobileItems: MOBILE_NAVIGATION_ITEMS,
  icons: NAVIGATION_ICONS,
  
  // Utility functions
  getItemByPath: getNavigationItemByPath,
  getItemById: getNavigationItemById,
  filterByPermission: filterNavigationItemsByPermission,
  getBreadcrumbs: getBreadcrumbItems,
  getActiveItem: getActiveNavigationItem,
};

// Re-export NavigationItem interface for convenience
export type { NavigationItem } from '../constants/navigation.constants';