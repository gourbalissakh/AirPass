import { useEffect, useRef, useState } from 'react'

/* ==========================================================================
   Boutons
   ========================================================================== */

const VARIANTES = {
  primaire:
    'bg-accent text-white shadow-[0_10px_30px_-12px_var(--accent)] hover:bg-accent-fort ' +
    'active:translate-y-px disabled:bg-surface-3 disabled:text-faible disabled:shadow-none',
  secondaire:
    'bg-surface-2 text-texte border border-bordure hover:border-bordure-forte hover:bg-surface-3 ' +
    'disabled:text-faible disabled:hover:bg-surface-2',
  fantome:
    'bg-transparent text-doux hover:bg-surface-2 hover:text-texte',
  danger:
    'bg-transparent text-danger border border-danger/40 hover:bg-danger/10 hover:border-danger',
  or:
    'bg-or text-[#221a04] hover:brightness-110 active:translate-y-px',
}

const TAILLES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-[15px] gap-2.5 rounded-xl',
}

export function Bouton({
  variante = 'primaire',
  taille = 'md',
  chargement = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || chargement}
      className={`inline-flex select-none items-center justify-center font-semibold
        transition-[background-color,border-color,transform,box-shadow] duration-200
        disabled:cursor-not-allowed ${VARIANTES[variante]} ${TAILLES[taille]} ${className}`}
    >
      {chargement && <Rondelle />}
      {children}
    </button>
  )
}

function Rondelle() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ==========================================================================
   Champs de formulaire
   ========================================================================== */

const STYLE_CHAMP =
  'w-full rounded-xl border border-bordure bg-surface px-3.5 py-3 text-sm text-texte ' +
  'placeholder:text-faible outline-none transition ' +
  'focus:border-accent focus:ring-4 focus:ring-[var(--anneau)]'

export function Champ({ label, aide, erreur, icone, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-doux">{label}</span>
      )}
      <span className="relative block">
        {icone && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faible">
            {icone}
          </span>
        )}
        <input {...props} className={`${STYLE_CHAMP} ${icone ? 'pl-10' : ''}`} />
      </span>
      {aide && !erreur && <span className="mt-1.5 block text-xs text-faible">{aide}</span>}
      {erreur && <span className="mt-1.5 block text-xs text-danger">{erreur}</span>}
    </label>
  )
}

export function Selecteur({ label, aide, children, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13px] font-semibold text-doux">{label}</span>
      )}
      <span className="relative block">
        <select {...props} className={`${STYLE_CHAMP} appearance-none pr-10`}>
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faible"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
      {aide && <span className="mt-1.5 block text-xs text-faible">{aide}</span>}
    </label>
  )
}

export function Bascule({ label, description, ...props }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-bordure
                      bg-surface-2 p-4 transition hover:border-bordure-forte">
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[var(--accent)]"
      />
      <span className="text-sm leading-relaxed">
        <span className="block text-texte">{label}</span>
        {description && <span className="mt-1 block text-xs text-faible">{description}</span>}
      </span>
    </label>
  )
}

/* ==========================================================================
   Conteneurs
   ========================================================================== */

export function Carte({ titre, action, children, className = '', padding = 'p-5 sm:p-6' }) {
  return (
    <section
      className={`rounded-2xl border border-bordure bg-surface shadow-[var(--ombre-douce)]
                  transition-theme ${className}`}
    >
      {(titre || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-bordure px-5 py-3.5 sm:px-6">
          <h2 className="font-titre text-[13px] font-bold uppercase tracking-[0.12em] text-doux">
            {titre}
          </h2>
          {action}
        </header>
      )}
      <div className={padding}>{children}</div>
    </section>
  )
}

