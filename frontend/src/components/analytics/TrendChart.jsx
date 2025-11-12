import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { formatNumber } from '../../utils/formatters.js';

const COLORS = {
  entradas: '#0d6efd',
  salidas: '#6c757d',
  neto: '#198754',
  ingresos: '#0dcaf0',
  costos: '#dc3545',
  margen: '#6610f2',
};

function formatYAxis(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  if (Math.abs(numeric) >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
  if (Math.abs(numeric) >= 1_000) return `${(numeric / 1_000).toFixed(1)}K`;
  return formatNumber(numeric, { maximumFractionDigits: 0 });
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow rounded-3 border p-2">
      <div className="fw-semibold mb-1">{label}</div>
      <ul className="list-unstyled mb-0 small">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="d-flex justify-content-between gap-3">
            <span className="d-inline-flex align-items-center gap-2">
              <span className="badge rounded-pill" style={{ backgroundColor: entry.color }}>&nbsp;</span>
              {entry.name}
            </span>
            <span>{formatNumber(entry.value, { maximumFractionDigits: 2 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TrendChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center text-secondary py-4">
        No hay datos suficientes para mostrar tendencias.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
          <XAxis dataKey="periodo" stroke="#adb5bd" angle={-30} textAnchor="end" height={60} interval={Math.floor(data.length / 12)} />
          <YAxis stroke="#adb5bd" tickFormatter={formatYAxis} width={80} />
          <Tooltip content={<TrendTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="entradas" name="Entradas" stroke={COLORS.entradas} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="salidas" name="Salidas" stroke={COLORS.salidas} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="neto" name="Neto" stroke={COLORS.neto} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke={COLORS.ingresos} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="costos" name="Costos" stroke={COLORS.costos} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="margen" name="Margen" stroke={COLORS.margen} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
