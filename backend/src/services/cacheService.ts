/**
 * Redis Cache Service
 * Implements T238 - Redis caching layer for frequently accessed data
 * Caches: expo lists, session schedules with TTL 5 minutes
 */

import { createClient } from 'redis';
import { logger } from '../utils/logger';

/**
 * Cache service singleton
 * Provides Redis-based caching with fallback to in-memory cache if Redis unavailable
 */
class CacheService {
  private static instance: CacheService;
  private redisClient: ReturnType<typeof createClient> | null = null;
  private isRedisConnected = false;
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60; // 5 minutes in seconds

  private constructor() {
    this.initializeRedis();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.warn('Redis connection failed after 10 retries, using memory cache fallback');
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis client ready');
        this.isRedisConnected = true;
      });

      this.redisClient.on('end', () => {
        logger.warn('Redis client connection ended');
        this.isRedisConnected = false;
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.warn('Failed to connect to Redis, using memory cache fallback:', error);
      this.isRedisConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } else {
        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value as T;
        }
        if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (default: 5 minutes)
   */
  public async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttl, serialized);
      } else {
        // Fallback to memory cache
        this.memoryCache.set(key, {
          value,
          expiresAt: Date.now() + ttl * 1000,
        });

        // Clean up expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  public async delete(key: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern Pattern to match (e.g., 'expo:*')
   */
  public async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        // Fallback: iterate through memory cache
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  public isConnected(): boolean {
    return this.isRedisConnected;
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
      this.isRedisConnected = false;
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Cache key generators
export const CacheKeys = {
  expoList: (organizerId: string, status?: string) => `expo:list:${organizerId}${status ? `:${status}` : ''}`,
  expoDetail: (expoId: string) => `expo:detail:${expoId}`,
  sessionSchedule: (expoId: string, filters?: string) => `session:schedule:${expoId}${filters ? `:${filters}` : ''}`,
  sessionDetail: (sessionId: string) => `session:detail:${sessionId}`,
};

export default cacheService;

