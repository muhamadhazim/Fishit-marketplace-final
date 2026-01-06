const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const TransactionSchema = new mongoose.Schema({
    created_at: Date,
    total_transfer: Number,
    seller_id: mongoose.Schema.Types.ObjectId,
    status: String
});
const Transaction = mongoose.model('Transaction', TransactionSchema, 'transactions');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fishit_marketplace');
        console.log("Connected to MongoDB");

        const count = await Transaction.countDocuments();
        console.log(`Total Transactions: ${count}`);

        const transactions = await Transaction.find({}, { created_at: 1, total_transfer: 1, status: 1 }).sort({ created_at: -1 }).limit(10);
        console.log("Latest 10 Transactions:");
        transactions.forEach(t => {
            console.log(`ID: ${t._id}, Date: ${t.created_at}, Amount: ${t.total_transfer}, Status: ${t.status}`);
        });

        const stats = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    minDate: { $min: "$created_at" },
                    maxDate: { $max: "$created_at" },
                    totalRevenue: { $sum: "$total_transfer" }
                }
            }
        ]);
        console.log("Stats:", stats);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
