import { SelectField } from '@declic/ui'

const TABS = [
  { id: 'all',        label: 'Tous les onglets' },
  { id: 'ai_product', label: 'IA Produit' },
  { id: 'ux_product', label: 'UX & Produit' },
  { id: 'tech',       label: 'Tech' },
  { id: 'hardware',   label: 'Hardware' },
  { id: 'video',      label: 'Vidéo' },
]

// Six choix : au-delà de cinq, la charte prend un menu déroulant plutôt que des boutons groupés.
export default function TabFilter({ value, onChange }) {
  return (
    <SelectField id="sauv-onglet" label="Onglet" value={value} onChange={e => onChange(e.target.value)} data-menu="">
      {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
    </SelectField>
  )
}
