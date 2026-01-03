import Redis from 'ioredis';
import { logger } from './utils.ts';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

// Helper functions for refresh tokens
export const refreshTokenService = {
  async save(userId: string, token: string, expiresIn: number): Promise<void> {
    const key = `refresh_token:${token}`;
    await redis.setex(key, expiresIn, userId);
  },

  async exists(token: string): Promise<boolean> {
    const key = `refresh_token:${token}`;
    const result = await redis.exists(key);
    return result === 1;
  },

  async getUserId(token: string): Promise<string | null> {
    const key = `refresh_token:${token}`;
    return await redis.get(key);
  },

  async delete(token: string): Promise<void> {
    const key = `refresh_token:${token}`;
    await redis.del(key);
  },
};
