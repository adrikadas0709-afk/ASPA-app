import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MdSettings, MdVpnKey, MdCloud, MdColorLens, MdStorage,
  MdCheckCircle, MdSave, MdDeleteForever, MdInfo, MdWaves
} from 'react-icons/md'
import { useTheme } from '../context/ThemeContext'
import { useChat } from '../context/ChatContext'





const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const { clearChat } = useChat()

  const [cleared, setCleared] = useState(false)

  const handleClearStorage = () => {
    localStorage.removeItem('aspa-saved-projects')
    clearChat()
    setCleared(true)
    setTimeout(() => setCleared(false), 2500)
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ maxWidth: '800px', margin: '0 auto' }}>

      <motion.div variants={itemVariants}>
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MdSettings size={24} color="var(--accent)" /> Settings
        </h1>
        <p className="section-subtitle">Configure IBM watsonx.ai credentials, appearance, and application preferences</p>
      </motion.div>



      {/* Appearance */}
      <motion.div variants={itemVariants} className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdColorLens size={20} color="white" />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Appearance</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Theme</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Currently: <strong>{isDark ? 'Dark' : 'Light'}</strong> mode
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { label: '☀ Light', dark: false },
              { label: '🌙 Dark',  dark: true  },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => { if (isDark !== opt.dark) toggleTheme() }}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.8rem',
                  border: '1px solid',
                  borderColor: isDark === opt.dark ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: isDark === opt.dark ? 'var(--accent-light)' : 'transparent',
                  color: isDark === opt.dark ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: isDark === opt.dark ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
          Theme preference is saved to localStorage and respects your system preference on first launch.
        </div>
      </motion.div>

      {/* About app */}
      <motion.div variants={itemVariants} className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdWaves size={20} color="white" />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>About ASPA</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }} className="about-grid">
          {[
            { label: 'Application',  value: 'ASPA v1.0' },
            { label: 'AI Model',     value: 'Granite' },
            { label: 'Platform',     value: 'IBM watsonx.ai' },
            { label: 'Framework',    value: 'React 19 + Vite 8' },
            { label: 'Charts',       value: 'Recharts 3' },
            { label: 'Deployment',   value: 'IBM Cloud Lite' },
          ].map(i => (
            <div key={i.label} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{i.label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{i.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={itemVariants} className="card" style={{ borderColor: 'var(--error)', borderWidth: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdStorage size={20} color="var(--error)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--error)' }}>Data Management</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Clear stored credentials and application data</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Clear all application data</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Removes API credentials, chat history, and saved projects from localStorage
            </div>
          </div>
          <button
            onClick={handleClearStorage}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1.25rem', borderRadius: '8px',
              border: '1px solid var(--error)', background: 'none',
              color: cleared ? 'var(--success)' : 'var(--error)',
              cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600,
              borderColor: cleared ? 'var(--success)' : 'var(--error)',
              transition: 'all 0.2s',
            }}
          >
            {cleared
              ? <><MdCheckCircle size={16} /> Cleared!</>
              : <><MdDeleteForever size={16} /> Clear Data</>
            }
          </button>
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 600px) {
          .creds-grid  { grid-template-columns: 1fr !important; }
          .about-grid  { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}
