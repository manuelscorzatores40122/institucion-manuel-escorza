import { query } from '@/lib/db';
import Link from 'next/link';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';


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

  return <DashboardClient stats={stats} />;
}
