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
      doc.setFontSize(16);
      doc.text('Directorio Oficial de Apoderados', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

      autoTable(doc, {
        startY: 35,
        head: [['DNI', 'Apellidos y Nombres', 'Teléfono/Celular', 'Correo', 'Casos Asignados', 'Parentesco principal']],
        body: exportData.map(g => [
          g.dni,
          `${g.apellido_paterno} ${g.apellido_materno}, ${g.nombres}`,
          g.celular || '-',
          g.correo || '-',
          g.estudiantes ? g.estudiantes.map(e => e.nombres).join(', ') : 'Ninguno',
          g.parentesco
        ]),
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] } // orange primary
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
        <div className="d-flex gap-2">
          <Link href="/guardians/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>
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
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportExcel} className="btn" style={{ background: '#f59e0b', color: 'white' }}><i className='bx bx-spreadsheet'></i> Exportar Excel</button>
            <button onClick={handleExportPDF} className="btn" style={{ background: '#ef4444', color: 'white' }}><i className='bx bxs-file-pdf'></i> Exportar PDF</button>
          </div>

          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Mostrando {data.from || 0} a {data.to || 0} de {data.total}
          </div>
          <div className="d-flex gap-1" style={{ display: 'flex', gap: '4px' }}>
            {data.links.map((link, idx) => (
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
      <ConfirmModal {...confirmConfig} />
    </div>
  );
}
