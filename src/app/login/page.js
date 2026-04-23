import Link from 'next/link';

export const metadata = {
  title: 'Login - I.E. Manuel Scorza',
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="login-unified-wrapper">

      {/* Insignia Aura Background (Tilted & closer to center) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '1%',
        transform: 'translateY(-50%) rotate(15deg)',
        width: '85vw',
        height: '85vh',
        maxWidth: '1200px',
        maxHeight: '1200px',
        backgroundImage: 'url(/logo.png)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        opacity: 0.04,
        filter: 'blur(3px)',
        zIndex: 1,
        pointerEvents: 'none'
      }}></div>

      {/* Luz del Aura (Glowing backlight para la insignia al costado) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '15%',
        transform: 'translateY(-50%)',
        width: '60vw',
        height: '60vw',
        maxWidth: '700px',
        maxHeight: '700px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 60%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Tarjeta central oscura, tipo panel de control serio */}
      <div className="login-glass-card">


        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', padding: '1rem', background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <img src="/logo.png" alt="Logo I.E. Manuel Scorza" style={{ height: '80px', width: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>I.E. Manuel Scorza</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500' }}>Acceso Administrativo Seguro</p>
        </div>

        {error === 'InvalidCredentials' && (
          <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
            <i className='bx bx-error-circle' style={{ fontSize: '1.4rem' }}></i> Credenciales denegadas.
          </div>
        )}
        {error === 'ServerError' && (
          <div style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.3)', color: '#fcd34d', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
            <i className='bx bx-error' style={{ fontSize: '1.4rem' }}></i> Error en el protocolo del servidor.
          </div>
        )}

        <form action="/api/auth/login" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="nombre_usuario" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Identificador de Usuario</label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-user' style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.2rem' }}></i>
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"
                required
                autoFocus
                className="login-input"
                placeholder="Usuario del sistema"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contrasena" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Clave de Acceso</label>
            <div style={{ position: 'relative' }}>
              <i className='bx bx-lock-alt' style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.2rem' }}></i>
              <input
                type="password"
                id="contrasena"
                name="contrasena"
                required
                className="login-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="login-btn-submit">
            Autorizar Ingreso <i className='bx bx-right-arrow-alt' style={{ fontSize: '1.4rem' }}></i>
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link href="https://manuel-scorza-web-olive.vercel.app/" className="login-back-link">
            <i className='bx bx-arrow-back' style={{ fontSize: '1.2rem' }}></i> Retornar al Sitio Público
          </Link>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* Fondo estrictamente oscuro y profesional */
        .login-unified-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background-color: #020617; /* Slate 950 - casi negro */
          background-image: 
            radial-gradient(ellipse at 50% -20%, rgba(30, 58, 138, 0.2), transparent 50%), 
            radial-gradient(ellipse at 50% 120%, rgba(15, 23, 42, 1), transparent 50%);
          overflow: hidden;
          padding: 1rem;
        }

        /* Tarjeta central oscura, tipo panel de control serio */
        .login-glass-card {
          width: 100%;
          max-width: 440px;
          background: #0f172a; /* Slate 900 */
          border: 1px solid #1e293b; /* Slate 800 */
          padding: 3rem 2.5rem;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          z-index: 10;
          position: relative;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        /* Campos de texto oscuros */
        .login-input { 
          width: 100%; 
          padding: 1rem 1rem 1rem 3.2rem; 
          border: 1px solid #334155; 
          border-radius: 10px; 
          font-size: 0.95rem; 
          color: #f1f5f9; 
          outline: none; 
          transition: all 0.2s ease; 
          background-color: #020617; 
        }
        .login-input::placeholder { color: #475569; }
        .login-input:focus { 
          border-color: #3b82f6; 
          background-color: #0b1120; 
          box-shadow: 0 0 0 1px #3b82f6; 
        }

        /* Botón estilo terminal corporativa */
        .login-btn-submit { 
          margin-top: 1rem; 
          width: 100%; 
          padding: 1rem; 
          background: #3b82f6; 
          color: white; 
          border: 1px solid #2563eb; 
          border-radius: 10px; 
          font-size: 1.05rem; 
          font-weight: 600; 
          cursor: pointer; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          gap: 10px; 
          transition: all 0.2s ease; 
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); 
        }
        .login-btn-submit:hover { 
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4); 
        }
        .login-btn-submit:active {
          transform: translateY(1px);
        }

        /* Enlace de regreso sobrio */
        .login-back-link { 
          color: #64748b; 
          font-size: 0.9rem; 
          text-decoration: none; 
          font-weight: 500; 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          transition: color 0.2s; 
        }
        .login-back-link:hover { 
          color: #f8fafc; 
        }

        @media (max-width: 480px) {
          .login-glass-card {
            padding: 2.5rem 1.5rem;
          }
        }
      `}} />
    </div>
  );
}
