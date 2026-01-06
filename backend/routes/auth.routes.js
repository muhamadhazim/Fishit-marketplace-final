const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const config = require('../config');
const auth = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');
const { sendVerificationEmail } = require('../services/email.service');

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

// Helper to hash password
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha512';
    const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return `${salt}:${iterations}:${derived}`;
}

// Helper to generate verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Password validation: min 8 chars, must have letter, number, and symbol
function validatePassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Password minimal 8 karakter' };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, error: 'Password harus mengandung huruf' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password harus mengandung angka' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
        return { valid: false, error: 'Password harus mengandung simbol (!@#$%^&* dll)' };
    }
    return { valid: true };
}

// POST /api/auth/register
router.post('/register', rateLimiters.auth, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password strength
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({ error: passwordCheck.error });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ error: 'Username or Email already exists' });

        const password_hash = hashPassword(password);
        const verificationToken = generateVerificationToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = new User({
            username,
            email,
            password_hash,
            role: 'seller',
            is_verified: false,
            verification_token: verificationToken,
            verification_token_expires: tokenExpires
        });

        await newUser.save();

        // Send verification email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify/${verificationToken}`;

        const emailSent = await sendVerificationEmail(email, {
            username,
            verificationUrl
        });

        if (emailSent) {
            res.status(201).json({
                message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
                requiresVerification: true
            });
        } else {
            // Email failed but user created - they can request resend
            res.status(201).json({
                message: 'Registrasi berhasil! Email verifikasi gagal terkirim. Gunakan fitur kirim ulang.',
                requiresVerification: true
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', rateLimiters.auth, async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

        // Find user by username OR email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        }).lean();

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        if (!['admin', 'seller'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied: Customer cannot access portal' });
        }

        if (!verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });

        // Check email verification for sellers (admin bypass)
        if (user.role === 'seller' && !user.is_verified) {
            return res.status(403).json({
                error: 'Email belum diverifikasi. Silakan cek email Anda.',
                requiresVerification: true,
                email: user.email
            });
        }

        const token = signToken({ id: user._id, role: user.role, username: user.username });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                bank_details: user.bank_details
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Token tidak valid' });
        }

        const user = await User.findOne({
            verification_token: token,
            verification_token_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
        }

        if (user.is_verified) {
            return res.status(400).json({ error: 'Email sudah diverifikasi sebelumnya' });
        }

        // Mark as verified
        user.is_verified = true;
        user.verification_token = null;
        user.verification_token_expires = null;
        await user.save();

        res.json({
            message: 'Email berhasil diverifikasi! Silakan login.',
            verified: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', rateLimiters.auth, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email diperlukan' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'Jika email terdaftar, link verifikasi akan dikirim.' });
        }

        if (user.is_verified) {
            return res.status(400).json({ error: 'Email sudah diverifikasi' });
        }

        // Check resend limit (max 5 per day)
        const now = new Date();
        if (user.verification_resend_reset && now < user.verification_resend_reset) {
            if (user.verification_resend_count >= 5) {
                return res.status(429).json({
                    error: 'Terlalu banyak permintaan. Coba lagi besok.',
                    retryAfter: Math.ceil((user.verification_resend_reset - now) / 1000)
                });
            }
        } else {
            // Reset counter for new day
            user.verification_resend_count = 0;
            user.verification_resend_reset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }

        // Generate new token
        const verificationToken = generateVerificationToken();
        user.verification_token = verificationToken;
        user.verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.verification_resend_count += 1;
        await user.save();

        // Send email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationUrl = `${frontendUrl}/verify/${verificationToken}`;

        const emailSent = await sendVerificationEmail(email, {
            username: user.username,
            verificationUrl
        });

        if (emailSent) {
            res.json({ message: 'Link verifikasi telah dikirim ke email Anda.' });
        } else {
            res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                bank_details: user.bank_details
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
