import { config } from 'dotenv';
config({ path: '.env.local' });
import { query } from './src/lib/db.js';

async function main() {
  try {
    const res = await query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('estudiantes', 'apoderados', 'estudiante_apoderado')");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
main();
