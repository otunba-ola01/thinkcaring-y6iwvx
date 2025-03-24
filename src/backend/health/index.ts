/**
 * Main export file for the health monitoring system of the HCBS Revenue Management System.
 * This module consolidates and exports all health check functionality from individual component health modules,
 * providing a unified interface for monitoring the health and performance of the entire system.
 */

import * as databaseHealth from './database-health'; // Import database health check functionality
import * as redisHealth from './redis-health'; // Import Redis health check functionality
import * as integrationHealth from './integration-health'; // Import integration health check functionality
import { IntegrationType } from '../types/integration.types'; // Import integration type enum for integration health checks
import * as memoryHealth from './memory-usage'; // Import memory health check functionality
import * as diskHealth from './disk-usage'; // Import disk health check functionality
import * as apiHealth from './api-performance'; // Import API performance health check functionality
import * as healthCheck from './health-check'; // Import comprehensive health check functionality

// Re-export database health check functionality
export { databaseHealth };

// Re-export Redis health check functionality
export { redisHealth };

// Re-export integration health check functionality
export { integrationHealth };

// Re-export memory health check functionality
export { memoryHealth };

// Re-export disk health check functionality
export { diskHealth };

// Re-export API performance health check functionality
export { apiHealth };

// Re-export comprehensive health check functionality
export const checkHealth = healthCheck.checkHealth;
export const checkComponentHealth = healthCheck.checkComponentHealth;
export const getHealthStatus = healthCheck.getHealthStatus;
export const getDetailedHealthStatus = healthCheck.getDetailedHealthStatus;
export const startHealthMonitoring = healthCheck.startHealthMonitoring;
export const stopHealthMonitoring = healthCheck.stopHealthMonitoring;
export const createHealthCheckMiddleware = healthCheck.createHealthCheckMiddleware;
export const HealthCheckComponent = healthCheck.HealthCheckComponent;
export const SystemHealthStatus = healthCheck.SystemHealthStatus;

// Re-export integration type enum for external use
export { IntegrationType };