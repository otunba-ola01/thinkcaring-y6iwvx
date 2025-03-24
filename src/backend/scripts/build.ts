import * as fs from 'fs-extra'; // fs-extra ^11.1.1
import * as path from 'path'; // path ^0.12.7
import { spawn } from 'child_process'; // child_process ^1.0.2
import { glob } from 'glob'; // glob ^10.2.7
import { info, error } from '../utils/logger';

// Global constants
const NODE_ENV = process.env.NODE_ENV || 'production';
const BUILD_DIR = path.resolve(__dirname, '../../dist');
const SRC_DIR = path.resolve(__dirname, '..');

/**
 * Cleans the build directory by removing existing files
 * @returns Promise that resolves when the directory is cleaned
 */
async function cleanBuildDirectory(): Promise<void> {
  try {
    info('Cleaning build directory...', { dir: BUILD_DIR });
    
    if (await fs.pathExists(BUILD_DIR)) {
      await fs.remove(BUILD_DIR);
    }
    
    await fs.ensureDir(BUILD_DIR);
    
    info('Build directory cleaned successfully');
  } catch (err) {
    error('Failed to clean build directory', { error: err });
    throw err;
  }
}

/**
 * Compiles TypeScript code to JavaScript using the TypeScript compiler
 * @returns Promise that resolves to true if compilation succeeds, false otherwise
 */
async function compileTypeScript(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      info('Compiling TypeScript code...');
      
      // Use the project's tsconfig.json
      const tsconfigPath = path.resolve(SRC_DIR, '../tsconfig.json');
      
      // Ensure the tsconfig exists
      if (!fs.pathExistsSync(tsconfigPath)) {
        error('TypeScript configuration file not found', { path: tsconfigPath });
        resolve(false);
        return;
      }
      
      const tsc = spawn('npx', ['tsc', '--project', tsconfigPath]);
      
      let stdoutData = '';
      let stderrData = '';
      
      tsc.stdout.on('data', (data) => {
        const output = data.toString();
        stdoutData += output;
        // Log output for debugging
        process.stdout.write(output);
      });
      
      tsc.stderr.on('data', (data) => {
        const output = data.toString();
        stderrData += output;
        // Log error output
        process.stderr.write(output);
      });
      
      tsc.on('close', (code) => {
        if (code === 0) {
          info('TypeScript compilation successful');
          resolve(true);
        } else {
          error('TypeScript compilation failed', { 
            exitCode: code,
            stdout: stdoutData.length > 500 ? stdoutData.substring(0, 500) + '...' : stdoutData,
            stderr: stderrData.length > 500 ? stderrData.substring(0, 500) + '...' : stderrData
          });
          resolve(false);
        }
      });
    } catch (err) {
      error('Failed to compile TypeScript', { error: err });
      resolve(false);
    }
  });
}

/**
 * Copies non-TypeScript files (like JSON, templates, etc.) to the build directory
 * @returns Promise that resolves when all files are copied
 */
async function copyNonTypeScriptFiles(): Promise<void> {
  try {
    info('Copying non-TypeScript files...');
    
    // Define patterns for files to copy
    const patterns = [
      // Configuration files
      '**/*.json', 
      '**/*.yaml', 
      '**/*.yml',
      // Template files
      '**/*.html', 
      '**/*.css', 
      '**/*.hbs', 
      '**/*.ejs',
      '**/*.pug',
      // Other resource files
      '**/*.svg',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.ico',
      // Font files
      '**/*.woff',
      '**/*.woff2',
      '**/*.ttf',
      '**/*.eot',
      // Other important non-TypeScript files
      '**/*.md',
      '**/*.txt'
    ];
    
    // Find files matching patterns
    const files = await glob(patterns, { 
      cwd: SRC_DIR,
      ignore: ['**/node_modules/**', '**/dist/**', '**/tests/**', '**/*.d.ts', '**/*.map']
    });
    
    // Copy each file to build directory
    let copiedCount = 0;
    for (const file of files) {
      const srcPath = path.join(SRC_DIR, file);
      const destPath = path.join(BUILD_DIR, file);
      
      // Create directory if it doesn't exist
      await fs.ensureDir(path.dirname(destPath));
      
      // Copy file
      await fs.copyFile(srcPath, destPath);
      copiedCount++;
    }
    
    info(`Copied ${copiedCount} non-TypeScript files`);
  } catch (err) {
    error('Failed to copy non-TypeScript files', { error: err });
    throw err;
  }
}

