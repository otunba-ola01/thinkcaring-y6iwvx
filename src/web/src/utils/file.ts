import { saveAs } from 'file-saver'; // version ^2.0.5

/**
 * Checks if a file has an accepted MIME type or extension
 * @param file The file to check
 * @param acceptedTypes Array of accepted MIME types or file extensions
 * @returns True if the file type is accepted, false otherwise
 */
export const isValidFileType = (file: File, acceptedTypes: string[]): boolean => {
  // If acceptedTypes is empty or undefined, return true (all types accepted)
  if (!acceptedTypes || acceptedTypes.length === 0) {
    return true;
  }
  
  // Extract the file extension from the file name
  const fileExtension = getFileExtension(file.name);
  
  // Check if the file's MIME type is in the acceptedTypes array
  const mimeTypeMatch = acceptedTypes.some(type => 
    file.type === type || // exact MIME type match
    (type.includes('/*') && file.type.startsWith(type.split('/*')[0])) // wildcard MIME type match
  );
  
  // Check if the file extension is in the acceptedTypes array
  const extensionMatch = acceptedTypes.some(type => 
    type.startsWith('.') && `.${fileExtension.toLowerCase()}` === type.toLowerCase()
  );
  
  // Return true if either the MIME type or extension is accepted
  return mimeTypeMatch || extensionMatch;
};

/**
 * Checks if a file size is within the specified maximum size limit
 * @param file The file to check
 * @param maxSize Maximum size in bytes
 * @returns True if the file size is within the limit, false otherwise
 */
export const isValidFileSize = (file: File, maxSize: number): boolean => {
  // If maxSize is undefined or 0, return true (no size limit)
  if (!maxSize) {
    return true;
  }
  
  // Check if the file size is less than or equal to maxSize
  return file.size <= maxSize;
};

/**
 * Formats a file size in bytes to a human-readable string with appropriate units
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., '2.5 MB')
 */
export const formatFileSize = (bytes: number): string => {
  // Define an array of units
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  // If bytes is 0, return '0 B'
  if (bytes === 0) {
    return '0 B';
  }
  
  // Calculate the appropriate unit index based on the logarithm of the size
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // Make sure we don't exceed the available units
  const limitedUnitIndex = Math.min(unitIndex, units.length - 1);
  
  // Convert the size to the appropriate unit
  const size = bytes / Math.pow(1024, limitedUnitIndex);
  
  // Round the size to 2 decimal places
  const roundedSize = Math.round(size * 100) / 100;
  
  // Return the formatted size with the unit
  return `${roundedSize} ${units[limitedUnitIndex]}`;
};

/**
 * Extracts the file extension from a filename
 * @param filename The filename to extract the extension from
 * @returns The file extension (lowercase, without the dot)
 */
export const getFileExtension = (filename: string): string => {
  // Check if filename is valid
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  // Find the last occurrence of '.' in the filename
  const lastDotIndex = filename.lastIndexOf('.');
  
  // If no dot is found or it's the first character (hidden file in unix), return empty string
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }
  
  // Extract the substring after the last dot and convert to lowercase
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Gets the MIME type for a given file extension
 * @param extension The file extension (with or without leading dot)
 * @returns The MIME type for the extension or 'application/octet-stream' if unknown
 */
export const getMimeTypeFromExtension = (extension: string): string => {
  // Define a mapping of common extensions to MIME types
  const mimeTypes: Record<string, string> = {
    // Text
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Video
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mpeg': 'video/mpeg',
    'webm': 'video/webm',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'tar': 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    
    // Data formats
    'json': 'application/json',
    'xml': 'application/xml',
    
    // Healthcare specific
    'hl7': 'application/edi-hl7',
    'x12': 'application/edi-x12',
    'edifact': 'application/edifact',
    
    // Others
    'rtf': 'application/rtf',
    'js': 'application/javascript',
    'ts': 'application/typescript'
  };
  
  // Convert the extension to lowercase and remove any leading dot
  const cleanExtension = extension.toLowerCase().replace(/^\./, '');
  
  // Look up the MIME type in the mapping
  const mimeType = mimeTypes[cleanExtension];
  
  // Return the MIME type or 'application/octet-stream' if not found
  return mimeType || 'application/octet-stream';
};

