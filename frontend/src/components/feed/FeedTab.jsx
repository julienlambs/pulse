import { useState, useEffect, useRef } from 'react'
import { Banniere, Btn, EmptyState, RichListSkeleton, useSkeleton } from '@declic/ui'
import { apiFetch } from '../../lib/api'
import ArticleCard from './ArticleCard'
import VideoCard from './VideoCard'
import LangFilter from './LangFilter'

const LIMIT = 20

export default function FeedTab({ tab, sourcesMap, savedOverrides = {}, onItemClick }) {
  const [lang, setLang]                 = useState(() => localStorage.getItem(`pulse_lang_${tab}`) || 'all')
  const [selectedTypes, setSelectedTypes] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`pulse_types_${tab}`) || '[]')) }
    catch { return new Set() }
  })
  const [unreadOnly, setUnreadOnly]     = useState(() => localStorage.getItem(`pulse_unread_${tab}`) === 'true')
  const [items, setItems]   = useState([])
  const [total, setTotal]   = useState(0)
  const [offset, setOffset] = useState(0)
  const [fetchKey, setFetchKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const sentinelRef = useRef(null)
  const skOn = useSkeleton(loading && items.length === 0)
  // Refs pour éviter les closures stale dans l'observer
  const itemsLenRef = useRef(0)
  const totalRef    = useRef(0)
  const busyRef     = useRef(false)

  useEffect(() => { itemsLenRef.current = items.length }, [items.length])
  useEffect(() => { totalRef.current = total }, [total])

  // Fetch effect — se déclenche sur (lang, selectedTypes, unreadOnly, offset, fetchKey)
  useEffect(() => {
    let cancelled = false
    busyRef.current = true
    setLoading(true)
    setError(null)

    const qs = new URLSearchParams({ tab, limit: LIMIT, offset })
    if (lang !== 'all') qs.set('lang', lang)
    selectedTypes.forEach(t => qs.append('source_type', t))
    if (unreadOnly) qs.set('unread_only', 'true')

    apiFetch(`/api/items?${qs}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        if (cancelled) return
        setItems(prev => offset === 0 ? data.items : [...prev, ...data.items])
        setTotal(data.total)
      })
      .catch(() => { if (!cancelled) setError('Erreur réseau') })
      .finally(() => {
        if (!cancelled) {
          busyRef.current = false
          setLoading(false)
        }
      })

    return () => { cancelled = true; busyRef.current = false }
  }, [lang, selectedTypes, unreadOnly, offset, fetchKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll — observer stable (deps vides), utilise des refs
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || busyRef.current) return
      const len = itemsLenRef.current
      if (len < totalRef.current) setOffset(len)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function resetFeed() {
    setItems([])
    setTotal(0)
    setOffset(0)
    setFetchKey(k => k + 1)
  }

  function handleLangChange(newLang) {
    localStorage.setItem(`pulse_lang_${tab}`, newLang)
    setLang(newLang)
    resetFeed()
  }

  function handleTypesChange(newTypes) {
    localStorage.setItem(`pulse_types_${tab}`, JSON.stringify([...newTypes]))
    setSelectedTypes(newTypes)
    resetFeed()
  }

  function handleUnreadOnlyChange(val) {
    localStorage.setItem(`pulse_unread_${tab}`, val)
    setUnreadOnly(val)
    resetFeed()
  }

  const filtered = lang !== 'all' || selectedTypes.size > 0 || unreadOnly

  function clearFilters() {
    localStorage.removeItem(`pulse_lang_${tab}`)
    localStorage.removeItem(`pulse_types_${tab}`)
    localStorage.removeItem(`pulse_unread_${tab}`)
    setLang('all')
    setSelectedTypes(new Set())
    setUnreadOnly(false)
    resetFeed()
  }

  async function handleSave(item) {
    await apiFetch(`/api/items/${item.id}/save`, { method: 'PATCH' })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_saved: !i.is_saved } : i))
  }

  function handleRead(item) {
    if (!item.is_read) {
      apiFetch(`/api/items/${item.id}/read`, { method: 'PATCH' })
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_read: true } : i))
    }
    onItemClick(item)
  }

  return (
    <div>
      <LangFilter
        lang={lang}
        onLangChange={handleLangChange}
        selectedTypes={selectedTypes}
        onTypesChange={handleTypesChange}
        unreadOnly={unreadOnly}
        onUnreadOnlyChange={handleUnreadOnlyChange}
      />

      <div className="feed" aria-busy={loading || undefined}>
        {items.map(raw => {
          const item = savedOverrides[raw.id] !== undefined
            ? { ...raw, is_saved: savedOverrides[raw.id] }
            : raw
          return item.type === 'youtube'
            ? <VideoCard key={item.id} item={item} onSave={handleSave} />
            : <ArticleCard
                key={item.id}
                item={item}
                sourceName={sourcesMap[item.source_id]?.name}
                onRead={handleRead}
                onSave={handleSave}
              />
        })}

        {loading && items.length === 0 && (
          <RichListSkeleton rows={5} visible={skOn} message="Chargement des articles…" />
        )}

        {!loading && !error && items.length === 0 && (filtered ? (
          <EmptyState icone="recherche" status titre="Aucun article avec ces filtres"
            action={<Btn kind="sec" onClick={clearFilters}>Effacer les filtres</Btn>}>
            Les autres articles de l’onglet sont toujours là : enlève les filtres pour les revoir.
          </EmptyState>
        ) : (
          <EmptyState icone="liste" titre="Aucun article pour le moment">
            Les sources de cet onglet sont relues toutes les heures : les nouveaux articles arriveront ici.
          </EmptyState>
        ))}

        {error && (
          <Banniere ton="hi" titre="Erreur réseau." actions={[{ label: 'Réessayer', onClick: resetFeed }]}>
            Les articles n’ont pas pu être chargés.
          </Banniere>
        )}

        <div ref={sentinelRef} className="feed-sentinelle" />

        {loading && items.length > 0 && (
          <p className="feed-suite" role="status">Chargement…</p>
        )}
      </div>
    </div>
  )
}
