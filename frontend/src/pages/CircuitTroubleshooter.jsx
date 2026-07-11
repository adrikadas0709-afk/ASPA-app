import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdBuild, MdUploadFile, MdCheckCircle, MdWarning, MdError,
  MdLightbulb, MdChat, MdExpandMore, MdExpandLess, MdDelete,
  MdArrowForward, MdCircle,
} from 'react-icons/md'
import { useChat } from '../context/ChatContext'
import { useNavigate } from 'react-router-dom'

/* ── Data ─────────────────────────────────────────────────────── */
const SYMPTOM_CATEGORIES = {
  'Noise & Hum': {
    color: '#f59e0b',
    items: [
      { id: 's1',  label: '50/60 Hz hum on output',           severity: 'medium' },
      { id: 's2',  label: 'High-frequency hiss / white noise', severity: 'low'    },
      { id: 's3',  label: 'Intermittent crackling or popping', severity: 'medium' },
      { id: 's4',  label: 'Ground loop buzz',                  severity: 'medium' },
    ],
  },
  'Distortion': {
    color: '#ef4444',
    items: [
      { id: 's5',  label: 'Hard clipping at high levels',       severity: 'high'   },
      { id: 's6',  label: 'Crossover distortion (Class-B)',     severity: 'high'   },
      { id: 's7',  label: 'Soft saturation / compression',      severity: 'medium' },
      { id: 's8',  label: 'Intermodulation distortion (IMD)',   severity: 'medium' },
    ],
  },
  'Signal Issues': {
    color: '#3b82f6',
    items: [
      { id: 's9',  label: 'No output signal',                   severity: 'critical' },
      { id: 's10', label: 'Very low output level',              severity: 'high'     },
      { id: 's11', label: 'Signal loss at high frequencies',    severity: 'medium'   },
      { id: 's12', label: 'Signal loss at low frequencies',     severity: 'medium'   },
    ],
  },
  'Oscillation': {
    color: '#8b5cf6',
    items: [
      { id: 's13', label: 'Self-oscillation / squealing',       severity: 'critical' },
      { id: 's14', label: 'Motorboating (low-freq oscillation)',severity: 'high'     },
      { id: 's15', label: 'RF interference on audio',           severity: 'medium'   },
    ],
  },
  'DC & Bias': {
    color: '#22c55e',
    items: [
      { id: 's16', label: 'DC offset on output',                severity: 'high'   },
      { id: 's17', label: 'Power-on thump to speaker',          severity: 'medium' },
      { id: 's18', label: 'Amplifier running very hot',         severity: 'high'   },
    ],
  },
}

