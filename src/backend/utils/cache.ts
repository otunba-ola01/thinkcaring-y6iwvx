import Redis from 'ioredis'; // ioredis v5.3.2
import { redisOptions, keyPrefix, defaultTTL } from '../config/redis.config';
import { logger } from './logger';
import { createErrorFromUnknown } from './error';

/**
 * Interface for cache operation options
 */
export interface CacheOptions {
  namespace?: string;
  ttl?: number;
  storeName?: string;
}

/**
 * Interface for memoization options
 */
export interface MemoizeOptions {
  namespace?: string;
  ttl?: number;
  keyGenerator?: Function;
  storeName?: string;
}

/**
 * Default namespace for cache keys
 */
export const DEFAULT_NAMESPACE = 'general';

/**
 * Enum of available cache store types
 */
export const CACHE_STORES = {
  API_RESPONSE: 'api',
  SESSION: 'session',
  VALIDATION_RULES: 'validation',
  REFERENCE_DATA: 'reference'
};

/**
 * Creates and configures a Redis client instance
 * @returns Configured Redis client instance
 */
export function createRedisClient(): Redis {
  const client = new Redis(redisOptions);
  
  // Set up event handlers
  client.on('connect', () => {
    logger.info('Redis connection established');
  });
  
  client.on('error', (err) => {
    const error = createErrorFromUnknown(err);
    logger.error('Redis connection error', { error });
  });
  
  client.on('reconnecting', (delay) => {
    logger.info(`Redis reconnecting in ${delay}ms`);
  });
  
  return client;
}

/**
 * Generates a standardized cache key with prefix for a given key
 * @param key - Base key to format
 * @param namespace - Optional namespace for the key
 * @returns Formatted cache key with prefix and namespace
 */
function getKey(key: string, namespace?: string): string {
  if (!key) {
    throw new Error('Cache key must be provided');
  }
  
  const ns = namespace || DEFAULT_NAMESPACE;
  return `${keyPrefix}${ns}:${key}`;
}

/**
 * Stores a value in the cache with optional TTL
 * @param key - Key to store the value under
 * @param value - Value to store
 * @param options - Cache options
 * @returns Promise resolving to true if successful
 */
async function set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
  try {
    const formattedKey = getKey(key, options.namespace);
    const serializedValue = JSON.stringify(value);
    const ttl = options.ttl || defaultTTL;
    const client = cacheManager.getClient(options.storeName);
    
    await client.set(formattedKey, serializedValue, 'EX', ttl);
    logger.debug('Cache set', { key: formattedKey, ttl });
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: createErrorFromUnknown(error) });
    return false;
  }
}

/**
 * Retrieves a value from the cache by key
 * @param key - Key to retrieve
 * @param options - Cache options
 * @returns Promise resolving to cached value or null if not found
 */
async function get(key: string, options: CacheOptions = {}): Promise<any> {
  try {
    const formattedKey = getKey(key, options.namespace);
    const client = cacheManager.getClient(options.storeName);
    
    const value = await client.get(formattedKey);
    if (value) {
      logger.debug('Cache hit', { key: formattedKey });
      return JSON.parse(value);
    }
    
    logger.debug('Cache miss', { key: formattedKey });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: createErrorFromUnknown(error) });
    return null;
  }
}

/**
 * Removes a value from the cache by key
 * @param key - Key to remove
 * @param options - Cache options
 * @returns Promise resolving to true if successful
 */
async function del(key: string, options: CacheOptions = {}): Promise<boolean> {
  try {
    const formattedKey = getKey(key, options.namespace);
    const client = cacheManager.getClient(options.storeName);
    
    await client.del(formattedKey);
    logger.debug('Cache delete', { key: formattedKey });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: createErrorFromUnknown(error) });
    return false;
  }
}

/**
 * Checks if a key exists in the cache
 * @param key - Key to check
 * @param options - Cache options
 * @returns Promise resolving to true if key exists
 */
async function exists(key: string, options: CacheOptions = {}): Promise<boolean> {
  try {
    const formattedKey = getKey(key, options.namespace);
    const client = cacheManager.getClient(options.storeName);
    
    const result = await client.exists(formattedKey);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists error', { key, error: createErrorFromUnknown(error) });
    return false;
  }
}

/**
 * Gets the remaining time-to-live for a key in seconds
 * @param key - Key to check
 * @param options - Cache options
 * @returns Promise resolving to TTL in seconds or -1 if no TTL, -2 if key doesn't exist
 */
async function ttl(key: string, options: CacheOptions = {}): Promise<number> {
  try {
    const formattedKey = getKey(key, options.namespace);
    const client = cacheManager.getClient(options.storeName);
    
    return await client.ttl(formattedKey);
  } catch (error) {
    logger.error('Cache ttl error', { key, error: createErrorFromUnknown(error) });
    return -2;
  }
}

/**
 * Updates the TTL for an existing key
 * @param key - Key to update
 * @param ttl - New TTL in seconds
 * @param options - Cache options
 * @returns Promise resolving to true if successful
 */
async function setTTL(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
  try {
    const formattedKey = getKey(key, options.namespace);
    const client = cacheManager.getClient(options.storeName);
    
    const result = await client.expire(formattedKey, ttl);
    return result === 1;
  } catch (error) {
    logger.error('Cache setTTL error', { key, ttl, error: createErrorFromUnknown(error) });
    return false;
  }
}

/**
 * Gets all keys matching a pattern
 * @param pattern - Pattern to match (e.g., "user:*")
 * @param options - Cache options
 * @returns Promise resolving to array of matching keys
 */
