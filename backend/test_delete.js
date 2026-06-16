const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./src/db/database.sqlite');
db.serialize(() => {
    db.run("INSERT INTO sessions (name, token) VALUES ('test', 'testtoken')", function() {
        const sid = this.lastID;
        db.run("INSERT INTO students (nama, nisn, session_id) VALUES ('teststudent', '12345', ?)", [sid], function() {
            console.log('Student created');
            db.run("UPDATE students SET session_id = NULL WHERE session_id = ?", [sid], () => {
                db.run("DELETE FROM sessions WHERE id = ?", [sid], () => {
                    db.all("SELECT * FROM students WHERE nama = 'teststudent'", (err, rows) => {
                        console.log('After delete:', rows);
                    });
                });
            });
        });
    });
});
