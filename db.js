const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection options for better performance (updated for newer versions)
const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    socketTimeoutMS: 45000, // Timeout for socket operations
    bufferCommands: false, // Disable mongoose buffering
    autoIndex: false, // Disable automatic index creation in production
    retryWrites: true,
    w: 'majority'
};

// Set strictQuery to false to prepare for Mongoose 7
mongoose.set('strictQuery', false);

const connection = mongoose.connect(process.env.mongoURL, connectionOptions);

// Connection event handlers
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

module.exports = {
    connection
};