import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { BoutonsGroupes, Reveal, useSurface } from '@declic/ui'

// Tailles du texte de lecture (iA Writer Quattro, .prose) : M = la taille de la charte.
export const SIZES = [
  { valeur: 16, label: 'S' },
  { valeur: 18, label: 'M' },
  { valeur: 21, label: 'L' },
]

// Panneau du bas : rendu hors de #root (useSurface rend la page inerte), Échap et voile le ferment.
export default function FontSizePicker({ open, value, onChange, onClose }) {
  const groupe = useRef(null)
  useSurface(open, onClose, { get current() { return groupe.current?.querySelector('[aria-checked="true"]') } })

  return createPortal(
    <>
      <div className={`scrim${open ? ' open' : ''}`} onClick={onClose} />
      <div className="surface-bas">
        <Reveal open={open} className="surface-bas-in">
          <div className="sheet cs acc cut" role="dialog" aria-modal="true" aria-labelledby="taille-t"><div className="in cut2">
            <div className="grab cut" />
            <h2 className="h-card" id="taille-t">Taille du texte</h2>
            <div ref={groupe} className="taille-choix">
              <BoutonsGroupes label="Taille du texte" options={SIZES} valeur={value} onChange={onChange} />
            </div>
          </div></div>
        </Reveal>
      </div>
    </>,
    document.body,
  )
}
