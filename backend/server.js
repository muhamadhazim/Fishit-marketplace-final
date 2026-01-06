const express = require('express')
const path = require('path')
const cors = require('cors')
const { connect } = require('./db/mongoose')
const config = require('./config')

const app = express()

// Middleware
app.use(cors({ origin: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))  // For iPaymu callback (form data)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/categories', require('./routes/category.routes'))
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/admin', require('./routes/admin.routes'))
app.use('/api/transactions', require('./routes/transaction.routes'))
app.use('/api/upload', require('./routes/upload.routes'))
app.use('/api/payouts', require('./routes/payout.routes'))
app.use('/api/users', require('./routes/user.routes'))

// Database & Server
connect(config.mongoUri)
  .then(() => {
    app.listen(config.port)
    console.log(`Server running on port ${config.port}`)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })


