import GuardiansIndexClient from './GuardiansIndexClient';

export default function GuardiansIndexPage() {
  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: '1.8rem', color: '#0f172a' }}>Directorio de Apoderados</h1>
      <GuardiansIndexClient />
    </div>
  );
}
