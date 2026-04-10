import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const API_KEY = process.env.EXTERNAL_API_KEY || 'scorza_api_key_secreta_2026';

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  return token === API_KEY;
}

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado. Se requiere un Bearer token válido.' }, { status: 401 });
  }

  const { dni } = params;

  try {
    const res = await query(`
      SELECT 
        e.id, e.codigo_estudiante, e.dni, e.nombres, e.apellido_paterno, e.apellido_materno,
        e.sexo, e.celular, e.domicilio, e.estado, e.egresado,
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
      WHERE e.dni = $1
    `, [dni]);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Estudiante no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: res.rows[0]
    });

  } catch (error) {
    console.error('Error API v1 ver estudiante por DNI:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
