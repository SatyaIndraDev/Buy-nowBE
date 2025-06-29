const LRU = require('lru-cache');

// LRU Cache configuration
const cache = new LRU({
    max: 100, // Maximum number of items
    ttl: 5 * 60 * 1000, // 5 minutes TTL
    updateAgeOnGet: true, // Update age on get
    allowStale: true, // Allow stale items
    maxEntrySize: 5000, // Maximum size per entry (5KB)
});

// Cache middleware
const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            res.send(cachedResponse);
            return;
        }

        // Override res.send to cache the response
        const originalSend = res.send;
        res.send = function(body) {
            if (res.statusCode === 200) {
                cache.set(key, body, { ttl: duration * 1000 });
            }
            originalSend.call(this, body);
        };

        next();
    };
};

// Clear cache function
const clearCache = () => {
    cache.clear();
};

// Get cache stats
const getCacheStats = () => {
    return {
        size: cache.size,
        max: cache.max,
        ttl: cache.ttl,
        hits: cache.hits,
        misses: cache.misses
    };
};

module.exports = {
    cacheMiddleware,
    clearCache,
    getCacheStats,
    cache
}; 