import { Pool } from 'pg';

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export const query = (text, params) => {
  if (!pool) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno.');
  }
  return pool.query(text, params);
};
