require('dotenv').config();

const config = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fishit_marketplace',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
    uploadDir: 'uploads'
};

module.exports = config;
