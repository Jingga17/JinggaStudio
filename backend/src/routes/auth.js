const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dcm220-secret-key-123';

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await get('SELECT * FROM admins WHERE username = ?', [username]);
        
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            status: 'success',
            token,
            user: { id: user.id, username: user.username, nama: user.nama }
        });
    } catch (err) {
        next(err);
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({ status: 'success', message: 'Logged out' });
});

module.exports = router;
