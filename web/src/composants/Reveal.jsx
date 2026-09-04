import { useEffect, useRef, useState } from 'react'

/**
 * Révèle son contenu quand il entre dans le champ de vision.
 *
 * Un IntersectionObserver suffit ici : pas de bibliothèque de défilement, et
 * l'effet se désactive tout seul si l'utilisateur a demandé à réduire les
 * animations (la transition CSS est alors neutralisée par index.css).
 */
export default function Reveal({
  children,
  delai = 0,
  depuis = 'bas',
  className = '',
  style,
  as: Balise = 'div',
}) {
  const ref = useRef(null)
  const [vu, setVu] = useState(false)

  useEffect(() => {
    const noeud = ref.current
    if (!noeud) return

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setVu(true)
          observateur.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    observateur.observe(noeud)
    return () => observateur.disconnect()
  }, [])

  const depart = {
    bas: 'translateY(28px)',
    haut: 'translateY(-28px)',
    gauche: 'translateX(-32px)',
    droite: 'translateX(32px)',
    zoom: 'scale(0.94)',
  }[depuis]

  return (
    <Balise
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: vu ? 1 : 0,
        transform: vu ? 'none' : depart,
        transition: `opacity 620ms cubic-bezier(.16,1,.3,1) ${delai}ms,
                     transform 620ms cubic-bezier(.16,1,.3,1) ${delai}ms`,
        willChange: vu ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </Balise>
  )
}
