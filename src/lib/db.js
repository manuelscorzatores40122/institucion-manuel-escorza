import { Pool } from '@neondatabase/serverless';

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

export const query = (text, params) => {
  if (!pool) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno.');
  }
  return pool.query(text, params);
};
