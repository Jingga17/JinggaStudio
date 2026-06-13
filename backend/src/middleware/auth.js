const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dcm220-secret-key-123';

module.exports = function(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    const expected = process.env.ADMIN_TOKEN || null;
    if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    // Accept either a static ADMIN_TOKEN or a JWT token
    if (expected && token === expected) return next();

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.admin = payload;
        return next();
    } catch (e) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
};
