/** @type {import('next').NextConfig} */
const nextConfig = {
  // Paquetes que deben correr solo en Node.js (no bundleados)
  serverExternalPackages: ['pg', 'bcryptjs'],

  // Configuración de imágenes externas (si se usan en el futuro)
  images: {
    remotePatterns: [],
  },

  // Headers de seguridad para producción
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
