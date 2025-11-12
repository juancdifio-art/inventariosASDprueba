export default function EmptyState({ title = 'Sin datos', description = 'Aún no hay información para mostrar.', icon = 'bi-inbox' }) {
  return (
    <div className="text-center text-secondary py-5">
      <i className={`bi ${icon}`} style={{ fontSize: 32 }} />
      <div className="fw-semibold mt-2">{title}</div>
      <div className="small">{description}</div>
    </div>
  );
}
