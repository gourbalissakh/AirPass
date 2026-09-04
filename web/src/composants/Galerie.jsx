import { useState } from 'react'
import { X } from 'lucide-react'

/**
 * Mosaïque photographique.
 *
 * Les pavés n'ont pas tous la même taille : deux d'entre eux occupent quatre
 * cases, ce qui casse la grille et donne au bloc un rythme de magazine. Au
 * clic, la photographie passe en grand dans une lightbox — fermée par
 * Échap, par le bouton, ou en cliquant à côté.
 */

// Rang de chaque pavé dans la grille : [colonnes, lignes] à partir de `md`.
const PAVES = [
  'md:col-span-2 md:row-span-2',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-2',
  'md:col-span-1 md:row-span-1',
  'md:col-span-2 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-1',
]

export default function Galerie({ images }) {
  const [agrandie, setAgrandie] = useState(null)

  return (
    <>
      <ul className="grid auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[11rem] md:grid-cols-4">
        {images.map((image, i) => (
          <li key={image.src} className={PAVES[i % PAVES.length]}>
            <button
              type="button"
              onClick={() => setAgrandie(image)}
              className="group relative block h-full w-full overflow-hidden rounded-2xl
                         ring-1 ring-bordure transition duration-500
                         hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent"
            >
              <img
                src={image.src}
                alt={image.legende}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1100ms]
                           ease-out group-hover:scale-[1.08]"
                style={{ objectPosition: image.origine }}
              />
              <span
                className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-90"
                style={{ background: 'linear-gradient(to top, #000000cc, #00000026 55%, transparent)' }}
              />
              <span className="absolute inset-x-0 bottom-0 p-3 text-left text-[12px] font-semibold
                               leading-snug text-white/90 sm:text-[13px]">
                {image.legende}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {agrandie && (
        <Lightbox image={agrandie} surFermeture={() => setAgrandie(null)} />
      )}
    </>
  )
}

function Lightbox({ image, surFermeture }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.legende}
      onClick={surFermeture}
      onKeyDown={(e) => e.key === 'Escape' && surFermeture()}
      tabIndex={-1}
      ref={(n) => n?.focus()}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4
                 backdrop-blur-sm sans-impression"
    >
      <button
        type="button"
        onClick={surFermeture}
        aria-label="Fermer"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full
                   border border-white/25 bg-black/40 text-white transition hover:bg-black/70"
      >
        <X size={18} />
      </button>

      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={image.src}
          alt={image.legende}
          className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-[var(--ombre-forte)]"
        />
        <figcaption className="mt-3 text-center text-sm text-white/70">
          {image.legende} — crédits dans docs/credits-photos.md
        </figcaption>
      </figure>
    </div>
  )
}
