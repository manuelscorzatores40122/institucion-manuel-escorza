const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_EGYnKkqx8mN2@ep-autumn-truth-aml6qmo6-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require'
});

async function main() {
  try {
    const res = await pool.query('SELECT * FROM secciones WHERE grado_id = 2');
    console.log('Current secciones for grado 2:', res.rows);
    
    // Check if 'A' exists for grado 2
    if (!res.rows.find(r => r.nombre === 'A')) {
       await pool.query("INSERT INTO secciones (grado_id, nombre) VALUES (2, 'A')");
       console.log('Inserted seccion A for grado 2 (Primero Primaria)');
    }
    
    // check ALL grades to see if any is missing A or B
    const all = await pool.query('SELECT grado_id, nombre FROM secciones ORDER BY grado_id, nombre');
    console.log('All secciones:', all.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
