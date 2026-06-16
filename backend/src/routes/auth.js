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

// Student Login
router.post('/login/student', async (req, res, next) => {
    try {
        const { nisn, password } = req.body;
        const student = await get('SELECT * FROM students WHERE nisn = ?', [nisn]);
        
        if (!student) {
            return res.status(401).json({ status: 'error', message: 'NISN atau password salah' });
        }

        // If password_hash is null, we can assume the default password is the NISN itself
        // But for better security, the import script should set the hash. 
        // We'll support both bcrypt hash and plain NISN for initial fallback if password_hash is empty.
        let match = false;
        if (student.password_hash) {
            match = await bcrypt.compare(password, student.password_hash);
        } else {
            // Fallback for students imported before this feature: default password is their NISN
            if (password === student.nisn) {
                match = true;
                // Optionally hash it now and save it, but we can let them change it later
            }
        }

        if (!match) {
            return res.status(401).json({ status: 'error', message: 'NISN atau password salah' });
        }

        // Create token for student
        const token = jwt.sign({ id: student.id, nisn: student.nisn, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            status: 'success',
            token,
            user: { 
                id: student.id, 
                nisn: student.nisn, 
                nama: student.nama, 
                kelas: student.kelas,
                role: 'student'
            }
        });
    } catch (err) {
        next(err);
    }
});

// Get current user profile
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
        if (!token) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const payload = jwt.verify(token, JWT_SECRET);
        
        if (payload.role === 'student') {
            const student = await get('SELECT * FROM students WHERE id = ?', [payload.id]);
            if (!student) return res.status(401).json({ status: 'error', message: 'User not found' });
            
            // Exclude password hash and parse data_pribadi and nilai_akademik
            const { password_hash, data_pribadi, nilai_akademik, ...studentData } = student;
            let parsedData = {};
            try { parsedData = JSON.parse(data_pribadi || '{}'); } catch(e) {}
            let parsedAkademik = {};
            try { parsedAkademik = JSON.parse(nilai_akademik || '{}'); } catch(e) {}
            res.json({ status: 'success', user: { ...studentData, data_pribadi: parsedData, nilai_akademik: parsedAkademik, role: 'student' } });
        } else {
            const admin = await get('SELECT id, username, nama FROM admins WHERE id = ?', [payload.id]);
            if (!admin) return res.status(401).json({ status: 'error', message: 'User not found' });
            res.json({ status: 'success', user: { ...admin, role: 'admin' } });
        }
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({ status: 'success', message: 'Logged out' });
});

module.exports = router;
