const performance = require('perf_hooks').performance;

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
    const start = performance.now();
    
    // Add performance data to response headers
    res.on('finish', () => {
        const duration = performance.now() - start;
        const durationMs = Math.round(duration * 100) / 100;
        
        // Add performance headers
        res.setHeader('X-Response-Time', `${durationMs}ms`);
        res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
        
        // Log slow requests (over 1 second)
        if (duration > 1000) {
            console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} - ${durationMs}ms`);
        }
        
        // Log performance metrics
        console.log(`📊 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${durationMs}ms`);
    });
    
    next();
};

// Generate unique request ID
const generateRequestId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Memory usage monitoring
const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
        rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
    };
};

// Health check with performance metrics
const healthCheck = (req, res) => {
    const memoryUsage = getMemoryUsage();
    const uptime = process.uptime();
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime * 100) / 100,
        memory: memoryUsage,
        environment: process.env.NODE_ENV || 'development',
        version: process.version
    });
};

module.exports = {
    performanceMiddleware,
    getMemoryUsage,
    healthCheck
}; 