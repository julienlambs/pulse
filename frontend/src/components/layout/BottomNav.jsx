const TABS = [
  { id: 'ai_product', label: 'IA',      icon: '✦' },
  { id: 'ux_product', label: 'UX',      icon: '◈' },
  { id: 'tech',       label: 'Tech',    icon: '◷' },
  { id: 'hardware',   label: 'HW',      icon: '◎' },
  { id: 'video',      label: 'Vidéo',   icon: '▶' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 40,
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      height: 60,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? 'var(--accent)' : 'var(--muted)',
              transition: 'color 0.12s',
              padding: '8px 0',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
