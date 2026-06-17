const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/src/db/database.sqlite');
db.all("PRAGMA table_info('ekskul')", (err, rows) => {
  console.log('table_info:', err || rows);
});
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='ekskul'", (err, rows) => {
  console.log('sqlite_master:', err || rows);
});
