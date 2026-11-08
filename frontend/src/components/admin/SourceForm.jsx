import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Banniere, Btn, Field, Reveal, SelectField, useSurface } from '@declic/ui'
import { apiFetch } from '../../lib/api'

const TYPES = ['rss', 'reddit', 'bluesky', 'youtube']
const TYPE_LABELS = { rss: 'RSS', reddit: 'Reddit', bluesky: 'Bluesky', youtube: 'YouTube' }
const TABS  = [
  { id: 'ai_product', label: 'IA Produit' },
  { id: 'ux_product', label: 'UX & Produit' },
  { id: 'tech',       label: 'Tech' },
  { id: 'hardware',   label: 'Hardware' },
  { id: 'video',      label: 'Vidéo' },
]
const LANGS = [
  { id: 'all', label: 'Tous' },
  { id: 'fr',  label: 'FR' },
  { id: 'en',  label: 'EN' },
]

export default function SourceForm({ open, source, token, onSave, onClose }) {
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
  const premier = useRef(null)
  useSurface(open, onClose, premier)

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
        setTestResult(data.error ? `Erreur : ${data.error}` : `${data.count} nouveaux articles`)
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
        setTestResult(fd.error ? `Erreur : ${fd.error}` : `${fd.count} articles trouvés`)
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

  const testErreur = testResult?.startsWith('Erreur')

  return createPortal(
    <>
      <div className={`scrim${open ? ' open' : ''}`} onClick={onClose} />
      <div className="surface-bas">
        <Reveal open={open} className="surface-bas-in">
          <div className="sheet cs acc cut" role="dialog" aria-modal="true" aria-labelledby="source-t"><div className="in cut2 sheet-defile">
            <div className="grab cut" />
            <h2 className="h-card" id="source-t">{isEdit ? 'Modifier la source' : 'Ajouter une source'}</h2>

            <form className="source-form" onSubmit={e => { e.preventDefault(); handleSave() }}>
              <Field label="Nom" value={form.name} onChange={e => set('name', e.target.value)} />

              <div className="source-form-ligne">
                <SelectField id="source-type" label="Type" value={form.type} onChange={e => set('type', e.target.value)} data-menu="">
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </SelectField>
                <SelectField id="source-langue" label="Langue" value={form.lang_filter} onChange={e => set('lang_filter', e.target.value)} data-menu="">
                  {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </SelectField>
              </div>

              <Field label="URL ou handle" inputMode="url" value={form.url} onChange={e => set('url', e.target.value)}
                help="Ex. : https://…/feed ou handle.bsky.social" />

              <SelectField id="source-onglet" label="Onglet de destination" value={form.tab} onChange={e => set('tab', e.target.value)} data-menu="">
                {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </SelectField>

              <Field label="Mots-clés à inclure" value={form.keywords} onChange={e => set('keywords', e.target.value)}
                help="Facultatif, séparés par des virgules. Ex. : IA, product, design" />
              <Field label="Mots-clés à exclure" value={form.exclude_keywords} onChange={e => set('exclude_keywords', e.target.value)}
                help="Facultatif, séparés par des virgules. Ex. : bon plan, promo, soldes" />

              {testResult && (
                <Banniere ton={testErreur ? 'hi' : 'lo'}>{testResult}</Banniere>
              )}
              {error && <Banniere ton="hi">{error}</Banniere>}

              <div className="source-form-actions">
                <Btn kind="sec" type="button" ref={premier} onClick={onClose}>Annuler</Btn>
                <span className="bh-esp" />
                <Btn kind="sec" type="button" disabled={!form.url} loading={testing} onClick={handleTest}>Tester</Btn>
                <Btn type="submit" disabled={!canSave} loading={saving}>Enregistrer</Btn>
              </div>
            </form>
          </div></div>
        </Reveal>
      </div>
    </>,
    document.body,
  )
}
