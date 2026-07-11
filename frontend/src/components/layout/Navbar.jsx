import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MdMenu, MdDarkMode, MdLightMode, MdSettings, MdWaves } from 'react-icons/md'
import { useTheme } from '../../context/ThemeContext'


const breadcrumbs = {
  '/': 'Home',
  '/assistant':              'AI Assistant',
  '/circuit-troubleshooter': 'Circuit Troubleshooter',
  '/filter-designer':        'Filter Designer',
  '/amplifier':              'Amplifier Designer',
  '/audio-analyzer':         'Audio Analyzer',
  '/frequency-response':     'Frequency Response Plotter',
  '/saved-projects':         'Saved Projects',
  '/settings':               'Settings',
  '/about':                  'About',
}

export default function Navbar({ onMenuClick }) {
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()

  const currentPage = breadcrumbs[location.pathname] || 'ASPA'

  return (
    <>
      <header style={{
        height: '60px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>
        {/* Menu button (mobile) */}
        <button
          onClick={onMenuClick}
          className="mobile-menu-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: '0.375rem',
            borderRadius: '8px', display: 'none',
          }}
        >
          <MdMenu size={22} />
        </button>

        {/* Mobile logo */}
        <div className="mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '0.5rem' }}>
          <MdWaves size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>ASPA</span>
        </div>

        {/* Breadcrumb */}
        <div className="desktop-breadcrumb" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>ASPA</Link>
          </span>
          {location.pathname !== '/' && (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentPage}
              </span>
            </>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {/* IBM Badge */}
          <div className="desktop-badge" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--accent-light)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--accent)',
          }}>
            <div className="pulse-dot" style={{ width: 6, height: 6 }} />
            IBM Granite
          </div>

          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            style={{
              background: 'none', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-secondary)',
              padding: '0.4rem', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--bg-primary)',
            }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
          </motion.button>


        </div>
      </header>



      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .mobile-logo { display: flex !important; }
          .desktop-breadcrumb { display: none !important; }
          .desktop-badge { display: none !important; }
        }
      `}</style>
    </>
  )
}
