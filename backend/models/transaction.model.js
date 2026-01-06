const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema(
  {
    invoice_number: { type: String, required: true },

    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    user_roblox_username: { type: String, trim: true },
    email: { type: String, required: true, trim: true },

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
    total_transfer: { type: Number, required: true, min: 0 },

    // iPaymu Integration Fields
    ipaymu_transaction_id: { type: String },      // Transaction ID dari iPaymu
    ipaymu_session_id: { type: String },          // Session ID dari iPaymu
    payment_url: { type: String },                // URL pembayaran iPaymu
    payment_method: { type: String },             // e.g., 'va', 'qris', 'cstore'
    payment_channel: { type: String },            // e.g., 'bca', 'bni', 'mandiri', 'alfamart'
    paid_at: { type: Date },                      // Waktu pembayaran sukses

    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Processing', 'Success', 'Failed', 'Expired'],
      default: 'Pending'
    },

    payout_status: {
      type: String,
      enum: ['Unpaid', 'Paid'],
      default: 'Unpaid'
    },

    payout_paid_at: { type: Date }, // Time when admin marked as paid

    payment_deadline: { type: Date },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

TransactionSchema.index({ status: 1, seller_id: 1 })
TransactionSchema.index({ ipaymu_transaction_id: 1 })
TransactionSchema.index({ ipaymu_session_id: 1 })

module.exports = mongoose.model('Transaction', TransactionSchema)
