import { useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import {
  MdFilterAlt, MdDownload, MdCalculate, MdInfo,
} from 'react-icons/md'
import { jsPDF } from 'jspdf'

/* ── DSP helpers ─────────────────────────────────────────────── */
const TWO_PI = 2 * Math.PI
const log10  = x => Math.log(x) / Math.LN10
const dBmag  = h2 => 10 * log10(Math.max(h2, 1e-20))

const bwLPF  = (f, fc, n) => 1 / (1 + Math.pow(f / fc, 2 * n))
const bwHPF  = (f, fc, n) => 1 / (1 + Math.pow(fc / f, 2 * n))
const bwBPF  = (f, f0, bw, n) => { const Q = f0/bw, r = f/f0 - f0/f; return 1/(1+Math.pow(Q*r,2*n)) }
const bwNotch= (f, f0, bw, n) => 1 - bwBPF(f, f0, bw, n)
const chebyI = (f, fc, n, rip) => {
  const eps = Math.sqrt(Math.pow(10, rip/10) - 1)
  const x = f/fc
  const Tn = x<=1 ? Math.cos(n*Math.acos(x)) : Math.cosh(n*Math.acosh(x))
  return 1/(1+eps*eps*Tn*Tn)
}
const phaseLPF = (f, fc, n) => -n * Math.atan(f/fc) * 180/Math.PI
const phaseHPF = (f, fc, n) =>  n * (90 - Math.atan(f/fc) * 180/Math.PI)

function generateBode({ fc, bw, order, type, approx, ripple }) {
  const pts = []
  for (let i = 0; i <= 300; i++) {
    const f = 10 * Math.pow(22000/10, i/300)
    let h2
    if (approx === 'Chebyshev') {
      h2 = type === 'High-Pass' ? chebyI(fc, f, order, ripple) : chebyI(f, fc, order, ripple)
    } else {
      if      (type === 'Low-Pass')  h2 = bwLPF(f, fc, order)
      else if (type === 'High-Pass') h2 = bwHPF(f, fc, order)
      else if (type === 'Band-Pass') h2 = bwBPF(f, fc, bw, order)
      else                           h2 = bwNotch(f, fc, bw, order)
    }
    const phase = type === 'High-Pass' ? phaseHPF(f, fc, order) : phaseLPF(f, fc, order)
    pts.push({
      freqLabel: f >= 1000 ? `${(f/1000).toFixed(1)}k` : f.toFixed(0),
      magnitude: parseFloat(Math.max(dBmag(h2), -80).toFixed(2)),
      phase:     parseFloat(phase.toFixed(1)),
    })
  }
  return pts
}

function calcComponents(fc, order, refR = 10000) {
  const C = 1 / (TWO_PI * fc * refR)
  const rows = []
  for (let i = 1; i <= Math.ceil(order/2); i++) {
    const Qi = order >= 2 ? 1/(2*Math.sin(((2*i-1)*Math.PI)/(2*order))) : 0.5
    rows.push({
      stage: `Stage ${i}`,
      R1: `${(refR/1000).toFixed(1)} kΩ`,
      R2: `${(refR/1000).toFixed(1)} kΩ`,
      C1: `${(C*1e9).toFixed(2)} nF`,
      C2: `${(C*1e9*(order>=2?1/(4*Qi*Qi):1)).toFixed(2)} nF`,
      Q:  order >= 2 ? Qi.toFixed(3) : '—',
    })
  }
  return rows
}

/* ── Circuit SVG diagrams ─────────────────────────────────────── */
function CircuitDiagram({ type }) {
  const diagrams = {
    'Low-Pass': (
      <svg viewBox="0 0 340 120" style={{ width: '100%', maxWidth: 340, fill: 'none', stroke: 'var(--accent)', strokeWidth: 2 }}>
        {/* Input */}
        <text x="8" y="62" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">IN</text>
        <line x1="36" y1="60" x2="70" y2="60"/>
        {/* R box */}
        <rect x="70" y="48" width="50" height="24" rx="3" stroke="var(--accent)" fill="var(--bg-tertiary)"/>
        <text x="95" y="63" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="monospace">R</text>
        {/* Node to C and output */}
        <line x1="120" y1="60" x2="180" y2="60"/>
        {/* C (vertical) */}
        <line x1="180" y1="42" x2="180" y2="54"/>
        <line x1="168" y1="54" x2="192" y2="54"/>
        <line x1="168" y1="58" x2="192" y2="58"/>
        <line x1="180" y1="58" x2="180" y2="90"/>
        <text x="195" y="57" fontSize="11" fill="var(--accent)" fontFamily="monospace">C</text>
        {/* Ground */}
        <line x1="180" y1="90" x2="180" y2="100"/>
        <line x1="167" y1="100" x2="193" y2="100"/>
        <line x1="172" y1="104" x2="188" y2="104"/>
        <line x1="176" y1="108" x2="184" y2="108"/>
        {/* Output */}
        <line x1="180" y1="60" x2="310" y2="60"/>
        <text x="312" y="62" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">OUT</text>
        {/* fc label */}
        <text x="170" y="28" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">f_c = 1/(2πRC)</text>
      </svg>
    ),
    'High-Pass': (
      <svg viewBox="0 0 340 120" style={{ width: '100%', maxWidth: 340, fill: 'none', stroke: 'var(--accent)', strokeWidth: 2 }}>
        <text x="8" y="62" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">IN</text>
        <line x1="36" y1="60" x2="70" y2="60"/>
        {/* C */}
        <line x1="70" y1="42" x2="70" y2="54"/>
        <line x1="58" y1="54" x2="82" y2="54"/>
        <line x1="58" y1="58" x2="82" y2="58"/>
        <line x1="70" y1="58" x2="70" y2="74"/>
        <line x1="70" y1="60" x2="70" y2="60"/>
        <line x1="82" y1="58" x2="140" y2="58"/>
        <line x1="82" y1="54" x2="140" y2="54"/>
        <text x="70" y="38" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="monospace">C</text>
        {/* Series path */}
        <line x1="70" y1="60" x2="140" y2="60"/>
        {/* R to ground */}
        <line x1="140" y1="60" x2="140" y2="68"/>
        <rect x="125" y="68" width="30" height="20" rx="3" fill="var(--bg-tertiary)"/>
        <text x="140" y="81" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="monospace">R</text>
        <line x1="140" y1="88" x2="140" y2="98"/>
        <line x1="128" y1="98" x2="152" y2="98"/>
        <line x1="132" y1="102" x2="148" y2="102"/>
        <line x1="136" y1="106" x2="144" y2="106"/>
        {/* Output */}
        <line x1="140" y1="60" x2="310" y2="60"/>
        <text x="312" y="62" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">OUT</text>
        <text x="190" y="28" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">f_c = 1/(2πRC)</text>
      </svg>
    ),
    'Band-Pass': (
      <svg viewBox="0 0 340 130" style={{ width: '100%', maxWidth: 340, fill: 'none', stroke: 'var(--accent)', strokeWidth: 2 }}>
        <text x="4" y="66" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">IN</text>
        <line x1="30" y1="64" x2="60" y2="64"/>
        {/* C series */}
        <line x1="60" y1="52" x2="60" y2="60"/>
        <line x1="48" y1="60" x2="72" y2="60"/>
        <line x1="48" y1="64" x2="72" y2="64"/>
        <line x1="60" y1="64" x2="60" y2="76"/>
        <text x="78" y="65" fontSize="10" fill="var(--accent)" fontFamily="monospace">C1</text>
        <line x1="60" y1="64" x2="110" y2="64"/>
        {/* R */}
        <rect x="110" y="52" width="40" height="24" rx="3" fill="var(--bg-tertiary)"/>
        <text x="130" y="67" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="monospace">R</text>
        {/* Node + C2 to GND */}
        <line x1="150" y1="64" x2="200" y2="64"/>
        <line x1="200" y1="64" x2="200" y2="72"/>
        <line x1="188" y1="72" x2="212" y2="72"/>
        <line x1="188" y1="76" x2="212" y2="76"/>
        <line x1="200" y1="76" x2="200" y2="100"/>
        <text x="215" y="76" fontSize="10" fill="var(--accent)" fontFamily="monospace">C2</text>
        <line x1="190" y1="100" x2="210" y2="100"/>
        <line x1="194" y1="104" x2="206" y2="104"/>
        <line x1="198" y1="108" x2="202" y2="108"/>
        {/* Output */}
        <line x1="200" y1="64" x2="310" y2="64"/>
        <text x="312" y="66" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">OUT</text>
        <text x="170" y="28" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">f₀ = 1/(2π√(LC)) · Q = f₀/BW</text>
      </svg>
    ),
    'Notch': (
      <svg viewBox="0 0 340 130" style={{ width: '100%', maxWidth: 340, fill: 'none', stroke: 'var(--accent)', strokeWidth: 2 }}>
        <text x="4" y="56" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">IN</text>
        <line x1="30" y1="54" x2="70" y2="54"/>
        {/* Twin-T outline */}
        <rect x="70" y="30" width="180" height="80" rx="8" stroke="var(--border)" strokeDasharray="4 3" fill="var(--bg-tertiary)"/>
        <text x="160" y="50" textAnchor="middle" fontSize="10" fill="var(--text-secondary)">Twin-T Notch Network</text>
        <text x="160" y="64" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="monospace">R–C–R  /  C–R–C</text>
        <text x="160" y="80" textAnchor="middle" fontSize="10" fill="var(--text-muted)">f_notch = 1/(2πRC)</text>
        {/* connections */}
        <line x1="70" y1="54" x2="70" y2="70"/>
        <line x1="250" y1="54" x2="310" y2="54"/>
        <text x="312" y="56" fontSize="11" fill="var(--text-muted)" fontFamily="monospace">OUT</text>
      </svg>
    ),
  }
  return diagrams[type] || diagrams['Low-Pass']
}

/* ── Tooltip ─────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.775rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>f = {payload[0]?.payload?.freqLabel} Hz</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value > 0 ? '+' : ''}{p.value} {p.dataKey === 'magnitude' ? 'dB' : '°'}</div>
      ))}
    </div>
  )
}

const TYPES  = ['Low-Pass', 'High-Pass', 'Band-Pass', 'Notch']
const APPROXS= ['Butterworth', 'Chebyshev']
const ORDERS = [1, 2, 3, 4, 6]

/* ── Main Component ──────────────────────────────────────────── */
export default function FilterDesigner() {
  const [type,      setType]      = useState('Low-Pass')
  const [approx,    setApprox]    = useState('Butterworth')
  const [fc,        setFc]        = useState(1000)
  const [bw,        setBw]        = useState(500)
  const [order,     setOrder]     = useState(2)
  const [ripple,    setRipple]    = useState(1)
  const [refR,      setRefR]      = useState(10000)
  const [showPhase, setShowPhase] = useState(false)
  const [tab,       setTab]       = useState('calculator')

  const bodeData   = useMemo(() => generateBode({ fc, bw, order, type, approx, ripple }),   [fc, bw, order, type, approx, ripple])
  const components = useMemo(() => calcComponents(fc, order, refR),                          [fc, order, refR])
  const rolloff    = order * 20
  const magAtFc    = useMemo(() => {
    if (approx === 'Chebyshev') return dBmag(chebyI(fc, fc, order, ripple))
    if (type === 'Low-Pass')    return dBmag(bwLPF(fc, fc, order))
    if (type === 'High-Pass')   return dBmag(bwHPF(fc, fc, order))
    if (type === 'Band-Pass')   return dBmag(bwBPF(fc, fc, bw, order))
    return dBmag(bwNotch(fc, fc, bw, order))
  }, [fc, bw, order, type, approx, ripple])

  const downloadPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18); doc.text('ASPA — Filter Design Report', 14, 18)
    doc.setFontSize(11)
    doc.text(`Filter Type: ${type}`, 14, 30)
    doc.text(`Approximation: ${approx}`, 14, 37)
    doc.text(`Order: ${order}`, 14, 44)
    doc.text(`Cutoff Frequency: ${fc >= 1000 ? `${(fc/1000).toFixed(2)} kHz` : `${fc} Hz`}`, 14, 51)
    if (type === 'Band-Pass' || type === 'Notch') doc.text(`Bandwidth: ${bw >= 1000 ? `${(bw/1000).toFixed(2)} kHz` : `${bw} Hz`}`, 14, 58)
    doc.text(`Roll-off: ${rolloff} dB/decade`, 14, 65)
    doc.text(`Magnitude @ fc: ${magAtFc.toFixed(1)} dB`, 14, 72)
    doc.text(`Reference R: ${(refR/1000).toFixed(1)} kΩ`, 14, 79)
    doc.setFontSize(14); doc.text('Component Values (Sallen-Key)', 14, 92)
    const rows = components.map(c => [c.stage, c.R1, c.R2, c.C1, c.C2, c.Q])
    doc.autoTable({ head: [['Stage','R1','R2','C1','C2','Q']], body: rows, startY: 98, styles: { fontSize: 10 } })
    doc.text(`Generated by ASPA — ${new Date().toLocaleString()}`, 14, doc.lastAutoTable.finalY + 14)
    doc.save(`aspa-filter-${type.toLowerCase().replace(' ','-')}-${fc}hz.pdf`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdFilterAlt size={24} color="var(--accent)" /> Filter Designer
          </h1>
          <p className="section-subtitle">LP / HP / BP / Notch — interactive calculators, circuit diagrams, Bode plots</p>
        </div>
        <button className="btn-secondary" onClick={downloadPDF} style={{ fontSize: '0.8rem' }}>
          <MdDownload size={15} /> Download PDF Report
        </button>
      </div>

      {/* Filter type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }} className="ftype-grid">
        {TYPES.map(t => {
          const colors = { 'Low-Pass': '#3b82f6', 'High-Pass': '#8b5cf6', 'Band-Pass': '#22c55e', 'Notch': '#f59e0b' }
          const c = colors[t]
          return (
            <motion.div key={t} whileHover={{ y: -3 }} onClick={() => setType(t)} style={{
              padding: '1rem', borderRadius: '10px', border: '2px solid',
              borderColor: type === t ? c : 'var(--border)',
              backgroundColor: type === t ? `${c}18` : 'var(--bg-secondary)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: type === t ? c : 'var(--text-primary)' }}>{t}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {{ 'Low-Pass': 'f < fc → pass', 'High-Pass': 'f > fc → pass', 'Band-Pass': 'f₀ ± BW/2', 'Notch': 'Reject f₀' }[t]}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem' }} className="fd-layout">

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="card">
            <SLabel>Approximation</SLabel>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
              {APPROXS.map(a => <TypeBtn key={a} label={a} active={approx===a} onClick={()=>setApprox(a)} />)}
            </div>

            <SRangeRow label="Cutoff / Centre Freq" value={fc} min={20} max={20000} step={10}
              onChange={setFc} display={fc>=1000?`${(fc/1000).toFixed(2)} kHz`:`${fc} Hz`} />

            {(type==='Band-Pass'||type==='Notch') && (
              <SRangeRow label="Bandwidth" value={bw} min={50} max={5000} step={50}
                onChange={setBw} display={bw>=1000?`${(bw/1000).toFixed(1)} kHz`:`${bw} Hz`} />
            )}

            <SLabel>Order: <span style={{color:'var(--accent)',fontWeight:700}}>{order}</span></SLabel>
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
              {ORDERS.map(o => <TypeBtn key={o} label={o} active={order===o} onClick={()=>setOrder(o)} />)}
            </div>

            {approx==='Chebyshev' && (
              <SRangeRow label="Passband Ripple" value={ripple} min={0.1} max={3} step={0.1}
                onChange={setRipple} display={`${ripple.toFixed(1)} dB`} />
            )}

            <SRangeRow label="Reference R" value={refR} min={1000} max={100000} step={1000}
              onChange={setRefR} display={`${(refR/1000).toFixed(0)} kΩ`} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" id="phase" checked={showPhase} onChange={e=>setShowPhase(e.target.checked)} style={{accentColor:'var(--accent)'}} />
              <label htmlFor="phase" style={{cursor:'pointer'}}>Show phase</label>
            </div>
          </div>

          {/* Metrics */}
          <div className="card">
            <div style={{fontWeight:600,fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:'0.75rem'}}>Key Metrics</div>
            {[
              { k: 'Cutoff / f₀',   v: fc>=1000?`${(fc/1000).toFixed(2)} kHz`:`${fc} Hz` },
              { k: 'Roll-off',       v: `${rolloff} dB/dec` },
              { k: '@ fc',           v: `${magAtFc.toFixed(1)} dB` },
              { k: '@ 2×fc',         v: `${(rolloff*log10(2)).toFixed(1)} dB` },
              { k: 'Topology',       v: 'Sallen-Key' },
              { k: 'Op-amp rec.',    v: 'NE5532 / OPA2134' },
            ].map(m => (
              <div key={m.k} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'1px solid var(--border)',fontSize:'0.78rem'}}>
                <span style={{color:'var(--text-secondary)'}}>{m.k}</span>
                <span style={{color:'var(--accent)',fontWeight:600,fontFamily:'monospace'}}>{m.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {[
              { id: 'calculator', label: 'Calculator' },
              { id: 'diagram',    label: 'Circuit Diagram' },
              { id: 'bode',       label: 'Bode Plot' },
              { id: 'theory',     label: 'Theory' },
            ].map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:'0.4rem 0.875rem',borderRadius:'8px',fontSize:'0.8rem',border:'1px solid',cursor:'pointer',
                borderColor: tab===t.id?'var(--accent)':'transparent',
                backgroundColor: tab===t.id?'var(--accent-light)':'transparent',
                color: tab===t.id?'var(--accent)':'var(--text-secondary)',
                fontWeight: tab===t.id?600:400,
              }}>{t.label}</button>
            ))}
          </div>

          {/* Calculator tab */}
          {tab === 'calculator' && (
            <div className="card">
              <div style={{fontWeight:600,fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:'0.25rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <MdCalculate size={16} color="var(--accent)"/> Component Values — {type} ({approx}, Order {order})
              </div>
              <div style={{fontSize:'0.775rem',color:'var(--text-muted)',marginBottom:'1rem'}}>
                Reference R = {(refR/1000).toFixed(0)} kΩ · Cutoff = {fc>=1000?`${(fc/1000).toFixed(2)} kHz`:`${fc} Hz`}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.8rem'}}>
                  <thead>
                    <tr style={{borderBottom:'2px solid var(--border)'}}>
                      {['Stage','R1','R2','C1','C2','Q'].map(h => (
                        <th key={h} style={{padding:'0.5rem 0.875rem',textAlign:'left',color:'var(--text-muted)',fontWeight:600}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c,i) => (
                      <tr key={i} style={{borderBottom:'1px solid var(--border)',backgroundColor:i%2?'var(--bg-tertiary)':'transparent'}}>
                        <td style={{padding:'0.5rem 0.875rem',color:'var(--accent)',fontWeight:700}}>{c.stage}</td>
                        {['R1','R2','C1','C2','Q'].map(k => (
                          <td key={k} style={{padding:'0.5rem 0.875rem',fontFamily:'monospace',color:'var(--text-primary)'}}>{c[k]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:'0.875rem',padding:'0.625rem',backgroundColor:'var(--accent-light)',borderRadius:'8px',fontSize:'0.775rem',color:'var(--accent)'}}>
                💡 Use 1% metal-film resistors and C0G/NP0 capacitors. Recommended op-amps: <strong>NE5532, OPA2134, TL072, LM4562</strong>
              </div>
            </div>
          )}

          {/* Circuit Diagram tab */}
          {tab === 'diagram' && (
            <div className="card">
              <div style={{fontWeight:600,fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                Circuit Diagram — {type}
              </div>
              <div style={{padding:'1.5rem',backgroundColor:'var(--bg-tertiary)',borderRadius:'10px',marginBottom:'1rem'}}>
                <CircuitDiagram type={type} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',fontSize:'0.8rem'}}>
                <div style={{padding:'0.75rem',backgroundColor:'var(--bg-tertiary)',borderRadius:'8px'}}>
                  <div style={{fontWeight:600,color:'var(--text-secondary)',marginBottom:'0.25rem'}}>Topology</div>
                  <div style={{color:'var(--accent)',fontFamily:'monospace'}}>Sallen-Key (unity gain)</div>
                </div>
                <div style={{padding:'0.75rem',backgroundColor:'var(--bg-tertiary)',borderRadius:'8px'}}>
                  <div style={{fontWeight:600,color:'var(--text-secondary)',marginBottom:'0.25rem'}}>Transfer function</div>
                  <div style={{color:'var(--accent)',fontFamily:'monospace',fontSize:'0.75rem'}}>
                    H(s)=ωn²/(s²+(ωn/Q)s+ωn²)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bode Plot tab */}
          {tab === 'bode' && (
            <div className="card" style={{padding:'1rem'}}>
              <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--text-primary)',marginBottom:'1rem'}}>
                {approx} {order}th-order {type} — Bode Plot
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={bodeData} margin={{top:5,right:20,left:0,bottom:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="freqLabel" tick={{fontSize:10,fill:'var(--text-muted)'}} interval={40}
                    label={{value:'Frequency (Hz)',position:'insideBottom',offset:-12,fontSize:11,fill:'var(--text-muted)'}}/>
                  <YAxis yAxisId="m" domain={[-80,5]} tick={{fontSize:10,fill:'var(--text-muted)'}}
                    label={{value:'dB',angle:-90,position:'insideLeft',fontSize:11,fill:'var(--text-muted)'}}/>
                  {showPhase && <YAxis yAxisId="p" orientation="right" domain={[-200,50]}
                    tick={{fontSize:10,fill:'var(--text-muted)'}}
                    label={{value:'Phase (°)',angle:90,position:'insideRight',fontSize:11,fill:'var(--text-muted)'}}/>}
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:'0.75rem'}}/>
                  <ReferenceLine yAxisId="m" y={-3} stroke="var(--warning)" strokeDasharray="5 3"
                    label={{value:'−3dB',fill:'var(--warning)',fontSize:10,position:'insideTopRight'}}/>
                  <Line yAxisId="m" type="monotone" dataKey="magnitude" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Magnitude (dB)"/>
                  {showPhase && <Line yAxisId="p" type="monotone" dataKey="phase" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Phase (°)"/>}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Theory tab */}
          {tab === 'theory' && (
            <div className="card">
              <div style={{fontWeight:600,fontSize:'0.875rem',color:'var(--text-primary)',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <MdInfo size={16} color="var(--accent)"/> Theory — {approx} {type}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.875rem',fontSize:'0.82rem',color:'var(--text-secondary)'}}>
                <div style={{backgroundColor:'var(--bg-tertiary)',borderRadius:'8px',padding:'0.875rem',fontFamily:'monospace',color:'var(--accent)',lineHeight:1.8,whiteSpace:'pre-line'}}>
                  {approx==='Butterworth'
                    ? `|H(jω)|² = 1 / (1 + (ω/ωc)^${2*order})\n\nωc = 2π × ${fc} = ${(TWO_PI*fc).toFixed(1)} rad/s\nRoll-off = ${rolloff} dB/decade\nOrder = ${order}`
                    : `|H(jω)|² = 1 / (1 + ε²·T${order}²(ω/ωc))\n\nε = √(10^(${ripple}/10)−1) = ${Math.sqrt(Math.pow(10,ripple/10)-1).toFixed(4)}\nPassband ripple = ${ripple} dB`}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  <div style={{backgroundColor:'var(--bg-tertiary)',borderRadius:'8px',padding:'0.75rem'}}>
                    <div style={{fontWeight:600,color:'var(--success)',marginBottom:'0.25rem',fontSize:'0.775rem'}}>✓ Advantages</div>
                    <div style={{fontSize:'0.775rem'}}>
                      {approx==='Butterworth' ? 'Maximally flat passband. No ripple. Good transient response. Monotonic rolloff.' : `Steeper rolloff per order. Best stopband rejection for given order. ${ripple} dB equiripple.`}
                    </div>
                  </div>
                  <div style={{backgroundColor:'var(--bg-tertiary)',borderRadius:'8px',padding:'0.75rem'}}>
                    <div style={{fontWeight:600,color:'var(--error)',marginBottom:'0.25rem',fontSize:'0.775rem'}}>✗ Limitations</div>
                    <div style={{fontSize:'0.775rem'}}>
                      {approx==='Butterworth' ? 'Slower rolloff than Chebyshev. Moderate group delay variation near cutoff.' : `Passband ripple of ${ripple} dB. Non-linear phase. More ringing on transients.`}
                    </div>
                  </div>
                </div>
                <div>
                  <strong style={{color:'var(--text-primary)'}}>Audio applications:</strong>
                  <span style={{color:'var(--text-secondary)'}}> {
                    type==='Low-Pass'  ? 'Anti-aliasing before ADC, tone controls, speaker crossover low channel' :
                    type==='High-Pass' ? 'DC blocking, subsonic filter (HPF @ 20 Hz), speaker crossover high channel' :
                    type==='Band-Pass'? 'Parametric EQ boost band, band-limited noise generator, instrument pickup resonance' :
                    'Hum elimination (50/60 Hz notch), room mode correction, comb-filter cancellation'
                  }</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:768px){.ftype-grid{grid-template-columns:1fr 1fr!important}.fd-layout{grid-template-columns:1fr!important}}
      `}</style>
    </motion.div>
  )
}

/* ── Shared sub-components ────────────────────────────────────── */
function SLabel({ children }) {
  return <div style={{fontSize:'0.775rem',fontWeight:600,color:'var(--text-secondary)',marginBottom:'0.375rem'}}>{children}</div>
}
function TypeBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:'0.35rem 0.3rem', borderRadius:'6px', fontSize:'0.775rem', border:'1px solid', cursor:'pointer',
      borderColor: active?'var(--accent)':'var(--border)',
      backgroundColor: active?'var(--accent-light)':'transparent',
      color: active?'var(--accent)':'var(--text-secondary)',
      fontWeight: active?700:400, transition:'all 0.15s',
    }}>{label}</button>
  )
}
function SRangeRow({ label, value, min, max, step, onChange, display }) {
  return (
    <div style={{marginBottom:'0.875rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
        <span style={{fontSize:'0.775rem',fontWeight:600,color:'var(--text-secondary)'}}>{label}</span>
        <span style={{fontSize:'0.775rem',fontWeight:700,color:'var(--accent)',fontFamily:'monospace'}}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))} style={{width:'100%',accentColor:'var(--accent)'}}/>
    </div>
  )
}
