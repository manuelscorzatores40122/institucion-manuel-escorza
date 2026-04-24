'use client';
// machaca la logica de los apoderados esta incompleta completa la logica de los apoderados
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchGuardiansData, deleteGuardian } from './actions';
import ConfirmModal from '../ConfirmModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

export default function GuardiansIndexClient() {
  const [data, setData] = useState({ data: [], total: 0, from: 0, to: 0, last_page: 1, links: [] });
  const [loading, setLoading] = useState(true);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  const [filters, setFilters] = useState({ search: '', page: 1 });
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    let debounceTimer = setTimeout(() => {
      loadData(filters);
    }, 400);
    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadData = async (activeFilters) => {
    setLoading(true);
    const result = await fetchGuardiansData(activeFilters);
    setData(result);
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };
  // tambien terminas la logica de eliminar apoderado
  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Apoderado',
      message: '¿Eliminar apoderado permanentemente? Se desvinculará de sus estudiantes.',
      isDanger: true,
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        await deleteGuardian(id);
        loadData(filters);
      },
      onCancel: () => setConfirmConfig({ isOpen: false })
    });
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const allDataRes = await fetchGuardiansData({ ...filters, exportAll: true });
      const exportData = allDataRes.data;
      
      const doc = new jsPDF('landscape');
      
      const groups = {};
      exportData.forEach(g => {
        let grados = [];
        if (g.estudiantes && g.estudiantes.length > 0) {
          g.estudiantes.forEach(e => {
            const gradoName = e.gradoNombre || 'Sin Grado Asignado';
            if (!grados.includes(gradoName)) grados.push(gradoName);
          });
        } else {
          grados.push('Sin Estudiantes Asignados');
        }

        grados.forEach(grado => {
          if (!groups[grado]) groups[grado] = [];
          groups[grado].push(g);
        });
      });
      const groupKeys = Object.keys(groups).sort();

      if (groupKeys.length === 0) {
        doc.setFontSize(16);
        doc.text('Directorio Oficial de Apoderados', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text('No hay datos para exportar.', 14, 38);
      }

      groupKeys.forEach((grado, idx) => {
        if (idx > 0) doc.addPage();
        
        doc.setFontSize(16);
        doc.text(`Directorio de Apoderados - ${grado}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

        autoTable(doc, {
          startY: 35,
          head: [['DNI', 'Apellidos y Nombres', 'Tel/Celular', 'Correo', 'Alumno(s) a Cargo', 'Vínculo']],
          body: groups[grado].map(g => [
            g.dni,
            `${g.apellido_paterno} ${g.apellido_materno}, ${g.nombres}`,
            g.celular || '-',
            g.correo || '-',
            g.estudiantes ? g.estudiantes.map(e => e.nombres).join(', ') : 'Ninguno',
            g.parentesco ? g.parentesco.replace('_', ' ') : 'Otro'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [15, 118, 110] } // Teal color to match SAAS buttons
        });
      });

      doc.save(`apoderados_${new Date().getTime()}.pdf`);
    } catch(err) {
      Swal.fire({ icon: 'error', title: 'Error', text: "Error exportando PDF: " + err.message });
    }
    setLoading(false);
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const allDataRes = await fetchGuardiansData({ ...filters, exportAll: true });
      const exportData = allDataRes.data;

      const rows = exportData.map(g => ({
        'DNI': g.dni,
        'Apellidos': `${g.apellido_paterno} ${g.apellido_materno}`,
        'Nombres': g.nombres,
        'Parentesco': g.parentesco,
        'Celular': g.celular || '',
        'Correo': g.correo || '',
        'Domicilio': g.domicilio || '',
        'Estudiantes a Cargo': g.estudiantes ? g.estudiantes.map(e => e.nombres).join(', ') : 'Ninguno'
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Apoderados");

      XLSX.writeFile(workbook, `apoderados_${new Date().getTime()}.xlsx`);
    } catch(err) {
      Swal.fire({ icon: 'error', title: 'Error', text: "Error exportando Excel: " + err.message });
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 id="mainTitle">Gestión de Familiares y Apoderados</h2>
        <div className="d-flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
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
          <Link href="/guardians/create" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', height: '100%' }}>
            <i className='bx bx-plus'></i> Registrar Apoderado
          </Link>
        </div>
      </div>

      <div className="filters-container mb-4 p-3" style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', padding: '1rem' }}>
        <form className="grid grid-cols-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }}>
          <div className="form-group mb-0">
            <label className="form-label"><i className='bx bx-search'></i> Búsqueda por texto</label>
            <input type="text" name="search" className="form-control" placeholder="Buscar por DNI, Nombres o Apellidos..." value={filters.search} onChange={handleFilterChange} autoComplete="off" />
          </div>
        </form>
      </div>

      <div className="table-responsive">
        {loading && (
          <div className="text-center p-4" style={{ textAlign: 'center', padding: '1rem' }}>
            <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
            <p>Cargando datos...</p>
          </div>
        )}

        {!loading && (
          <>
            <table className="table desktop-view-only" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px' }}>DNI</th>
                <th style={{ padding: '10px' }}>Apoderado</th>
                <th style={{ padding: '10px' }}>Contacto</th>
                <th style={{ padding: '10px' }}>Parentesco</th>
                <th style={{ padding: '10px' }}>Estudiantes Vinculados</th>
                <th style={{ padding: '10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No se encontraron apoderados registrados.</td>
                </tr>
              ) : (
                data.data.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}><b>{item.dni}</b></td>
                    <td style={{ padding: '10px' }}>{item.apellido_paterno} {item.apellido_materno}, {item.nombres}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontSize: '0.85rem' }}><i className='bx bx-phone'></i> {item.celular || '-'}</div>
                      <div style={{ fontSize: '0.85rem' }}><i className='bx bx-envelope'></i> {item.correo || '-'}</div>
                    </td>
                    <td style={{ padding: '10px' }}>{item.parentesco || 'Otro'}</td>
                    <td style={{ padding: '10px', fontSize: '0.85rem' }}>
                      {item.estudiantes?.length > 0 ? (
                        item.estudiantes.map(e => <div key={e.id}><i className='bx bxs-graduation'></i> {e.nombres} {e.apellido_paterno} ({e.dni})</div>)
                      ) : (
                        <span className="text-muted">No vinculados</span>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div className="d-flex gap-1" style={{ display: 'flex', gap: '4px' }}>
                        <Link href={`/guardians/create?id=${item.id}`} className="btn btn-sm" style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Editar">
                          <i className='bx bx-edit'></i>
                        </Link>
                        <button className="btn btn-danger btn-sm" style={{ background: '#dc2626', color: 'white' }} title="Eliminar" onClick={() => handleDelete(item.id)}>
                          <i className='bx bx-trash'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* MOBILE VIEW CARDS */}
          <div className="mobile-view-only">
            {data.data.length === 0 ? (
              <div className="text-center p-4">No se encontraron apoderados registrados.</div>
            ) : (
              data.data.map(item => (
                <div key={item.id} className="mobile-student-card">
                  <div className="mobile-sc-avatar" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    {item.nombres ? item.nombres.charAt(0) : ''}
                    {item.apellido_paterno ? item.apellido_paterno.charAt(0) : ''}
                  </div>
                  <div className="mobile-sc-info">
                    <h4>{item.apellido_paterno} {item.apellido_materno}, {item.nombres?.split(' ')[0]}</h4>
                    <p>DNI {item.dni} · {item.parentesco || 'Apoderado'}</p>
                    {item.estudiantes?.length > 0 ? (
                       <div className="mobile-sc-badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                         {item.estudiantes.length} Estudiante(s)
                       </div>
                    ) : (
                       <div className="mobile-sc-badge" style={{ color: '#ea580c', background: '#fff7ed', border: '1px solid #ffedd5' }}>Sin Estudiantes</div>
                    )}
                  </div>
                  <div className="mobile-sc-actions">
                    <span className="mobile-sc-phone">{item.celular || '-'}</span>
                    <Link href={`/guardians/create?id=${item.id}`} className="mobile-sc-more" style={{ textDecoration: 'none' }}>✎</Link>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div></div>

          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Mostrando {data.from || 0} a {data.to || 0} de {data.total}
          </div>
          <div className="d-flex gap-1" style={{ display: 'flex', gap: '4px' }}>
            {(() => {
              const currentPage = parseInt(filters.page) || 1;
              const lastPage = data.last_page || 1;
              let pages = [];
              if (lastPage <= 7) {
                for (let i = 1; i <= lastPage; i++) pages.push(i);
              } else {
                if (currentPage <= 4) {
                  pages = [1, 2, 3, 4, 5, '...', lastPage];
                } else if (currentPage >= lastPage - 3) {
                  pages = [1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
                } else {
                  pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage];
                }
              }
              return (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-sm" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    style={{ background: 'white', color: currentPage === 1 ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.6rem', fontWeight: '600', transition: 'all 0.2s', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <i className='bx bx-chevron-left' style={{ fontSize: '1.2rem' }}></i>
                  </button>
                  {pages.map((p, idx) => (
                    <button 
                      key={idx} 
                      className="btn btn-sm"
                      disabled={p === '...'}
                      onClick={() => p !== '...' && handlePageChange(p)}
                      style={{
                        background: p === currentPage ? 'linear-gradient(135deg, #0f766e, #14b8a6)' : p === '...' ? 'transparent' : 'white',
                        color: p === currentPage ? 'white' : '#475569',
                        border: p === '...' ? 'none' : p === currentPage ? 'none' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        minWidth: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: p === currentPage ? '700' : '600',
                        boxShadow: p === currentPage ? '0 4px 10px -2px rgba(15, 118, 110, 0.5)' : 'none',
                        transition: 'all 0.2s',
                        cursor: p === '...' ? 'default' : 'pointer'
                      }}
                      onMouseOver={e => { if (p !== '...' && p !== currentPage) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseOut={e => { if (p !== '...' && p !== currentPage) e.currentTarget.style.background = 'white'; }}
                    >
                      {p}
                    </button>
                  ))}
                  <button 
                    className="btn btn-sm" 
                    disabled={currentPage === lastPage}
                    onClick={() => handlePageChange(currentPage + 1)}
                    style={{ background: 'white', color: currentPage === lastPage ? '#cbd5e1' : '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.6rem', fontWeight: '600', transition: 'all 0.2s', cursor: currentPage === lastPage ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <i className='bx bx-chevron-right' style={{ fontSize: '1.2rem' }}></i>
                  </button>
                </div>
              );
            })()}
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