const DIAGNOSES = {
  's1': {
    cause: 'Power supply coupling or ground loop',
    steps: [
      'Measure hum frequency — 50/60 Hz = power-line; 100/120 Hz = rectifier ripple',
      'Verify star-ground topology — all grounds meet at one point',
      'Inspect filter capacitors ESR (target < 0.5Ω) — replace if bulging',
      'Add 100µH + 100nF LC filter on supply rail close to the IC',
      'Use balanced (XLR) interconnects or isolation transformer to break the loop',
    ],
    components: ['1000µF/25V filter cap', 'Common-mode choke 100µH', '100nF MLCC bypass'],
    formula:    'PSRR = 20·log₁₀(ΔV_supply / ΔV_out) → target > 80 dB',
    severity:   'medium',
  },
  's2': {
    cause: 'Thermal noise from high-impedance nodes or noisy op-amp',
    steps: [
      'Short circuit the input — measure residual noise floor',
      'Replace input resistors with lowest practical values (Vn ∝ √R)',
      'Swap op-amp for NE5532 (5 nV/√Hz) or LT1115 (0.9 nV/√Hz)',
      'Add 100 nF MLCC bypass caps on each IC supply pin',
      'Shield input wiring and reduce PCB trace length at high-Z nodes',
    ],
    components: ['NE5532 op-amp', '100nF C0G bypass', 'Metal-shield enclosure'],
    formula:    'V_n = √(4kTRΔf) — at 10 kΩ, 20 kHz: V_n ≈ 1.8 µV RMS',
    severity:   'low',
  },
  's5': {
    cause: 'Output swing limited by supply rails or gain too high',
    steps: [
      'Measure supply voltage under load — compare to no-load',
      'Check op-amp output swing spec: max ≈ V_cc − 1.5V',
      'Calculate headroom: H = 20·log₁₀(V_swing_RMS / 0.775) dBu',
      'Reduce input gain or add input attenuator',
      'Consider rail-to-rail op-amp (OPA2340, TLV2372) for 3.3V/5V systems',
    ],
    components: ['BAT85 soft-clip diodes', 'Input attenuator pot 10 kΩ', 'Rail-to-rail op-amp'],
    formula:    'Headroom (dBu) = 20·log₁₀((V_cc − 1.5) / (√2 × 0.775))',
    severity:   'high',
  },
  's6': {
    cause: 'Insufficient quiescent bias current in Class-B push-pull stage',
    steps: [
      'Measure quiescent current — target 25–50 mA for Class-AB',
      'Adjust bias pot (Vbe multiplier / spreader transistor)',
      'Verify Vbe multiplier is thermally bonded to output transistors',
      'Check output transistor matching — V_be mismatch causes asymmetry',
      'Add global negative feedback to suppress residual crossover notch',
    ],
    components: ['Bias trim pot 500Ω', 'BD139 Vbe multiplier', 'Matched output pair'],
    formula:    'I_bias = V_be / R_e;  R_e = 0.33–0.47Ω for thermal stability',
    severity:   'high',
  },
  's9': {
    cause: 'Power supply failure, open feedback path, or shorted IC',
    steps: [
      'Confirm ±Vcc at op-amp supply pins with a DMM',
      'Probe input — if present at +IN but absent at output, IC may be dead',
      'Measure DC at output pin — rail-to-rail DC = shorted/blown op-amp',
      'Check R_f and R_in continuity (open feedback → output rails)',
      'Substitute op-amp with known-good device',
    ],
    components: ['Replacement op-amp (DIP-8)', 'DMM + oscilloscope', 'Supply fuse check'],
    formula:    'V_out_expected = V_in × Av;  if V_out = 0 with V_in ≠ 0 → fault',
    severity:   'critical',
  },
  's13': {
    cause: 'Insufficient phase margin — loop gain > 0 dB at 180° phase shift',
    steps: [
      'Add dominant-pole compensation capacitor (10–47 pF) across feedback resistor',
      'Place 10–100Ω series resistor at op-amp output to isolate capacitive load',
      'Add Zobel network: 10Ω + 100nF from output to GND',
      'Move bypass caps physically closer to IC supply pins',
      'Reduce closed-loop gain at HF with small cap across R_f',
    ],
    components: ['47pF compensation cap', '10Ω output series R', 'Zobel: 10Ω + 100nF'],
    formula:    'Phase margin = 180° − ∠H(jω_gc);  target ≥ 45° (prefer 60°)',
    severity:   'critical',
  },
  's16': {
    cause: 'Input bias current mismatch or op-amp input offset voltage',
    steps: [
      'Measure DC offset — > 50–100 mV is dangerous for speakers',
      'Balance source impedances at +IN and −IN: R_comp = R1 ∥ R_f',
      'Use low-offset op-amp: OPA2134 (50µV), LM4562 (0.1mV)',
      'Trim offset via dedicated null pins (if available)',
      'Add DC servo (integrator) loop for automatic correction',
    ],
    components: ['R_bias = R1 ∥ R_f', 'OPA2134 op-amp', 'DC servo integrator (LF356)'],
    formula:    'V_offset_out = V_os × (1 + R_f/R_in) + I_bias × R_f',
    severity:   'high',
  },
}

