import * as promClient from 'prom-client'; // prom-client 14.2.0
import { debug, info, error } from './logger';

// Global metrics registry
const metricsRegistry = new promClient.Registry();

// Default labels for all metrics
const defaultLabels = { 
  service: 'hcbs-revenue-management', 
  environment: process.env.NODE_ENV || 'development' 
};

// Map to store metric instances
const metricCollectors = new Map<string, promClient.Metric<any>>();

/**
 * Initializes the metrics system with default configuration
 */
export const initializeMetrics = (): void => {
  // Set default labels for all metrics
  metricsRegistry.setDefaultLabels(defaultLabels);
  
  // Register default metrics (CPU, memory, GC, event loop)
  promClient.collectDefaultMetrics({ 
    register: metricsRegistry,
    prefix: 'hcbs_'
  });
  
  info('Metrics system initialized', { defaultLabels });
};

/**
 * Creates a counter metric for tracking cumulative values
 * 
 * @param name - Metric name
 * @param help - Help text describing the metric
 * @param labelNames - Names of labels for this metric
 * @returns Prometheus counter instance
 */
export const createCounter = (name: string, help: string, labelNames: string[] = []): promClient.Counter<string> => {
  // Check if counter already exists
  const existingMetric = metricCollectors.get(name);
  if (existingMetric) {
    debug('Returning existing counter', { name });
    return existingMetric as promClient.Counter<string>;
  }
  
  // Create new counter
  const counter = new promClient.Counter({
    name,
    help,
    labelNames,
    registers: [metricsRegistry]
  });
  
  // Store in collectors map
  metricCollectors.set(name, counter);
  debug('Created counter metric', { name, help, labelNames });
  
  return counter;
};

/**
 * Creates a gauge metric for tracking values that can go up and down
 * 
 * @param name - Metric name
 * @param help - Help text describing the metric
 * @param labelNames - Names of labels for this metric
 * @returns Prometheus gauge instance
 */
export const createGauge = (name: string, help: string, labelNames: string[] = []): promClient.Gauge<string> => {
  // Check if gauge already exists
  const existingMetric = metricCollectors.get(name);
  if (existingMetric) {
    debug('Returning existing gauge', { name });
    return existingMetric as promClient.Gauge<string>;
  }
  
  // Create new gauge
  const gauge = new promClient.Gauge({
    name,
    help,
    labelNames,
    registers: [metricsRegistry]
  });
  
  // Store in collectors map
  metricCollectors.set(name, gauge);
  debug('Created gauge metric', { name, help, labelNames });
  
  return gauge;
};

/**
 * Creates a histogram metric for measuring distributions of values
 * 
 * @param name - Metric name
 * @param help - Help text describing the metric
 * @param labelNames - Names of labels for this metric
 * @param buckets - Histogram buckets (default Prometheus buckets if not specified)
 * @returns Prometheus histogram instance
 */
export const createHistogram = (
  name: string, 
  help: string, 
  labelNames: string[] = [], 
  buckets?: number[]
): promClient.Histogram<string> => {
  // Check if histogram already exists
  const existingMetric = metricCollectors.get(name);
  if (existingMetric) {
    debug('Returning existing histogram', { name });
    return existingMetric as promClient.Histogram<string>;
  }
  
  // Create new histogram
  const histogram = new promClient.Histogram({
    name,
    help,
    labelNames,
    buckets,
    registers: [metricsRegistry]
  });
  
  // Store in collectors map
  metricCollectors.set(name, histogram);
  debug('Created histogram metric', { name, help, labelNames, buckets });
  
  return histogram;
};

/**
 * Creates a summary metric for measuring distributions with quantiles
 * 
 * @param name - Metric name
 * @param help - Help text describing the metric
 * @param labelNames - Names of labels for this metric
 * @param percentiles - Percentiles to calculate
 * @returns Prometheus summary instance
 */
export const createSummary = (
  name: string, 
  help: string, 
  labelNames: string[] = [], 
  percentiles: { [key: number]: number } = { 0.01: 0.001, 0.05: 0.005, 0.5: 0.05, 0.9: 0.01, 0.95: 0.01, 0.99: 0.001 }
): promClient.Summary<string> => {
  // Check if summary already exists
  const existingMetric = metricCollectors.get(name);
  if (existingMetric) {
    debug('Returning existing summary', { name });
    return existingMetric as promClient.Summary<string>;
  }
  
  // Create new summary
  const summary = new promClient.Summary({
    name,
    help,
    labelNames,
    percentiles,
    registers: [metricsRegistry]
  });
  
  // Store in collectors map
  metricCollectors.set(name, summary);
  debug('Created summary metric', { name, help, labelNames, percentiles });
  
  return summary;
};

/**
 * Retrieves a metric by name from the registry
 * 
 * @param name - Name of the metric to retrieve
 * @returns The metric instance if found, undefined otherwise
 */
export const getMetric = (name: string): promClient.Metric<any> | undefined => {
  const metric = metricCollectors.get(name);
  debug('Retrieving metric', { name, found: !!metric });
  return metric;
};

/**
 * Removes a metric from the registry
 * 
 * @param name - Name of the metric to remove
 * @returns True if metric was removed, false otherwise
 */
export const removeMetric = (name: string): boolean => {
  const metric = metricCollectors.get(name);
  if (metric) {
    metricsRegistry.removeSingleMetric(name);
    metricCollectors.delete(name);
    debug('Removed metric', { name });
    return true;
  }
  
  debug('Metric not found for removal', { name });
  return false;
};

/**
 * Retrieves all metrics in JSON format
 * 
 * @returns Promise resolving to JSON object containing all metrics
 */
