/**
 * Petites visualisations, tracées à la main en SVG.
 *
 * Pas de bibliothèque de graphiques : les formes dont la console a besoin
 * sont simples, et les dessiner soi-même évite 90 ko de dépendance pour
 * quatre courbes.
 */

/** Barre de progression horizontale, avec sa valeur alignée à droite. */
export function Jauge({ valeur, max = 100, ton = 'accent', largeur = 'w-full' }) {
  const pourcent = max > 0 ? Math.min(100, (valeur / max) * 100) : 0
  const couleur = { accent: 'bg-accent', succes: 'bg-succes', or: 'bg-or', danger: 'bg-danger' }[ton]

  return (
    <span className={`block h-1.5 overflow-hidden rounded-full bg-surface-3 ${largeur}`}>
      <span
        className={`block h-full rounded-full transition-[width] duration-700 ease-out ${couleur}`}
        style={{ width: `${pourcent}%` }}
      />
    </span>
  )
}

/** Anneau de proportion — deux parts seulement, le reste serait illisible. */
export function Anneau({ valeur, total, taille = 132, epaisseur = 13, legende }) {
  const rayon = (taille - epaisseur) / 2
  const perimetre = 2 * Math.PI * rayon
  const part = total > 0 ? valeur / total : 0

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={taille} height={taille} className="-rotate-90">
        <circle
          cx={taille / 2} cy={taille / 2} r={rayon}
          fill="none" stroke="var(--surface-3)" strokeWidth={epaisseur}
        />
        <circle
          cx={taille / 2} cy={taille / 2} r={rayon}
          fill="none" stroke="var(--accent)" strokeWidth={epaisseur} strokeLinecap="round"
          strokeDasharray={`${perimetre * part} ${perimetre}`}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="font-titre text-2xl font-extrabold tabular-nums">
          {Math.round(part * 100)}<span className="text-base"> %</span>
        </span>
        {legende && <span className="mt-0.5 text-[10px] uppercase tracking-wide text-faible">{legende}</span>}
      </span>
    </div>
  )
}

/** Courbe de tendance minuscule, sans axes ni graduations. */
export function Courbe({ valeurs, hauteur = 34, ton = 'var(--accent)' }) {
  if (!valeurs?.length) return null

  const max = Math.max(...valeurs, 1)
  const largeur = 100
  const pas = valeurs.length > 1 ? largeur / (valeurs.length - 1) : largeur

  const points = valeurs.map((v, i) => `${i * pas},${hauteur - (v / max) * (hauteur - 4) - 2}`)
  const ligne = points.join(' ')
  const aire = `0,${hauteur} ${ligne} ${largeur},${hauteur}`

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} preserveAspectRatio="none"
      className="h-9 w-full" aria-hidden="true">
      <polygon points={aire} fill={ton} opacity="0.12" />
      <polyline points={ligne} fill="none" stroke={ton} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/**
 * Frise de la fenêtre d'enregistrement d'un vol.
 *
 * L'axe va de l'ouverture au départ. Le segment plein est la période où
 * l'enregistrement en ligne est possible ; le curseur marque l'instant
 * présent. C'est l'information que l'exploitation regarde en premier :
 * « qu'est-ce qui va se clôturer dans l'heure ? »
 */
export function FriseEnregistrement({ ouverture, fermeture, depart, maintenant = Date.now() }) {
  const t0 = new Date(ouverture).getTime()
  const t1 = new Date(fermeture).getTime()
  const t2 = new Date(depart).getTime()

  const etendue = Math.max(1, t2 - t0)
  const pos = (t) => Math.max(0, Math.min(100, ((t - t0) / etendue) * 100))

  const finFenetre = pos(t1)
  const curseur = pos(maintenant)
  const ouvert = maintenant >= t0 && maintenant <= t1

  return (
    <span className="relative block h-6 w-full" title="Fenêtre d'enregistrement en ligne">
      {/* Rail complet, de l'ouverture au départ. */}
      <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-3" />

      {/* Période d'enregistrement ouvert. */}
      <span
        className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${
          ouvert ? 'bg-succes' : 'bg-bordure-forte'
        }`}
        style={{ left: 0, width: `${finFenetre}%` }}
      />

      {/* Instant présent. */}
      {curseur > 0 && curseur < 100 && (
        <span
          className="absolute top-1/2 h-3.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${curseur}%` }}
        />
      )}

      {/* Départ. */}
      <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2
                       rounded-full border-2 border-bordure-forte bg-surface" />
    </span>
  )
}
