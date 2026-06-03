import { useState } from 'react'
import { apiFetch } from '../../lib/api'
import FontSizePicker from './FontSizePicker'

const TYPE_BADGE = {
  rss:     { bg: 'var(--accent-soft)',         color: 'var(--accent)' },
  reddit:  { bg: 'rgba(255,122,107,0.12)',      color: 'var(--hi)' },
  bluesky: { bg: 'rgba(107,203,156,0.12)',      color: 'var(--lo)' },
  youtube: { bg: 'rgba(255,122,107,0.15)',      color: 'var(--hi)' },
}

const BTN = {
  background: 'none',
  border: 'none',
  color: 'var(--muted)',
  fontSize: 20,
  cursor: 'pointer',
  padding: '6px 8px',
  borderRadius: 8,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent',
  textDecoration: 'none',
}

export default function Reader({ item, sourceName, onBack, onSaveUpdate }) {
  const [saved, setSaved] = useState(item.is_saved)
  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem('pulse_reader_fontsize') || '16')
  )
  const [showFontPicker, setShowFontPicker] = useState(false)

  const badge = TYPE_BADGE[item.type] || TYPE_BADGE.rss

  async function handleSave() {
    const newSaved = !saved
    setSaved(newSaved)
    await apiFetch(`/api/items/${item.id}/save`, { method: 'PATCH' })
    onSaveUpdate(item.id, newSaved)
  }

  function handleFontSize(size) {
    setFontSize(size)
    localStorage.setItem('pulse_reader_fontsize', String(size))
    setShowFontPicker(false)
  }

  const pubDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 4,
        zIndex: 51,
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ ...BTN, fontSize: 22 }}>←</button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowFontPicker(true)}
          style={{ ...BTN, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}
        >
          Aa
        </button>
        <button
          onClick={handleSave}
          style={{ ...BTN, color: saved ? 'var(--accent)' : 'var(--muted)', fontSize: 18 }}
        >
          🔖
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...BTN, fontSize: 18 }}
        >
          ↗
        </a>
      </header>

      {/* Contenu */}
      <article style={{ padding: '24px 20px 80px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
            background: badge.bg,
            color: badge.color,
          }}>
            {sourceName || item.type.toUpperCase()}
          </span>
          {pubDate && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>
              {pubDate}
            </span>
          )}
        </div>

        {/* Titre */}
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 600,
          fontSize: 27,
          lineHeight: 1.18,
          color: 'var(--text)',
          margin: '0 0 28px',
        }}>
          {item.title}
        </h1>

        {/* Corps */}
        {item.content ? (
          <div
            className="reader-content"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: fontSize,
              lineHeight: 1.7,
              color: 'var(--text)',
            }}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        ) : (
          <div style={{ paddingTop: 16 }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              color: 'var(--muted)',
              marginBottom: 20,
            }}>
              Contenu complet non disponible en lecture intégrée.
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 10,
                background: 'var(--accent)',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Ouvrir dans le navigateur ↗
            </a>
          </div>
        )}
      </article>

      {showFontPicker && (
        <FontSizePicker
          value={fontSize}
          onChange={handleFontSize}
          onClose={() => setShowFontPicker(false)}
        />
      )}
    </div>
  )
}
