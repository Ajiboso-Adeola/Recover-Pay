// src/redis.ts
import Redis from "ioredis";

// For general use — token caching in nombaClient.ts
export const redisConnection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// For BullMQ Queue and Worker — must be options object, not Redis instance
export const bullMQConnection = {
  url: process.env.REDIS_URL!,
  maxRetriesPerRequest: null as null,  // "as null" keeps TypeScript happy
  enableReadyCheck: false,
};

redisConnection.on("error", (err) => {
  console.error("[redis] Connection error:", err.message);
});

redisConnection.on("connect", () => {
  console.log("[redis] Connected");
});