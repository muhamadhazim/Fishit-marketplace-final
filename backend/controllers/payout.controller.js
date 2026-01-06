const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const Payout = require('../models/payout.model');

// ADMIN ONLY: Get Summary of Unpaid Success Transactions grouped by Seller
exports.getPayoutSummary = async (req, res) => {
    try {
        const payoutList = await Transaction.aggregate([
            {
                $match: {
                    status: 'Success',
                    payout_status: 'Unpaid'
                }
            },
            {
                $group: {
                    _id: '$seller_id',
                    totalAmount: { $sum: '$total_transfer' },
                    transactionIds: { $push: '$_id' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $unwind: '$sellerInfo' },
            {
                $project: {
                    sellerId: '$_id',
                    sellerName: '$sellerInfo.username',
                    bankDetails: '$sellerInfo.bank_details',
                    totalAmount: 1,
                    count: 1,
                    transactionIds: 1
                }
            }
        ]);

        res.json({ payoutList });

    } catch (error) {
        console.error('Payout Summary Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN ONLY: Create Payout Batch (Mark as Paid)
exports.markAsPaid = async (req, res) => {
    try {
        const { sellerId } = req.body;

        if (!sellerId) {
            return res.status(400).json({ message: 'Seller ID is required' });
        }

        // 1. Find all eligible transactions
        const transactions = await Transaction.find({
            seller_id: sellerId,
            status: 'Success',
            payout_status: 'Unpaid'
        });

        if (transactions.length === 0) {
            return res.status(400).json({ message: 'No unpaid transactions found for this seller' });
        }

        // 2. Calculate total amount
        const totalAmount = transactions.reduce((sum, t) => sum + t.total_transfer, 0);
        const transactionIds = transactions.map(t => t._id);

        // 3. Create Payout Record
        const payoutNo = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const payout = new Payout({
            payout_no: payoutNo,
            seller_id: sellerId,
            amount: totalAmount,
            transaction_ids: transactionIds,
            status: 'Paid',
            paid_at: new Date()
        });
        await payout.save();

        // 4. Update Transactions
        await Transaction.updateMany(
            { _id: { $in: transactionIds } },
            {
                $set: {
                    payout_status: 'Paid',
                    payout_paid_at: new Date()
                }
            }
        );

        res.json({
            message: 'Payout created successfully',
            payout
        });

    } catch (error) {
        console.error('Mark Paid Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Get Payout History
exports.getPayoutHistory = async (req, res) => {
    try {
        const history = await Payout.find()
            .populate('seller_id', 'username email bank_details')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ history });
    } catch (error) {
        console.error('Payout History Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// SELLER: Get My Payouts
exports.getMyPayouts = async (req, res) => {
    try {
        let sellerId = req.user.id;

        // Admin Override: Allow viewing specific seller's payouts
        if (req.user.role === 'admin' && req.query.seller_id) {
            sellerId = req.query.seller_id;
        }

        const payouts = await Payout.find({ seller_id: sellerId })
            .populate({
                path: 'transaction_ids',
                select: 'invoice_number items total_transfer created_at'
            })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ payouts });
    } catch (error) {
        console.error('My Payouts Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
