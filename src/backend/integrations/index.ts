import { EHRIntegration } from './ehr.integration'; // version as specified in source file
import { ClearinghouseIntegration, clearinghouseIntegration } from './clearinghouse.integration'; // version as specified in source file
import { AccountingIntegration, createAccountingIntegration } from './accounting.integration'; // version as specified in source file
import { MedicaidIntegration, medicaidIntegration } from './medicaid.integration'; // version as specified in source file
import { RemittanceIntegration, remittanceIntegration } from './remittance.integration'; // version as specified in source file
import { IntegrationConfig, EHRIntegrationConfig, ClearinghouseIntegrationConfig, AccountingIntegrationConfig, MedicaidIntegrationConfig, RemittanceIntegrationConfig } from '../types/integration.types'; // version as specified in source file
import config from '../config'; // version as specified in source file
import logger from '../utils/logger'; // version as specified in source file

let ehrIntegration: EHRIntegration | null = null;
let accountingIntegration: AccountingIntegration | null = null;

/**
 * Initializes all integration services with their respective configurations
 * @returns Promise<void> - Resolves when all integrations are initialized
 */
async function initializeIntegrations(): Promise<void> {
  logger.info('Initializing integration services...');

  // Extract integration configurations from config.integrations
  const integrationConfigs = config.integrations;

  // Initialize clearinghouseIntegration singleton
  if (integrationConfigs?.clearinghouse) {
    await clearinghouseIntegration.initialize();
  }

  // Initialize medicaidIntegration singleton
  if (integrationConfigs?.medicaid) {
    await medicaidIntegration.initialize();
  }

  // Initialize remittanceIntegration singleton with appropriate configs
  if (integrationConfigs?.remittance) {
    await remittanceIntegration.initialize(config.integrations.configurations);
  }

  // Create ehrIntegration singleton with EHR configuration
  if (integrationConfigs?.ehr) {
    const ehrConfig = integrationConfigs.ehr as EHRIntegrationConfig;
    const baseConfig = config.integrations.configurations.find(c => c.type === 'ehr' && c.name === integrationConfigs.ehr.name) as IntegrationConfig;
    if (baseConfig) {
      ehrIntegration = new EHRIntegration(baseConfig, ehrConfig);
    } else {
      logger.error('Base configuration not found for EHR integration', { ehrName: ehrConfig.ehrSystem });
    }
  }

  // Create accountingIntegration singleton with accounting configuration
  if (integrationConfigs?.accounting) {
    const accountingConfig = integrationConfigs.accounting as AccountingIntegrationConfig;
    const baseConfig = config.integrations.configurations.find(c => c.type === 'accounting' && c.name === integrationConfigs.accounting.name) as IntegrationConfig;
    if (baseConfig) {
      accountingIntegration = createAccountingIntegration(baseConfig, accountingConfig);
    } else {
      logger.error('Base configuration not found for Accounting integration', { accountingName: accountingConfig.accountingSystem });
    }
  }

  logger.info('Successfully initialized all integration services');
}

/**
 * Gets the EHR integration instance, creating it if necessary
 * @returns EHRIntegration - The EHR integration instance
 */
function getEHRIntegration(): EHRIntegration | null {
  // Check if ehrIntegration singleton exists
  if (!ehrIntegration) {
    logger.warn('EHR integration not initialized');
    return null;
  }
  // Return the ehrIntegration singleton
  return ehrIntegration;
}

/**
 * Gets the Accounting integration instance, creating it if necessary
 * @returns AccountingIntegration - The Accounting integration instance
 */
function getAccountingIntegration(): AccountingIntegration | null {
  // Check if accountingIntegration singleton exists
  if (!accountingIntegration) {
    logger.warn('Accounting integration not initialized');
    return null;
  }
  // Return the accountingIntegration singleton
  return accountingIntegration;
}

// Export integration classes
export { EHRIntegration };
export { ClearinghouseIntegration };
export { AccountingIntegration };
export { MedicaidIntegration };
export { RemittanceIntegration };

// Export integration singletons
export { clearinghouseIntegration };
export { medicaidIntegration };
export { remittanceIntegration };

// Export integration instances
export { ehrIntegration };
export { accountingIntegration };

// Export initialization function
export { initializeIntegrations };

// Export getter functions
export { getEHRIntegration };
export { getAccountingIntegration };