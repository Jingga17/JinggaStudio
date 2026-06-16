const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'db', 'database.sqlite');
console.log('Connecting to database at:', dbPath);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Adding nilai_akademik column to students table...');
    db.run("ALTER TABLE students ADD COLUMN nilai_akademik TEXT", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column nilai_akademik already exists. Skipping.');
            } else {
                console.error('Error adding column:', err.message);
            }
        } else {
            console.log('Successfully added nilai_akademik column.');
        }
    });
});

db.close((err) => {
    if (err) console.error(err.message);
    else console.log('Database connection closed.');
});
