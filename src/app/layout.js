import './globals.css';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistema de Gestión Escolar - Manuel Scorza',
  description: 'Sistema administrativo I.E. Manuel Scorza',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
