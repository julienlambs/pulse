import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../../lib/api'
import ArticleCard from './ArticleCard'
import VideoCard from './VideoCard'
import LangFilter from './LangFilter'

const LIMIT = 20

function SkeletonCard() {
  const bar = (w, h = 14) => ({
    width: w,
    height: h,
    borderRadius: 4,
    background: 'var(--card-2)',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  })
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={bar(90, 18)} />
      <div style={bar('88%', 16)} />
      <div style={bar('65%', 16)} />
      <div style={bar(100, 12)} />
    </div>
  )
}

export default function FeedTab({ tab, sourcesMap, savedOverrides = {}, onItemClick }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem(`pulse_lang_${tab}`) || 'all'
  )
  const [items, setItems]   = useState([])
  const [total, setTotal]   = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const sentinelRef = useRef(null)
  // Refs pour éviter les closures stale dans l'observer
  const itemsLenRef = useRef(0)
  const totalRef    = useRef(0)
  const busyRef     = useRef(false)

  useEffect(() => { itemsLenRef.current = items.length }, [items.length])
  useEffect(() => { totalRef.current = total }, [total])

  // Fetch effect — se déclenche sur (lang, offset)
  useEffect(() => {
    let cancelled = false
    busyRef.current = true
    setLoading(true)
    setError(null)

    const qs = new URLSearchParams({ tab, limit: LIMIT, offset })
    if (lang !== 'all') qs.set('lang', lang)

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
  }, [lang, offset]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleLangChange(newLang) {
    localStorage.setItem(`pulse_lang_${tab}`, newLang)
    setLang(newLang)
    setItems([])
    setTotal(0)
    setOffset(0)
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
      <LangFilter value={lang} onChange={handleLangChange} />

      <div style={{ padding: '4px 12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        {loading && items.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        }

        {!loading && !error && items.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center', paddingTop: 64 }}>
            Aucun article pour le moment
          </p>
        )}

        {error && (
          <p style={{ color: 'var(--hi)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
            {error}
          </p>
        )}

        <div ref={sentinelRef} style={{ height: 4 }} />

        {loading && items.length > 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
            Chargement…
          </p>
        )}

        {/* Espace pour la BottomNav */}
        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}
