export default function LoadingSpinner({ label = 'Cargando...' }) {
  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <div className="spinner-border text-secondary me-2" role="status" aria-hidden="true"></div>
      <span className="text-secondary">{label}</span>
    </div>
  );
}
