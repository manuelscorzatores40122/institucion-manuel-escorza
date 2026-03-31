import { query } from '@/lib/db';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getStats() {
  try {
    const [est, apo, mat, nivelesStats] = await Promise.all([
      query('SELECT COUNT(*) FROM estudiantes'),
      query('SELECT COUNT(*) FROM apoderados'),
      query('SELECT COUNT(*) FROM matriculas'),
      query(`
        SELECT n.nombre, COUNT(m.id) as count
        FROM matriculas m
        JOIN grados g ON m.grado_id = g.id
        JOIN niveles n ON g.nivel_id = n.id
        GROUP BY n.nombre
      `)
    ]);

    let primCount = 0;
    let secCount = 0;
    nivelesStats.rows.forEach(row => {
      if (row.nombre.toLowerCase() === 'primaria') primCount = parseInt(row.count, 10);
      if (row.nombre.toLowerCase() === 'secundaria') secCount = parseInt(row.count, 10);
    });

    const totalM = parseInt(mat.rows[0].count, 10) || 1;
    const primPerc = Math.round((primCount / totalM) * 100) || 0;
    const secPerc = Math.round((secCount / totalM) * 100) || 0;

    return {
      estudiantes: est.rows[0].count,
      apoderados: apo.rows[0].count,
      matriculas: parseInt(mat.rows[0].count, 10),
      primaria_perc: primPerc,
      secundaria_perc: secPerc,
      primaria_count: primCount,
      secundaria_count: secCount
    };
  } catch (error) {
    console.error('Error al obtener estadisticas del dashboard:', error);
    return {
      estudiantes: 0,
      apoderados: 0,
      matriculas: 0,
      primaria_perc: 0,
      secundaria_perc: 0,
      primaria_count: 0,
      secundaria_count: 0
    };
  }
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export default async function DashboardPage() {
  const stats = await getStats();
  const user = await getUser();

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '0.5rem' }}>Panel de Control</h2>
        <p className="text-muted">Resumen general académico y administrativo.</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* Stat Card 1 */}
        <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
          <div>
            <div className="stat-card-title">Total Estudiantes</div>
            <div className="stat-card-value">{stats.estudiantes}</div>
            <Link href="/students" className="text-primary" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', fontWeight: '500' }}>
              Ver directorio <i className='bx bx-right-arrow-alt'></i>
            </Link>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(11, 37, 69, 0.1)', color: 'var(--primary)' }}>
            <i className='bx bxs-user-detail'></i>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="stat-card" style={{ borderLeftColor: 'var(--secondary)' }}>
          <div>
            <div className="stat-card-title">Familias / Apoderados</div>
            <div className="stat-card-value">{stats.apoderados}</div>
            <Link href="/guardians" className="text-secondary" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', fontWeight: '500' }}>
              Gestionar tutores <i className='bx bx-right-arrow-alt'></i>
            </Link>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(232, 93, 34, 0.1)', color: 'var(--secondary)' }}>
            <i className='bx bxs-group'></i>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="stat-card" style={{ borderLeftColor: 'var(--success)' }}>
          <div>
            <div className="stat-card-title">Matrículas Activas</div>
            <div className="stat-card-value">{stats.matriculas}</div>
            <Link href="/enrollments" style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', fontWeight: '500' }}>
              Reporte de matrícula <i className='bx bx-right-arrow-alt'></i>
            </Link>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <i className='bx bx-clipboard'></i>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div style={{ width: '100%' }}>
            <div className="stat-card-title">Distribución por Nivel</div>

            <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Primaria ({stats.primaria_count})</span>
                <span style={{ fontWeight: '600', color: '#6366f1' }}>{stats.primaria_perc}%</span>
              </div>
              <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '10px' }}>
                <div style={{ width: `${stats.primaria_perc}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Secundaria ({stats.secundaria_count})</span>
                <span style={{ fontWeight: '600', color: '#8b5cf6' }}>{stats.secundaria_perc}%</span>
              </div>
              <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px' }}>
                <div style={{ width: `${stats.secundaria_perc}%`, height: '100%', background: '#8b5cf6', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card" style={{ marginBottom: '0' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <i className='bx bx-bolt-circle text-secondary'></i> Acciones Rápidas
          </h3>
          <div className="d-flex gap-3">
            <Link href="/students/create" className="btn btn-primary" style={{ flex: '1' }}>
              <i className='bx bx-plus-circle'></i> Nuevo Estudiante
            </Link>
            <Link href="/enrollments/create" className="btn btn-secondary" style={{ flex: '1' }}>
              <i className='bx bx-book-bookmark'></i> Procesar Matrícula
            </Link>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '0' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <i className='bx bx-info-circle text-primary'></i> Sistema y Accesos
          </h3>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Has iniciado sesión de forma autorizada. Recuerda cerrar sesión al finalizar y no compartir tus credenciales de administrador.
          </p>

          {user?.nombre_usuario === 'admin' && (
            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/users" className="btn btn-outline" style={{ border: '1px solid var(--border-color)', color: 'var(--text-color)', background: '#f8fafc', fontSize: '0.85rem' }}>
                <i className='bx bxs-user-account'></i> Administrar Accesos del Personal
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
