import Link from 'next/link';

export const metadata = {
  title: 'Login - I.E. Manuel Scorza',
};

export default function LoginPage() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link href="/">
            <img src="/logo.png" alt="Logo I.E. Manuel Scorza" style={{ height: '100px', width: 'auto', maxWidth: '100%' }} />
          </Link>
        </div>
        <h2>Bienvenido de Nuevo</h2>
        <p>Ingresa tus credenciales para acceder al sistema.</p>

        <form action="/api/auth/login" method="POST">
          <div className="form-group">
            <label className="form-label" htmlFor="nombre_usuario">Nombre de Usuario</label>
            <input type="text" className="form-control" id="nombre_usuario" name="nombre_usuario" required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contrasena">Contraseña</label>
            <input type="password" className="form-control" id="contrasena" name="contrasena" required />
          </div>

          <button type="submit" className="btn btn-primary btn-block mt-4">
            <i className='bx bx-log-in' style={{ verticalAlign: 'middle' }}></i> Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
