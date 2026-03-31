import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="([^"]+)"/);
let dbUrl = '';
if (dbUrlMatch) {
  dbUrl = dbUrlMatch[1];
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  } // Sometimes Neon requires this
});

async function setup() {
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;');
    const schemaSql = fs.readFileSync('schema.sql', 'utf8');
    await pool.query(schemaSql);
    console.log('Schema and data applied successfully to the Neon database.');
  } catch (error) {
    fs.writeFileSync('js_error.txt', error.message + '\n' + error.stack);
    console.error('Schema application failed, error written to js_error.txt');
  } finally {
    pool.end();
  }
}

setup();
