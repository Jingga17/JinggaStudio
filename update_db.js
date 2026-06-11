const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'backend/src/db/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE schools ADD COLUMN kota TEXT", function(err) {
        if(err) console.log("kota already exists or error:", err.message);
        else console.log("Added kota column");
    });
    db.run("ALTER TABLE schools ADD COLUMN nip TEXT", function(err) {
        if(err) console.log("nip already exists or error:", err.message);
        else console.log("Added nip column");
    });
});
db.close();
