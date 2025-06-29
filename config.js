require('dotenv').config();

const config = {
    // Server configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database configuration
    mongoURL: process.env.mongoURL,
    
    // Security configuration
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    
    // Rate limiting configuration
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per windowMs
    },
    
    // Cache configuration
    cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100 // Maximum number of cached items
    },
    
    // Pagination defaults
    pagination: {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100
    }
};

module.exports = config; 