/** Carte mise en avant, avec un liseré dégradé. */
export function CarteVedette({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-px ${className}`}
      style={{ background: 'linear-gradient(140deg, var(--accent), var(--or) 60%, var(--bordure))' }}>
      <div className="h-full rounded-[15px] bg-surface p-5 sm:p-6">{children}</div>
    </div>
  )
}

/* ==========================================================================
   Retours à l'utilisateur
   ========================================================================== */

const TONS = {
  info:  { bord: 'border-accent/35',  fond: 'bg-[var(--accent-voile)]', txt: 'text-texte',   icone: 'i' },
  succes:{ bord: 'border-succes/35',  fond: 'bg-[var(--succes-voile)]', txt: 'text-texte',   icone: '✓' },
  avertissement: { bord: 'border-or/40', fond: 'bg-[var(--or-voile)]',  txt: 'text-texte',   icone: '!' },
  erreur:{ bord: 'border-danger/40',  fond: 'bg-[var(--danger-voile)]', txt: 'text-texte',   icone: '!' },
}

export function Alerte({ ton = 'info', titre, children }) {
  if (!children && !titre) return null
  const s = TONS[ton]

  return (
    <div role="alert" className={`flex gap-3 rounded-xl border px-4 py-3.5 text-sm ${s.bord} ${s.fond} ${s.txt}`}>
      <span
        className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full
          text-[11px] font-black ${
            ton === 'erreur' ? 'bg-danger text-white'
            : ton === 'avertissement' ? 'bg-or text-[#221a04]'
            : ton === 'succes' ? 'bg-succes text-white'
            : 'bg-accent text-white'
          }`}
        aria-hidden="true"
      >
        {s.icone}
      </span>
      <span className="leading-relaxed">
        {titre && <strong className="mb-0.5 block font-semibold">{titre}</strong>}
        {children}
      </span>
    </div>
  )
}

const ETIQUETTES = {
  neutre: 'bg-surface-3 text-doux',
  accent: 'bg-[var(--accent-voile)] text-accent',
  or:     'bg-[var(--or-voile)] text-or',
  succes: 'bg-[var(--succes-voile)] text-succes',
  danger: 'bg-[var(--danger-voile)] text-danger',
}

export function Etiquette({ ton = 'neutre', point = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1
                  text-[11px] font-bold uppercase tracking-wide ${ETIQUETTES[ton]}`}
    >
      {point && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-douce" />}
      {children}
    </span>
  )
}

/* ==========================================================================
   Fil des étapes
   ========================================================================== */

export function FilEtapes({ etapes, courante }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-1 gap-y-3">
      {etapes.map((etape, i) => {
        const etat = i < courante ? 'faite' : i === courante ? 'courante' : 'a_venir'

        return (
          <li key={etape} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
                transition-all duration-300 ${
                  etat === 'faite'
                    ? 'bg-succes text-white'
                    : etat === 'courante'
                      ? 'bg-accent text-white ring-4 ring-[var(--anneau)]'
                      : 'border border-bordure bg-surface-2 text-faible'
                }`}
            >
              {etat === 'faite' ? '✓' : i + 1}
            </span>
            <span
              className={`text-[13px] font-semibold ${
                etat === 'a_venir' ? 'text-faible' : 'text-texte'
              }`}
            >
              {etape}
            </span>
            {i < etapes.length - 1 && (
              <span
                className={`mx-2 hidden h-px w-8 sm:block ${
                  i < courante ? 'bg-succes' : 'bg-bordure'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ==========================================================================
   Divers
   ========================================================================== */

/** Paire libellé / valeur, brique de tous les récapitulatifs. */
export function Donnee({ label, valeur, accent = false, large = false, className = '' }) {
  return (
    <div className={`${large ? 'col-span-2' : ''} ${className}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faible">{label}</dt>
      <dd className={accent
        ? 'font-titre text-2xl font-bold text-accent'
        : 'mt-0.5 font-semibold text-texte'}>
        {valeur}
      </dd>
    </div>
  )
}

/** Compteur qui s'incrémente une fois visible — utilisé sur la page d'accueil. */
export function Compteur({ valeur, suffixe = '', duree = 1400 }) {
  const ref = useRef(null)
  const [affiche, setAffiche] = useState(0)

  useEffect(() => {
    const noeud = ref.current
    if (!noeud) return

    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduit) { setAffiche(valeur); return }

    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()

      const debut = performance.now()
      const pas = (t) => {
        const p = Math.min(1, (t - debut) / duree)
        // Décélération : le compteur ralentit en approchant de sa valeur.
        setAffiche(Math.round(valeur * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(pas)
      }
      requestAnimationFrame(pas)
    }, { threshold: 0.4 })

    obs.observe(noeud)
    return () => obs.disconnect()
  }, [valeur, duree])

  return <span ref={ref}>{affiche.toLocaleString('fr-FR')}{suffixe}</span>
}

/** Bloc de chargement, à la forme du contenu attendu. */
export function Squelette({ className = 'h-4 w-full' }) {
  return <div className={`squelette rounded-lg ${className}`} />
}

/** État vide, neutre et explicite. */
export function Vide({ titre, children }) {
  return (
    <div className="py-10 text-center">
      <p className="font-titre text-base font-semibold text-doux">{titre}</p>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm text-faible">{children}</p>}
    </div>
  )
}