const DEFAULT_DIAGNOSIS = {
  cause: 'Requires systematic signal tracing',
  steps: [
    'Inject a known-amplitude sine wave at the input',
    'Probe each stage output from input to output with an oscilloscope',
    'Measure DC operating points — compare to datasheet values',
    'Inspect bypass capacitors with ESR meter',
    'Check all solder joints under magnification',
  ],
  components: ['Oscilloscope', 'Function generator', 'ESR meter', 'DMM'],
  formula:    'Signal gain per stage: A_stage = V_out_stage / V_in_stage',
  severity:   'medium',
}

const SEV = {
  critical: { color: '#dc2626', bg: '#fee2e2', label: 'Critical', icon: MdError    },
  high:     { color: '#ef4444', bg: '#fee2e2', label: 'High',     icon: MdWarning  },
  medium:   { color: '#f59e0b', bg: '#fef9c3', label: 'Medium',   icon: MdWarning  },
  low:      { color: '#22c55e', bg: '#dcfce7', label: 'Low',      icon: MdCheckCircle },
}

/* ── Flowchart Step ───────────────────────────────────────────── */
const FLOWCHART_STEPS = [
  { id: 1, label: 'Power supply OK?',         yes: 2, no: 'Check fuses, transformer, rectifier, filter caps' },
  { id: 2, label: 'Signal present at input?', yes: 3, no: 'Check source, cable, connector' },
  { id: 3, label: 'Signal at first stage?',   yes: 4, no: 'Replace input op-amp or transistor' },
  { id: 4, label: 'Correct gain per stage?',  yes: 5, no: 'Check R_f / R_in ratio, bypass caps' },
  { id: 5, label: 'Output within rails?',     yes: 6, no: 'Reduce gain, increase supply voltage' },
  { id: 6, label: 'DC offset < 50 mV?',       yes: 7, no: 'Add R_comp, DC servo, or coupling cap' },
  { id: 7, label: 'No oscillation?',          yes: 8, no: 'Add compensation cap, Zobel network' },
  { id: 8, label: '✅ Circuit is nominal',    yes: null, no: null },
]

