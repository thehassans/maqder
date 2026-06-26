import Tenant from '../models/Tenant.js';
import logger from './logger.js';

/**
 * Per-tenant ZATCA API rate limiter.
 * Uses in-memory sliding window counters to limit ZATCA API calls per tenant.
 * Prevents hitting ZATCA API rate limits and distributes load evenly.
 */

const DEFAULT_RPM = 10;
const DEFAULT_BURST = 20;

const buckets = new Map();

const getBucket = (tenantId) => {
  const key = String(tenantId);
  if (!buckets.has(key)) {
    buckets.set(key, {
      tokens: DEFAULT_BURST,
      lastRefill: Date.now(),
      requestsThisMinute: 0,
      minuteStart: Date.now(),
      totalRequests: 0,
      totalBlocked: 0,
    });
  }
  return buckets.get(key);
};

const refillTokens = (bucket, rpm, burst) => {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  const refillRate = rpm / 60;
  bucket.tokens = Math.min(burst, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (now - bucket.minuteStart >= 60000) {
    bucket.requestsThisMinute = 0;
    bucket.minuteStart = now;
  }
};

/**
 * Check if a tenant can make a ZATCA API call.
 * @param {string} tenantId - Tenant ID
 * @returns {{ allowed: boolean, reason: string, retryAfter: number }}
 */
export function checkRateLimit(tenantId) {
  const bucket = getBucket(tenantId);
  const rpm = DEFAULT_RPM;
  const burst = DEFAULT_BURST;

  refillTokens(bucket, rpm, burst);

  if (bucket.requestsThisMinute >= rpm) {
    bucket.totalBlocked++;
    const retryAfter = Math.ceil((60000 - (Date.now() - bucket.minuteStart)) / 1000);
    logger.warn(`[ZATCA RateLimiter] Tenant ${tenantId} blocked: RPM limit (${rpm}) exceeded`);
    return { allowed: false, reason: 'RPM limit exceeded', retryAfter };
  }

  if (bucket.tokens < 1) {
    bucket.totalBlocked++;
    const retryAfter = Math.ceil((1 - bucket.tokens) / (rpm / 60));
    logger.warn(`[ZATCA RateLimiter] Tenant ${tenantId} blocked: burst limit exceeded`);
    return { allowed: false, reason: 'Burst limit exceeded', retryAfter };
  }

  bucket.tokens -= 1;
  bucket.requestsThisMinute++;
  bucket.totalRequests++;
  return { allowed: true, reason: '', retryAfter: 0 };
}

/**
 * Consume a rate limit token. Throws if rate limited.
 * @param {string} tenantId - Tenant ID
 */
export function consumeRateLimit(tenantId) {
  const result = checkRateLimit(tenantId);
  if (!result.allowed) {
    const err = new Error(`ZATCA API rate limit exceeded for tenant. Retry after ${result.retryAfter}s`);
    err.code = 'RATE_LIMITED';
    err.retryAfter = result.retryAfter;
    throw err;
  }
}

/**
 * Get rate limiter stats for a tenant.
 * @param {string} tenantId
 */
export function getRateLimitStats(tenantId) {
  const bucket = getBucket(tenantId);
  refillTokens(bucket, DEFAULT_RPM, DEFAULT_BURST);
  return {
    tenantId: String(tenantId),
    tokensAvailable: Math.floor(bucket.tokens),
    requestsThisMinute: bucket.requestsThisMinute,
    rpmLimit: DEFAULT_RPM,
    burstLimit: DEFAULT_BURST,
    totalRequests: bucket.totalRequests,
    totalBlocked: bucket.totalBlocked,
  };
}

/**
 * Get rate limiter stats for all active tenants.
 */
export async function getAllRateLimitStats() {
  const tenants = await Tenant.find({ isActive: true, 'zatca.isOnboarded': true })
    .select('name slug')
    .lean();

  return tenants.map((tenant) => ({
    ...getRateLimitStats(tenant._id),
    tenantName: tenant.name,
  }));
}

/**
 * Reset rate limiter for a specific tenant.
 * @param {string} tenantId
 */
export function resetRateLimit(tenantId) {
  const key = String(tenantId);
  buckets.delete(key);
  logger.info(`[ZATCA RateLimiter] Reset for tenant ${tenantId}`);
}

export default { checkRateLimit, consumeRateLimit, getRateLimitStats, getAllRateLimitStats, resetRateLimit };
