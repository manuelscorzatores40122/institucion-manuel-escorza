import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Clave API simple para proteger el endpoint de accesos no autorizados.
// En producción, debería estar en tu archivo .env.local como EXTERNAL_API_KEY
const API_KEY = process.env.EXTERNAL_API_KEY || 'scorza_api_key_secreta_2026';

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  return token === API_KEY;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado. Se requiere un Bearer token válido.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit')) || 20;

  try {
    let sql = `
      SELECT 
        e.id, e.codigo_estudiante, e.dni, e.nombres, e.apellido_paterno, e.apellido_materno,
        e.estado, e.egresado,
        m.fecha_matricula,
        g.nombre as grado, n.nombre as nivel, a.anio
      FROM estudiantes e
      LEFT JOIN (
        SELECT DISTINCT ON (estudiante_id) *
        FROM matriculas
        ORDER BY estudiante_id, id DESC
      ) m ON e.id = m.estudiante_id
      LEFT JOIN grados g ON m.grado_id = g.id
      LEFT JOIN niveles n ON g.nivel_id = n.id
      LEFT JOIN anios_escolares a ON m.anio_id = a.id
      WHERE 1=1
    `;
    const params = [];
    
    if (searchTerm) {
      sql += ` AND (e.dni ILIKE $1 OR e.nombres ILIKE $1 OR e.apellido_paterno ILIKE $1)`;
      params.push(`%${searchTerm}%`);
    }

    sql += ` ORDER BY e.id DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      count: res.rows.length,
      data: res.rows
    });

  } catch (error) {
    console.error('Error API v1 students:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
