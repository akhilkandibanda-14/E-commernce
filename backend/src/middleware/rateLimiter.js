/**
 * In-Memory Sliding-Window Rate Limiter
 * Protects sensitive endpoints (login, registration, orders, quotes, coupons) from abuse.
 * 
 * Note on Multi-Instance Deployments:
 * For multi-instance/clustered environments, replace this in-memory Map
 * with a shared distributed store (such as Redis or Memcached).
 */

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // Default: 15 minutes
  max = 10,                   // Default: 10 requests per window
  message = "Too many requests. Please try again later.",
  keyGenerator = (req) => req.ip || req.connection?.remoteAddress || "unknown",
} = {}) => {
  const hits = new Map();

  const limiter = (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const timestamps = hits.get(key) || [];

    // Filter out timestamps outside the sliding window
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (validTimestamps.length >= max) {
      const oldestHit = validTimestamps[0];
      const resetTimeMs = windowMs - (now - oldestHit);
      const retryAfterSec = Math.max(1, Math.ceil(resetTimeMs / 1000));

      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil((oldestHit + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      });
    }

    validTimestamps.push(now);
    hits.set(key, validTimestamps);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - validTimestamps.length));

    next();
  };

  // Helper for test isolation
  limiter.reset = () => {
    hits.clear();
  };

  return limiter;
};

// Rate limiter for authentication attempts (10 requests per 15 minutes)
export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts from this IP address. Please try again after 15 minutes.",
});

// Rate limiter for new user registration (5 accounts per 1 hour)
export const authRegisterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many accounts created from this IP address. Please try again after 1 hour.",
});

// Rate limiter for coupon code validation (25 attempts per 10 minutes)
export const couponValidateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 25,
  message: "Too many coupon validation attempts. Please try again after 10 minutes.",
});

// Rate limiter for order placement (20 orders per 15 minutes)
export const orderCreationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many order placement requests. Please try again after 15 minutes.",
});

// Rate limiter for corporate gifting quote inquiries (10 inquiries per 15 minutes)
export const quoteRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many quote requests submitted. Please wait before submitting another inquiry.",
});

// Rate limiter for bulk enquiries and catalogue requests (10 per 15 minutes)
export const enquiryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many enquiries submitted. Please wait before sending another.",
});
