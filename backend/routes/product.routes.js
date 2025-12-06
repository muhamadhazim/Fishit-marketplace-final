const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const auth = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({ is_active: true })
            .populate({ path: 'category_id', select: 'name slug' })
            .lean();
        const data = products.map((p) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            image_url: p.image_url || '',
            stock: p.stock || 0,
            specifications: p.specifications || {},
            category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
        }));
        res.json({ products: data });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const p = await Product.findById(req.params.id)
            .populate({ path: 'category_id', select: 'name slug' })
            .lean();
        if (!p) return res.status(404).json({ error: 'Not found' });
        res.json({
            id: p._id,
            name: p.name,
            price: p.price,
            image_url: p.image_url || '',
            stock: p.stock || 0,
            specifications: p.specifications || {},
            category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/products (Protected)
router.post('/', auth, async (req, res) => {
    try {
        const { name, price, category_id, image_url, stock, specifications, is_active } = req.body;
        if (!name || price == null || !category_id || !specifications) return res.status(400).json({ error: 'Missing fields' });
        const cat = await Category.findById(category_id).lean();
        if (!cat) return res.status(400).json({ error: 'Invalid category' });
        const created = await Product.create({ name, price, category_id, image_url, stock: stock || 0, specifications, is_active: !!is_active });
        res.status(201).json({ id: created._id });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/products/:id (Protected)
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, price, category_id, image_url, stock, specifications, is_active } = req.body;
        const update = {};
        if (name != null) update.name = name;
        if (price != null) update.price = price;
        if (image_url != null) update.image_url = image_url;
        if (stock != null) update.stock = stock;
        if (specifications != null) update.specifications = specifications;
        if (is_active != null) update.is_active = !!is_active;
        if (category_id) {
            const cat = await Category.findById(category_id).lean();
            if (!cat) return res.status(400).json({ error: 'Invalid category' });
            update.category_id = category_id;
        }
        const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json({ id: updated._id });
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/products/:id (Protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });

        if (product.image_url && product.image_url.includes('/uploads/')) {
            try {
                const filename = product.image_url.split('/uploads/')[1];
                if (filename) {
                    // Assuming uploads are in ../uploads relative to this file? No, relative to root usually.
                    // In server.js it was path.join(__dirname, 'uploads'). 
                    // Here __dirname is backend/routes. So we need to go up one level.
                    const filePath = path.join(__dirname, '..', 'uploads', filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted image file: ${filePath}`);
                    }
                }
            } catch (err) {
                console.error('Error deleting image file:', err);
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
