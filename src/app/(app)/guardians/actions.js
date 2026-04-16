'use server'

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function fetchGuardiansData(filters) {
  const { search, page = 1 } = filters;
  const limit = 10;
  const offset = (page - 1) * limit;

  let baseQuery = ' FROM apoderados a WHERE 1=1';
  const queryParams = [];
  let paramIndex = 1;

  if (search) {
    baseQuery += ` AND (dni ILIKE $${paramIndex} OR nombres ILIKE $${paramIndex} OR apellido_paterno ILIKE $${paramIndex} OR apellido_materno ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  try {
    const countRes = await query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
    const total = parseInt(countRes.rows[0].count, 10);

    const limitIdx = paramIndex++;
    const offsetIdx = paramIndex++;
    const dataRes = await query(`SELECT a.* ${baseQuery} ORDER BY id DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`, [...queryParams, limit, offset]);

    // aca lo terminas fernando la logica de  los estudiantes asociados al apoderado
    const data = await Promise.all(dataRes.rows.map(async (g) => {
      const students = await query(`
        SELECT e.id, e.dni, e.nombres, e.apellido_paterno, e.apellido_materno 
        FROM estudiantes e 
        JOIN estudiante_apoderado ea ON e.id = ea.estudiante_id 
        WHERE ea.apoderado_id = $1
      `, [g.id]);
      return { ...g, estudiantes: students.rows };
    }));

    return {
      data,
      total,
      from: offset + 1,
      to: offset + data.length,
      last_page: Math.ceil(total / limit) || 1,
      links: Array.from({ length: Math.ceil(total / limit) || 1 }).map((_, i) => ({
        active: i + 1 === parseInt(page),
        label: String(i + 1),
        url: `?page=${i + 1}`
      }))
    };
  } catch (error) {
    console.error('Error al obtener apoderados:', error);
    return { data: [], total: 0, from: 0, to: 0, last_page: 1, links: [] };
  }
}

export async function searchGuardianByDni(dni) {
  try {
    const res = await query('SELECT * FROM apoderados WHERE dni = $1', [dni]);
    if (!res.rows[0]) return null;
    const guardian = res.rows[0];
    const students = await query(`
      SELECT e.id, e.dni, e.nombres, e.apellido_paterno, e.apellido_materno 
      FROM estudiantes e 
      JOIN estudiante_apoderado ea ON e.id = ea.estudiante_id 
      WHERE ea.apoderado_id = $1
    `, [guardian.id]);
    guardian.estudiantes = students.rows;
    return guardian;
  } catch (error) {
    console.error('Error al buscar apoderado por DNI:', error);
    return null;
  }
}

export async function saveGuardian(data) {
  const {
    id, dni, apellido_paterno, apellido_materno, nombres, celular, correo,
    parentesco, vive_con_estudiante, domicilio, estudiante_ids
  } = data;

  let guardianId = id;

  if (id) {
    await query(`
      UPDATE apoderados SET 
        apellido_paterno=$1, apellido_materno=$2, nombres=$3, dni=$4, celular=$5, correo=$6,
        domicilio=$7, parentesco=$8, vive_con_estudiante=$9
      WHERE id=$10
    `, [
      apellido_paterno, apellido_materno, nombres, dni, celular, correo,
      domicilio, parentesco, vive_con_estudiante ? 1 : 0, id
    ]);
  } else {
    const res = await query(`
      INSERT INTO apoderados (
        apellido_paterno, apellido_materno, nombres, dni, celular, correo,
        domicilio, parentesco, vive_con_estudiante
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id
    `, [
      apellido_paterno, apellido_materno, nombres, dni, celular, correo,
      domicilio, parentesco, vive_con_estudiante ? 1 : 0
    ]);
    guardianId = res.rows[0].id;
  }

  if (estudiante_ids) {
    await query('DELETE FROM estudiante_apoderado WHERE apoderado_id = $1', [guardianId]);
    for (const est_id of estudiante_ids) {
      await query(`INSERT INTO estudiante_apoderado (estudiante_id, apoderado_id) VALUES ($1, $2)`, [est_id, guardianId]);
    }
  }

  revalidatePath('/guardians');
  return { success: true };
}

export async function deleteGuardian(id) {
  try {
    await query('DELETE FROM apoderados WHERE id = $1', [id]);
    revalidatePath('/guardians');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar apoderado:', error);
    throw new Error('No se pudo eliminar el apoderado. Puede tener registros asociados.');
  }
}
