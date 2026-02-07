import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log('✓ Redis disconnected');
  } catch (error) {
    console.error('Error disconnecting from Redis:', error);
  }
};

export const get = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

export const set = async (
  key: string,
  value: string,
  expirationSeconds?: number
): Promise<void> => {
  try {
    if (expirationSeconds) {
      await redisClient.setEx(key, expirationSeconds, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    console.error('Redis SET error:', error);
    throw error;
  }
};

export const del = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
    throw error;
  }
};

process.on('beforeExit', async () => {
  await disconnectRedis();
});

export default redisClient;
