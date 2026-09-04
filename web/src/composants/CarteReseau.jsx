/**
 * Carte du réseau, dessinée à la main.
 *
 * Ce n'est pas une carte géographique : c'est un schéma. Ouagadougou au
 * centre, six escales posées dans leur direction réelle, et sur chaque arc
 * un trait lumineux qui file de la capitale vers la destination.
 *
 * Le trait mobile est obtenu sans JavaScript : `pathLength` normalise toutes
 * les courbes à 420 unités, un tiret de 10 unités y court, et l'animation
 * `trace` déplace son décalage. Un seul jeu de valeurs pour six longueurs
 * d'arc différentes.
 */

const OUAGA = { x: 400, y: 222 }

const ESCALES = [
  { code: 'DSS', ville: 'Dakar',   x: 92,  y: 132, courbe: -70, duree: 7.5 },
  { code: 'BKO', ville: 'Bamako',  x: 246, y: 176, courbe: -46, duree: 5.5 },
  { code: 'NIM', ville: 'Niamey',  x: 566, y: 166, courbe: -50, duree: 5.0 },
  { code: 'ABJ', ville: 'Abidjan', x: 296, y: 382, courbe: 52,  duree: 6.0 },
  { code: 'ACC', ville: 'Accra',   x: 424, y: 402, courbe: 40,  duree: 6.4 },
  { code: 'LFW', ville: 'Lomé',    x: 502, y: 388, courbe: 44,  duree: 6.8 },
]

/** Arc de cercle approché par une quadratique, bombée perpendiculairement. */
function arc(cible, courbe) {
  const mx = (OUAGA.x + cible.x) / 2
  const my = (OUAGA.y + cible.y) / 2
  const dx = cible.x - OUAGA.x
  const dy = cible.y - OUAGA.y
  const norme = Math.hypot(dx, dy) || 1
  // Normale au segment, mise à l'échelle par `courbe`.
  const cx = mx + (-dy / norme) * courbe
  const cy = my + (dx / norme) * courbe
  return `M${OUAGA.x} ${OUAGA.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${cible.x} ${cible.y}`
}

export default function CarteReseau({ className = '' }) {
  return (
    <svg
      viewBox="0 0 800 470"
      className={`w-full ${className}`}
      role="img"
      aria-label="Schéma du réseau : Ouagadougou relié à Dakar, Bamako, Niamey, Abidjan, Accra et Lomé"
    >
      <defs>
        <radialGradient id="reseau-halo">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="reseau-trait" x1="0" y1="0" x2="800" y2="0">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--or)" />
        </linearGradient>
      </defs>

      {/* Halo derrière la capitale. */}
      <circle cx={OUAGA.x} cy={OUAGA.y} r="170" fill="url(#reseau-halo)" className="anime-centre animate-respire" />

      {ESCALES.map((e, i) => {
        const d = arc(e, e.courbe)
        return (
          <g key={e.code}>
            {/* Arc de fond, pointillé et discret. */}
            <path
              d={d}
              pathLength={420}
              fill="none"
              stroke="var(--bordure-forte)"
              strokeWidth="1.4"
              strokeDasharray="3 9"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Trait lumineux qui parcourt l'arc. */}
            <path
              d={d}
              pathLength={420}
              fill="none"
              stroke="url(#reseau-trait)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="10 410"
              className="animate-trace"
              style={{ animationDuration: `${e.duree}s`, animationDelay: `${i * 0.55}s` }}
            />

            {/* Escale : un point, un anneau, un libellé. */}
            <circle cx={e.x} cy={e.y} r="14" fill="var(--accent)" opacity="0.12" />
            <circle cx={e.x} cy={e.y} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.4" />
            <text
              x={e.x}
              y={e.y - 22}
              textAnchor="middle"
              className="font-titre"
              fontSize="17"
              fontWeight="700"
              fill="var(--texte)"
            >
              {e.ville}
            </text>
            <text
              x={e.x}
              y={e.y + 30}
              textAnchor="middle"
              className="font-mono"
              fontSize="12"
              fontWeight="500"
              fill="var(--texte-faible)"
              letterSpacing="1.5"
            >
              {e.code}
            </text>
          </g>
        )
      })}

      {/* Ouagadougou : le point d'origine, plus gros et pulsant. */}
      <circle cx={OUAGA.x} cy={OUAGA.y} r="11" fill="var(--accent)" className="anime-centre animate-pulse-douce" />
      <circle cx={OUAGA.x} cy={OUAGA.y} r="6" fill="#fff" />
      <text
        x={OUAGA.x}
        y={OUAGA.y - 26}
        textAnchor="middle"
        className="font-titre"
        fontSize="20"
        fontWeight="800"
        fill="var(--texte)"
      >
        Ouagadougou
      </text>
      <text
        x={OUAGA.x}
        y={OUAGA.y + 34}
        textAnchor="middle"
        className="font-mono"
        fontSize="12.5"
        fontWeight="700"
        fill="var(--accent)"
        letterSpacing="1.8"
      >
        OUA
      </text>
    </svg>
  )
}
