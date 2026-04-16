'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Topbar from './Topbar';

export default function DashboardLayoutClient({ user, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={`dashboard-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: isCollapsed ? '0' : '270px', overflow: 'hidden', transition: 'width 0.3s ease', padding: isCollapsed ? '0' : '' }}>
        <div className="sidebar-header" style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
          <img src="/logo.png" alt="Logo I.E. Manuel Scorza" style={{ height: '40px', width: 'auto' }} />
          <h2>I.E. Manuel Scorza</h2>
        </div>
        <nav className="sidebar-nav" style={{ whiteSpace: 'nowrap' }}>
          <Link href="/dashboard" className={`nav-item ${pathname?.startsWith('/dashboard') ? 'active' : ''}`}>
            <i className='bx bxs-dashboard'></i> Dashboard
          </Link>
          <Link href="/students" className={`nav-item ${pathname?.startsWith('/students') ? 'active' : ''}`}>
            <i className='bx bxs-user-detail'></i> Estudiantes
          </Link>
          <Link href="/guardians" className={`nav-item ${pathname?.startsWith('/guardians') ? 'active' : ''}`}>
            <i className='bx bxs-group'></i> Apoderados
          </Link>
          <Link href="/enrollments" className={`nav-item ${pathname?.startsWith('/enrollments') ? 'active' : ''}`}>
            <i className='bx bx-clipboard'></i> Matrículas
          </Link>
          <Link href="/academic-years" className={`nav-item ${pathname?.startsWith('/academic-years') ? 'active' : ''}`}>
            <i className='bx bx-calendar'></i> Años Escolares
          </Link>
          {user.nombre_usuario === 'admin' && (
            <Link href="/users" className={`nav-item ${pathname?.startsWith('/users') ? 'active' : ''}`}>
              <i className='bx bxs-user-account'></i> Usuarios
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ transition: 'margin 0.3s ease', width: '100%' }}>
        <Topbar user={user} isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
