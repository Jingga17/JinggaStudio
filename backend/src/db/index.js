const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

// Ensure parent directory of dbPath exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Initialize schema
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error('Error executing schema:', err.message);
            } else {
                // Auto-run seeder to ensure default admin exists
                try {
                    require('./seeder.js');
                } catch (seedErr) {
                    console.error('Failed to run database seeder:', seedErr.message);
                }
            }
        });
        // Ensure optional columns exist (safe ALTERs)
        try {
            db.run("ALTER TABLE schools ADD COLUMN kota TEXT", (e) => { if (e) {/*ignore*/} else console.log('Added kota column'); });
            db.run("ALTER TABLE schools ADD COLUMN nip TEXT", (e) => { if (e) {/*ignore*/} else console.log('Added nip column'); });
            db.run("ALTER TABLE schools ADD COLUMN is_assessment_open BOOLEAN DEFAULT 0", (e) => { if (e) {/*ignore*/} else console.log('Added is_assessment_open column'); });
        } catch (e) {
            // ignore
        }

        // Create portfolio tables if not exist
        db.exec(`
            CREATE TABLE IF NOT EXISTS rapor (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                semester TEXT NOT NULL,
                mata_pelajaran TEXT NOT NULL,
                nilai REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS prestasi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                nama_prestasi TEXT NOT NULL,
                tingkat TEXT NOT NULL,
                posisi TEXT,
                tahun TEXT,
                penyelenggara TEXT,
                keterangan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
            );
        `, (err) => {
            if (err) console.error('Error creating portfolio tables:', err.message);
            else console.log('Portfolio tables ready.');
        });

    }
});

// Wrap db methods in promises for async/await
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this); // this contains lastID and changes
        });
    });
};

module.exports = { db, query, get, run };
