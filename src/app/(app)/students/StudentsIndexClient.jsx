'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchStudentsData, deleteStudent, toggleEgresadoStatus, bulkEnrollStudents } from './actions';
import ConfirmModal from '../ConfirmModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function StudentsIndexClient({ initialFiltersParams }) {
  const [studentsData, setStudentsData] = useState({ data: [], total: 0, from: 0, to: 0, last_page: 1, links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ anio_id: '', nivel_id: '', grado_id: '', seccion_id: '' });
  const [filters, setFilters] = useState({
    search: '',
    egresados: '0',
    anio_id: '',
    nivel_id: '',
    grado_id: '',
    seccion_id: '',
    page: 1
  });

  const { anios, niveles, grados, secciones } = initialFiltersParams;

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
    const { name, value } = e.target;
    if (name === 'nivel_id') setFilters(p => ({ ...p, nivel_id: value, grado_id: '', seccion_id: '', page: 1 }));
    else if (name === 'grado_id') setFilters(p => ({ ...p, grado_id: value, seccion_id: '', page: 1 }));
    else setFilters(p => ({ ...p, [name]: value, page: 1 }));
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

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Estudiante',
      message: '¿Eliminar estudiante definitivamente? Esta acción no se puede deshacer.',
      isDanger: true,
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        await deleteStudent(id);
        loadData(filters);
      },
      onCancel: () => setConfirmConfig({ isOpen: false })
    });
  };

  const handleToggleEgresado = (id) => {
    const isEgresado = filters.egresados === '1';
    const msg = isEgresado ? '¿Restaurar estudiante a lista de Activos?' : '¿Mover a este estudiante a la lista de Egresados/Exalumnos? Ya no aparecerá en esta lista.';
    setConfirmConfig({
      isOpen: true,
      title: isEgresado ? 'Restaurar Estudiante' : 'Mover a Egresados',
      message: msg,
      isDanger: !isEgresado,
      confirmText: 'Confirmar',
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        await toggleEgresadoStatus(id, !isEgresado);
        loadData(filters);
      },
      onCancel: () => setConfirmConfig({ isOpen: false })
    });
  };

  const isEgresadosView = filters.egresados === '1';

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === studentsData.data.length && studentsData.data.length > 0) setSelectedIds([]);
    else setSelectedIds(studentsData.data.map(st => st.id));
  };

  const handleBulkEnroll = async (e) => {
    e.preventDefault();
    if (!bulkForm.anio_id || !bulkForm.grado_id || !bulkForm.seccion_id) {
      alert("Faltan datos requeridos");
      return;
    }
    setLoading(true);
    setBulkModalOpen(false);
    try {
      await bulkEnrollStudents(selectedIds, bulkForm.anio_id, bulkForm.grado_id, bulkForm.seccion_id);
      setSelectedIds([]);
      loadData(filters);
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  // EXPORTS
  const generateExportTitle = () => {
    let title = isEgresadosView ? 'Estudiantes Egresados' : 'Estudiantes Activos';
    if (filters.anio_id) {
      const a = anios?.find(x => x.id == filters.anio_id);
      if (a) title += ` - Año ${a.anio}`;
    }
    if (filters.nivel_id) {
      const n = niveles?.find(x => x.id == filters.nivel_id);
      if (n) title += ` - ${n.nombre}`;
    }
    if (filters.grado_id) {
      const g = grados?.find(x => x.id == filters.grado_id);
      if (g) title += ` - ${g.nombre}`;
    }
    if (filters.seccion_id) {
      const s = secciones?.find(x => x.id == filters.seccion_id);
      if (s) title += ` Seccion "${s.nombre}"`;
    }
    return title;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = generateExportTitle();

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

    // AutoTable
    autoTable(doc, {
      startY: 35,
      head: [['DNI', 'Apellidos y Nombres', 'Celular', 'Apoderados (Nombre)', 'Matrícula (Referencial)']],
      body: studentsData.data.map(st => [
        st.dni,
        `${st.apellido_paterno} ${st.apellido_materno}, ${st.nombres}`,
        st.celular || 'N/A',
        (st.padre_nombres || st.madre_nombres) ? `${st.padre_nombres || ''} / ${st.madre_nombres || ''}` : 'No',
        st.gradoActual || 'Sin matricular'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // verde primary
    });

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  const handleExportExcel = () => {
    const title = generateExportTitle();

    const rows = studentsData.data.map(st => ({
      'DNI': st.dni,
      'Apellidos': `${st.apellido_paterno} ${st.apellido_materno}`,
      'Nombres': st.nombres,
      'F. Nacimiento': st.fecha_nacimiento ? new Date(st.fecha_nacimiento).toLocaleDateString() : '',
      'Celular': st.celular || '',
      'Domicilio': st.domicilio || '',
      'Matrícula Actual': st.gradoActual || '',
      'Estado': isEgresadosView ? 'Egresado' : 'Activo',
      'Reporte Médico': st.reporte || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");

    XLSX.writeFile(workbook, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 id="mainTitle">{isEgresadosView ? 'Estudiantes Egresados / Exalumnos' : 'Gestión de Estudiantes Activos'}</h2>
        <div className="d-flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
          <button id="toggleEgresadosBtn" className="btn" style={{ background: isEgresadosView ? 'var(--primary)' : 'var(--text-color)', color: 'white' }} onClick={toggleEgresados}>
            {isEgresadosView ? <><i className='bx bx-arrow-back'></i> Volver a Activos</> : <><i className='bx bxs-graduation'></i> Ver Egresados</>}
          </button>
          {!isEgresadosView && (
            <button className="btn" style={{ background: isSelectionMode ? '#ef4444' : '#3b82f6', color: 'white' }} onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}>
              <i className={isSelectionMode ? 'bx bx-x' : 'bx bx-check-double'}></i> {isSelectionMode ? 'Cancelar Selección' : 'Selección Múltiple'}
            </button>
          )}
          <Link href="/students/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <i className='bx bx-plus'></i> Registrar Estudiante
          </Link>
        </div>
      </div>

      <div className="filters-container mb-4 p-3" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', padding: '1rem' }}>
        <form id="filterForm" className="grid grid-cols-1 md-grid-cols-4 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
          <div className="form-group mb-0" style={{ gridColumn: 'span 4' }}>
            <label className="form-label"><i className='bx bx-search'></i> Búsqueda por texto</label>
            <input type="text" name="search" className="form-control" placeholder="Buscar por DNI, Nombres, Apellidos" value={filters.search} onChange={handleFilterChange} autoComplete="off" />
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Año Escolar</label>
            <select name="anio_id" className="form-control" value={filters.anio_id} onChange={handleFilterChange}>
              <option value="">Todos los años</option>
              {anios?.map(a => <option key={a.id} value={a.id}>{a.anio}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Nivel</label>
            <select name="nivel_id" className="form-control" value={filters.nivel_id} onChange={handleFilterChange}>
              <option value="">Todos los niveles</option>
              {niveles?.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Grado</label>
            <select name="grado_id" className="form-control" value={filters.grado_id} onChange={handleFilterChange} disabled={!filters.nivel_id}>
              <option value="">{filters.nivel_id ? 'Todos los grados' : 'Selecciona un nivel'}</option>
              {grados?.filter(g => g.nivel_id == filters.nivel_id).map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Sección</label>
            <select name="seccion_id" className="form-control" value={filters.seccion_id} onChange={handleFilterChange} disabled={!filters.grado_id}>
              <option value="">{filters.grado_id ? 'Todas las secc' : 'Selecciona grado'}</option>
              {secciones?.filter(s => s.grado_id == filters.grado_id).map(s => <option key={s.id} value={s.id}>"{s.nombre}"</option>)}
            </select>
          </div>
        </form>
      </div>

      <div className="table-responsive">
        {selectedIds.length > 0 && !isEgresadosView && (
          <div style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}>
            <div>
              <i className='bx bx-check-square' style={{ fontSize: '1.2rem', marginRight: '8px', verticalAlign: 'middle' }}></i>
              <b>{selectedIds.length}</b> estudiantes seleccionados
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSelectedIds([])} className="btn btn-sm" style={{ background: 'transparent', color: 'white', border: '1px solid white' }}>Cancelar</button>
              <button onClick={() => setBulkModalOpen(true)} className="btn btn-sm" style={{ background: 'white', color: '#3b82f6', fontWeight: 'bold' }}>
                <i className='bx bx-trending-up'></i> Promover Selección
              </button>
            </div>
          </div>
        )}

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
                {isSelectionMode && (
                  <th style={{ padding: '10px', width: '40px' }}><input type="checkbox" onChange={toggleSelectAll} checked={studentsData.data.length > 0 && selectedIds.length === studentsData.data.length} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /></th>
                )}
                <th style={{ padding: '10px' }}>DNI</th>
                <th style={{ padding: '10px' }}>Apellidos y Nombres</th>
                <th style={{ padding: '10px' }}>Celular</th>
                <th style={{ padding: '10px' }}>Apoderados</th>
                <th>Matrícula (Última)</th>
                <th style={{ padding: '10px' }}>Opciones</th>
              </tr>
            </thead>
            <tbody>
              {studentsData.data.length === 0 ? (
                <tr>
                  <td colSpan={isSelectionMode ? "7" : "6"} className="text-center text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No se encontraron estudiantes con los filtros aplicados.</td>
                </tr>
              ) : (
                studentsData.data.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0', background: selectedIds.includes(student.id) ? '#eff6ff' : 'transparent' }}>
                    {isSelectionMode && (
                      <td style={{ padding: '10px' }}><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelect(student.id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} /></td>
                    )}
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
                    <td style={{ padding: '10px', position: 'relative' }}>
                      <button onClick={() => setOpenDropdownId(openDropdownId === student.id ? null : student.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%', color: '#64748b', transition: '0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="action-btn" title="Opciones">
                        <i className='bx bx-dots-vertical-rounded' style={{ fontSize: '1.5rem' }}></i>
                      </button>

                      {openDropdownId === student.id && (
                        <div style={{ position: 'absolute', right: '30px', top: '10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px', padding: '0.5rem 0', flexDirection: 'column', display: 'flex' }}>
                          <button onClick={() => { setSelectedStudent(student); setOpenDropdownId(null); }} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#475569', fontSize: '0.9rem', transition: '0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <i className='bx bx-show' style={{ fontSize: '1.2rem', color: '#10B981' }}></i> Ver Perfil
                          </button>

                          <Link href={`/students/create?dni=${student.dni}`} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#475569', fontSize: '0.9rem', transition: '0.2s ease', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <i className='bx bx-edit' style={{ fontSize: '1.2rem', color: '#3b82f6' }}></i> Editar Info
                          </Link>

                          {(student.canGraduate || isEgresadosView) && (
                            <button onClick={() => { handleToggleEgresado(student.id); setOpenDropdownId(null); }} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#475569', fontSize: '0.9rem', transition: '0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                              {isEgresadosView ? <><i className='bx bx-undo' style={{ fontSize: '1.2rem', color: '#f59e0b' }}></i> Restaurar Activo</> : <><i className='bx bxs-graduation' style={{ fontSize: '1.2rem', color: '#6366f1' }}></i> Egresar Alumno</>}
                            </button>
                          )}

                          {student.canPassToSecondary && !isEgresadosView && (
                            <Link href="/enrollments/create" style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#475569', fontSize: '0.9rem', transition: '0.2s ease', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                              <i className='bx bx-trending-up' style={{ fontSize: '1.2rem', color: '#8b5cf6' }}></i> Promover a Sec.
                            </Link>
                          )}

                          <hr style={{ margin: '0.25rem 0', borderColor: '#e2e8f0', borderTop: 'none' }} />

                          <button onClick={() => { handleDelete(student.id); setOpenDropdownId(null); }} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#ef4444', fontSize: '0.9rem', transition: '0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <i className='bx bx-trash' style={{ fontSize: '1.2rem' }}></i> Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportExcel} className="btn" style={{ background: '#10b981', color: 'white' }}><i className='bx bx-spreadsheet'></i> Exportar Excel</button>
            <button onClick={handleExportPDF} className="btn" style={{ background: '#ef4444', color: 'white' }}><i className='bx bxs-file-pdf'></i> Exportar PDF</button>
          </div>

          <div style={{ textAlign: 'center', color: '#64748b' }}>
            Mostrando {studentsData.from || 0} a {studentsData.to || 0} de {studentsData.total}
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

      {/* MODAL PERFIL ALUMNO */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderTop: '5px solid #10B981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.4rem' }}><i className='bx bx-user-circle' style={{ color: '#10B981', marginRight: '8px' }}></i>Perfil de Estudiante</h3>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 8px', fontSize: '1.1rem' }}><b>{selectedStudent.apellido_paterno} {selectedStudent.apellido_materno}, {selectedStudent.nombres}</b></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                <div><span style={{ color: '#64748b' }}>Cód. Estudiantil:</span> {selectedStudent.codigo_estudiante || 'No asignado'}</div>
                <div><span style={{ color: '#64748b' }}>DNI:</span> {selectedStudent.dni || 'Extranjero (Sin Doc)'}</div>
                <div><span style={{ color: '#64748b' }}>Sexo:</span> {selectedStudent.sexo === 'H' ? 'Masculino' : selectedStudent.sexo === 'M' ? 'Femenino' : 'No registrado'}</div>
                <div><span style={{ color: '#64748b' }}>Año Curricular:</span> {selectedStudent.anioActual || 'No registrado'}</div>
                <div><span style={{ color: '#64748b' }}>Grado:</span> {selectedStudent.gradoNombre || 'No asignado'}</div>
                <div><span style={{ color: '#64748b' }}>Sección:</span> {selectedStudent.seccionActual || 'N/A'}</div>
                <div><span style={{ color: '#64748b' }}>Est. Matrícula:</span> {selectedStudent.estado_matricula || 'No registrada'}</div>
                <div><span style={{ color: '#64748b' }}>Tipo Vacante:</span> {selectedStudent.tipo_vacante || 'No especificado'}</div>
                <div><span style={{ color: '#64748b' }}>Celular:</span> {selectedStudent.celular || 'No registrado'}</div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>Domicilio:</span> {selectedStudent.domicilio || 'No especificado'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px', color: '#475569' }}>Apoderados:</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', color: '#475569' }}>
                <li><b>Padre:</b> {selectedStudent.padre_nombres || 'No especificado'}</li>
                <li><b>Madre:</b> {selectedStudent.madre_nombres || 'No especificada'}</li>
              </ul>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '15px', borderRadius: '8px', color: '#92400e' }}>
              <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}><i className='bx bx-info-circle'></i> Información Médica / Conductual:</p>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{selectedStudent.reporte || 'El estudiante no presenta observaciones médicas ni conductuales registradas en su ficha actual.'}</p>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '6px' }}>Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL MATRÍCULA MASIVA */}
      {bulkModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', borderTop: '5px solid #3b82f6' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1e293b' }}><i className='bx bx-trending-up' style={{ color: '#3b82f6', marginRight: '5px' }}></i> Matrícula Masiva</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Vas a promover / matricular firmemente a <b>{selectedIds.length}</b> alumnos marcados simultáneamente.</p>
            <form onSubmit={handleBulkEnroll}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Año Escolar destino</label>
                <select className="form-control" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={bulkForm.anio_id} onChange={e => setBulkForm({ ...bulkForm, anio_id: e.target.value })} required>
                  <option value="">Selecciona año...</option>
                  {anios?.map(a => <option key={a.id} value={a.id}>{a.anio}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nivel destino</label>
                <select className="form-control" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={bulkForm.nivel_id} onChange={e => setBulkForm({ ...bulkForm, nivel_id: e.target.value, grado_id: '', seccion_id: '' })} required>
                  <option value="">Selecciona nivel...</option>
                  {niveles?.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Grado destino</label>
                <select className="form-control" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={bulkForm.grado_id} onChange={e => setBulkForm({ ...bulkForm, grado_id: e.target.value, seccion_id: '' })} required disabled={!bulkForm.nivel_id}>
                  <option value="">Selecciona grado...</option>
                  {grados?.filter(g => g.nivel_id == bulkForm.nivel_id).map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sección destino</label>
                <select className="form-control" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={bulkForm.seccion_id} onChange={e => setBulkForm({ ...bulkForm, seccion_id: e.target.value })} required disabled={!bulkForm.grado_id}>
                  <option value="">Selecciona sección...</option>
                  {secciones?.filter(s => s.grado_id == bulkForm.grado_id).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBulkModalOpen(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Procesar Selección</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openDropdownId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setOpenDropdownId(null)}></div>
      )}

      <ConfirmModal {...confirmConfig} />
    </div>
  );
}
