'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import Topbar from './Topbar';

export default function DashboardLayoutClient({ user, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef(null);

  const handleAutoLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // 15 minutos en milisegundos = 15 * 60 * 1000 = 900000
      timeoutRef.current = setTimeout(handleAutoLogout, 900000);
    };

    resetTimeout();
    events.forEach(event => window.addEventListener(event, resetTimeout));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={`dashboard-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Toaster position="bottom-right" richColors />
      
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`} style={{ width: isCollapsed ? '0' : '270px', overflow: 'hidden', padding: isCollapsed ? '0' : '' }}>
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
        <Topbar user={user} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
