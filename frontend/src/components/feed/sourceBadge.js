// Badge de source : bleu seul (décision du 08/11/2026). RSS en accent, les réseaux en neutre ;
// les teintes hi / md / lo restent aux statuts (erreur, attention, fait).
export const TYPE_LABEL = { rss: 'RSS', reddit: 'Reddit', bluesky: 'Bluesky', youtube: 'YouTube' }

export function badgeClass(type) {
  return `badge cut ${type === 'rss' ? 'bg-acc' : 'bg-neu'}`
}
