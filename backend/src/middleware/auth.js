const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dcm220-secret-key-123';

// Generic auth middleware (admin & student)
const requireAuth = function(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    const expected = process.env.ADMIN_TOKEN || null;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // Accept either a static ADMIN_TOKEN or a JWT token
    if (expected && token === expected) return next();

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        if (payload.role !== 'student') {
            req.admin = payload;
        }
        return next();
    } catch (e) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
};

// Admin-only middleware
const requireAdmin = function(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    const expected = process.env.ADMIN_TOKEN || null;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    if (expected && token === expected) return next();

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.role === 'student') {
            return res.status(403).json({ status: 'error', message: 'Forbidden: Admin only' });
        }
        req.user = payload;
        req.admin = payload;
        return next();
    } catch (e) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
};

// Student-only middleware
const requireStudent = function(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Forbidden: Student only' });
        }
        req.user = payload;
        return next();
    } catch (e) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
};

module.exports = requireAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireStudent = requireStudent;
