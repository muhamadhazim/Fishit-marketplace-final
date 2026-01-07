const mongoose = require('mongoose')

// Global cache for serverless environments (Vercel)
// This prevents creating new connections on every request
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connect(uri) {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn
  }

  // Return pending connection promise if connecting
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Disable autoIndex in production for performance
      autoIndex: process.env.NODE_ENV !== 'production',
      // Connection timeout settings for serverless
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      // Connection pool settings optimized for serverless
      maxPoolSize: 10, // Limit connection pool
      minPoolSize: 1,
      // Retry settings
      retryWrites: true,
      retryReads: true,
    }

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log('MongoDB connected successfully')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('MongoDB connection error:', e)
    throw e
  }

  return cached.conn
}

module.exports = { connect }
