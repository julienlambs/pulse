import { useState } from 'react'
import { Btn, Field } from '@declic/ui'

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
      if (r.status === 429) {
        const minutes = Math.max(1, Math.ceil(Number(r.headers.get('Retry-After') || 60) / 60))
        setError(`Trop de tentatives. Réessaie dans ${minutes} min.`)
        return
      }
      if (!r.ok) { setError('Mot de passe incorrect'); return }
      const { token } = await r.json()
      localStorage.setItem('pulse_token', token)
      onLogin(token)
    } catch {
      setError('Erreur réseau : vérifie la connexion et réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="connexion">
      <h1 className="h-page">Pulse</h1>
      <p className="connexion-sous">Ta veille tech, au même endroit.</p>

      <form onSubmit={handleSubmit} className="connexion-form">
        <Field
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(null) }}
          error={error}
          autoFocus
        />
        <Btn type="submit" full disabled={!password} loading={loading}>Entrer</Btn>
      </form>
    </main>
  )
}
