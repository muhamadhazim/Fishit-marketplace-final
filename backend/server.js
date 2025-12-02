require('dotenv').config()
const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { connect } = require('./db/mongoose')
const Product = require('./models/product.model')
const Category = require('./models/category.model')
const Transaction = require('./models/transaction.model')
const User = require('./models/user.model')
const auth = require('./middleware/auth')

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/upload', require('./routes/upload.routes'));

const port = process.env.PORT || 4000
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fishit_marketplace'
connect(uri)
  .then(() => {
    app.listen(port)
    console.log(`Server running on port ${port}`)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })



app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true })
      .populate({ path: 'category_id', select: 'name slug' })
      .lean()
    const data = products.map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      image_url: p.image_url || '',
      stock: p.stock || 0,
      specifications: p.specifications || {},
      category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
    }))
    res.json({ products: data })
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
      .populate({ path: 'category_id', select: 'name slug' })
      .lean()
    if (!p) return res.status(404).json({ error: 'Not found' })
    res.json({
      id: p._id,
      name: p.name,
      price: p.price,
      image_url: p.image_url || '',
      stock: p.stock || 0,
      specifications: p.specifications || {},
      category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
    })
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find({}).lean()
    res.json({ categories: cats.map((c) => ({ id: c._id, name: c.name, slug: c.slug })) })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})



app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, price, category_id, image_url, stock, specifications, is_active } = req.body
    if (!name || price == null || !category_id || !specifications) return res.status(400).json({ error: 'Missing fields' })
    const cat = await Category.findById(category_id).lean()
    if (!cat) return res.status(400).json({ error: 'Invalid category' })
    const created = await Product.create({ name, price, category_id, image_url, stock: stock || 0, specifications, is_active: !!is_active })
    res.status(201).json({ id: created._id })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { name, price, category_id, image_url, stock, specifications, is_active } = req.body
    const update = {}
    if (name != null) update.name = name
    if (price != null) update.price = price
    if (image_url != null) update.image_url = image_url
    if (stock != null) update.stock = stock
    if (specifications != null) update.specifications = specifications
    if (is_active != null) update.is_active = !!is_active
    if (category_id) {
      const cat = await Category.findById(category_id).lean()
      if (!cat) return res.status(400).json({ error: 'Invalid category' })
      update.category_id = category_id
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true }).lean()
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json({ id: updated._id })
  } catch (error) {
    console.error('Update Product Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })

    if (product.image_url && product.image_url.includes('/uploads/')) {
      try {
        const filename = product.image_url.split('/uploads/')[1]
        if (filename) {
          const filePath = path.join(__dirname, 'uploads', filename)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log(`Deleted image file: ${filePath}`)
          }
        }
      } catch (err) {
        console.error('Error deleting image file:', err)
      }
    }

    await Product.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete Product Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

function verifyPassword(raw, hash) {
  const [salt, iterStr, derived] = String(hash).split(':')
  const iterations = parseInt(iterStr || '100000', 10)
  const keylen = 64
  const digest = 'sha512'
  const test = require('crypto').pbkdf2Sync(raw, salt, iterations, keylen, digest).toString('hex')
  return test === derived
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev_secret'
  return jwt.sign(payload, secret, { expiresIn: '12h' })
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
    const user = await User.findOne({ username }).lean()
    if (!user || user.role !== 'admin') return res.status(401).json({ error: 'Invalid credentials' })
    if (!verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ sub: user._id, role: 'admin', username: user.username })
    res.json({ token })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/transactions', auth, async (req, res) => {
  try {
    const txs = await Transaction.find({}).populate({ path: 'items.product_id', select: 'name price' }).lean()
    const data = txs.map((t) => ({
      id: t._id,
      invoice_number: t.invoice_number,
      user_roblox_username: t.user_roblox_username,
      email: t.email,
      items: t.items,
      total_transfer: t.total_transfer,
      payment_deadline: t.payment_deadline,
      status: t.status,
    }))
    res.json({ transactions: data })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/products', auth, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate({ path: 'category_id', select: 'name slug' })
      .lean()
    const data = products.map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      image_url: p.image_url || '',
      stock: p.stock || 0,
      specifications: p.specifications || {},
      category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
      is_active: p.is_active
    }))
    res.json({ products: data })
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.patch('/api/admin/transactions/:id', auth, async (req, res) => {
  try {
    const { status } = req.body
    if (!['Pending', 'Processing', 'Success', 'Failed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const transaction = await Transaction.findById(req.params.id).lean()
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' })

    if (status === 'Cancelled' && transaction.status !== 'Cancelled') {
      try {
        for (const item of transaction.items) {
          await Product.findByIdAndUpdate(
            item.product_id,
            { $inc: { stock: item.quantity } },
            { new: true }
          )
        }
      } catch (stockError) {
        console.error('Error restoring stock:', stockError)
        return res.status(500).json({ error: 'Failed to restore stock' })
      }
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean()

    res.json({ id: updated._id, status: updated.status })
  } catch (error) {
    console.error('Error updating transaction:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

