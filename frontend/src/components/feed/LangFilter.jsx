import { useId, useState } from 'react'
import { BoutonsGroupes, Btn, Icone, Puces } from '@declic/ui'

const LANGS = [
  { valeur: 'all', label: 'Tous' },
  { valeur: 'fr',  label: 'FR' },
  { valeur: 'en',  label: 'EN' },
]

const SOURCE_TYPES = [
  { id: 'rss',     label: 'RSS' },
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'youtube', label: 'YouTube' },
]

const ETATS = [
  { valeur: 'tous',    label: 'Tous' },
  { valeur: 'nonlus',  label: 'Non lus' },
]

// Langue toujours visible ; type de source et état repliés derrière « Filtres » (panneau dans le flux, pas par-dessus).
export default function LangFilter({ lang, onLangChange, selectedTypes, onTypesChange, unreadOnly, onUnreadOnlyChange }) {
  const [open, setOpen] = useState(false)
  const panneau = useId()
  const nbActifs = selectedTypes.size + (unreadOnly ? 1 : 0)

  return (
    <div className="filtres">
      <div className="filtres-ligne">
        <BoutonsGroupes label="Langue" options={LANGS} valeur={lang} onChange={onLangChange} />
        <Btn kind="sec" className="filtres-btn" icon={<Icone nom="filtrer" />}
          aria-expanded={open} aria-controls={panneau} onClick={() => setOpen(v => !v)}>
          {nbActifs > 0 ? `Filtres (${nbActifs})` : 'Filtres'}
        </Btn>
      </div>

      {open && (
        <div id={panneau} className="cs acc cut card filtres-panneau"><div className="in cut2">
          <span className="lbl">Type de source</span>
          <Puces label="Type de source" filtres={SOURCE_TYPES} actifs={[...selectedTypes]}
            onChange={ids => onTypesChange(new Set(ids))} />

          <div className="filtres-espace" />
          <BoutonsGroupes label="État" options={ETATS} valeur={unreadOnly ? 'nonlus' : 'tous'}
            onChange={v => onUnreadOnlyChange(v === 'nonlus')} />
        </div></div>
      )}
    </div>
  )
}
