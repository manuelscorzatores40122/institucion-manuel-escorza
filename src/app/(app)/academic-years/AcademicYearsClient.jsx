'use client';

import { useState } from 'react';
import { createAcademicYear, deleteAcademicYear } from './actions';
import ConfirmModal from '../ConfirmModal';
import AlertModal from '../AlertModal';

export default function AcademicYearsClient({ years }) {
  const [newYear, setNewYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newYear || isNaN(newYear) || newYear.length !== 4) {
      setAlertConfig({ isOpen: true, title: 'Error', message: 'crear año escolar).', isDanger: true });
      return;
    }

    try {
      setIsSubmitting(true);
      await createAcademicYear(newYear);
      setNewYear('');
      setAlertConfig({ isOpen: true, title: 'Éxito', message: 'Año escolar creado exitosamente.' });
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Error', message: err.message, isDanger: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteData(id);
  };

  const executeDelete = async () => {
    try {
      await deleteAcademicYear(deleteData);
      setAlertConfig({ isOpen: true, title: 'Éxito', message: 'Año escolar eliminado.' });
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Error', message: err.message, isDanger: true });
    } finally {
      setDeleteData(null);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title"><i className='bx bx-calendar'></i> Gestión de Años Escolares</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Abrir Nuevo Año</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Año Escolar</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Crear nuevo año escolar"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mt-2" disabled={isSubmitting}>
                <i className='bx bx-plus'></i> Crear Año
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y, index) => (
                    <tr key={y.id}>
                      <td style={{ fontWeight: 'bold' }}>{y.anio}</td>
                      <td className="text-center">
                        {index === 0 ? (
                          <span className="badge badge-success">Actual / Próximo</span>
                        ) : (
                          <span className="badge badge-secondary">Pasado</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-danger ml-2" onClick={() => confirmDelete(y.id)} title="Eliminar Año">
                          <i className='bx bx-trash'></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {years.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">No hay años escolares registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteData}
        title="Eliminar Año Escolar"
        message="¿Está seguro que desea eliminar este año escolar? Solo se puede eliminar si no tiene matrículas."
        onConfirm={executeDelete}
        onCancel={() => setDeleteData(null)}
      />
      <AlertModal
        {...alertConfig}
        onOk={() => setAlertConfig({ isOpen: false })}
      />
    </>
  );
}
