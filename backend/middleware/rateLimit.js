/**
 * Simple in-memory rate limiter middleware
 * For production, consider using Redis-based rate limiting
 */

// Store: { ip: { count, resetTime } }
const requestCounts = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
        if (now > data.resetTime) {
            requestCounts.delete(ip);
        }
    }
}, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 */
function createRateLimiter({ windowMs = 60000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();

        let record = requestCounts.get(ip);

        if (!record || now > record.resetTime) {
            // New window
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            requestCounts.set(ip, record);
            return next();
        }

        record.count++;

        if (record.count > max) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            res.set('Retry-After', retryAfter);
            return res.status(429).json({
                error: message,
                retryAfter
            });
        }

        next();
    };
}

// Pre-configured rate limiters
const rateLimiters = {
    // General API: 100 requests per minute
    general: createRateLimiter({
        windowMs: 60 * 1000,
        max: 100,
        message: 'Too many requests, please try again later.'
    }),

    // Strict: 15 requests per minute (for validate-cart)
    strict: createRateLimiter({
        windowMs: 60 * 1000,
        max: 15,
        message: 'Too many requests. Please wait a moment.'
    }),

    // Auth: 5 attempts per minute (login/register)
    auth: createRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
        message: 'Too many login attempts. Please try again later.'
    }),

    // Transaction create: 10 per minute
    transaction: createRateLimiter({
        windowMs: 60 * 1000,
        max: 10,
        message: 'Too many transaction requests. Please slow down.'
    }),

    // Search/Check order: 30 per minute (admin/seller/user checking)
    search: createRateLimiter({
        windowMs: 60 * 1000,
        max: 30,
        message: 'Too many search requests. Please slow down.'
    })
};

module.exports = { createRateLimiter, rateLimiters };
