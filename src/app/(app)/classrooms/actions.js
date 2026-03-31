'use server'

import { query } from '@/lib/db';

export async function getActiveYear() {
  try {
    const currentYear = new Date().getFullYear();
    const res = await query('SELECT * FROM anios_escolares WHERE anio <= $1 ORDER BY anio DESC LIMIT 1', [currentYear]);
    return res.rows[0] || null;
  } catch (error) {
    console.error('Error al obtener anio activo (classrooms):', error);
    return null;
  }
}

export async function getNivelesTree() {
  try {
    const nivelesObj = {};

    const seccionesInfo = await query(`
      SELECT n.id as n_id, n.nombre as n_nombre,
             g.id as g_id, g.nombre as g_nombre,
             s.id as s_id, s.nombre as s_nombre
      FROM niveles n
      JOIN grados g ON g.nivel_id = n.id
      JOIN secciones s ON s.grado_id = g.id
      ORDER BY n.id ASC, g.id ASC, s.nombre ASC
    `);

    seccionesInfo.rows.forEach(row => {
      if (!nivelesObj[row.n_id]) {
        nivelesObj[row.n_id] = { id: row.n_id, nombre: row.n_nombre, grados: {} };
      }
      if (!nivelesObj[row.n_id].grados[row.g_id]) {
        nivelesObj[row.n_id].grados[row.g_id] = { id: row.g_id, nombre: row.g_nombre, secciones: [] };
      }
      nivelesObj[row.n_id].grados[row.g_id].secciones.push({ id: row.s_id, nombre: row.s_nombre });
    });

    return Object.values(nivelesObj).map(n => ({
      ...n,
      grados: Object.values(n.grados)
    }));
  } catch (error) {
    console.error('Error al obtener arbol de niveles:', error);
    return [];
  }
}

export async function getSeccionWithStudents(seccionId, anioId) {
  if (!seccionId || !anioId) return null;

  try {
    const seccionInfoRes = await query(`
      SELECT s.id, s.nombre as seccion_nombre, g.nombre as grado_nombre, n.nombre as nivel_nombre
      FROM secciones s
      JOIN grados g ON s.grado_id = g.id
      JOIN niveles n ON g.nivel_id = n.id
      WHERE s.id = $1
    `, [seccionId]);

    if (seccionInfoRes.rows.length === 0) return null;

    const studentsRes = await query(`
      SELECT e.*
      FROM estudiantes e
      JOIN matriculas m ON m.estudiante_id = e.id
      WHERE m.seccion_id = $1 AND m.anio_id = $2
      ORDER BY e.apellido_paterno ASC, e.apellido_materno ASC, e.nombres ASC
    `, [seccionId, anioId]);

    return {
      info: seccionInfoRes.rows[0],
      students: studentsRes.rows
    };
  } catch (error) {
    console.error('Error al obtener seccion con estudiantes:', error);
    return null;
  }
}
