import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete('auth_token');
  return response;
}
