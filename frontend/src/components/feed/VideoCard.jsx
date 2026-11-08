import { Viseur } from '@declic/ui'
import { timeAgo } from '../../lib/utils'
import SaveButton from './SaveButton'

// Une vidéo s'ouvre sur YouTube (pas de lecteur intégré) : le titre est un lien externe étiré sur la carte.
export default function VideoCard({ item, onSave }) {
  return (
    <article className={`carte-w vfw liw${item.is_read ? ' lue' : ''}`}>
      <div className={`cs cut card${item.is_saved ? ' acc' : ''}`}><div className="in cut2">
        {item.thumbnail_url && (
          <div className="carte-vignette cut">
            <img src={item.thumbnail_url} alt="" loading="lazy" />
          </div>
        )}

        <div className="carte-tete">
          <span className="badge cut bg-neu">YouTube</span>
          <span className="carte-chaine">{item.author}</span>
          <SaveButton saved={item.is_saved} onClick={() => onSave(item)} />
        </div>

        <h3 className="carte-titre">
          <a className="carte-lien" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
        </h3>

        <p className="carte-meta">{timeAgo(item.published_at)}</p>
      </div></div>
      <Viseur />
    </article>
  )
}
