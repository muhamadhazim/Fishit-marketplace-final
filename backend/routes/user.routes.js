const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const auth = require('../middleware/auth');
const crypto = require('crypto');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha512';
    const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return `${salt}:${iterations}:${derived}`;
}

function verifyPassword(raw, hash) {
    const [salt, iterStr, derived] = String(hash).split(':');
    const iterations = parseInt(iterStr || '100000', 10);
    const keylen = 64;
    const digest = 'sha512';
    const test = crypto.pbkdf2Sync(raw, salt, iterations, keylen, digest).toString('hex');
    return test === derived;
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

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bank_details, username, email, password, current_password } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Security Check: Require current_password for critical profile updates
        if (username || email || password) {
            if (!current_password) {
                return res.status(400).json({ error: 'Current password is required to update profile' });
            }
            if (!verifyPassword(current_password, user.password_hash)) {
                return res.status(401).json({ error: 'Incorrect current password' });
            }
        }

        // Update core fields
        if (username) {
             // Check uniqueness if changing
             if (username !== user.username) {
                 const exists = await User.findOne({ username });
                 if (exists) return res.status(400).json({ error: 'Username already taken' });
                 user.username = username;
             }
        }
        if (email) {
             // Check uniqueness
             if (email !== user.email) {
                 const exists = await User.findOne({ email });
                 if (exists) return res.status(400).json({ error: 'Email already taken' });
                 user.email = email;
             }
        }
        if (password) {
            // Validate new password strength
            const passwordCheck = validatePassword(password);
            if (!passwordCheck.valid) {
                return res.status(400).json({ error: passwordCheck.error });
            }
            user.password_hash = hashPassword(password);
        }

        // Update fields
        if (bank_details) {
            user.bank_details = {
                ...user.bank_details,
                ...bank_details
            };
        }

        await user.save();

        res.json({
            message: 'Profile updated',
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
