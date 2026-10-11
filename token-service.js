// token-service.js
// A single-use, expiring token service backed by Redis.

import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

// Helper: build the Redis key for a token ID.
const keyFor = (id) => "token:" + id;

/**
 * Issue a new token.
 *
 * @param {object} payload - Data associated with the token.
 * @param {number} ttlSeconds - Seconds until the token expires.
 * @returns {Promise<string>} The generated token ID.
 */
export async function issueToken(payload, ttlSeconds) {
  const tokenId = crypto.randomBytes(16).toString("hex");
  const value = JSON.stringify(payload);

  await redis.set(
    keyFor(tokenId),
    value,
    "EX",
    ttlSeconds
  );

  return tokenId;
}

/**
 * Consume a token exactly once.
 *
 * @param {string} tokenId - The token ID to consume.
 * @returns {Promise<{ ok: true, payload: object } | { ok: false, reason: string }>}
 */
export async function consumeToken(tokenId) {
  const value = await redis.getdel(keyFor(tokenId));

  if (value === null) {
    return {
      ok: false,
      reason: "invalid"
    };
  }

  return {
    ok: true,
    payload: JSON.parse(value)
  };
}

// Allow other files to close the connection cleanly.
export function closeRedis() {
  return redis.quit();
}