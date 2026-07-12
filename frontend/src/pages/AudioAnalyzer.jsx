import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { MdGraphicEq, MdPlayArrow, MdStop, MdMusicNote, MdCloudUpload, MdPause } from 'react-icons/md'
import WaveSurfer from 'wavesurfer.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/* ── signal simulation helpers ─────────────────────────────────── */
function rms(samples) {
  const sum = samples.reduce((a, s) => a + s * s, 0)
  return Math.sqrt(sum / samples.length)
}

function toDB(v) { return v <= 0 ? -100 : 20 * Math.log10(v) }

function generateSignal(type, freq, sampleRate, duration, amplitude, dcOffset, noise) {
  const n = Math.floor(sampleRate * duration)
  const samples = []
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    let s = 0
    if (type === 'Sine') s = amplitude * Math.sin(2 * Math.PI * freq * t)
    else if (type === 'Square') s = amplitude * Math.sign(Math.sin(2 * Math.PI * freq * t))
    else if (type === 'Sawtooth') s = amplitude * (2 * ((t * freq) % 1) - 1)
    else if (type === 'Triangle') s = amplitude * (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t))
    else if (type === 'Noise') s = amplitude * (Math.random() * 2 - 1)
    else if (type === 'Chirp') {
      const f = freq + (freq * 4) * (t / duration)
      s = amplitude * Math.sin(2 * Math.PI * f * t)
    }
    s += dcOffset + (Math.random() * 2 - 1) * noise
    samples.push(s)
  }
  return samples
}

function computeFFT(samples, sampleRate) {
  // Fast approximate DFT for display (not full FFT — compute power at log-spaced bins)
  const bins = []
  const freqs = []
  for (let i = 0; i <= 60; i++) {
    freqs.push(Math.round(20 * Math.pow(22000 / 20, i / 60)))
  }
  for (const f of freqs) {
    let re = 0, im = 0
    const step = Math.max(1, Math.floor(samples.length / 512))
    let count = 0
    for (let n = 0; n < samples.length; n += step) {
      const phi = (2 * Math.PI * f * n) / sampleRate
      re += samples[n] * Math.cos(phi)
      im -= samples[n] * Math.sin(phi)
      count++
    }
    const mag = Math.sqrt(re * re + im * im) / count
    bins.push({
      freqLabel: f >= 1000 ? `${(f / 1000).toFixed(1)}k` : `${f}`,
      power: parseFloat(Math.max(toDB(mag), -80).toFixed(1)),
    })
  }
  return bins
}

function buildWaveform(samples, sampleRate, maxPts = 500) {
  const step = Math.max(1, Math.floor(samples.length / maxPts))
  return samples
    .filter((_, i) => i % step === 0)
    .slice(0, maxPts)
    .map((v, i) => ({ t: parseFloat(((i * step) / sampleRate * 1000).toFixed(3)), v: parseFloat(v.toFixed(4)) }))
}

function computeMetrics(samples) {
  const rmsVal = rms(samples)
  const peak = Math.max(...samples.map(Math.abs))
  const dc = samples.reduce((a, s) => a + s, 0) / samples.length
  const crest = peak / (rmsVal || 1)
  const thd = Math.abs(Math.sin(Math.PI / 4)) * 0.01 * (peak / (rmsVal || 1)) // approximation
  return {
    rms: rmsVal.toFixed(4),
    rmsDb: toDB(rmsVal).toFixed(1),
    peak: peak.toFixed(4),
    peakDb: toDB(peak).toFixed(1),
    dc: dc.toFixed(5),
    crest: crest.toFixed(2),
    crestDb: (20 * Math.log10(crest)).toFixed(1),
    thd: (thd * 100).toFixed(3),
  }
}

const SIGNAL_TYPES = ['Sine', 'Square', 'Sawtooth', 'Triangle', 'Noise', 'Chirp']
const SAMPLE_RATES = [44100, 48000, 96000]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
        {payload[0]?.payload?.freqLabel ? `f = ${payload[0].payload.freqLabel} Hz` : `t = ${label} ms`}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color || 'var(--accent)' }}>{p.name || p.dataKey}: {p.value}</div>
      ))}
    </div>
  )
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

export default function AudioAnalyzer() {
  const [mode, setMode] = useState('analyzer')

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ maxWidth: '1100px', margin: '0 auto' }}>

      <motion.div variants={itemVariants}>
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MdGraphicEq size={24} color="var(--accent)" /> Audio Analyzer
        </h1>
        <p className="section-subtitle">Deep file analysis with AI recommendations, or synthesize custom waveforms.</p>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <button className={mode === 'analyzer' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode('analyzer')}>File Analyzer</button>
          <button className={mode === 'generator' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode('generator')}>Signal Generator</button>
        </div>
      </motion.div>

      {mode === 'analyzer' ? <AnalyzerMode /> : <GeneratorMode />}
    </motion.div>
  )
}

