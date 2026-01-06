const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const ProductSchema = new mongoose.Schema({
    name: String,
    category_id: mongoose.Schema.Types.ObjectId,
    seller_id: mongoose.Schema.Types.ObjectId,
    price: Number,
    stock: Number,
    specifications: mongoose.Schema.Types.Mixed,
    is_active: Boolean
});
const Product = mongoose.model('Product', ProductSchema, 'products');

const CategorySchema = new mongoose.Schema({ name: String });
const Category = mongoose.model('Category', CategorySchema, 'categories');

async function debugUpdate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fishit_marketplace');
        console.log("Connected to MongoDB");

        const productId = '6936d679972acb7b012a68cc';
        const updateData = {
            name: 'ikan secre',
            price: 10000,
            stock: 10,
            category_id: '6925d13ef45385b0e25138e8',
            is_active: true,
            specifications: { Ikan: 'Ikan' }
        };

        console.log("Attempting update for:", productId);

        // Check if product exists
        const p = await Product.findById(productId);
        if (!p) {
            console.log("Product not found!");
            return;
        }
        console.log("Found product:", p);

        // Check if category exists
        // Cast category_id to ObjectId?
        // Mongoose handles it, but let's check
        // const c = await Category.findById(updateData.category_id);
        // console.log("Found Category:", c);

        const updated = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        console.log("Updated Result:", updated);

    } catch (error) {
        console.error("Update Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugUpdate();
