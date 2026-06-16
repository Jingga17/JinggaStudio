const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'src', 'db', 'database.sqlite');
console.log('Connecting to database at:', dbPath);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Adding data_pribadi column to students table...');
    db.run("ALTER TABLE students ADD COLUMN data_pribadi TEXT DEFAULT '{}'", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column data_pribadi already exists. Skipping.');
            } else {
                console.error('Error adding column:', err.message);
            }
        } else {
            console.log('Successfully added data_pribadi column.');
        }
    });
    
    db.run("UPDATE students SET data_pribadi = '{}' WHERE data_pribadi IS NULL", (err) => {
        if (err) console.error('Error setting default values:', err.message);
        else console.log('Successfully set default values.');
    });
});

db.close((err) => {
    if (err) console.error(err.message);
    else console.log('Database connection closed.');
});
