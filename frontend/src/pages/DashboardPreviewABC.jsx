import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const palette = {
  pageBg: '#f5f7f2',
  sidebarBg: '#101f15',
  sidebarAccent: '#1b3524',
  accent: '#2a9d8f',
  accentSoft: 'rgba(42, 157, 143, 0.12)',
  textPrimary: '#1f2933',
  textSecondary: '#475467',
  card: '#ffffff',
  tableHeader: '#e7f0e8',
}

const DEFAULT_PERIOD_DAYS = 30

const calcNetRatio = (entries, exits, days) => {
  const net = entries - exits
  const safeDays = days > 0 ? days : DEFAULT_PERIOD_DAYS
  const ratio = safeDays > 0 ? net / safeDays : 0
  return { net, ratio }
}

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(Number(value))
}

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  if (Number(value) === 0) return '0%'
  const formatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(Number(value))
  return `${Number(value) > 0 ? '+' : ''}${formatted}%`
}

const formatDelta = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  if (Number(value) === 0) return '0'
  const formatted = formatNumber(Math.abs(Number(value)))
  return Number(value) > 0 ? `+${formatted}` : `-${formatted}`
}

const buildEmptyBucketMap = () => ({
  A: { count: 0, movements: 0 },
  B: { count: 0, movements: 0 },
  C: { count: 0, movements: 0 },
})

const buildStats = (movements, days) => {
  if (!Array.isArray(movements) || movements.length === 0) {
    return {
      annotated: [],
      bucketMap: buildEmptyBucketMap(),
      totals: {
        products: 0,
        movements: 0,
        entradas: 0,
        salidas: 0,
        net: 0,
        ratio: 0,
      },
    }
  }

  const grouped = new Map()
  let totalEntries = 0
  let totalExits = 0

  movements.forEach((mov) => {
    const id = mov.producto_id ?? mov.id
    const entry = grouped.get(id) ?? {
      productId: id,
      productName: mov.producto_nombre ?? `Producto ${id}`,
      frequency: 0,
      totalQty: 0,
      entradas: 0,
      salidas: 0,
    }

    entry.frequency += 1
    const qty = Number(mov.cantidad ?? 0)
    entry.totalQty += qty
    if (mov.tipo === 'entrada') {
      entry.entradas += qty
      totalEntries += qty
    } else if (mov.tipo === 'salida') {
      entry.salidas += qty
      totalExits += qty
    }

    grouped.set(id, entry)
  })

  const items = Array.from(grouped.values())
  const totalMovements = items.reduce((acc, item) => acc + item.frequency, 0)
  const sorted = items.sort((a, b) => b.frequency - a.frequency)

  let cumulative = 0
  const annotated = sorted.map((item) => {
    cumulative += item.frequency
    const cumulativePct = totalMovements > 0 ? (cumulative / totalMovements) * 100 : 0
    let bucket = 'C'
    if (cumulativePct <= 80) bucket = 'A'
    else if (cumulativePct <= 95) bucket = 'B'
    return { ...item, bucket, cumulativePct }
  })

  const bucketMap = buildEmptyBucketMap()
  annotated.forEach((item) => {
    bucketMap[item.bucket].count += 1
    bucketMap[item.bucket].movements += item.frequency
  })

  const { net, ratio } = calcNetRatio(totalEntries, totalExits, days)

  return {
    annotated,
    bucketMap,
    totals: {
      products: annotated.length,
      movements: totalMovements,
      entradas: totalEntries,
      salidas: totalExits,
      net,
      ratio,
    },
  }
}

const formatDateRange = (start, end) => {
  if (!start || !end) return '—'
  try {
    const formatter = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    return `${formatter(start)} – ${formatter(end)}`
  } catch (error) {
    return '—'
  }
}