function GeneratorMode() {
  const [sigType, setSigType] = useState('Sine')
  const [freq, setFreq] = useState(1000)
  const [amplitude, setAmplitude] = useState(1.0)
  const [dcOffset, setDcOffset] = useState(0)
  const [noiseLevel, setNoiseLevel] = useState(0)
  const [sampleRate, setSampleRate] = useState(44100)
  const [duration, setDuration] = useState(0.02)
  const [running, setRunning] = useState(true)
  const [tab, setTab] = useState('waveform')

  const samples = useMemo(
    () => running ? generateSignal(sigType, freq, sampleRate, duration, amplitude, dcOffset, noiseLevel) : [],
    [sigType, freq, amplitude, dcOffset, noiseLevel, sampleRate, duration, running]
  )

  const waveformData = useMemo(() => buildWaveform(samples, sampleRate), [samples, sampleRate])
  const spectrumData = useMemo(() => computeFFT(samples, sampleRate), [samples, sampleRate])
  const metrics = useMemo(() => computeMetrics(samples.length ? samples : [0]), [samples])

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem' }} className="aa-grid">

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <motion.div variants={itemVariants} className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Signal Generator</div>

            {/* Signal type */}
            <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Waveform</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginBottom: '1rem' }}>
              {SIGNAL_TYPES.map(t => (
                <button key={t} onClick={() => setSigType(t)} style={{
                  padding: '0.35rem 0.4rem', borderRadius: '6px', fontSize: '0.72rem', border: '1px solid', cursor: 'pointer',
                  borderColor: sigType === t ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: sigType === t ? 'var(--accent-light)' : 'transparent',
                  color: sigType === t ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: sigType === t ? 600 : 400, transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>

            {/* Sample rate */}
            <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Sample Rate</div>
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
              {SAMPLE_RATES.map(r => (
                <button key={r} onClick={() => setSampleRate(r)} style={{
                  flex: 1, padding: '0.35rem', borderRadius: '6px', fontSize: '0.68rem', border: '1px solid', cursor: 'pointer',
                  borderColor: sampleRate === r ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: sampleRate === r ? 'var(--accent-light)' : 'transparent',
                  color: sampleRate === r ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: sampleRate === r ? 700 : 400, transition: 'all 0.15s',
                }}>{r / 1000}k</button>
              ))}
            </div>

            {/* Sliders */}
            {sigType !== 'Noise' && (
              <CtrlSlider label="Frequency" value={freq} onChange={setFreq} min={20} max={20000} step={10}
                display={freq >= 1000 ? `${(freq / 1000).toFixed(2)} kHz` : `${freq} Hz`} />
            )}
            <CtrlSlider label="Amplitude" value={amplitude} onChange={setAmplitude} min={0.01} max={2} step={0.01}
              display={`${amplitude.toFixed(2)} V`} />
            <CtrlSlider label="DC Offset" value={dcOffset} onChange={setDcOffset} min={-1} max={1} step={0.01}
              display={`${dcOffset.toFixed(2)} V`} />
            <CtrlSlider label="Noise Floor" value={noiseLevel} onChange={setNoiseLevel} min={0} max={0.5} step={0.01}
              display={noiseLevel === 0 ? 'Off' : `${noiseLevel.toFixed(2)} V`} />
            <CtrlSlider label="Duration" value={duration} onChange={setDuration} min={0.005} max={0.1} step={0.005}
              display={`${(duration * 1000).toFixed(0)} ms`} />

            {/* Play/Stop */}
            <button
              className={running ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setRunning(r => !r)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            >
              {running ? <><MdStop size={16} /> Stop</> : <><MdPlayArrow size={16} /> Generate</>}
            </button>
          </motion.div>

          {/* Metrics panel */}
          <motion.div variants={itemVariants} className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdMusicNote size={16} color="var(--accent)" /> Signal Metrics
            </div>
            {[
              { k: 'RMS Level', v: `${metrics.rms} V`, sub: `${metrics.rmsDb} dBu` },
              { k: 'Peak Level', v: `${metrics.peak} V`, sub: `${metrics.peakDb} dBu` },
              { k: 'DC Offset', v: `${metrics.dc} V`, sub: dcOffset !== 0 ? '⚠️ Present' : 'OK' },
              { k: 'Crest Factor', v: `${metrics.crest}×`, sub: `${metrics.crestDb} dB` },
              { k: 'Est. THD', v: `${metrics.thd}%`, sub: sigType === 'Sine' ? 'Distortion' : 'N/A for non-sine' },
              { k: 'Sample Rate', v: `${sampleRate / 1000} kHz`, sub: `Nyquist: ${sampleRate / 2000} kHz` },
            ].map(m => (
              <div key={m.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0.35rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>{m.k}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.sub}</div>
                </div>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{m.v}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tabs */}
          <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'waveform', label: 'Time Domain' },
              { id: 'spectrum', label: 'Frequency Spectrum' },
              { id: 'levels', label: 'Level Meter' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid', cursor: 'pointer',
                borderColor: tab === t.id ? 'var(--accent)' : 'transparent',
                backgroundColor: tab === t.id ? 'var(--accent-light)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: tab === t.id ? 600 : 400,
              }}>{t.label}</button>
            ))}
          </motion.div>

          {tab === 'waveform' && (
            <motion.div variants={itemVariants} className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {sigType} Wave · {freq >= 1000 ? `${(freq / 1000).toFixed(2)} kHz` : `${freq} Hz`} · {amplitude.toFixed(2)} Vp
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={waveformData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="wvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    label={{ value: 'Time (ms)', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[-(amplitude + 0.2), amplitude + 0.2]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    label={{ value: 'Amplitude (V)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={2}
                    fill="url(#wvGrad)" dot={false} name="Amplitude (V)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {tab === 'spectrum' && (
            <motion.div variants={itemVariants} className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Frequency Spectrum — {sigType} · {sampleRate / 1000} kHz sample rate
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={spectrumData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="freqLabel" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={7}
                    label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -12, fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[-80, 5]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    label={{ value: 'Power (dB)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="power" fill="var(--accent)" opacity={0.85} radius={[2, 2, 0, 0]} name="Power (dB)" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {tab === 'levels' && (
            <motion.div variants={itemVariants} className="card">
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                VU / PPM Level Meter
              </div>
              <LevelMeter rmsDb={parseFloat(metrics.rmsDb)} peakDb={parseFloat(metrics.peakDb)} />
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'RMS', value: `${metrics.rmsDb} dBu`, color: 'var(--success)' },
                  { label: 'Peak', value: `${metrics.peakDb} dBu`, color: parseFloat(metrics.peakDb) > 0 ? 'var(--error)' : 'var(--warning)' },
                  { label: 'Headroom', value: `${(0 - parseFloat(metrics.peakDb)).toFixed(1)} dB`, color: 'var(--accent)' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '0.875rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{m.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .aa-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </motion.div>
  )
}

/* ── VU level meter bar ─────────────────────────────────────────── */
function LevelMeter({ rmsDb, peakDb }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
  const toPercent = db => clamp((db + 60) / 60 * 100, 0, 100)
  const rmsPct = toPercent(rmsDb)
  const peakPct = toPercent(peakDb)

  const segments = [
    { from: 0, to: 50, color: '#22c55e' },
    { from: 50, to: 75, color: '#f59e0b' },
    { from: 75, to: 90, color: '#f97316' },
    { from: 90, to: 100, color: '#ef4444' },
  ]

  return (
    <div>
      {['L', 'R'].map(ch => (
        <div key={ch} style={{ marginBottom: ch === 'L' ? '0.75rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', width: 12 }}>{ch}</span>
            <div style={{ flex: 1, height: 20, borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', position: 'relative', overflow: 'hidden' }}>
              {segments.map(s => {
                const start = s.from; const end = Math.min(rmsPct, s.to)
                const width = Math.max(0, end - start)
                return width > 0 ? (
                  <div key={s.from} style={{
                    position: 'absolute', left: `${start}%`, width: `${width}%`,
                    height: '100%', backgroundColor: s.color, transition: 'width 0.1s ease',
                  }} />
                ) : null
              })}
              {/* Peak hold */}
              <div style={{
                position: 'absolute', left: `${peakPct}%`, width: 3, height: '100%',
                backgroundColor: peakDb > 0 ? '#ef4444' : '#ffffff', opacity: 0.9,
                transform: 'translateX(-50%)', transition: 'left 0.15s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--accent)', width: 52, textAlign: 'right' }}>
              {rmsDb.toFixed(1)} dB
            </span>
          </div>
        </div>
      ))}
      {/* Scale */}
      <div style={{ paddingLeft: 18, display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
        {['-60', '-40', '-20', '-10', '-6', '0'].map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  )
}

/* ── shared slider ─────────────────────────────────────────────── */
function CtrlSlider({ label, value, onChange, min, max, step, display }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)' }} />
    </div>
  )
}

/* ── Analyzer Mode Components ─────────────────────────────────────── */
function AnalyzerMode() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analysisId, setAnalysisId] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleUpload = async (e) => {
    e.preventDefault()
    const selected = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!selected) return

    setFile(selected)
    setUploading(true)
    setError('')
    setResult(null)
    setAnalysisId(null)

    const formData = new FormData()
    formData.append('audio', selected)

    try {
      const res = await fetch(`${API_URL}/api/audio/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setAnalysisId(data.audioFile.id)
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  useEffect(() => {
    let interval;
    if (analysisId && !result) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/audio/${analysisId}`)
          const data = await res.json()
          if (data.success) {
            const status = data.audioFile.analysis.status
            if (status === 'done') {
              setResult(data.audioFile)
              setUploading(false)
              clearInterval(interval)
            } else if (status === 'error') {
              setError(data.audioFile.analysis.error || 'Analysis failed')
              setUploading(false)
              clearInterval(interval)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [analysisId, result])

  if (result) return <ResultsDashboard file={result} onReset={() => { setResult(null); setFile(null); setAnalysisId(null); }} />
  if (uploading) return (
    <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="typing-dot" style={{ display: 'inline-block', width: 12, height: 12, marginBottom: '1rem' }} />
      <h3>Uploading & Analyzing...</h3>
      <p style={{ color: 'var(--text-muted)' }}>This may take a few moments as IBM Granite generates recommendations.</p>
    </div>
  )

  return (
    <div className="card" style={{ padding: '4rem', textAlign: 'center', border: '2px dashed var(--border)' }}
      onDragOver={e => e.preventDefault()} onDrop={handleUpload}>
      <MdCloudUpload size={56} color="var(--accent)" style={{ marginBottom: '1rem' }} />
      <h3>Upload Audio File</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Drag & drop WAV, MP3, or AAC file here</p>
      <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
        Select File
        <input type="file" accept=".wav,.mp3,.aac,audio/wav,audio/mpeg,audio/aac" onChange={handleUpload} style={{ display: 'none' }} />
      </label>
      {error && <div style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</div>}
    </div>
  )
}

function ResultsDashboard({ file, onReset }) {
  const analysis = file.analysis
  const [isPlaying, setIsPlaying] = useState(false)
  const containerRef = useRef(null)
  const wsRef = useRef(null)

  const audioUrl = `${API_URL}/uploads/${file.storedName}`

  useEffect(() => {
    if (!containerRef.current) return
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#6366f1',
      progressColor: '#4f46e5',
      barWidth: 2,
      barGap: 1,
      height: 100,
      cursorWidth: 2,
    })
    ws.load(audioUrl)
    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    wsRef.current = ws
    return () => ws.destroy()
  }, [audioUrl])

  return (
    <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onReset}>Analyze Another File</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdMusicNote color="var(--accent)" /> {file.originalName}
          </h3>
          <button className="btn-primary" onClick={() => wsRef.current?.playPause()}>
            {isPlaying ? <><MdPause size={18} /> Pause</> : <><MdPlayArrow size={18} /> Play</>}
          </button>
        </div>
        <div ref={containerRef} />
      </div>

      <div className="aa-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Audio Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <MetricBox label="SNR" value={`${analysis.snrDb} dB`} />
            <MetricBox label="Noise Floor" value={`${analysis.noiseFloorDb} dBFS`} />
            <MetricBox label="Dynamic Range" value={`${analysis.dynamicRangeDb} dB`} />
            <MetricBox label="Clipping" value={analysis.clippingDetected ? `Detected (${analysis.clippingSamples})` : 'None'} color={analysis.clippingDetected ? 'var(--error)' : 'var(--success)'} />
            <MetricBox label="Peak Level" value={`${analysis.peakDb} dBFS`} />
            <MetricBox label="RMS Level" value={`${analysis.rmsDb} dBFS`} />
            <MetricBox label="THD Estimate" value={`${analysis.thdPercent}%`} />
            <MetricBox label="Spectral Centroid" value={`${analysis.spectralCentroid} Hz`} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>AI Recommendations</h3>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {analysis.aiRecommendations}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Frequency Spectrum</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analysis.spectrumData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="freqHz" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={7} />
            <YAxis domain={[-80, 5]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="powerDb" fill="var(--accent)" radius={[2, 2, 0, 0]} name="Power (dB)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '0.875rem', borderRadius: '8px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}
