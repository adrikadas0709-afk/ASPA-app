import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { MdShowChart, MdAdd, MdDelete, MdDownload } from 'react-icons/md'

/* ── transfer function magnitude calculators ───────────────────── */
function bwLPF(f, fc, n)  { return 10 * Math.log10(1 / (1 + Math.pow(f / fc, 2 * n))) }
function bwHPF(f, fc, n)  { return 10 * Math.log10(1 / (1 + Math.pow(fc / f, 2 * n))) }
function bwBPF(f, f0, Q, n) {
  const r = f / f0 - f0 / f
  return 10 * Math.log10(1 / (1 + Math.pow(Q * r, 2 * n)))
}
function peakEQ(f, f0, gain, Q) {
  const A  = Math.pow(10, gain / 40)
  const w  = f / f0
  const num = 1 + (A / Q) * w + w * w
  const den = 1 + (1 / (A * Q)) * w + w * w
  return 20 * Math.log10(Math.sqrt((num * num) / (den * den)) / 1)
}

function phaseLPF(f, fc, n)  { return -n * Math.atan(f / fc) * 180 / Math.PI }
function phaseHPF(f, fc, n)  { return  n * (90 - Math.atan(f / fc) * 180 / Math.PI) }

function computePlot(curves) {
  const data = []
  for (let i = 0; i <= 300; i++) {
    const f = 10 * Math.pow(22000 / 10, i / 300)
    const pt = {
      freqLabel: f >= 1000 ? `${(f / 1000).toFixed(1)}k` : f.toFixed(0),
    }
    for (const c of curves) {
      if (!c.visible) continue
      let mag = 0
      if (c.type === 'Low-Pass')    mag = bwLPF(f, c.fc, c.order)
      else if (c.type === 'High-Pass') mag = bwHPF(f, c.fc, c.order)
      else if (c.type === 'Band-Pass') mag = bwBPF(f, c.fc, c.Q, c.order)
      else if (c.type === 'Peaking EQ') mag = peakEQ(f, c.fc, c.gain, c.Q)
      pt[`mag_${c.id}`]   = parseFloat(Math.max(mag, -80).toFixed(2))
      pt[`phase_${c.id}`] = parseFloat(
        (c.type === 'High-Pass' ? phaseHPF : phaseLPF)(f, c.fc, c.order).toFixed(1)
      )
    }
    data.push(pt)
  }
  return data
}

const CURVE_TYPES  = ['Low-Pass', 'High-Pass', 'Band-Pass', 'Peaking EQ']
const CURVE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

let nextId = 3

const DEFAULT_CURVES = [
  { id: 1, label: 'LPF Stage',  type: 'Low-Pass',  fc: 8000,  order: 2, Q: 0.707, gain: 0, visible: true, color: '#3b82f6' },
  { id: 2, label: 'HPF Stage',  type: 'High-Pass', fc: 80,    order: 2, Q: 0.707, gain: 0, visible: true, color: '#8b5cf6' },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.775rem', maxWidth: 200 }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        f = {payload[0]?.payload?.freqLabel} Hz
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value > 0 ? '+' : ''}{p.value} {p.dataKey?.startsWith('phase') ? '°' : 'dB'}
        </div>
      ))}
    </div>
  )
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