async function keys(pattern: string, options: CacheOptions = {}): Promise<string[]> {
  try {
    const formattedPattern = `${keyPrefix}${pattern}`;
    const client = cacheManager.getClient(options.storeName);
    
    return await client.keys(formattedPattern);
  } catch (error) {
    logger.error('Cache keys error', { pattern, error: createErrorFromUnknown(error) });
    return [];
  }
}

/**
 * Removes all keys matching a pattern
 * @param pattern - Pattern to match (e.g., "user:*")
 * @param options - Cache options
 * @returns Promise resolving to number of keys removed
 */
async function flush(pattern: string, options: CacheOptions = {}): Promise<number> {
  try {
    const matchingKeys = await keys(pattern, options);
    
    if (matchingKeys.length === 0) {
      return 0;
    }
    
    const client = cacheManager.getClient(options.storeName);
    const pipeline = client.pipeline();
    
    matchingKeys.forEach(key => {
      pipeline.del(key);
    });
    
    const results = await pipeline.exec();
    const count = results ? results.length : 0;
    
    logger.info(`Flushed ${count} keys matching pattern: ${pattern}`);
    return count;
  } catch (error) {
    logger.error('Cache flush error', { pattern, error: createErrorFromUnknown(error) });
    return 0;
  }
}

/**
 * Removes all keys from the cache (dangerous operation)
 * @returns Promise resolving to 'OK' if successful
 */
async function flushAll(): Promise<string> {
  try {
    logger.warn('Flushing all cache keys - this is a destructive operation');
    const client = cacheManager.getClient();
    
    return await client.flushall();
  } catch (error) {
    logger.error('Cache flushAll error', { error: createErrorFromUnknown(error) });
    throw error;
  }
}

/**
 * Gets a value from cache or sets it if not found
 * @param key - Cache key
 * @param fetchFn - Function to call if cache miss
 * @param options - Cache options
 * @returns Promise resolving to cached or freshly fetched value
 */
async function getOrSet<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
  try {
    // Try to get from cache first
    const cachedValue = await get(key, options);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Cache miss, fetch fresh data
    const freshValue = await fetchFn();
    
    // Store in cache for next time
    await set(key, freshValue, options);
    
    return freshValue;
  } catch (error) {
    logger.error('Cache getOrSet error', { key, error: createErrorFromUnknown(error) });
    // If cache operations fail, fall back to fetching data directly
    return await fetchFn();
  }
}

/**
 * Creates a memoized version of a function with results stored in cache
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function that uses cache
 */
function memoize<T>(fn: (...args: any[]) => Promise<T>, options: MemoizeOptions = {}): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    // Generate cache key based on function name and arguments
    const fnName = fn.name || 'anonymous';
    const keyGenerator = options.keyGenerator || ((name: string, args: any[]) => {
      return `${name}:${JSON.stringify(args)}`;
    });
    
    const cacheKey = keyGenerator(fnName, args);
    const namespace = options.namespace || 'function';
    const ttl = options.ttl || defaultTTL;
    
    // Use getOrSet to handle caching logic
    return await getOrSet(
      cacheKey,
      () => fn(...args),
      { namespace, ttl, storeName: options.storeName }
    );
  };
}

/**
 * Invalidates cache for specific namespace or pattern
 * @param namespace - Namespace to invalidate
 * @returns Promise resolving to number of keys invalidated
 */
async function invalidateCache(namespace: string): Promise<number> {
  try {
    const pattern = `${namespace}:*`;
    logger.info(`Invalidating cache for namespace: ${namespace}`);
    
    return await flush(pattern);
  } catch (error) {
    logger.error('Cache invalidation error', { namespace, error: createErrorFromUnknown(error) });
    return 0;
  }
}

/**
 * Class that manages different cache stores for various purposes
 */
class CacheManager {
  private clients: Map<string, Redis>;
  private defaultClient: Redis;
  
  /**
   * Initializes the cache manager with default Redis client
   */
  constructor() {
    this.clients = new Map<string, Redis>();
    this.defaultClient = createRedisClient();
    this.clients.set('default', this.defaultClient);
  }
  
  /**
   * Gets a Redis client for a specific cache store
   * @param storeName - Name of the cache store
   * @returns Redis client for the specified store
   */
  getClient(storeName?: string): Redis {
    if (!storeName) {
      return this.defaultClient;
    }
    
    if (this.clients.has(storeName)) {
      return this.clients.get(storeName)!;
    }
    
    // Create new client for this store
    const newClient = createRedisClient();
    this.clients.set(storeName, newClient);
    
    return newClient;
  }
  
  /**
   * Closes all Redis client connections
   * @returns Promise that resolves when all connections are closed
   */
  async closeAll(): Promise<void> {
    const disconnectPromises: Promise<string>[] = [];
    
    this.clients.forEach((client) => {
      disconnectPromises.push(client.quit());
    });
    
    await Promise.all(disconnectPromises);
    logger.info(`Closed ${disconnectPromises.length} Redis connections`);
    
    this.clients.clear();
  }
}

// Create singleton instance of CacheManager
const cacheManager = new CacheManager();

// Create cache interface with all operations
const cache = {
  set,
  get,
  del,
  exists,
  ttl,
  setTTL,
  keys,
  flush,
  flushAll,
  getOrSet,
  memoize,
  invalidateCache
};

// Export cache utilities
export { cacheManager, cache, createRedisClient };