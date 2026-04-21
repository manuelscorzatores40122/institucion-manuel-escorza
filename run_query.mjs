import { config } from 'dotenv';
config({ path: '.env.local' });
import { query } from './src/lib/db.js';

async function main() {
  try {
    await query('ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS celular_secundario VARCHAR(20)');
    console.log('Column added successfully.');
  } catch (e) {
    console.error('Error adding column:', e);
  }
  process.exit();
}
main();
