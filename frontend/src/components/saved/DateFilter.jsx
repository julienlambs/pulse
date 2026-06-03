import { useState } from 'react'

const PRESETS = [
  { id: 'week',   label: 'Cette semaine' },
  { id: 'today',  label: "Aujourd'hui" },
  { id: 'month',  label: 'Ce mois' },
  { id: '3months', label: '3 derniers mois' },
  { id: 'custom', label: 'Période personnalisée' },
]

function getRange(id) {
  const now = new Date()
  const pad = d => d.toISOString().slice(0, 10)
  if (id === 'today')   return { date_from: pad(now), date_to: null }
  if (id === 'week') {
    const from = new Date(now); from.setDate(now.getDate() - 7)
    return { date_from: pad(from), date_to: null }
  }
  if (id === 'month') {
    const from = new Date(now); from.setMonth(now.getMonth() - 1)
    return { date_from: pad(from), date_to: null }
  }
  if (id === '3months') {
    const from = new Date(now); from.setMonth(now.getMonth() - 3)
    return { date_from: pad(from), date_to: null }
  }
  return { date_from: null, date_to: null }
}

const SELECT = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
  cursor: 'pointer',
  outline: 'none',
}

const DATE_INPUT = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
  outline: 'none',
}

export default function DateFilter({ onChange }) {
  const [preset, setPreset] = useState('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')

  function handlePreset(id) {
    setPreset(id)
    if (id !== 'custom') {
      onChange(getRange(id))
    }
  }

  function handleCustomChange(from, to) {
    if (from || to) onChange({ date_from: from || null, date_to: to || null })
  }

  return (
    <div style={{ padding: '4px 16px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select value={preset} onChange={e => handlePreset(e.target.value)} style={SELECT}>
        {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={customFrom}
            onChange={e => { setCustomFrom(e.target.value); handleCustomChange(e.target.value, customTo) }}
            style={{ ...DATE_INPUT, flex: 1 }}
          />
          <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>→</span>
          <input
            type="date"
            value={customTo}
            onChange={e => { setCustomTo(e.target.value); handleCustomChange(customFrom, e.target.value) }}
            style={{ ...DATE_INPUT, flex: 1 }}
          />
        </div>
      )}
    </div>
  )
}
