const SIZES = [
  { label: 'S', value: 14 },
  { label: 'M', value: 16 },
  { label: 'L', value: 19 },
]

export default function FontSizePicker({ value, onChange, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 60,
          animation: 'leeroy-fadeIn 0.15s ease',
        }}
      />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 61,
          background: 'var(--card)',
          borderRadius: '20px 20px 0 0',
          padding: '0 20px 40px',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
          animation: 'leeroy-slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 20px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
        </div>

        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          margin: '0 0 16px',
        }}>
          Taille du texte
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {SIZES.map(s => {
            const active = s.value === value
            return (
              <button
                key={s.label}
                onClick={() => onChange(s.value)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 10,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: s.value,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
