const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Transaction = require('../models/transaction.model');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');

// GET /api/products/top-selling - Get top selling products based on transactions
router.get('/top-selling', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Aggregate from transactions to find top selling products
        const topSelling = await Transaction.aggregate([
            { $match: { status: 'paid' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product_id',
                    totalSold: { $sum: '$items.quantity' },
                    productName: { $first: '$items.name' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);

        // Get product IDs that have sales
        const productIds = topSelling.map(item => item._id).filter(id => id);

        // Fetch full product details
        const products = await Product.find({
            _id: { $in: productIds },
            is_active: true,
            is_banned: { $ne: true }
        })
            .populate({ path: 'category_id', select: 'name slug' })
            .populate({ path: 'seller_id', select: 'username' })
            .lean();

        // Create a map for easy lookup
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p;
        });

        // Build result with sales data, maintaining order by totalSold
        const result = topSelling
            .filter(item => item._id && productMap[item._id.toString()])
            .map(item => {
                const p = productMap[item._id.toString()];
                return {
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    image_url: p.image_url || '',
                    stock: p.stock || 0,
                    specifications: p.specifications || {},
                    category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
                    seller: p.seller_id ? { username: p.seller_id.username, id: p.seller_id._id } : null,
                    totalSold: item.totalSold
                };
            });

        // If we don't have enough top-selling products, fill with random active products
        if (result.length < limit) {
            const existingIds = result.map(p => p.id.toString());
            const additionalProducts = await Product.find({
                _id: { $nin: existingIds.map(id => new mongoose.Types.ObjectId(id)) },
                is_active: true,
                is_banned: { $ne: true }
            })
                .populate({ path: 'category_id', select: 'name slug' })
                .populate({ path: 'seller_id', select: 'username' })
                .limit(limit - result.length)
                .lean();

            additionalProducts.forEach(p => {
                result.push({
                    id: p._id,
                    name: p.name,
                    price: p.price,
                    image_url: p.image_url || '',
                    stock: p.stock || 0,
                    specifications: p.specifications || {},
                    category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
                    seller: p.seller_id ? { username: p.seller_id.username, id: p.seller_id._id } : null,
                    totalSold: 0
                });
            });
        }

        res.json({ products: result });
    } catch (e) {
        console.error('Top Selling Error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products
router.get('/', async (req, res) => {
    try {
        let filter = { is_active: true };

        // Support filtering by seller (e.g. for Seller Dashboard / Storefront)
        if (req.query.seller_id) {
            filter.seller_id = req.query.seller_id;
        }

        const products = await Product.find(filter)
            .populate({ path: 'category_id', select: 'name slug' })
            .populate({ path: 'seller_id', select: 'username email' }) // Show seller info
            .lean();
        const data = products.map((p) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            image_url: p.image_url || '',
            stock: p.stock || 0,
            specifications: p.specifications || {},
            category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
            seller: p.seller_id ? { username: p.seller_id.username, id: p.seller_id._id } : null
        }));
        res.json({ products: data });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/products/validate-cart - Validate cart items and get fresh product data
router.post('/validate-cart', rateLimiters.strict, async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'Product IDs required' });
        }

        // Filter valid ObjectIds
        const validIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        const products = await Product.find({ _id: { $in: validIds } })
            .populate({ path: 'category_id', select: 'name slug' })
            .lean();

        const data = products.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            price: p.price,
            stock: p.stock || 0,
            is_active: p.is_active,
            category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null
        }));

        res.json({ products: data });
    } catch (e) {
        console.error('Validate Cart Error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products/my-products
router.get('/my-products', auth, async (req, res) => {
    try {
        const sellerId = req.user.id;
        const products = await Product.find({ seller_id: sellerId })
            .populate({ path: 'category_id', select: 'name slug' })
            .lean();

        const data = products.map((p) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            image_url: p.image_url || '',
            stock: p.stock || 0,
            specifications: p.specifications || {},
            category: p.category_id ? { name: p.category_id.name, id: p.category_id._id, slug: p.category_id.slug } : null,
            seller_id: p.seller_id,
            is_active: p.is_active,
            is_banned: p.is_banned || false
        }));

        res.json({ products: data });
    } catch (e) {
        console.error("Get My Products Error:", e);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products/:id - Get single product details
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(req.params.id)
            .populate({ path: 'category_id', select: 'name slug' })
            .populate({ path: 'seller_id', select: 'username' })
            .lean();

        if (!product || !product.is_active) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const data = {
            id: product._id,
            name: product.name,
            price: product.price,
            image_url: product.image_url || '',
            stock: product.stock || 0,
            specifications: product.specifications || {},
            category: product.category_id ? { name: product.category_id.name, slug: product.category_id.slug } : null,
            seller: product.seller_id ? { username: product.seller_id.username, id: product.seller_id._id } : null
        };

        res.json(data);
    } catch (e) {
        console.error('Get Single Product Error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/products (Protected)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: 'Admins cannot create products. Only monitoring allowed.' });
        }
        const { name, price, category_id, image_url, stock, specifications, is_active } = req.body;
        console.log("Create Product Body:", req.body); // Debug log

        if (!name || price == null || !category_id || !specifications) return res.status(400).json({ error: 'Missing fields' });

        const cat = await Category.findById(category_id).lean();
        if (!cat) return res.status(400).json({ error: 'Invalid category' });

        const created = await Product.create({
            name,
            price,
            category_id,
            image_url,
            stock: stock || 0,
            specifications,
            is_active: !!is_active,
            seller_id: req.user.id // Assign to Creator
        });
        res.status(201).json({ id: created._id });
    } catch (err) {
        console.error("Create Product Error:", err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// PUT /api/products/:id (Protected)
router.put('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });

        // Admin Logic: Can only update is_banned
        if (req.user.role === 'admin') {
            let is_banned = req.body.is_banned;

            // Fallback to query param if body is empty (debugging fix)
            if (is_banned === undefined && req.query.is_banned !== undefined) {
                is_banned = req.query.is_banned === 'true';
            }

            if (is_banned !== undefined) {
                product.is_banned = is_banned;
                if (is_banned) product.is_active = false; // Force deactivate
                await product.save();
                return res.json({ id: product._id, is_banned: product.is_banned });
            }
            return res.status(403).json({
                error: 'Admins can only change ban status.',
                debugBody: req.body,
                debugHeaders: req.headers
            });
        }

        // Seller Logic
        // Check Ownership
        const productSellerId = product.seller_id ? product.seller_id.toString() : null;
        if (productSellerId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to edit this product' });
        }

        // Check if Banned
        if (product.is_banned) {
            return res.status(403).json({ error: 'Product is suspended by admin. Cannot edit.' });
        }

        const { name, price, category_id, image_url, stock, specifications, is_active } = req.body;
        console.log("Update Product:", { id: req.params.id, body: req.body });

        const update = {};
        if (name != null) update.name = name;
        if (price != null) update.price = price;
        if (image_url != null) update.image_url = image_url;
        if (stock != null) update.stock = stock;
        if (specifications != null) update.specifications = specifications;
        if (is_active != null) update.is_active = !!is_active;
        if (category_id) {
            if (!mongoose.Types.ObjectId.isValid(category_id)) {
                return res.status(400).json({ error: 'Invalid category ID format' });
            }
            const cat = await Category.findById(category_id).lean();
            if (!cat) return res.status(400).json({ error: 'Invalid category' });
            update.category_id = category_id;
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
        res.json({ id: updated._id });
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// DELETE /api/products/:id (Protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: 'Admins cannot delete products. Only monitoring allowed.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });

        // Ownership Check
        if (product.seller_id?.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to delete this product' });
        }

        // Check if Banned
        if (product.is_banned) {
            return res.status(403).json({ error: 'Product is suspended by admin. Cannot delete.' });
        }

        // Delete image from Cloudinary if exists
        if (product.image_url && product.image_url.includes('cloudinary.com')) {
            try {
                const { deleteImage } = require('../services/cloudinary.service');
                await deleteImage(product.image_url);
                console.log(`Deleted Cloudinary image: ${product.image_url}`);
            } catch (err) {
                console.error('Error deleting Cloudinary image:', err);
                // Continue with product deletion even if image delete fails
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
