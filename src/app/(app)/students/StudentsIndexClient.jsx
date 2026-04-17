'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchStudentsData, deleteStudent, toggleEgresadoStatus, bulkEnrollStudents, bulkDeleteStudents } from './actions';
import ConfirmModal from '../ConfirmModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

export default function StudentsIndexClient({ initialFiltersParams }) {
  const [studentsData, setStudentsData] = useState({ data: [], total: 0, from: 0, to: 0, last_page: 1, links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showGuardiansProfile, setShowGuardiansProfile] = useState(false);
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
      Swal.fire({ icon: 'warning', title: 'Atención', text: 'Faltan datos requeridos (Año, Grado o Sección)' });
      return;
    }
    setLoading(true);
    setBulkModalOpen(false);
    try {
      await bulkEnrollStudents(selectedIds, bulkForm.anio_id, bulkForm.grado_id, bulkForm.seccion_id);
      setSelectedIds([]);
      loadData(filters);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return Swal.fire({ icon: 'warning', text: 'No hay estudiantes seleccionados.' });
    
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Múltiples Estudiantes',
      message: `¿Estás completamente seguro de eliminar a estos ${selectedIds.length} estudiantes? Esta acción eliminará permanentemente todos sus registros y matrículas y NO se puede deshacer.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await bulkDeleteStudents(selectedIds);
          setSelectedIds([]);
          setConfirmConfig({ isOpen: false });
          loadData(filters);
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: `Error eliminando alumnos: ${err.message}` });
          setLoading(false);
        }
      },
      onCancel: () => setConfirmConfig({ isOpen: false })
    });
  };

  // UTILIDADES
  const getEdad = (fecha) => {
    if (!fecha) return 'No registrada';
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad + ' años';
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
      if (s) title += ` - Secc. ${s.nombre}`;
    }
    return title;
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const allDataRes = await fetchStudentsData({ ...filters, exportAll: true });
      const exportData = allDataRes.data;
      
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
        body: exportData.map(st => [
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
    } catch(err) {
      Swal.fire({ icon: 'error', title: 'Error', text: "Error exportando PDF: " + err.message });
    }
    setLoading(false);
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const allDataRes = await fetchStudentsData({ ...filters, exportAll: true });
      const exportData = allDataRes.data;
      
      const title = generateExportTitle();

      const rows = exportData.map(st => ({
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
    } catch(err) {
      Swal.fire({ icon: 'error', title: 'Error', text: "Error exportando Excel: " + err.message });
    }
    setLoading(false);
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!isEgresadosView && (
              <Link href="/students/create" className="btn btn-sm btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className='bx bx-plus'></i> Nuevo
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="filters-container mb-4 p-3" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', padding: '1rem' }}>
        <form id="filterForm" className="grid grid-cols-1 md-grid-cols-4 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
          <div className="form-group mb-0" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label"><i className='bx bx-search'></i> Búsqueda por texto</label>
            <input type="text" name="search" className="form-control" placeholder="Buscar por DNI, Cód. Estudiante, Nombres, Apellidos" value={filters.search} onChange={handleFilterChange} autoComplete="off" />
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Año Escolar</label>
            <select name="anio_id" className="form-control" value={filters.anio_id} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {anios?.map(a => <option key={a.id} value={a.id}>{a.anio}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Nivel</label>
            <select name="nivel_id" className="form-control" value={filters.nivel_id} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {niveles?.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Grado</label>
            <select name="grado_id" className="form-control" value={filters.grado_id} onChange={handleFilterChange} disabled={!filters.nivel_id}>
              <option value="">Todos</option>
              {grados?.filter(g => g.nivel_id == filters.nivel_id).map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Sección</label>
            <select name="seccion_id" className="form-control" value={filters.seccion_id} onChange={handleFilterChange} disabled={!filters.grado_id}>
              <option value="">Todas</option>
              {secciones?.filter(s => s.grado_id == filters.grado_id).map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
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
              <button className="btn btn-sm" style={{ background: '#3b82f6', color: 'white' }} onClick={() => setBulkModalOpen(true)}>
                <i className='bx bx-book-bookmark'></i> Matricular {selectedIds.length} Alumnos
              </button>
              <button className="btn btn-sm" style={{ background: '#ef4444', color: 'white' }} onClick={handleBulkDelete}>
                <i className='bx bx-trash'></i> Eliminar {selectedIds.length} Alumnos
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '50%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '30%', height: '14px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '6px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                  <div style={{ width: '50%', height: '10px', background: '#f1f5f9', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                </div>
                <div style={{ width: '15%', height: '12px', background: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ width: '15%', height: '30px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              </div>
            ))}
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

                          <Link href={`/students/create?id=${student.id}`} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#475569', fontSize: '0.9rem', transition: '0.2s ease', textDecoration: 'none' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '0', borderRadius: '16px', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

            {/* Cabecera del Modal */}
            <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: '1.5rem', position: 'relative', color: 'white' }}>
              <button onClick={() => setSelectedStudent(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                <i className='bx bx-x' style={{ fontSize: '1.2rem' }}></i>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <i className='bx bxs-user'></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600' }}>{selectedStudent.nombres}</h3>
                  <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '1.05rem' }}>{selectedStudent.apellido_paterno} {selectedStudent.apellido_materno}</p>
                </div>
              </div>
            </div>

            {/* Contenido Scrolleable */}
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>

              {/* Sección: Datos Personales */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}>
                  <i className='bx bx-id-card' style={{ color: '#3b82f6' }}></i> Información Personal
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>DNI</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.dni || 'Extranjero (Sin Doc)'}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Edad</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{getEdad(selectedStudent.fecha_nacimiento)}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Sexo</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.sexo === 'H' ? 'Hombre' : selectedStudent.sexo === 'M' ? 'Mujer' : selectedStudent.sexo || 'No registrado'}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Celular</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.celular || 'No registrado'}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', gridColumn: 'span 2' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Lugar de Nacimiento</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.departamento_nacimiento ? `${selectedStudent.departamento_nacimiento} - ${selectedStudent.provincia_nacimiento} - ${selectedStudent.distrito_nacimiento}` : 'No especificado'}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', gridColumn: 'span 2' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Domicilio</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.domicilio || 'No especificado'}</div></div>
                </div>
              </div>

              {/* Sección: Datos Académicos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0' }}>
                  <i className='bx bx-book-open' style={{ color: '#8b5cf6' }}></i> Información Académica
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.95rem' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Cód. Estudiantil</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.codigo_estudiante || 'No asignado'}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Estado Matrícula</span> <div style={{ fontWeight: '600', color: '#0f172a' }}><span style={{ display: 'inline-block', padding: '2px 8px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontSize: '0.85rem' }}>{selectedStudent.estado_matricula || 'No registrada'}</span></div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Grado Actual</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.gradoNombre || 'No asignado'}</div></div>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}><span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Tipo Vacante</span> <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedStudent.tipo_vacante || 'No especificado'}</div></div>
                </div>
              </div>

              {/* Sección: Apoderados */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 1rem 0', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><i className='bx bx-group' style={{ color: '#f59e0b' }}></i> Apoderados</div>
                  <button onClick={() => setShowGuardiansProfile(true)} className="btn btn-sm" style={{ background: '#f8fafc', color: '#3b82f6', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>
                    <i className='bx bx-window-open'></i> Ver Perfil Completo
                  </button>
                </h4>
                {selectedStudent.vive_con && (
                  <div style={{ background: '#fef3c7', padding: '8px 15px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.9rem', color: '#92400e', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <i className='bx bx-home-heart'></i> Vive con: {selectedStudent.vive_con}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><i className='bx bx-male'></i></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Padre</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#0f172a' }}>{selectedStudent.padre_nombres ? `${selectedStudent.padre_nombres} ${selectedStudent.padre_apellidos || ''}` : 'No especificado'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><i className='bx bx-female'></i></div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Madre</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#0f172a' }}>{selectedStudent.madre_nombres ? `${selectedStudent.madre_nombres} ${selectedStudent.madre_apellidos || ''}` : 'No especificada'}</div>
                    </div>
                  </div>
                  {selectedStudent.apoderado_alterno_nombres && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}><i className='bx bx-user-pin'></i></div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '500' }}>Apoderado Alterno / Extra</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#0f172a' }}>{selectedStudent.apoderado_alterno_nombres} {selectedStudent.apoderado_alterno_apellidos}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección: Médico */}
              {(selectedStudent.reporte) ? (
                <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '15px', borderRadius: '0 8px 8px 0', color: '#92400e' }}>
                  <p style={{ margin: '0 0 5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><i className='bx bx-plus-medical'></i> Reporte Médico / observaciones</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedStudent.reporte}</p>
                </div>
              ) : (
                <div style={{ background: '#f1f5f9', borderLeft: '4px solid #cbd5e1', padding: '15px', borderRadius: '0 8px 8px 0', color: '#475569' }}>
                  <p style={{ margin: '0 0 5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}><i className='bx bx-info-circle'></i> Reporte Médico / observaciones</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>Este estudiante no presenta observaciones médicas ni conductuales registradas.</p>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedStudent(null)} className="btn" style={{ background: '#0f172a', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>Cerrar Tarjeta</button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL PERFIL APODERADOS */}
      {showGuardiansProfile && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100005, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '0', borderRadius: '16px', maxWidth: '700px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '1.5rem', position: 'relative', color: 'white' }}>
              <button onClick={() => setShowGuardiansProfile(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                <i className='bx bx-x' style={{ fontSize: '1.2rem' }}></i>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  <i className='bx bx-group'></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600' }}>Perfil de Apoderados</h3>
                  <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '1.05rem' }}>Estudiante: {selectedStudent.nombres} {selectedStudent.apellido_paterno}</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Info Padre */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '600' }}>
                  <i className='bx bx-male' style={{ fontSize: '1.2rem', color: '#3b82f6' }}></i> Información del Padre
                </div>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>DNI</span><div style={{ fontWeight: '500' }}>{selectedStudent.padre_dni || 'No registrado'}</div></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Nombres</span><div style={{ fontWeight: '500' }}>{selectedStudent.padre_nombres || 'No registrado'}</div></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Apellidos</span><div style={{ fontWeight: '500' }}>{selectedStudent.padre_apellidos || 'No registrado'}</div></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Celular</span><div style={{ fontWeight: '500', color: selectedStudent.padre_celular ? '#2563eb' : 'inherit' }}>{selectedStudent.padre_celular ? <><i className='bx bx-phone' ></i> {selectedStudent.padre_celular}</> : 'No registrado'}</div></div>
                </div>
              </div>

              {/* Info Madre */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '600' }}>
                  <i className='bx bx-female' style={{ fontSize: '1.2rem', color: '#ec4899' }}></i> Información de la Madre
                </div>
                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>DNI</span><div style={{ fontWeight: '500' }}>{selectedStudent.madre_dni || 'No registrado'}</div></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Nombres</span><div style={{ fontWeight: '500' }}>{selectedStudent.madre_nombres || 'No registrado'}</div></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Apellidos</span><div style={{ fontWeight: '500' }}>{selectedStudent.madre_apellidos || 'No registrado'}</div></div>
                  <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Celular</span><div style={{ fontWeight: '500', color: selectedStudent.madre_celular ? '#2563eb' : 'inherit' }}>{selectedStudent.madre_celular ? <><i className='bx bx-phone' ></i> {selectedStudent.madre_celular}</> : 'No registrado'}</div></div>
                </div>
              </div>

              {/* Info Apoderado Alterno */}
              {selectedStudent.apoderado_alterno_nombres && (
                <div style={{ border: '1px solid #10b981', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px', color: '#065f46', fontWeight: '600' }}>
                    <i className='bx bx-user-pin' style={{ fontSize: '1.2rem', color: '#059669' }}></i> Información de Apoderado Alterno
                  </div>
                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>DNI</span><div style={{ fontWeight: '500' }}>{selectedStudent.apoderado_alterno_dni || 'No registrado'}</div></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Nombres</span><div style={{ fontWeight: '500' }}>{selectedStudent.apoderado_alterno_nombres || 'No registrado'}</div></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Apellidos</span><div style={{ fontWeight: '500' }}>{selectedStudent.apoderado_alterno_apellidos || 'No registrado'}</div></div>
                    <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Celular</span><div style={{ fontWeight: '500', color: selectedStudent.apoderado_alterno_celular ? '#2563eb' : 'inherit' }}>{selectedStudent.apoderado_alterno_celular ? <><i className='bx bx-phone' ></i> {selectedStudent.apoderado_alterno_celular}</> : 'No registrado'}</div></div>
                  </div>
                </div>
              )}

              {/* Info Apoderados Adicionales */}
              {selectedStudent.apoderadosList && selectedStudent.apoderadosList.length > 0 && (
                <>
                  <h4 style={{ color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>
                    <i className='bx bx-group' style={{ color: '#f59e0b' }}></i> Apoderados Vinculados Oficialmente
                  </h4>
                  {selectedStudent.apoderadosList.map(apod => (
                    <div key={apod.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: '600', textTransform: 'capitalize' }}>
                        <i className='bx bx-user-pin' style={{ fontSize: '1.2rem', color: '#10b981' }}></i> {apod.parentesco.replace('_', ' ')}
                      </div>
                      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>DNI</span><div style={{ fontWeight: '500' }}>{apod.dni || 'No registrado'}</div></div>
                        <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Nombres y Apellidos</span><div style={{ fontWeight: '500' }}>{apod.nombres} {apod.apellido_paterno} {apod.apellido_materno}</div></div>
                        <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Celular</span><div style={{ fontWeight: '500', color: apod.celular ? '#2563eb' : 'inherit' }}>{apod.celular ? <><i className='bx bx-phone' ></i> {apod.celular}</> : 'No registrado'}</div></div>
                        <div><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Correo Electrónico</span><div style={{ fontWeight: '500', color: apod.correo ? '#8b5cf6' : 'inherit' }}>{apod.correo ? <><i className='bx bx-envelope' ></i> {apod.correo}</> : 'No registrado'}</div></div>
                        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Domicilio</span><div style={{ fontWeight: '500' }}>{apod.domicilio || 'No especificado'}</div></div>
                      </div>
                    </div>
                  ))}
                </>
              )}

            </div>
            
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowGuardiansProfile(false)} className="btn" style={{ background: '#0f172a', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none' }}>Cerrar</button>
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
              <div className="form-group" style={{ marginBottom: '1rem' }}>
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
