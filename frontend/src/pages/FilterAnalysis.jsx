import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MdShowChart, MdCalculate, MdInfo } from 'react-icons/md'

const FILTER_TYPES = ['Low-Pass', 'High-Pass', 'Band-Pass', 'Notch']
const FILTER_APPROX = ['Butterworth', 'Chebyshev I', 'Bessel']
const ORDERS = [1, 2, 3, 4, 6]

function butterworth(f, fc, order, type) {
  const ratio = f / fc
  let H2
  if (type === 'Low-Pass') {
    H2 = 1 / (1 + Math.pow(ratio, 2 * order))
  } else if (type === 'High-Pass') {
    H2 = 1 / (1 + Math.pow(fc / f, 2 * order))
  } else {
    H2 = 1 / (1 + Math.pow(ratio, 2 * order))
  }
  return 20 * Math.log10(Math.sqrt(H2))
}

function chebyshev(f, fc, order, ripple, type) {
  const eps = Math.sqrt(Math.pow(10, ripple / 10) - 1)
  let x = type === 'Low-Pass' ? f / fc : fc / f
  let Tn
  if (x <= 1) {
    Tn = Math.cos(order * Math.acos(x))
  } else {
    Tn = Math.cosh(order * Math.acosh(x))
  }
  const H2 = 1 / (1 + eps * eps * Tn * Tn)
  return 20 * Math.log10(Math.sqrt(Math.max(H2, 1e-20)))
}

function bessel(f, fc, order) {
  const ratio = f / fc
  let dB
  if (order === 1) dB = -20 * Math.log10(Math.sqrt(1 + ratio * ratio))
  else if (order === 2) dB = -20 * Math.log10(Math.sqrt(1 + ratio * ratio + Math.pow(ratio, 4) / 3))
  else dB = butterworth(f, fc, order, 'Low-Pass') - 3 * (order - 2) * 0.15
  return dB
}

function generateBodeData(fc, order, filterType, approx, ripple) {
  const points = []
  const fMin = fc / 100
  const fMax = fc * 100
  const steps = 120
  for (let i = 0; i <= steps; i++) {
    const f = fMin * Math.pow(fMax / fMin, i / steps)
    let mag
    if (approx === 'Butterworth') mag = butterworth(f, fc, order, filterType)
    else if (approx === 'Chebyshev I') mag = chebyshev(f, fc, order, ripple, filterType)
    else mag = bessel(f, fc, order)

    let phase = -order * Math.atan2(f, fc) * (180 / Math.PI)
    if (filterType === 'High-Pass') phase = 90 * order - phase

    points.push({
      freq: parseFloat(f.toFixed(2)),
      freqLabel: f >= 1000 ? `${(f / 1000).toFixed(1)}k` : f.toFixed(0),
      magnitude: parseFloat(Math.max(mag, -80).toFixed(2)),
      phase: parseFloat(phase.toFixed(1)),
    })
  }
  return points
}

function calcComponents(fc, order, filterType, approx) {
  const results = []
  const R = 10000
  const C = 1 / (2 * Math.PI * fc * R)

  if (filterType === 'Low-Pass' || filterType === 'High-Pass') {
    for (let i = 1; i <= Math.ceil(order / 2); i++) {
      const q = i <= order / 2
        ? 1 / (2 * Math.sin(((2 * i - 1) * Math.PI) / (2 * order)))
        : 1
      results.push({
        stage: `Stage ${i}`,
        R1: `${(R / 1000).toFixed(1)} kΩ`,
        R2: `${(R / 1000).toFixed(1)} kΩ`,
        C1: `${(C * 1e9).toFixed(2)} nF`,
        C2: `${(C * 1e9 * (order >= 2 ? 1 / (4 * q * q) : 1)).toFixed(2)} nF`,
        Q: q.toFixed(3),
        topology: 'Sallen-Key',
      })
    }
  } else {
    results.push({
      stage: 'Band-Pass',
      R1: `${(R / 1000).toFixed(1)} kΩ`,
      R2: `${(R * 2 / 1000).toFixed(1)} kΩ`,
      C1: `${(C * 1e9).toFixed(2)} nF`,
      C2: `${(C * 1e9).toFixed(2)} nF`,
      Q: '1.414',
      topology: 'Multiple Feedback',
    })
  }
  return results
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.625rem', fontSize: '0.775rem',
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        f = {label} Hz
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value} {p.dataKey === 'magnitude' ? 'dB' : '°'}
        </div>
      ))}
    </div>
  )
}

