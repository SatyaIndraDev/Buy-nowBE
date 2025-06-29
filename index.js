const express = require("express");
const { connection } = require("./db");
const { ProductRouter } = require("./Routes/Products.route");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const config = require("./config");
const { performanceMiddleware, healthCheck } = require("./middleware/performance");

require('dotenv').config()

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware to reduce response size
app.use(compression());

// Performance monitoring
app.use(performanceMiddleware);

// Rate limiting to prevent abuse
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: config.allowedOrigins,
    credentials: true
}));

// Health check endpoint with performance metrics
app.get('/health', healthCheck);

// Routes
app.use("/products", ProductRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        error: "Internal server error",
        message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(config.port, async() => {
    try{
        await connection;
        console.log("✅ Connected to the database successfully");
        console.log(`🚀 Server running on port ${config.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔒 Security: Helmet enabled`);
        console.log(`🗜️ Compression: Enabled`);
        console.log(`⏱️ Rate limiting: ${config.rateLimit.max} requests per ${config.rateLimit.windowMs/1000/60} minutes`);
    }catch(err){
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    }
});