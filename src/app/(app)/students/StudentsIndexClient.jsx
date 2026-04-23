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
    orphans: '0',
    anio_id: '',
    nivel_id: '',
    grado_id: '',
    seccion_id: '',
    page: 1,
    incomplete: '0'
  });

  const { anios, niveles, grados, secciones } = initialFiltersParams;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('orphans') === '1') {
        setFilters(p => ({...p, orphans: '1'}));
      }
      if (params.get('incomplete') === '1') {
        setFilters(p => ({...p, incomplete: '1'}));
      }
    }
  }, []);

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

      const groups = {};
      exportData.forEach(st => {
        const grado = st.gradoActual || 'Sin Grado Asignado';
        if (!groups[grado]) groups[grado] = [];
        groups[grado].push(st);
      });
      const groupKeys = Object.keys(groups).sort();

      if (groupKeys.length === 0) {
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text('No hay datos para exportar.', 14, 38);
      }

      groupKeys.forEach((grado, idx) => {
        if (idx > 0) doc.addPage();
        
        doc.setFontSize(16);
        doc.text(`${title} - ${grado}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

        autoTable(doc, {
          startY: 35,
          head: [['DNI', 'Apellidos y Nombres', 'Celular', 'Apoderados (Nombre)', 'Matrícula (Referencial)']],
          body: groups[grado].map(st => [
            st.dni,
            `${st.apellido_paterno} ${st.apellido_materno}, ${st.nombres}`,
            st.celular || 'N/A',
            (st.padre_nombres || st.madre_nombres) ? `${st.padre_nombres || ''} / ${st.madre_nombres || ''}` : 'No',
            st.gradoActual || 'Sin matricular'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] } // verde primary
        });
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
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 id="mainTitle" style={{ margin: 0, fontSize: '1.4rem' }}>{isEgresadosView ? 'Estudiantes Egresados' : 'Estudiantes Activos'}</h2>
        <div className="d-flex gap-2 header-actions-mobile" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button id="toggleEgresadosBtn" className="btn" style={{ background: isEgresadosView ? 'var(--primary)' : 'var(--text-color)', color: 'white' }} onClick={toggleEgresados}>
            {isEgresadosView ? <><i className='bx bx-arrow-back'></i> Volver a Activos</> : <><i className='bx bxs-graduation'></i> Ver Egresados</>}
          </button>
          {!isEgresadosView && (
            <button className="btn" style={{ background: isSelectionMode ? '#ef4444' : '#3b82f6', color: 'white' }} onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}>
              <i className={isSelectionMode ? 'bx bx-x' : 'bx bx-check-double'}></i> {isSelectionMode ? 'Cancelar Selección' : 'Selección Múltiple'}
            </button>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'export' ? null : 'export')} 
                className="btn btn-sm" 
                style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', height: '100%' }}
              >
                <i className='bx bx-export'></i> Exportar <i className='bx bx-chevron-down'></i>
              </button>
              {openDropdownId === 'export' && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '170px', padding: '0.4rem 0', flexDirection: 'column', display: 'flex', overflow: 'hidden' }}>
                  <button onClick={() => { handleExportExcel(); setOpenDropdownId(null); }} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#0f766e', fontSize: '0.85rem', fontWeight: '600' }} onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <i className='bx bx-spreadsheet' style={{ fontSize: '1.2rem', color: '#10b981' }}></i> Excel (.xlsx)
                  </button>
                  <button onClick={() => { handleExportPDF(); setOpenDropdownId(null); }} style={{ width: '100%', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: '#b91c1c', fontSize: '0.85rem', fontWeight: '600' }} onMouseOver={e => e.currentTarget.style.background = '#fef2f2'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <i className='bx bxs-file-pdf' style={{ fontSize: '1.2rem', color: '#ef4444' }}></i> PDF Documento
                  </button>
                </div>
              )}
            </div>

            {!isEgresadosView && (
              <Link href="/students/create" className="btn btn-sm btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', height: '100%' }}>
                <i className='bx bx-plus'></i> Nuevo
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="filters-container mb-4 p-3" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', padding: '1rem', overflowX: 'auto' }}>
        <form id="filterForm" className="grid grid-cols-4" style={{ display: 'grid', gap: '1rem' }}>
          <div className="form-group mb-0" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label"><i className='bx bx-search'></i> Búsqueda por texto</label>
            <input type="text" name="search" className="form-control" placeholder="Buscar por DNI, Cód. Estudiante, Nombres, Apellidos" value={filters.search} onChange={handleFilterChange} autoComplete="off" />
            {filters.orphans === '1' && (
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  <i className='bx bx-error' style={{ marginRight: '4px' }}></i> Filtrando: Sin Apoderado
                  <i className='bx bx-x' style={{ marginLeft: '6px', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => {
                    setFilters(p => ({...p, orphans: '0'}));
                    window.history.replaceState({}, '', window.location.pathname);
                  }}></i>
                </span>
              </div>
            )}
            {filters.incomplete === '1' && (
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                  <i className='bx bx-file-blank' style={{ marginRight: '4px' }}></i> Filtrando: Falta Documentos
                  <i className='bx bx-x' style={{ marginLeft: '6px', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => {
                    setFilters(p => ({...p, incomplete: '0'}));
                    window.history.replaceState({}, '', window.location.pathname);
                  }}></i>
                </span>
              </div>
            )}
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

          <div></div>

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

                  {/* MODAL PERFIL ESTUDIANTE - MODERN SAAS */}
      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '850px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', maxHeight: '95vh', overflow: 'hidden' }}>
            
            {/* Header Vívido pero Profesional */}
            <div style={{ background: 'linear-gradient(to right, #1e3a8a, #3b82f6)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}>
                  {selectedStudent.nombres.charAt(0)}{selectedStudent.apellido_paterno.charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '0.01em' }}>{selectedStudent.apellido_paterno} {selectedStudent.apellido_materno}, {selectedStudent.nombres}</h2>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.85rem', fontWeight: '500', opacity: 0.9 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className='bx bx-id-card'></i> {selectedStudent.dni || 'Sin Documento'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className='bx bx-purchase-tag'></i> Cód: {selectedStudent.codigo_estudiante || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'} title="Cerrar"><i className='bx bx-x' style={{ fontSize: '1.4rem' }}></i></button>
            </div>

            {/* Content Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Panel 1: Datos Personales */}
                <div style={{ background: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px', borderRadius: '6px', display: 'flex' }}><i className='bx bx-user'></i></div>
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-3" style={{ gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Edad</label>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{getEdad(selectedStudent.fecha_nacimiento)}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Género</label>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.sexo === 'H' ? 'Masculino' : selectedStudent.sexo === 'M' ? 'Femenino' : selectedStudent.sexo || '-'}</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Celular / Contacto</label>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.celular || '-'}{selectedStudent.celular_secundario ? ` / ${selectedStudent.celular_secundario}` : ''}</div>
                    </div>
                    <div style={{ gridColumn: 'span 3' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Lugar de Nacimiento</label>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.departamento_nacimiento ? `${selectedStudent.departamento_nacimiento} / ${selectedStudent.provincia_nacimiento} / ${selectedStudent.distrito_nacimiento}` : '-'}</div>
                    </div>
                    <div style={{ gridColumn: 'span 3' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Dirección Domiciliaria</label>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.domicilio || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Grid para Panel Académico & Apoderados Resumen */}
                <div className="grid grid-cols-2" style={{ gap: '20px' }}>
                  
                  {/* Académico */}
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ background: '#f3e8ff', color: '#7e22ce', padding: '6px', borderRadius: '6px', display: 'flex' }}><i className='bx bx-book-open'></i></div>
                      Perfil Académico
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Estado Matrícula</label>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-block' }}>{selectedStudent.estado_matricula || 'No registrada'}</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Grado Asignado</label>
                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.gradoNombre || 'Sin asignar'}</div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Tipo de Vacante / Beneficio</label>
                        <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.tipo_vacante || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Familia */}
                  <div style={{ background: '#ffffff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: '#ffedd5', color: '#c2410c', padding: '6px', borderRadius: '6px', display: 'flex' }}><i className='bx bx-group'></i></div>
                        Familiares
                      </div>
                      <button onClick={() => setShowGuardiansProfile(true)} style={{ background: '#f1f5f9', color: '#3b82f6', border: 'none', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#e0f2fe'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}>Ver Detalles</button>
                    </h3>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Ampliación Familiar</label>
                      <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{selectedStudent.vive_con ? `Vive con: ${selectedStudent.vive_con}` : 'No especificado'}</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedStudent.apoderadosList && selectedStudent.apoderadosList.length > 0 ? selectedStudent.apoderadosList.slice(0, 3).map(apod => (
                        <div key={apod.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                          <i className='bx bx-check-circle' style={{ color: '#10b981' }}></i>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600' }}>{[apod.apellido_paterno, apod.nombres].filter(Boolean).join(' ')}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>{apod.parentesco ? apod.parentesco.replace('_', ' ') : '-'}</div>
                          </div>
                        </div>
                      )) : (
                        <div style={{ textAlign: 'center', padding: '10px', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Sin apoderados.</div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Panel Observaciones */}
                <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #fde68a' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ background: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '6px', display: 'flex' }}><i className='bx bx-plus-medical'></i></div>
                    Control Médico y Comentarios
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: '#92400e', lineHeight: '1.5' }}>
                    {selectedStudent.reporte ? selectedStudent.reporte : <span style={{ opacity: 0.7 }}>Ninguna observación conductual o médica ha sido anexada.</span>}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 32px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button onClick={() => setSelectedStudent(null)} className="btn hover:bg-gray-100" style={{ background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', fontWeight: '600', padding: '8px 24px', borderRadius: '8px' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERFIL APODERADOS - MODERN SAAS */}
      {showGuardiansProfile && selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100005, padding: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '850px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', maxHeight: '95vh', overflow: 'hidden' }}>
            
            {/* Header Vívido pero Profesional */}
            <div style={{ background: 'linear-gradient(to right, #0f766e, #14b8a6)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', display: 'flex' }}><i className='bx bx-group'></i></div>
                  Contactos de Emergencia y Titulares
                </h2>
                <div style={{ marginTop: '6px', fontSize: '0.9rem', fontWeight: '500', opacity: 0.9 }}>
                   Asociados al alumno: <b>{selectedStudent.apellido_paterno} {selectedStudent.nombres}</b>
                </div>
              </div>
              <button onClick={() => setShowGuardiansProfile(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'} title="Cerrar"><i className='bx bx-x' style={{ fontSize: '1.4rem' }}></i></button>
            </div>

            {/* Content Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '32px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {selectedStudent.apoderadosList && selectedStudent.apoderadosList.length > 0 ? (
                  selectedStudent.apoderadosList.map((apod, idx) => (
                    <div key={apod.id} style={{ background: '#ffffff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <div style={{ background: '#f1f5f9', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <i className='bx bx-id-card' style={{ marginRight: '6px', color: '#0f766e' }}></i> {apod.parentesco ? apod.parentesco.replace('_', ' ') : 'Contacto'} Titular
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', background: 'white', padding: '2px 8px', borderRadius: '20px', border: '1px solid #cbd5e1' }}>#{idx + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-2" style={{ padding: '20px', gap: '15px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Apellidos y Nombres Completos</label>
                          <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {[apod.apellido_paterno, apod.apellido_materno, apod.nombres].filter(Boolean).join(' ') || '-'}
                            {((apod.parentesco === 'padre' && (selectedStudent.vive_con === 'Ambos padres' || selectedStudent.vive_con === 'Solo Padre')) || 
                              (apod.parentesco === 'madre' && (selectedStudent.vive_con === 'Ambos padres' || selectedStudent.vive_con === 'Solo Madre'))) && (
                              <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}><i className='bx bx-home-alt-2'></i> Vive con el estudiante</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Rol en Institución</label>
                          <div style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: '600', background: '#ccfbf1', display: 'inline-block', padding: '2px 10px', borderRadius: '12px' }}>{apod.es_apoderado_principal ? 'Apoderado Legal' : 'Familiar Referencial'}</div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Doc. Identidad DNI</label>
                          <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{apod.dni || 'Sin Documento'}</div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Teléfono Celular</label>
                          <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{apod.celular || '-'}</div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Correo Electrónico</label>
                          <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{apod.correo || '-'}</div>
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Dirección de Residencia Registrada</label>
                          <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}>{apod.domicilio || '-'}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem', color: '#94a3b8' }}><i className='bx bx-user-x'></i></div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Lista Vacía</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>El estudiante no cuenta con tutores asignados.</p>
                  </div>
                )}

              </div>
            </div>

             {/* Footer */}
             <div style={{ padding: '16px 32px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button onClick={() => setShowGuardiansProfile(false)} className="btn" style={{ background: '#0f766e', color: 'white', border: 'none', fontWeight: '600', padding: '8px 24px', borderRadius: '8px' }}>Regresar</button>
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
