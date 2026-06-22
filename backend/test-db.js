const { get, query, run } = require('./src/db');
async function test() {
    console.log("Starting test...");
    const valids = await get("SELECT COUNT(*) as c FROM students WHERE is_valid = 1");
    console.log("Valid students:", valids.c);
    const invalids = await get("SELECT COUNT(*) as c FROM students WHERE is_valid = 0");
    console.log("Invalid students:", invalids.c);
    console.log("Done.");
}
test().catch(console.error);
