const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction.model');
const Product = require('../models/product.model');
const auth = require('../middleware/auth');

// GET /api/admin/transactions
router.get('/transactions', auth, async (req, res) => {
    try {
        const txs = await Transaction.find({}).populate({ path: 'items.product_id', select: 'name price' }).lean();
        const data = txs.map((t) => ({
            id: t._id,
            invoice_number: t.invoice_number,
            user_roblox_username: t.user_roblox_username,
            email: t.email,
            items: t.items,
            total_transfer: t.total_transfer,
            payment_deadline: t.payment_deadline,
            status: t.status,
        }));
        res.json({ transactions: data });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/products
router.get('/products', auth, async (req, res) => {
    try {
        const products = await Product.find({})
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
            is_active: p.is_active
        }));
        res.json({ products: data });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/admin/transactions/:id
router.patch('/transactions/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Processing', 'Success', 'Failed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const transaction = await Transaction.findById(req.params.id).lean();
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        if (status === 'Cancelled' && transaction.status !== 'Cancelled') {
            try {
                for (const item of transaction.items) {
                    await Product.findByIdAndUpdate(
                        item.product_id,
                        { $inc: { stock: item.quantity } },
                        { new: true }
                    );
                }
            } catch (stockError) {
                console.error('Error restoring stock:', stockError);
                return res.status(500).json({ error: 'Failed to restore stock' });
            }
        }

        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).lean();

        res.json({ id: updated._id, status: updated.status });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
