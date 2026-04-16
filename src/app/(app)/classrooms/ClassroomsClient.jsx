'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSeccionWithStudents } from './actions';

export default function ClassroomsClient({ nivelesTree, activeYear }) {
  const [selectedSeccion, setSelectedSeccion] = useState('');
  const [seccionInfo, setSeccionInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFetchClassroom = async (e) => {
    e.preventDefault();
    if(!selectedSeccion || !activeYear) return;
    
    setLoading(true);
    const data = await getSeccionWithStudents(selectedSeccion, activeYear.id);
    if(data) {
      setSeccionInfo(data.info);
      setStudents(data.students);
    } else {
      setSeccionInfo(null);
      setStudents([]);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="card" style={{ boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)' }}>
        <div className="card-header" style={{ borderBottomColor: '#e2e8f0', paddingBottom: '1rem' }}>
          <h2 style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 0 }}>
            <i className='bx bxs-chalkboard'></i> Visualizar Aula / Estudiantes
          </h2>
        </div>

        <form onSubmit={handleFetchClassroom} className="mb-2">
          <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
            Seleccione un Nivel, Grado y Sección:
          </label>
          <div className="d-flex gap-3 mt-2" style={{ alignItems: 'center', display: 'flex', gap: '1rem' }}>
            <select 
              className="form-control" 
              style={{ flex: 1, maxWidth: '500px', padding: '0.75rem 1rem', border: '2px solid #cbd5e1', borderRadius: '8px' }}
              value={selectedSeccion}
              onChange={(e) => setSelectedSeccion(e.target.value)}
              required
            >
              <option value="" disabled>-- Despliegue para seleccionar un aula --</option>
              {nivelesTree.map(nivel => (
                <optgroup key={nivel.id} label={`--- ${nivel.nombre.toUpperCase()} ---`}>
                  {nivel.grados.map(grado => 
                    grado.secciones.map(seccion => (
                      <option key={seccion.id} value={seccion.id}>
                        📄 {grado.nombre} - Sección "{seccion.nombre}"
                      </option>
                    ))
                  )}
                </optgroup>
              ))}
            </select>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }} disabled={loading}>
              <i className={loading ? 'bx bx-loader bx-spin' : 'bx bx-search'}></i> Mostrar Lista
            </button>
          </div>
        </form>
      </div>

      {seccionInfo && (
        <div className="card mt-4" style={{ marginTop: '1.5rem', borderTop: '4px solid var(--secondary)' }}>
          <div className="card-header d-flex justify-between align-center" style={{ background: '#f8fafc', margin: '-1.5rem -2rem 1.5rem', padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.4rem' }}>
              Aula Seleccionada: <strong>{seccionInfo.nivel_nombre.toUpperCase()} - {seccionInfo.grado_nombre.toUpperCase()} "{seccionInfo.seccion_nombre}"</strong>
            </h3>
            <span className="badge" style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', fontSize: '1rem', borderRadius: '6px' }}>
              Total: {students.length} alumnos matriculados
            </span>
          </div>

          <div className="table-responsive" style={{ borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table className="table" style={{ width: '100%', marginBottom: 0, borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#e2e8f0' }}>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center', color: 'var(--primary)', fontWeight: 700, padding: '12px' }}>N°</th>
                  <th style={{ color: 'var(--primary)', fontWeight: 700, padding: '12px' }}>APELLIDOS Y NOMBRES</th>
                  <th style={{ color: 'var(--primary)', fontWeight: 700, padding: '12px' }}>DNI</th>
                  <th style={{ color: 'var(--primary)', fontWeight: 700, padding: '12px' }}>CONTACTO DEL ALUMNO</th>
                  <th style={{ color: 'var(--primary)', fontWeight: 700, padding: '12px' }}>APODERADO(S) PRINCIPALES</th>
                  <th style={{ width: '100px', textAlign: 'center', color: 'var(--primary)', fontWeight: 700, padding: '12px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-5" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <i className='bx bx-folder-open' style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem', display: 'block' }}></i>
                      <span style={{ fontSize: '1.1rem', color: '#64748b' }}>No hay estudiantes matriculados en esta sección para el presente año escolar.</span>
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td align="center" style={{ fontWeight: 600, color: '#94a3b8', padding: '12px' }}>{index + 1}</td>
                      <td style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', padding: '12px' }}>
                        {student.apellido_paterno.toUpperCase()} {student.apellido_materno.toUpperCase()}, <span style={{ fontWeight: 400 }}>{student.nombres}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#475569', padding: '12px' }}>{student.dni}</td>
                      <td style={{ padding: '12px' }}>
                        {student.celular ? (
                          <><i className='bx bx-mobile-alt text-primary'></i> {student.celular}</>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>No registrado</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {student.padre_nombres && (
                          <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.2rem' }}>
                            <i className='bx bx-male'></i> <strong>{student.padre_apellidos?.toUpperCase()}</strong> ({student.padre_celular || 'Sin tlf'})
                          </div>
                        )}
                        {student.madre_nombres && (
                          <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.2rem' }}>
                            <i className='bx bx-female'></i> <strong>{student.madre_apellidos?.toUpperCase()}</strong> ({student.madre_celular || 'Sin tlf'})
                          </div>
                        )}
                        {!student.padre_nombres && !student.madre_nombres && (
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}><i className='bx bx-error-circle'></i> Falta apoderado</span> 
                        )}
                      </td>
                      <td align="center" style={{ padding: '12px' }}>
                        <Link href={`/students/`} className="btn" style={{ background: 'transparent', color: 'var(--secondary)', border: '1px solid var(--secondary)', padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', textDecoration:'none' }} title="Ver Perfil">
                          <i className='bx bx-id-card'></i> Ver Ficha
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
