import { getFilterOptions } from './actions';
import StudentsIndexClient from './StudentsIndexClient';

export default async function StudentsIndexPage() {
  const options = await getFilterOptions();

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', color: '#0f172a' }}>Directorio de Estudiantes</h1>
      <StudentsIndexClient initialFiltersParams={options} />
    </div>
  );
}
