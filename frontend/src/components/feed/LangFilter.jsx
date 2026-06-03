const LANGS = [
  { id: 'all', label: 'TOUS' },
  { id: 'fr',  label: 'FR' },
  { id: 'en',  label: 'EN' },
]

export default function LangFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 16px 6px' }}>
      {LANGS.map(lang => {
        const active = lang.id === value
        return (
          <button
            key={lang.id}
            onClick={() => onChange(lang.id)}
            style={{
              padding: '4px 12px',
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
            }}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}
