import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts'
import { MdTune, MdMemory, MdAutoAwesome, MdInfo } from 'react-icons/md'

/* ── Amplifier class data ─────────────────────────────────────────────────── */
const AMP_CLASSES = {
  'Class A': {
    eff: [25, 50], effMid: 37, bias: 'Q-point at 50% of load line', cond: '360°',
    thd: '< 0.01%', color: '#3b82f6',
    pros: 'Ultra-low distortion, no crossover notch, excellent linearity',
    cons: 'Very low efficiency, large heatsink required, high quiescent dissipation',
    use:  'Headphone amps, DAC output stages, reference-grade preamplifiers',
    schematic: 'common-emitter',
  },
  'Class AB': {
    eff: [50, 78], effMid: 64, bias: 'Slight forward bias (Vbe ≈ 20–50 mV)',cond:'180–360°',
    thd: '< 0.05%', color: '#8b5cf6',
    pros: 'Good efficiency, no crossover distortion with proper bias, compact',
    cons: 'Thermal bias drift requires compensation, slightly more complex than Class B',
    use:  'Hi-fi power amplifiers, car audio, studio monitors',
    schematic: 'push-pull',
  },
  'Class B': {
    eff: [0, 78.5], effMid: 78, bias: 'Zero bias (cutoff point)', cond: '180°',
    thd: '1–5%', color: '#06b6d4',
    pros: 'High efficiency, simple circuit, complementary symmetry',
    cons: 'Crossover distortion at zero-crossing, requires matched pair',
    use:  'RF amplifiers, push-pull output stages with heavy feedback',
    schematic: 'push-pull',
  },
  'Class D': {
    eff: [85, 98], effMid: 92, bias: 'PWM switching (250 kHz–1 MHz)', cond: 'Switching',
    thd: '< 0.1%', color: '#22c55e',
    pros: 'Very high efficiency, compact, cool running, ideal for mobile',
    cons: 'Requires LC output filter, EMI concerns, more complex gate drive',
    use:  'Subwoofers, Bluetooth speakers, class-D PA systems, mobile audio',
    schematic: 'h-bridge',
  },
}

/* ── Op-amp selection database ───────────────────────────────────────────── */
const OP_AMPS = [
  { name:'NE5532',  noise:'5 nV/√Hz', gbw:'10 MHz', supply:'±5–±18V', thd:'0.002%', notes:'Industry standard audio op-amp, dual' },
  { name:'OPA2134', noise:'8 nV/√Hz', gbw:'8 MHz',  supply:'±2.5–±18V', thd:'0.00008%', notes:'Ultra-low distortion FET input' },
  { name:'LM4562',  noise:'2.7 nV/√Hz',gbw:'55 MHz',supply:'±2.5–±17V', thd:'0.00003%', notes:'Ultra-low noise, high GBW' },
  { name:'TL072',   noise:'18 nV/√Hz',gbw:'3 MHz',  supply:'±5–±18V', thd:'0.003%',   notes:'General purpose FET input, low cost' },
  { name:'LT1115',  noise:'0.9 nV/√Hz',gbw:'70 MHz',supply:'±2–±18V', thd:'0.0002%',  notes:'Lowest noise bipolar input op-amp' },
  { name:'OPA1612', noise:'1.1 nV/√Hz',gbw:'80 MHz',supply:'±2.5–±18V',thd:'0.000015%',notes:'Flagship audio op-amp, SoundPlus' },
]

