/**
 * Interrupteur clair / sombre. Le curseur glisse, les deux icônes restent
 * visibles : on voit d'un coup d'œil dans quel thème on se trouve.
 */
export default function BasculeTheme({ theme, surBascule }) {
  const clair = theme === 'clair'

  return (
    <button
      type="button"
      onClick={surBascule}
      role="switch"
      aria-checked={clair}
      aria-label={clair ? 'Passer au thème sombre' : 'Passer au thème clair'}
      title={clair ? 'Thème sombre' : 'Thème clair'}
      className="relative flex h-9 w-16 shrink-0 items-center rounded-full border border-bordure
                 bg-surface-2 px-1 transition hover:border-bordure-forte"
    >
      <span
        className="absolute h-7 w-7 rounded-full bg-accent shadow-sm transition-transform duration-300"
        style={{ transform: clair ? 'translateX(0)' : 'translateX(28px)' }}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-[5px]">
        <Soleil actif={clair} />
        <Lune actif={!clair} />
      </span>
    </button>
  )
}

function Soleil({ actif }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={actif ? '#fff' : 'var(--texte-faible)'} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function Lune({ actif }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={actif ? '#fff' : 'none'}
      stroke={actif ? '#fff' : 'var(--texte-faible)'} strokeWidth="2.2" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}
