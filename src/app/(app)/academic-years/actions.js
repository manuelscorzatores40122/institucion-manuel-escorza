'use server'

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getAcademicYears() {
  try {
    const res = await query('SELECT * FROM anios_escolares ORDER BY anio DESC');
    return res.rows;
  } catch (error) {
    console.error('Error al obtener años escolares:', error);
    return [];
  }
}

export async function createAcademicYear(anio) {
  try {
    // Verificar si ya existe
    const exists = await query('SELECT id FROM anios_escolares WHERE anio = $1', [anio]);
    if (exists.rows.length > 0) {
      throw new Error('El año escolar ya existe.');
    }
    
    await query('INSERT INTO anios_escolares (anio) VALUES ($1)', [anio]);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    throw new Error(error.message || 'Error al crear el año escolar');
  }
}

export async function deleteAcademicYear(id) {
  try {
    // Verificar que no haya matrículas
    const matriculas = await query('SELECT id FROM matriculas WHERE anio_id = $1 LIMIT 1', [id]);
    if (matriculas.rows.length > 0) {
      throw new Error('No se puede eliminar el año escolar porque tiene matrículas registradas.');
    }
    await query('DELETE FROM anios_escolares WHERE id = $1', [id]);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    throw new Error(error.message || 'Error al eliminar el año escolar');
  }
}
