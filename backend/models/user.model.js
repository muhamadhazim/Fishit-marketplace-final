const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'seller', 'customer'], default: 'customer' },
    bank_details: {
      bank_name: { type: String, default: '' },
      account_number: { type: String, default: '' },
      account_holder: { type: String, default: '' }
    },
    // Email verification
    is_verified: { type: Boolean, default: false },
    verification_token: { type: String, default: null },
    verification_token_expires: { type: Date, default: null },
    verification_resend_count: { type: Number, default: 0 },
    verification_resend_reset: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
