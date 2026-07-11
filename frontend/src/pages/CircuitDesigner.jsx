import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { MdCircle, MdCalculate, MdBolt, MdCable } from 'react-icons/md'

const PREAMP_TOPOLOGIES = [
  {
    id: 'opamp-mic',
    name: 'Mic Preamp (INA)',
    description: 'Low-noise instrumentation amplifier for microphone signals',
    components: [
      { name: 'U1', type: 'IC', value: 'INA217 (or INA1651)', note: 'Low-noise instrumentation amp' },
      { name: 'RG', type: 'Resistor', value: '270 Ω', note: 'Sets gain: G = 1 + 6k/RG' },
      { name: 'R_load', type: 'Resistor', value: '10 kΩ', note: 'Input termination' },
      { name: 'C_bypass', type: 'Capacitor', value: '100 µF / 100 nF', note: 'Supply bypass' },
      { name: 'C_input', type: 'Capacitor', value: '10 µF', note: 'Input coupling' },
    ],
    specs: { gain: '40 dB (× 100)', noise: '< 1 nV/√Hz', supply: '±15V or ±18V', bandwidth: '20 Hz – 20 kHz' },
  },
  {
    id: 'phono-riaa',
    name: 'Phono (RIAA)',
    description: 'RIAA equalization preamp for vinyl turntable cartridges',
    components: [
      { name: 'U1', type: 'IC', value: 'NE5534 / LM4562', note: 'Low-noise op-amp' },
      { name: 'R1', type: 'Resistor', value: '47 kΩ', note: 'Cartridge loading' },
      { name: 'C1', type: 'Capacitor', value: '220 pF', note: 'Cartridge capacitance' },
      { name: 'R2', type: 'Resistor', value: '820 Ω', note: 'RIAA network' },
      { name: 'C2', type: 'Capacitor', value: '3.9 nF', note: 'RIAA network (3180µs)' },
      { name: 'C3', type: 'Capacitor', value: '39 nF', note: 'RIAA network (318µs)' },
    ],
    specs: { gain: '40 dB @ 1kHz', noise: '< 75 dBRIAA', supply: '±15V', bandwidth: '20 Hz – 20 kHz (RIAA)' },
  },
  {
    id: 'headphone-amp',
    name: 'Headphone Amp',
    description: 'Low-output impedance buffer for driving 16Ω–300Ω headphones',
    components: [
      { name: 'U1', type: 'IC', value: 'OPA2134 / TPA6120A2', note: 'Audio op-amp' },
      { name: 'R_out', type: 'Resistor', value: '33 Ω', note: 'Output series resistor' },
      { name: 'C_out', type: 'Capacitor', value: '470 µF', note: 'Output coupling (if SE)' },
      { name: 'R1', type: 'Resistor', value: '10 kΩ', note: 'Gain network' },
      { name: 'RF', type: 'Resistor', value: '10 kΩ', note: 'Feedback (unity gain)' },
    ],
    specs: { gain: '0–20 dB (adjustable)', noise: '< -100 dBu', supply: '±12V–±18V', bandwidth: '5 Hz – 200 kHz' },
  },
]

const RIAA_POINTS = [
  { f: 20, db: 19.9 }, { f: 50, db: 17.3 }, { f: 100, db: 13.1 },
  { f: 200, db: 8.2 }, { f: 500, db: 2.6 }, { f: 1000, db: 0 },
  { f: 2000, db: -2.6 }, { f: 5000, db: -7.6 }, { f: 10000, db: -13.7 },
  { f: 20000, db: -19.6 },
]

function calcOpAmpGain(rin, rf, inv) {
  if (inv) return -(rf / rin)
  return 1 + rf / rin
}

