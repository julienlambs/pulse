import { BarreBas, MenuLateral, Icone } from '@declic/ui'

// Les cinq onglets du feed : barre du bas sur téléphone, menu latéral (rail puis déplié) au-delà de 600 px.
// Le CSS de la charte choisit lequel s'affiche.
export const TABS = [
  { id: 'ai_product', label: 'IA',       long: 'IA Produit',   icone: 'ia' },
  { id: 'ux_product', label: 'UX',       long: 'UX & Produit', icone: 'pointeur' },
  { id: 'tech',       label: 'Tech',     long: 'Tech',         icone: 'code' },
  { id: 'hardware',   label: 'Hardware', long: 'Hardware',     icone: 'composant' },
  { id: 'video',      label: 'Vidéo',    long: 'Vidéo',        icone: 'film' },
]

export function MenuOnglets({ activeTab, onTabChange }) {
  return (
    <MenuLateral
      label="Onglets"
      items={TABS.map(t => ({ id: t.id, label: t.long, icon: <Icone nom={t.icone} /> }))}
      value={activeTab}
      onChange={onTabChange}
    />
  )
}

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <BarreBas
      label="Onglets"
      items={TABS.map(t => ({ id: t.id, label: t.label, icon: <Icone nom={t.icone} /> }))}
      value={activeTab}
      onChange={onTabChange}
    />
  )
}
