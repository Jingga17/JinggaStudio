const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('src/db/database.sqlite');
db.all('SELECT sql FROM sqlite_master WHERE name="students"', (err, rows) => {
    console.log(rows);
});
