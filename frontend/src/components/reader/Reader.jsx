import { useState, useEffect } from 'react'
import { apiFetch } from '../../lib/api'
import { IconBtn, Icone, Viseur } from '@declic/ui'
import FontSizePicker, { SIZES } from './FontSizePicker'
import { badgeClass, TYPE_LABEL } from '../feed/sourceBadge'

export default function Reader({ item, sourceName, onBack, onSaveUpdate }) {
  const [saved, setSaved] = useState(item.is_saved)
  const [fontSize, setFontSize] = useState(() => {
    const v = parseInt(localStorage.getItem('pulse_reader_fontsize') || '18')
    return SIZES.some(s => s.valeur === v) ? v : 18 // anciennes tailles (14/16/19) : retour à M
  })
  const [showFontPicker, setShowFontPicker] = useState(false)

  useEffect(() => {
    window.history.pushState({ reader: true }, '')
    function handlePopState() { onBack() }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  async function handleSave() {
    const newSaved = !saved
    setSaved(newSaved)
    await apiFetch(`/api/items/${item.id}/save`, { method: 'PATCH' })
    onSaveUpdate(item.id, newSaved)
  }

  function handleFontSize(size) {
    setFontSize(size)
    localStorage.setItem('pulse_reader_fontsize', String(size))
  }

  const pubDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="lecteur">
      {/* Barre du haut de la charte (.bh), sans titre : le titre de la page est celui de l'article */}
      <header className="bh">
        <IconBtn className="bw vfw ibtn" kind="ghost" label="Retour au fil" icon={<Icone nom="retour" />} onClick={() => window.history.back()} />
        <span className="bh-esp" />
        <IconBtn className="bw vfw ibtn" kind="ghost" label="Taille du texte" icon={<Icone nom="police" />} onClick={() => setShowFontPicker(true)} />
        <IconBtn className="bw vfw ibtn" kind="ghost" label={saved ? 'Retirer des sauvegardés' : 'Sauvegarder'} aria-pressed={saved}
          icon={<span className={saved ? undefined : 'ic-muet'}><Icone nom="signet" /></span>} onClick={handleSave} />
        <a className="bw vfw ibtn" href={item.url} target="_blank" rel="noopener noreferrer"
          aria-label="Ouvrir l’article d’origine" data-tip="Ouvrir l’article d’origine">
          <span className="b ghost cut"><span className="cut2"><Icone nom="lien-externe" /></span></span>
          <Viseur />
        </a>
      </header>

      <article className="lecteur-article">
        <div className="lecteur-meta">
          <span className={badgeClass(item.type)}>{sourceName || TYPE_LABEL[item.type] || item.type}</span>
          {pubDate && <span>{pubDate}</span>}
        </div>

        <h1 className="h-page lecteur-titre">{item.title}</h1>

        {item.content ? (
          <div
            className="prose reader-content"
            style={{ fontSize }}
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        ) : (
          <div className="lecteur-vide">
            <p>Contenu complet non disponible en lecture intégrée.</p>
            <a className="bw vfw" href={item.url} target="_blank" rel="noopener noreferrer">
              <span className="b pri cut"><span className="cut2">Ouvrir dans le navigateur <Icone nom="lien-externe" /></span></span>
              <Viseur />
            </a>
          </div>
        )}
      </article>

      <FontSizePicker
        open={showFontPicker}
        value={fontSize}
        onChange={handleFontSize}
        onClose={() => setShowFontPicker(false)}
      />
    </div>
  )
}
