/**
 * Cypress Plugin Configuration
 * This file configures Cypress plugins for the HCBS Revenue Management System.
 * It adds support for TypeScript, code coverage, file uploads, accessibility testing,
 * and environment variable handling.
 */

/// <reference types="cypress" />

import * as codeCoverage from '@cypress/code-coverage'; // v3.10.0
import 'cypress-file-upload'; // v5.0.8
import 'cypress-axe'; // v1.4.0
import * as dotenv from 'dotenv'; // v16.0.3
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper function to load environment variables based on current environment
 * @param config Cypress configuration object
 * @returns Environment variables object
 */
function loadEnvironmentVariables(config: Cypress.PluginConfigOptions) {
  // Determine current environment
  const environment = config.env?.NODE_ENV || 'development';
  
  // Load base .env file
  const baseEnvPath = path.resolve(process.cwd(), '.env');
  let envVars = {};
  
  if (fs.existsSync(baseEnvPath)) {
    envVars = { ...envVars, ...dotenv.parse(fs.readFileSync(baseEnvPath)) };
  }
  
  // Load environment-specific .env file
  const envSpecificPath = path.resolve(process.cwd(), `.env.${environment}`);
  if (fs.existsSync(envSpecificPath)) {
    envVars = { ...envVars, ...dotenv.parse(fs.readFileSync(envSpecificPath)) };
  }
  
  // Merge environment variables with Cypress config
  config.env = { ...config.env, ...envVars };
  
  return envVars;
}

/**
 * Configure Cypress node events
 * @param on Cypress "on" function for registering event handlers
 * @param config Cypress configuration object
 */
function setupNodeEvents(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  // Register code coverage plugin
  codeCoverage.task(on, config);
  
  // Register browser launch event for browser customization
  on('before:browser:launch', (browser, launchOptions) => {
    // Configure Chrome for testing
    if (browser.name === 'chrome' && browser.isHeadless) {
      launchOptions.args.push('--disable-web-security');
      launchOptions.args.push('--disable-site-isolation-trials');
    }
    
    return launchOptions;
  });
  
  // Register Node tasks for custom operations
  on('task', {
    log(message) {
      console.log(message);
      return null;
    },
    // Add accessibility testing tasks for WCAG compliance
    table(message) {
      console.table(message);
      return null;
    },
    // File handling tasks for document upload testing
    fileExists(filePath) {
      return fs.existsSync(filePath);
    },
    readFile(filePath) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
      return null;
    },
    // Database test data setup
    queryTestDb(query) {
      // This is a placeholder for connecting to a test database
      console.log(`Test DB Query: ${query}`);
      return [];
    }
  });
}

/**
 * Main plugin configuration function that registers Cypress plugins
 * @param on Cypress "on" function for registering event handlers
 * @param config Cypress configuration object
 * @returns Modified Cypress configuration
 */
module.exports = (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  // Load environment variables from .env files based on current environment
  loadEnvironmentVariables(config);
  
  // Setup node events
  setupNodeEvents(on, config);
  
  // Configure viewport sizes for responsive testing
  config.viewportWidth = 1280;
  config.viewportHeight = 720;
  
  // Configure other Cypress settings
  config.baseUrl = 'http://localhost:3000';
  config.video = false;
  config.screenshotOnRunFailure = true;
  config.defaultCommandTimeout = 10000;
  config.requestTimeout = 15000;
  config.responseTimeout = 15000;
  config.pageLoadTimeout = 30000;
  
  return config;
};

// For TypeScript compatibility with ES modules
export default module.exports;