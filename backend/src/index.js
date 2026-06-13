require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Auto-update sub-field CSV from v4 if present
try {
    const csvBase = process.env.CSV_PATH || path.join(__dirname, '../../../SOAL DAN ANALISIS DCM');
    const src = path.join(csvBase, 'analisis_sub_bidang_v4.csv');
    const dest = path.join(csvBase, 'analisis sub Bidang.csv');
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✅ Copied analisis_sub_bidang_v4.csv to target analisis sub Bidang.csv');
        try {
            fs.unlinkSync(src);
            console.log('🗑️ Cleaned up source file: analisis_sub_bidang_v4.csv');
        } catch (unlinkErr) {
            console.warn('⚠️ Could not remove source file:', unlinkErr.message);
        }
    }
} catch (e) {
    console.error('❌ Failed to update sub-field analysis CSV:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup Uploads Directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Basic Route
app.get('/api', (req, res) => {
    res.json({ message: 'Counselor Connect Backend API v1.0.0 is running' });
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/students', require('./routes/students'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/export', require('./routes/export'));

// Expose CSV data folder for dynamic narrative generation
app.use('/api/csv', express.static(path.join(__dirname, '../../../SOAL DAN ANALISIS DCM')));

// Serve frontend static files (as a local fallback when not using Nginx proxy)
app.use(express.static(path.join(__dirname, '../../frontend'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.html' || ext === '.js' || ext === '.css') {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
});

// Auto-convert CSV to JS for frontend offline use
try {
    const csvBase = process.env.CSV_PATH || path.join(__dirname, '../../../SOAL DAN ANALISIS DCM');
    const csvPath1 = path.join(csvBase, 'analisis Bidang.csv');
    const csvPath2 = path.join(csvBase, 'analisis sub Bidang.csv');
    const jsPath = process.env.JS_OUTPUT_PATH || path.join(__dirname, '../../frontend/js/data-analisis.js');

    if (fs.existsSync(csvPath1) && fs.existsSync(csvPath2)) {
        const txt1 = fs.readFileSync(csvPath1, 'utf8');
        const txt2 = fs.readFileSync(csvPath2, 'utf8');

        function parseCSV(text) {
            const lines = text.trim().split('\n');
            if (lines.length === 0) return [];
            const headers = lines[0].split(',').map(h => h.trim());
            const result = [];
            for (let i = 1; i < lines.length; i++) {
                let line = lines[i];
                if (!line.trim()) continue;
                let row = [];
                let curr = '';
                let inQuotes = false;
                for (let j = 0; j < line.length; j++) {
                    let c = line[j];
                    if (c === '"') inQuotes = !inQuotes;
                    else if (c === ',' && !inQuotes) { row.push(curr.replace(/\r/g, '')); curr = ''; }
                    else curr += c;
                }
                row.push(curr.replace(/\r/g, ''));
                let obj = {};
                headers.forEach((h, idx) => obj[h.replace(/\r/g, '')] = row[idx]);
                result.push(obj);
            }
            return result;
        }

        const data = {
            bidang: parseCSV(txt1),
            subBidang: parseCSV(txt2)
        };

        const jsContent = 'const DATA_ANALISIS_CSV = ' + JSON.stringify(data, null, 2) + ';';
        fs.writeFileSync(jsPath, jsContent);
        console.log('✅ Generated frontend/js/data-analisis.js from CSV files!');
    } else {
        console.warn('⚠️  CSV analisis not found at:', csvBase, '- laporan descriptions will use fallback text.');
    }
} catch (e) {
    console.error('❌ Failed to generate data-analisis.js:', e.message);
}

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
