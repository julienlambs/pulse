import { IconBtn, Icone } from '@declic/ui'

// Marque-page d'une carte : posé au-dessus du lien étiré de la carte (.carte-act).
// Pas sauvegardé : icône en --muted ; sauvegardé : couleur de lien du bouton discret.
export default function SaveButton({ saved, onClick }) {
  return (
    <span className="carte-act">
      <IconBtn className="bw vfw ibtn"
        kind="ghost"
        label={saved ? 'Retirer des sauvegardés' : 'Sauvegarder'}
        aria-pressed={saved}
        icon={<span className={saved ? undefined : 'ic-muet'}><Icone nom="signet" /></span>}
        onClick={e => { e.stopPropagation(); onClick() }}
      />
    </span>
  )
}
