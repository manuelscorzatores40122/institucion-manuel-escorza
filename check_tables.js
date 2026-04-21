const { query } = require('./src/lib/db.js');
async function start() {
    const r = await query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('Tables:', r.rows.map(x=>x.table_name));
    process.exit(0);
}
start();
