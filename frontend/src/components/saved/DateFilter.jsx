import { useState } from 'react'
import { ChampDate, SelectField } from '@declic/ui'

const PRESETS = [
  { id: 'week',    label: 'Cette semaine' },
  { id: 'today',   label: 'Aujourd’hui' },
  { id: 'month',   label: 'Ce mois' },
  { id: '3months', label: '3 derniers mois' },
  { id: 'custom',  label: 'Période personnalisée' },
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

export default function DateFilter({ onChange }) {
  const [preset, setPreset] = useState('week')
  const [custom, setCustom] = useState({ from: '', to: '' })

  function handlePreset(id) {
    setPreset(id)
    if (id !== 'custom') onChange(getRange(id))
  }

  function handleCustom(key, iso) {
    const next = { ...custom, [key]: iso || '' }
    setCustom(next)
    if (next.from || next.to) onChange({ date_from: next.from || null, date_to: next.to || null })
  }

  return (
    <>
      <SelectField id="sauv-periode" label="Période" value={preset} onChange={e => handlePreset(e.target.value)} data-menu="">
        {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </SelectField>

      {preset === 'custom' && (
        <div className="sauv-dates">
          <ChampDate id="sauv-du" label="Du" onDate={iso => handleCustom('from', iso)} />
          <ChampDate id="sauv-au" label="Au" onDate={iso => handleCustom('to', iso)} />
        </div>
      )}
    </>
  )
}
