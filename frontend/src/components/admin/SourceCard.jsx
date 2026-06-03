import { useState } from 'react'
import { timeAgo } from '../../lib/utils'

const TYPE_BADGE = {
  rss:     { bg: 'var(--accent-soft)',         color: 'var(--accent)',  label: 'RSS' },
  reddit:  { bg: 'rgba(255,122,107,0.12)',      color: 'var(--hi)',      label: 'REDDIT' },
  bluesky: { bg: 'rgba(107,203,156,0.12)',      color: 'var(--lo)',      label: 'BLUESKY' },
  youtube: { bg: 'rgba(255,122,107,0.15)',      color: 'var(--hi)',      label: 'YOUTUBE' },
}

const TAB_LABELS = {
  ai_product: 'IA', ux_product: 'UX', tech: 'Tech', hardware: 'HW', video: 'Vidéo',
}

export default function SourceCard({ source, onToggle, onEdit, onDelete, onFetch }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [fetching, setFetching]           = useState(false)
  const [fetchResult, setFetchResult]     = useState(null)

  const badge = TYPE_BADGE[source.type] || { bg: 'var(--card-2)', color: 'var(--muted)', label: source.type.toUpperCase() }
  const hasError = !!source.last_fetch_error

  async function handleFetch() {
    setFetching(true)
    setFetchResult(null)
    const result = await onFetch(source.id)
    setFetchResult(result)
    setFetching(false)
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${hasError ? 'rgba(255,122,107,0.3)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '14px',
      opacity: source.is_active ? 1 : 0.6,
      transition: 'opacity 0.15s',
    }}>
      {/* Ligne 1 : nom + badges + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {source.name}
        </span>

        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9.5,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 4,
          background: badge.bg,
          color: badge.color,
          flexShrink: 0,
        }}>
          {badge.label}
        </span>

        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: 'var(--muted)',
          flexShrink: 0,
        }}>
          → {TAB_LABELS[source.tab] || source.tab}
        </span>

        {/* Toggle actif/inactif */}
        <button
          onClick={() => onToggle(source.id)}
          style={{
            width: 42,
            height: 24,
            borderRadius: 12,
            background: source.is_active ? 'var(--accent)' : 'var(--border)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            position: 'absolute',
            top: 3,
            left: source.is_active ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Ligne 2 : stats fetch */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: hasError ? 'var(--hi)' : 'var(--muted)',
      }}>
        {hasError && <span style={{ color: 'var(--hi)' }}>●</span>}
        {source.last_fetched_at
          ? `${hasError ? 'Erreur · ' : 'Fetch · '}${timeAgo(source.last_fetched_at)} · ${source.last_fetch_count} articles`
          : 'Jamais fetché'}
        {fetchResult !== null && (
          <span style={{ color: 'var(--lo)', marginLeft: 4 }}>
            +{fetchResult} ✓
          </span>
        )}
      </div>

      {/* Ligne 3 : actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <button
          onClick={handleFetch}
          disabled={fetching}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: fetching ? 'var(--muted)' : 'var(--text)',
            cursor: fetching ? 'default' : 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {fetching ? '…' : '↻ Fetch'}
        </button>

        <button
          onClick={() => onEdit(source)}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ✎ Éditer
        </button>

        <div style={{ marginLeft: 'auto' }}>
          {confirmDelete ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => onDelete(source.id)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,80,80,0.15)',
                  color: '#ff5050',
                  border: '1px solid rgba(255,80,80,0.3)',
                  cursor: 'pointer',
                }}
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'var(--bg)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                Non
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer', padding: '2px 4px', WebkitTapHighlightColor: 'transparent' }}
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