/**
 * Triggers a file download in the browser
 * @param content The content to download, either as a Blob or string
 * @param filename The name to give the downloaded file
 * @param mimeType The MIME type of the file (optional, determined from filename extension if not provided)
 * @returns Promise that resolves when download is triggered
 */
export const downloadFile = async (
  content: Blob | string,
  filename: string,
  mimeType?: string
): Promise<void> => {
  let blob: Blob;
  
  // If content is a string, convert it to a Blob with the specified MIME type
  if (typeof content === 'string') {
    const determinedMimeType = mimeType || getMimeTypeFromExtension(getFileExtension(filename));
    blob = new Blob([content], { type: determinedMimeType });
  } else {
    // Content is already a Blob
    blob = content;
  }
  
  // Use FileSaver.saveAs to trigger the download
  saveAs(blob, filename);
  
  // Return a promise that resolves when the download is triggered
  return Promise.resolve();
};

/**
 * Reads a file and returns its contents as text
 * @param file The file to read
 * @returns Promise that resolves with the file contents as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  // Create a new FileReader instance
  const reader = new FileReader();
  
  // Return a new Promise
  return new Promise<string>((resolve, reject) => {
    // Set up onload handler to resolve the promise with the result
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    // Set up onerror handler to reject the promise with the error
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Call readAsText on the FileReader with the file
    reader.readAsText(file);
  });
};

/**
 * Reads a file and returns its contents as a data URL
 * @param file The file to read
 * @returns Promise that resolves with the file contents as a data URL
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  // Create a new FileReader instance
  const reader = new FileReader();
  
  // Return a new Promise
  return new Promise<string>((resolve, reject) => {
    // Set up onload handler to resolve the promise with the result
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    // Set up onerror handler to reject the promise with the error
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Call readAsDataURL on the FileReader with the file
    reader.readAsDataURL(file);
  });
};

/**
 * Reads a file and returns its contents as an ArrayBuffer
 * @param file The file to read
 * @returns Promise that resolves with the file contents as an ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  // Create a new FileReader instance
  const reader = new FileReader();
  
  // Return a new Promise
  return new Promise<ArrayBuffer>((resolve, reject) => {
    // Set up onload handler to resolve the promise with the result
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        resolve(event.target.result as ArrayBuffer);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    // Set up onerror handler to reject the promise with the error
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Call readAsArrayBuffer on the FileReader with the file
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Converts JSON data to CSV format
 * @param jsonData Array of objects to convert to CSV
 * @param options Configuration options for the conversion
 * @returns CSV formatted string
 */
export const convertJsonToCsv = (
  jsonData: any[],
  options: {
    headers?: string[];
    includeHeaders?: boolean;
    delimiter?: string;
    handleNestedObjects?: boolean;
    quoteStrings?: boolean;
  } = {}
): string => {
  // Check if jsonData is an array and not empty
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return '';
  }
  
  const {
    headers = Object.keys(jsonData[0]),
    includeHeaders = true,
    delimiter = ',',
    handleNestedObjects = false,
    quoteStrings = true
  } = options;
  
  // Function to extract a value from an object, potentially nested
  const extractValue = (obj: any, key: string): string => {
    if (!obj) return '';
    
    // Handle nested paths like 'customer.name'
    if (handleNestedObjects && key.includes('.')) {
      const parts = key.split('.');
      let value = obj;
      for (const part of parts) {
        if (value === null || value === undefined) return '';
        value = value[part];
      }
      return formatCsvValue(value);
    }
    
    return formatCsvValue(obj[key]);
  };
  
  // Function to format a value for CSV output
  const formatCsvValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Handle special data types
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // Join arrays with semicolons
        value = value.join(';');
      } else if (value instanceof Date) {
        // Format dates as ISO strings
        value = value.toISOString();
      } else {
        // Convert objects to JSON
        value = JSON.stringify(value);
      }
    }
    
    // Convert to string
    const stringValue = String(value);
    
    // Escape quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    
    // Quote strings if necessary
    if (quoteStrings && (
      escapedValue.includes(delimiter) || 
      escapedValue.includes('\n') || 
      escapedValue.includes('"') ||
      escapedValue.includes('\r')
    )) {
      return `"${escapedValue}"`;
    }
    
    return escapedValue;
  };
  
  // Create the CSV rows
  const rows: string[] = [];
  
  // Add header row if includeHeaders is true
  if (includeHeaders) {
    rows.push(headers.map(header => formatCsvValue(header)).join(delimiter));
  }
  
  // Add data rows
  for (const item of jsonData) {
    const row = headers.map(header => extractValue(item, header));
    rows.push(row.join(delimiter));
  }
  
  // Join rows with newlines
  return rows.join('\n');
};

