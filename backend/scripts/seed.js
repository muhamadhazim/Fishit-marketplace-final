const { connect } = require('../db/mongoose')
const User = require('../models/user.model')
const Category = require('../models/category.model')
const Product = require('../models/product.model')
const crypto = require('crypto')

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const iterations = 100000
  const keylen = 64
  const digest = 'sha512'
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex')
  return `${salt}:${iterations}:${derived}`
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fishit_marketplace'
  await connect(uri)

  console.log('🌱 Seeding database...')

  // Create default admin user
  let admin = await User.findOne({ username: 'admin' })
  if (!admin) {
    const password_hash = hashPassword('admin')
    admin = await User.create({ username: 'admin', password_hash, role: 'admin' })
    console.log('✅ Admin user created (username: admin, password: admin)')
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // Create categories
  const categories = [
    { name: 'High-Tier Accounts', slug: 'high-tier-accounts' },
    { name: 'Secret Fish', slug: 'secret-fish' },
    { name: 'Coins (C$)', slug: 'coins-cs' },
  ]

  const categoryMap = {}
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      c,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    categoryMap[c.slug] = doc._id
    console.log(`✅ Category: ${c.name}`)
  }

  // Create sample products with proper image URLs
  const products = [
    {
      name: 'Starter Grinder Account',
      category_slug: 'high-tier-accounts',
      price: 50000,
      image_url: '/uploads/starter-account.png',
      stock: 10,
      specifications: {
        Rod: 'Ghostfinn Rod',
        Level: 50,
        Coins: '100k C$',
        Description: 'Perfect for beginners looking to advance quickly'
      },
      is_active: true,
    },
    {
      name: 'Secret Fish: The Kraken',
      category_slug: 'secret-fish',
      price: 150000,
      image_url: '/uploads/secret-fish.png',
      stock: 3,
      specifications: {
        Rarity: 'Secret',
        Location: 'Lost Isle',
        Weight: '20,000kg',
        Description: 'Extremely rare legendary creature'
      },
      is_active: true,
    },
    {
      name: '5 Million C$ Package',
      category_slug: 'coins-cs',
      price: 200000,
      image_url: '/uploads/coins-currency.png',
      stock: 999,
      specifications: {
        Amount: '5,000,000 C$',
        Method: 'Trade Hub Delivery',
        Delivery: 'Instant (max 5 minutes)'
      },
      is_active: true,
    },
  ]

  for (const p of products) {
    await Product.findOneAndUpdate(
      { name: p.name },
      { ...p, category_id: categoryMap[p.category_slug] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    console.log(`✅ Product: ${p.name}`)
  }

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Quick Start:')
  console.log('   Admin Login: username = admin, password = admin')
  console.log('   Frontend: http://localhost:3000')
  console.log('   Backend: http://localhost:4000')
  console.log('\n⚠️  Remember to change admin password in production!\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
