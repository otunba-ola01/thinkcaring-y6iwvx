import path from 'path'; // path v0.12.7
import fs from 'fs-extra'; // fs-extra ^11.1.1
import { generateSwaggerSpec } from '../docs';
import { logger } from '../utils/logger';
import { writeFile } from '../utils/file';

/**
 * Formats the Swagger specification object as a properly indented JSON string
 * @param {object} swaggerSpec - The Swagger specification to format
 * @returns {string} Formatted JSON string
 */
function formatSwaggerJson(swaggerSpec: any): string {
  // LD1: Use JSON.stringify with indentation to format the Swagger specification
  return JSON.stringify(swaggerSpec, null, 2);
}

/**
 * Determines the output file path for the generated Swagger JSON file
 * @returns {string} Absolute file path for the output file
 */
function getOutputFilePath(): string {
  // LD1: Resolve the path to the swagger.json file in the docs directory
  // LD1: Return the absolute file path
  return path.resolve(__dirname, '../../../swagger.json');
}

/**
 * Main function that generates the API documentation by compiling Swagger specifications and writing them to a file
 * @returns {Promise<void>} No return value
 */
async function generateApiDocs(): Promise<void> {
  try {
    // LD1: Generate the complete Swagger specification using generateSwaggerSpec
    const swaggerSpec = generateSwaggerSpec();

    // LD1: Determine the output file path for swagger.json
    const outputPath = getOutputFilePath();

    // LD1: Convert the Swagger specification to a formatted JSON string
    const formattedJson = formatSwaggerJson(swaggerSpec);

    // LD1: Write the JSON string to the output file
    await writeFile(outputPath, formattedJson);

    // LD1: Log success message with the file path
    logger.info(`Successfully generated API documentation at ${outputPath}`);
  } catch (error: any) {
    // LD1: Handle and log any errors that occur during the process
    logger.error('Failed to generate API documentation', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1); // Exit the process with an error code
  }
}

// Script execution entry point
(async () => {
  try {
    // LD1: Call the generateApiDocs function to start the documentation generation process
    await generateApiDocs();
  } catch (error: any) {
    // LD1: Handle any uncaught errors and exit the process with an error code
    logger.error('Unhandled error during API documentation generation', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
})();