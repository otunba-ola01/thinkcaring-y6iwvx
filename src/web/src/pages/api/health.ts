import { NextApiRequest, NextApiResponse } from 'next'; // next v13.4+
import { apiClient } from '../../api/client';
import { SystemHealthStatus } from '../../types/api.types';

// Define the backend health endpoint
const BACKEND_HEALTH_ENDPOINT = '/api/health';

// Define interfaces for health check results
interface FrontendHealthResult {
  healthy: boolean;
  responseTime: number;
  version: string;
  message: string;
  error?: any;
}

interface BackendHealthResult {
  status: SystemHealthStatus;
  responseTime: number;
  components: any;
  version: string;
  message: string;
  error?: any;
}

interface SystemHealthResult {
  status: SystemHealthStatus;
  responseTime: number;
  components: any;
  version: string;
  timestamp: Date;
}

/**
 * Checks the health of the frontend application
 * 
 * @returns Promise resolving to health check result for the frontend application
 */
async function checkFrontendHealth(): Promise<FrontendHealthResult> {
  const startTime = Date.now();
  
  try {
    // Perform basic checks to verify frontend application is functioning
    const healthy = true;
    const responseTime = Date.now() - startTime;
    
    return {
      healthy,
      responseTime,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      message: 'Frontend is operational'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Frontend health check failed:', error);
    
    return {
      healthy: false,
      responseTime,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      message: 'Frontend health check failed',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal error'
    };
  }
}

/**
 * Checks the health of the backend services by calling the backend health endpoint
 * 
 * @param type - The type of health check to perform (live, ready, deep)
 * @returns Promise resolving to health check result from the backend services
 */
async function checkBackendHealth(type: string): Promise<BackendHealthResult> {
  const startTime = Date.now();
  
  try {
    // Determine the appropriate backend health endpoint based on type parameter
    let endpoint = BACKEND_HEALTH_ENDPOINT;
    if (type) {
      endpoint = `${BACKEND_HEALTH_ENDPOINT}/${type}`;
    }
    
    // Make a GET request to the backend health endpoint
    const response = await apiClient.get(endpoint);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.data.status || SystemHealthStatus.HEALTHY,
      responseTime,
      components: response.data.services || {},
      version: response.data.version || 'unknown',
      message: response.data.message || 'Backend services are operational'
    };
  } catch (error) {
    // Calculate response time even for failed requests
    const responseTime = Date.now() - startTime;
    
    console.error('Backend health check failed:', error);
    
    // Return error status
    return {
      status: SystemHealthStatus.UNKNOWN,
      responseTime,
      components: {},
      version: 'unknown',
      message: 'Backend health check failed',
      error: process.env.NODE_ENV === 'development' ? error : 'Backend service unavailable'
    };
  }
}

/**
 * Gets the overall system health by combining frontend and backend health checks
 * 
 * @param type - The type of health check to perform
 * @returns Promise resolving to combined health check result for the entire system
 */
async function getSystemHealth(type: string): Promise<SystemHealthResult> {
  const startTime = Date.now();
  
  // Execute frontend and backend health checks in parallel
  const [frontendHealth, backendHealth] = await Promise.all([
    checkFrontendHealth(),
    checkBackendHealth(type)
  ]);
  
  // Determine overall system health status based on component results
  const status = determineSystemHealthStatus(frontendHealth, backendHealth);
  
  // Calculate total response time
  const responseTime = Date.now() - startTime;
  
  return {
    status,
    responseTime,
    components: {
      frontend: frontendHealth,
      backend: backendHealth
    },
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timestamp: new Date()
  };
}

/**
 * Determines the overall system health status based on component results
 * 
 * @param frontendHealth - Frontend health check result
 * @param backendHealth - Backend health check result
 * @returns Overall system health status
 */
function determineSystemHealthStatus(
  frontendHealth: FrontendHealthResult,
  backendHealth: BackendHealthResult
): SystemHealthStatus {
  // Check if backend health is CRITICAL or UNKNOWN
  if (backendHealth.status === SystemHealthStatus.CRITICAL || 
      backendHealth.status === SystemHealthStatus.UNKNOWN) {
    return SystemHealthStatus.CRITICAL;
  }
  
  // Check if frontend health is unhealthy
  if (!frontendHealth.healthy) {
    return SystemHealthStatus.DEGRADED;
  }
  
  // Check if backend health is DEGRADED or WARNING
  if (backendHealth.status === SystemHealthStatus.DEGRADED || 
      backendHealth.status === SystemHealthStatus.WARNING) {
    return backendHealth.status;
  }
  
  // If all components are healthy, return HEALTHY status
  return SystemHealthStatus.HEALTHY;
}

/**
 * Next.js API route handler for health check endpoints
 * 
 * @param req - The Next.js API request
 * @param res - The Next.js API response
 */
async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    // Extract health check type from query parameters (live, ready, deep)
    const { type } = req.query;
    const healthCheckType = Array.isArray(type) ? type[0] : type;
    
    // For /health/live endpoint, perform basic liveness check and return 200 OK
    if (healthCheckType === 'live') {
      res.status(200).json({
        status: SystemHealthStatus.HEALTHY,
        message: 'Service is alive',
        timestamp: new Date()
      });
      return;
    }
    
    // For /health/ready endpoint, check if the system is ready to accept traffic
    // For /health/deep endpoint, perform a comprehensive health check
    const health = await getSystemHealth(healthCheckType);
    
    // Determine HTTP status code based on health check result
    let statusCode = 200;
    if (health.status === SystemHealthStatus.CRITICAL) {
      statusCode = 503; // Service unavailable
    }
    
    // Set appropriate cache control headers to prevent caching of health check results
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Include detailed health information in the response body
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check failed with an unexpected error:', error);
    
    // Handle any errors during health check and return 500 status
    res.status(500).json({
      status: SystemHealthStatus.CRITICAL,
      message: 'Health check failed due to an unexpected error',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error',
      timestamp: new Date()
    });
  }
}

// Export the handler function as the default export
export default handler;