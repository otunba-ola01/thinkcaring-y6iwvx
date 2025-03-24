/**
 * CORS Configuration
 * 
 * This file configures Cross-Origin Resource Sharing (CORS) options for the HCBS Revenue Management System API.
 * It defines allowed origins, methods, headers, and other CORS settings to ensure secure communication
 * between the frontend application and the backend API while preventing unauthorized cross-origin requests.
 */

import { CorsOptions } from 'cors'; // cors ^2.8.5

// Environment variables for configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Validates if the request origin is allowed to access the API
 * 
 * @param origin - The origin of the request
 * @param callback - The callback function to call with the validation result
 */
const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
  // Allow requests with no origin (like mobile apps, curl requests, same-origin requests)
  if (!origin) {
    callback(null, true);
    return;
  }

  // In development mode, we can be more permissive
  if (NODE_ENV === 'development') {
    callback(null, true);
    return;
  }

  // Check if the origin is in our allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

/**
 * CORS configuration options for the Express application
 */
export const corsOptions: CorsOptions = {
  // Use the origin validator function to determine if a request is allowed
  origin: originValidator,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Headers that the client is allowed to use in requests
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  
  // Headers that the server will expose to the client
  exposedHeaders: [
    'Content-Disposition',
    'X-Total-Count',
    'X-Rate-Limit-Remaining'
  ],
  
  // Allow credentials to be sent with requests (cookies, authorization headers)
  credentials: true,
  
  // Cache preflight request results for 24 hours (86400 seconds)
  maxAge: 86400,
  
  // Do not pass the CORS preflight response to the next handler
  preflightContinue: false
};

// Default export for easy importing
export default corsOptions;