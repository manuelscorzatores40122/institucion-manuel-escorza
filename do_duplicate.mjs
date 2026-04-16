import { query } from './src/lib/db.js';

async function duplicateGuardians() {
  console.log("Iniciando la duplicación de padres/madres hacia la tabla apoderados...");

  try {
    // PADRES
    console.log("1. Copiando PADRES a apoderados...");
    await query(`
      INSERT INTO apoderados (dni, nombres, apellido_paterno, celular, parentesco)
      SELECT DISTINCT ON (padre_dni)
          padre_dni, padre_nombres, padre_apellidos, padre_celular, 'padre'::parentesco_tipo
      FROM estudiantes
      WHERE padre_dni IS NOT NULL AND TRIM(padre_dni) != ''
      ON CONFLICT (dni) DO NOTHING
    `);
    
    console.log("1.5. Vinculando PADRES a estudiante_apoderado...");
    await query(`
      INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id)
      SELECT e.id, a.id
      FROM estudiantes e
      JOIN apoderados a ON e.padre_dni = a.dni
      WHERE e.padre_dni IS NOT NULL AND TRIM(e.padre_dni) != '' AND a.parentesco = 'padre'
        AND NOT EXISTS (
            SELECT 1 FROM estudiante_apoderado ea 
            WHERE ea.estudiante_id = e.id AND ea.apoderado_id = a.id
        )
    `);

    // MADRES
    console.log("2. Copiando MADRES a apoderados...");
    await query(`
      INSERT INTO apoderados (dni, nombres, apellido_paterno, celular, parentesco)
      SELECT DISTINCT ON (madre_dni)
          madre_dni, madre_nombres, madre_apellidos, madre_celular, 'madre'::parentesco_tipo
      FROM estudiantes
      WHERE madre_dni IS NOT NULL AND TRIM(madre_dni) != ''
      ON CONFLICT (dni) DO NOTHING
    `);

    console.log("2.5. Vinculando MADRES a estudiante_apoderado...");
    await query(`
      INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id)
      SELECT e.id, a.id
      FROM estudiantes e
      JOIN apoderados a ON e.madre_dni = a.dni
      WHERE e.madre_dni IS NOT NULL AND TRIM(e.madre_dni) != '' AND a.parentesco = 'madre'
        AND NOT EXISTS (
            SELECT 1 FROM estudiante_apoderado ea 
            WHERE ea.estudiante_id = e.id AND ea.apoderado_id = a.id
        )
    `);

    // APODERADOS ALTERNOS
    console.log("3. Copiando APODERADOS ALTERNOS a apoderados...");
    await query(`
      INSERT INTO apoderados (dni, nombres, apellido_paterno, celular, parentesco)
      SELECT DISTINCT ON (apoderado_alterno_dni)
          apoderado_alterno_dni, apoderado_alterno_nombres, apoderado_alterno_apellidos, apoderado_alterno_celular, 'otro'::parentesco_tipo
      FROM estudiantes
      WHERE apoderado_alterno_dni IS NOT NULL AND TRIM(apoderado_alterno_dni) != ''
      ON CONFLICT (dni) DO NOTHING
    `);

    console.log("3.5. Vinculando APODERADOS ALTERNOS a estudiante_apoderado...");
    await query(`
      INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id)
      SELECT e.id, a.id
      FROM estudiantes e
      JOIN apoderados a ON e.apoderado_alterno_dni = a.dni
      WHERE e.apoderado_alterno_dni IS NOT NULL AND TRIM(e.apoderado_alterno_dni) != '' AND a.parentesco = 'otro'
        AND NOT EXISTS (
            SELECT 1 FROM estudiante_apoderado ea 
            WHERE ea.estudiante_id = e.id AND ea.apoderado_id = a.id
        )
    `);

    console.log("¡DUPLICACIÓN Y VINCULACIÓN EXITOSA!");
  } catch (error) {
    console.error("Hubo un error en la base de datos:", error.message);
  }
  process.exit(0);
}

duplicateGuardians();
