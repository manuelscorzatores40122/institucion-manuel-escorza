import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!dbUrl) {
  console.error("No DB URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  try {
    await pool.query(`ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS celular_secundario VARCHAR(20)`);
    console.log('Migración de celular secundario exitosa');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
