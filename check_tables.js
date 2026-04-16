const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_EGYnKkqx8mN2@ep-autumn-truth-aml6qmo6-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require' });

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    console.log(res.rows.map(r => r.table_name));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
