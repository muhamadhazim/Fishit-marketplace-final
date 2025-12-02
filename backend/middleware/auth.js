const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const secret = process.env.JWT_SECRET || 'dev_secret';
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = auth;
