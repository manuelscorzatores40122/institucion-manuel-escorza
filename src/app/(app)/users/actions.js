'use server'

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  try {
    const res = await query('SELECT id, nombre_usuario FROM usuarios ORDER BY id DESC');
    return res.rows;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}
// fernando la logica de los usuarios esta incompleta completa la logica de los usuarios
export async function deleteUser(id) {
  if (id === 1 || id === '1') throw new Error('Cannot delete admin'); // basic protection
  try {
    await query('DELETE FROM usuarios WHERE id = $1', [id]);
    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw new Error('No se pudo eliminar el usuario.');
  }
}

export async function saveUser(nombre_usuario, contrasena) {
  if (!nombre_usuario || !contrasena) throw new Error('Usuario y constraseña obligatorios');
  const bcrypt = await import('bcryptjs');
  const hash = bcrypt.hashSync(contrasena, 10);
  try {
    await query('INSERT INTO usuarios (nombre_usuario, contrasena) VALUES ($1, $2)', [nombre_usuario, hash]);
    revalidatePath('/users');
    return { success: true };
  } catch (err) {
    throw new Error('El nombre de usuario ya existe o hubo un error');
  }
}