export default function DashboardPreviewABC() {
  const queryParams = useMemo(
    () => ({
      periodDays: DEFAULT_PERIOD_DAYS,
      includePreviousPeriod: true,
    }),
    []
  )

  const { data, isLoading, isError, error } = useDashboardSummary(queryParams)
  const currentMovements = data?.recentMovements ?? []
  const previousMovements = data?.recentMovementsPrevious ?? []
  const periodInfo = data?.period ?? null

  const currentStats = useMemo(() => buildStats(currentMovements, periodInfo?.days ?? DEFAULT_PERIOD_DAYS), [currentMovements, periodInfo?.days])

  const previousStats = useMemo(
    () => buildStats(previousMovements, periodInfo?.days ?? DEFAULT_PERIOD_DAYS),
    [previousMovements, periodInfo?.days]
  )

  const comparison = useMemo(() => {
    const deltaProduct = currentStats.totals.products - previousStats.totals.products
    const deltaMovements = currentStats.totals.movements - previousStats.totals.movements
    const deltaEntradas = currentStats.totals.entradas - previousStats.totals.entradas
    const deltaSalidas = currentStats.totals.salidas - previousStats.totals.salidas
    const deltaNet = currentStats.totals.net - previousStats.totals.net

    const pct = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const pctMovements = pct(currentStats.totals.movements, previousStats.totals.movements)
    const pctNet = pct(currentStats.totals.net, previousStats.totals.net)

    return {
      deltaProduct,
      deltaMovements,
      deltaEntradas,
      deltaSalidas,
      deltaNet,
      pctMovements,
      pctNet,
    }
  }, [currentStats, previousStats])

  const currentRange = periodInfo?.current ?? null
  const previousRange = periodInfo?.previous ?? null

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: palette.pageBg,
      }}
    >
      <aside
        style={{
          width: 240,
          background: palette.sidebarBg,
          color: '#f8fafc',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.08em' }}>Inventarios ASD</div>
          <p style={{ opacity: 0.7, marginTop: 4, marginBottom: 0, fontSize: 13 }}>Exploración de dashboard</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SidebarLink to="/dashboard-preview" label="General" icon="bi-speedometer2" />
          <SidebarLink to="/dashboard-preview/abc" label="ABC" icon="bi-pie-chart" active />
          <SidebarLink to="#" label="Próximamente" icon="bi-compass" disabled />
        </nav>

        <div style={{ marginTop: 'auto', fontSize: 12, lineHeight: 1.4, opacity: 0.65 }}>
          Los cálculos se basan en los movimientos recientes provistos por <code>/dashboard/summary</code>.
        </div>
      </aside>

      <main style={{ flex: 1, padding: '36px 42px' }}>
        <header
          style={{
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 4, color: palette.textPrimary }}>Clasificación ABC</h1>
            <p style={{ margin: 0, color: palette.textSecondary }}>
              Vista conceptual para segmentar productos según rotación y tendencias de movimiento.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 16px 32px rgba(15, 23, 42, 0.08)',
            }}
          >
            <i className="bi bi-calendar4-week" style={{ fontSize: 18, color: palette.accent }} />
            <div>
              <div style={{ fontWeight: 600, color: palette.textPrimary }}>Período evaluado</div>
              <small style={{ color: palette.textSecondary }}>
                {periodInfo?.days ?? DEFAULT_PERIOD_DAYS} días · {formatDateRange(currentRange?.start, currentRange?.end)}
              </small>
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
            <section className="row g-4">
              <ABCStatCard
                title="Total productos analizados"
                value={formatNumber(currentStats.totals.products)}
                caption="Productos con movimientos recientes"
              />
              <ABCStatCard
                title="Movimientos contabilizados"
                value={formatNumber(currentStats.totals.movements)}
                caption="Frecuencia por SKU"
              />
              <ABCStatCard
                title="Entradas vs salidas"
                value={`${formatNumber(currentStats.totals.entradas)} / ${formatNumber(currentStats.totals.salidas)}`}
                caption="Total ingresos / egresos"
              />
              <ABCStatCard
                title="Ratio neto"
                value={`${formatNumber(currentStats.totals.net)} (${formatNumber(currentStats.totals.ratio)} /día)`}
                caption="(Entradas - Salidas) / período"
              />
            </section>

            <section
              style={{
                background: palette.card,
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 16px 32px rgba(15, 23, 42, 0.08)',
              }}
            >
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: palette.textPrimary }}>Comparativa mes a mes</h2>
                  <p style={{ margin: 0, color: palette.textSecondary }}>
                    Contra el período anterior ({formatDateRange(previousRange?.start, previousRange?.end) || 'sin datos'}).
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  background: 'rgba(148, 163, 184, 0.14)',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <i className="bi bi-question-circle" style={{ fontSize: 18, color: palette.textSecondary, marginTop: 2 }} />
                <div style={{ color: palette.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
                  <div><strong>Cómo leerlo:</strong> cada tarjeta muestra el total actual y la variación numérica respecto al período previo. El color indica si el cambio es positivo (verde) o negativo (rojo).</div>
                  <div style={{ marginTop: 4 }}>Cuando aparece un porcentaje, se calcula como <em>((actual − previo) / previo) × 100</em>; si el período previo no tuvo datos, sólo se muestra la variación absoluta.</div>
                </div>
              </div>

              <div className="row g-4 mt-3">
                <MoMStat
                  label="Movimientos"
                  current={currentStats.totals.movements}
                  delta={comparison.deltaMovements}
                  percent={comparison.pctMovements}
                  previous={previousStats.totals.movements}
                />
                <MoMStat
                  label="Entradas"
                  current={currentStats.totals.entradas}
                  delta={comparison.deltaEntradas}
                  previous={previousStats.totals.entradas}
                />
                <MoMStat
                  label="Salidas"
                  current={currentStats.totals.salidas}
                  delta={comparison.deltaSalidas}
                  previous={previousStats.totals.salidas}
                />
                <MoMStat
                  label="Balance neto"
                  current={currentStats.totals.net}
                  delta={comparison.deltaNet}
                  percent={comparison.pctNet}
                  previous={previousStats.totals.net}
                />
              </div>
            </section>

            <section className="row g-4">
              <ABCBucketCard bucket="A" stats={currentStats.bucketMap.A} color={palette.accent} />
              <ABCBucketCard bucket="B" stats={currentStats.bucketMap.B} color="#f0b429" />
              <ABCBucketCard bucket="C" stats={currentStats.bucketMap.C} color="#9ca3af" />
            </section>

            <section
              style={{
                background: palette.card,
                borderRadius: 24,
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <div style={{ padding: '24px 28px', borderBottom: `1px solid ${palette.tableHeader}` }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: palette.textPrimary }}>Detalle de rotación</h2>
                <p style={{ margin: 0, color: palette.textSecondary }}>
                  Clasificación ABC basada en frecuencia acumulada de movimientos.
                </p>
              </div>

              <div className="table-responsive" style={{ padding: '12px 24px 24px' }}>
                <table className="table align-middle mb-0">
                  <thead style={{ background: palette.tableHeader }}>
                    <tr style={{ color: palette.textPrimary, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th scope="col">Producto</th>
                      <th scope="col" className="text-center">Movimientos</th>
                      <th scope="col" className="text-center">Entradas</th>
                      <th scope="col" className="text-center">Salidas</th>
                      <th scope="col" className="text-center">Clase</th>
                      <th scope="col" className="text-center">% acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStats.annotated.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-secondary py-4">
                          No hay movimientos suficientes para calcular la clasificación.
                        </td>
                      </tr>
                    )}
                    {currentStats.annotated.map((item) => (
                      <tr key={item.productId}>
                        <td>
                          <div style={{ fontWeight: 600, color: palette.textPrimary }}>{item.productName}</div>
                          <small style={{ color: palette.textSecondary }}>ID #{item.productId}</small>
                        </td>
                        <td className="text-center" style={{ color: palette.textPrimary }}>{formatNumber(item.frequency)}</td>
                        <td className="text-center" style={{ color: palette.textPrimary }}>{formatNumber(item.entradas)}</td>
                        <td className="text-center" style={{ color: palette.textPrimary }}>{formatNumber(item.salidas)}</td>
                        <td className="text-center">
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                item.bucket === 'A'
                                  ? palette.accentSoft
                                  : item.bucket === 'B'
                                    ? 'rgba(240, 180, 41, 0.18)'
                                    : 'rgba(156, 163, 175, 0.2)',
                              color:
                                item.bucket === 'A'
                                  ? palette.accent
                                  : item.bucket === 'B'
                                    ? '#b45309'
                                    : '#4b5563',
                              fontWeight: 700,
                              minWidth: 36,
                            }}
                          >
                            {item.bucket}
                          </span>
                        </td>
                        <td className="text-center" style={{ color: palette.textSecondary }}>{formatNumber(item.cumulativePct)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function SidebarLink({ to, label, icon, active, disabled }) {
  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    opacity: disabled ? 0.5 : 1,
    background: active ? palette.sidebarAccent : 'transparent',
    pointerEvents: disabled ? 'none' : 'auto',
    textDecoration: 'none',
    transition: 'background 0.2s ease',
  }

  if (disabled) {
    return (
      <span style={baseStyle}>
        <i className={`bi ${icon}`} />
        {label}
      </span>
    )
  }

  if (active) {
    return (
      <span style={baseStyle}>
        <i className={`bi ${icon}`} />
        {label}
      </span>
    )
  }

  return (
    <NavLink to={to} style={baseStyle} className={disabled ? undefined : ({ isActive }) => (isActive ? 'active' : '')}>
      <i className={`bi ${icon}`} style={{ fontSize: 16 }} />
      {label}
    </NavLink>
  )
}

function MoMStat({ label, current, delta, percent, previous }) {
  const isPositive = Number(delta) > 0
  const isNegative = Number(delta) < 0

  const trendColor = isPositive ? '#15803d' : isNegative ? '#b91c1c' : '#475467'
  const trendBg = isPositive ? 'rgba(21, 128, 61, 0.12)' : isNegative ? 'rgba(185, 28, 28, 0.12)' : 'rgba(71, 84, 103, 0.12)'

  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '20px 22px',
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 148,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: palette.textPrimary }}>{formatNumber(current)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: trendBg,
              color: trendColor,
              borderRadius: 999,
              padding: '4px 10px',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {formatDelta(delta)}
          </span>
          {percent !== undefined && percent !== null ? (
            <span style={{ color: trendColor, fontWeight: 600, fontSize: 12 }}>{formatPercent(percent)}</span>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <small style={{ color: '#94a3b8' }}>vs período previo</small>
          {previous !== undefined && previous !== null ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 11 }}>
              <i className="bi bi-clock-history" />
              {formatNumber(previous)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ABCStatCard({ title, value, caption }) {
  return (
    <div className="col-12 col-md-6 col-xl-3">
      <div
        style={{
          background: palette.card,
          borderRadius: 22,
          padding: '22px 24px',
          boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
          height: '100%',
        }}
      >
        <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>{title}</span>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: palette.textPrimary }}>{value}</div>
        <p style={{ margin: 0, color: palette.textSecondary }}>{caption}</p>
      </div>
    </div>
  )
}

function ABCBucketCard({ bucket, stats, color }) {
  const labels = {
    A: 'Alta rotación',
    B: 'Rotación media',
    C: 'Rotación baja',
  }

  const description = {
    A: 'Priorizar control y abastecimiento constante. Representan el 20% de SKUs.',
    B: 'Monitoreo periódico. Cubren demanda intermedia.',
    C: 'Movimiento escaso. Evaluar depuración o promociones.',
  }

  return (
    <div className="col-12 col-md-4">
      <div
        style={{
          background: palette.card,
          borderRadius: 24,
          padding: '24px 22px',
          boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span
            className="badge"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.08)',
              color,
              fontWeight: 700,
              fontSize: 16,
              padding: '8px 14px',
            }}
          >
            {bucket}
          </span>
          <span style={{ fontWeight: 600, color: palette.textPrimary }}>{labels[bucket]}</span>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>SKUs</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: palette.textPrimary }}>{formatNumber(stats.count)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>Movimientos</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: palette.textPrimary }}>{formatNumber(stats.movements)}</div>
          </div>
        </div>

        <p style={{ margin: 0, color: palette.textSecondary }}>{description[bucket]}</p>
      </div>
    </div>
  )
}