/* ── Component ────────────────────────────────────────────────── */
const cardV = { hidden: { opacity: 0, y: 12 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }

export default function CircuitTroubleshooter() {
  const [selected,     setSelected]     = useState([])
  const [circuitType,  setCircuitType]  = useState('Op-Amp Preamp')
  const [diagnosed,    setDiagnosed]    = useState(false)
  const [expandedId,   setExpandedId]   = useState(null)
  const [activeTab,    setActiveTab]    = useState('symptoms')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [dragOver,     setDragOver]     = useState(false)
  const { sendMessage } = useChat()
  const navigate = useNavigate()

  const toggle = (id) => {
    setDiagnosed(false)
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setUploadedFile(file)
  }, [])

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) setUploadedFile(e.target.files[0])
  }

  const askAI = () => {
    const allSymptoms = Object.values(SYMPTOM_CATEGORIES).flatMap(c => c.items)
    const labels = selected.map(id => allSymptoms.find(s => s.id === id)?.label).filter(Boolean)
    sendMessage(`I'm troubleshooting a ${circuitType}. Symptoms: ${labels.join(', ')}. Please provide a complete diagnosis and step-by-step repair guide.`)
    navigate('/assistant')
  }

  const allSymptoms = Object.values(SYMPTOM_CATEGORIES).flatMap(c => c.items)
  const results = selected.map(id => ({ id, ...(DIAGNOSES[id] || DEFAULT_DIAGNOSIS) }))
  const worstSev = results.reduce((w, r) => {
    const order = { critical: 4, high: 3, medium: 2, low: 1 }
    return (order[r.severity] || 0) > (order[w] || 0) ? r.severity : w
  }, 'low')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdBuild size={24} color="var(--accent)" /> Circuit Troubleshooter
          </h1>
          <p className="section-subtitle">Select symptoms → run diagnosis → get AI-powered repair guidance</p>
        </div>
        {selected.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '9999px', backgroundColor: SEV[worstSev]?.bg, color: SEV[worstSev]?.color, fontSize: '0.8rem', fontWeight: 700 }}>
            {worstSev === 'critical' ? <MdError size={16}/> : <MdWarning size={16}/>}
            {selected.length} symptom{selected.length > 1 ? 's' : ''} — {SEV[worstSev]?.label} severity
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'symptoms',  label: 'Symptom Selector' },
          { id: 'flowchart', label: 'Debug Flowchart' },
          { id: 'upload',    label: 'Circuit Upload' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid', cursor: 'pointer',
            borderColor: activeTab === t.id ? 'var(--accent)' : 'transparent',
            backgroundColor: activeTab === t.id ? 'var(--accent-light)' : 'transparent',
            color: activeTab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Symptoms ── */}
      {activeTab === 'symptoms' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem' }} className="trouble-grid">

          {/* Left: symptom cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Circuit type chips */}
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>Circuit Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {['Op-Amp Preamp','Power Amplifier','Filter Stage','Phono Stage','Headphone Amp','Mixer','DAC Interface'].map(t => (
                  <button key={t} onClick={() => setCircuitType(t)} style={{
                    padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.775rem', border: '1px solid', cursor: 'pointer',
                    borderColor: circuitType === t ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: circuitType === t ? 'var(--accent-light)' : 'transparent',
                    color: circuitType === t ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: circuitType === t ? 600 : 400, transition: 'all 0.15s',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Symptom category cards */}
            {Object.entries(SYMPTOM_CATEGORIES).map(([cat, data], ci) => (
              <motion.div key={cat} custom={ci} variants={cardV} initial="hidden" animate="visible" className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: data.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{cat}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {data.items.filter(s => selected.includes(s.id)).length}/{data.items.length} selected
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                  {data.items.map(s => {
                    const active = selected.includes(s.id)
                    const sev    = SEV[s.severity]
                    return (
                      <button key={s.id} onClick={() => toggle(s.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.625rem', borderRadius: '8px', textAlign: 'left',
                        border: `1px solid ${active ? data.color : 'var(--border)'}`,
                        backgroundColor: active ? `${data.color}18` : 'var(--bg-tertiary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        <span style={{
                          width: 14, height: 14, borderRadius: '3px', flexShrink: 0,
                          border: `2px solid ${active ? data.color : 'var(--border)'}`,
                          backgroundColor: active ? data.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {active && <span style={{ color: 'white', fontSize: '0.55rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.775rem', fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.3 }}>{s.label}</div>
                          <div style={{ fontSize: '0.65rem', color: sev.color, fontWeight: 600, marginTop: '0.1rem' }}>{sev.label}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: action + results panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="card" style={{ position: 'sticky', top: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {selected.length === 0 ? 'Select symptoms on the left' : `${selected.length} symptom${selected.length > 1 ? 's' : ''} selected`}
              </div>

              {selected.length > 0 && (
                <div style={{ marginBottom: '0.875rem', maxHeight: 150, overflowY: 'auto' }}>
                  {selected.map(id => {
                    const s = allSymptoms.find(x => x.id === id)
                    return s ? (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.775rem' }}>
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                        <button onClick={() => toggle(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem', padding: '0 0.25rem' }}>✕</button>
                      </div>
                    ) : null
                  })}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn-primary" onClick={() => setDiagnosed(true)}
                  disabled={selected.length === 0}
                  style={{ justifyContent: 'center', opacity: selected.length === 0 ? 0.5 : 1 }}>
                  <MdBuild size={15} /> Run Diagnosis
                </button>
                {selected.length > 0 && (
                  <button className="btn-secondary" onClick={askAI} style={{ justifyContent: 'center', fontSize: '0.8rem' }}>
                    <MdChat size={15} /> Ask AI Assistant
                  </button>
                )}
                {selected.length > 0 && (
                  <button className="btn-secondary" onClick={() => { setSelected([]); setDiagnosed(false) }} style={{ justifyContent: 'center', fontSize: '0.8rem' }}>
                    <MdDelete size={14} /> Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Diagnosis results */}
            <AnimatePresence>
              {diagnosed && results.map((r, i) => {
                const sev = SEV[r.severity]
                const SevIcon = sev.icon
                const open = expandedId === r.id
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="card" style={{ borderLeft: `4px solid ${sev.color}`, padding: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      onClick={() => setExpandedId(p => p === r.id ? null : r.id)}>
                      <SevIcon size={16} color={sev.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {allSymptoms.find(s => s.id === r.id)?.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.cause}</div>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: sev.color, backgroundColor: sev.bg, padding: '0.15rem 0.45rem', borderRadius: '9999px', flexShrink: 0 }}>
                        {sev.label}
                      </span>
                      {open ? <MdExpandLess size={18} color="var(--text-muted)" /> : <MdExpandMore size={18} color="var(--text-muted)" />}
                    </div>

                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: '0.875rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <MdLightbulb size={13} color="var(--warning)" /> Repair Steps
                          </div>
                          {r.steps.map((step, si) => (
                            <div key={si} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              <span style={{ minWidth: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{si+1}</span>
                              {step}
                            </div>
                          ))}
                          <div style={{ marginTop: '0.625rem', padding: '0.4rem 0.625rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.73rem', color: 'var(--accent)' }}>
                            {r.formula}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                            {r.components.map(c => (
                              <span key={c} className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{c}</span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Tab: Flowchart ── */}
      {activeTab === 'flowchart' && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
            Step-by-Step Debugging Flowchart
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FLOWCHART_STEPS.map((step, i) => (
              <div key={step.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Left: node + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    backgroundColor: i === FLOWCHART_STEPS.length - 1 ? 'var(--success)' : 'var(--accent)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                  }}>{step.id}</div>
                  {i < FLOWCHART_STEPS.length - 1 && (
                    <div style={{ width: 2, height: 32, backgroundColor: 'var(--border)', margin: '0.25rem 0' }} />
                  )}
                </div>
                {/* Right: content */}
                <div style={{ flex: 1, paddingBottom: i < FLOWCHART_STEPS.length - 1 ? '0.5rem' : 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', paddingTop: '0.5rem', marginBottom: step.no ? '0.375rem' : 0 }}>
                    {step.label}
                  </div>
                  {step.yes && step.no && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>YES →</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Continue to step {step.yes}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--error)', fontWeight: 700 }}>NO →</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{step.no}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Upload ── */}
      {activeTab === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card"
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: dragOver ? 'var(--accent-light)' : 'var(--bg-secondary)',
              borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => document.getElementById('circuit-file-input').click()}
          >
            <MdUploadFile size={40} color="var(--accent)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Drop circuit schematic or board photo here
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
              Supports PNG, JPG, PDF (max 10 MB)
            </div>
            <button className="btn-primary" onClick={e => { e.stopPropagation(); document.getElementById('circuit-file-input').click() }} style={{ margin: '0 auto' }}>
              Browse Files
            </button>
            <input id="circuit-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileInput} />
          </div>

          {uploadedFile && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card"
              style={{ borderColor: 'var(--success)', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MdCheckCircle size={20} color="var(--success)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{uploadedFile.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(uploadedFile.size / 1024).toFixed(1)} KB — Ready for analysis</div>
                </div>
                <button className="btn-primary" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}
                  onClick={() => { sendMessage(`I've uploaded a circuit file: "${uploadedFile.name}". Please provide general circuit troubleshooting guidance for a ${circuitType}.`); navigate('/assistant') }}>
                  <MdChat size={14} /> Analyze with AI
                </button>
              </div>
            </motion.div>
          )}

          <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              What to upload
            </div>
            {[
              { icon: '📐', title: 'Schematic (PDF/PNG)', desc: 'Circuit diagram with component values labeled' },
              { icon: '📸', title: 'Board photo (JPG/PNG)', desc: 'Clear photo of the PCB with visible components' },
              { icon: '📊', title: 'Oscilloscope screenshot', desc: 'Waveform captures at key test points' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.625rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){.trouble-grid{grid-template-columns:1fr!important}}`}</style>
    </motion.div>
  )
}
