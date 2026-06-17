const { query } = require('./src/db/index.js');
query("SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('sosiometri', 'rapor', 'prestasi', 'ekskul', 'students')").then(res => {
  res.forEach(r => console.log(r.sql));
}).catch(console.error);
