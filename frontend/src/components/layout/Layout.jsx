import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar onMenuClick={() => setSidebarOpen(p => !p)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', maxWidth: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
