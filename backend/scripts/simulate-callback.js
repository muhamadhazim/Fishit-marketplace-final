/**
 * Script untuk simulate iPaymu callback secara lokal
 * 
 * Usage: node simulate-callback.js <transaction_id> [session_id]
 * Example: node simulate-callback.js 188160
 * Example with session: node simulate-callback.js 188160 d8403ba5-bae5-4bb9-b60d-92e9f043b6c2
 */

const http = require('http');

const transactionId = process.argv[2];
const sessionId = process.argv[3];

if (!transactionId) {
    console.log('Usage: node simulate-callback.js <transaction_id> [session_id]');
    console.log('Example: node simulate-callback.js 188160');
    console.log('Example with session: node simulate-callback.js 188160 abc-123-xyz');
    process.exit(1);
}

const data = JSON.stringify({
    trx_id: transactionId,
    sid: sessionId || transactionId,  // Use session ID if provided
    status: '1',           // 1 = Success
    status_code: '1',
    via: 'qris',
    channel: 'mpm',
    reference_id: 'TEST-' + Date.now()
});

console.log('Simulating iPaymu callback...');
console.log('Transaction ID:', transactionId);
if (sessionId) console.log('Session ID:', sessionId);
console.log('');

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/transactions/callback',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('✅ Callback sent!');
        console.log('Status Code:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', (e) => {
    console.error('❌ Error:', e.message);
    console.log('Make sure backend is running on localhost:4000');
});

req.write(data);
req.end();

req.on('error', (e) => {
    console.error('❌ Error:', e.message);
    console.log('Make sure backend is running on localhost:4000');
});

req.write(data);
req.end();