export default function FilterAnalysis() {
  const [fc, setFc] = useState(1000)
  const [order, setOrder] = useState(2)
  const [filterType, setFilterType] = useState('Low-Pass')
  const [approx, setApprox] = useState('Butterworth')
  const [ripple, setRipple] = useState(1)
  const [showPhase, setShowPhase] = useState(true)
  const [activeTab, setActiveTab] = useState('bode')

  const bodeData = useMemo(
    () => generateBodeData(fc, order, filterType, approx, ripple),
    [fc, order, filterType, approx, ripple]
  )

  const components = useMemo(
    () => calcComponents(fc, order, filterType, approx),
    [fc, order, filterType, approx]
  )

  const fcIdx = bodeData.findIndex(d => d.freq >= fc)
  const magAtFc = bodeData[fcIdx]?.magnitude ?? -3

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1100px', margin: '0 auto' }}
    >
      <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MdShowChart size={24} color="var(--accent)" /> Filter Analysis
      </h1>
      <p className="section-subtitle">Interactive Bode plot generator with component calculator for audio filters</p>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem' }} className="filter-grid">
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Filter Parameters
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
              Filter Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '1rem' }}>
              {FILTER_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '0.375rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem',
                    border: '1px solid',
                    borderColor: filterType === t ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: filterType === t ? 'var(--accent-light)' : 'transparent',
                    color: filterType === t ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: filterType === t ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
              Approximation
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
              {FILTER_APPROX.map(a => (
                <button
                  key={a}
                  onClick={() => setApprox(a)}
                  style={{
                    padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.775rem',
                    border: '1px solid',
                    borderColor: approx === a ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: approx === a ? 'var(--accent-light)' : 'transparent',
                    color: approx === a ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', textAlign: 'left', fontWeight: approx === a ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
              Cutoff Frequency: <span style={{ color: 'var(--accent)' }}>{fc >= 1000 ? `${(fc/1000).toFixed(1)}kHz` : `${fc}Hz`}</span>
            </label>
            <input
              type="range" min={20} max={20000} step={10} value={fc}
              onChange={e => setFc(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '1rem', accentColor: 'var(--accent)' }}
            />

            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
              Filter Order: <span style={{ color: 'var(--accent)' }}>{order}</span>
            </label>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: approx === 'Chebyshev I' ? '1rem' : '0' }}>
              {ORDERS.map(o => (
                <button
                  key={o}
                  onClick={() => setOrder(o)}
                  style={{
                    flex: 1, padding: '0.35rem', borderRadius: '6px',
                    border: '1px solid',
                    borderColor: order === o ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: order === o ? 'var(--accent-light)' : 'transparent',
                    color: order === o ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: order === o ? 700 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {o}
                </button>
              ))}
            </div>

            {approx === 'Chebyshev I' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                  Passband Ripple: <span style={{ color: 'var(--accent)' }}>{ripple} dB</span>
                </label>
                <input
                  type="range" min={0.1} max={3} step={0.1} value={ripple}
                  onChange={e => setRipple(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
              Filter Metrics
            </div>
            {[
              { label: 'Cutoff Freq', value: fc >= 1000 ? `${(fc/1000).toFixed(2)} kHz` : `${fc} Hz` },
              { label: 'Roll-off Rate', value: `${order * 20} dB/decade` },
              { label: 'Magnitude @ fc', value: `${magAtFc.toFixed(1)} dB` },
              { label: 'Approximation', value: approx },
            ].map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            {[
              { id: 'bode', label: 'Bode Plot' },
              { id: 'components', label: 'Component Values' },
              { id: 'info', label: 'Theory' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem',
                  border: '1px solid',
                  borderColor: activeTab === t.id ? 'var(--accent)' : 'transparent',
                  backgroundColor: activeTab === t.id ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: activeTab === t.id ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox" id="phase-toggle"
                checked={showPhase}
                onChange={e => setShowPhase(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <label htmlFor="phase-toggle">Show Phase</label>
            </div>
          </div>

          {activeTab === 'bode' && (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Magnitude & Phase Response — {approx} {order}th-order {filterType}
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={bodeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="freqLabel"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    interval={Math.floor(bodeData.length / 8)}
                    label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    yAxisId="mag"
                    domain={[-80, 5]}
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    label={{ value: 'dB', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  {showPhase && (
                    <YAxis
                      yAxisId="ph"
                      orientation="right"
                      domain={[-200, 50]}
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      label={{ value: 'Phase (°)', angle: 90, position: 'insideRight', fontSize: 11, fill: 'var(--text-muted)' }}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <ReferenceLine yAxisId="mag" y={-3} stroke="var(--warning)" strokeDasharray="5 3" label={{ value: '-3dB', fontSize: 10, fill: 'var(--warning)' }} />
                  <Line
                    yAxisId="mag"
                    type="monotone"
                    dataKey="magnitude"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                    name="Magnitude (dB)"
                  />
                  {showPhase && (
                    <Line
                      yAxisId="ph"
                      type="monotone"
                      dataKey="phase"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 3"
                      name="Phase (°)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Calculated Component Values
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Based on R = 10kΩ reference, Sallen-Key topology
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Stage', 'Topology', 'R1', 'R2', 'C1', 'C2', 'Q'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', backgroundColor: i % 2 ? 'var(--bg-tertiary)' : 'transparent' }}>
                        {['stage', 'topology', 'R1', 'R2', 'C1', 'C2', 'Q'].map(k => (
                          <td key={k} style={{ padding: '0.5rem 0.75rem', color: k === 'stage' ? 'var(--accent)' : 'var(--text-primary)', fontWeight: k === 'stage' ? 600 : 400 }}>
                            {c[k]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                <strong>Recommended Op-Amp:</strong> NE5532, TL072, or OPA2134 (for low-noise audio applications)
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdInfo size={16} color="var(--accent)" /> Filter Theory — {approx}
              </div>
              <FilterTheory approx={approx} filterType={filterType} order={order} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}

function FilterTheory({ approx, filterType, order }) {
  const info = {
    Butterworth: {
      desc: 'The Butterworth filter provides a maximally flat magnitude response in the passband (no ripple). It has a monotonically decreasing response from DC to infinity.',
      formula: '|H(jω)|² = 1 / (1 + (ω/ωc)^(2n))',
      use: 'General-purpose audio filtering, anti-aliasing, tone controls.',
      pros: 'Flat passband, no ripple, good transient response.',
      cons: 'Slower roll-off than Chebyshev for same order.',
    },
    'Chebyshev I': {
      desc: 'Chebyshev Type I filters have equiripple behavior in the passband and a monotone response in the stopband. Steeper initial roll-off than Butterworth.',
      formula: '|H(jω)|² = 1 / (1 + ε²·Tn²(ω/ωc))',
      use: 'Crossover networks, steep roll-off requirements, speaker protection.',
      pros: 'Steeper roll-off per order than Butterworth.',
      cons: 'Passband ripple, worse group delay than Butterworth.',
    },
    Bessel: {
      desc: 'Bessel filters are optimized for linear phase response (constant group delay). They preserve the wave shape of filtered signals.',
      formula: 'θ(ω) ≈ -n/ωc · ω (linear phase)',
      use: 'Audio crossovers where phase coherence is critical, pulse signal filtering.',
      pros: 'Linear phase, best transient response, no ringing.',
      cons: 'Slowest roll-off among common approximations.',
    },
  }
  const d = info[approx] || info.Butterworth
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{d.desc}</p>
      <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.8rem' }}>
        {d.formula}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '0.25rem', fontSize: '0.775rem' }}>✓ Advantages</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.775rem' }}>{d.pros}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--error)', marginBottom: '0.25rem', fontSize: '0.775rem' }}>✗ Limitations</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.775rem' }}>{d.cons}</div>
        </div>
      </div>
      <div>
        <strong style={{ color: 'var(--text-primary)' }}>Common Audio Applications:</strong>
        <div style={{ marginTop: '0.25rem' }}>{d.use}</div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Current Configuration:</strong>
        <div style={{ marginTop: '0.25rem' }}>
          {order}th-order {approx} {filterType} filter — Roll-off rate: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{order * 20} dB/decade</span>
        </div>
      </div>
    </div>
  )
}
