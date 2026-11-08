import { Viseur } from '@declic/ui'
import { timeAgo } from '../../lib/utils'
import { badgeClass, TYPE_LABEL } from './sourceBadge'
import SaveButton from './SaveButton'

// Toute la carte ouvre l'article : le titre est un vrai lien, étiré sur la carte (.carte-lien),
// le marque-page passe au-dessus. Sauvegardée : rappel de coupe (.acc).
export default function ArticleCard({ item, sourceName, onRead, onSave }) {
  function handleOpen(e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return // nouvel onglet : laisser faire le navigateur
    e.preventDefault()
    onRead(item)
  }

  return (
    <article className={`carte-w vfw liw${item.is_read ? ' lue' : ''}`}>
      <div className={`cs cut card${item.is_saved ? ' acc' : ''}`}><div className="in cut2">
        <div className="carte-tete">
          <span className={`${badgeClass(item.type)} carte-source`}>{sourceName || TYPE_LABEL[item.type] || item.type}</span>
          {item.lang === 'en' && <span className="badge cut bg-neu" lang="en">EN</span>}
          <SaveButton saved={item.is_saved} onClick={() => onSave(item)} />
        </div>

        <h3 className="carte-titre">
          <a className="carte-lien" href={item.url} onClick={handleOpen}>{item.title}</a>
        </h3>

        {item.summary && <p className="carte-resume">{item.summary}</p>}

        <p className="carte-meta">
          {item.author ? `${item.author} · ` : ''}{timeAgo(item.published_at)}
        </p>
      </div></div>
      <Viseur />
    </article>
  )
}
