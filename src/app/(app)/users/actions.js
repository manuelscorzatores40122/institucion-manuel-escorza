'use server'

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  const res = await query('SELECT id, nombre_usuario FROM usuarios ORDER BY id DESC');
  return res.rows;
}

export async function deleteUser(id) {
  if (id === 1 || id === '1') throw new Error('Cannot delete admin'); // basic protection
  await query('DELETE FROM usuarios WHERE id = $1', [id]);
  revalidatePath('/users');
  return { success: true };
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
