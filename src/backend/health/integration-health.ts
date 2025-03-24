/**
 * Provides health check functionality for external system integrations in the HCBS Revenue Management System.
 * This module monitors the health and connectivity status of various integration points including EHR systems, clearinghouses, accounting systems, Medicaid portals, and remittance processing services.
 */

import { IntegrationType, IntegrationHealthStatus } from '../types/integration.types'; // Import integration type definitions and health status interface
import { logger } from '../utils/logger'; // Import logger for health check logging
import { createGauge } from '../utils/metrics'; // Import metrics utility for tracking integration health metrics
import { clearinghouseIntegration, ehrIntegration, accountingIntegration, medicaidIntegration, remittanceIntegration } from '../integrations'; // Import integration service instances to check their health

/**
 * Prometheus gauge metric for tracking integration health status (0=unhealthy, 1=healthy)
 */
const integrationHealthGauge = createGauge('integration_health_status', 'Integration health status (0=unhealthy, 1=healthy)', ['integration_type']);

/**
 * Stores the last health check results for each integration type
 */
const lastIntegrationHealthResults = new Map<IntegrationType, IntegrationHealthStatus>();

/**
 * Checks the health of a specific integration type
 * @param integrationType - The type of integration to check
 * @returns The health status of the specified integration
 */
async function checkIntegrationHealth(integrationType: IntegrationType): Promise<IntegrationHealthStatus> {
  logger.info(`Checking health for integration type: ${integrationType}`); // Log the start of integration health check
  const startTime = Date.now(); // Record the start time for performance measurement

  let integrationService: any;
  switch (integrationType) {
    case IntegrationType.CLEARINGHOUSE:
      integrationService = clearinghouseIntegration;
      break;
    case IntegrationType.EHR:
      integrationService = ehrIntegration;
      break;
    case IntegrationType.ACCOUNTING:
      integrationService = accountingIntegration;
      break;
    case IntegrationType.MEDICAID:
      integrationService = medicaidIntegration;
      break;
    case IntegrationType.REMITTANCE:
      integrationService = remittanceIntegration;
      break;
    default:
      logger.warn(`Unknown integration type: ${integrationType}`);
      return {
        status: IntegrationStatus.INACTIVE,
        responseTime: null,
        lastChecked: new Date(),
        message: `Unknown integration type: ${integrationType}`,
        details: {}
      };
  }

  if (!integrationService) {
    logger.warn(`Integration service not available for type: ${integrationType}`);
    return {
      status: IntegrationStatus.INACTIVE,
      responseTime: null,
      lastChecked: new Date(),
      message: `Integration service not available for type: ${integrationType}`,
      details: {}
    };
  }

  try {
    const healthStatus = await integrationService.checkHealth(); // Call the checkHealth method on the selected integration service
    const responseTime = Date.now() - startTime; // Calculate the response time of the health check

    // Update the integration health gauge metric with status (0 for unhealthy, 1 for healthy)
    integrationHealthGauge.labels(integrationType).set(healthStatus.status === IntegrationStatus.ACTIVE ? 1 : 0);

    lastIntegrationHealthResults.set(integrationType, healthStatus); // Store the health check result in lastIntegrationHealthResults map
    logger.info(`Health check completed for integration type: ${integrationType}, Status: ${healthStatus.status}`); // Log the completion of health check with status
    return healthStatus; // Return the health status result
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`Health check failed for integration type: ${integrationType}`, { error }); // Handle any errors during health check and return error status
    const healthStatus: IntegrationHealthStatus = {
      status: IntegrationStatus.ERROR,
      responseTime: responseTime,
      lastChecked: new Date(),
      message: `Health check failed: ${error}`,
      details: {
        error: error.message
      }
    };
    integrationHealthGauge.labels(integrationType).set(0);
    lastIntegrationHealthResults.set(integrationType, healthStatus);
    return healthStatus;
  }
}

/**
 * Checks the health of all configured integrations
 * @returns Map of health statuses for all integrations
 */
