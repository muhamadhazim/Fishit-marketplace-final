const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction.model');
const Product = require('../models/product.model');
const auth = require('../middleware/auth');

const User = require('../models/user.model');

// GET /api/admin/users (Filter by role)
// GET /api/admin/users (Filter by role)
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { role } = req.query;
        const filter = {};
        if (role) filter.role = role;

        const users = await User.find(filter).select('-password_hash').lean();

        // If fetching sellers, also get their unpaid balance
        if (role === 'seller') {
            // Get unpaid totals per seller
            const unpaidTotals = await Transaction.aggregate([
                {
                    $match: {
                        status: 'Success',
                        payout_status: 'Unpaid'
                    }
                },
                {
                    $group: {
                        _id: '$seller_id',
                        unpaidBalance: { $sum: '$total_transfer' },
                        unpaidCount: { $sum: 1 }
                    }
                }
            ]);

            // Create a map for quick lookup
            const unpaidMap = {};
            unpaidTotals.forEach(item => {
                unpaidMap[item._id.toString()] = {
                    unpaidBalance: item.unpaidBalance,
                    unpaidCount: item.unpaidCount
                };
            });

            // Merge with user data
            const usersWithBalance = users.map(u => ({
                id: u._id,
                username: u.username,
                email: u.email,
                role: u.role,
                bank_details: u.bank_details || null,
                created_at: u.created_at,
                unpaid_balance: unpaidMap[u._id.toString()]?.unpaidBalance || 0,
                unpaid_count: unpaidMap[u._id.toString()]?.unpaidCount || 0
            }));

            return res.json({ users: usersWithBalance });
        }

        res.json({ users: users.map(u => ({
            id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            bank_details: u.bank_details || null,
            created_at: u.created_at
        })) });
    } catch (e) {
        console.error('Error fetching users:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/transactions
router.get('/transactions', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { seller_id } = req.query;
        const filter = {};
        if (seller_id) filter.seller_id = seller_id;

        const products = await Product.find(filter)
            .populate({ path: 'category_id', select: 'name slug' })
            .populate({ path: 'seller_id', select: 'username' })
            .lean();
        const data = products.map((p) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            image_url: p.image_url || '',
            stock: p.stock || 0,
            specifications: p.specifications || {},
            category: p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
            seller: p.seller_id ? { id: p.seller_id._id, username: p.seller_id.username } : null,
            is_active: p.is_active,
            is_banned: p.is_banned || false
        }));
        res.json({ products: data });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/admin/transactions/:id
router.patch('/transactions/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
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
