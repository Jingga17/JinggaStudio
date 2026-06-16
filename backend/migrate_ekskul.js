const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'db', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Creating ekskul table...');
    db.run(`
        CREATE TABLE IF NOT EXISTS ekskul (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            nama_kegiatan TEXT NOT NULL,
            jenis TEXT NOT NULL, -- 'Ekstrakurikuler' atau 'Organisasi'
            posisi TEXT,
            tahun TEXT,
            keterangan TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Successfully created ekskul table.');
        }
    });
});

db.close((err) => {
    if (err) console.error(err.message);
    else console.log('Database connection closed.');
});
