const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    payout_no: { type: String, required: true, unique: true }, // PO-TIMESTAMP-RANDOM
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transaction_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    status: { type: String, enum: ['Paid'], default: 'Paid' },
    admin_note: { type: String },
    paid_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', PayoutSchema);
