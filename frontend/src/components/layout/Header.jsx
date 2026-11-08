import { BarreHaut, IconBtn, Icone, useTheme } from '@declic/ui'

export default function Header({ onSavedClick, onAdminClick }) {
  const { mode, toggleMode } = useTheme()
  const versClair = mode === 'dark'

  return (
    <BarreHaut
      titre="Pulse"
      actions={<>
        <IconBtn className="bw vfw ibtn" kind="ghost" label="Sauvegardés" icon={<Icone nom="signet" />} onClick={onSavedClick} />
        <IconBtn className="bw vfw ibtn" kind="ghost" label={versClair ? 'Passer en thème clair' : 'Passer en thème sombre'}
          icon={<Icone nom={versClair ? 'soleil' : 'lune'} />} onClick={toggleMode} />
        <IconBtn className="bw vfw ibtn" kind="ghost" label="Administration" icon={<Icone nom="reglages" />} onClick={onAdminClick} />
      </>}
    />
  )
}
