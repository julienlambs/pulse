import { useTheme } from '@declic/ui'

const BTN = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 18,
  cursor: 'pointer',
  padding: '6px 8px',
  borderRadius: 8,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default function Header({ onSavedClick, onAdminClick }) {
  const { mode, toggleMode } = useTheme()

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 40,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 4,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
        fontSize: 22,
        color: 'var(--accent)',
        flex: 1,
        letterSpacing: '-0.01em',
      }}>
        Pulse
      </span>

      <button onClick={onSavedClick} style={BTN} aria-label="Sauvegardés">🔖</button>
      <button onClick={toggleMode} style={BTN} aria-label="Thème">
        {mode === 'dark' ? '☀' : '☾'}
      </button>
      <button onClick={onAdminClick} style={BTN} aria-label="Admin">⚙</button>
    </header>
  )
}