/**
 * Parses a CSV string into an array of objects
 * @param csvString The CSV string to parse
 * @param options Configuration options for parsing
 * @returns Array of objects parsed from the CSV
 */
export const parseCSV = (
  csvString: string,
  options: {
    headers?: string[];
    delimiter?: string;
    convertTypes?: boolean;
  } = {}
): any[] => {
  if (!csvString) {
    return [];
  }
  
  const {
    headers,
    delimiter = ',',
    convertTypes = true
  } = options;
  
  // Function to parse a CSV row
  const parseRow = (row: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < row.length) {
      const char = row[i];
      
      // Handle quotes
      if (char === '"') {
        if (inQuotes && i < row.length - 1 && row[i + 1] === '"') {
          // Double quotes inside quotes - add a single quote
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } 
      // Handle delimiters
      else if (char === delimiter && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } 
      // Add character to current value
      else {
        currentValue += char;
      }
      
      i++;
    }
    
    // Add the last value
    values.push(currentValue);
    
    return values;
  };
  
  // Convert string to appropriate type
  const convertValue = (value: string): any => {
    if (!convertTypes) {
      return value;
    }
    
    // Try to convert to number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Check for boolean
    if (value.toLowerCase() === 'true') {
      return true;
    }
    
    if (value.toLowerCase() === 'false') {
      return false;
    }
    
    // Check for null
    if (value.toLowerCase() === 'null') {
      return null;
    }
    
    // Check for date (ISO format)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
      return new Date(value);
    }
    
    // Return as string
    return value;
  };
  
  // Split the CSV string into rows, handling newlines in quoted values
  const processedString = csvString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let rows: string[] = [];
  let currentRow = '';
  let inQuotes = false;
  
  for (let i = 0; i < processedString.length; i++) {
    const char = processedString[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    }
    
    if (char === '\n' && !inQuotes) {
      rows.push(currentRow);
      currentRow = '';
    } else {
      currentRow += char;
    }
  }
  
  // Add the last row if it's not empty
  if (currentRow) {
    rows.push(currentRow);
  }
  
  // Filter out empty rows
  rows = rows.filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }
  
  // Determine headers - either use provided headers or take from the first row
  const rowHeaders = headers || parseRow(rows[0]);
  
  // Starting row for data (skip header row if not provided)
  const startingRow = headers ? 0 : 1;
  
  // Process each row into an object
  const result: any[] = [];
  
  for (let i = startingRow; i < rows.length; i++) {
    const row = parseRow(rows[i]);
    const obj: any = {};
    
    // Map values to headers
    for (let j = 0; j < rowHeaders.length; j++) {
      if (j < row.length) {
        obj[rowHeaders[j]] = convertValue(row[j]);
      } else {
        obj[rowHeaders[j]] = null;
      }
    }
    
    result.push(obj);
  }
  
  return result;
};

/**
 * Creates a File object from a base64 encoded string
 * @param base64String The base64 encoded string
 * @param filename The name for the created file
 * @param mimeType The MIME type of the file
 * @returns A File object created from the base64 string
 */
export const createFileFromBase64 = (
  base64String: string,
  filename: string,
  mimeType: string
): File => {
  // Remove data URL prefix if present
  const base64 = base64String.replace(/^data:[^;]+;base64,/, '');
  
  // Convert base64 string to binary string
  const binaryString = atob(base64);
  
  // Create an array of bytes from the binary string
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create a Blob from the array with the specified MIME type
  const blob = new Blob([bytes], { type: mimeType });
  
  // Create and return a new File object from the Blob with the specified filename
  return new File([blob], filename, { type: mimeType });
};