import { Pool } from '@neondatabase/serverless';

if (!globalThis.pool && process.env.DATABASE_URL) {
  globalThis.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });
}
const pool = globalThis.pool;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const query = async (text, params, retries = 3) => {
  if (!pool) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno.');
  }

  try {
    return await pool.query(text, params);
  } catch (error) {
    if (retries > 0 && (error.code === 'ECONNRESET' || error.message.includes('Connection terminated') || error.message.includes('fetch'))) {
      console.warn(`[DB WARN] Conexion fallida ("${error.code}"). Reintentando de forma invisible... (Quedan ${retries} intentos)`);
      await sleep(400); // 400ms espera antes de forzar otro empuje
      return query(text, params, retries - 1);
    }
    console.error(`[DB FATAL ERROR] Fallo final en consulta. Query: ${text}`, error);
    throw error;
  }
};
