'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchStudentsData, deleteStudent, toggleEgresadoStatus } from './actions';

export default function StudentsIndexClient({ initialFiltersParams }) {
  const [studentsData, setStudentsData] = useState({ data: [], total: 0, from: 0, to: 0, last_page: 1, links: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    egresados: '0',
    anio_id: '',
    grado_id: '',
    seccion_id: '',
    page: 1
  });

  const { anios, grados, secciones } = initialFiltersParams;

  useEffect(() => {
    let debounceTimer = setTimeout(() => {
      loadData(filters);
    }, 400);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadData = async (activeFilters) => {
    setLoading(true);
    const result = await fetchStudentsData(activeFilters);
    setStudentsData(result);
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const toggleEgresados = () => {
    setFilters(prev => ({
      ...prev,
      egresados: prev.egresados === '1' ? '0' : '1',
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar estudiante definitivamente?')) {
      await deleteStudent(id);
      loadData(filters);
    }
  };

  const handleToggleEgresado = async (id) => {
    const isEgresado = filters.egresados === '1';
    const msg = isEgresado ? '¿Restaurar estudiante a lista de Activos?' : '¿Mover a este estudiante a la lista de Egresados/Exalumnos? Ya no aparecerá en esta lista.';
    if (confirm(msg)) {
      await toggleEgresadoStatus(id, !isEgresado);
      loadData(filters);
    }
  };

  const isEgresadosView = filters.egresados === '1';

  return (
    <div className="card">
      <div className="card-header d-flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 id="mainTitle">{isEgresadosView ? 'Estudiantes Egresados / Exalumnos' : 'Gestión de Estudiantes Activos'}</h2>
        <div className="d-flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
          <button id="toggleEgresadosBtn" className="btn" style={{ background: isEgresadosView ? 'var(--primary)' : 'var(--text-color)', color: 'white' }} onClick={toggleEgresados}>
            {isEgresadosView ? <><i className='bx bx-arrow-back'></i> Volver a Activos</> : <><i className='bx bxs-graduation'></i> Ver Egresados</>}
          </button>
          <Link href="/students/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <i className='bx bx-plus'></i> Registrar Estudiante
          </Link>
        </div>
      </div>

      <div className="filters-container mb-4 p-3" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', padding: '1rem' }}>
        <form id="filterForm" className="grid grid-cols-1 md-grid-cols-3 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
          <div className="form-group mb-0" style={{ gridColumn: 'span 3' }}>
            <label className="form-label"><i className='bx bx-search'></i> Búsqueda por texto</label>
            <input type="text" name="search" className="form-control" placeholder="Buscar por DNI, Nombres, Apellidos o Apoderado..." value={filters.search} onChange={handleFilterChange} autoComplete="off" />
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Año Escolar</label>
            <select name="anio_id" className="form-control" value={filters.anio_id} onChange={handleFilterChange}>
              <option value="">Todos los años</option>
              {anios?.map(a => <option key={a.id} value={a.id}>{a.anio}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Grado</label>
            <select name="grado_id" className="form-control" value={filters.grado_id} onChange={handleFilterChange}>
              <option value="">Todos los grados</option>
              {grados?.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Sección</label>
            <select name="seccion_id" className="form-control" value={filters.seccion_id} onChange={handleFilterChange}>
              <option value="">Todas las secciones</option>
              {secciones?.map(s => <option key={s.id} value={s.id}>"{s.nombre}"</option>)}
            </select>
          </div>
        </form>
      </div>

      <div className="table-responsive">
        {loading && (
          <div id="tableLoader" className="text-center p-4" style={{ textAlign: 'center', padding: '1rem' }}>
            <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
            <p>Cargando datos...</p>
          </div>
        )}

        {!loading && (
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px' }}>DNI</th>
                <th style={{ padding: '10px' }}>Apellidos y Nombres</th>
                <th style={{ padding: '10px' }}>Celular</th>
                <th style={{ padding: '10px' }}>Apoderados</th>
                <th>Matrícula (Última)</th>
                <th style={{ padding: '10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {studentsData.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No se encontraron estudiantes con los filtros aplicados.</td>
                </tr>
              ) : (
                studentsData.data.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}><b>{student.dni}</b></td>
                    <td style={{ padding: '10px' }}>{student.apellido_paterno} {student.apellido_materno}, {student.nombres}</td>
                    <td style={{ padding: '10px' }}>{student.celular || '-'}</td>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      {student.padre_nombres && <div><i className='bx bx-male'></i> {student.padre_apellidos}, {student.padre_nombres}</div>}
                      {student.madre_nombres && <div><i className='bx bx-female'></i> {student.madre_apellidos}, {student.madre_nombres}</div>}
                      {!student.padre_nombres && !student.madre_nombres && <span className="text-muted">No registrados</span>}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{student.gradoActual ? student.gradoActual : 'No matriculado'}</span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div className="d-flex gap-1" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" style={{ background: '#10B981', color: 'white' }} title="Ver Perfil"><i className='bx bx-show'></i></button>
                        <button className="btn btn-sm" style={{ background: 'var(--primary)', color: 'white' }} title="Editar"><i className='bx bx-edit'></i></button>
                        
                        {/* BOTÓN EGRESADO (Validado si está en fin de ciclo / egresados view) */}
                        {(student.canGraduate || isEgresadosView) && (
                          <button className="btn btn-sm" style={{ background: isEgresadosView ? '#f59e0b' : '#3b82f6', color: isEgresadosView ? 'black' : 'white' }} title={isEgresadosView ? "Restaurar a Activos" : "Marcar como Egresado"} onClick={() => handleToggleEgresado(student.id)}>
                            {isEgresadosView ? <i className='bx bx-undo'></i> : <><i className='bx bxs-graduation'></i></>}
                          </button>
                        )}

                        {/* BOTÓN PROMOVER A SECUNDARIA (Solo para 6to de primaria) */}
                        {student.canPassToSecondary && !isEgresadosView && (
                          <Link href="/enrollments/create" className="btn btn-sm" style={{ background: '#8b5cf6', color: 'white', textDecoration: 'none' }} title="Promover a Secundaria">
                            <i className='bx bx-trending-up'></i> a Sec
                          </Link>
                        )}

                        <button className="btn btn-danger btn-sm" style={{ background: '#dc2626', color: 'white' }} title="Eliminar" onClick={() => handleDelete(student.id)}>
                          <i className='bx bx-trash'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {!loading && (
        <div className="mt-4 d-flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Mostrando {studentsData.from || 0} a {studentsData.to || 0} de {studentsData.total} estudiantes
          </div>
          <div className="d-flex gap-1" style={{ display: 'flex', gap: '4px' }}>
            {studentsData.links.map((link, idx) => (
              <button key={idx} className="btn btn-sm" 
                disabled={!link.url}
                style={{ 
                  background: link.active ? 'var(--primary)' : 'white', 
                  color: link.active ? 'white' : 'var(--text-color)',
                  border: '1px solid #e2e8f0',
                  opacity: !link.url ? 0.5 : 1
                }} 
                onClick={() => link.url && handlePageChange(parseInt(link.label))}>
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