function generateImpedanceData() {
  const data = []
  for (let i = 0; i <= 100; i++) {
    const f = 20 * Math.pow(1000, i / 100)
    const Zout_good = 100 / Math.sqrt(1 + Math.pow(f / 1000, 2))
    const Zout_poor = 1000 / Math.sqrt(1 + Math.pow(f / 100, 2))
    data.push({
      freqLabel: f >= 1000 ? `${(f/1000).toFixed(1)}k` : f.toFixed(0),
      'Low-Z Output (Ideal)': parseFloat(Zout_good.toFixed(1)),
      'High-Z Output (Poor)': parseFloat(Zout_poor.toFixed(1)),
    })
  }
  return data
}

export default function CircuitDesigner() {
  const [selectedTopology, setSelectedTopology] = useState(PREAMP_TOPOLOGIES[0])
  const [activeTab, setActiveTab] = useState('overview')
  const [gainRin, setGainRin] = useState(1000)
  const [gainRf, setGainRf] = useState(47000)
  const [gainInv, setGainInv] = useState(false)
  const [phantomVolt, setPhantomVolt] = useState(48)

  const gain = calcOpAmpGain(gainRin, gainRf, gainInv)
  const gainDb = 20 * Math.log10(Math.abs(gain))

  const impedanceData = generateImpedanceData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1100px', margin: '0 auto' }}
    >
      <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MdCircle size={24} color="var(--accent)" /> Circuit Designer
      </h1>
      <p className="section-subtitle">Explore preamplifier topologies, component lists, and circuit specifications</p>

      {/* Topology cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.25rem' }} className="topo-grid">
        {PREAMP_TOPOLOGIES.map(topo => (
          <motion.div
            key={topo.id}
            whileHover={{ y: -3 }}
            onClick={() => setSelectedTopology(topo)}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: '2px solid',
              borderColor: selectedTopology.id === topo.id ? 'var(--accent)' : 'var(--border)',
              backgroundColor: selectedTopology.id === topo.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <MdCable size={18} color={selectedTopology.id === topo.id ? 'var(--accent)' : 'var(--text-muted)'} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{topo.name}</span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{topo.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
        {['overview', 'components', 'calculator', 'reference'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem',
              border: '1px solid',
              borderColor: activeTab === t ? 'var(--accent)' : 'transparent',
              backgroundColor: activeTab === t ? 'var(--accent-light)' : 'transparent',
              color: activeTab === t ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: activeTab === t ? 600 : 400, textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="tab-grid">
          {/* Specs */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {selectedTopology.name} — Specifications
            </div>
            {Object.entries(selectedTopology.specs).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {k.replace(/([A-Z])/g, ' $1')}
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* RIAA / Impedance Chart */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {selectedTopology.id === 'phono-riaa' ? 'RIAA Equalization Curve' : 'Output Impedance vs Frequency'}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              {selectedTopology.id === 'phono-riaa' ? (
                <LineChart data={RIAA_POINTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="f" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', border: '1px solid var(--border)' }} formatter={(v) => [`${v} dB`, 'RIAA']} />
                  <Line type="monotone" dataKey="db" stroke="var(--accent)" strokeWidth={2} dot={false} name="RIAA Response" />
                </LineChart>
              ) : (
                <LineChart data={impedanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="freqLabel" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={20} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', fontSize: '0.75rem', border: '1px solid var(--border)' }} />
                  <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
                  <Line type="monotone" dataKey="Low-Z Output (Ideal)" stroke="var(--success)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="High-Z Output (Poor)" stroke="var(--error)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Bill of Materials — {selectedTopology.name}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Reference', 'Type', 'Value', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedTopology.components.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', backgroundColor: i % 2 ? 'var(--bg-tertiary)' : 'transparent' }}>
                    <td style={{ padding: '0.5rem 0.875rem', color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>{c.name}</td>
                    <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-secondary)' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{c.type}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{c.value}</td>
                    <td style={{ padding: '0.5rem 0.875rem', color: 'var(--text-muted)' }}>{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            <strong>PCB Tips:</strong> Use 1% tolerance metal film resistors for critical signal path components. Use WIMA MKP or Nichicon FG series capacitors for audio-grade performance.
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="tab-grid">
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdCalculate size={16} color="var(--accent)" /> Op-Amp Quick Calculator
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                R_in (Input / Gain Resistor): {gainRin >= 1000 ? `${gainRin/1000}kΩ` : `${gainRin}Ω`}
              </label>
              <input type="range" min={100} max={100000} step={100} value={gainRin} onChange={e => setGainRin(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                R_f (Feedback Resistor): {gainRf >= 1000 ? `${(gainRf/1000).toFixed(0)}kΩ` : `${gainRf}Ω`}
              </label>
              <input type="range" min={1000} max={1000000} step={1000} value={gainRf} onChange={e => setGainRf(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setGainInv(false)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid', borderColor: !gainInv ? 'var(--accent)' : 'var(--border)', backgroundColor: !gainInv ? 'var(--accent-light)' : 'transparent', color: !gainInv ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
              >Non-Inverting</button>
              <button
                onClick={() => setGainInv(true)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid', borderColor: gainInv ? 'var(--accent)' : 'var(--border)', backgroundColor: gainInv ? 'var(--accent-light)' : 'transparent', color: gainInv ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
              >Inverting</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gain (V/V)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>{gain.toFixed(1)}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gain (dB)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>{gainDb.toFixed(1)}</div>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', padding: '0.625rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.775rem', color: 'var(--accent)' }}>
              A = {gainInv ? `-Rf/Rin = -${gainRf}/${gainRin}` : `1 + Rf/R1 = 1 + ${gainRf}/${gainRin}`}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdBolt size={16} color="var(--warning)" /> Phantom Power Calculator
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>
                Phantom Voltage: {phantomVolt}V
              </label>
              <input type="range" min={12} max={48} step={6} value={phantomVolt} onChange={e => setPhantomVolt(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--warning)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Feeding Resistors (×2)', value: '6.81 kΩ ±0.1%', note: 'Per IEC 61938' },
                { label: 'Max Current (per mic)', value: `${((phantomVolt) / (2 * 6810) * 1000).toFixed(1)} mA`, note: 'At short circuit' },
                { label: 'Min Connector Voltage', value: `${(phantomVolt * 0.92).toFixed(0)}V`, note: 'Under 10mA load' },
                { label: 'Standard', value: 'IEC 61938', note: 'P12 / P24 / P48' },
              ].map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)' }}>{i.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{i.note}</div>
                  </div>
                  <span style={{ color: 'var(--warning)', fontWeight: 600, fontFamily: 'monospace' }}>{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reference' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="tab-grid">
          {[
            {
              title: 'dBu / dBV Reference',
              items: [
                { label: '+24 dBu', value: '12.28 V RMS', note: 'Pro max output' },
                { label: '+4 dBu', value: '1.228 V RMS', note: 'Pro line level' },
                { label: '0 dBu', value: '775 mV RMS', note: 'Reference (600Ω)' },
                { label: '-10 dBV', value: '316 mV RMS', note: 'Consumer line' },
                { label: '-60 dBu', value: '775 µV RMS', note: 'Mic sensitivity' },
              ],
            },
            {
              title: 'Standard Impedances',
              items: [
                { label: 'Mic output', value: '150–600 Ω', note: 'Balanced XLR' },
                { label: 'Line input', value: '10–47 kΩ', note: 'TRS/RCA' },
                { label: 'Line output', value: '100–600 Ω', note: 'Source impedance' },
                { label: 'Speaker (HiFi)', value: '4–16 Ω', note: 'Nominal' },
                { label: 'Headphones', value: '16–600 Ω', note: 'IEM to studio' },
              ],
            },
          ].map(section => (
            <div key={section.title} className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>{section.title}</div>
              {section.items.map(i => (
                <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 600 }}>{i.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{i.note}</div>
                  </div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, alignSelf: 'center' }}>{i.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .topo-grid { grid-template-columns: 1fr !important; }
          .tab-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
