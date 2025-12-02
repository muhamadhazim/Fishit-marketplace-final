const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const auth = require('../middleware/auth');

router.post('/', transactionController.createTransaction);
// Analytics Route
router.get('/analytics', auth, transactionController.getAnalytics);

// Search transactions
router.post('/search', transactionController.searchTransactions);

module.exports = router;
