const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/LENOVO/Desktop/WORK/aplikasi/DCM/backend/src/db/database.sqlite');
db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    console.log(rows.map(r=>r.sql).join('\n\n'));
});
