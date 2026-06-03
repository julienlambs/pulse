import { useState, useRef, useEffect } from 'react'

const LANGS = [
  { id: 'all', label: 'TOUS' },
  { id: 'fr',  label: 'FR' },
  { id: 'en',  label: 'EN' },
]

const SOURCE_TYPES = [
  { id: 'rss',      label: 'RSS' },
  { id: 'reddit',   label: 'REDDIT' },
  { id: 'bluesky',  label: 'BLUESKY' },
  { id: 'youtube',  label: 'YOUTUBE' },
]

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 8,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        fontFamily: 'JetBrains Mono, monospace',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

export default function LangFilter({ lang, onLangChange, selectedTypes, onTypesChange, unreadOnly, onUnreadOnlyChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const extraActive = selectedTypes.size > 0 || unreadOnly

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [open])

  function toggleType(id) {
    const next = new Set(selectedTypes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onTypesChange(next)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px 6px', alignItems: 'center' }}>
        {LANGS.map(l => (
          <Chip key={l.id} active={lang === l.id} onClick={() => onLangChange(l.id)}>
            {l.label}
          </Chip>
        ))}

        <button
          onClick={() => setOpen(v => !v)}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            border: `1px solid ${extraActive ? 'var(--accent)' : 'var(--border)'}`,
            background: extraActive ? 'var(--accent-soft)' : 'transparent',
            color: extraActive ? 'var(--accent)' : 'var(--muted)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'all 0.12s',
            whiteSpace: 'nowrap',
          }}
        >
          {extraActive && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)', display: 'inline-block', flexShrink: 0,
            }} />
          )}
          FILTRES {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 12,
          zIndex: 50,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 14px 10px',
          minWidth: 220,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              marginBottom: 8,
            }}>TYPE</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SOURCE_TYPES.map(t => (
                <Chip key={t.id} active={selectedTypes.has(t.id)} onClick={() => toggleType(t.id)}>
                  {t.label}
                </Chip>
              ))}
            </div>
            {selectedTypes.size > 0 && (
              <button
                onClick={() => onTypesChange(new Set())}
                style={{
                  marginTop: 8,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: 0,
                  letterSpacing: '0.06em',
                }}
              >
                ✕ tout effacer
              </button>
            )}
          </div>

          <div>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              marginBottom: 8,
            }}>ÉTAT</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <Chip active={!unreadOnly} onClick={() => onUnreadOnlyChange(false)}>TOUS</Chip>
              <Chip active={unreadOnly}  onClick={() => onUnreadOnlyChange(true)}>NON LUS</Chip>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
