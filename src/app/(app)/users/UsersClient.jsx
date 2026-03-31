'use client';
import { useState } from 'react';
import { deleteUser, saveUser } from './actions';
import ConfirmModal from '../ConfirmModal';
import AlertModal from '../AlertModal';

export default function UsersClient({ initialData }) {
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre_usuario: '', contrasena: '' });
  const [loading, setLoading] = useState(false);

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: '¿Eliminar usuario del sistema? Esta acción es irreversible.',
      isDanger: true,
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        try {
          await deleteUser(id);
          window.location.reload(); 
        } catch(err) {
          setAlertConfig({
            isOpen: true,
            title: 'Acción Denegada',
            message: 'Error: No se puede eliminar el superadministrador principal o ocurrió un fallo.',
            isDanger: true,
            onOk: () => setAlertConfig({ isOpen: false })
          });
        }
      },
      onCancel: () => setConfirmConfig({ isOpen: false })
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await saveUser(form.nombre_usuario, form.contrasena);
      setForm({ nombre_usuario: '', contrasena: '' });
      setShowModal(false);
      window.location.reload();
    } catch (err) {
      setAlertConfig({ isOpen: true, title: 'Error', message: err.message || 'Error al guardar', isDanger: true, onOk: () => setAlertConfig({isOpen:false}) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px' }}>
      <div className="card-header d-flex justify-between align-center" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Usuarios Administradores</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><i className='bx bx-plus'></i> Nuevo Usuario</button>
      </div>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th style={{ padding: '10px' }}>Nombre de Usuario</th>
            <th style={{ padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {initialData.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>{item.id}</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nombre_usuario}</td>
              <td style={{ padding: '10px' }}>
                <button className="btn btn-danger btn-sm" style={{ background: '#dc2626', color: 'white', opacity: item.id == 1 ? 0.5 : 1 }} disabled={item.id == 1} onClick={() => handleDelete(item.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Crear Nuevo Usuario</h3>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nombre de Usuario</label>
                <input required className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} value={form.nombre_usuario} onChange={e => setForm({...form, nombre_usuario: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Contraseña</label>
                <input required type="password" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} className="form-control" value={form.contrasena} onChange={e => setForm({...form, contrasena: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ background: '#e2e8f0', color: '#475569' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal {...confirmConfig} />
      <AlertModal {...alertConfig} />
    </div>
  );
}
