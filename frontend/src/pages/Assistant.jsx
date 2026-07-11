import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdSend, MdDeleteOutline, MdSmartToy, MdPerson, MdContentCopy,
  MdCheck, MdChat, MdTipsAndUpdates, MdSettings
} from 'react-icons/md'
import { useChat } from '../context/ChatContext'
import { Link } from 'react-router-dom'

const QUICK_PROMPTS = [
  'Design a 1kHz Butterworth low-pass filter',
  'Calculate gain for a non-inverting op-amp with R1=1kΩ, Rf=47kΩ',
  'Explain Class-D amplifier operation',
  'Design a 3-band parametric equalizer',
  'Calculate thermal noise for 10kΩ resistor at 20kHz bandwidth',
  'What op-amp should I use for a microphone preamplifier?',
]

export default function Assistant() {
  const { messages, isLoading, sendMessage, clearChat } = useChat()
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyMessage = (id, content) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }



  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem',
        }}
      >
        <div>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdSmartToy size={24} color="var(--accent)" />
            AI Assistant
          </h1>
          <p className="section-subtitle">Powered by IBM Granite via watsonx.ai</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div className="pulse-dot" style={{ width: 6, height: 6, backgroundColor: 'var(--success)' }} />
            Connected to watsonx.ai
          </div>
          <button
            className="btn-secondary"
            onClick={clearChat}
            style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }}
          >
            <MdDeleteOutline size={15} /> Clear
          </button>
        </div>
      </motion.div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflow: 'hidden',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Avatar + name */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  marginBottom: '0.3rem',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {msg.role === 'user'
                      ? <MdPerson size={14} color="white" />
                      : <MdSmartToy size={14} color="var(--accent)" />
                    }
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {msg.role === 'user' ? 'You' : 'ASPA (IBM Granite)'}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div style={{ position: 'relative', maxWidth: '85%', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ flex: 1 }}>
                    <FormattedMessage content={msg.content} />
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '0.375rem',
                        borderRadius: '6px', flexShrink: 0, marginTop: '0.25rem',
                        opacity: 0.6,
                      }}
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <MdCheck size={14} color="var(--success)" /> : <MdContentCopy size={14} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MdSmartToy size={14} color="var(--accent)" />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ASPA is thinking...</span>
              </div>
              <div className="chat-bubble-ai" style={{ display: 'flex', gap: '4px', padding: '0.625rem 0.875rem' }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <MdTipsAndUpdates size={12} /> Quick prompts
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); inputRef.current?.focus() }}
                  style={{
                    fontSize: '0.72rem', padding: '0.25rem 0.6rem',
                    borderRadius: '9999px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, color 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: '0.625rem', alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about filters, amplifiers, circuit design... (Enter to send, Shift+Enter for new line)"
              rows={1}
              style={{
                width: '100%', resize: 'none',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: '120px',
                overflowY: 'auto',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="btn-primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0.625rem',
              borderRadius: '10px',
              opacity: (!input.trim() || isLoading) ? 0.5 : 1,
              minWidth: 42,
              justifyContent: 'center',
            }}
          >
            <MdSend size={18} />
          </motion.button>
        </div>
      </div>


    </div>
  )
}

function FormattedMessage({ content }) {
  const lines = content.split('\n')
  return (
    <div style={{ lineHeight: 1.65 }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <div key={i} style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0.5rem 0 0.25rem', color: 'var(--accent)' }}>{line.slice(3)}</div>
        }
        if (line.startsWith('### ')) {
          return <div key={i} style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0.4rem 0 0.2rem' }}>{line.slice(4)}</div>
        }
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <div key={i} style={{ fontWeight: 600 }}>{line.slice(2, -2)}</div>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <div key={i} style={{ paddingLeft: '1rem', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.25rem', color: 'var(--accent)' }}>•</span>
            <InlineFormat text={line.slice(2)} />
          </div>
        }
        if (line.startsWith('`') && line.endsWith('`') && line.length > 2) {
          return <code key={i} style={{
            display: 'block', padding: '0.4rem 0.75rem', margin: '0.35rem 0',
            backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px',
            fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem',
            color: 'var(--accent)', border: '1px solid var(--border)',
          }}>{line.slice(1, -1)}</code>
        }
        if (line.includes('|') && line.startsWith('|')) {
          return <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0.1rem 0' }}>{line}</div>
        }
        if (line === '') return <div key={i} style={{ height: '0.4rem' }} />
        return <div key={i}><InlineFormat text={line} /></div>
      })}
    </div>
  )
}

function InlineFormat({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{
            backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.35rem',
            borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.82rem',
            color: 'var(--accent)',
          }}>{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
