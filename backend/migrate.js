const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'src', 'db', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Starting migration...");
    
    // 1. Add name column to sessions
    db.run("ALTER TABLE sessions ADD COLUMN name TEXT DEFAULT 'Sesi Default'", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
            console.error("Error adding name to sessions:", err.message);
        } else {
            console.log("Added 'name' column to sessions or it already exists.");
        }
    });

    // 2. Recreate students table without UNIQUE on nisn, but UNIQUE(nisn, session_id)
    db.run(`
        CREATE TABLE IF NOT EXISTS students_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            jenis_kelamin TEXT,
            kelas TEXT,
            ttl TEXT,
            nisn TEXT NOT NULL,
            session_id INTEGER,
            is_valid BOOLEAN,
            validation_note TEXT,
            lie_scale_score INTEGER,
            consistency_score INTEGER,
            durasi_pengisian INTEGER,
            is_complete BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id),
            UNIQUE(nisn, session_id)
        )
    `, (err) => {
        if (err) return console.error("Error creating students_new:", err.message);
        
        // Ensure at least one session exists if there are students
        db.get("SELECT id FROM sessions LIMIT 1", (err, row) => {
            let defaultSessionId = row ? row.id : 1;
            
            if (!row) {
                db.run("INSERT INTO sessions (token, name) VALUES ('default-token', 'Sesi Lama')");
            }

            // Copy data over
            // Wait, existing students might have session_id as NULL because we didn't use it.
            // If session_id is NULL, UNIQUE(nisn, NULL) behaves differently in SQLite (NULLs are distinct).
            // Let's set existing students to the default session_id so they don't break.
            db.run(`
                INSERT INTO students_new (id, nama, jenis_kelamin, kelas, ttl, nisn, session_id, is_valid, validation_note, lie_scale_score, consistency_score, durasi_pengisian, is_complete, created_at)
                SELECT id, nama, jenis_kelamin, kelas, ttl, nisn, IFNULL(session_id, ?), is_valid, validation_note, lie_scale_score, consistency_score, durasi_pengisian, is_complete, created_at
                FROM students
            `, [defaultSessionId], (err) => {
                if (err && !err.message.includes("UNIQUE constraint failed")) {
                    return console.error("Error copying data:", err.message);
                }
                
                // Drop old table
                db.run("DROP TABLE students", (err) => {
                    if (err) return console.error("Error dropping old students:", err.message);
                    
                    // Rename new table
                    db.run("ALTER TABLE students_new RENAME TO students", (err) => {
                        if (err) return console.error("Error renaming students_new:", err.message);
                        console.log("Migration complete!");
                        db.close();
                    });
                });
            });
        });
    });
});
