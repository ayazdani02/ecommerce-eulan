export default function Loading() {
  return (
    <div role="status" aria-label="Cargando colección" className="loading-grid">
      <span className="sr-only">Cargando…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton" aria-hidden="true" />
      ))}
    </div>
  );
}
