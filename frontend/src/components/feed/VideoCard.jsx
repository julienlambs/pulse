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
        border: item.is_saved ? '1px solid rgba(96,80,220,0.35)' : '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        opacity: item.is_read ? 0.5 : 0.8,
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
          fontFamily: 'JetBrains Mono, monospace',
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
              color: item.is_saved ? 'var(--accent)' : 'var(--muted)',
              padding: '2px 4px',
              lineHeight: 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="13" height="16" viewBox="0 0 13 16" fill={item.is_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 1.5h10v13l-5-3-5 3V1.5z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
