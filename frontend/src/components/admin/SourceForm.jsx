import { useState } from 'react'
import { apiFetch } from '../../lib/api'

const TYPES = ['rss', 'reddit', 'bluesky', 'youtube']
const TABS  = [
  { id: 'ai_product', label: 'IA Produit/PM' },
  { id: 'ux_product', label: 'UX & Product' },
  { id: 'tech',       label: 'Tech général' },
  { id: 'hardware',   label: 'Hardware & Actu' },
  { id: 'video',      label: 'Vidéo' },
]
const LANGS = [
  { id: 'all', label: 'Tous' },
  { id: 'fr',  label: 'FR' },
  { id: 'en',  label: 'EN' },
]

const INPUT = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  fontFamily: 'JetBrains Mono, monospace',
  boxSizing: 'border-box',
}

const LABEL = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 4,
  display: 'block',
}

export default function SourceForm({ source, token, onSave, onClose }) {
  const isEdit = !!source
  const [form, setForm] = useState({
    name:        source?.name        || '',
    type:        source?.type        || 'rss',
    url:         source?.url         || '',
    tab:         source?.tab         || 'ai_product',
    keywords:         source?.keywords         ? JSON.parse(source.keywords).join(', ')         : '',
    exclude_keywords: source?.exclude_keywords ? JSON.parse(source.exclude_keywords).join(', ') : '',
    lang_filter:      source?.lang_filter      || 'all',
  })
  const [saving, setSaving]       = useState(false)
  const [testing, setTesting]     = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError]         = useState(null)

  const canSave = form.name && form.url && !saving

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
    setTestResult(null)
  }

  async function handleTest() {
    if (!form.url) return
    setTesting(true)
    setTestResult(null)
    setError(null)
    try {
      if (isEdit) {
        // Fetch immédiat sur la source existante
        const r = await apiFetch(`/api/sources/${source.id}/fetch`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await r.json()
        setTestResult(data.error ? `Erreur : ${data.error}` : `${data.count} nouveaux articles`)
      } else {
        // Créer temporairement et tester — on teste en créant une source temporaire
        const r = await apiFetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: form.name || 'test',
            type: form.type,
            url: form.url,
            tab: form.tab,
            lang_filter: form.lang_filter,
          }),
        })
        const newSrc = await r.json()
        const fr = await apiFetch(`/api/sources/${newSrc.id}/fetch`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const fd = await fr.json()
        setTestResult(fd.error ? `Erreur : ${fd.error}` : `${fd.count} articles trouvés`)
        // Supprimer la source temporaire
        await apiFetch(`/api/sources/${newSrc.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch {
      setTestResult('Erreur réseau')
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        type: form.type,
        url: form.url,
        tab: form.tab,
        lang_filter: form.lang_filter,
        keywords: form.keywords
          ? JSON.stringify(form.keywords.split(',').map(k => k.trim()).filter(Boolean))
          : null,
        exclude_keywords: form.exclude_keywords
          ? JSON.stringify(form.exclude_keywords.split(',').map(k => k.trim()).filter(Boolean))
          : null,
      }
      const url = isEdit ? `/api/sources/${source.id}` : '/api/sources'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error()
      const saved = await r.json()
      onSave(saved)
    } catch {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, animation: 'leeroy-fadeIn 0.15s ease' }}
      />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 61,
          background: 'var(--card)',
          borderRadius: '20px 20px 0 0',
          padding: '0 20px 40px',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.5)',
          animation: 'leeroy-slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 16px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
        </div>

        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 20px' }}>
          {isEdit ? 'Modifier la source' : 'Ajouter une source'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span style={LABEL}>Nom</span>
            <input style={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex : Lenny's Newsletter" />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <span style={LABEL}>Type</span>
              <select style={{ ...INPUT }} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <span style={LABEL}>Langue</span>
              <select style={{ ...INPUT }} value={form.lang_filter} onChange={e => set('lang_filter', e.target.value)}>
                {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <span style={LABEL}>URL ou handle</span>
            <input style={INPUT} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://... ou handle.bsky.social" />
          </div>

          <div>
            <span style={LABEL}>Onglet de destination</span>
            <select style={{ ...INPUT }} value={form.tab} onChange={e => set('tab', e.target.value)}>
              {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <span style={LABEL}>Mots-clés à inclure (optionnel, séparés par virgules)</span>
            <input style={INPUT} value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="Ex : IA, product, design" />
          </div>

          <div>
            <span style={LABEL}>Mots-clés à exclure (optionnel, séparés par virgules)</span>
            <input style={INPUT} value={form.exclude_keywords} onChange={e => set('exclude_keywords', e.target.value)} placeholder="Ex : bon plan, promo, soldes" />
          </div>

          {testResult && (
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              color: testResult.startsWith('Erreur') ? 'var(--hi)' : 'var(--lo)',
              margin: 0,
              padding: '8px 10px',
              background: 'var(--card-2)',
              borderRadius: 6,
            }}>
              {testResult}
            </p>
          )}

          {error && (
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--hi)', margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleTest}
              disabled={!form.url || testing}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: form.url && !testing ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 600,
                cursor: form.url && !testing ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {testing ? '…' : 'Tester'}
            </button>

            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                background: canSave ? 'var(--accent)' : 'var(--border)',
                color: canSave ? '#fff' : 'var(--muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 600,
                cursor: canSave ? 'pointer' : 'default',
                transition: 'all 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {saving ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
