import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Topbar from './Topbar';
import DashboardLayoutClient from './DashboardLayoutClient';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload; // { id, nombre_usuario }
  } catch (error) {
    return null;
  }
}

export default async function DashboardLayout({ children }) {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayoutClient user={user}>
      {children}
    </DashboardLayoutClient>
  );
}
