import Redis from "ioredis";

export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const createRedisClient = () => {
  return new Redis(redisConfig);
};

export const publisher = createRedisClient();
