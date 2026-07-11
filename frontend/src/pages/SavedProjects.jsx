import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdBookmark, MdAdd, MdDelete, MdEdit, MdCheck, MdClose, MdFileDownload, MdFolderOpen } from 'react-icons/md'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'aspa-saved-projects'

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

const DEFAULT_PROJECTS = [
  {
    id: 1, name: 'Mic Preamp — INA217',
    tool: 'Circuit Designer', path: '/circuit-designer',
    color: '#3b82f6',
    notes: '40 dB gain, ±15V supply, XLR balanced input. Phantom power via 6.81 kΩ resistors.',
    params: { gain: '40 dB', fc: 'N/A', topology: 'Instrumentation Amp', opamp: 'INA217' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2, name: 'Butterworth LPF 3 kHz',
    tool: 'Filter Designer', path: '/filter-designer',
    color: '#8b5cf6',
    notes: '2nd-order Butterworth low-pass for anti-aliasing before ADC. Sallen-Key topology with NE5532.',
    params: { type: 'Low-Pass', fc: '3 kHz', order: '2', approx: 'Butterworth', rolloff: '40 dB/dec' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 3, name: '5-Band Parametric EQ',
    tool: 'Equalizer', path: '/equalizer',
    color: '#22c55e',
    notes: 'Broadcast preset. +6 dB @ 80 Hz low shelf, +4 dB vocal boost @ 1 kHz, +2 dB air @ 12 kHz.',
    params: { bands: '5', preset: 'Broadcast', supply: '±15V', opamp: 'TL072' },
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

const toolColors = {
  'AI Assistant':               '#3b82f6',
  'Circuit Troubleshooter':     '#f59e0b',
  'Filter Designer':            '#8b5cf6',
  'Amplifier Designer':         '#06b6d4',
  'Audio Analyzer':             '#22c55e',
  'Frequency Response Plotter': '#ef4444',
  'Equalizer':                  '#f97316',
  'Circuit Designer':           '#3b82f6',
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

export default function SavedProjects() {
  const [projects, setProjects] = useState(() => {
    const stored = loadProjects()
    return stored.length ? stored : DEFAULT_PROJECTS
  })
  const [editingId, setEditingId]   = useState(null)
  const [editName,  setEditName]    = useState('')
  const [editNotes, setEditNotes]   = useState('')
  const [showNew,   setShowNew]     = useState(false)
  const [newName,   setNewName]     = useState('')
  const [newTool,   setNewTool]     = useState('Filter Designer')
  const [newNotes,  setNewNotes]    = useState('')
  const [search,    setSearch]      = useState('')
  const [filterTool, setFilterTool] = useState('All')

  useEffect(() => { saveProjects(projects) }, [projects])

  const tools = ['All', ...Object.keys(toolColors)]

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.notes.toLowerCase().includes(search.toLowerCase())
    const matchTool   = filterTool === 'All' || p.tool === filterTool
    return matchSearch && matchTool
  })

  const addProject = () => {
    if (!newName.trim()) return
    const id = Date.now()
    const color = toolColors[newTool] || '#3b82f6'
    const pathMap = {
      'Filter Designer':            '/filter-designer',
      'Amplifier Designer':         '/amplifier',
      'Circuit Designer':           '/circuit-designer',
      'Equalizer':                  '/equalizer',
      'Audio Analyzer':             '/audio-analyzer',
      'Frequency Response Plotter': '/frequency-response',
      'Circuit Troubleshooter':     '/circuit-troubleshooter',
      'AI Assistant':               '/assistant',
    }
    setProjects(prev => [...prev, {
      id, name: newName.trim(), tool: newTool,
      path: pathMap[newTool] || '/',
      color, notes: newNotes.trim(),
      params: {}, createdAt: new Date().toISOString(),
    }])
    setNewName(''); setNewNotes(''); setShowNew(false)
  }

  const deleteProject = (id) => setProjects(prev => prev.filter(p => p.id !== id))

  const startEdit = (p) => { setEditingId(p.id); setEditName(p.name); setEditNotes(p.notes) }
  const saveEdit  = (id) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName, notes: editNotes } : p))
    setEditingId(null)
  }

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'aspa-projects.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible"
      style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdBookmark size={24} color="var(--accent)" /> Saved Projects
          </h1>
          <p className="section-subtitle">Save and manage your circuit designs, filter specs, and EQ configurations</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={exportAll} style={{ fontSize: '0.8rem' }}>
            <MdFileDownload size={15} /> Export JSON
          </button>
          <button className="btn-primary" onClick={() => setShowNew(true)} style={{ fontSize: '0.8rem' }}>
            <MdAdd size={15} /> New Project
          </button>
        </div>
      </motion.div>

      {/* Search + filter bar */}
      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        <input
          className="input-field"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260, fontSize: '0.8rem' }}
        />
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {tools.slice(0, 6).map(t => (
            <button key={t} onClick={() => setFilterTool(t)} style={{
              padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.72rem',
              border: '1px solid',
              borderColor: filterTool === t ? 'var(--accent)' : 'var(--border)',
              backgroundColor: filterTool === t ? 'var(--accent-light)' : 'transparent',
              color: filterTool === t ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: filterTool === t ? 600 : 400, transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          {filtered.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* New project form */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="card"
            style={{ marginBottom: '1.25rem', borderColor: 'var(--accent)' }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>New Project</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }} className="new-proj-grid">
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Project Name</label>
                <input className="input-field" placeholder="e.g. 2nd-order HPF 200 Hz" value={newName}
                  onChange={e => setNewName(e.target.value)} style={{ fontSize: '0.8rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Tool</label>
                <select className="input-field" value={newTool} onChange={e => setNewTool(e.target.value)} style={{ fontSize: '0.8rem' }}>
                  {Object.keys(toolColors).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
              <textarea className="input-field" rows={2} placeholder="Design notes, component values, specs..."
                value={newNotes} onChange={e => setNewNotes(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.8rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowNew(false)} style={{ fontSize: '0.8rem' }}>Cancel</button>
              <button className="btn-primary" onClick={addProject} style={{ fontSize: '0.8rem' }} disabled={!newName.trim()}>
                <MdAdd size={14} /> Save Project
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <MdBookmark size={44} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
          <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            {search || filterTool !== 'All' ? 'No projects match your filter' : 'No saved projects yet'}
          </div>
          <div style={{ fontSize: '0.8rem' }}>Click <strong>New Project</strong> to save a design</div>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
          <AnimatePresence>
            {filtered.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                whileHover={{ y: -3 }}
                className="card"
                style={{ borderLeft: `4px solid ${p.color}`, position: 'relative' }}
              >
                {editingId === p.id ? (
                  /* Edit mode */
                  <div>
                    <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)}
                      style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }} />
                    <textarea className="input-field" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      style={{ fontSize: '0.775rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.775rem' }}>
                        <MdClose size={13} /> Cancel
                      </button>
                      <button className="btn-primary" onClick={() => saveEdit(p.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.775rem' }}>
                        <MdCheck size={13} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.25rem' }}>{p.name}</div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.15rem 0.55rem', borderRadius: '9999px',
                          backgroundColor: `${p.color}20`, color: p.color,
                          fontSize: '0.68rem', fontWeight: 600,
                        }}>
                          {p.tool}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button onClick={() => startEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                          <MdEdit size={15} />
                        </button>
                        <button onClick={() => deleteProject(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.25rem' }}>
                          <MdDelete size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      {p.notes || <em style={{ color: 'var(--text-muted)' }}>No notes</em>}
                    </p>

                    {/* Params */}
                    {Object.keys(p.params).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {Object.entries(p.params).slice(0, 4).map(([k, v]) => (
                          <span key={k} style={{
                            padding: '0.15rem 0.5rem', borderRadius: '6px',
                            backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                            fontSize: '0.68rem', color: 'var(--text-secondary)',
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>{k}:</span> {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.625rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      <Link to={p.path} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: p.color, textDecoration: 'none' }}>
                        <MdFolderOpen size={14} /> Open Tool
                      </Link>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @media (max-width: 480px) { .new-proj-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </motion.div>
  )
}
