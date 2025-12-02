const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    image_url: { type: String },
    stock: { type: Number, required: true, default: 0, min: 0 },
    specifications: { type: mongoose.Schema.Types.Mixed, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

ProductSchema.index({ name: 1, category_id: 1 })

module.exports = mongoose.model('Product', ProductSchema)
