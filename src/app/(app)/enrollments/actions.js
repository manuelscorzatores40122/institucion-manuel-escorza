'use server'

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getEnrollments() {
  const q = `
    SELECT m.id, m.fecha_matricula, e.dni, e.nombres, e.apellido_paterno, e.apellido_materno,
           s.nombre as seccion, g.nombre as grado, n.nombre as nivel, a.anio
    FROM matriculas m
    JOIN estudiantes e ON m.estudiante_id = e.id
    JOIN secciones s ON m.seccion_id = s.id
    JOIN grados g ON m.grado_id = g.id
    JOIN niveles n ON g.nivel_id = n.id
    JOIN anios_escolares a ON m.anio_id = a.id
    ORDER BY m.id DESC LIMIT 50
  `;
  const res = await query(q);
  return res.rows;
}

export async function getActiveYear() {
  const currentYear = new Date().getFullYear();
  // En Laravel, el año activo se pasaba automáticamente. Retornamos el último hasta el año actual.
  const res = await query('SELECT * FROM anios_escolares WHERE anio <= $1 ORDER BY anio DESC LIMIT 1', [currentYear]);
  if(!res.rows[0]) {
    // Si no hay año escolar lo creamos (año actual por defecto)
    const inserted = await query('INSERT INTO anios_escolares (anio) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *', [currentYear]);
    const secondFetch = await query('SELECT * FROM anios_escolares WHERE anio <= $1 ORDER BY anio DESC LIMIT 1', [currentYear]);
    return secondFetch.rows[0];
  }
  return res.rows[0];
}

export async function getLevels() {
  const res = await query('SELECT * FROM niveles ORDER BY id ASC');
  return res.rows;
}

export async function getGradesByLevel(nivelId) {
  const res = await query('SELECT * FROM grados WHERE nivel_id = $1 ORDER BY id ASC', [nivelId]);
  return res.rows;
}

export async function getSectionsByGrade(gradoId) {
  const res = await query('SELECT * FROM secciones WHERE grado_id = $1 ORDER BY id ASC', [gradoId]);
  return res.rows;
}

export async function saveEnrollment(data) {
  const { estudiante_id, anio_id, grado_id, seccion_id } = data;
  
  // Validar si la matrícula ya existe
  const exists = await query('SELECT id FROM matriculas WHERE estudiante_id = $1 AND anio_id = $2', [estudiante_id, anio_id]);
  if (exists.rows.length > 0) {
    throw new Error('El estudiante ya está matriculado para este año escolar.');
  }

  await query(`
    INSERT INTO matriculas (estudiante_id, anio_id, grado_id, seccion_id, fecha_matricula) 
    VALUES ($1, $2, $3, $4, CURRENT_DATE)
  `, [estudiante_id, anio_id, grado_id, seccion_id]);

  revalidatePath('/enrollments');
  return { success: true };
}

export async function deleteEnrollment(id) {
  await query('DELETE FROM matriculas WHERE id = $1', [id]);
  revalidatePath('/enrollments');
  return { success: true };
}
