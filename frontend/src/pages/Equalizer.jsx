import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts'
import { MdEqualizer, MdAdd, MdDelete, MdRefresh } from 'react-icons/md'

const defaultBands = [
  { id: 1, freq: 80, gain: 0, q: 1.0, type: 'Low Shelf', enabled: true, color: '#ef4444' },
  { id: 2, freq: 250, gain: 0, q: 1.4, type: 'Peak', enabled: true, color: '#f97316' },
  { id: 3, freq: 1000, gain: 0, q: 1.0, type: 'Peak', enabled: true, color: '#eab308' },
  { id: 4, freq: 4000, gain: 0, q: 1.4, type: 'Peak', enabled: true, color: '#22c55e' },
  { id: 5, freq: 12000, gain: 0, q: 1.0, type: 'High Shelf', enabled: true, color: '#3b82f6' },
]

const BAND_TYPES = ['Peak', 'Low Shelf', 'High Shelf', 'Low Pass', 'High Pass', 'Notch']

function peakFilter(f, fc, gain, q) {
  if (Math.abs(gain) < 0.01) return 0
  const w = 2 * Math.PI * f
  const wc = 2 * Math.PI * fc
  const A = Math.pow(10, gain / 40)
  const ratio = w / wc
  const num = 1 + (A / q) * ratio + ratio * ratio
  const den = 1 + (1 / (A * q)) * ratio + ratio * ratio
  return 20 * Math.log10(Math.sqrt((num * num) / (den * den)) / 1)
}

function shelfFilter(f, fc, gain, isLow) {
  const ratio = isLow ? f / fc : fc / f
  if (Math.abs(gain) < 0.01) return 0
  const A = Math.pow(10, gain / 40)
  const num = A * A * (1 + 2 * A * ratio + ratio * ratio)
  const den = 1 + 2 * A * ratio + A * A * ratio * ratio
  return 20 * Math.log10(Math.sqrt(num / den))
}

function calcTotalResponse(bands, freq) {
  let total = 0
  for (const band of bands) {
    if (!band.enabled) continue
    if (band.type === 'Peak') total += peakFilter(freq, band.freq, band.gain, band.q)
    else if (band.type === 'Low Shelf') total += shelfFilter(freq, band.freq, band.gain, true)
    else if (band.type === 'High Shelf') total += shelfFilter(freq, band.freq, band.gain, false)
    else if (band.type === 'Notch') total += peakFilter(freq, band.freq, -30 * (band.gain < 0 ? 1 : 0.3), 5)
  }
  return total
}

function generateEQCurve(bands) {
  const freqs = []
  for (let i = 0; i <= 200; i++) {
    const f = 20 * Math.pow(22000 / 20, i / 200)
    const total = calcTotalResponse(bands, f)
    const point = {
      freq: f.toFixed(1),
      freqLabel: f >= 1000 ? `${(f / 1000).toFixed(1)}k` : f.toFixed(0),
      total: parseFloat(total.toFixed(2)),
    }
    for (const band of bands) {
      if (!band.enabled) continue
      let mag = 0
      if (band.type === 'Peak') mag = peakFilter(f, band.freq, band.gain, band.q)
      else if (band.type === 'Low Shelf') mag = shelfFilter(f, band.freq, band.gain, true)
      else if (band.type === 'High Shelf') mag = shelfFilter(f, band.freq, band.gain, false)
      point[`band${band.id}`] = parseFloat(mag.toFixed(2))
    }
    freqs.push(point)
  }
  return freqs
}

