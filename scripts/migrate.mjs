import { Pool } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("No DB URL");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  try {
    await pool.query(`
      -- Agregar campos medicos a estudiantes
      ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS alergias VARCHAR(255);
      ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(10);
      ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre VARCHAR(100);
      ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono VARCHAR(20);
      ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Activo';

      -- Permisos/Roles
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'Administrador';

      -- Historial
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        usuario_id INT,
        accion VARCHAR(255),
        detalles TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Asistencias
      CREATE TABLE IF NOT EXISTS asistencias (
        id SERIAL PRIMARY KEY,
        estudiante_id INT REFERENCES estudiantes(id) ON DELETE CASCADE,
        seccion_id INT REFERENCES secciones(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        estado VARCHAR(20) NOT NULL,
        observaciones TEXT
      );
    `);
    console.log('Migracion exitosa');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
