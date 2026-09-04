/**
 * Marque Envol.
 *
 * Un « E » couché : trois barres inclinées de 18° vers le haut, la première
 * terminée en pointe comme une aile, les suivantes plus courtes et plus
 * pâles — la traînée que laisse un appareil qui prend de l'altitude.
 *
 * Le tracé tient à 16 px comme à 160 px : trois formes, aucun détail fin.
 */

import { useId } from 'react'

export default function Logo({ taille = 40, className = '', anime = false }) {
  // Les dégradés SVG sont référencés par identifiant : il en faut un par
  // instance, sinon deux logos sur la même page partagent le même fond.
  const id = useId().replace(/:/g, '')

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Envol"
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-fond`} x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="var(--accent-fort)" />
          <stop offset="48%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--or)" />
        </linearGradient>
        <linearGradient id={`${id}-lustre`} x1="24" y1="0" x2="24" y2="48">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="13.5" fill={`url(#${id}-fond)`} />
      <rect width="48" height="48" rx="13.5" fill={`url(#${id}-lustre)`} />

      <g transform="rotate(-18 24 24)">
        {/* Barre haute, terminée en pointe : l'aile. */}
        <path
          d="M15.6 13.2h13.1l6.7 2.6-6.7 2.6H15.6a2.6 2.6 0 0 1 0-5.2Z"
          fill="#fff"
          className={anime ? 'animate-flotte' : undefined}
        />
        {/* Deux barres de traînée, de plus en plus courtes et transparentes. */}
        <rect x="15.6" y="21.4" width="15" height="5.2" rx="2.6" fill="#fff" fillOpacity="0.9" />
        <rect x="15.6" y="29.6" width="9.4" height="5.2" rx="2.6" fill="#fff" fillOpacity="0.72" />
      </g>
    </svg>
  )
}

/**
 * Logo + mot-symbole, pour l'en-tête, le pied de page et la console.
 * `sousTitre` porte l'exploitant : Envol est le service, Air Burkina la
 * compagnie qui l'opère.
 */
export function LogoTexte({ taille = 38, sousTitre = 'par Air Burkina', className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Logo taille={taille} />
      <span className="leading-tight">
        <strong className="block font-titre text-[19px] font-extrabold tracking-tight text-texte">
          Envol
        </strong>
        {sousTitre && (
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-faible">
            {sousTitre}
          </span>
        )}
      </span>
    </span>
  )
}
