// Módulo de Ubigeo - Carga y cachea los datos una sola vez en el cliente
// Los JSON están indexados por id_padre_ubigeo

let _departamentos = null;
let _provincias = null;
let _distritos = null;

const BASE = 'https://raw.githubusercontent.com/joseluisq/ubigeos-peru/master/json';

async function loadDepartamentos() {
  if (_departamentos) return _departamentos;
  const res = await fetch(`${BASE}/departamentos.json`);
  _departamentos = await res.json(); // Array
  return _departamentos;
}

async function loadProvincias() {
  if (_provincias) return _provincias;
  const res = await fetch(`${BASE}/provincias.json`);
  _provincias = await res.json(); // Object: { "id_dept": [...provincias] }
  return _provincias;
}

async function loadDistritos() {
  if (_distritos) return _distritos;
  const res = await fetch(`${BASE}/distritos.json`);
  _distritos = await res.json(); // Object: { "id_prov": [...distritos] }
  return _distritos;
}

export async function getDepartamentos() {
  return await loadDepartamentos();
}

export async function getProvinciasByDeptId(deptId) {
  const all = await loadProvincias();
  return all[deptId] || [];
}

export async function getDistritosByProvId(provId) {
  const all = await loadDistritos();
  return all[provId] || [];
}
