const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema(
  {
    invoice_number: { type: String, required: true, unique: true },
    user_roblox_username: { type: String, trim: true }, // Optional now
    email: { type: String, required: true, trim: true }, // New field
    items: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image_url: { type: String }
      }
    ],
    amount_original: { type: Number, required: true, min: 0 },
    unique_code: { type: Number, required: true, min: 100, max: 999 },
    total_transfer: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Pending', 'Processing', 'Success', 'Failed'], default: 'Pending' },
    payment_deadline: { type: Date, required: true }, // New field
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

TransactionSchema.index({ status: 1, total_transfer: 1 })

module.exports = mongoose.model('Transaction', TransactionSchema)
