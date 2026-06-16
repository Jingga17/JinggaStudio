const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'src', 'db', 'database.sqlite');

if (!fs.existsSync(dbPath)) {
    console.log('Database not found at', dbPath);
    process.exit(0);
}

const db = new sqlite3.Database(dbPath);

console.log('Running migration: Adding password and profile fields to students table...');

const columnsToAdd = [
    { name: 'password_hash', type: 'TEXT' },
    { name: 'alamat', type: 'TEXT' },
    { name: 'nama_ortu', type: 'TEXT' },
    { name: 'pekerjaan_ortu', type: 'TEXT' },
    { name: 'hobi', type: 'TEXT' },
    { name: 'cita_cita', type: 'TEXT' },
    { name: 'no_hp', type: 'TEXT' }
];

db.serialize(() => {
    // We try to add columns one by one
    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists. Skipping.`);
                } else {
                    console.error(`Error adding ${col.name}:`, err.message);
                }
            } else {
                console.log(`Successfully added column ${col.name}`);
            }
        });
    });
});

setTimeout(() => {
    console.log('Migration finished.');
    process.exit(0);
}, 2000);
