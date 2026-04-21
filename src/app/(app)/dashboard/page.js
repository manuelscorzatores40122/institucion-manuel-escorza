import { query } from '@/lib/db';
import Link from 'next/link';
import { cookies } from 'next/headers';

async function getStats() {
  try {
    const [est, apo, mat, nivelesStats, genderStats, orphans, recentStudents, incompleteStats, trendsStats, upcomingBirthdays, usersRes, aulasRes] = await Promise.all([
      query('SELECT COUNT(*) FROM estudiantes'),
      query('SELECT COUNT(*) FROM apoderados'),
      query('SELECT COUNT(*) FROM matriculas'),
      query(`
        SELECT n.nombre, COUNT(m.id) as count
        FROM matriculas m
        JOIN grados g ON m.grado_id = g.id
        JOIN niveles n ON g.nivel_id = n.id
        GROUP BY n.nombre
      `),
      query('SELECT sexo, COUNT(id) as count FROM estudiantes GROUP BY sexo'),
      query('SELECT COUNT(id) as count FROM estudiantes WHERE id NOT IN (SELECT estudiante_id FROM estudiante_apoderado)'),
      query(`
        SELECT e.id, e.dni, e.nombres, e.apellido_paterno, e.apellido_materno,
        (SELECT g.nombre FROM matriculas m JOIN grados g ON m.grado_id = g.id WHERE m.estudiante_id = e.id ORDER BY m.id DESC LIMIT 1) as grado
        FROM estudiantes e ORDER BY e.id DESC LIMIT 5
      `),
      query(`
        SELECT COUNT(id) as count FROM estudiantes 
        WHERE dni IS NULL OR dni = '' OR fecha_nacimiento IS NULL OR celular IS NULL OR celular = ''
      `),
      query(`
        SELECT EXTRACT(MONTH FROM fecha_matricula) as mes, COUNT(id) as total 
        FROM matriculas 
        WHERE fecha_matricula IS NOT NULL AND EXTRACT(YEAR FROM fecha_matricula) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY EXTRACT(MONTH FROM fecha_matricula)
        ORDER BY mes ASC
      `),
      query(`
        SELECT id, nombres, apellido_paterno, apellido_materno, fecha_nacimiento,
               EXTRACT(DAY FROM fecha_nacimiento) as dia
        FROM estudiantes
        WHERE fecha_nacimiento IS NOT NULL 
          AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM fecha_nacimiento) >= EXTRACT(DAY FROM CURRENT_DATE)
        ORDER BY dia ASC
        LIMIT 5
      `),
      query('SELECT COUNT(*) FROM usuarios'),
      query('SELECT COUNT(*) FROM secciones')
    ]);

    let primCount = 0;
    let secCount = 0;
    nivelesStats.rows.forEach(row => {
      if (row.nombre.toLowerCase() === 'primaria') primCount = parseInt(row.count, 10);
      if (row.nombre.toLowerCase() === 'secundaria') secCount = parseInt(row.count, 10);
    });

    let maleCount = 0;
    let femaleCount = 0;
    genderStats.rows.forEach(r => {
      if (r.sexo === 'H') maleCount = parseInt(r.count, 10);
      else if (r.sexo === 'M') femaleCount = parseInt(r.count, 10);
    });

    const totalM = parseInt(mat.rows[0].count, 10) || 1;
    const primPerc = Math.round((primCount / totalM) * 100) || 0;
    const secPerc = Math.round((secCount / totalM) * 100) || 0;

    const totalEst = parseInt(est.rows[0].count, 10) || 1;
    const malePerc = Math.round((maleCount / totalEst) * 100) || 0;
    const femalePerc = Math.round((femaleCount / totalEst) * 100) || 0;

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const trendsData = Array(12).fill(0);
    let maxTrend = 1;
    if (trendsStats && trendsStats.rows) {
      trendsStats.rows.forEach(r => {
        const m = parseInt(r.mes, 10);
        const t = parseInt(r.total, 10);
        if (m >= 1 && m <= 12) {
          trendsData[m - 1] = t;
          if (t > maxTrend) maxTrend = t;
        }
      });
    }

    return {
      estudiantes: est.rows[0].count,
      apoderados: apo.rows[0].count,
      matriculas: parseInt(mat.rows[0].count, 10),
      primaria_perc: primPerc,
      secundaria_perc: secPerc,
      primaria_count: primCount,
      secundaria_count: secCount,
      male_count: maleCount,
      female_count: femaleCount,
      male_perc: malePerc,
      female_perc: femalePerc,
      orphans: parseInt(orphans.rows[0].count, 10) || 0,
      recent: recentStudents.rows || [],
      incomplete: parseInt(incompleteStats.rows[0].count, 10) || 0,
      trends: trendsData,
      maxTrend: maxTrend,
      birthdays: upcomingBirthdays.rows || [],
      usuarios: parseInt(usersRes.rows[0].count, 10) || 0,
      secciones: parseInt(aulasRes.rows[0].count, 10) || 0
    };
  } catch (error) {
    console.error('Error al obtener estadisticas del dashboard:', error);
    return {
      estudiantes: 0, apoderados: 0, matriculas: 0,
      primaria_perc: 0, secundaria_perc: 0, primaria_count: 0, secundaria_count: 0,
      male_count: 0, female_count: 0, male_perc: 0, female_perc: 0, orphans: 0, recent: [],
      incomplete: 0, trends: Array(12).fill(0), maxTrend: 1, birthdays: [],
      usuarios: 0, secciones: 0
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
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '0.2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Dashboard Administrativo</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Resumen inteligente de la institución y operaciones recientes.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/students/create" className="btn" style={{ background: '#3b82f6', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <i className='bx bx-user-plus'></i> Nuevo Alumno
          </Link>
          <Link href="/enrollments/create" className="btn" style={{ background: '#10b981', color: 'white', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <i className='bx bx-book-bookmark'></i> Matricular
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.2rem', marginBottom: '2rem' }}>
        {/* Primera fila: 4 tarjetas principales (ocupan 3 columnas cada una) */}
        <div style={{ gridColumn: 'span 3', background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estudiantes</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: '800' }}>{stats.estudiantes}</h3>
            </div>
            <div style={{ background: '#eff6ff', color: '#3b82f6', width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bx-group'></i></div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3', background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matrículas</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: '800' }}>{stats.matriculas}</h3>
            </div>
            <div style={{ background: '#ecfdf5', color: '#10b981', width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bx-task'></i></div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3', background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Familias</p>
              <h3 style={{ margin: '8px 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: '800' }}>{stats.apoderados}</h3>
            </div>
            <div style={{ background: '#fff7ed', color: '#ea580c', width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bxs-group'></i></div>
          </div>
        </div>

        <Link href="/users" style={{ gridColumn: 'span 3', textDecoration: 'none', display: 'block' }} className="stat-card-link">
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuarios</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '2rem', color: '#0f172a', fontWeight: '800' }}>{stats.usuarios}</h3>
              </div>
              <div style={{ background: '#f5f3ff', color: '#8b5cf6', width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bx-user-circle'></i></div>
            </div>
          </div>
        </Link>

        {/* Segunda fila: Alertas (ocupan 6 columnas cada una) */}
        <Link href="/students?incomplete=1" style={{ gridColumn: 'span 6', textDecoration: 'none', display: 'block' }} className="stat-card-link">
          <div style={{ background: stats.incomplete > 0 ? '#fffbeb' : 'white', borderRadius: '12px', padding: '20px', border: `1px solid ${stats.incomplete > 0 ? '#fcd34d' : '#e2e8f0'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div>
                <p style={{ margin: 0, color: stats.incomplete > 0 ? '#b45309' : '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Falta Documentos</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '2rem', color: stats.incomplete > 0 ? '#92400e' : '#0f172a', fontWeight: '800' }}>{stats.incomplete}</h3>
              </div>
              <div style={{ background: stats.incomplete > 0 ? '#fef3c7' : '#f8fafc', color: stats.incomplete > 0 ? '#f59e0b' : '#94a3b8', width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bx-file-blank'></i></div>
            </div>
            {stats.incomplete > 0 && <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', fontSize: '7rem', color: '#fde68a', opacity: 0.15, transform: 'rotate(-10deg)', zIndex: 1, pointerEvents: 'none' }}><i className='bx bxs-error-alt'></i></div>}
          </div>
        </Link>

        <Link href="/students?orphans=1" style={{ gridColumn: 'span 6', textDecoration: 'none', display: 'block' }} className="stat-card-link">
          <div style={{ background: stats.orphans > 0 ? '#fef2f2' : 'white', borderRadius: '12px', padding: '20px', border: `1px solid ${stats.orphans > 0 ? '#fca5a5' : '#e2e8f0'}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div>
                <p style={{ margin: 0, color: stats.orphans > 0 ? '#b91c1c' : '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sin Apoderado</p>
                <h3 style={{ margin: '8px 0 0', fontSize: '2rem', color: stats.orphans > 0 ? '#991b1b' : '#0f172a', fontWeight: '800' }}>{stats.orphans}</h3>
              </div>
              <div style={{ background: stats.orphans > 0 ? '#fee2e2' : '#f8fafc', color: stats.orphans > 0 ? '#ef4444' : '#94a3b8', width: '48px', height: '48px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className='bx bx-error'></i></div>
            </div>
            {stats.orphans > 0 && <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', fontSize: '7rem', color: '#fca5a5', opacity: 0.15, transform: 'rotate(-10deg)', zIndex: 1, pointerEvents: 'none' }}><i className='bx bxs-error-circle'></i></div>}
          </div>
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}><i className='bx bx-trending-up' style={{ color: '#10b981', marginRight: '6px' }}></i> Tendencia de Matrículas (Año Actual)</h3>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          {stats.trends.map((val, idx) => {
            const heightPerc = Math.max((val / stats.maxTrend) * 100, 2);
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', group: 'true' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', opacity: val > 0 ? 1 : 0 }}>{val}</div>
                <div style={{ width: '100%', background: val > 0 ? '#3b82f6' : '#e2e8f0', height: `${heightPerc}%`, borderRadius: '4px 4px 0 0', transition: '0.3s' }}></div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
             {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((mes, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{mes}</div>
             ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
        
        {/* PANEL IZQUIERDO: Registros Recientes */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '600' }}><i className='bx bx-history' style={{ color: '#6366f1', marginRight: '6px' }}></i> Últimos Ingresos (Top 5)</h3>
            <Link href="/students" style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '500', textDecoration: 'none' }}>Ver Todos →</Link>
          </div>
          <div style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 24px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Alumno</th>
                  <th style={{ padding: '12px 24px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Documento</th>
                  <th style={{ padding: '12px 24px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>Situación / Grado</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.length === 0 && (
                  <tr><td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No hay registros disponibles.</td></tr>
                )}
                {stats.recent.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{r.apellido_paterno} {r.apellido_materno}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{r.nombres}</div>
                    </td>
                    <td style={{ padding: '14px 24px', color: '#475569' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', border: '1px solid #e2e8f0' }}>{r.dni || 'S/N'}</span>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      {r.grado ? (
                        <span style={{ color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{r.grado}</span>
                      ) : (
                        <span style={{ color: '#d97706', background: '#fef3c7', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>Sin matricular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO: Métricas Demográficas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}><i className='bx bx-pie-chart-alt-2' style={{ color: '#8b5cf6', marginRight: '6px' }}></i> Cobertura por Nivel</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>Primaria ({stats.primaria_count})</span>
                  <span style={{ fontWeight: '700', color: '#6366f1' }}>{stats.primaria_perc}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e0e7ff', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.primaria_perc}%`, height: '100%', background: '#6366f1', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#475569', fontWeight: '500' }}>Secundaria ({stats.secundaria_count})</span>
                  <span style={{ fontWeight: '700', color: '#8b5cf6' }}>{stats.secundaria_perc}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#ede9fe', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.secundaria_perc}%`, height: '100%', background: '#8b5cf6', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}><i className='bx bx-male-female' style={{ color: '#d946ef', marginRight: '6px' }}></i> Distribución de Género</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px' }}>
                <i className='bx bx-male' style={{ fontSize: '2rem', color: '#22c55e' }}></i>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#166534', margin: '4px 0 0' }}>{stats.male_count}</div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '600', textTransform: 'uppercase' }}>Hombres</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: '#fdf4ff', border: '1px solid #fbcfe8', borderRadius: '10px', padding: '12px' }}>
                <i className='bx bx-female' style={{ fontSize: '2rem', color: '#d946ef' }}></i>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#86198f', margin: '4px 0 0' }}>{stats.female_count}</div>
                <div style={{ fontSize: '0.75rem', color: '#a21caf', fontWeight: '600', textTransform: 'uppercase' }}>Mujeres</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}><i className='bx bx-cake' style={{ color: '#f59e0b', marginRight: '6px' }}></i> Próximos Cumpleaños</h3>
            {stats.birthdays.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, textAlign: 'center', padding: '10px 0' }}>No hay cumpleaños próximos este mes.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.birthdays.map(b => (
                  <li key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#fef3c7', color: '#d97706', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '700', lineHeight: 1 }}>
                      <span style={{ fontSize: '0.9rem' }}>{b.dia}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>{b.nombres.split(' ')[0]} {b.apellido_paterno}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Este mes</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