export default function FrequencyResponsePlotter() {
  const [curves,    setCurves]    = useState(DEFAULT_CURVES)
  const [selected,  setSelected]  = useState(1)
  const [showPhase, setShowPhase] = useState(false)
  const [yMin,      setYMin]      = useState(-60)
  const [yMax,      setYMax]      = useState(10)

  const plotData = useMemo(() => computePlot(curves), [curves])
  const sel      = curves.find(c => c.id === selected) || curves[0]

  const updateCurve = (id, field, value) =>
    setCurves(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))

  const addCurve = () => {
    const id    = nextId++
    const color = CURVE_COLORS[(id - 1) % CURVE_COLORS.length]
    setCurves(prev => [...prev, {
      id, label: `Curve ${id}`, type: 'Low-Pass',
      fc: 1000, order: 2, Q: 0.707, gain: 0, visible: true, color,
    }])
    setSelected(id)
  }

  const removeCurve = (id) => {
    if (curves.length <= 1) return
    setCurves(prev => prev.filter(c => c.id !== id))
    setSelected(curves.find(c => c.id !== id)?.id ?? 1)
  }

  const exportCSV = () => {
    const header = ['Frequency', ...curves.filter(c => c.visible).map(c => c.label + ' (dB)')].join(',')
    const rows = plotData.map(d => {
      const vals = curves.filter(c => c.visible).map(c => d[`mag_${c.id}`] ?? '')
      return [d.freqLabel, ...vals].join(',')
    })
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'freq-response.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ maxWidth: '1100px', margin: '0 auto' }}>

      <motion.div variants={itemVariants}>
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MdShowChart size={24} color="var(--accent)" /> Frequency Response Plotter
        </h1>
        <p className="section-subtitle">Overlay multiple filter and EQ transfer functions on a single Bode magnitude plot</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }} className="frp-grid">

        {/* Chart side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Plot controls bar */}
          <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={addCurve} disabled={curves.length >= 6}
              style={{ fontSize: '0.8rem', opacity: curves.length >= 6 ? 0.5 : 1 }}>
              <MdAdd size={15} /> Add Curve
            </button>
            <button className="btn-secondary" onClick={exportCSV} style={{ fontSize: '0.8rem' }}>
              <MdDownload size={15} /> Export CSV
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={showPhase} onChange={e => setShowPhase(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              Phase response
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Y:
              <input type="number" value={yMin} onChange={e => setYMin(Number(e.target.value))}
                style={{ width: 52, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.4rem', fontSize: '0.775rem', color: 'var(--text-primary)' }} />
              to
              <input type="number" value={yMax} onChange={e => setYMax(Number(e.target.value))}
                style={{ width: 52, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.4rem', fontSize: '0.775rem', color: 'var(--text-primary)' }} />
              dB
            </div>
          </motion.div>

          {/* Main chart */}
          <motion.div variants={itemVariants} className="card" style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={plotData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="freqLabel" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={40}
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis yAxisId="m" domain={[yMin, yMax]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  label={{ value: 'Magnitude (dB)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }} />
                {showPhase && (
                  <YAxis yAxisId="p" orientation="right" domain={[-200, 50]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    label={{ value: 'Phase (°)', angle: 90, position: 'insideRight', fontSize: 11, fill: 'var(--text-muted)' }} />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                <ReferenceLine yAxisId="m" y={-3} stroke="var(--warning)" strokeDasharray="5 3"
                  label={{ value: '−3 dB', fill: 'var(--warning)', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine yAxisId="m" y={0} stroke="var(--text-muted)" strokeOpacity={0.4} />
                {curves.filter(c => c.visible).map(c => (
                  <Line key={`mag_${c.id}`} yAxisId="m" type="monotone" dataKey={`mag_${c.id}`}
                    stroke={c.color} strokeWidth={selected === c.id ? 2.5 : 1.5}
                    dot={false} name={`${c.label} (dB)`}
                    strokeOpacity={selected === c.id ? 1 : 0.6} />
                ))}
                {showPhase && curves.filter(c => c.visible).map(c => (
                  <Line key={`phase_${c.id}`} yAxisId="p" type="monotone" dataKey={`phase_${c.id}`}
                    stroke={c.color} strokeWidth={1} dot={false} strokeDasharray="4 3"
                    name={`${c.label} phase (°)`} strokeOpacity={0.5} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Curve legend row */}
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {curves.map(c => (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.375rem 0.75rem', borderRadius: '9999px', cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selected === c.id ? c.color : 'var(--border)',
                  backgroundColor: selected === c.id ? `${c.color}18` : 'var(--bg-secondary)',
                  opacity: c.visible ? 1 : 0.4, transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.775rem', fontWeight: selected === c.id ? 600 : 400, color: 'var(--text-primary)' }}>{c.label}</span>
                <button
                  onClick={e => { e.stopPropagation(); updateCurve(c.id, 'visible', !c.visible) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem', padding: 0 }}>
                  {c.visible ? '👁' : '○'}
                </button>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Editor column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sel && (
            <motion.div variants={itemVariants} className="card" style={{ borderLeft: `4px solid ${sel.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Edit Curve</div>
                {curves.length > 1 && (
                  <button onClick={() => removeCurve(sel.id)}
                    style={{ background: 'none', border: `1px solid var(--error)`, borderRadius: '6px', cursor: 'pointer', color: 'var(--error)', padding: '0.2rem 0.4rem' }}>
                    <MdDelete size={14} />
                  </button>
                )}
              </div>

              {/* Label */}
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Label</label>
                <input className="input-field" value={sel.label} onChange={e => updateCurve(sel.id, 'label', e.target.value)}
                  style={{ fontSize: '0.8rem' }} />
              </div>

              {/* Type */}
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Type</label>
                <select className="input-field" value={sel.type} onChange={e => updateCurve(sel.id, 'type', e.target.value)} style={{ fontSize: '0.8rem' }}>
                  {CURVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Sliders */}
              <FRPSlider label="Cutoff / Centre Freq" value={sel.fc} onChange={v => updateCurve(sel.id, 'fc', v)}
                min={20} max={20000} step={10} color={sel.color}
                display={sel.fc >= 1000 ? `${(sel.fc/1000).toFixed(2)} kHz` : `${sel.fc} Hz`} />

              {sel.type !== 'Peaking EQ' && (
                <div style={{ marginBottom: '0.875rem' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span>Filter Order</span>
                    <span style={{ color: sel.color, fontWeight: 700 }}>{sel.order}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[1, 2, 3, 4].map(o => (
                      <button key={o} onClick={() => updateCurve(sel.id, 'order', o)} style={{
                        flex: 1, padding: '0.35rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid', cursor: 'pointer',
                        borderColor: sel.order === o ? sel.color : 'var(--border)',
                        backgroundColor: sel.order === o ? `${sel.color}20` : 'transparent',
                        color: sel.order === o ? sel.color : 'var(--text-secondary)',
                        fontWeight: sel.order === o ? 700 : 400, transition: 'all 0.15s',
                      }}>{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {(sel.type === 'Band-Pass' || sel.type === 'Peaking EQ') && (
                <FRPSlider label="Q Factor" value={sel.Q} onChange={v => updateCurve(sel.id, 'Q', v)}
                  min={0.3} max={10} step={0.1} color={sel.color} display={sel.Q.toFixed(2)} />
              )}

              {sel.type === 'Peaking EQ' && (
                <FRPSlider label="Gain" value={sel.gain} onChange={v => updateCurve(sel.id, 'gain', v)}
                  min={-18} max={18} step={0.5} color={sel.color}
                  display={`${sel.gain > 0 ? '+' : ''}${sel.gain.toFixed(1)} dB`} />
              )}

              {/* Color picker */}
              <div style={{ marginTop: '0.625rem' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Curve Color</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {CURVE_COLORS.map(col => (
                    <button key={col} onClick={() => updateCurve(sel.id, 'color', col)} style={{
                      width: 24, height: 24, borderRadius: '50%', backgroundColor: col,
                      border: `2px solid ${sel.color === col ? 'var(--text-primary)' : 'transparent'}`,
                      cursor: 'pointer', flexShrink: 0,
                    }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary table */}
          <motion.div variants={itemVariants} className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Curve Summary</div>
            {curves.map(c => (
              <div key={c.id} onClick={() => setSelected(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem',
                borderRadius: '7px', marginBottom: '0.25rem', cursor: 'pointer',
                backgroundColor: selected === c.id ? 'var(--accent-light)' : 'transparent',
                transition: 'background-color 0.15s',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.775rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{c.label}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {c.fc >= 1000 ? `${(c.fc/1000).toFixed(1)}k` : c.fc}Hz
                </span>
                <span style={{ fontSize: '0.7rem', color: c.color, fontWeight: 600 }}>{c.type.slice(0,3)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .frp-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </motion.div>
  )
}

function FRPSlider({ label, value, onChange, min, max, step, display, color }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: color || 'var(--accent)', fontFamily: 'monospace' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color || 'var(--accent)' }} />
    </div>
  )
}
