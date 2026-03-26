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
