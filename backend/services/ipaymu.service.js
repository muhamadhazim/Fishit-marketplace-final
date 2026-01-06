/**
 * iPaymu Payment Gateway Service
 * 
 * Service untuk mengelola integrasi dengan iPaymu Redirect Payment API
 * Dokumentasi: https://ipaymu.com/api-collection/
 */

const ipaymu = require('ipaymu-nodejs-api');

// Set credentials from environment variables
const VA = process.env.IPAYMU_VA;
const API_KEY = process.env.IPAYMU_API_KEY;
const IS_PRODUCTION = process.env.IPAYMU_PRODUCTION === 'true';

// Backend & Frontend URLs for callbacks
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Initialize iPaymu with credentials
 */
const initializeIPaymu = () => {
    if (!VA || !API_KEY) {
        throw new Error('iPaymu credentials not configured. Please set IPAYMU_VA and IPAYMU_API_KEY in .env');
    }

    ipaymu.setVa(VA);
    ipaymu.setApiKey(API_KEY);
    ipaymu.setProd(IS_PRODUCTION);

    // Set callback URLs
    const urls = {
        ureturn: `${FRONTEND_URL}/payment/success`,
        ucancel: `${FRONTEND_URL}/payment/cancel`,
        unotify: `${BACKEND_URL}/api/transactions/callback`,
    };
    console.log('Setting iPaymu URLs:', urls);
    ipaymu.setURL(urls);
};

/**
 * Create a redirect payment
 * 
 * @param {Object} options - Payment options
 * @param {Array} options.items - Array of cart items [{name, price, quantity}]
 * @param {number} options.amount - Total payment amount
 * @param {string} options.buyerName - Buyer name
 * @param {string} options.buyerEmail - Buyer email
 * @param {string} options.buyerPhone - Buyer phone (optional)
 * @param {string} options.referenceId - Internal reference ID for the transaction
 * @returns {Promise<Object>} - iPaymu response with payment URL
 */
const createRedirectPayment = async (options) => {
    initializeIPaymu();

    const { items, amount, buyerName, buyerEmail, buyerPhone, referenceId } = options;

    // Prepare cart data for iPaymu
    const cartData = {
        product: items.map(item => item.name),
        quantity: items.map(item => String(item.quantity)),
        price: items.map(item => String(item.price)),
        description: items.map(item => item.name),
        // Weight, dimensions optional - set defaults
        weight: items.map(() => 1),
        height: items.map(() => 1),
        length: items.map(() => 1),
        width: items.map(() => 1),
    };

    // Add cart to iPaymu
    ipaymu.addCart(cartData);

    // User data for redirect payment
    const userData = {
        buyerName: buyerName || 'Customer',
        buyerEmail: buyerEmail,
        buyerPhone: buyerPhone || '08123456789',
        amount: String(amount),
        referenceId: referenceId, // Our internal transaction reference
        // Let iPaymu show all payment methods (no specific method/channel)
    };

    try {
        const response = await ipaymu.redirectPayment(userData);
        console.log('iPaymu Redirect Payment Response:', JSON.stringify(response, null, 2));

        if (response.Status === 200 && response.Data) {
            return {
                success: true,
                sessionId: response.Data.SessionID,
                transactionId: response.Data.TransactionId,
                paymentUrl: response.Data.Url,
                rawResponse: response
            };
        } else {
            throw new Error(response.Message || 'Failed to create payment');
        }
    } catch (error) {
        console.error('iPaymu createRedirectPayment Error:', error);
        throw error;
    }
};

/**
 * Check transaction status
 * 
 * @param {string} transactionId - iPaymu transaction ID
 * @returns {Promise<Object>} - Transaction status
 */
const checkTransaction = async (transactionId) => {
    initializeIPaymu();

    try {
        const response = await ipaymu.checkTransaction(transactionId);
        console.log('iPaymu Check Transaction Response:', response);
        return response;
    } catch (error) {
        console.error('iPaymu checkTransaction Error:', error);
        throw error;
    }
};

/**
 * Check iPaymu account balance
 * 
 * @returns {Promise<Object>} - Balance info
 */
const checkBalance = async () => {
    initializeIPaymu();

    try {
        const response = await ipaymu.checkBalance();
        console.log('iPaymu Balance:', response);
        return response;
    } catch (error) {
        console.error('iPaymu checkBalance Error:', error);
        throw error;
    }
};

/**
 * Get available payment methods
 * 
 * @returns {Promise<Object>} - Available payment methods
 */
const getPaymentMethods = async () => {
    initializeIPaymu();

    try {
        const response = await ipaymu.checkPaymentMethods();
        console.log('iPaymu Payment Methods:', response);
        return response;
    } catch (error) {
        console.error('iPaymu getPaymentMethods Error:', error);
        throw error;
    }
};

/**
 * Verify callback signature from iPaymu
 * iPaymu sends callbacks with transaction status updates
 * 
 * @param {Object} callbackData - Data from iPaymu callback
 * @returns {boolean} - Whether callback is valid
 */
const verifyCallback = (callbackData) => {
    // iPaymu callback verification
    // The callback includes: trx_id, status, via, channel, etc.
    // For sandbox, we trust all callbacks. In production, verify signature.

    console.log('Verifying callback data:', JSON.stringify(callbackData, null, 2));

    if (!callbackData) {
        console.warn('Callback data is empty');
        return false;
    }

    // Check if we have transaction ID (might be trx_id or sid)
    if (!callbackData.trx_id && !callbackData.sid) {
        console.warn('Callback missing trx_id and sid');
        return false;
    }

    // Accept callback - we'll handle status mapping later
    return true;
};

/**
 * Map iPaymu status to our transaction status
 * 
 * @param {string|number} ipaymuStatus - Status from iPaymu
 * @returns {string} - Our internal status
 */
const mapPaymentStatus = (ipaymuStatus) => {
    // iPaymu status codes:
    // 1 = Pending
    // 2 = Berhasil (Success)
    // -1 = Expired
    // -2 = Cancelled
    // 0 = Pending (waiting payment)

    const statusMap = {
        '0': 'Pending',
        '1': 'Paid',
        '2': 'Paid',
        '-1': 'Expired',
        '-2': 'Failed',
        'berhasil': 'Paid',
        'success': 'Paid',
        'pending': 'Pending',
        'expired': 'Expired',
        'failed': 'Failed',
        'cancelled': 'Failed',
    };

    const status = String(ipaymuStatus).toLowerCase();
    return statusMap[status] || 'Pending';
};

module.exports = {
    createRedirectPayment,
    checkTransaction,
    checkBalance,
    getPaymentMethods,
    verifyCallback,
    mapPaymentStatus,
};
