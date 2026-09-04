/**
 * Marque AirPass : une aile stylisée qui dessine un « A », posée sur un
 * dégradé terre cuite / or. Le tracé est volontairement simple pour rester
 * lisible à 24 px comme à 96 px.
 */
export default function Logo({ taille = 40, className = '' }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="AirPass"
      className={className}
    >
      <defs>
        <linearGradient id="ap-marque" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="var(--accent-fort)" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--or)" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="13" fill="url(#ap-marque)" />

      {/* L'aile : un delta qui monte vers la droite, barré comme un « A ». */}
      <path
        d="M13 33.5 L24.4 12.6a1.8 1.8 0 0 1 3.2 0L39 33.5a1.6 1.6 0 0 1-1.6 2.4l-10.9-1.7a3 3 0 0 0-1 0l-10.9 1.7A1.6 1.6 0 0 1 13 33.5Z"
        fill="#fff"
        fillOpacity="0.96"
      />
      <path d="M21.2 27.6h9.6" stroke="url(#ap-marque)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

/** Logo + nom, utilisé dans l'en-tête et le pied de page. */
export function LogoTexte({ taille = 38, sousTitre = 'Air Burkina' }) {
  return (
    <span className="flex items-center gap-2.5">
      <Logo taille={taille} />
      <span className="leading-tight">
        <strong className="block font-titre text-[17px] font-bold tracking-tight text-texte">
          AirPass
        </strong>
        {sousTitre && (
          <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-faible">
            {sousTitre}
          </span>
        )}
      </span>
    </span>
  )
}
