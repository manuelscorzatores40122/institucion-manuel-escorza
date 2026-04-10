'use server'

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function fetchStudentsData(filters) {
  const { search, egresados, anio_id, nivel_id, grado_id, seccion_id, page = 1 } = filters;
  const limit = 10;
  const offset = (page - 1) * limit;

  let baseQuery = ' FROM estudiantes WHERE 1=1';
  const queryParams = [];
  let paramIndex = 1;

  if (egresados) {
    baseQuery += ` AND egresado = $${paramIndex++}`;
    queryParams.push(egresados == '1');
  }

  if (search) {
    baseQuery += ` AND (dni ILIKE $${paramIndex} OR nombres ILIKE $${paramIndex} OR apellido_paterno ILIKE $${paramIndex} OR apellido_materno ILIKE $${paramIndex} OR padre_nombres ILIKE $${paramIndex} OR madre_nombres ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (anio_id || nivel_id || grado_id || seccion_id) {
    baseQuery += ` AND id IN (SELECT estudiante_id FROM matriculas m`;
    if (nivel_id && !grado_id) {
       baseQuery += ` JOIN grados g ON m.grado_id = g.id WHERE 1=1`;
    } else {
       baseQuery += ` WHERE 1=1`;
    }
    
    if (anio_id) { baseQuery += ` AND m.anio_id = $${paramIndex++}`; queryParams.push(anio_id); }
    if (nivel_id && !grado_id) { baseQuery += ` AND g.nivel_id = $${paramIndex++}`; queryParams.push(nivel_id); }
    if (grado_id) { baseQuery += ` AND m.grado_id = $${paramIndex++}`; queryParams.push(grado_id); }
    if (seccion_id) { baseQuery += ` AND m.seccion_id = $${paramIndex++}`; queryParams.push(seccion_id); }
    baseQuery += `)`;
  }

  const countRes = await query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  const limitIdx = paramIndex++;
  const offsetIdx = paramIndex++;
  const dataRes = await query(`SELECT * ${baseQuery} ORDER BY id DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`, [...queryParams, limit, offset]);

  // Analizar cada estudiante para graduacion
  const data = await Promise.all(dataRes.rows.map(async (st) => {
    // Buscar si tiene matricula para evaluar logica de promocion y obtener datos completos
    const mRes = await query(`
      SELECT g.nombre as grado_nombre, n.nombre as nivel_nombre, a.anio, m.estado_matricula, m.tipo_vacante, s.nombre as seccion_nombre
      FROM matriculas m
      JOIN grados g ON m.grado_id = g.id
      JOIN niveles n ON g.nivel_id = n.id
      JOIN secciones s ON m.seccion_id = s.id
      LEFT JOIN anios_escolares a ON m.anio_id = a.id
      WHERE m.estudiante_id = $1
      ORDER BY m.id DESC LIMIT 1
    `, [st.id]);
    
    let canGraduate = false;
    let canPassToSecondary = false;
    let gradoActual = '';
    let gradoNombre = '';
    let anioActual = '';
    let estado_matricula = '';
    let tipo_vacante = '';

    if (mRes.rows.length > 0) {
      const m = mRes.rows[0];
      gradoActual = `${m.grado_nombre} de ${m.nivel_nombre} - "${m.seccion_nombre}"`;
      gradoNombre = m.grado_nombre;
      anioActual = m.anio;
      estado_matricula = m.estado_matricula;
      tipo_vacante = m.tipo_vacante;

      const nivel = m.nivel_nombre.toLowerCase();
      const grado = m.grado_nombre.toLowerCase();
      
      const is6toPrimaria = (grado.includes('6') || grado.includes('sexto')) && nivel.includes('primaria');
      const is5toSecundaria = (grado.includes('5') || grado.includes('quinto')) && nivel.includes('secundaria');

      if (is5toSecundaria || is6toPrimaria) canGraduate = true;
      if (is6toPrimaria) canPassToSecondary = true;
    }

    return { ...st, canGraduate, canPassToSecondary, gradoActual, gradoNombre, anioActual, estado_matricula, tipo_vacante };
  }));

  return {
    data,
    total,
    from: offset + 1,
    to: offset + dataRes.rows.length,
    last_page: Math.ceil(total / limit) || 1,
    links: Array.from({ length: Math.ceil(total / limit) || 1 }).map((_, i) => ({
      active: i + 1 === parseInt(page),
      label: String(i + 1),
      url: `?page=${i + 1}`
    }))
  };
}

export async function getFilterOptions() {
  try {
    const currentYear = new Date().getFullYear();
    const [anios, niveles, grados, secciones] = await Promise.all([
      query('SELECT * FROM anios_escolares WHERE anio <= $1 ORDER BY anio DESC', [currentYear]),
      query('SELECT * FROM niveles ORDER BY id ASC'),
      query('SELECT * FROM grados ORDER BY id ASC'),
      query('SELECT * FROM secciones ORDER BY id ASC')
    ]);
    const orderMap = { "PRIMERO": 1, "SEGUNDO": 2, "TERCERO": 3, "CUARTO": 4, "QUINTO": 5, "SEXTO": 6 };
    const ordenadosGrados = grados.rows.sort((a, b) => (orderMap[a.nombre] || 99) - (orderMap[b.nombre] || 99));

    return {
      anios: anios.rows,
      niveles: niveles.rows,
      grados: ordenadosGrados,
      secciones: secciones.rows
    };
  } catch (error) {
    console.error('Error al obtener opciones de filtro:', error);
    return { anios: [], niveles: [], grados: [] };
  }
}

export async function searchStudentByDni(dni) {
  const res = await query('SELECT * FROM estudiantes WHERE dni = $1', [dni]);
  return res.rows[0] || null;
}

export async function toggleEgresadoStatus(id, status) {
  await query('UPDATE estudiantes SET egresado = $1 WHERE id = $2', [status, id]);
  revalidatePath('/students');
  return { success: true };
}

export async function saveStudent(data) {
  const {
    id, codigo_estudiante, apellido_paterno, apellido_materno, nombres, sexo, dni, celular, email,
    fecha_nacimiento, departamento_nacimiento, provincia_nacimiento,
    distrito_nacimiento, domicilio, reporte, padre_dni, padre_nombres,
    padre_apellidos, padre_celular, madre_dni, madre_nombres, madre_apellidos, madre_celular,
    anio_id, grado_id, seccion_id
  } = data;

  const validDni = dni && dni.trim() !== '' ? dni.trim() : null;
  const validCodigo = codigo_estudiante && codigo_estudiante.trim() !== '' ? codigo_estudiante.trim() : null;
  const validSexo = sexo === 'H' || sexo === 'M' ? sexo : null;
  let estudianteId = id;

  if (id) {
    await query(`
      UPDATE estudiantes SET 
        codigo_estudiante=$1, apellido_paterno=$2, apellido_materno=$3, nombres=$4, sexo=$5, dni=$6, celular=$7, email=$8,
        fecha_nacimiento=$9, departamento_nacimiento=$10, provincia_nacimiento=$11,
        distrito_nacimiento=$12, domicilio=$13, reporte=$14, padre_dni=$15, padre_nombres=$16,
        padre_apellidos=$17, padre_celular=$18, madre_dni=$19, madre_nombres=$20, madre_apellidos=$21, madre_celular=$22
      WHERE id=$23
    `, [
      validCodigo, apellido_paterno, apellido_materno, nombres, validSexo, validDni, celular, email,
      fecha_nacimiento || null, departamento_nacimiento, provincia_nacimiento,
      distrito_nacimiento, domicilio, reporte, padre_dni, padre_nombres,
      padre_apellidos, padre_celular, madre_dni, madre_nombres, madre_apellidos, madre_celular, id
    ]);
  } else {
    const res = await query(`
      INSERT INTO estudiantes (
        codigo_estudiante, apellido_paterno, apellido_materno, nombres, sexo, dni, celular, email,
        fecha_nacimiento, departamento_nacimiento, provincia_nacimiento,
        distrito_nacimiento, domicilio, reporte, padre_dni, padre_nombres,
        padre_apellidos, padre_celular, madre_dni, madre_nombres, madre_apellidos, madre_celular
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING id
    `, [
      validCodigo, apellido_paterno, apellido_materno, nombres, validSexo, validDni, celular, email,
      fecha_nacimiento || null, departamento_nacimiento, provincia_nacimiento,
      distrito_nacimiento, domicilio, reporte, padre_dni, padre_nombres,
      padre_apellidos, padre_celular, madre_dni, madre_nombres, madre_apellidos, madre_celular
    ]);
    estudianteId = res.rows[0].id;
  }

  // Si envia matriz de matricula, lo anexamos:
  if (anio_id && grado_id && seccion_id) {
    const matriculaExists = await query('SELECT id FROM matriculas WHERE estudiante_id = $1 AND anio_id = $2', [estudianteId, anio_id]);
    if (matriculaExists.rows.length > 0) {
      await query('UPDATE matriculas SET grado_id = $1, seccion_id = $2 WHERE estudiante_id = $3 AND anio_id = $4', [grado_id, seccion_id, estudianteId, anio_id]);
    } else {
      await query('INSERT INTO matriculas (estudiante_id, grado_id, seccion_id, anio_id, fecha_matricula) VALUES ($1, $2, $3, $4, CURRENT_DATE)', [estudianteId, grado_id, seccion_id, anio_id]);
    }
  }

  revalidatePath('/students');
  return { success: true };
}


export async function deleteStudent(id) {
  await query('DELETE FROM estudiantes WHERE id = $1', [id]);
  revalidatePath('/students');
  return { success: true };
}

export async function bulkDeleteStudents(studentIds) {
  if (!studentIds || !studentIds.length) throw new Error('No hay estudiantes seleccionados');
  // Usar query parametrizada para eliminar multiples IDs (ON DELETE CASCADE eliminará matriculas automáticamente)
  const idList = studentIds.map(id => parseInt(id)).filter(id => !isNaN(id));
  if (idList.length > 0) {
    const placeholders = idList.map((_, i) => `$${i + 1}`).join(',');
    await query(`DELETE FROM estudiantes WHERE id IN (${placeholders})`, idList);
  }
  revalidatePath('/students');
  return { success: true };
}

export async function bulkEnrollStudents(studentIds, anio_id, grado_id, seccion_id) {
  if (!studentIds || !studentIds.length) throw new Error('No hay estudiantes seleccionados');
  if (!anio_id || !grado_id || !seccion_id) throw new Error('Faltan datos de la matrícula (Año, Grado o Sección)');

  for (let id of studentIds) {
    // Evitar duplicados
    const exists = await query('SELECT id FROM matriculas WHERE estudiante_id = $1 AND anio_id = $2', [id, anio_id]);
    if (exists.rows.length === 0) {
      // Intentar matricular, si algún trigger falla (ej. restricción entre nivel y grado), paramos o seguimos
      try {
        await query(`
          INSERT INTO matriculas (estudiante_id, anio_id, grado_id, seccion_id, fecha_matricula) 
          VALUES ($1, $2, $3, $4, CURRENT_DATE)
        `, [id, anio_id, grado_id, seccion_id]);
      } catch (err) {
        throw new Error(`Error al matricular estudiante ID ${id}: ${err.message}`);
      }
    } else {
      // Si ya está matriculado en este año, podríamos actualizarle su matrícula actual en lugar de saltarlo.
      // O simplemente actualizarlo. Actualizamos:
      await query(`
        UPDATE matriculas SET grado_id = $1, seccion_id = $2, fecha_matricula = CURRENT_DATE
        WHERE estudiante_id = $3 AND anio_id = $4
      `, [grado_id, seccion_id, id, anio_id]);
    }
  }

  revalidatePath('/students');
  revalidatePath('/enrollments');
  return { success: true };
}