/**
 * Creates a modified package.json for production with only necessary dependencies
 * @returns Promise that resolves when the package.json is created
 */
async function createPackageJson(): Promise<void> {
  try {
    info('Creating production package.json...');
    
    // Read the source package.json
    const pkgPath = path.resolve(SRC_DIR, '../package.json');
    
    if (!await fs.pathExists(pkgPath)) {
      error('Source package.json not found', { path: pkgPath });
      throw new Error('Source package.json not found');
    }
    
    const pkg = await fs.readJson(pkgPath);
    
    // Create a production version of package.json
    const prodPkg = {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      main: pkg.main ? pkg.main.replace(/^src\//, '').replace(/\.ts$/, '.js') : 'index.js',
      engines: pkg.engines,
      dependencies: pkg.dependencies,
      private: pkg.private,
      author: pkg.author,
      license: pkg.license
    };
    
    // Write the production package.json
    const destPath = path.join(BUILD_DIR, 'package.json');
    await fs.writeJson(destPath, prodPkg, { spaces: 2 });
    
    info('Production package.json created successfully');
  } catch (err) {
    error('Failed to create production package.json', { error: err });
    throw err;
  }
}

/**
 * Validates the build output to ensure all necessary files are present
 * @returns Promise that resolves to true if validation succeeds, false otherwise
 */
async function validateBuild(): Promise<boolean> {
  try {
    info('Validating build output...');
    
    // Check if the build directory exists
    if (!await fs.pathExists(BUILD_DIR)) {
      error('Build directory does not exist');
      return false;
    }
    
    // Check if the build directory contains files
    const files = await fs.readdir(BUILD_DIR);
    if (files.length === 0) {
      error('Build directory is empty');
      return false;
    }
    
    // List of critical files that should exist
    const criticalFiles = [
      'server.js',
      'app.js',
      'config/index.js'
    ];
    
    // Validate each critical file
    let missingFiles = [];
    for (const file of criticalFiles) {
      const filePath = path.join(BUILD_DIR, file);
      if (!await fs.pathExists(filePath)) {
        missingFiles.push(file);
      }
    }
    
    // Verify that package.json exists
    if (!await fs.pathExists(path.join(BUILD_DIR, 'package.json'))) {
      missingFiles.push('package.json');
    }
    
    if (missingFiles.length > 0) {
      error(`Build validation failed: ${missingFiles.length} critical files missing`, { missingFiles });
      return false;
    }
    
    info('Build validation successful');
    return true;
  } catch (err) {
    error('Build validation failed', { error: err });
    return false;
  }
}

/**
 * Main build function that orchestrates the entire build process
 * @returns Promise that resolves to true if the build succeeds, false otherwise
 */
async function build(): Promise<boolean> {
  try {
    info(`Starting build process in ${NODE_ENV} mode`);
    
    // Step 1: Clean build directory
    await cleanBuildDirectory();
    
    // Step 2: Compile TypeScript
    const compilationSuccess = await compileTypeScript();
    if (!compilationSuccess) {
      error('Build failed at compilation step');
      return false;
    }
    
    // Step 3: Copy non-TypeScript files
    await copyNonTypeScriptFiles();
    
    // Step 4: Create production package.json
    await createPackageJson();
    
    // Step 5: Validate build
    const validationSuccess = await validateBuild();
    
    if (validationSuccess) {
      info('Build completed successfully');
    } else {
      error('Build validation failed');
    }
    
    return validationSuccess;
  } catch (err) {
    error('Build process failed', { error: err });
    return false;
  }
}

// Execute the build function
build()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((err) => {
    error('Unhandled error in build process', { error: err });
    process.exit(1);
  });