export const getMetricsAsJSON = async (): Promise<object> => {
  debug('Retrieving metrics as JSON');
  return metricsRegistry.getMetricsAsJSON();
};

/**
 * Retrieves all metrics in Prometheus text format
 * 
 * @returns Promise resolving to metrics in Prometheus text format
 */
export const getMetricsAsPrometheus = async (): Promise<string> => {
  debug('Retrieving metrics as Prometheus text format');
  return metricsRegistry.metrics();
};

/**
 * Tracks API response time using a histogram metric
 * 
 * @param route - API route
 * @param method - HTTP method
 * @param statusCode - HTTP status code
 * @param responseTime - Response time in milliseconds
 */
export const trackApiResponseTime = (
  route: string,
  method: string,
  statusCode: number,
  responseTime: number
): void => {
  // Get or create histogram
  const histogram = createHistogram(
    'hcbs_api_response_time_seconds',
    'Response time for API requests in seconds',
    ['route', 'method', 'status_code'],
    [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
  );
  
  // Record response time in seconds (convert from ms to seconds)
  histogram.labels(route, method, statusCode.toString()).observe(responseTime / 1000);
  
  debug('Tracked API response time', { route, method, statusCode, responseTime });
};

/**
 * Tracks database query execution time using a histogram metric
 * 
 * @param operation - Database operation (select, insert, update, delete)
 * @param entity - Database entity/table
 * @param queryTime - Query execution time in milliseconds
 */
export const trackDatabaseQueryTime = (
  operation: string,
  entity: string,
  queryTime: number
): void => {
  // Get or create histogram
  const histogram = createHistogram(
    'hcbs_database_query_time_seconds',
    'Execution time for database queries in seconds',
    ['operation', 'entity'],
    [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2]
  );
  
  // Record query time in seconds (convert from ms to seconds)
  histogram.labels(operation, entity).observe(queryTime / 1000);
  
  debug('Tracked database query time', { operation, entity, queryTime });
};

/**
 * Tracks business-specific metrics such as claim processing, payment reconciliation, etc.
 * 
 * @param category - Metric category (claims, payments, billing)
 * @param action - Specific action (submitted, processed, denied)
 * @param value - Metric value
 * @param labels - Additional labels
 */
export const trackBusinessMetric = (
  category: string,
  action: string,
  value: number,
  labels: Record<string, string> = {}
): void => {
  const labelNames = Object.keys(labels);
  const labelValues = Object.values(labels);
  
  // Determine metric type based on category and action
  if (
    (category === 'claims' && ['submitted', 'processed', 'denied', 'approved'].includes(action)) ||
    (category === 'payments' && ['received', 'reconciled'].includes(action))
  ) {
    // Use counter for cumulative actions
    const counter = createCounter(
      `hcbs_${category}_${action}_total`,
      `Total number of ${action} ${category}`,
      labelNames
    );
    
    if (labelNames.length > 0) {
      counter.labels(...labelValues).inc(value);
    } else {
      counter.inc(value);
    }
  } else if (
    action === 'processing_time' ||
    action === 'response_time' ||
    action.includes('_time')
  ) {
    // Use histogram for timing metrics
    const histogram = createHistogram(
      `hcbs_${category}_${action}_seconds`,
      `${action.replace('_', ' ')} for ${category} in seconds`,
      labelNames,
      [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60, 300]
    );
    
    // Convert milliseconds to seconds
    if (labelNames.length > 0) {
      histogram.labels(...labelValues).observe(value / 1000);
    } else {
      histogram.observe(value / 1000);
    }
  } else if (
    action === 'count' ||
    action === 'active' ||
    action === 'pending' ||
    action === 'current'
  ) {
    // Use gauge for current state metrics
    const gauge = createGauge(
      `hcbs_${category}_${action}`,
      `Current number of ${action} ${category}`,
      labelNames
    );
    
    if (labelNames.length > 0) {
      gauge.labels(...labelValues).set(value);
    } else {
      gauge.set(value);
    }
  } else if (
    action === 'success_rate' ||
    action === 'error_rate' ||
    action.includes('_rate') ||
    action.includes('_percentage')
  ) {
    // Use gauge for rate metrics
    const gauge = createGauge(
      `hcbs_${category}_${action}`,
      `${action.replace('_', ' ')} for ${category}`,
      labelNames
    );
    
    if (labelNames.length > 0) {
      gauge.labels(...labelValues).set(value);
    } else {
      gauge.set(value);
    }
  } else {
    // Default to counter
    const counter = createCounter(
      `hcbs_${category}_${action}_total`,
      `Total number of ${action} ${category}`,
      labelNames
    );
    
    if (labelNames.length > 0) {
      counter.labels(...labelValues).inc(value);
    } else {
      counter.inc(value);
    }
  }
  
  debug('Tracked business metric', { category, action, value, labels });
};

/**
 * Creates Express middleware for exposing Prometheus metrics endpoint
 * 
 * @returns Express middleware function for metrics endpoint
 */
export const createMetricsMiddleware = () => {
  return async (req: any, res: any, next: Function) => {
    if (req.path === '/metrics') {
      try {
        const metrics = await getMetricsAsPrometheus();
        res.set('Content-Type', promClient.register.contentType);
        res.send(metrics);
      } catch (err) {
        error('Error generating metrics', { error: err });
        res.status(500).send('Error generating metrics');
      }
    } else {
      next();
    }
  };
};

/**
 * Resets all metrics in the registry (primarily for testing)
 */
export const resetMetrics = (): void => {
  metricsRegistry.resetMetrics();
  metricCollectors.clear();
  initializeMetrics();
  info('Metrics reset');
};

// Export the registry for direct access if needed
export const registry = metricsRegistry;

// Initialize metrics on module import
initializeMetrics();