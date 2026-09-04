import { useEffect, useRef, useState } from 'react'

/**
 * Bande pleine largeur : une photographie qui défile moins vite que la page,
 * un voile, et le texte posé dessus.
 *
 * Le décalage est calculé à partir de la position du bloc dans la fenêtre,
 * pas du défilement absolu : l'effet reste juste où que soit la bande dans
 * la page. Il est désactivé si l'on demande de réduire les animations.
 */
export default function BandeauImmersif({ image, origine = '50% 50%', hauteur = 'min-h-[26rem]', children }) {
  const ref = useRef(null)
  const [decalage, setDecalage] = useState(0)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const surDefilement = () => {
      const bloc = ref.current
      if (!bloc) return
      const r = bloc.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      // -1 quand le bloc entre par le bas, +1 quand il sort par le haut.
      const progres = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight
      setDecalage(progres * -60)
    }

    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    window.addEventListener('resize', surDefilement)
    return () => {
      window.removeEventListener('scroll', surDefilement)
      window.removeEventListener('resize', surDefilement)
    }
  }, [])

  return (
    <section
      ref={ref}
      className={`grain relative isolate flex items-center overflow-hidden ${hauteur}`}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 h-[128%] w-full object-cover"
        style={{ objectPosition: origine, top: '-14%', transform: `translate3d(0, ${decalage}px, 0)` }}
      />
      <span
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(95deg, var(--voile-fort) 0%, var(--voile-doux) 55%, var(--voile-nul) 100%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">{children}</div>
    </section>
  )
}
