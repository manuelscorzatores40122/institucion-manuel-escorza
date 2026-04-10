'use client';

import { useState, useRef, useEffect } from 'react';

export default function Topbar({ user, isCollapsed, toggleSidebar }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  if (!user) return null;

  return (
    <header className="topbar">
      <div className="d-flex align-center gap-3">
        <button 
          onClick={toggleSidebar} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', transition: 'background-color 0.2s', color: 'var(--text-color)' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <i className={isCollapsed ? 'bx bx-menu' : 'bx bx-menu-alt-left'} style={{ fontSize: '1.5rem' }}></i>
        </button>
      </div>
      <div className="dropdown" ref={dropdownRef}>
        <div className="d-flex align-center gap-2" style={{ cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
          <span className="user-greeting">Hola, <b>{user.nombre_usuario}</b></span>
          <div className="avatar" style={{ width: '36px', height: '36px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user.nombre_usuario.substring(0, 1).toUpperCase()}
          </div>
        </div>
        
        {isOpen && (
          <div className="dropdown-menu" style={{ display: 'block', position: 'absolute', right: 0, background: 'white', padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius)', zIndex: 100, minWidth: '150px', marginTop: '10px' }}>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn btn-block btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-color)', width: '100%', textAlign: 'center' }}>
                <i className='bx bx-log-out'></i> Cerrar Sesión
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