async function checkAllIntegrationsHealth(): Promise<Map<IntegrationType, IntegrationHealthStatus>> {
  logger.info('Checking health for all integrations'); // Log the start of checking all integrations health
  const integrationTypes = Object.values(IntegrationType); // Create an array of all integration types to check
  const healthChecks = integrationTypes.map(type => checkIntegrationHealth(type)); // Use Promise.all to check health of all integrations in parallel

  const results = await Promise.all(healthChecks);

  const healthStatusMap = new Map<IntegrationType, IntegrationHealthStatus>();
  for (let i = 0; i < integrationTypes.length; i++) {
    healthStatusMap.set(integrationTypes[i], results[i]); // Collect results into a Map keyed by integration type
  }

  logger.info('Completed health checks for all integrations'); // Log the completion of all integration health checks
  return healthStatusMap; // Return the map of health statuses
}

/**
 * Gets the most recent health status for a specific integration
 * @param integrationType - The type of integration to get the status for
 * @returns The most recent health status or undefined if not available
 */
function getIntegrationHealthStatus(integrationType: IntegrationType): IntegrationHealthStatus | undefined {
  const status = lastIntegrationHealthResults.get(integrationType); // Check if health status exists in lastIntegrationHealthResults map
  logger.debug(`Retrieving health status for integration type: ${integrationType}`, { status }); // Log the retrieval of integration health status at debug level
  return status; // Return the stored health status if available or undefined if no health check has been performed
}

/**
 * Gets performance metrics for all integrations
 * @returns Object containing metrics for all integrations
 */
function getIntegrationMetrics(): object {
  const metrics: any = {};

  for (const integrationType of Object.values(IntegrationType)) {
    const healthStatus = lastIntegrationHealthResults.get(integrationType);
    if (healthStatus) {
      metrics[integrationType] = {
        responseTime: healthStatus.responseTime,
        status: healthStatus.status,
        lastChecked: healthStatus.lastChecked
      };
    }
  }

  return metrics;
}

/**
 * Gets the appropriate integration service instance based on type
 * @param integrationType - The type of integration
 * @returns The integration service instance or null if not available
 */
function getIntegrationService(integrationType: IntegrationType): object | null {
  switch (integrationType) {
    case IntegrationType.CLEARINGHOUSE:
      return clearinghouseIntegration; // Return clearinghouseIntegration for IntegrationType.CLEARINGHOUSE
    case IntegrationType.EHR:
      return ehrIntegration; // Return ehrIntegration for IntegrationType.EHR
    case IntegrationType.ACCOUNTING:
      return accountingIntegration; // Return accountingIntegration for IntegrationType.ACCOUNTING
    case IntegrationType.MEDICAID:
      return medicaidIntegration; // Return medicaidIntegration for IntegrationType.MEDICAID
    case IntegrationType.REMITTANCE:
      return remittanceIntegration; // Return remittanceIntegration for IntegrationType.REMITTANCE
    default:
      logger.warn(`Requested integration type not available: ${integrationType}`); // Log warning if requested integration type is not available
      return null; // Return null for unknown integration types
  }
}

/**
 * Determines if a specific integration is currently healthy
 * @param integrationType - The type of integration to check
 * @returns True if integration is healthy, false otherwise
 */
function isIntegrationHealthy(integrationType: IntegrationType): boolean {
  const healthStatus = getIntegrationHealthStatus(integrationType); // Get the most recent health status using getIntegrationHealthStatus
  if (!healthStatus) {
    return false; // If no status is available, return false (assume unhealthy)
  }
  const isHealthy = healthStatus.status === IntegrationStatus.ACTIVE; // Check the status property of the health status object
  logger.debug(`Integration type ${integrationType} is healthy: ${isHealthy}`); // Log the health determination at debug level
  return isHealthy; // Return true if status is ACTIVE, false otherwise
}

// Export functions for use in other modules
export {
  checkIntegrationHealth,
  checkAllIntegrationsHealth,
  getIntegrationHealthStatus,
  getIntegrationMetrics,
  isIntegrationHealthy
};