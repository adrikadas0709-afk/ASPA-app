import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MdInfo, MdWaves, MdCloud, MdSchool, MdCode, MdOpenInNew,
  MdStar, MdShowChart, MdTune, MdEqualizer, MdCircle, MdChat
} from 'react-icons/md'

const techStack = [
  { name: 'React 19', category: 'Framework', color: '#61dafb', desc: 'UI component library' },
  { name: 'Vite 8', category: 'Build Tool', color: '#646cff', desc: 'Fast HMR dev server & bundler' },
  { name: 'Tailwind CSS 4', category: 'Styling', color: '#38bdf8', desc: 'Utility-first CSS framework' },
  { name: 'React Router 7', category: 'Routing', color: '#f44250', desc: 'Client-side navigation' },
  { name: 'Framer Motion 12', category: 'Animation', color: '#ff4d7e', desc: 'Physics-based animations' },
  { name: 'Recharts 3', category: 'Charts', color: '#22c55e', desc: 'Composable chart library' },
  { name: 'React Icons', category: 'Icons', color: '#f97316', desc: 'Comprehensive icon library' },
  { name: 'Axios', category: 'HTTP', color: '#5a29e4', desc: 'HTTP client for API calls' },
  { name: 'IBM Granite', category: 'AI Model', color: '#3b82f6', desc: 'Foundation model for engineering AI' },
  { name: 'IBM watsonx.ai', category: 'AI Platform', color: '#1f70c1', desc: 'Enterprise AI/ML platform' },
]

const pages = [
  { icon: MdChat, name: 'AI Assistant', path: '/assistant', desc: 'Chat with IBM Granite for circuit design help' },
  { icon: MdShowChart, name: 'Filter Analysis', path: '/filter-analysis', desc: 'Interactive Bode plot generator' },
  { icon: MdTune, name: 'Amplifier Designer', path: '/amplifier', desc: 'Gain and power calculator for all classes' },
  { icon: MdCircle, name: 'Circuit Designer', path: '/circuit-designer', desc: 'Preamp topologies and BOM generator' },
  { icon: MdEqualizer, name: 'Equalizer', path: '/equalizer', desc: 'Parametric multi-band EQ with curves' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function About() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Hero */}
      <motion.div variants={itemVariants} className="card" style={{
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MdWaves size={30} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>ASPA</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Audio Signal Processing Assistant Agent</div>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
          ASPA is an AI-powered engineering assistant for Electronics and Telecommunications Engineering students and professionals.
          It combines IBM Granite foundation models with specialized audio circuit design tools to provide expert-level guidance
          for designing, troubleshooting, and optimizing audio signal processing systems.
        </p>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span className="badge badge-blue">IBM Granite AI</span>
          <span className="badge badge-green">Open Source</span>
          <span className="badge badge-yellow">IBM Cloud Lite Compatible</span>
        </div>
      </motion.div>

      {/* IBM watsonx Integration */}
      <motion.div variants={itemVariants} className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #1f70c1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <MdCloud size={20} color="#1f70c1" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>IBM watsonx.ai Integration</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
          ASPA uses the <strong>IBM Granite 13B Chat v2</strong> model via IBM watsonx.ai's REST API. The AI assistant is
          pre-prompted as a specialized audio engineering expert, able to provide circuit calculations, component recommendations,
          and design guidance across all audio frequency and electronics domains.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} className="ibm-grid">
          {[
            { title: 'Model', value: 'granite-13b-chat-v2', icon: '🧠' },
            { title: 'Platform', value: 'IBM watsonx.ai', icon: '☁️' },
            { title: 'Deployment', value: 'IBM Cloud Lite', icon: '🆓' },
          ].map(i => (
            <div key={i.title} style={{ padding: '0.875rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{i.icon}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{i.title}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{i.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--accent-light)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--accent)' }}>
          💡 <strong>Getting Started:</strong> Sign up for free at{' '}
          <a href="https://cloud.ibm.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            cloud.ibm.com
          </a>{' '}
          and create a watsonx.ai project to obtain your Project ID and API Key.
        </div>
      </motion.div>

      {/* Features */}
      <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Application Pages
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {pages.map(p => {
            const Icon = p.icon
            return (
              <Link
                key={p.path}
                to={p.path}
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '9px',
                    backgroundColor: 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={18} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{p.desc}</div>
                  </div>
                  <MdOpenInNew size={14} color="var(--text-muted)" />
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MdCode size={18} color="var(--accent)" /> Technology Stack
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {techStack.map(t => (
            <div key={t.name} className="card" style={{ padding: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: t.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>{t.name}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: t.color, fontWeight: 500, marginBottom: '0.2rem' }}>{t.category}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Engineering scope */}
      <motion.div variants={itemVariants} className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <MdSchool size={20} color="#8b5cf6" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Engineering Scope</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="scope-grid">
          {[
            {
              title: 'Audio Circuits', color: '#3b82f6',
              items: ['Preamplifiers (mic, line, phono)', 'Power amplifiers (Class A/AB/B/D)', 'Headphone amplifiers', 'Buffer stages'],
            },
            {
              title: 'Signal Processing', color: '#8b5cf6',
              items: ['Active & passive filters', 'Parametric equalizers', 'Dynamic processors', 'Tone control circuits'],
            },
            {
              title: 'Analysis Tools', color: '#06b6d4',
              items: ['Frequency response (Bode plots)', 'SNR & noise floor calculations', 'THD+N estimation', 'Power & efficiency'],
            },
            {
              title: 'Standards & References', color: '#22c55e',
              items: ['IEC 61938 phantom power', 'AES standard levels', 'EIA-standard impedances', 'dBu/dBV/dBFS conversion'],
            },
          ].map(s => (
            <div key={s.title} style={{ padding: '0.875rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: s.color, marginBottom: '0.5rem' }}>{s.title}</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', listStyle: 'disc' }}>
                {s.items.map(i => (
                  <li key={i} style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer card */}
      <motion.div variants={itemVariants} style={{
        textAlign: 'center', padding: '1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MdStar size={14} color="var(--warning)" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ASPA — Audio Signal Processing Assistant Agent</span>
        </div>
        <p style={{ margin: 0 }}>
          Built for Electronics &amp; Telecommunications Engineering · Powered by IBM Granite on IBM watsonx.ai
          <br />
          Deploy for free on <a href="https://cloud.ibm.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>IBM Cloud Lite</a>
        </p>
      </motion.div>

      <style>{`
        @media (max-width: 600px) {
          .ibm-grid { grid-template-columns: 1fr !important; }
          .scope-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
