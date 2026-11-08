import { useState } from 'react'
import { Btn, IconBtn, Icone, Switch, confirmer } from '@declic/ui'
import { timeAgo } from '../../lib/utils'
import { badgeClass, TYPE_LABEL } from '../feed/sourceBadge'

const TAB_LABELS = {
  ai_product: 'IA', ux_product: 'UX', tech: 'Tech', hardware: 'Hardware', video: 'Vidéo',
}

export default function SourceCard({ source, onToggle, onEdit, onDelete, onFetch }) {
  const [fetching, setFetching]       = useState(false)
  const [fetchResult, setFetchResult] = useState(null)
  const hasError = !!source.last_fetch_error

  async function handleFetch() {
    setFetching(true)
    setFetchResult(null)
    const result = await onFetch(source.id)
    setFetchResult(result)
    setFetching(false)
  }

  async function handleDelete() {
    const ok = await confirmer({
      titre: `Supprimer « ${source.name} » ?`,
      texte: 'La source et ses articles non sauvegardés disparaissent du fil.',
      oui: 'Supprimer la source',
    })
    if (ok) onDelete(source.id)
  }

  return (
    <div className={`cs cut card source${source.is_active ? '' : ' inactive'}${hasError ? ' acc' : ''}`}><div className="in cut2">
      <div className="source-tete">
        <span className="source-nom">{source.name}</span>
        <span className={badgeClass(source.type)}>{TYPE_LABEL[source.type] || source.type}</span>
        <span className="source-onglet">vers {TAB_LABELS[source.tab] || source.tab}</span>
        <Switch checked={!!source.is_active} onChange={() => onToggle(source.id)}>
          <span className="sr">Source active : {source.name}</span>
        </Switch>
      </div>

      <p className={`source-stats${hasError ? ' erreur' : ''}`}>
        {hasError && <span className="badge cut bg-hi"><Icone nom="erreur" taille={14} /> Erreur</span>}
        {source.last_fetched_at
          ? `${hasError ? '' : 'Relue '}${timeAgo(source.last_fetched_at)} · ${source.last_fetch_count} articles`
          : 'Jamais relue'}
        {fetchResult !== null && (
          <span className="badge cut bg-lo"><Icone nom="succes" taille={14} /> {fetchResult} nouveaux</span>
        )}
      </p>

      <div className="source-actions">
        <Btn kind="sec" loading={fetching} icon={<Icone nom="recharger" />} onClick={handleFetch}>Relire</Btn>
        <Btn kind="sec" icon={<Icone nom="modifier" />} onClick={() => onEdit(source)}>Modifier</Btn>
        <span className="bh-esp" />
        <IconBtn className="bw vfw ibtn" kind="ghost" label={`Supprimer ${source.name}`} icon={<Icone nom="supprimer" />} onClick={handleDelete} />
      </div>
    </div></div>
  )
}