export default function Equalizer() {
  const [bands, setBands] = useState(defaultBands)
  const [selectedBand, setSelectedBand] = useState(1)
  const [showIndividual, setShowIndividual] = useState(false)

  const data = useMemo(() => generateEQCurve(bands), [bands])

  const updateBand = (id, field, value) => {
    setBands(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const addBand = () => {
    if (bands.length >= 8) return
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']
    const newId = Math.max(...bands.map(b => b.id)) + 1
    setBands(prev => [...prev, {
      id: newId, freq: 2000, gain: 0, q: 1.0,
      type: 'Peak', enabled: true,
      color: colors[(newId - 1) % colors.length],
    }])
    setSelectedBand(newId)
  }

  const removeBand = (id) => {
    if (bands.length <= 1) return
    setBands(prev => prev.filter(b => b.id !== id))
    setSelectedBand(bands[0].id)
  }

  const resetBands = () => {
    setBands(defaultBands.map(b => ({ ...b, gain: 0 })))
  }

  const sel = bands.find(b => b.id === selectedBand) || bands[0]

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>f = {payload[0]?.payload?.freqLabel} Hz</div>
        {payload.map(p => (
          <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value > 0 ? '+' : ''}{p.value} dB</div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1100px', margin: '0 auto' }}
    >
      <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MdEqualizer size={24} color="var(--accent)" /> Parametric Equalizer
      </h1>
      <p className="section-subtitle">Design multi-band parametric EQ with real-time frequency response visualization</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }} className="eq-grid">
        {/* Chart + Band Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Frequency response chart */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Frequency Response Curve
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.775rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showIndividual}
                    onChange={e => setShowIndividual(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Show individual bands
                </label>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="freqLabel" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={25}
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[-18, 18]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  label={{ value: 'Gain (dB)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 2" />
                {showIndividual && bands.filter(b => b.enabled && Math.abs(b.gain) > 0).map(b => (
                  <Line
                    key={`band${b.id}`}
                    type="monotone"
                    dataKey={`band${b.id}`}
                    stroke={b.color}
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="4 2"
                    name={`Band ${b.id} (${b.freq >= 1000 ? `${b.freq/1000}kHz` : `${b.freq}Hz`})`}
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#totalGrad)"
                  dot={false}
                  name="Total Response"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Band selector row */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>EQ Bands</span>
              <button className="btn-secondary" onClick={addBand} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} disabled={bands.length >= 8}>
                <MdAdd size={14} /> Add Band
              </button>
              <button className="btn-secondary" onClick={resetBands} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <MdRefresh size={14} /> Reset
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {bands.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBand(b.id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: selectedBand === b.id ? b.color : 'var(--border)',
                    backgroundColor: selectedBand === b.id ? `${b.color}20` : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    minWidth: '70px',
                    opacity: b.enabled ? 1 : 0.4,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: b.color, fontWeight: 700 }}>
                    {b.freq >= 1000 ? `${(b.freq / 1000).toFixed(1)}k` : b.freq}Hz
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {b.gain > 0 ? '+' : ''}{b.gain.toFixed(1)} dB
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{b.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Band editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sel && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Band {sel.id} Editor
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    onClick={() => updateBand(sel.id, 'enabled', !sel.enabled)}
                    style={{
                      padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem',
                      border: '1px solid var(--border)',
                      backgroundColor: sel.enabled ? 'var(--success)' : 'var(--bg-tertiary)',
                      color: sel.enabled ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {sel.enabled ? 'On' : 'Off'}
                  </button>
                  {bands.length > 1 && (
                    <button
                      onClick={() => removeBand(sel.id)}
                      style={{ padding: '0.25rem 0.375rem', borderRadius: '6px', border: '1px solid var(--error)', background: 'none', cursor: 'pointer', color: 'var(--error)' }}
                    >
                      <MdDelete size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                  Filter Type
                </label>
                <select
                  value={sel.type}
                  onChange={e => updateBand(sel.id, 'type', e.target.value)}
                  className="input-field"
                  style={{ fontSize: '0.8rem' }}
                >
                  {BAND_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Frequency */}
              <EQSlider
                label="Center Frequency"
                value={sel.freq}
                onChange={v => updateBand(sel.id, 'freq', v)}
                min={20} max={20000} step={10}
                display={sel.freq >= 1000 ? `${(sel.freq/1000).toFixed(2)} kHz` : `${sel.freq} Hz`}
                color={sel.color}
              />

              {/* Gain */}
              <EQSlider
                label="Gain"
                value={sel.gain}
                onChange={v => updateBand(sel.id, 'gain', v)}
                min={-18} max={18} step={0.5}
                display={`${sel.gain > 0 ? '+' : ''}${sel.gain.toFixed(1)} dB`}
                color={sel.color}
              />

              {/* Q */}
              {(sel.type === 'Peak' || sel.type === 'Notch') && (
                <EQSlider
                  label="Q Factor"
                  value={sel.q}
                  onChange={v => updateBand(sel.id, 'q', v)}
                  min={0.3} max={10} step={0.1}
                  display={sel.q.toFixed(2)}
                  color={sel.color}
                />
              )}

              {/* Visual indicator */}
              <div style={{
                marginTop: '1rem', padding: '0.875rem',
                backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: `${sel.color}20`, border: `2px solid ${sel.color}`, margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdEqualizer size={24} color={sel.color} />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sel.type}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {sel.freq >= 1000 ? `${(sel.freq/1000).toFixed(2)}kHz` : `${sel.freq}Hz`} · Q={sel.q}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: sel.color, marginTop: '0.25rem' }}>
                  {sel.gain > 0 ? '+' : ''}{sel.gain.toFixed(1)} dB
                </div>
              </div>
            </div>
          )}

          {/* EQ presets */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
              Quick Presets
            </div>
            {[
              { name: 'Flat (Reset)', gains: [0, 0, 0, 0, 0] },
              { name: 'Loudness', gains: [6, 2, 0, 1, 4] },
              { name: 'Vocal Boost', gains: [-2, -2, 4, 5, 2] },
              { name: 'Bass Boost', gains: [8, 4, 0, 0, 0] },
              { name: 'Presence', gains: [-1, 0, 3, 6, 4] },
              { name: 'Broadcast', gains: [-3, 2, 4, 3, 2] },
            ].map(preset => (
              <button
                key={preset.name}
                onClick={() => setBands(prev => prev.map((b, i) => ({ ...b, gain: preset.gains[i] ?? 0 })))}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.4rem 0.625rem', borderRadius: '6px', marginBottom: '0.3rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.8rem',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .eq-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}

function EQSlider({ label, value, onChange, min, max, step, display, color }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: color || 'var(--accent)', fontFamily: 'monospace' }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color || 'var(--accent)' }}
      />
    </div>
  )
}
