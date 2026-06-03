const TABS = [
  { id: 'all',       label: 'TOUS' },
  { id: 'ai_product', label: 'IA' },
  { id: 'ux_product', label: 'UX' },
  { id: 'tech',       label: 'TECH' },
  { id: 'hardware',   label: 'HW' },
  { id: 'video',      label: 'VIDÉO' },
]

export default function TabFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 16px 6px', overflowX: 'auto' }}>
      {TABS.map(tab => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
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
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
