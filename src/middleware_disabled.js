import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Ignorar assets estáticos, archivos internos y llamadas a API externas
  if (
    pathname.startsWith('/_next') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/) ||
    pathname.startsWith('/api/external') // Permitir rutas de API externas públicas si existen
  ) {
    return NextResponse.next();
  }

  // 2. Definir rutas públicas protegidas
  const isLoginPage = pathname === '/login' || pathname === '/login/';
  const token = request.cookies.get('auth_token')?.value;

  // 3. Redirigir si no está logeado e intenta entrar a una ruta (app) protegida
  if (!isLoginPage && !pathname.startsWith('/api/auth')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch (error) {
      // Si el token expiró, es inválido o no decodifica, forzar re-login
      console.warn('Middleware: Token inválido/expirado, redirigiendo a login...');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // 4. Redirigir si ya está logeado e intenta entrar a la pantalla de login de nuevo
  if (isLoginPage && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Si el token que tiene en pantalla login es viejo/inválido: ignorar y dejarlo ingresar normal
    }
  }

  return NextResponse.next();
}

export const config = {
  // Configurar las rutas exactas donde este middleware actuará
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
