import { timeAgo } from '../../lib/utils'

const TYPE_BADGE = {
  rss:     { bg: 'var(--accent-soft)',         color: 'var(--accent)' },
  reddit:  { bg: 'rgba(255,122,107,0.12)',      color: 'var(--hi)' },
  bluesky: { bg: 'rgba(107,203,156,0.12)',      color: 'var(--lo)' },
  youtube: { bg: 'rgba(255,122,107,0.15)',      color: 'var(--hi)' },
}

export default function ArticleCard({ item, sourceName, onRead, onSave }) {
  const badge = TYPE_BADGE[item.type] || TYPE_BADGE.rss

  function handleClick() {
    onRead(item)
  }

  function handleSave(e) {
    e.stopPropagation()
    onSave(item)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        opacity: item.is_read ? 0.65 : 1,
        transition: 'opacity 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10.5,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 6,
          background: badge.bg,
          color: badge.color,
          flexShrink: 0,
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {sourceName || item.type.toUpperCase()}
        </span>

        {item.lang === 'en' && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 6,
            background: 'var(--card-2)',
            color: 'var(--muted)',
            flexShrink: 0,
          }}>
            EN
          </span>
        )}

        <button
          onClick={handleSave}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            color: item.is_saved ? 'var(--accent)' : 'var(--muted)',
            padding: '2px 4px',
            lineHeight: 1,
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          🔖
        </button>
      </div>

      {/* Titre */}
      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
        fontSize: 15.5,
        lineHeight: 1.3,
        color: 'var(--text)',
        margin: '0 0 6px',
      }}>
        {item.title}
      </p>

      {/* Résumé */}
      {item.summary && (
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--muted)',
          margin: '0 0 8px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.summary}
        </p>
      )}

      {/* Footer */}
      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: 'var(--muted)',
        margin: 0,
      }}>
        {item.author ? `${item.author} · ` : ''}{timeAgo(item.published_at)}
      </p>
    </div>
  )
}
