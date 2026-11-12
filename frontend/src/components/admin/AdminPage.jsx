import { useState, useEffect } from 'react'
import { BarreHaut, IconBtn, Icone, RichListSkeleton, Viseur, useSkeleton } from '@declic/ui'
import { apiFetch } from '../../lib/api'
import SourceCard from './SourceCard'
import SourceForm from './SourceForm'

export default function AdminPage({ token, onBack, onLogout }) {
  const [sources, setSources]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSource, setEditSource] = useState(null)
  const [formKey, setFormKey]   = useState(0)
  const skOn = useSkeleton(loading)

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

  function openForm(source) {
    setEditSource(source)
    setFormKey(k => k + 1) // formulaire remis à neuf à chaque ouverture
    setShowForm(true)
  }

  function handleEdit(source) {
    openForm(source)
  }

  function handleFormSave(savedSource) {
    setSources(prev => {
      const exists = prev.find(s => s.id === savedSource.id)
      return exists ? prev.map(s => s.id === savedSource.id ? savedSource : s) : [savedSource, ...prev]
    })
    setShowForm(false)
  }

  function handleFormClose() {
    setShowForm(false)
  }

  const grouped = ['ai_product', 'ux_product', 'tech', 'hardware', 'video'].reduce((acc, tab) => {
    acc[tab] = sources.filter(s => s.tab === tab)
    return acc
  }, {})

  const TAB_LABELS = { ai_product: 'IA Produit', ux_product: 'UX & Produit', tech: 'Tech', hardware: 'Hardware', video: 'Vidéo' }

  return (
    <>
      <BarreHaut
        menu={<IconBtn className="bw vfw ibtn" kind="ghost" label="Retour au fil" icon={<Icone nom="retour" />} onClick={onBack} />}
        titre="Admin"
        actions={<>
          <span className="badge cut bg-acc">{sources.length} sources</span>
          <IconBtn className="bw vfw ibtn" kind="ghost" label="Se déconnecter" icon={<Icone nom="deconnexion" />} onClick={onLogout} />
        </>}
      />

      <div className="defile">
      <div className="admin">
        {loading ? (
          <RichListSkeleton rows={4} visible={skOn} message="Chargement des sources…" />
        ) : (
          Object.entries(grouped).map(([tab, tabSources]) => (
            tabSources.length > 0 && (
              <section key={tab} className="admin-groupe" aria-labelledby={`grp-${tab}`}>
                <h2 className="h-sub" id={`grp-${tab}`}>{TAB_LABELS[tab]}</h2>
                <div className="admin-liste">
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
              </section>
            )
          ))
        )}
      </div>
      </div>

      {/* Bouton flottant : l'ombre sur l'enveloppe non coupée, la forme coupée dedans */}
      <button type="button" className="bw vfw ibtn fab" aria-label="Ajouter une source" data-tip="Ajouter une source"
        onClick={() => openForm(null)}>
        <span className="b pri cut"><span className="cut2"><Icone nom="ajouter" taille={20} /></span></span>
        <Viseur />
      </button>

      <SourceForm
        key={formKey}
        open={showForm}
        source={editSource}
        token={token}
        onSave={handleFormSave}
        onClose={handleFormClose}
      />
    </>
  )
}
