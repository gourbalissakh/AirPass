import { useEffect, useRef, useState } from 'react'

/**
 * Arrière-plan photographique du héros.
 *
 * Trois vues qui se fondent l'une dans l'autre avec un lent effet Ken Burns
 * (zoom et translation continus), un voile dégradé pour que le texte reste
 * lisible, et un léger grain qui casse les aplats du dégradé.
 *
 * Photographies : voir docs/credits-photos.md. Le diaporama s'arrête et le
 * zoom est neutralisé si le système demande de réduire les animations.
 */

const VUES = [
  { src: '/images/hero/ciel.jpg',        origine: '30% 60%', legende: 'Au-dessus des nuages' },
  { src: '/images/hero/aeroport.jpg',    origine: '50% 55%', legende: 'Aéroport au crépuscule' },
  { src: '/images/hero/ouagadougou.jpg', origine: '55% 50%', legende: 'Ouagadougou de nuit' },
]

const DUREE = 7000

export default function HeroFond() {
  const [active, setActive] = useState(0)
  const [reduit, setReduit] = useState(false)
  const [decalage, setDecalage] = useState(0)
  const conteneur = useRef(null)

  useEffect(() => {
    setReduit(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  }, [])

  // Défilement automatique des vues.
  useEffect(() => {
    if (reduit) return
    const t = setInterval(() => setActive((i) => (i + 1) % VUES.length), DUREE)
    return () => clearInterval(t)
  }, [reduit])

  // Parallaxe au défilement : l'image monte moins vite que la page.
  useEffect(() => {
    if (reduit) return
    const surDefilement = () => {
      const h = conteneur.current?.offsetHeight ?? 800
      setDecalage(Math.min(window.scrollY, h) * 0.35)
    }
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [reduit])

  return (
    <div ref={conteneur} aria-hidden="true" className="absolute inset-0 overflow-hidden bg-fond">
      <div className="absolute inset-0" style={{ transform: `translate3d(0, ${decalage}px, 0)` }}>
        {VUES.map((vue, i) => (
          <img
            key={vue.src}
            src={vue.src}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: vue.origine,
              opacity: i === active ? 1 : 0,
              transition: 'opacity 1600ms ease-in-out',
              animation: reduit ? 'none' : `kenburns ${DUREE * VUES.length}ms ease-in-out infinite`,
              animationDelay: `${-i * DUREE}ms`,
            }}
          />
        ))}
      </div>

      {/* Voile : sombre à gauche sous le titre, plus clair à droite. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, var(--voile-fort) 0%, var(--voile-fort) 30%, var(--voile-doux) 62%, var(--voile-nul) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-56"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--fond))' }}
      />

      {/* Grain : casse les bandes du dégradé sur les grands aplats. */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23b)'/%3E%3C/svg%3E\")",
      }} />

      {/* Repères de progression, cliquables. */}
      <ol className="pointer-events-auto absolute bottom-8 left-4 flex gap-2 sm:left-6">
        {VUES.map((vue, i) => (
          <li key={vue.src}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-label={vue.legende}
              className="group flex h-6 items-center"
            >
              <span
                className={`block h-[3px] rounded-full transition-all duration-500 ${
                  i === active ? 'w-10 bg-accent' : 'w-5 bg-white/35 group-hover:bg-white/60'
                }`}
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
