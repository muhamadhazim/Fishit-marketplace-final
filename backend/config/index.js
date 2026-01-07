// Only load dotenv in local development (not in Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    require('dotenv').config();
}

const config = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fishit_marketplace',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
    uploadDir: 'uploads',
    // MongoDB connection options for serverless optimization
    mongoOptions: {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
    }
};

// Validate required config in production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    if (!process.env.MONGODB_URI) {
        console.error('ERROR: MONGODB_URI environment variable is required!');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret') {
        console.error('WARNING: Using default JWT_SECRET in production!');
    }
}

module.exports = config;
