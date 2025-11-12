import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertasStats } from '../../hooks/useAlertas.js';

export default function AlertBadge({ refreshInterval = 30000 }) {
  const navigate = useNavigate();
  const { data, refetch } = useAlertasStats();

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refetch, refreshInterval]);

  const activeCount = useMemo(() => {
    if (!data?.breakdown) return 0;
    return data.breakdown
      .filter((item) => item.estado === 'activa')
      .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  }, [data]);

  const handleClick = () => {
    navigate('/alertas');
  };

  return (
    <button
      type="button"
      className="btn btn-link notification-button position-relative"
      onClick={handleClick}
      title="Ver alertas"
    >
      <i className="bi bi-bell" />
      {activeCount > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark">
          {activeCount}
        </span>
      )}
      <span className="visually-hidden">Ir a alertas</span>
    </button>
  );
}