/* ── SVG schematics ─────────────────────────────────────────────────────── */
function NonInvertingSchematic({ gainDb }) {
  return (
    <svg viewBox="0 0 320 160" style={{ width: '100%', maxWidth: 320, height: 130 }}>
      <text x="160" y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-primary)">Non-Inverting Op-Amp</text>
      {/* Op-amp triangle */}
      <polygon points="140,50 140,110 190,80" fill="none" stroke="var(--accent)" strokeWidth="2"/>
      <text x="158" y="78" textAnchor="middle" fontSize="9" fill="var(--accent)">+</text>
      <text x="158" y="92" textAnchor="middle" fontSize="9" fill="var(--accent)">−</text>
      {/* Input + */}
      <line x1="50" y1="67" x2="140" y2="67" stroke="var(--accent)" strokeWidth="2"/>
      <text x="38" y="70" fontSize="9" fill="var(--text-muted)">Vin+</text>
      {/* Input − */}
      <line x1="80" y1="93" x2="140" y2="93" stroke="var(--accent)" strokeWidth="2"/>
      {/* R1 to ground */}
      <line x1="80" y1="93" x2="80" y2="113" stroke="var(--accent)" strokeWidth="2"/>
      <rect x="65" y="113" width="30" height="14" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
      <text x="80" y="140" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">R1</text>
      <line x1="80" y1="127" x2="80" y2="145" stroke="var(--text-muted)" strokeWidth="1"/>
      <line x1="74" y1="145" x2="86" y2="145" stroke="var(--text-muted)" strokeWidth="1"/>
      <line x1="77" y1="148" x2="83" y2="148" stroke="var(--text-muted)" strokeWidth="1"/>
      {/* Rf feedback */}
      <line x1="190" y1="80" x2="250" y2="80" stroke="var(--accent)" strokeWidth="2"/>
      <line x1="220" y1="80" x2="220" y2="93" stroke="var(--accent)" strokeWidth="2"/>
      <rect x="205" y="93" width="30" height="14" rx="2" fill="none" stroke="#8b5cf6" strokeWidth="1.5"/>
      <text x="220" y="120" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Rf</text>
      <line x1="220" y1="107" x2="80" y2="107" stroke="var(--accent)" strokeWidth="2"/>
      <line x1="80" y1="93" x2="80" y2="107" stroke="var(--accent)" strokeWidth="2"/>
      <text x="252" y="72" fontSize="9" fill="var(--text-muted)">Vout</text>
      <text x="160" y="155" textAnchor="middle" fontSize="9" fill="var(--text-muted)">Av = 1 + Rf/R1 ≈ {gainDb.toFixed(1)} dB</text>
    </svg>
  )
}

function InvertingSchematic({ gainDb }) {
  return (
    <svg viewBox="0 0 320 160" style={{ width: '100%', maxWidth: 320, height: 130 }}>
      <text x="160" y="18" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-primary)">Inverting Op-Amp</text>
      <polygon points="140,55 140,105 190,80" fill="none" stroke="var(--accent)" strokeWidth="2"/>
      <text x="158" y="74" textAnchor="middle" fontSize="9" fill="var(--accent)">+</text>
      <text x="158" y="89" textAnchor="middle" fontSize="9" fill="var(--accent)">−</text>
      {/* Rin */}
      <line x1="30" y1="88" x2="70" y2="88" stroke="var(--accent)" strokeWidth="2"/>
      <rect x="70" y="81" width="35" height="14" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.5"/>
      <text x="87" y="77" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Rin</text>
      <line x1="105" y1="88" x2="140" y2="88" stroke="var(--accent)" strokeWidth="2"/>
      {/* Non-inverting to ground */}
      <line x1="120" y1="72" x2="140" y2="72" stroke="var(--accent)" strokeWidth="2"/>
      <line x1="120" y1="72" x2="120" y2="130" stroke="var(--text-muted)" strokeWidth="1"/>
      <line x1="115" y1="130" x2="125" y2="130" stroke="var(--text-muted)" strokeWidth="1"/>
      {/* Rf */}
      <line x1="190" y1="80" x2="230" y2="80" stroke="var(--accent)" strokeWidth="2"/>
      <line x1="120" y1="88" x2="120" y2="100" stroke="var(--accent)" strokeWidth="2"/>
      <line x1="120" y1="100" x2="200" y2="100" stroke="var(--accent)" strokeWidth="2"/>
      <rect x="200" y="93" width="30" height="14" rx="2" fill="none" stroke="#8b5cf6" strokeWidth="1.5"/>
      <text x="215" y="120" textAnchor="middle" fontSize="9" fill="var(--text-secondary)">Rf</text>
      <line x1="230" y1="100" x2="230" y2="80" stroke="var(--accent)" strokeWidth="2"/>
      <text x="18" y="81" fontSize="9" fill="var(--text-muted)">Vin</text>
      <text x="232" y="73" fontSize="9" fill="var(--text-muted)">Vout</text>
      <text x="160" y="155" textAnchor="middle" fontSize="9" fill="var(--text-muted)">Av = −Rf/Rin  →  |Av| ≈ {gainDb.toFixed(1)} dB</text>
    </svg>
  )
}

