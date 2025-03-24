import fs from 'fs'; // fs v14.8.0
import path from 'path'; // path v0.12.7
import { OpenAPIV3 } from 'openapi3-ts'; // openapi3-ts v3.2.0
import { swaggerDefinition } from '../config/swagger.config';
import authPaths from './swagger/auth.swagger';
import usersPaths from './swagger/users.swagger';
import settingsPaths from './swagger/settings.swagger';
import clientsPaths from './swagger/clients.swagger';
import servicesPaths from './swagger/services.swagger';
import claimsPaths from './swagger/claims.swagger';
import billingPaths from './swagger/billing.swagger';
import paymentsPaths from './swagger/payments.swagger';
import reportsPaths from './swagger/reports.swagger';

/**
 * Combines all API path definitions from individual feature modules into a single paths object
 */
const allPaths: OpenAPIV3.PathsObject = {
  ...authPaths,
  ...usersPaths,
  ...settingsPaths,
  ...clientsPaths,
  ...servicesPaths,
  ...claimsPaths,
  ...billingPaths,
  ...paymentsPaths,
  ...reportsPaths
};

/**
 * Generates the complete Swagger specification by combining the base definition with all API path definitions
 * @returns {OpenAPIV3.Document} The complete Swagger specification document
 */
function generateSwaggerSpec(): OpenAPIV3.Document {
  // Create a deep copy of the base swagger definition
  const swaggerSpec: OpenAPIV3.Document = JSON.parse(JSON.stringify(swaggerDefinition));

  // Merge all path objects from individual feature modules
  swaggerSpec.paths = allPaths;

  // Return the complete Swagger specification
  return swaggerSpec;
}

/**
 * Writes the generated Swagger specification to a JSON file
 * @param {OpenAPIV3.Document} swaggerSpec - The Swagger specification to write
 * @returns {void} No return value
 */
function writeSwaggerJson(swaggerSpec: OpenAPIV3.Document): void {
  // Resolve the file path for the swagger.json file
  const filePath = path.resolve(__dirname, '../../../swagger.json');

  // Convert the Swagger specification to a formatted JSON string
  const json = JSON.stringify(swaggerSpec, null, 2);

  // Write the JSON string to the swagger.json file
  fs.writeFileSync(filePath, json);

  // Log a success message
  console.log(`Swagger specification written to ${filePath}`);
}

// Generate the Swagger specification
const swaggerSpec: OpenAPIV3.Document = generateSwaggerSpec();

// Write the Swagger specification to a JSON file
writeSwaggerJson(swaggerSpec);

/**
 * Export the complete Swagger specification for use in the Express application
 */
export default swaggerSpec;