import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'
import SourceCard from './SourceCard'
import SourceForm from './SourceForm'

export default function AdminPage({ token, onBack, onLogout }) {
  const [sources, setSources]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSource, setEditSource] = useState(null)

  useEffect(() => {
    loadSources()
  }, [])

  async function loadSources() {
    setLoading(true)
    try {
      const r = await apiFetch('/api/sources')
      setSources(await r.json())
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id) {
    const r = await apiFetch(`/api/sources/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (r.status === 401) { onLogout(); return }
    const updated = await r.json()
    setSources(prev => prev.map(s => s.id === id ? updated : s))
  }

  async function handleFetch(id) {
    const r = await apiFetch(`/api/sources/${id}/fetch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (r.status === 401) { onLogout(); return 0 }
    const data = await r.json()
    setSources(prev => prev.map(s => s.id === id ? { ...s, last_fetched_at: new Date().toISOString(), last_fetch_count: data.count, last_fetch_error: data.error } : s))
    return data.count
  }

  async function handleDelete(id) {
    const r = await apiFetch(`/api/sources/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (r.status === 401) { onLogout(); return }
    setSources(prev => prev.filter(s => s.id !== id))
  }

  function handleEdit(source) {
    setEditSource(source)
    setShowForm(true)
  }

  function handleFormSave(savedSource) {
    setSources(prev => {
      const exists = prev.find(s => s.id === savedSource.id)
      return exists ? prev.map(s => s.id === savedSource.id ? savedSource : s) : [savedSource, ...prev]
    })
    setShowForm(false)
    setEditSource(null)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditSource(null)
  }

  const grouped = ['ai_product', 'ux_product', 'tech', 'hardware', 'video'].reduce((acc, tab) => {
    acc[tab] = sources.filter(s => s.tab === tab)
    return acc
  }, {})

  const TAB_LABELS = { ai_product: 'IA Produit/PM', ux_product: 'UX & Product', tech: 'Tech', hardware: 'Hardware', video: 'Vidéo' }

  return (
    <div style={{ minHeight: '100%', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 8px', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', padding: '4px', lineHeight: 1 }}
        >
          ←
        </button>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 18, color: 'var(--text)', flex: 1 }}>
          Admin
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 6,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
        }}>
          {sources.length} sources
        </span>
        <button
          onClick={onLogout}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          Déconnexion
        </button>
      </div>

      {/* Liste par onglet */}
      <div style={{ padding: '8px 12px 0' }}>
        {loading ? (
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--muted)', textAlign: 'center', paddingTop: 32 }}>
            Chargement…
          </p>
        ) : (
          Object.entries(grouped).map(([tab, tabSources]) => (
            tabSources.length > 0 && (
              <div key={tab} style={{ marginBottom: 24 }}>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  margin: '0 0 10px 4px',
                }}>
                  {TAB_LABELS[tab]}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tabSources.map(source => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onFetch={handleFetch}
                    />
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditSource(null); setShowForm(true) }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          color: '#fff',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(96,80,220,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          WebkitTapHighlightColor: 'transparent',
          zIndex: 30,
        }}
      >
        +
      </button>

      {showForm && (
        <SourceForm
          source={editSource}
          token={token}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
