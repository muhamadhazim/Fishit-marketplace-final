const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const config = require('../config');

function verifyPassword(raw, hash) {
    const [salt, iterStr, derived] = String(hash).split(':');
    const iterations = parseInt(iterStr || '100000', 10);
    const keylen = 64;
    const digest = 'sha512';
    const test = crypto.pbkdf2Sync(raw, salt, iterations, keylen, digest).toString('hex');
    return test === derived;
}

function signToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
        const user = await User.findOne({ username }).lean();
        if (!user || user.role !== 'admin') return res.status(401).json({ error: 'Invalid credentials' });
        if (!verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
        const token = signToken({ sub: user._id, role: 'admin', username: user.username });
        res.json({ token });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
