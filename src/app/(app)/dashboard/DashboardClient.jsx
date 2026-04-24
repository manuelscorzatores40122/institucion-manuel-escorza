'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardClient({ stats }) {
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const trendsData = stats.trends.map((val, idx) => ({
    name: monthNames[idx],
    matriculas: val
  }));

  const nivelData = [
    { name: 'Primaria', value: stats.primaria_count },
    { name: 'Secundaria', value: stats.secundaria_count }
  ];
  const COLORS = ['#6366f1', '#8b5cf6'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ paddingBottom: '3rem' }}
    >
      {/* Header Premium */}
      <motion.div variants={itemVariants} className="dash-header">
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '2.4rem', color: 'white', marginBottom: '0.4rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span> Administrativo
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem', fontWeight: '500', letterSpacing: '-0.01em' }}>
            Centro de comando y control inteligente para la institución educativa.
          </p>
        </div>
        <div className="dash-header-actions">
          <Link href="/students/create" className="btn" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontWeight: '600',
            padding: '0.8rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s'
          }}>
            <i className='bx bx-user-plus' style={{ fontSize: '1.2rem' }}></i> Nuevo Alumno
          </Link>
          <Link href="/enrollments/create" className="btn" style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            color: 'white',
            fontWeight: '600',
            padding: '0.8rem 1.4rem',
            borderRadius: '12px',
            fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.3s'
          }}>
            <i className='bx bx-book-bookmark' style={{ fontSize: '1.2rem' }}></i> Matricular
          </Link>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="dash-kpi-grid">
        {/* KPI Cards */}
        {[
          { label: 'Estudiantes', value: stats.estudiantes, icon: 'bx-group', color: '#3b82f6', bg: '#eff6ff', span: 3 },
          { label: 'Matrículas', value: stats.matriculas, icon: 'bx-task', color: '#10b981', bg: '#ecfdf5', span: 3 },
          { label: 'Familias', value: stats.apoderados, icon: 'bxs-group', color: '#ea580c', bg: '#fff7ed', span: 3 },
          { label: 'Usuarios', value: stats.usuarios, icon: 'bx-user-circle', color: '#8b5cf6', bg: '#f5f3ff', span: 3, link: '/users' }
        ].map((kpi, idx) => {
          const cardContent = (
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02), 0 4px 10px -5px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                cursor: kpi.link ? 'pointer' : 'default'
              }}
              className={kpi.link ? "stat-card" : ""}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                  <motion.h3
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 0.2 + (idx * 0.1) }}
                    style={{ margin: '10px 0 0', fontSize: '2.5rem', color: '#0f172a', fontWeight: '800', lineHeight: 1 }}
                  >
                    {kpi.value}
                  </motion.h3>
                </div>
                <div style={{
                  background: kpi.bg,
                  color: kpi.color,
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 16px -8px ${kpi.color}`
                }}>
                  <i className={`bx ${kpi.icon}`}></i>
                </div>
              </div>
            </motion.div>
          );

          return kpi.link ? (
            <Link key={idx} href={kpi.link} className="dash-kpi-col" style={{ textDecoration: 'none', display: 'block' }}>
              {cardContent}
            </Link>
          ) : (
            <div key={idx} className="dash-kpi-col">
              {cardContent}
            </div>
          );
        })}

        {/* Alertas */}
        {[
          { label: 'Falta Documentos', value: stats.incomplete, icon: 'bx-file-blank', bgAlert: '#fffbeb', borderAlert: '#fcd34d', colorAlert: '#b45309', iconBgAlert: '#fef3c7', iconColorAlert: '#f59e0b', dangerBg: '#fef3c7', dangerColor: '#f59e0b', span: 6, link: '/students?incomplete=1' },
          { label: 'Sin Apoderado', value: stats.orphans, icon: 'bx-error', bgAlert: '#fef2f2', borderAlert: '#fca5a5', colorAlert: '#b91c1c', iconBgAlert: '#fee2e2', iconColorAlert: '#ef4444', dangerBg: '#fee2e2', dangerColor: '#ef4444', span: 6, link: '/students?orphans=1' }
        ].map((alert, idx) => {
          const isActive = alert.value > 0;
          return (
            <Link key={idx} href={alert.link} className="dash-alert-col" style={{ textDecoration: 'none', display: 'block' }}>
              <motion.div
                whileHover={isActive ? { scale: 1.02 } : {}}
                style={{
                  background: isActive ? alert.bgAlert : 'white',
                  borderRadius: '20px',
                  padding: '24px',
                  border: `1px solid ${isActive ? alert.borderAlert : 'rgba(226, 232, 240, 0.8)'}`,
                  boxShadow: isActive ? `0 10px 25px -5px ${alert.borderAlert}40` : '0 10px 25px -5px rgba(0,0,0,0.02)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 2 }}>
                  <motion.div
                    animate={isActive ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                    transition={{ repeat: Infinity, repeatDelay: 5, duration: 0.5 }}
                    style={{
                      background: isActive ? alert.iconBgAlert : '#f8fafc',
                      color: isActive ? alert.iconColorAlert : '#94a3b8',
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      fontSize: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive ? `0 8px 16px -8px ${alert.iconColorAlert}` : 'none'
                    }}
                  >
                    <i className={`bx ${alert.icon}`}></i>
                  </motion.div>
                  <div>
                    <p style={{ margin: 0, color: isActive ? alert.colorAlert : '#64748b', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{alert.label}</p>
                    <h3 style={{ margin: '8px 0 0', fontSize: '2.5rem', color: isActive ? alert.colorAlert : '#0f172a', fontWeight: '800', lineHeight: 1 }}>{alert.value}</h3>
                  </div>
                </div>
                {isActive && (
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '10rem', color: alert.dangerColor, opacity: 0.1, transform: 'rotate(-15deg)', zIndex: 1 }}>
                    <i className={`bx ${alert.icon}`}></i>
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="dash-bottom-grid">
        {/* PANEL IZQUIERDO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Gráfico de Tendencias */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '30px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px', display: 'flex' }}><i className='bx bx-trending-up'></i></div>
                  Tendencia de Matrículas
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Evolución mensual (Año Actual)</p>
              </div>
            </div>

            <div style={{ height: '240px', width: '100%', marginLeft: '-15px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMatriculas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: '700' }}
                  />
                  <Area type="monotone" dataKey="matriculas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMatriculas)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Últimos Ingresos */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ padding: '24px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#eef2ff', color: '#6366f1', padding: '6px', borderRadius: '8px', display: 'flex' }}><i className='bx bx-history'></i></div>
                  Últimos Ingresos
                </h3>
              </div>
              <Link href="/students" style={{
                fontSize: '0.9rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s'
              }}>Ver Todos</Link>
            </div>

            <div style={{ padding: '0 10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' }}>Alumno</th>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' }}>Documento</th>
                    <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9', textAlign: 'right' }}>Situación</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.length === 0 && (
                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem' }}>No hay registros disponibles.</td></tr>
                  )}
                  {stats.recent.map((r, i) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      key={r.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }} className="table-row-hover"
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: '700', fontSize: '1.2rem' }}>
                            {r.nombres.charAt(0)}{r.apellido_paterno.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{r.apellido_paterno} {r.apellido_materno}</div>
                            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>{r.nombres}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em' }}>{r.dni || 'S/N'}</span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {r.grado ? (
                          <span style={{ color: '#059669', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>{r.grado}</span>
                        ) : (
                          <span style={{ color: '#d97706', background: '#fef3c7', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>Sin matricular</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '15px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}></div>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Cobertura por Nivel */}
          <div style={{ background: 'white', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#f5f3ff', color: '#5012e2ff', padding: '6px', borderRadius: '8px', display: 'flex' }}><i className='bx bx-pie-chart-alt-2'></i></div>
              Cobertura por Nivel
            </h3>

            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nivelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {nivelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Género */}
          <div style={{ background: 'white', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#fdf4ff', color: '#d946ef', padding: '6px', borderRadius: '8px', display: 'flex' }}><i className='bx bx-male-female'></i></div>
              Distribución de Género
            </h3>
            <div className="dash-gender-dist">
              <motion.div whileHover={{ scale: 1.05 }} style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '20px 15px', position: 'relative', overflow: 'hidden' }}>
                <i className='bx bx-male' style={{ fontSize: '3.5rem', color: '#22c55e', opacity: 0.1, position: 'absolute', right: '-10px', bottom: '-10px' }}></i>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 10px', background: '#dcfce7', color: '#16a34a', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  <i className='bx bx-male'></i>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#166534', margin: '0', lineHeight: 1 }}>{stats.male_count}</div>
                <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Hombres</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} style={{ flex: 1, textAlign: 'center', background: '#fdf4ff', border: '1px solid #fbcfe8', borderRadius: '20px', padding: '20px 15px', position: 'relative', overflow: 'hidden' }}>
                <i className='bx bx-female' style={{ fontSize: '3.5rem', color: '#d946ef', opacity: 0.1, position: 'absolute', right: '-10px', bottom: '-10px' }}></i>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 10px', background: '#fae8ff', color: '#c026d3', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  <i className='bx bx-female'></i>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#86198f', margin: '0', lineHeight: 1 }}>{stats.female_count}</div>
                <div style={{ fontSize: '0.8rem', color: '#a21caf', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Mujeres</div>
              </motion.div>
            </div>
          </div>

          {/* Próximos Cumpleaños */}
          <div style={{ background: 'white', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#fffbeb', color: '#f59e0b', padding: '6px', borderRadius: '8px', display: 'flex' }}><i className='bx bx-cake'></i></div>
              Próximos Cumpleaños
            </h3>
            {stats.birthdays.length === 0 ? (
              <div style={{ background: '#f8fafc', padding: '30px', borderRadius: '16px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <i className='bx bx-calendar-x' style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '10px' }}></i>
                <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, fontWeight: '500' }}>No hay cumpleaños próximos este mes.</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {stats.birthdays.map((b, i) => (
                  <motion.li
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (i * 0.1) }}
                    key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f8fafc', padding: '12px', borderRadius: '16px', border: '1px solid #f1f5f9' }}
                  >
                    <div style={{ background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', color: 'white', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '800', lineHeight: 1, boxShadow: '0 4px 10px -2px rgba(245, 158, 11, 0.4)' }}>
                      <span style={{ fontSize: '1.2rem' }}>{b.dia}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>{b.nombres.split(' ')[0]} {b.apellido_paterno}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}><i className='bx bx-calendar-star' style={{ color: '#f59e0b', marginRight: '4px' }}></i>Este mes</div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
