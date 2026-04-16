import { getEnrollments } from './actions';
import EnrollmentsClient from './EnrollmentsClient';

export default async function EnrollmentsPage() {
  const data = await getEnrollments();
  
  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', color: '#0f172a' }}>Gestión de Matrículas</h1>
      <EnrollmentsClient initialData={data} />
    </div>
  );
}
