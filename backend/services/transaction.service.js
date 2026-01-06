const Transaction = require('../models/transaction.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const ipaymuService = require('./ipaymu.service');
const { sendPaymentEmail } = require('./email.service');

// Helper to generate Invoice Number (INV-YYYYMMDD-XXXX)
const generateInvoiceNumber = async (suffix = '') => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${dateStr}-${random}${suffix ? '-' + suffix : ''}`;
};

/**
 * Core business logic for creating a new order
 */
exports.createOrder = async ({ items, email, roblox_username }) => {
    if (!items || items.length === 0) {
        throw new Error('Cart is empty');
    }
    if (!email) {
        throw new Error('Email is required');
    }

    // 1. Fetch products and validate
    const productIds = items.map(item => item.id);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).populate('category_id');

    let totalAmount = 0;
    let requiresUsername = false;
    let allItems = [];

    // Group items by Seller ID
    const sellerGroups = {}; // { sellerId: [items...] }

    for (const item of items) {
        const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
        if (!dbProduct) throw new Error(`Product not found: ${item.name}`);

        if (dbProduct.stock < item.quantity) {
            throw new Error(`Insufficient stock for: ${dbProduct.name}`);
        }

        // Check username requirement
        const categoryName = dbProduct.category_id.name.toLowerCase();
        const productName = dbProduct.name.toLowerCase();
        const isAccount = categoryName.includes('account') || productName.includes('account');
        if (!isAccount) requiresUsername = true;

        const itemTotal = dbProduct.price * item.quantity;
        totalAmount += itemTotal;

        // Collect all items for iPaymu cart
        allItems.push({
            name: dbProduct.name,
            price: dbProduct.price,
            quantity: item.quantity,
        });

        const sellerId = dbProduct.seller_id.toString();
        if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];

        sellerGroups[sellerId].push({
            product_id: dbProduct._id,
            name: dbProduct.name,
            price: dbProduct.price,
            quantity: item.quantity,
            image_url: dbProduct.image_url,
            total: itemTotal
        });
    }

    if (requiresUsername && !roblox_username) {
        throw new Error('Roblox username is required for some items.');
    }

    // Decrement Stock atomically (Optimistic locking)
    for (const item of items) {
        const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
        if (dbProduct) {
            await Product.findByIdAndUpdate(
                dbProduct._id,
                { $inc: { stock: -item.quantity } }
            );
        }
    }

    // 2. Create iPaymu Redirect Payment
    const baseInvoice = await generateInvoiceNumber();
    let ipaymuResponse;

    try {
        ipaymuResponse = await ipaymuService.createRedirectPayment({
            items: allItems,
            amount: totalAmount,
            buyerName: roblox_username || 'Customer',
            buyerEmail: email,
            referenceId: baseInvoice,
        });
    } catch (ipaymuError) {
        // Rollback stock if payment creation fails
        for (const item of items) {
            const dbProduct = dbProducts.find(p => p._id.toString() === item.id);
            if (dbProduct) {
                await Product.findByIdAndUpdate(
                    dbProduct._id,
                    { $inc: { stock: item.quantity } }
                );
            }
        }
        console.error('iPaymu Error:', ipaymuError);
        throw new Error(`Failed to create payment: ${ipaymuError.message}`);
    }

    // 3. Create Transaction Records (Split by Seller)
    const createdTransactions = [];
    let index = 1;

    // Calculate payment deadline (24 hours from now)
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 24);

    for (const [sellerId, groupItems] of Object.entries(sellerGroups)) {
        // @ts-ignore
        const groupTotal = groupItems.reduce((sum, i) => sum + i.total, 0);
        const invoiceNumber = Object.keys(sellerGroups).length > 1
            ? `${baseInvoice}-${index++}`
            : baseInvoice;

        const newTransaction = new Transaction({
            invoice_number: invoiceNumber,
            seller_id: sellerId,
            // @ts-ignore
            items: groupItems.map(i => ({
                product_id: i.product_id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                image_url: i.image_url
            })),
            user_roblox_username: roblox_username || null,
            email,
            amount_original: groupTotal,
            total_transfer: groupTotal,
            // iPaymu fields
            ipaymu_transaction_id: ipaymuResponse.transactionId,
            ipaymu_session_id: ipaymuResponse.sessionId,
            payment_url: ipaymuResponse.paymentUrl,
            payment_deadline: paymentDeadline,
            status: 'Pending',
            payout_status: 'Unpaid'
        });

        await newTransaction.save();
        createdTransactions.push(newTransaction);
    }

    // 4. Send Email (Async)
    const firstTransaction = createdTransactions[0];
    if (firstTransaction && email) {
        sendPaymentEmail(email, {
            invoice_number: firstTransaction.invoice_number,
            total_transfer: totalAmount,
            payment_deadline: paymentDeadline,
            items: allItems,
            payment_url: ipaymuResponse.paymentUrl,
            user_roblox_username: roblox_username || null
        }).catch(err => console.error('Failed to send payment email:', err));
    }

    return {
        payment_url: ipaymuResponse.paymentUrl,
        transactions: createdTransactions
    };
};

/**
 * Handle update transaction status logic
 */
exports.updateTransactionStatus = async ({ transactionId, status, sellerId, role }) => {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    // Authorization
    if (role !== 'admin' && transaction.seller_id.toString() !== sellerId) {
        throw new Error('Unauthorized');
    }

    // Validate Status Flow
    // Pending -> Paid (System) -> Processing (Seller) -> Success (Seller)
    if (status === 'Processing' && transaction.status === 'Paid') {
        transaction.status = 'Processing';
    } else if (status === 'Success' && transaction.status === 'Processing') {
        transaction.status = 'Success';
    } else {
        throw new Error(`Invalid status transition from ${transaction.status} to ${status}`);
    }

    await transaction.save();
    return transaction;
};
