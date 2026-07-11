import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdHome, MdChat, MdBuild, MdFilterAlt, MdTune,
  MdGraphicEq, MdShowChart, MdBookmark, MdSettings,
  MdClose, MdWaves,
} from 'react-icons/md'

const navGroups = [
  {
    label: 'Main',
    items: [
      { path: '/', label: 'Home', icon: MdHome },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/assistant',                label: 'AI Assistant',              icon: MdChat },
      { path: '/circuit-troubleshooter',   label: 'Circuit Troubleshooter',    icon: MdBuild },
      { path: '/filter-designer',          label: 'Filter Designer',           icon: MdFilterAlt },
      { path: '/amplifier',                label: 'Amplifier Designer',        icon: MdTune },
      { path: '/audio-analyzer',           label: 'Audio Analyzer',            icon: MdGraphicEq },
      { path: '/frequency-response',       label: 'Frequency Response Plotter',icon: MdShowChart },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { path: '/saved-projects', label: 'Saved Projects', icon: MdBookmark },
      { path: '/settings',       label: 'Settings',       icon: MdSettings },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '260px',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        <SidebarContent location={location} onClose={onClose} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 40,
              }}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0,
                width: '260px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <SidebarContent location={location} onClose={onClose} showClose />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </>
  )
}

function SidebarContent({ location, onClose, showClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand header */}
      <div style={{
        padding: '1.125rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MdWaves color="white" size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>ASPA</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Signal Processing AI</div>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '6px',
            }}
          >
            <MdClose size={20} />
          </button>
        )}
      </div>

      {/* Navigation groups */}
      <nav style={{ flex: 1, padding: '0.625rem 0.75rem', overflowY: 'auto' }}>
        {navGroups.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < navGroups.length - 1 ? '0.25rem' : 0 }}>

            {/* Group label */}
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '0.625rem 0.625rem 0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
            }}>
              {group.label}
            </div>

            {/* Items */}
            {group.items.map(item => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <motion.div
                  key={item.path}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.12 }}
                >
                  <Link
                    to={item.path}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6875rem',
                      padding: '0.5rem 0.625rem',
                      borderRadius: '8px',
                      marginBottom: '0.125rem',
                      textDecoration: 'none',
                      backgroundColor: active ? 'var(--accent-light)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.845rem',
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    {/* Icon container */}
                    <span style={{
                      width: 28, height: 28, borderRadius: '7px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      backgroundColor: active ? 'var(--accent)' : 'var(--bg-tertiary)',
                      transition: 'background-color 0.15s ease',
                    }}>
                      <Icon
                        size={15}
                        color={active ? '#ffffff' : 'var(--text-muted)'}
                      />
                    </span>
                    <span style={{ lineHeight: 1.3 }}>{item.label}</span>

                    {/* Active indicator dot */}
                    {active && (
                      <span style={{
                        marginLeft: 'auto', width: 6, height: 6,
                        borderRadius: '50%', backgroundColor: 'var(--accent)',
                        flexShrink: 0,
                      }} />
                    )}
                  </Link>
                </motion.div>
              )
            })}

            {/* Divider between groups */}
            {gi < navGroups.length - 1 && (
              <div style={{
                height: '1px',
                backgroundColor: 'var(--border)',
                margin: '0.5rem 0.25rem 0.25rem',
              }} />
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Powered by IBM Granite</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>watsonx.ai · IBM Cloud Lite</div>
      </div>

    </div>
  )
}
