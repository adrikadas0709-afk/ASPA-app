import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MdChat, MdShowChart, MdTune, MdCircle, MdEqualizer,
  MdArrowForward, MdWaves, MdElectricBolt, MdSchool
} from 'react-icons/md'

const features = [
  {
    icon: MdChat,
    title: 'AI Engineering Assistant',
    description: 'Converse with IBM Granite AI to design circuits, troubleshoot issues, and get real-time engineering guidance.',
    path: '/assistant',
    color: '#3b82f6',
    badge: 'IBM Granite',
  },
  {
    icon: MdShowChart,
    title: 'Filter Analysis',
    description: 'Design and visualize Butterworth, Chebyshev, and Bessel filters with interactive Bode plots.',
    path: '/filter-analysis',
    color: '#8b5cf6',
    badge: 'Interactive',
  },
  {
    icon: MdTune,
    title: 'Amplifier Designer',
    description: 'Calculate gain, bandwidth, and power efficiency for Class A, AB, B, and D amplifier topologies.',
    path: '/amplifier',
    color: '#06b6d4',
    badge: 'Calculator',
  },
  {
    icon: MdCircle,
    title: 'Circuit Designer',
    description: 'Build and analyze audio circuits with component selectors and performance estimators.',
    path: '/circuit-designer',
    color: '#f59e0b',
    badge: 'Designer',
  },
  {
    icon: MdEqualizer,
    title: 'Parametric Equalizer',
    description: 'Design multi-band parametric and graphic equalizers with real-time frequency response curves.',
    path: '/equalizer',
    color: '#22c55e',
    badge: 'EQ Tool',
  },
]

const stats = [
  { label: 'Circuit Topologies', value: '50+' },
  { label: 'Filter Types', value: '12' },
  { label: 'AI Model', value: 'Granite' },
  { label: 'Standards', value: 'IEC/IEEE' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Home() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '1100px', margin: '0 auto' }}
    >
      {/* Hero */}
      <motion.div
        variants={itemVariants}
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
        }}
      >
        {/* Decorative waveform */}
        <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.15 }}>
          <WaveformDecoration />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <MdWaves size={28} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7 }}>
                IBM watsonx.ai · Powered by IBM Granite
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, lineHeight: 1.2 }}>
                Audio Signal Processing
                <br />
                <span style={{ background: 'linear-gradient(90deg, #93c5fd, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Assistant Agent
                </span>
              </h1>
            </div>
          </div>

          <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: '600px', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            AI-powered engineering assistant for Electronics &amp; Telecommunications students and professionals.
            Design audio circuits, analyze filters, and optimize signal processing pipelines.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/assistant" className="btn-primary" style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}>
              <MdChat size={16} /> Start with AI Assistant
            </Link>
            <Link to="/filter-analysis" className="btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent' }}>
              Explore Tools <MdArrowForward size={16} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
        className="stats-grid"
      >
        {stats.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Feature Cards */}
      <motion.div variants={itemVariants} style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
          Engineering Tools
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
          Professional-grade audio circuit design and analysis tools
        </p>
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {features.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.path}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link to={f.path} style={{ textDecoration: 'none', display: 'block' }}>
                <div className="card" style={{ height: '100%', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.875rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      backgroundColor: `${f.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} color={f.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{f.title}</span>
                        <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{f.badge}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: f.color, fontSize: '0.8rem', fontWeight: 500 }}>
                    Open Tool <MdArrowForward size={14} />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* IBM Cloud banner */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1rem',
        }}
        className="bottom-grid"
      >
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--bg-secondary))', borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <MdElectricBolt size={24} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>IBM Cloud Lite Ready</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Deployable on IBM Cloud Lite with zero cost. Configure your watsonx.ai credentials in Settings to unlock full IBM Granite AI capabilities.
          </p>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <MdSchool size={24} color="#8b5cf6" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>For Engineers</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Built for ECE/Telecom students and professionals. Covers audio circuits, signal theory, component selection, and industry-standard design practices.
          </p>
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}

function WaveformDecoration() {
  const heights = [20, 35, 55, 70, 90, 75, 60, 80, 95, 65, 45, 70, 85, 50, 30]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 120 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            width: 8, height: h,
            backgroundColor: 'white',
            animationDelay: `${i * 0.06}s`,
            animationDuration: `${0.8 + (i % 3) * 0.3}s`,
          }}
        />
      ))}
    </div>
  )
}
