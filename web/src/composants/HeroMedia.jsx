import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

/**
 * Fond du héros : une vidéo de vue hublot, et un diaporama photographique
 * en secours.
 *
 * La vidéo est le décor par défaut. On retombe sur les photographies dans
 * trois cas : le navigateur ne sait pas lire le WebM, le réseau a échoué, ou
 * le système demande de réduire les animations. Le spectateur peut aussi
 * choisir lui-même une vue : les repères du bas basculent d'un plan à l'autre.
 *
 * Médias : voir docs/credits-photos.md.
 */

const VIDEO = {
  src: '/videos/hublot.webm',
  affiche: '/images/hero/ciel.jpg',
  legende: 'Vue hublot, en descente',
}

const VUES = [
  { src: '/images/hero/air-burkina.jpg',     origine: '50% 55%', legende: 'Un appareil Air Burkina' },
  { src: '/images/hero/ouaga-crepuscule.jpg', origine: '50% 50%', legende: 'Crépuscule sur Ouagadougou' },
  { src: '/images/hero/atterrissage.jpg',    origine: '50% 60%', legende: "À l'aéroport de Ouagadougou" },
  { src: '/images/hero/aeroport.jpg',        origine: '50% 55%', legende: 'Aéroport au crépuscule' },
]

const DUREE = 7000

export default function HeroMedia() {
  const [mode, setMode] = useState('video')   // 'video' | 'photos'
  const [active, setActive] = useState(0)
  const [enLecture, setEnLecture] = useState(true)
  const [reduit, setReduit] = useState(false)
  const [decalage, setDecalage] = useState(0)

  const conteneur = useRef(null)
  const video = useRef(null)

  // Préférence système : pas de vidéo ni de zoom si l'on demande le calme.
  useEffect(() => {
    const reduction = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    setReduit(reduction)
    if (reduction) { setMode('photos'); setEnLecture(false) }
  }, [])

  // Filet de sécurité : si la vidéo n'a pas de première image au bout de six
  // secondes — connexion lente, décodeur absent, fichier manquant — on passe
  // aux photographies plutôt que de laisser une affiche figée à l'écran.
  // Le décompte ne court pas tant que l'onglet est caché : les navigateurs y
  // diffèrent volontairement le chargement des médias.
  useEffect(() => {
    if (mode !== 'video') return

    let minuteur
    const armer = () => {
      clearTimeout(minuteur)
      if (document.visibilityState !== 'visible') return
      minuteur = setTimeout(() => {
        if ((video.current?.readyState ?? 0) < 2) setMode('photos')
      }, 6000)
    }

    armer()
    document.addEventListener('visibilitychange', armer)
    return () => { clearTimeout(minuteur); document.removeEventListener('visibilitychange', armer) }
  }, [mode])

  // Défilement automatique des photographies, uniquement dans ce mode.
  useEffect(() => {
    if (mode !== 'photos' || reduit) return
    const t = setInterval(() => setActive((i) => (i + 1) % VUES.length), DUREE)
    return () => clearInterval(t)
  }, [mode, reduit])

  // Parallaxe au défilement : le décor monte moins vite que la page.
  useEffect(() => {
    if (reduit) return
    const surDefilement = () => {
      const h = conteneur.current?.offsetHeight ?? 800
      setDecalage(Math.min(window.scrollY, h) * 0.32)
    }
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [reduit])

  const basculerLecture = () => {
    const v = video.current
    if (mode !== 'video') { setMode('video'); setEnLecture(true); v?.play?.().catch(() => {}); return }
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); setEnLecture(true) }
    else { v.pause(); setEnLecture(false) }
  }

  return (
    <div
      ref={conteneur}
      aria-hidden="true"
      className="grain absolute inset-0 overflow-hidden bg-fond"
    >
      <div className="absolute inset-0" style={{ transform: `translate3d(0, ${decalage}px, 0)` }}>
        {/* Vidéo — muette et en boucle, condition sine qua non de la lecture
            automatique sur mobile. */}
        <video
          ref={video}
          src={VIDEO.src}
          poster={VIDEO.affiche}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onError={() => setMode('photos')}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
          style={{ opacity: mode === 'video' ? 1 : 0 }}
        />

        {/* Diaporama de secours, également joignable à la demande. */}
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
              opacity: mode === 'photos' && i === active ? 1 : 0,
              transition: 'opacity 1400ms ease-in-out',
              animation: reduit ? 'none' : `kenburns ${DUREE * VUES.length}ms ease-in-out infinite`,
              animationDelay: `${-i * DUREE}ms`,
            }}
          />
        ))}
      </div>

      {/* Voile de lecture : dense à gauche sous le titre, transparent à droite. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, var(--voile-fort) 0%, var(--voile-fort) 28%, var(--voile-doux) 60%, var(--voile-nul) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--fond))' }}
      />

      {/* Commandes : lecture de la vidéo, puis un repère par photographie. */}
      <div className="pointer-events-auto absolute bottom-7 left-4 flex items-center gap-3 sm:left-6">
        <button
          type="button"
          onClick={basculerLecture}
          aria-label={
            mode === 'video' && enLecture ? 'Mettre la vidéo en pause' : 'Lire la vidéo du héros'
          }
          title={VIDEO.legende}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25
                     bg-black/35 text-white backdrop-blur-md transition hover:bg-black/55"
        >
          {mode === 'video' && enLecture
            ? <Pause size={14} fill="currentColor" strokeWidth={0} />
            : <Play size={14} fill="currentColor" strokeWidth={0} className="ml-0.5" />}
        </button>

        <ol className="flex gap-2">
          {VUES.map((vue, i) => (
            <li key={vue.src}>
              <button
                type="button"
                onClick={() => { setMode('photos'); setActive(i); setEnLecture(false); video.current?.pause?.() }}
                aria-label={vue.legende}
                className="group flex h-6 items-center"
              >
                <span
                  className={`block h-[3px] rounded-full transition-all duration-500 ${
                    mode === 'photos' && i === active
                      ? 'w-10 bg-accent'
                      : 'w-5 bg-white/35 group-hover:bg-white/70'
                  }`}
                />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
