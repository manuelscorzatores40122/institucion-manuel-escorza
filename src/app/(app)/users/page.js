import { getUsers } from './actions';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const data = await getUsers();
  
  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', color: '#0f172a' }}>Gestión de Usuarios</h1>
      <UsersClient initialData={data} />
    </div>
  );
}
