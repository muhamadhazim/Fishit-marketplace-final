const Transaction = require('../models/transaction.model');
const Product = require('../models/product.model');
const { sendInvoiceEmail } = require('../services/email.service');

// Helper to generate Invoice Number (INV-YYYYMMDD-XXXX)
const generateInvoiceNumber = async () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${dateStr}-${random}`;
};

const generateUniqueCode = () => {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
};

exports.createTransaction = async (req, res) => {
    try {
        const { items, email, roblox_username } = req.body;

        if (!items || items.length === 0) {

            return res.status(400).json({ message: 'Cart is empty' });
        }

        if (!email) {

            return res.status(400).json({ message: 'Email is required' });
        }

        // Fetch products to validate prices and categories
        const productIds = items.map(item => item.id);
        const dbProducts = await Product.find({ _id: { $in: productIds } }).populate('category_id');

        let totalAmount = 0;
        let requiresUsername = false;
        const transactionItems = [];

        for (const item of items) {
            const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
            if (!dbProduct) {

                return res.status(404).json({ message: `Product not found: ${item.name}` });
            }

            // Check Stock
            if (dbProduct.stock < item.quantity) {

                return res.status(400).json({ message: `Insufficient stock for: ${dbProduct.name}` });
            }

            // Check if username is required (Secret Fish or Coin)
            // "Account" does NOT require username (check category OR name)
            const categoryName = dbProduct.category_id.name.toLowerCase();
            const productName = dbProduct.name.toLowerCase();

            const isAccount = categoryName.includes('account') || productName.includes('account');

            if (!isAccount) {
                requiresUsername = true;
            }

            totalAmount += dbProduct.price * item.quantity;
            transactionItems.push({
                product_id: dbProduct._id,
                name: dbProduct.name,
                price: dbProduct.price,
                quantity: item.quantity,
                image_url: dbProduct.image_url
            });

            // Decrement Stock
            dbProduct.stock -= item.quantity;
            await dbProduct.save();
        }

        if (requiresUsername && !roblox_username) {

            return res.status(400).json({ message: 'Roblox username is required for some items in your cart.' });
        }

        const uniqueCode = generateUniqueCode();
        const totalTransfer = totalAmount + uniqueCode;
        const invoiceNumber = await generateInvoiceNumber();

        // Set deadline to 2 hours from now
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 2);

        const newTransaction = new Transaction({
            invoice_number: invoiceNumber,
            user_roblox_username: roblox_username || null,
            email,
            items: transactionItems,
            amount_original: totalAmount,
            unique_code: uniqueCode,
            total_transfer: totalTransfer,
            payment_deadline: deadline,
            status: 'Pending'
        });

        await newTransaction.save();

        // Send Email in Background (non-blocking)
        sendInvoiceEmail(email, newTransaction).catch(err => {
            console.error('Email sending failed (background):', err.message);
            // Email failure doesn't affect transaction success
        });

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: {
                invoice_number: invoiceNumber,
                total_transfer: totalTransfer,
                unique_code: uniqueCode,
                payment_deadline: deadline,
                status: 'Pending'
            }
        });

    } catch (error) {
        console.error('Create Transaction Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.searchTransactions = async (req, res) => {
    try {
        let { query } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        query = query.trim();
        let transactions = [];

        // Check if query looks like an invoice number (starts with INV-)
        if (query.toUpperCase().startsWith('INV-')) {
            // Case-insensitive search for invoice number
            const transaction = await Transaction.findOne({
                invoice_number: { $regex: new RegExp(`^${query}$`, 'i') }
            });
            if (transaction) {
                transactions.push(transaction);
            }
        } else {
            // Assume it's an email - Case-insensitive search
            transactions = await Transaction.find({
                email: { $regex: new RegExp(`^${query}$`, 'i') }
            }).sort({ created_at: -1 });
        }

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found' });
        }

        res.status(200).json({ transactions });

    } catch (error) {
        console.error('Search Transaction Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
    try {
        // 1. Total Revenue & Total Orders (Success only)
        const totalStats = await Transaction.aggregate([
            { $match: { status: 'Success' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total_transfer' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        // 2. Success Rate
        const totalTransactions = await Transaction.countDocuments();
        const successTransactions = totalStats.length > 0 ? totalStats[0].totalOrders : 0;
        const successRate = totalTransactions > 0
            ? Math.round((successTransactions / totalTransactions) * 100)
            : 0;

        // 3. Revenue Trend (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const revenueTrend = await Transaction.aggregate([
            {
                $match: {
                    status: 'Success',
                    created_at: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                    revenue: { $sum: '$total_transfer' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Top Products (by sales count)
        const topProducts = await Transaction.aggregate([

            { $match: { status: 'Success' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    sales: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalRevenue: totalStats.length > 0 ? totalStats[0].totalRevenue : 0,
            totalOrders: successTransactions,
            successRate,
            revenueTrend: revenueTrend.map(r => ({ date: r._id, revenue: r.revenue })),
            topProducts: topProducts.map(p => ({ name: p._id, sales: p.sales, revenue: p.revenue }))
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
