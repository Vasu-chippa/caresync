import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

const createInMemoryRedisClient = () => {
  const store = new Map();
  const sets = new Map();

  return {
    on() {},
    async ping() {
      return 'PONG';
    },
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async set(key, value) {
      store.set(key, value);
      return 'OK';
    },
    async del(...keys) {
      const flatKeys = keys.flat();
      let count = 0;
      flatKeys.forEach((key) => {
        if (store.delete(key)) count += 1;
        if (sets.delete(key)) count += 1;
      });
      return count;
    },
    async sadd(key, ...members) {
      const values = members.flat();
      const current = sets.get(key) || new Set();
      values.forEach((member) => current.add(member));
      sets.set(key, current);
      return current.size;
    },
    async srem(key, ...members) {
      const values = members.flat();
      const current = sets.get(key) || new Set();
      let removed = 0;
      values.forEach((member) => {
        if (current.delete(member)) {
          removed += 1;
        }
      });
      sets.set(key, current);
      return removed;
    },
    async smembers(key) {
      return Array.from(sets.get(key) || []);
    },
    async flushall() {
      store.clear();
      sets.clear();
      return 'OK';
    },
  };
};

const shouldUseInMemoryRedis =
  process.env.USE_IN_MEMORY_REDIS === 'true' ||
  !env.REDIS_URL ||
  (env.NODE_ENV === 'test' && process.env.USE_IN_MEMORY_REDIS !== 'false');

export const redisClient = shouldUseInMemoryRedis
  ? createInMemoryRedisClient()
  : new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });

if (!shouldUseInMemoryRedis) {
  redisClient.on('ready', () => logger.info('Redis connected'));
  redisClient.on('error', (error) => logger.error('Redis error', { error: error.message }));
}
