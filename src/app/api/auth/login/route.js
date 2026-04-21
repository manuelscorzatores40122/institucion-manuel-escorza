import { query } from '@/lib/db';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const nombre_usuario = formData.get('nombre_usuario');
    const contrasena = formData.get('contrasena');

    // Fetch user from PG Neon DB
    const res = await query('SELECT * FROM usuarios WHERE nombre_usuario = $1', [nombre_usuario]);
    const user = res.rows[0];

    if (!user) {
      // Return back to login with error (simplified for static Next SSR without session middleware)
      return NextResponse.redirect(new URL('/login?error=InvalidCredentials', request.url), 303);
    }

    // Check pass
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return NextResponse.redirect(new URL('/login?error=InvalidCredentials', request.url), 303);
    }

    // Sign JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await new SignJWT({ id: user.id, nombre_usuario: user.nombre_usuario })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    // Set cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url), 303);
    response.cookies.set({
      name: 'auth_token',
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', request.url), 303);
  }
}
