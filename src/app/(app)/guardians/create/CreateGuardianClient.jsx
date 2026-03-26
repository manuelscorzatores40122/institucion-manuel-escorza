'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveGuardian, searchGuardianByDni } from '../actions';
import { searchStudentByDni } from '../../students/actions';

export default function CreateGuardianClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '', dni: '', apellido_paterno: '', apellido_materno: '', nombres: '', celular: '',
    correo: '', parentesco: '', vive_con_estudiante: false, domicilio: ''
  });
  
  const [estudianteIds, setEstudianteIds] = useState([]);
  const [estudiantesList, setEstudiantesList] = useState([]);

  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [showAutoFillAlert, setShowAutoFillAlert] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const [studentSearchUrl, setStudentSearchUrl] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    if (name === 'dni') {
      if (value.length >= 1) {
        searchGuardianByDni(value).then(g => {
           if(g) setSuggestions([g]);
           else setSuggestions([]);
        });
      } else {
        setSuggestions([]);
        setIsUpdateMode(false);
        setShowAutoFillAlert(false);
      }
    }
  };

  const handleSelectSuggestion = (g) => {
    setFormData({
      id: g.id,
      dni: g.dni || '',
      apellido_paterno: g.apellido_paterno || '',
      apellido_materno: g.apellido_materno || '',
      nombres: g.nombres || '',
      celular: g.celular || '',
      correo: g.correo || '',
      parentesco: g.parentesco || '',
      vive_con_estudiante: g.vive_con_estudiante == 1,
      domicilio: g.domicilio || ''
    });
    setEstudianteIds(g.estudiantes?.map(e => e.id) || []);
    setEstudiantesList(g.estudiantes || []);
    setSuggestions([]);
    setIsUpdateMode(true);
    setShowAutoFillAlert(true);
  };

  const handleStudentSearch = (e) => {
    const v = e.target.value;
    setStudentSearchUrl(v);
    if (v.length >= 1) {
      searchStudentByDni(v).then(s => setStudentSuggestions(s ? [s] : []));
    } else {
      setStudentSuggestions([]);
    }
  };

  const linkStudent = (student) => {
    if (!estudianteIds.includes(student.id)) {
      setEstudianteIds([...estudianteIds, student.id]);
      setEstudiantesList([...estudiantesList, student]);
    }
    setStudentSearchUrl('');
    setStudentSuggestions([]);
  };

  const removeLinkedStudent = (id) => {
    setEstudianteIds(prev => prev.filter(eid => eid !== id));
    setEstudiantesList(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveGuardian({ ...formData, estudiante_ids: estudianteIds });
    setTimeout(() => {
      router.push('/guardians');
    }, 300);
  };

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card-header d-flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Registrar Apoderado</h2>
        <Link href="/guardians" className="btn btn-sm" style={{ background: 'var(--text-muted)', color: 'white', textDecoration: 'none' }}>
          <i className='bx bx-arrow-back'></i> Volver
        </Link>
      </div>

      {showAutoFillAlert && (
        <div className="alert alert-info py-2" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #7DD3FC', marginBottom: '1.5rem', borderRadius: '4px', padding: '10px' }}>
          <i className='bx bx-info-circle'></i> <b>Apoderado encontrado.</b> Los datos se han autocompletado para su actualización.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="dni">DNI del Apoderado (Autocompleta apoderado existente)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" className="form-control" id="dni" name="dni" required autoComplete="off" placeholder="Ingresa DNI para buscar..." value={formData.dni} onChange={handleInputChange} />
              
              {suggestions.length > 0 && (
                <div className="autocomplete-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', padding: '10px', zIndex: 10 }}>
                  {suggestions.map(g => (
                    <div key={g.id} onClick={() => handleSelectSuggestion(g)} style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #eee' }}>
                      <b>{g.dni}</b> - {g.apellido_paterno} {g.apellido_materno}, {g.nombres}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="apellido_paterno">Apellido Paterno</label>
            <input type="text" className="form-control" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="apellido_materno">Apellido Materno</label>
            <input type="text" className="form-control" name="apellido_materno" value={formData.apellido_materno} onChange={handleInputChange} required />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="nombres">Nombres</label>
            <input type="text" className="form-control" name="nombres" value={formData.nombres} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="celular">Celular</label>
            <input type="text" className="form-control" name="celular" value={formData.celular} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="correo">Correo Electrónico</label>
            <input type="email" className="form-control" name="correo" value={formData.correo} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="parentesco">Parentesco</label>
            <input type="text" className="form-control" name="parentesco" placeholder="Ej. Padre, Madre, Tío(a)..." value={formData.parentesco} onChange={handleInputChange} required />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%', height: '38px' }}>
              <input type="checkbox" name="vive_con_estudiante" checked={formData.vive_con_estudiante} onChange={handleInputChange} style={{ marginRight: '8px' }} />
              ¿Vive con el estudiante?
            </label>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="domicilio">Domicilio</label>
            <input type="text" className="form-control" name="domicilio" value={formData.domicilio} onChange={handleInputChange} />
          </div>

          {/* Estudiantes Vinculados */}
          <div className="form-group" style={{ gridColumn: 'span 2', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <label className="form-label mb-2"><i className='bx bx-link'></i> Estudiantes Vinculados</label>
            <div style={{ marginBottom: '1rem' }}>
              {estudiantesList.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Aún no se han vinculado estudiantes.</p>
              ) : (
                estudiantesList.map(est => (
                  <div key={est.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '4px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                    <div><i className='bx bx-user'></i> {est.dni} - {est.nombres} {est.apellido_paterno}</div>
                    <button type="button" className="btn btn-danger btn-sm px-2 py-1" style={{ padding: '2px 6px', background: '#dc2626', color: 'white' }} onClick={() => removeLinkedStudent(est.id)}>
                      <i className='bx bx-x'></i>
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
              <input type="text" className="form-control" placeholder="Buscar estudiante por DNI para vincular..." value={studentSearchUrl} onChange={handleStudentSearch} autoComplete="off" />
              
              {studentSuggestions.length > 0 && (
                <div className="autocomplete-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', padding: '10px', zIndex: 10 }}>
                  {studentSuggestions.map(s => (
                    <div key={s.id} onClick={() => linkStudent(s)} style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #eee' }}>
                      <b>{s.dni}</b> - {s.apellido_paterno} {s.nombres}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-right mt-4" style={{ textAlign: 'right' }}>
          <button type="submit" className="btn btn-primary">
            {isUpdateMode ? <><i className='bx bx-refresh'></i> Actualizar Datos</> : <><i className='bx bx-save'></i> Guardar Apoderado</>}
          </button>
        </div>
      </form>
    </div>
  );
}
