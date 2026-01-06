const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const auth = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');

// Create transaction with iPaymu redirect payment (rate limited)
router.post('/', rateLimiters.transaction, transactionController.createTransaction);

// iPaymu callback/notification webhook (no auth - called by iPaymu)
router.post('/callback', transactionController.handleCallback);

// Get available payment methods
router.get('/payment-methods', transactionController.getPaymentMethods);

// Check payment status
router.get('/check/:transactionId', transactionController.checkPaymentStatus);

// Search transactions (rate limited)
router.post('/search', rateLimiters.search, transactionController.searchTransactions);

// Public check order (for customers to check their order status without login)
router.post('/check-order', rateLimiters.search, transactionController.checkOrder);

// Protected routes (require authentication)
router.put('/status', auth, transactionController.updateTransactionStatus);
router.get('/my-orders', auth, transactionController.getMyOrders);
router.get('/analytics', auth, transactionController.getAnalytics);

module.exports = router;

