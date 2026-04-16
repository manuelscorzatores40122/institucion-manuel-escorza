const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_EGYnKkqx8mN2@ep-autumn-truth-aml6qmo6-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&uselibpqcompat=true&channel_binding=require"
});

pool.query(`
  ALTER TABLE estudiantes 
  ADD COLUMN vive_con VARCHAR(50), 
  ADD COLUMN apoderado_alterno_dni VARCHAR(20), 
  ADD COLUMN apoderado_alterno_nombres VARCHAR(100), 
  ADD COLUMN apoderado_alterno_apellidos VARCHAR(100), 
  ADD COLUMN apoderado_alterno_celular VARCHAR(20)
`)
.then(() => {
  console.log("Columns added successfully!");
  process.exit(0);
})
.catch(e => {
  console.error("Error or already exists:", e.message);
  process.exit(0);
});
