const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payout.controller');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

router.get('/summary', auth, verifyAdmin, payoutController.getPayoutSummary);
router.post('/mark-paid', auth, verifyAdmin, payoutController.markAsPaid);
router.get('/history', auth, verifyAdmin, payoutController.getPayoutHistory);

// Seller Routes
router.get('/my-payouts', auth, payoutController.getMyPayouts);

module.exports = router;
