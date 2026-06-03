import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../lib/api'
import ArticleCard from '../components/feed/ArticleCard'
import VideoCard from '../components/feed/VideoCard'
import TabFilter from '../components/saved/TabFilter'
import DateFilter from '../components/saved/DateFilter'

const LIMIT = 30

function getInitialRange() {
  const now = new Date()
  const from = new Date(now)
  from.setDate(now.getDate() - 7)
  return { date_from: from.toISOString().slice(0, 10), date_to: null }
}

export default function SavedPage({ sourcesMap, onBack, onItemClick }) {
  const [tab, setTab]         = useState('all')
  const [dateRange, setDateRange] = useState(getInitialRange)
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [offset, setOffset]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const sentinelRef = useRef(null)
  const itemsLenRef = useRef(0)
  const totalRef    = useRef(0)
  const busyRef     = useRef(false)

  useEffect(() => { itemsLenRef.current = items.length }, [items.length])
  useEffect(() => { totalRef.current = total }, [total])

  useEffect(() => {
    let cancelled = false
    busyRef.current = true
    setLoading(true)
    setError(null)

    const qs = new URLSearchParams({ limit: LIMIT, offset })
    if (tab !== 'all') qs.set('tab', tab)
    if (dateRange.date_from) qs.set('date_from', dateRange.date_from + 'T00:00:00')
    if (dateRange.date_to)   qs.set('date_to',   dateRange.date_to   + 'T23:59:59')

    apiFetch(`/api/items/saved?${qs}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setItems(prev => offset === 0 ? data.items : [...prev, ...data.items])
        setTotal(data.total)
      })
      .catch(() => { if (!cancelled) setError('Erreur réseau') })
      .finally(() => { if (!cancelled) { busyRef.current = false; setLoading(false) } })

    return () => { cancelled = true; busyRef.current = false }
  }, [tab, dateRange, offset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || busyRef.current) return
      if (itemsLenRef.current < totalRef.current) setOffset(itemsLenRef.current)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(newTab) {
    setTab(newTab)
    setItems([])
    setTotal(0)
    setOffset(0)
  }

  function handleDateChange(range) {
    setDateRange(range)
    setItems([])
    setTotal(0)
    setOffset(0)
  }

  async function handleSave(item) {
    await apiFetch(`/api/items/${item.id}/save`, { method: 'PATCH' })
    setItems(prev => prev.filter(i => i.id !== item.id))
    setTotal(t => t - 1)
  }

  function handleRead(item) {
    apiFetch(`/api/items/${item.id}/read`, { method: 'PATCH' })
    onItemClick(item)
  }

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header secondaire */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px 8px',
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', padding: '4px', lineHeight: 1 }}
        >
          ←
        </button>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 18, color: 'var(--text)' }}>
          Sauvegardés
        </span>
        {total > 0 && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}>
            {total}
          </span>
        )}
      </div>

      <TabFilter value={tab} onChange={handleTabChange} />
      <DateFilter onChange={handleDateChange} />

      <div style={{ padding: '4px 12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item =>
          item.type === 'youtube'
            ? <VideoCard key={item.id} item={item} onSave={handleSave} />
            : <ArticleCard
                key={item.id}
                item={item}
                sourceName={sourcesMap[item.source_id]?.name}
                onRead={handleRead}
                onSave={handleSave}
              />
        )}

        {loading && items.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center', paddingTop: 48 }}>
            Chargement…
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, textAlign: 'center', paddingTop: 48 }}>
            Aucun article sauvegardé pour le moment
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
        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}
