import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL=([^\s]+)/);
let dbUrl = '';
if (dbUrlMatch) {
  dbUrl = dbUrlMatch[1].replace(/"/g, ''); // Remove quotes if they exist
}

const pool = new Pool({
  connectionString: dbUrl,
});

async function optimize() {
  try {
    const queryText = `
      -- Indices para Estudiantes
      CREATE INDEX IF NOT EXISTS idx_estudiantes_dni ON estudiantes(dni);
      CREATE INDEX IF NOT EXISTS idx_estudiantes_codigo ON estudiantes(codigo_estudiante);
      CREATE INDEX IF NOT EXISTS idx_estudiantes_nombres ON estudiantes(nombres);
      CREATE INDEX IF NOT EXISTS idx_estudiantes_apellidos ON estudiantes(apellido_paterno, apellido_materno);
      CREATE INDEX IF NOT EXISTS idx_estudiantes_egresado ON estudiantes(egresado);

      -- Indices para Matriculas (Vital para joins)
      CREATE INDEX IF NOT EXISTS idx_matriculas_estudiante_id ON matriculas(estudiante_id);
      CREATE INDEX IF NOT EXISTS idx_matriculas_anio_id ON matriculas(anio_id);
      CREATE INDEX IF NOT EXISTS idx_matriculas_grado_id ON matriculas(grado_id);
      CREATE INDEX IF NOT EXISTS idx_matriculas_seccion_id ON matriculas(seccion_id);

      -- Indices para Apoderados
      CREATE INDEX IF NOT EXISTS idx_apoderados_dni ON apoderados(dni);
      CREATE INDEX IF NOT EXISTS idx_apoderados_nombres ON apoderados(nombres);
      CREATE INDEX IF NOT EXISTS idx_apoderados_apellidos ON apoderados(apellido_paterno, apellido_materno);

      -- Indices para Tabla Intermedia Estudiante-Apoderado
      CREATE INDEX IF NOT EXISTS idx_ea_estudiante_id ON estudiante_apoderado(estudiante_id);
      CREATE INDEX IF NOT EXISTS idx_ea_apoderado_id ON estudiante_apoderado(apoderado_id);

      -- Extension para busquedas ILIKE super rapidas (Opcional, puede fallar si no se tienen permisos de superuser)
      -- CREATE EXTENSION IF NOT EXISTS pg_trgm;
      -- CREATE INDEX IF NOT EXISTS trgm_idx_est_nom ON estudiantes USING gin (nombres gin_trgm_ops);
    `;
    console.log('Creando indices en la base de datos...');
    await pool.query(queryText);
    console.log('¡Indices creados con éxito! La base de datos ahora responderá a la velocidad de la luz.');
  } catch (error) {
    console.error('Error optimizando tablas:', error);
  } finally {
    pool.end();
  }
}

optimize();
