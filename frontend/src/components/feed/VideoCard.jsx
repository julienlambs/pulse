import { timeAgo } from '../../lib/utils'

export default function VideoCard({ item, onSave }) {
  function handleClick() {
    window.open(item.url, '_blank', 'noopener,noreferrer')
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
        overflow: 'hidden',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        opacity: item.is_read ? 0.65 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Thumbnail 16:9 */}
      {item.thumbnail_url && (
        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
          <img
            src={item.thumbnail_url}
            alt={item.title}
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Contenu */}
      <div style={{ padding: '12px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
            background: 'rgba(255,122,107,0.15)',
            color: 'var(--hi)',
            flexShrink: 0,
          }}>
            YOUTUBE
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.author}
          </span>
        </div>

        <p style={{
          fontFamily: 'Fraunces, serif',
          fontWeight: 600,
          fontSize: 15,
          lineHeight: 1.3,
          color: 'var(--text)',
          margin: '0 0 8px',
        }}>
          {item.title}
        </p>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--muted)',
            flex: 1,
          }}>
            {timeAgo(item.published_at)}
          </span>
          <button
            onClick={handleSave}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: item.is_saved ? 'var(--accent)' : 'var(--muted)',
              padding: '2px 4px',
              lineHeight: 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            🔖
          </button>
        </div>
      </div>
    </div>
  )
}
