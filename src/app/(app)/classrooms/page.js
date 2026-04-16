import { getActiveYear, getNivelesTree } from './actions';
import ClassroomsClient from './ClassroomsClient';

export default async function ClassroomsPage() {
  const activeYear = await getActiveYear();
  const nivelesTree = await getNivelesTree();
  
  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', color: '#0f172a' }}>Gestión de Aulas / Secciones</h1>
      <ClassroomsClient nivelesTree={nivelesTree} activeYear={activeYear} />
    </div>
  );
}
