const Transaction = require('../models/transaction.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const ipaymuService = require('../services/ipaymu.service');
const { sendPaymentEmail } = require('../services/email.service');
const transactionService = require('../services/transaction.service');

/**
 * Get available payment methods from iPaymu
 */
exports.getPaymentMethods = async (req, res) => {
    try {
        const methods = await ipaymuService.getPaymentMethods();
        res.json(methods);
    } catch (error) {
        console.error('Get Payment Methods Error:', error);
        res.status(500).json({ message: 'Failed to get payment methods' });
    }
};

/**
 * Create transaction with iPaymu redirect payment
 * REFACTORED: Logic moved to transaction.service.js
 */
exports.createTransaction = async (req, res) => {
    try {
        const { items, email, roblox_username } = req.body;

        const result = await transactionService.createOrder({
            items,
            email,
            roblox_username
        });

        res.status(201).json({
            message: 'Transaction created successfully',
            payment_url: result.payment_url,
            transactions: result.transactions
        });

    } catch (error) {
        console.error('Create Transaction Error:', error);

        // Handle specific business errors with 400 Bad Request
        const badRequestErrors = [
            'Cart is empty',
            'Email is required',
            'Product not found',
            'Insufficient stock',
            'Roblox username is required'
        ];

        if (badRequestErrors.some(msg => error.message.includes(msg))) {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

/**
 * Handle callback/notification from iPaymu
 * This endpoint is called by iPaymu when payment status changes
 */
exports.handleCallback = async (req, res) => {
    try {
        console.log('iPaymu Callback received:', req.body);

        const callbackData = req.body;

        // Verify callback
        if (!ipaymuService.verifyCallback(callbackData)) {
            console.warn('Invalid iPaymu callback:', callbackData);
            return res.status(400).json({ message: 'Invalid callback' });
        }

        const { trx_id, sid, status, via, channel, reference_id } = callbackData;

        // Map iPaymu status to our status
        const newStatus = ipaymuService.mapPaymentStatus(status);

        // Find transactions by iPaymu transaction ID or session ID
        const searchCriteria = [];
        if (trx_id) {
            searchCriteria.push({ ipaymu_transaction_id: String(trx_id) });
        }
        if (sid) {
            searchCriteria.push({ ipaymu_session_id: String(sid) });
            // Also check if trx_id is stored in session_id field (some callbacks use different field names)
            searchCriteria.push({ ipaymu_transaction_id: String(sid) });
        }

        const transactions = await Transaction.find({
            $or: searchCriteria.length > 0 ? searchCriteria : [{ _id: null }]
        });

        if (transactions.length === 0) {
            console.warn('No transactions found for iPaymu trx_id:', trx_id, 'sid:', sid);
            // Still return 200 to avoid iPaymu retry
            return res.status(200).json({ message: 'Transaction not found' });
        }

        // Update all related transactions
        for (const transaction of transactions) {
            // Only update if current status allows
            if (transaction.status === 'Pending') {
                transaction.status = newStatus;
                transaction.payment_method = via || null;
                transaction.payment_channel = channel || null;

                // Save the transaction ID from iPaymu
                if (trx_id) {
                    transaction.ipaymu_transaction_id = String(trx_id);
                }

                if (newStatus === 'Paid') {
                    transaction.paid_at = new Date();
                }

                // Restore stock if payment failed or expired
                if (newStatus === 'Expired' || newStatus === 'Failed') {
                    console.log(`Restoring stock for ${transaction.invoice_number} (${newStatus})`);
                    for (const item of transaction.items) {
                        try {
                            await Product.findByIdAndUpdate(
                                item.product_id,
                                { $inc: { stock: item.quantity } }
                            );
                            console.log(`Restored ${item.quantity}x ${item.name} (Product ID: ${item.product_id})`);
                        } catch (stockError) {
                            console.error(`Failed to restore stock for product ${item.product_id}:`, stockError);
                        }
                    }
                }

                await transaction.save();
                console.log(`Transaction ${transaction.invoice_number} updated to ${newStatus}`);
            }
        }

        // Return 200 OK to confirm receipt
        res.status(200).json({ message: 'Callback processed successfully' });

    } catch (error) {
        console.error('Handle Callback Error:', error);
        // Still return 200 to avoid infinite retries
        res.status(200).json({ message: 'Callback processed with errors' });
    }
};

/**
 * Check payment status from iPaymu
 */
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // If we have iPaymu transaction ID, check with iPaymu
        if (transaction.ipaymu_transaction_id) {
            try {
                const ipaymuStatus = await ipaymuService.checkTransaction(transaction.ipaymu_transaction_id);

                // Update local status if needed
                if (ipaymuStatus.Data) {
                    const newStatus = ipaymuService.mapPaymentStatus(ipaymuStatus.Data.Status);
                    if (transaction.status === 'Pending' && newStatus !== 'Pending') {
                        transaction.status = newStatus;
                        transaction.payment_method = ipaymuStatus.Data.Via || null;
                        transaction.payment_channel = ipaymuStatus.Data.Channel || null;
                        if (newStatus === 'Paid') {
                            transaction.paid_at = new Date();
                        }
                        await transaction.save();
                    }
                }

                return res.json({
                    transaction,
                    ipaymu_status: ipaymuStatus
                });
            } catch (ipaymuError) {
                console.error('Error checking iPaymu status:', ipaymuError);
            }
        }

        res.json({ transaction });

    } catch (error) {
        console.error('Check Payment Status Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.searchTransactions = async (req, res) => {
    try {
        let { query } = req.body;
        if (!query) return res.status(400).json({ message: 'Search query is required' });
        query = query.trim();

        // Search by Invoice OR Email OR iPaymu Transaction ID
        const transactions = await Transaction.find({
            $or: [
                { invoice_number: { $regex: new RegExp(`^${query}$`, 'i') } },
                { email: { $regex: new RegExp(`^${query}$`, 'i') } },
                { ipaymu_transaction_id: query },
                { ipaymu_session_id: query }
            ]
        }).sort({ created_at: -1 });

        if (transactions.length === 0) return res.status(404).json({ message: 'No transactions found' });

        res.status(200).json({ transactions });
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Public check order - for customers to check their order status
 * No authentication required, but requires email + invoice number
 */
exports.checkOrder = async (req, res) => {
    try {
        const { email, invoice_number } = req.body;

        if (!email && !invoice_number) {
            return res.status(400).json({ message: 'Email atau nomor invoice diperlukan' });
        }

        // Build search criteria
        const searchCriteria = [];

        if (invoice_number) {
            searchCriteria.push({ invoice_number: { $regex: new RegExp(`^${invoice_number.trim()}$`, 'i') } });
        }

        if (email) {
            searchCriteria.push({ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
        }

        // If both provided, require both to match for security
        let transactions;
        if (email && invoice_number) {
            transactions = await Transaction.find({
                invoice_number: { $regex: new RegExp(`^${invoice_number.trim()}$`, 'i') },
                email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
            }).sort({ created_at: -1 }).select('-__v');
        } else {
            // If only one provided, search by that
            transactions = await Transaction.find({
                $or: searchCriteria
            }).sort({ created_at: -1 }).select('-__v');
        }

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan. Pastikan email atau nomor invoice sudah benar.' });
        }

        // Return sanitized transaction data (hide sensitive fields)
        const sanitizedTransactions = transactions.map(t => ({
            invoice_number: t.invoice_number,
            items: t.items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image_url: item.image_url
            })),
            total_transfer: t.total_transfer,
            status: t.status,
            payment_url: t.status === 'Pending' ? t.payment_url : null,
            payment_deadline: t.payment_deadline,
            payment_method: t.payment_method,
            payment_channel: t.payment_channel,
            paid_at: t.paid_at,
            created_at: t.created_at,
            user_roblox_username: t.user_roblox_username
        }));

        res.status(200).json({ transactions: sanitizedTransactions });

    } catch (error) {
        console.error('Check Order Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan. Silakan coba lagi.' });
    }
};

// Seller Actions
exports.updateTransactionStatus = async (req, res) => {
    try {
        const { transactionId, status } = req.body;
        const sellerId = req.user.id; // From Auth Middleware
        const role = req.user.role;

        const transaction = await transactionService.updateTransactionStatus({
            transactionId,
            status,
            sellerId,
            role
        });

        res.json({ message: 'Status updated', transaction });

    } catch (error) {
        console.error('Update Status Error:', error);

        if (error.message === 'Transaction not found') return res.status(404).json({ message: error.message });
        if (error.message === 'Unauthorized') return res.status(403).json({ message: error.message });
        if (error.message.includes('Invalid status')) return res.status(400).json({ message: error.message });

        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.getMyOrders = async (req, res) => {
    try {
        const { status, seller_id } = req.query; // 'paid', 'processing', 'history'
        let targetSellerId = req.user.id;

        // Admin Override: Allow viewing specific seller's orders
        if (req.user.role === 'admin' && seller_id) {
            targetSellerId = seller_id;
        }

        let filter = { seller_id: targetSellerId };

        if (status === 'paid') {
            filter.status = { $in: ['Paid', 'Pending'] };
        } else if (status === 'processing') {
            filter.status = 'Processing';
        } else if (status === 'history') {
            filter.status = { $in: ['Success', 'Failed', 'Cancelled', 'Expired'] };
        }

        const transactions = await Transaction.find(filter).sort({ created_at: -1 });
        res.json({ transactions });
    } catch (error) {
        console.error('Get My Orders Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, seller_id } = req.query;
        console.log("Analytics Request:", { startDate, endDate, user: req.user ? req.user.username : 'guest', querySeller: seller_id });

        let userId = req.user ? req.user.id : null;
        let userRole = req.user ? req.user.role : 'public';

        // Admin Override
        if (userRole === 'admin' && seller_id) {
            userId = seller_id;
            userRole = 'seller'; // Pretend to be seller for filtering logic below
        }

        // Build Match Filter
        const matchFilter = { status: 'Success' };

        if (startDate && endDate) {
            matchFilter.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Role Filter (Admin sees all unless masquerading as seller above)
        if (userRole === 'seller') {
            matchFilter.seller_id = new mongoose.Types.ObjectId(userId);
        }

        // 1. Total Revenue & Total Orders
        const totalStats = await Transaction.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total_transfer' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        // 2. Success Rate (Need valid match for total too)
        const totalMatch = { ...matchFilter };
        delete totalMatch.status; // All statuses
        if (userRole === 'seller') {
            totalMatch.seller_id = new mongoose.Types.ObjectId(userId);
        }

        const totalTransactions = await Transaction.countDocuments(totalMatch);
        const successTransactions = totalStats.length > 0 ? totalStats[0].totalOrders : 0;
        const successRate = totalTransactions > 0
            ? Math.round((successTransactions / totalTransactions) * 100)
            : 0;

        // 3. Revenue Trend
        const revenueTrend = await Transaction.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                    revenue: { $sum: '$total_transfer' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Top Products (unwind items and aggregate)
        const topProducts = await Transaction.aggregate([
            { $match: matchFilter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    sales: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    sales: 1,
                    revenue: 1
                }
            }
        ]);

        res.json({
            totalRevenue: totalStats.length > 0 ? totalStats[0].totalRevenue : 0,
            totalOrders: successTransactions,
            successRate,
            revenueTrend: revenueTrend.map(r => ({ date: r._id, revenue: r.revenue })),
            topProducts
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
