import { logger } from './logger';
import { config } from '../config';
import { IntegrationError } from '../errors/integration-error';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3'; // @aws-sdk/client-s3 ^3.350.0
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'; // @aws-sdk/s3-request-presigner ^3.350.0
import * as fs from 'fs-extra'; // fs-extra ^11.1.1
import * as path from 'path'; // path ^0.12.7
import * as crypto from 'crypto'; // crypto ^1.0.1
import * as mime from 'mime-types'; // mime-types ^2.1.35
import * as os from 'os';

// Initialize S3 client with configuration
const s3Client = new S3Client({
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey
  }
});

/**
 * Generates a unique storage key for S3 objects based on entity type and filename
 * 
 * @param prefix Type/category prefix for organizing files (e.g., 'claims', 'clients')
 * @param fileName Original filename
 * @returns Generated storage key for S3
 */
export function generateStorageKey(prefix: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(fileName);
  return `${prefix}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Sanitizes a filename to ensure it's safe for storage
 * 
 * @param fileName Original filename
 * @returns Sanitized filename
 */
export function sanitizeFileName(fileName: string): string {
  // Remove invalid characters and replace spaces with underscores
  let sanitized = fileName
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '_');
  
  // Ensure filename doesn't exceed maximum length (255 chars is common limit)
  if (sanitized.length > 255) {
    const extension = path.extname(sanitized);
    const baseName = path.basename(sanitized, extension);
    sanitized = baseName.substring(0, 245) + extension;
  }
  
  return sanitized;
}

/**
 * Extracts the file extension from a filename
 * 
 * @param fileName Filename to process
 * @returns File extension
 */
export function getFileExtension(fileName: string): string {
  let extension = path.extname(fileName).toLowerCase();
  if (extension.startsWith('.')) {
    extension = extension.substring(1);
  }
  return extension;
}

/**
 * Determines the MIME type of a file based on its extension
 * 
 * @param fileName Filename to process
 * @returns MIME type
 */
export function getMimeType(fileName: string): string {
  const extension = getFileExtension(fileName);
  const mimeType = mime.lookup(extension);
  return mimeType || 'application/octet-stream';
}

/**
 * Generates a pre-signed URL for uploading a file to S3
 * 
 * @param storageKey S3 object key
 * @param contentType MIME type of the file
 * @param metadata Additional metadata to store with the object
 * @param expirationSeconds How long the URL should be valid (default: 15 minutes)
 * @returns Pre-signed URL for uploading
 */
export async function getSignedUploadUrl(
  storageKey: string, 
  contentType: string, 
  metadata: Record<string, string> = {},
  expirationSeconds: number = 900
): Promise<string> {
  try {
    if (!config.storage || !config.storage.bucket) {
      throw new Error('Storage configuration is missing or incomplete');
    }

    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: storageKey,
      ContentType: contentType,
      Metadata: metadata,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: expirationSeconds });
    logger.debug(`Generated pre-signed upload URL for ${storageKey}`, { storageKey, contentType, expirationSeconds });
    return url;
  } catch (error) {
    logger.error('Failed to generate pre-signed upload URL', { 
      storageKey, 
      contentType, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new IntegrationError({
      message: 'Failed to generate pre-signed upload URL',
      service: 'S3',
      endpoint: 'getSignedUrl',
      retryable: true
    });
  }
}

/**
 * Generates a pre-signed URL for downloading a file from S3
 * 
 * @param storageKey S3 object key
 * @param expirationSeconds How long the URL should be valid (default: 15 minutes)
 * @returns Pre-signed URL for downloading
 */
export async function getSignedDownloadUrl(
  storageKey: string, 
  expirationSeconds: number = 900
): Promise<string> {
  try {
    if (!config.storage || !config.storage.bucket) {
      throw new Error('Storage configuration is missing or incomplete');
    }

    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: storageKey,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: expirationSeconds });
    logger.debug(`Generated pre-signed download URL for ${storageKey}`, { storageKey, expirationSeconds });
    return url;
  } catch (error) {
    logger.error('Failed to generate pre-signed download URL', { 
      storageKey, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new IntegrationError({
      message: 'Failed to generate pre-signed download URL',
      service: 'S3',
      endpoint: 'getSignedUrl',
      retryable: true
    });
  }
}

/**
 * Uploads a file to S3 storage
 * 
 * @param fileContent File content as Buffer or string
 * @param storageKey S3 object key
 * @param contentType MIME type of the file
 * @param metadata Additional metadata to store with the object
 * @returns Object containing the storage key and ETag
 */
export async function uploadFileToS3(
  fileContent: Buffer | string, 
  storageKey: string, 
  contentType: string,
  metadata: Record<string, string> = {}
): Promise<{ storageKey: string; etag: string }> {
  try {
    if (!config.storage || !config.storage.bucket) {
      throw new Error('Storage configuration is missing or incomplete');
    }

    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: storageKey,
      Body: fileContent,
      ContentType: contentType,
      Metadata: metadata,
    });
    
    const response = await s3Client.send(command);
    logger.info(`Successfully uploaded file to S3`, { 
      storageKey, 
      contentType, 
      size: Buffer.isBuffer(fileContent) ? fileContent.length : fileContent.length 
    });
    
    return {
      storageKey,
      etag: response.ETag ? response.ETag.replace(/"/g, '') : '',
    };
  } catch (error) {
    logger.error('Failed to upload file to S3', { 
      storageKey, 
      contentType,
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new IntegrationError({
      message: 'Failed to upload file to S3',
      service: 'S3',
      endpoint: 'putObject',
      retryable: true
    });
  }
}

/**
 * Downloads a file from S3 storage
 * 
 * @param storageKey S3 object key
 * @returns Object containing the file content as Buffer and metadata
 */
export async function downloadFileFromS3(
  storageKey: string
): Promise<{ content: Buffer; metadata: Record<string, string> }> {
  try {
    if (!config.storage || !config.storage.bucket) {
      throw new Error('Storage configuration is missing or incomplete');
    }

    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: storageKey,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body');
    }
    
    // Convert the stream to a buffer
    const body = await response.Body.transformToByteArray();
    const content = Buffer.from(body);
    
    // Extract metadata
    const metadata: Record<string, string> = {};
    if (response.Metadata) {
      Object.assign(metadata, response.Metadata);
    }
    
    logger.info(`Successfully downloaded file from S3`, { storageKey, size: content.length });
    
    return {
      content,
      metadata,
    };
  } catch (error) {
    logger.error('Failed to download file from S3', { 
      storageKey, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new IntegrationError({
      message: 'Failed to download file from S3',
      service: 'S3',
      endpoint: 'getObject',
      retryable: true
    });
  }
}

/**
 * Deletes a file from S3 storage
 * 
 * @param storageKey S3 object key
 * @returns True if deletion was successful
 */
export async function deleteFileFromS3(storageKey: string): Promise<boolean> {
  try {
    if (!config.storage || !config.storage.bucket) {
      throw new Error('Storage configuration is missing or incomplete');
    }

    const command = new DeleteObjectCommand({
      Bucket: config.storage.bucket,
      Key: storageKey,
    });
    
    await s3Client.send(command);
    logger.info(`Successfully deleted file from S3`, { storageKey });
    
    return true;
  } catch (error) {
    logger.error('Failed to delete file from S3', { 
      storageKey, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new IntegrationError({
      message: 'Failed to delete file from S3',
      service: 'S3',
      endpoint: 'deleteObject',
      retryable: true
    });
  }
}

/**
 * Creates a temporary file with the provided content
 * 
 * @param content File content as Buffer or string
 * @param extension File extension (without dot)
 * @returns Object with file path and cleanup function
 */
export async function createTempFile(
  content: Buffer | string, 
  extension: string
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileName = `tmp-${timestamp}-${randomString}.${extension}`;
    const filePath = path.join(os.tmpdir(), fileName);
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));
    
    // Write content to file
    await fs.writeFile(filePath, content);
    
    // Create cleanup function
    const cleanup = async (): Promise<void> => {
      try {
        await fs.unlink(filePath);
        logger.debug(`Cleaned up temporary file: ${filePath}`);
      } catch (error) {
        logger.warn(`Failed to clean up temporary file: ${filePath}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    };
    
    logger.debug(`Created temporary file: ${filePath}`);
    
    return { filePath, cleanup };
  } catch (error) {
    logger.error('Failed to create temporary file', { 
      extension, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new Error(`Failed to create temporary file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reads a file and returns its contents as a Buffer
 * 
 * @param filePath Path to the file
 * @returns File contents as Buffer
 */
export async function readFileAsBuffer(filePath: string): Promise<Buffer> {
  try {
    // Check if file exists
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read file
    const content = await fs.readFile(filePath);
    logger.debug(`Read file as buffer: ${filePath}`, { size: content.length });
    
    return content;
  } catch (error) {
    logger.error('Failed to read file as buffer', { 
      filePath, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reads a file and returns its contents as a string
 * 
 * @param filePath Path to the file
 * @param encoding File encoding (default: utf8)
 * @returns File contents as string
 */
export async function readFileAsString(filePath: string, encoding: string = 'utf8'): Promise<string> {
  try {
    // Check if file exists
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read file
    const content = await fs.readFile(filePath, { encoding });
    logger.debug(`Read file as string: ${filePath}`, { size: content.length });
    
    return content;
  } catch (error) {
    logger.error('Failed to read file as string', { 
      filePath, 
      encoding,
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Writes content to a file
 * 
 * @param filePath Path to the file
 * @param content File content as Buffer or string
 * @returns True if write was successful
 */
export async function writeFile(filePath: string, content: Buffer | string): Promise<boolean> {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(path.dirname(filePath));
    
    // Write file
    await fs.writeFile(filePath, content);
    logger.debug(`Wrote file: ${filePath}`, { 
      size: Buffer.isBuffer(content) ? content.length : content.length 
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to write file', { 
      filePath, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Ensures that a directory exists, creating it if necessary
 * 
 * @param dirPath Path to the directory
 * @returns True if directory exists or was created
 */
export async function ensureDirectoryExists(dirPath: string): Promise<boolean> {
  try {
    await fs.ensureDir(dirPath);
    return true;
  } catch (error) {
    logger.error('Failed to ensure directory exists', { 
      dirPath, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new Error(`Failed to ensure directory exists: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculates a hash of a file's contents for integrity verification
 * 
 * @param content File content as Buffer or string
 * @param algorithm Hash algorithm (default: sha256)
 * @returns Hash of the file content
 */
export function calculateFileHash(content: Buffer | string, algorithm: string = 'sha256'): string {
  try {
    const hash = crypto.createHash(algorithm);
    hash.update(content);
    return hash.digest('hex');
  } catch (error) {
    logger.error('Failed to calculate file hash', { 
      algorithm, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw new Error(`Failed to calculate file hash: ${error instanceof Error ? error.message : String(error)}`);
  }
}