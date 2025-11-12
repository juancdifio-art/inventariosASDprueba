import { useMemo } from 'react'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const palette = {
  pageBg: '#f5f7f2',
  headerGradient: 'linear-gradient(135deg, #1f3021, #2e4d2b)',
  highlightGradient: 'linear-gradient(140deg, #2a9d8f, #264653)',
  card: '#ffffff',
  subtleCard: '#f0f4ec',
  textPrimary: '#1f2933',
  textSecondary: '#475467',
  accent: '#2a9d8f',
  accentWarning: '#d97706',
}

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('es-AR').format(Number(value))
}

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch (_) {
    return '—'
  }
}

export default function DashboardPreview() {
  const { data, isLoading, isError, error } = useDashboardSummary()

  const totals = data?.totals ?? {}
  const lowStock = data?.lowStock ?? { items: [] }
  const movements = data?.recentMovements ?? []

  const stockTrendData = useMemo(() => {
    const topItems = lowStock.items.slice(0, 6)

    if (!topItems.length) {
      return {
        labels: ['Sin datos'],
        datasets: [
          {
            label: 'Stock actual',
            data: [0],
            borderColor: palette.accent,
            backgroundColor: 'rgba(42, 157, 143, 0.12)',
            tension: 0.4,
            fill: true,
            pointRadius: 0,
          },
        ],
      }
    }

    return {
      labels: topItems.map((item) => item.nombre || `Producto ${item.id}`),
      datasets: [
        {
          label: 'Stock actual',
          data: topItems.map((item) => Number(item.stock_actual ?? 0)),
          borderColor: palette.accent,
          backgroundColor: 'rgba(42, 157, 143, 0.14)',
          tension: 0.45,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: palette.accent,
          pointBorderWidth: 2,
          pointRadius: 5,
        },
        {
          label: 'Stock mínimo',
          data: topItems.map((item) => Number(item.stock_minimo ?? 0)),
          borderColor: palette.accentWarning,
          backgroundColor: 'rgba(217, 119, 6, 0.14)',
          tension: 0.45,
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: palette.accentWarning,
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    }
  }, [lowStock.items])

  const stockTrendOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#475467',
            font: { family: '"Inter", "Segoe UI", sans-serif', size: 12 },
            usePointStyle: true,
            boxWidth: 10,
          },
        },
        tooltip: { mode: 'index', intersect: false },
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          ticks: { color: '#64748b', maxRotation: 25, minRotation: 25 },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b' },
          grid: { color: 'rgba(148, 163, 184, 0.25)' },
        },
      },
    }),
    []
  )

  const movementSummary = useMemo(
    () =>
      movements.reduce(
        (acc, mov) => {
          const amount = Number(mov.cantidad ?? 0)
          if (mov.tipo === 'entrada') acc.entrada += amount
          else if (mov.tipo === 'salida') acc.salida += amount
          else acc.otros += amount
          return acc
        },
        { entrada: 0, salida: 0, otros: 0 }
      ),
    [movements]
  )

  const activeProductPct = useMemo(() => {
    const total = Number(totals.productos ?? 0)
    if (!total) return null
    const activos = Number(totals.productos_activos ?? 0)
    return Math.min(100, Math.round((activos / total) * 100))
  }, [totals.productos, totals.productos_activos])

  const supplierActivePct = useMemo(() => {
    const total = Number(totals.proveedores ?? 0)
    if (!total) return null
    const activos = Number(totals.proveedores_activos ?? 0)
    return Math.min(100, Math.round((activos / total) * 100))
  }, [totals.proveedores, totals.proveedores_activos])

  const lowStockShare = useMemo(() => {
    const total = Number(totals.productos ?? 0)
    const count = Number(lowStock?.count ?? 0)
    if (!total || Number.isNaN(total) || Number.isNaN(count)) return null
    return Math.min(100, Math.round((count / total) * 100))
  }, [lowStock?.count, totals.productos])

  const totalEntradas = movementSummary.entrada
  const totalSalidas = movementSummary.salida

  const focusMetric = useMemo(() => {
    const badgeValue = formatNumber(totals.movimientos_30d ?? null)
    const badge = badgeValue === '—' ? null : `${badgeValue} movs · últimos 30 días`
    const helper =
      activeProductPct === null
        ? 'Sin datos suficientes de actividad'
        : `${formatNumber(totals.productos_activos ?? null)} productos activos (${activeProductPct}% del catálogo)`
    const netMovement = totalEntradas - totalSalidas
    const net = netMovement
      ? {
          label: netMovement > 0 ? 'Entradas netas' : 'Salidas netas',
          value: formatNumber(Math.abs(netMovement)),
          tone: netMovement > 0 ? '#22c55e' : '#ef4444',
        }
      : null

    return {
      title: 'Inventario total',
      value: formatNumber(totals.productos ?? null),
      helper,
      badge,
      net,
    }
  }, [activeProductPct, totalEntradas, totalSalidas, totals.productos, totals.productos_activos, totals.movimientos_30d])

  const quickCards = useMemo(
    () => [
      {
        key: 'categories',
        icon: 'diagram-3',
        label: 'Categorías',
        value: formatNumber(totals.categorias ?? null),
        description: `${formatNumber(totals.categorias_principales ?? null)} principales`,
        accent: '#eef2ff',
        iconColor: '#4f46e5',
      },
      {
        key: 'suppliers',
        icon: 'truck',
        label: 'Proveedores',
        value: formatNumber(totals.proveedores ?? null),
        description: Number(totals.proveedores ?? 0)
          ? `${formatNumber(totals.proveedores_activos ?? null)} activos${supplierActivePct !== null ? ` (${supplierActivePct}%)` : ''}`
          : 'Sin datos de proveedores',
        accent: '#fef3c7',
        iconColor: '#d97706',
      },
      {
        key: 'low-stock',
        icon: 'exclamation-triangle',
        label: 'Alertas de stock',
        value: formatNumber(lowStock?.count ?? null),
        description:
          lowStockShare === null
            ? 'Sin datos suficientes del catálogo'
            : `${lowStockShare}% del catálogo bajo umbral$${typeof lowStock?.threshold === 'number' ? ` (≤ ${formatNumber(lowStock.threshold)})` : ''}`.replace('$$', '$'),
        accent: '#fee2e2',
        iconColor: '#dc2626',
      },
      {
        key: 'movements',
        icon: 'arrow-left-right',
        label: 'Entradas / Salidas',
        value: `${formatNumber(totalEntradas)} · ${formatNumber(totalSalidas)}`,
        description: 'Movimientos recientes del período demo',
        accent: '#cffafe',
        iconColor: '#0ea5e9',
      },
    ],
    [lowStock?.count, lowStock?.threshold, lowStockShare, supplierActivePct, totalEntradas, totalSalidas, totals.categorias, totals.categorias_principales, totals.proveedores, totals.proveedores_activos]
  )

  const movementPreview = useMemo(() => movements.slice(0, 5), [movements])

  return (
    <div
      style={{
        background: palette.pageBg,
        minHeight: '100vh',
        padding: '32px 24px 48px',
      }}
    >
      <div className="container-xxl" style={{ maxWidth: '1280px', padding: '0 12px' }}>
        <header
          style={{
            background: palette.headerGradient,
            borderRadius: '28px',
            padding: '28px 32px',
            color: '#f8fafc',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '24px',
            justifyContent: 'space-between',
            boxShadow: '0 28px 55px rgba(15, 23, 42, 0.22)',
          }}
        >
          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            <span style={{ opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>
              Inventarios ASD
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: '6px 0' }}>Dashboard Preview</h1>
            <p style={{ margin: 0, maxWidth: 420, color: 'rgba(248, 250, 252, 0.75)' }}>
              Explorá variaciones estéticas del panel sin impactar la vista principal.
            </p>
          </div>

          <div style={{ flex: '1 1 260px', minWidth: 240 }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.35)',
                borderRadius: 18,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <i className="bi bi-search" style={{ fontSize: 18, opacity: 0.7 }} />
              <input
                type="search"
                className="form-control border-0 bg-transparent text-white"
                style={{ boxShadow: 'none', fontSize: 15, padding: 0 }}
                placeholder="Buscar (demo)"
                disabled
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '12px 18px',
              borderRadius: 24,
              backdropFilter: 'blur(6px)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: '#fff',
                color: palette.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              AD
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 15 }}>Administrador Demo</strong>
              <span style={{ fontSize: 13, color: 'rgba(248, 250, 252, 0.7)' }}>Head of Inventory</span>
            </div>
          </div>
        </header>

        {isLoading && <LoadingSpinner />}
        {isError && (
          <div className="alert alert-danger" role="alert">
            Error al cargar datos: {error?.message ?? 'desconocido'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="d-flex flex-column gap-4">
            <section>
              <div className="row g-4">
                <div className="col-12 col-xxl-8">
                  <div
                    style={{
                      background: palette.card,
                      borderRadius: 28,
                      padding: '26px 28px 22px',
                      boxShadow: '0 28px 55px rgba(15, 23, 42, 0.12)',
                      minHeight: 360,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 18,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 16,
                        alignItems: 'stretch',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: '1 1 260px', minWidth: 250 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <div
                            style={{
                              height: 38,
                              width: 38,
                              borderRadius: 12,
                              background: 'rgba(42, 157, 143, 0.12)',
                              color: palette.accent,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="bi bi-graph-up" />
                          </div>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: palette.textPrimary, margin: 0 }}>
                            {focusMetric.title}
                          </h2>
                        </div>
                        <div style={{ fontSize: 38, fontWeight: 700, color: palette.textPrimary }}>
                          {focusMetric.value}
                        </div>
                        <p style={{ margin: '6px 0 0', color: palette.textSecondary, fontSize: 14 }}>{focusMetric.helper}</p>
                        {focusMetric.net ? (
                          <div
                            style={{
                              marginTop: 12,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 999,
                              background: `${focusMetric.net.tone}20`,
                              color: focusMetric.net.tone,
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            <i className={`bi ${focusMetric.net.label.startsWith('Entrada') ? 'bi-arrow-down-left-circle' : 'bi-arrow-up-right-circle'}`} />
                            {focusMetric.net.label}: {focusMetric.net.value}
                          </div>
                        ) : null}
                      </div>
                      <div style={{
                        flex: '1 1 200px',
                        minWidth: 200,
                        borderRadius: 20,
                        padding: '18px 20px',
                        background: 'linear-gradient(140deg, rgba(79, 70, 229, 0.15), rgba(42, 157, 143, 0.12))',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>
                            Última actualización
                          </span>
                          {focusMetric.badge ? (
                            <span
                              style={{
                                padding: '4px 10px',
                                background: '#0f172a',
                                color: '#f8fafc',
                                borderRadius: 999,
                                fontSize: 11,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {focusMetric.badge}
                            </span>
                          ) : null}
                        </div>
                        <span style={{ fontWeight: 600, color: palette.textPrimary }}>{formatDateTime(data?.period?.current?.end)}</span>
                        <small style={{ color: palette.textSecondary }}>
                          El período evaluado cubre {data?.period?.days} días corridos. Ajustá el backend con `periodDays` para otras ventanas.
                        </small>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: palette.textPrimary, marginBottom: 4 }}>Tendencia de stock</h2>
                        <p style={{ color: palette.textSecondary, margin: 0 }}>
                          Stock actual versus mínimo configurado en los productos con alertas.
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, color: palette.textSecondary }}>Top {Math.min(lowStock.items.length, 6)} productos</span>
                      </div>
                    </div>
                    <div style={{ flexGrow: 1, minHeight: 240 }}>
                      <Line data={stockTrendData} options={stockTrendOptions} />
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xxl-4">
                  <div className="d-flex flex-column gap-3">
                    <div className="row g-3">
                      {quickCards.map((card) => (
                        <div key={card.key} className="col-12">
                          <div
                            style={{
                              borderRadius: 24,
                              padding: '20px 22px',
                              background: palette.card,
                              boxShadow: '0 24px 44px rgba(15, 23, 42, 0.12)',
                              border: `1px solid ${card.accent}70`,
                              display: 'flex',
                              gap: 18,
                              alignItems: 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 16,
                                background: card.accent,
                                color: card.iconColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                              }}
                            >
                              <i className={`bi bi-${card.icon}`} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
                                  {card.label}
                                </span>
                              </div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: palette.textPrimary }}>
                                {card.value}
                              </div>
                              <p style={{ margin: '4px 0 0', color: palette.textSecondary }}>{card.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="row g-4">
                <div className="col-12 col-lg-4">
                  <div
                    style={{
                      background: palette.card,
                      borderRadius: 26,
                      padding: '26px 24px',
                      boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
                      height: '100%',
                    }}
                  >
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, color: palette.textPrimary }}>Salud del inventario</h3>
                    <div className="d-flex flex-column align-items-center gap-3">
                      <div
                        style={{
                          width: 160,
                          height: 160,
                          borderRadius: '50%',
                          background:
                            activeProductPct === null
                              ? '#e2e8f0'
                              : `conic-gradient(${palette.accent} ${(activeProductPct || 0) * 3.6}deg, #e2e8f0 ${(activeProductPct || 0) * 3.6}deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            width: 110,
                            height: 110,
                            borderRadius: '50%',
                            background: palette.card,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            boxShadow: 'inset 0 0 0 1px rgba(148, 163, 184, 0.18)',
                          }}
                        >
                          <strong style={{ fontSize: 30, color: palette.textPrimary }}>
                            {activeProductPct === null ? '—' : `${activeProductPct}%`}
                          </strong>
                          <span style={{ fontSize: 12, color: palette.textSecondary }}>activos</span>
                        </div>
                      </div>
                      <p style={{ textAlign: 'center', margin: 0, color: palette.textSecondary }}>
                        {activeProductPct === null
                          ? 'No hay datos suficientes para calcular la proporción de productos activos.'
                          : `Actualmente, ${formatNumber(totals.productos_activos ?? null)} de ${formatNumber(
                              totals.productos ?? null
                            )} productos están disponibles.`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div
                    style={{
                      background: palette.card,
                      borderRadius: 26,
                      padding: '26px 24px',
                      boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 18,
                      height: '100%',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: palette.textPrimary, margin: 0 }}>Movimientos recientes</h3>
                      <span style={{ fontSize: 12, color: palette.textSecondary }}>Solo lectura</span>
                    </div>
                    {movementPreview.length === 0 ? (
                      <p style={{ color: palette.textSecondary, margin: 0 }}>Sin movimientos registrados.</p>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {movementPreview.map((mov) => (
                          <div
                            key={mov.id}
                            className="d-flex justify-content-between align-items-start"
                            style={{
                              background: palette.subtleCard,
                              borderRadius: 18,
                              padding: '12px 16px',
                            }}
                          >
                            <div>
                              <strong style={{ color: palette.textPrimary }}>#{mov.id}</strong>
                              <span
                                className="badge ms-2"
                                style={{
                                  backgroundColor:
                                    mov.tipo === 'entrada'
                                      ? 'rgba(34, 197, 94, 0.18)'
                                      : mov.tipo === 'salida'
                                      ? 'rgba(239, 68, 68, 0.2)'
                                      : 'rgba(148, 163, 184, 0.3)',
                                  color:
                                    mov.tipo === 'entrada'
                                      ? '#15803d'
                                      : mov.tipo === 'salida'
                                      ? '#b91c1c'
                                      : '#475467',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {mov.tipo}
                              </span>
                              {mov.referencia && (
                                <div style={{ color: palette.textSecondary, fontSize: 12 }}>{mov.referencia}</div>
                              )}
                            </div>
                            <div className="text-end">
                              <div style={{ fontWeight: 600, color: palette.textPrimary }}>{formatNumber(mov.cantidad ?? 0)}</div>
                              <div style={{ fontSize: 12, color: palette.textSecondary }}>
                                {formatDateTime(mov.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div
                    style={{
                      background: palette.card,
                      borderRadius: 26,
                      padding: '26px 24px',
                      boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                    }}
                  >
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: palette.textPrimary, margin: 0 }}>Resumen mensual</h3>
                    <div className="d-flex flex-column gap-3">
                      <SummaryRow
                        label="Entradas"
                        value={movementSummary.entrada}
                        color="#15803d"
                        helper="Ingresos de productos al inventario"
                      />
                      <SummaryRow
                        label="Salidas"
                        value={movementSummary.salida}
                        color="#b91c1c"
                        helper="Movimientos por ventas o consumos"
                      />
                      <SummaryRow
                        label="Otros"
                        value={movementSummary.otros}
                        color="#0f172a"
                        helper="Ajustes y transferencias"
                      />
                    </div>
                    <div
                      style={{
                        background: palette.subtleCard,
                        borderRadius: 18,
                        padding: '12px 16px',
                        fontSize: 13,
                        color: palette.textSecondary,
                      }}
                    >
                      Los datos provienen del endpoint <code>/dashboard/summary</code> y se actualizan cada vez que se ingresa a esta vista.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, color, helper }) {
  return (
    <div className="d-flex gap-3 align-items-start">
      <div
        style={{
          width: 12,
          height: 12,
          marginTop: 6,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: palette.textPrimary }}>{label}</strong>
          <span style={{ fontWeight: 600, color }}>{formatNumber(value)}</span>
        </div>
        <small style={{ color: palette.textSecondary }}>{helper}</small>
      </div>
    </div>
  )
}
