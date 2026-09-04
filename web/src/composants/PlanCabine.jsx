import { useMemo } from 'react'

/**
 * EF-4.1, EF-4.2 — plan interactif de la cabine.
 *
 * Les sièges arrivent à plat depuis l'API ; on les regroupe par rangée et on
 * insère le couloir à l'endroit indiqué par le plan du type d'appareil, ce
 * qui rend le composant valable pour n'importe quelle configuration.
 */
export default function PlanCabine({ plan, sieges, selection, surChoix, occupe }) {
  const rangees = useMemo(() => {
    const parRangee = new Map()
    for (const siege of sieges) {
      if (!parRangee.has(siege.rangee)) parRangee.set(siege.rangee, [])
      parRangee.get(siege.rangee).push(siege)
    }
    return [...parRangee.entries()].sort((a, b) => a[0] - b[0])
  }, [sieges])

  return (
    <div>
      <Legende />

      <div className="relative mx-auto max-w-[22rem]">
        {/* Fuselage. */}
        <div
          className="rounded-t-[46%] rounded-b-3xl border-2 border-bordure bg-surface-2 px-3 pb-8 pt-16
                     shadow-[inset_0_1px_0_var(--surface-3)]"
        >
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-faible">
            Avant de l'appareil
          </p>

          <div className="space-y-1.5">
            {rangees.map(([numero, sieges]) => (
              <div key={numero} className="flex items-center justify-center gap-1.5">
                <span className="w-5 text-right font-mono text-[10px] text-faible">{numero}</span>
                {sieges.map((siege, i) => (
                  <span key={siege.code} className="flex items-center">
                    <Siege
                      siege={siege}
                      selectionne={selection === siege.code}
                      surChoix={surChoix}
                      desactive={occupe}
                    />
                    {plan.couloir_apres === siege.lettre && i < sieges.length - 1 && (
                      <span className="w-6" aria-hidden="true" />
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Ailes, purement décoratives. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[-14%] top-[52%] h-16 w-[16%] rounded-l-full
                     bg-bordure opacity-60"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[-14%] top-[52%] h-16 w-[16%] rounded-r-full
                     bg-bordure opacity-60"
        />
      </div>
    </div>
  )
}

function Siege({ siege, selectionne, surChoix, desactive }) {
  const retenu = selectionne || siege.statut === 'selectionne'
  const libre = siege.statut === 'libre' || siege.statut === 'selectionne'
  const cliquable = libre && !desactive

  const style = retenu
    ? 'bg-accent text-white border-accent font-bold shadow-[0_0_0_4px_var(--anneau)] scale-105'
    : siege.statut === 'occupe'
      ? 'bg-surface-3 text-faible border-surface-3 cursor-not-allowed'
      : siege.statut === 'bloque'
        ? 'bg-transparent text-faible/40 border-bordure border-dashed cursor-not-allowed'
        : siege.type === 'issue_secours'
          ? 'bg-surface text-succes border-succes/60 hover:bg-[var(--succes-voile)] hover:scale-105'
          : siege.type === 'premium'
            ? 'bg-surface text-or border-or/60 hover:bg-[var(--or-voile)] hover:scale-105'
            : 'bg-surface text-doux border-bordure hover:border-accent hover:text-accent hover:scale-105'

  return (
    <button
      type="button"
      disabled={!cliquable}
      onClick={() => cliquable && surChoix(siege.code)}
      title={titre(siege)}
      aria-label={`Siège ${siege.code} — ${titre(siege)}`}
      aria-pressed={retenu}
      className={`h-8 w-8 rounded-lg border text-[10px] font-semibold
                  transition-all duration-150 ${style}`}
    >
      {siege.lettre}
    </button>
  )
}

function titre(siege) {
  const type = {
    issue_secours: 'issue de secours',
    premium: 'classe affaires',
    espace_sup: 'espace supplémentaire',
    standard: 'standard',
  }[siege.type]

  const statut = {
    libre: 'disponible',
    selectionne: 'votre sélection',
    occupe: 'occupé',
    bloque: 'non attribuable',
  }[siege.statut]

  return `${siege.code} — ${type}, ${statut}`
}

function Legende() {
  const entrees = [
    ['bg-surface border-bordure', 'Disponible'],
    ['bg-accent border-accent', 'Votre siège'],
    ['bg-surface-3 border-surface-3', 'Occupé'],
    ['bg-surface border-succes/60', 'Issue de secours'],
    ['bg-surface border-or/60', 'Affaires'],
    ['bg-transparent border-bordure border-dashed', 'Non attribuable'],
  ]

  return (
    <ul className="mb-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-faible">
      {entrees.map(([style, libelle]) => (
        <li key={libelle} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded border ${style}`} />
          {libelle}
        </li>
      ))}
    </ul>
  )
}