/* ── Gain & bandwidth curve ─────────────────────────────────────────────── */
function genGainCurve(gain, gbwMHz) {
  const gbw = gbwMHz * 1e6
  return Array.from({ length: 150 }, (_, i) => {
    const f = 10 * Math.pow(gbw / 10, i / 149)
    const Af = gain / Math.sqrt(1 + Math.pow(f / (gbw / gain), 2))
    return {
      fLabel: f >= 1e6 ? `${(f/1e6).toFixed(1)}M` : f >= 1000 ? `${(f/1000).toFixed(0)}k` : f.toFixed(0),
      gainDb: parseFloat((20 * Math.log10(Math.max(Af, 1e-6))).toFixed(2)),
    }
  })
}

const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:.07}} }
const iv = { hidden:{opacity:0,y:14}, visible:{opacity:1,y:0} }

export default function AmplifierDesigner() {
  const [ampClass,  setAmpClass]  = useState('Class AB')
  const [topology,  setTopology]  = useState('Non-Inverting')
  const [r1,        setR1]        = useState(1000)
  const [rf,        setRf]        = useState(47000)
  const [vcc,       setVcc]       = useState(15)
  const [load,      setLoad]      = useState(8)
  const [selOpAmp,  setSelOpAmp]  = useState('NE5532')
  const [tab,       setTab]       = useState('design')

  const cls      = AMP_CLASSES[ampClass]
  const opAmp    = OP_AMPS.find(o => o.name === selOpAmp) || OP_AMPS[0]

  const gain   = topology === 'Inverting' ? -(rf / r1) : 1 + rf / r1
  const gainDb = 20 * Math.log10(Math.abs(gain))
  const gainV  = Math.abs(gain)

  // Power estimates
  const vpeak   = vcc * 0.9
  const poutW   = (vpeak * vpeak) / (2 * load)
  const effNum  = cls.effMid / 100
  const pdcW    = poutW / effNum
  const pdissW  = pdcW - poutW

  // Bandwidth estimate from GBW
  const gbwMHz = parseFloat(opAmp.gbw)
  const bwHz   = (gbwMHz * 1e6 / gainV).toFixed(0)

  // Input / output impedance
  const zinOhm  = topology === 'Non-Inverting' ? '>1 MΩ (FET) / ~100 kΩ (BJT)' : `${(r1/1000).toFixed(1)} kΩ`
  const zoutOhm = `< ${(100 / gainV).toFixed(0)} Ω`

  // Distortion estimate (simplified model)
  const thdEst = ampClass === 'Class A' ? 0.005 : ampClass === 'Class AB' ? 0.02 : ampClass === 'Class B' ? 2.0 : 0.05
  const thdPct = (thdEst * (1 + Math.log10(Math.max(gainV, 1)) * 0.1)).toFixed(4)

  const gainCurveData = useMemo(() => genGainCurve(gainV, gbwMHz), [gainV, gbwMHz])

  const CustomTooltip = ({active,payload})=>{
    if(!active||!payload?.length) return null
    return(
      <div style={{backgroundColor:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:8,padding:'.5rem .75rem',fontSize:'.75rem'}}>
        <div style={{fontWeight:600,color:'var(--text-primary)'}}>{payload[0]?.payload?.fLabel} Hz</div>
        <div style={{color:'var(--accent)'}}>{payload[0]?.value} dB</div>
      </div>
    )
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="visible" style={{maxWidth:1100,margin:'0 auto'}}>
      <motion.div variants={iv}>
        <h1 className="section-title" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
          <MdTune size={24} color="var(--accent)"/> Amplifier Designer
        </h1>
        <p className="section-subtitle">Calculate gain, power, impedance, bandwidth, and distortion for audio amplifiers</p>
      </motion.div>

      {/* Class selector */}
      <motion.div variants={iv} style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'.75rem',marginBottom:'1.25rem'}} className="amp-class-grid">
        {Object.entries(AMP_CLASSES).map(([name,d])=>(
          <motion.div key={name} whileHover={{y:-3}} onClick={()=>setAmpClass(name)} style={{
            padding:'.875rem',borderRadius:10,border:'2px solid',cursor:'pointer',
            borderColor:ampClass===name?d.color:'var(--border)',
            backgroundColor:ampClass===name?`${d.color}14`:'var(--bg-secondary)',transition:'all .2s',
          }}>
            <div style={{fontWeight:700,fontSize:'.875rem',color:ampClass===name?d.color:'var(--text-primary)',marginBottom:'.2rem'}}>{name}</div>
            <div style={{fontSize:'.75rem',color:d.color,fontWeight:600}}>{d.effMid}% eff.</div>
            <div style={{fontSize:'.7rem',color:'var(--text-muted)',marginTop:'.2rem'}}>THD {d.thd}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={iv} style={{display:'flex',gap:'.5rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        {['design','schematic','opamp','power'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'.4rem 1rem',borderRadius:8,fontSize:'.8rem',border:'1px solid',cursor:'pointer',
            borderColor:tab===t?'var(--accent)':'transparent',
            backgroundColor:tab===t?'var(--accent-light)':'transparent',
            color:tab===t?'var(--accent)':'var(--text-secondary)',fontWeight:tab===t?600:400,textTransform:'capitalize',
          }}>{t==='opamp'?'Op-Amp Selection':t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </motion.div>

      {/* Design tab */}
      {tab==='design'&&(
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'1.25rem'}} className="amp-grid">
          {/* Controls */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            <motion.div variants={iv} className="card">
              <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--text-primary)',marginBottom:'.875rem'}}>Op-Amp Configuration</div>
              <div style={{display:'flex',gap:'.35rem',marginBottom:'1rem'}}>
                {['Non-Inverting','Inverting'].map(t=>(
                  <button key={t} onClick={()=>setTopology(t)} style={{
                    flex:1,padding:'.4rem .25rem',borderRadius:6,fontSize:'.72rem',border:'1px solid',cursor:'pointer',
                    borderColor:topology===t?'var(--accent)':'var(--border)',
                    backgroundColor:topology===t?'var(--accent-light)':'transparent',
                    color:topology===t?'var(--accent)':'var(--text-secondary)',fontWeight:topology===t?600:400,transition:'all .15s',
                  }}>{t}</button>
                ))}
              </div>
              <ASlider label={topology==='Inverting'?'R_in':'R1 (gain)'}
                value={r1} onChange={setR1} min={100} max={100000} step={100}
                display={r1>=1000?`${(r1/1000).toFixed(1)} kΩ`:`${r1} Ω`}/>
              <ASlider label="R_f (feedback)"
                value={rf} onChange={setRf} min={1000} max={1000000} step={1000}
                display={rf>=1000?`${(rf/1000).toFixed(0)} kΩ`:`${rf} Ω`}/>
              <ASlider label="Supply ±Vcc" value={vcc} onChange={setVcc} min={5} max={30} step={1} display={`±${vcc} V`}/>
              <ASlider label="Load impedance" value={load} onChange={setLoad} min={4} max={600} step={4} display={`${load} Ω`}/>
            </motion.div>
          </div>

          {/* Results */}
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {/* Metrics */}
            <motion.div variants={iv} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.75rem'}} className="metrics-grid">
              {[
                {label:'Voltage Gain', value:`${gainV.toFixed(2)} V/V`, sub:`${gainDb.toFixed(1)} dB`, color:'var(--accent)'},
                {label:'−3 dB Bandwidth', value:bwHz>=1e6?`${(bwHz/1e6).toFixed(2)} MHz`:bwHz>=1000?`${(bwHz/1000).toFixed(1)} kHz`:`${bwHz} Hz`, sub:`GBW ${opAmp.gbw}`, color:'#8b5cf6'},
                {label:'Input Impedance', value:zinOhm, sub:topology, color:'var(--success)'},
                {label:'Output Impedance', value:zoutOhm, sub:'with feedback', color:'#f59e0b'},
                {label:'Est. THD', value:`${thdPct}%`, sub:`${ampClass} topology`, color:parseFloat(thdPct)<0.1?'var(--success)':'var(--warning)'},
                {label:'Output Power', value:`${poutW.toFixed(2)} W`, sub:`into ${load} Ω`, color:'var(--accent)'},
              ].map(m=>(
                <div key={m.label} className="card" style={{padding:'.875rem',textAlign:'center'}}>
                  <div style={{fontSize:'.7rem',color:'var(--text-muted)',marginBottom:'.2rem'}}>{m.label}</div>
                  <div style={{fontSize:'1.15rem',fontWeight:800,color:m.color,fontFamily:'monospace'}}>{m.value}</div>
                  <div style={{fontSize:'.68rem',color:'var(--text-muted)',marginTop:'.15rem'}}>{m.sub}</div>
                </div>
              ))}
            </motion.div>

            {/* Gain-frequency curve */}
            <motion.div variants={iv} className="card" style={{padding:'1rem'}}>
              <div style={{fontWeight:600,fontSize:'.85rem',color:'var(--text-primary)',marginBottom:'1rem'}}>
                Open-Loop vs Closed-Loop Gain — {selOpAmp} (GBW = {opAmp.gbw})
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={gainCurveData} margin={{top:5,right:20,left:0,bottom:20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="fLabel" tick={{fontSize:10,fill:'var(--text-muted)'}} interval={25}
                    label={{value:'Frequency',position:'insideBottom',offset:-12,fontSize:11,fill:'var(--text-muted)'}}/>
                  <YAxis domain={[-20,gainDb+10]} tick={{fontSize:10,fill:'var(--text-muted)'}}
                    label={{value:'Gain (dB)',angle:-90,position:'insideLeft',fontSize:11,fill:'var(--text-muted)'}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <ReferenceLine y={gainDb-3} stroke="var(--warning)" strokeDasharray="5 3" label={{value:'-3 dB',fill:'var(--warning)',fontSize:10,position:'insideTopRight'}}/>
                  <Line type="monotone" dataKey="gainDb" stroke="var(--accent)" strokeWidth={2.5} dot={false} name="Gain (dB)"/>
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Formula explanations */}
            <motion.div variants={iv} className="card">
              <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--text-primary)',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
                <MdAutoAwesome size={16} color="var(--accent)"/> Formula Explanations
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem'}} className="form-grid">
                {[
                  {title:'Closed-Loop Gain', code:topology==='Inverting'?`Av = −Rf/Rin\n   = −${rf}/${r1}\n   = ${gain.toFixed(2)} V/V (${gainDb.toFixed(1)} dB)`:`Av = 1 + Rf/R1\n   = 1 + ${rf}/${r1}\n   = ${gain.toFixed(2)} V/V (${gainDb.toFixed(1)} dB)`},
                  {title:'Unity-Gain Bandwidth',code:`GBW = Av × f_{-3dB}\n${opAmp.gbw} = ${gainV.toFixed(1)} × ${parseInt(bwHz)>=1000?(parseInt(bwHz)/1000).toFixed(1)+'k':bwHz} Hz`},
                  {title:'Input Impedance', code:topology==='Non-Inverting'?`Zin ≈ Acl × Zin_OL\n   ≫ 1 MΩ (very high)`:`Zin = Rin = ${(r1/1000).toFixed(1)} kΩ`},
                  {title:'Output Impedance', code:`Zout_CL = Zout_OL / (1 + Aβ)\n   ≈ ${zoutOhm}  (with feedback)`},
                ].map(f=>(
                  <div key={f.title}>
                    <div style={{fontSize:'.775rem',fontWeight:600,color:'var(--text-secondary)',marginBottom:'.3rem'}}>{f.title}</div>
                    <div style={{backgroundColor:'var(--bg-tertiary)',borderRadius:6,padding:'.5rem .75rem',fontFamily:'monospace',fontSize:'.73rem',color:'var(--accent)',whiteSpace:'pre-wrap'}}>{f.code}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Schematic tab */}
      {tab==='schematic'&&(
        <motion.div variants={iv} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}} className="sch-grid">
          <div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--text-primary)',marginBottom:'1rem'}}>Current Configuration</div>
            {topology==='Non-Inverting'?<NonInvertingSchematic gainDb={gainDb}/>:<InvertingSchematic gainDb={gainDb}/>}
            <div style={{marginTop:'1rem',width:'100%'}}>
              <div style={{padding:'.75rem',backgroundColor:'var(--accent-light)',borderRadius:8,fontSize:'.78rem',color:'var(--accent)'}}>
                <strong>Configuration:</strong> {topology} · Gain = {gain.toFixed(2)} V/V ({gainDb.toFixed(1)} dB) · Supply ±{vcc} V
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--text-primary)',marginBottom:'.875rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
              <MdInfo size={16} color={cls.color}/> {ampClass} Characteristics
            </div>
            {[
              {k:'Efficiency',    v:`${cls.eff[0]}–${cls.eff[1]}%`},
              {k:'Conduction',    v:cls.cond},
              {k:'Bias Point',    v:cls.bias},
              {k:'Typical THD',   v:cls.thd},
            ].map(i=>(
              <div key={i.k} style={{display:'flex',justifyContent:'space-between',padding:'.4rem 0',borderBottom:'1px solid var(--border)',fontSize:'.8rem'}}>
                <span style={{color:'var(--text-secondary)'}}>{i.k}</span>
                <span style={{color:cls.color,fontWeight:600}}>{i.v}</span>
              </div>
            ))}
            <div style={{marginTop:'.875rem',fontSize:'.8rem',color:'var(--text-secondary)',lineHeight:1.55}}>
              <strong style={{color:'var(--success)'}}>✓ Pros:</strong> {cls.pros}<br/>
              <strong style={{color:'var(--error)'}}>✗ Cons:</strong> {cls.cons}<br/>
              <strong>Best for:</strong> {cls.use}
            </div>
          </div>
        </motion.div>
      )}

      {/* Op-amp selection tab */}
      {tab==='opamp'&&(
        <motion.div variants={iv} className="card">
          <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--text-primary)',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'.5rem'}}>
            <MdMemory size={16} color="var(--accent)"/> Op-Amp Selection Guide
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'.8rem'}}>
              <thead><tr style={{borderBottom:'2px solid var(--border)'}}>
                {['Part','Noise','GBW','Supply','THD','Notes','Select'].map(h=>(
                  <th key={h} style={{padding:'.5rem .75rem',textAlign:'left',color:'var(--text-muted)',fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {OP_AMPS.map((o,i)=>(
                  <tr key={o.name} style={{borderBottom:'1px solid var(--border)',backgroundColor:selOpAmp===o.name?'var(--accent-light)':i%2?'var(--bg-tertiary)':'transparent'}}>
                    <td style={{padding:'.5rem .75rem',fontWeight:700,color:selOpAmp===o.name?'var(--accent)':'var(--text-primary)'}}>{o.name}</td>
                    <td style={{padding:'.5rem .75rem',fontFamily:'monospace',color:'var(--text-secondary)'}}>{o.noise}</td>
                    <td style={{padding:'.5rem .75rem',fontFamily:'monospace',color:'var(--text-secondary)'}}>{o.gbw}</td>
                    <td style={{padding:'.5rem .75rem',fontFamily:'monospace',color:'var(--text-secondary)'}}>{o.supply}</td>
                    <td style={{padding:'.5rem .75rem',fontFamily:'monospace',color:'var(--success)'}}>{o.thd}</td>
                    <td style={{padding:'.5rem .75rem',color:'var(--text-muted)'}}>{o.notes}</td>
                    <td style={{padding:'.5rem .75rem'}}>
                      <button onClick={()=>setSelOpAmp(o.name)} className={selOpAmp===o.name?'btn-primary':'btn-secondary'}
                        style={{padding:'.2rem .6rem',fontSize:'.72rem'}}>
                        {selOpAmp===o.name?'Selected':'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Power tab */}
      {tab==='power'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}} className="pwr-grid">
          <motion.div variants={iv} className="card">
            <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--text-primary)',marginBottom:'1rem'}}>Power Estimation — {ampClass}</div>
            {[
              {label:'Output Power',   value:`${poutW.toFixed(2)} W`,  color:'var(--success)'},
              {label:'DC Power',       value:`${pdcW.toFixed(2)} W`,   color:'var(--warning)'},
              {label:'Dissipated',     value:`${pdissW.toFixed(2)} W`, color:'var(--error)'},
              {label:'Efficiency',     value:`${cls.effMid}%`,         color:cls.color},
              {label:'Peak Voltage',   value:`${(vcc*0.9).toFixed(1)} V`,color:'var(--accent)'},
            ].map(m=>(
              <div key={m.label} style={{display:'flex',justifyContent:'space-between',padding:'.5rem 0',borderBottom:'1px solid var(--border)',fontSize:'.8rem'}}>
                <span style={{color:'var(--text-secondary)'}}>{m.label}</span>
                <span style={{color:m.color,fontWeight:700,fontFamily:'monospace'}}>{m.value}</span>
              </div>
            ))}
            <div style={{marginTop:'1rem',padding:'.75rem',backgroundColor:'var(--bg-tertiary)',borderRadius:8,fontSize:'.78rem',color:'var(--text-secondary)'}}>
              <strong>Heatsink required:</strong> Thermal resistance θ_SA &lt; ({vcc}−{(vcc*0.9*0.9/(2*load)).toFixed(1)}) / {pdissW.toFixed(1)} = {((vcc - vcc*0.9*0.9/(2*load))/pdissW).toFixed(2)} °C/W
            </div>
          </motion.div>
          <motion.div variants={iv} className="card" style={{padding:'1rem'}}>
            <div style={{fontWeight:600,fontSize:'.85rem',color:'var(--text-primary)',marginBottom:'1rem'}}>Power Budget</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[{name:'Power',Output:poutW,Dissipated:pdissW}]} margin={{left:-10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:'var(--text-muted)'}}/>
                <YAxis tick={{fontSize:10,fill:'var(--text-muted)'}} unit=" W"/>
                <Tooltip contentStyle={{backgroundColor:'var(--bg-secondary)',border:'1px solid var(--border)',fontSize:'.75rem'}} formatter={v=>[`${v.toFixed(2)} W`]}/>
                <Legend wrapperStyle={{fontSize:'.72rem'}}/>
                <Bar dataKey="Output"     fill="var(--success)" radius={[4,4,0,0]}/>
                <Bar dataKey="Dissipated" fill="var(--error)"   radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      <style>{`
        @media (max-width:768px){.amp-class-grid{grid-template-columns:1fr 1fr!important}.amp-grid{grid-template-columns:1fr!important}.metrics-grid{grid-template-columns:1fr 1fr!important}.form-grid{grid-template-columns:1fr!important}.sch-grid{grid-template-columns:1fr!important}.pwr-grid{grid-template-columns:1fr!important}}
      `}</style>
    </motion.div>
  )
}

function ASlider({label,value,onChange,min,max,step,display}){
  return(
    <div style={{marginBottom:'.875rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.3rem'}}>
        <span style={{fontSize:'.775rem',fontWeight:600,color:'var(--text-secondary)'}}>{label}</span>
        <span style={{fontSize:'.775rem',fontWeight:700,color:'var(--accent)',fontFamily:'monospace'}}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))} style={{width:'100%',accentColor:'var(--accent)'}}/>
    </div>
  )
}
