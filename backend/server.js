const express = require('express')
const cors = require('cors')
const { connect } = require('./db/mongoose')
const config = require('./config')

const app = express()

// Middleware
app.use(cors({ origin: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))  // For iPaymu callback (form data)
// Removed: Static file serving - using Cloudinary for images

// Routes
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/categories', require('./routes/category.routes'))
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/transactions', require('./routes/transaction.routes'))
app.use('/api/upload', require('./routes/upload.routes'))
app.use('/api/payouts', require('./routes/payout.routes'))
app.use('/api/users', require('./routes/user.routes'))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Database connection middleware for serverless
// Connect to MongoDB on first request (lazy initialization)
app.use(async (req, res, next) => {
  try {
    await connect(config.mongoUri)
    next()
  } catch (err) {
    console.error('MongoDB connection failed:', err)
    res.status(503).json({ 
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    })
  }
})

// For local development: Connect at startup
if (process.env.VERCEL !== '1') {
  connect(config.mongoUri)
    .then(() => {
      console.log('MongoDB connected')
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err)
    })
}

// For Vercel serverless: Export app (no app.listen needed)
// For local development: Start server if not in Vercel
if (process.env.VERCEL !== '1') {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

module.exports = app

