import { useState } from 'react'

const INPUT = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: 15,
  width: '100%',
  outline: 'none',
  fontFamily: 'JetBrains Mono, monospace',
}

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!r.ok) { setError('Mot de passe incorrect'); return }
      const { token } = await r.json()
      localStorage.setItem('pulse_token', token)
      onLogin(token)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      padding: '0 32px',
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
        fontSize: 36,
        color: 'var(--accent)',
        marginBottom: 8,
      }}>
        Pulse
      </span>

      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: 'var(--muted)',
        marginBottom: 40,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Admin
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={INPUT}
          autoFocus
        />

        {error && (
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--hi)', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!password || loading}
          style={{
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: password && !loading ? 'var(--accent)' : 'var(--border)',
            color: password && !loading ? '#fff' : 'var(--muted)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace',
            cursor: password && !loading ? 'pointer' : 'default',
            transition: 'all 0.12s',
          }}
        >
          {loading ? '…' : 'Entrer'}
        </button>
      </form>
    </div>
  )
}
