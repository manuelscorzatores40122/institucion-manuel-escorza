'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveStudent, searchStudentByDni, searchStudentById } from '../actions';
import { getDepartamentos, getProvinciasByDeptId, getDistritosByProvId } from '@/lib/ubigeo';
import Swal from 'sweetalert2';

export default function CreateStudentClient({ options }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { anios, niveles, grados, secciones } = options || { anios: [], niveles: [], grados: [], secciones: [] };

  const [formData, setFormData] = useState({
    id: '', codigo_estudiante: '', dni: '', apellido_paterno: '', apellido_materno: '', nombres: '', sexo: '', celular: '', email: '',
    fecha_nacimiento: '', departamento_nacimiento: '', provincia_nacimiento: '', distrito_nacimiento: '',
    domicilio: '', reporte: '',
    padre_dni: '', padre_celular: '', padre_apellidos: '', padre_nombres: '',
    madre_dni: '', madre_celular: '', madre_apellidos: '', madre_nombres: '',
    vive_con: '', apoderado_alterno_dni: '', apoderado_alterno_nombres: '', apoderado_alterno_apellidos: '', apoderado_alterno_celular: '',
    anio_id: '', nivel_id: '', grado_id: '', seccion_id: ''
  });

  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [showAutoFillAlert, setShowAutoFillAlert] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showOtrosViveCon, setShowOtrosViveCon] = useState(false);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  useEffect(() => {
    getDepartamentos().then(setDepartamentos);
  }, []);

  useEffect(() => {
    const defaultId = searchParams.get('id');
    const defaultDni = searchParams.get('dni');
    
    if (defaultId && defaultId !== 'null') {
      searchStudentById(defaultId).then(student => {
        if (student) handleSelectSuggestion(student);
      });
    } else if (defaultDni && defaultDni !== 'null') {
      setFormData(prev => ({ ...prev, dni: defaultDni }));
      searchStudentByDni(defaultDni).then(student => {
        if (student) handleSelectSuggestion(student);
      });
    }
  }, [searchParams, departamentos]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nivel_id') setFormData(prev => ({ ...prev, nivel_id: value, grado_id: '', seccion_id: '' }));
    else if (name === 'grado_id') setFormData(prev => ({ ...prev, grado_id: value, seccion_id: '' }));
    else setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'dni') {
      if (value.length >= 1) {
        // Buscqueda inmediata
        searchStudentByDni(value).then(student => {
          if (student) setSuggestions([student]);
          else setSuggestions([]);
        });
      } else {
        setSuggestions([]);
        resetFormMode();
      }
    }
  };

  const handleSelectSuggestion = async (student) => {
    setFormData({
      id: student.id,
      codigo_estudiante: student.codigo_estudiante || '',
      dni: student.dni || '',
      apellido_paterno: student.apellido_paterno || '',
      apellido_materno: student.apellido_materno || '',
      nombres: student.nombres || '',
      sexo: student.sexo || '',
      celular: student.celular || '',
      email: student.email || '',
      fecha_nacimiento: student.fecha_nacimiento ? (new Date(student.fecha_nacimiento).toISOString().slice(0, 10)) : '',
      departamento_nacimiento: student.departamento_nacimiento || '',
      provincia_nacimiento: student.provincia_nacimiento || '',
      distrito_nacimiento: student.distrito_nacimiento || '',
      domicilio: student.domicilio || '',
      reporte: student.reporte || '',
      padre_dni: student.padre_dni || '',
      padre_celular: student.padre_celular || '',
      padre_apellidos: student.padre_apellidos || '',
      padre_nombres: student.padre_nombres || '',
      madre_dni: student.madre_dni || '',
      madre_celular: student.madre_celular || '',
      madre_apellidos: student.madre_apellidos || '',
      madre_nombres: student.madre_nombres || '',
      vive_con: student.vive_con || '',
      apoderado_alterno_dni: student.apoderado_alterno_dni || '',
      apoderado_alterno_nombres: student.apoderado_alterno_nombres || '',
      apoderado_alterno_apellidos: student.apoderado_alterno_apellidos || '',
      apoderado_alterno_celular: student.apoderado_alterno_celular || '',
      anio_id: '', nivel_id: '', grado_id: '', seccion_id: ''
    });
    setSuggestions([]);
    setIsUpdateMode(true);
    setShowAutoFillAlert(true);
    
    if (student.vive_con && !['Ambos padres', 'Solo Padre', 'Solo Madre', 'Abuelos', 'Tíos o familiares', 'Apoderado Externo', 'Independiente / Solo'].includes(student.vive_con)) {
      setShowOtrosViveCon(true);
    } else {
      setShowOtrosViveCon(false);
    }

    // Cargar ubigeo
    if (student.departamento_nacimiento) {
      const dep = departamentos.find(d => d.nombre_ubigeo === student.departamento_nacimiento);
      if (dep) {
        const provs = await getProvinciasByDeptId(dep.id_ubigeo);
        setProvincias(provs);
        if (student.provincia_nacimiento) {
          const prov = provs.find(p => p.nombre_ubigeo === student.provincia_nacimiento);
          if (prov) setDistritos(await getDistritosByProvId(prov.id_ubigeo));
        }
      }
    }
  };

  const handleDeptChange = async (e) => {
    const dep = departamentos.find(d => d.nombre_ubigeo === e.target.value);
    setFormData(prev => ({ ...prev, departamento_nacimiento: e.target.value, provincia_nacimiento: '', distrito_nacimiento: '' }));
    setProvincias([]); setDistritos([]);
    if (dep) setProvincias(await getProvinciasByDeptId(dep.id_ubigeo));
  };

  const handleProvChange = async (e) => {
    const prov = provincias.find(p => p.nombre_ubigeo === e.target.value);
    setFormData(prev => ({ ...prev, provincia_nacimiento: e.target.value, distrito_nacimiento: '' }));
    setDistritos([]);
    if (prov) setDistritos(await getDistritosByProvId(prov.id_ubigeo));
  };

  const resetFormMode = () => {
    setIsUpdateMode(false);
    setShowAutoFillAlert(false);
    setShowOtrosViveCon(false);
    setStep(1);
  };

  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await saveStudent(formData);
      if (res && res.error) {
        Swal.fire({ icon: 'error', title: 'Error al guardar', text: res.error });
        setIsLoading(false);
        return;
      }
      setSuccessMsg(isUpdateMode ? 'Datos del estudiante actualizados correctamente.' : 'Estudiante registrado correctamente.');
      if (!isUpdateMode) {
        setIsUpdateMode(true);
      }
      setTimeout(() => {
        router.push('/students');
      }, 700);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card-header d-flex justify-between align-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Registrar Estudiante</h2>
        <Link href="/students" className="btn btn-sm" style={{ background: 'var(--text-muted)', color: 'white', textDecoration: 'none' }}>
          <i className='bx bx-arrow-back'></i> Volver
        </Link>
      </div>

      {showAutoFillAlert && (
        <div className="alert alert-info py-2" style={{ backgroundColor: '#E0F2FE', color: '#0369A1', border: '1px solid #7DD3FC', marginBottom: '1.5rem', borderRadius: '4px', padding: '10px' }}>
          <i className='bx bx-info-circle'></i> <b>Estudiante encontrado.</b> Los datos se han autocompletado para su actualización o matrícula.<br />
          <div className="mt-2" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>Apoderado Actualizado</div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success py-2" style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7', marginBottom: '1.5rem', borderRadius: '4px', padding: '10px' }}>
          <i className='bx bx-check-circle'></i> {successMsg}
        </div>
      )}

        {/* Wizard Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginTop: '1rem' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1, textAlign: 'center', fontWeight: step === s ? 'bold' : 'normal', color: step === s || step > s ? 'var(--primary)' : 'var(--text-muted)' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= s ? 'var(--primary)' : '#e2e8f0', color: step >= s ? 'white' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', transition: '0.3s' }}>{s}</div>
              <div style={{ fontSize: '0.85rem' }}>{s === 1 ? 'Personales' : s === 2 ? 'Contacto' : s === 3 ? 'Familia' : 'Matrícula'}</div>
            </div>
          ))}
        </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          
          {/* STEP 1: Datos Personales */}
          {step === 1 && (
            <>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="dni">DNI del Estudiante (Autocompleta nombre y apoderados)</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" className="form-control" id="dni" name="dni" required maxLength="8" minLength="8" pattern="\d{8}" autoComplete="off" placeholder="Ingresa DNI exacto de 8 dígitos..." value={formData.dni} onChange={handleInputChange} />

                  {suggestions.length > 0 && (
                    <div className="autocomplete-suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', padding: '10px', zIndex: 10 }}>
                      {suggestions.map(student => (
                        <div key={student.id} onClick={() => handleSelectSuggestion(student)} style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #eee' }}>
                          <b>{student.dni}</b> - {student.apellido_paterno} {student.apellido_materno}, {student.nombres}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="codigo_estudiante">Código de Estudiante (Opcional - SIAGIE / Interno)</label>
                <input type="text" className="form-control" id="codigo_estudiante" name="codigo_estudiante" value={formData.codigo_estudiante} onChange={handleInputChange} placeholder="Ej. 240225..." />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apellido_paterno">Apellido Paterno</label>
                <input type="text" className="form-control" id="apellido_paterno" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apellido_materno">Apellido Materno</label>
                <input type="text" className="form-control" id="apellido_materno" name="apellido_materno" value={formData.apellido_materno} onChange={handleInputChange} required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="nombres">Nombres</label>
                <input type="text" className="form-control" id="nombres" name="nombres" value={formData.nombres} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sexo">Sexo</label>
                <select className="form-control" id="sexo" name="sexo" value={formData.sexo} onChange={handleInputChange} required>
                  <option value="">-- Seleccionar --</option>
                  <option value="H">Hombre</option>
                  <option value="M">Mujer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                <input type="date" className="form-control" id="fecha_nacimiento" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} required />
              </div>
            </>
          )}

          {/* STEP 2: Contacto y Reporte */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="celular">Celular de Emergencia/Estudiante</label>
                <input type="text" className="form-control" id="celular" name="celular" maxLength="9" minLength="9" pattern="\d{9}" value={formData.celular || ''} onChange={handleInputChange} placeholder="9 dígitos" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Correo Institucional / Principal</label>
                <input type="email" className="form-control" id="email" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder="ejemplo@escuela.edu.pe" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', background: '#f1f5f9', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--primary)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input type="checkbox" checked={formData.departamento_nacimiento === 'EXTRANJERO'} onChange={(e) => {
                    const isExt = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      departamento_nacimiento: isExt ? 'EXTRANJERO' : '',
                      provincia_nacimiento: isExt ? 'EXTRANJERO' : '',
                      distrito_nacimiento: isExt ? 'EXTRANJERO' : ''
                    }));
                  }} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontWeight: 'bold' }}>Estudiante Extranjero (No nació en Perú)</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="departamento_nacimiento">Departamento Nac.</label>
                <select className="form-control" name="departamento_nacimiento" value={formData.departamento_nacimiento} onChange={handleDeptChange} disabled={formData.departamento_nacimiento === 'EXTRANJERO'}>
                  <option value="">-- Seleccione --</option>
                  {formData.departamento_nacimiento === 'EXTRANJERO' && <option value="EXTRANJERO">EXTRANJERO</option>}
                  {departamentos.map(d => <option key={d.id_ubigeo} value={d.nombre_ubigeo}>{d.nombre_ubigeo}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="provincia_nacimiento">Provincia Nac.</label>
                <select className="form-control" name="provincia_nacimiento" value={formData.provincia_nacimiento} onChange={handleProvChange} disabled={provincias.length === 0 || formData.departamento_nacimiento === 'EXTRANJERO'}>
                  <option value="">-- Seleccione --</option>
                  {formData.provincia_nacimiento === 'EXTRANJERO' && <option value="EXTRANJERO">EXTRANJERO</option>}
                  {provincias.map(p => <option key={p.id_ubigeo} value={p.nombre_ubigeo}>{p.nombre_ubigeo}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="distrito_nacimiento">Distrito Nac.</label>
                <select className="form-control" name="distrito_nacimiento" value={formData.distrito_nacimiento} onChange={handleInputChange} disabled={distritos.length === 0 && formData.departamento_nacimiento !== 'EXTRANJERO'}>
                  <option value="">-- Seleccione --</option>
                  {formData.distrito_nacimiento === 'EXTRANJERO' && <option value="EXTRANJERO">EXTRANJERO</option>}
                  {distritos.map(d => <option key={d.id_ubigeo} value={d.nombre_ubigeo}>{d.nombre_ubigeo}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="domicilio">Domicilio / Dirección Actual</label>
                <input type="text" className="form-control" id="domicilio" name="domicilio" value={formData.domicilio} onChange={handleInputChange} required />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="reporte">Reporte / Observaciones Médicas</label>
                <textarea className="form-control" id="reporte" name="reporte" rows="3" placeholder="Alergias, asma, información importante..." value={formData.reporte} onChange={handleInputChange}></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" htmlFor="vive_con">¿Con quién vive el estudiante?</label>
                <select className="form-control" name="vive_con_select" value={showOtrosViveCon ? 'Otros' : (formData.vive_con || '')} onChange={(e) => {
                  if (e.target.value === 'Otros') {
                    setShowOtrosViveCon(true);
                    setFormData(prev => ({ ...prev, vive_con: '' }));
                  } else {
                    setShowOtrosViveCon(false);
                    setFormData(prev => ({ ...prev, vive_con: e.target.value }));
                  }
                }} required>
                  <option value="">-- Seleccionar --</option>
                  <option value="Ambos padres">Ambos padres</option>
                  <option value="Solo Padre">Solo Padre</option>
                  <option value="Solo Madre">Solo Madre</option>
                  <option value="Abuelos">Abuelos</option>
                  <option value="Tíos o familiares">Tíos o familiares</option>
                  <option value="Apoderado Externo">Apoderado Externo</option>
                  <option value="Independiente / Solo">Independiente / Solo</option>
                  <option value="Otros">Otros (Especificar)</option>
                </select>
                {showOtrosViveCon && (
                  <input type="text" className="form-control" style={{ marginTop: '0.75rem' }} name="vive_con" placeholder="Especifique con quién vive..." value={formData.vive_con} onChange={handleInputChange} autoFocus required />
                )}
              </div>
            </>
          )}

          {/* STEP 3: Familiares */}
          {step === 3 && (
            <>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}><i className='bx bx-male'></i> Datos del Padre</h4>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="padre_dni">DNI del Padre</label>
                <input type="text" className="form-control" id="padre_dni" name="padre_dni" maxLength="8" minLength="8" pattern="\d{8}" placeholder="Opcional. 8 dígitos" value={formData.padre_dni} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="padre_celular">Celular del Padre</label>
                <input type="text" className="form-control" id="padre_celular" name="padre_celular" maxLength="9" minLength="9" pattern="\d{9}" placeholder="Opcional" value={formData.padre_celular} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="padre_apellidos">Apellidos del Padre</label>
                <input type="text" className="form-control" id="padre_apellidos" name="padre_apellidos" value={formData.padre_apellidos} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="padre_nombres">Nombres del Padre</label>
                <input type="text" className="form-control" id="padre_nombres" name="padre_nombres" value={formData.padre_nombres} onChange={handleInputChange} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}><i className='bx bx-female'></i> Datos de la Madre</h4>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="madre_dni">DNI de la Madre</label>
                <input type="text" className="form-control" id="madre_dni" name="madre_dni" maxLength="8" minLength="8" pattern="\d{8}" placeholder="Opcional. 8 dígitos" value={formData.madre_dni} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="madre_celular">Celular de la Madre</label>
                <input type="text" className="form-control" id="madre_celular" name="madre_celular" maxLength="9" minLength="9" pattern="\d{9}" placeholder="Opcional" value={formData.madre_celular} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="madre_apellidos">Apellidos de la Madre</label>
                <input type="text" className="form-control" id="madre_apellidos" name="madre_apellidos" value={formData.madre_apellidos} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="madre_nombres">Nombres de la Madre</label>
                <input type="text" className="form-control" id="madre_nombres" name="madre_nombres" value={formData.madre_nombres} onChange={handleInputChange} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '1.5rem' }}>
                <h4 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}><i className='bx bx-user-pin'></i> Apoderado Alterno (Solo si distinto)</h4>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apoderado_alterno_dni">DNI Apoderado</label>
                <input type="text" className="form-control" id="apoderado_alterno_dni" name="apoderado_alterno_dni" maxLength="8" minLength="8" pattern="\d{8}" placeholder="Opcional." value={formData.apoderado_alterno_dni || ''} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apoderado_alterno_celular">Celular Apoderado</label>
                <input type="text" className="form-control" id="apoderado_alterno_celular" name="apoderado_alterno_celular" maxLength="9" minLength="9" pattern="\d{9}" placeholder="Opcional." value={formData.apoderado_alterno_celular || ''} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apoderado_alterno_apellidos">Apellidos Apoderado</label>
                <input type="text" className="form-control" id="apoderado_alterno_apellidos" name="apoderado_alterno_apellidos" value={formData.apoderado_alterno_apellidos || ''} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apoderado_alterno_nombres">Nombres Apoderado</label>
                <input type="text" className="form-control" id="apoderado_alterno_nombres" name="apoderado_alterno_nombres" value={formData.apoderado_alterno_nombres || ''} onChange={handleInputChange} />
              </div>
            </>
          )}

          {/* STEP 4: Matrícula */}
          {step === 4 && (
            <div className="form-group" style={{ gridColumn: 'span 2', background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '10px' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <i className='bx bx-book-bookmark' style={{ fontSize: '1.5rem' }}></i> Configuración de Matrícula
              </h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Si seleccionas un año y sus datos respectivos, inscribirás a este estudiante instantáneamente en un aula real.</p>
              <div className="grid grid-cols-2 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }}>

                <div className="form-group mb-0">
                  <label className="form-label">Año Escolar</label>
                  <select name="anio_id" className="form-control form-control-lg" value={formData.anio_id} onChange={handleInputChange}>
                    <option value="">-- Dejar sin matrícula por ahora --</option>
                    {anios?.map(a => <option key={a.id} value={a.id}>{a.anio}</option>)}
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Nivel</label>
                  <select name="nivel_id" className="form-control form-control-lg" value={formData.nivel_id} onChange={handleInputChange} disabled={!formData.anio_id}>
                    <option value="">-- Seleccionar --</option>
                    {niveles?.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Grado</label>
                  <select name="grado_id" className="form-control form-control-lg" value={formData.grado_id} onChange={handleInputChange} disabled={!formData.nivel_id}>
                    <option value="">-- Seleccionar --</option>
                    {grados?.filter(g => g.nivel_id == formData.nivel_id).map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Sección</label>
                  <select name="seccion_id" className="form-control form-control-lg" value={formData.seccion_id} onChange={handleInputChange} disabled={!formData.grado_id}>
                    <option value="">-- Seleccionar --</option>
                    {secciones?.filter(s => s.grado_id == formData.grado_id).map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>
          )}
        </div>

        <div className="mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {step > 1 ? (
             <button type="button" className="btn" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => setStep(step - 1)}>
               <i className='bx bx-chevron-left'></i> Atrás
             </button>
          ) : <div></div>}
          
          {step < 4 ? (
             <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
               Siguiente <i className='bx bx-chevron-right'></i>
             </button>
          ) : (
             <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ minWidth: '160px', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? <><i className='bx bx-loader-alt bx-spin'></i> Acoplado Módulos...</> : (isUpdateMode ? <><i className='bx bx-refresh'></i> Actualizar y Finalizar</> : <><i className='bx bx-save'></i> Registrar Estudiante</>)}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
