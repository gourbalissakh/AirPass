import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { definirJeton } from '../api'
import Logo, { LogoTexte } from './Logo'
import BasculeTheme from './BasculeTheme'

/**
 * Ossature commune : en-tête translucide qui se densifie au défilement,
 * menu repliable sur mobile, pied de page.
 *
 * La page d'accueil passe `pleineLargeur` pour que son héros aille au bord
 * de l'écran et se glisse sous l'en-tête.
 */
export default function Layout({ children, utilisateur, surDeconnexion, theme, surBascule }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [defile, setDefile] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(false)

  const pleineLargeur = pathname === '/'

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 8)
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [])

  // Referme le menu à chaque changement de page.
  useEffect(() => setMenuOuvert(false), [pathname])

  const deconnecter = () => {
    definirJeton(null)
    surDeconnexion?.()
    navigate('/')
  }

  const estAgent = utilisateur?.role === 'agent' || utilisateur?.role === 'admin'
  const liens = [
    { to: '/', libelle: 'Accueil' },
    { to: '/vol', libelle: "Statut d'un vol" },
    ...(estAgent ? [{ to: '/guichet', libelle: 'Guichet' }] : []),
    ...(utilisateur?.role === 'admin' ? [{ to: '/admin', libelle: 'Back-office' }] : []),
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`sans-impression sticky top-0 z-50 transition-all duration-300 ${
          defile || menuOuvert
            ? 'verre border-b border-bordure'
            : pleineLargeur ? 'bg-transparent' : 'verre border-b border-bordure'
        }`}
      >
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="shrink-0" aria-label="Envol, accueil">
            <LogoTexte />
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {liens.map((l) => <Lien key={l.to} {...l} />)}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <BasculeTheme theme={theme} surBascule={surBascule} />

            {utilisateur ? (
              <button
                onClick={deconnecter}
                className="hidden h-9 items-center rounded-lg px-3 text-[13px] font-semibold
                           text-doux transition hover:bg-surface-2 hover:text-texte sm:flex"
              >
                Quitter · {utilisateur.nom.split(' ')[0]}
              </button>
            ) : (
              <Link
                to="/personnel"
                className="hidden h-9 items-center rounded-lg border border-bordure px-3.5
                           text-[13px] font-semibold text-doux transition
                           hover:border-bordure-forte hover:text-texte sm:flex"
              >
                Personnel
              </Link>
            )}

            <button
              onClick={() => setMenuOuvert((o) => !o)}
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOuvert}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-bordure
                         text-texte transition hover:border-bordure-forte md:hidden"
            >
              {menuOuvert ? <X size={18} strokeWidth={2.4} /> : <Menu size={18} strokeWidth={2.4} />}
            </button>
          </div>
        </div>

        {/* Menu mobile. */}
        <div
          className="overflow-hidden border-bordure transition-[max-height,opacity] duration-300 md:hidden"
          style={{
            maxHeight: menuOuvert ? '22rem' : '0',
            opacity: menuOuvert ? 1 : 0,
            borderTopWidth: menuOuvert ? '1px' : '0',
          }}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {liens.map((l) => <Lien key={l.to} {...l} bloc />)}
            {utilisateur ? (
              <button
                onClick={deconnecter}
                className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-danger
                           transition hover:bg-surface-2"
              >
                Se déconnecter ({utilisateur.nom})
              </button>
            ) : (
              <Lien to="/personnel" libelle="Espace personnel" bloc />
            )}
          </nav>
        </div>
      </header>

      <main className={`flex-1 ${pleineLargeur ? '' : 'mx-auto w-full max-w-7xl px-4 py-10 sm:px-6'}`}>
        {children}
      </main>

      <PiedDePage />
    </div>
  )
}

function Lien({ to, libelle, bloc = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded-lg px-3.5 text-[13px] font-semibold transition ${
          bloc ? 'block py-2.5' : 'flex h-9 items-center'
        } ${
          isActive
            ? 'bg-[var(--accent-voile)] text-accent'
            : 'text-doux hover:bg-surface-2 hover:text-texte'
        }`
      }
    >
      {libelle}
    </NavLink>
  )
}

function PiedDePage() {
  const colonnes = [
    {
      titre: 'Voyager',
      liens: [
        ['Enregistrement en ligne', '/'],
        ["Statut d'un vol", '/vol'],
      ],
    },
    {
      titre: 'Air Burkina',
      liens: [
        ['Notre réseau', '/'],
        ['Franchise bagages', '/'],
      ],
    },
    {
      titre: 'Personnel',
      liens: [
        ['Comptoir', '/personnel'],
        ['Back-office', '/personnel'],
      ],
    },
  ]

  return (
    <footer className="sans-impression relative mt-24 border-t border-bordure bg-surface transition-theme">
      {/* Filet dégradé : la signature de la marque, en un pixel. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'var(--degrade-marque)' }}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <LogoTexte />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-faible">
            L'enregistrement en ligne des passagers Air Burkina : votre siège,
            vos bagages et votre carte d'embarquement, avant même d'arriver à
            l'aéroport.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent
                       transition hover:gap-2.5 hover:text-accent-fort"
          >
            Commencer mon enregistrement
            <ArrowRight size={15} strokeWidth={2.4} />
          </Link>
        </div>

        {colonnes.map((c) => (
          <div key={c.titre}>
            <h3 className="font-titre text-[12px] font-bold uppercase tracking-[0.14em] text-doux">
              {c.titre}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {c.liens.map(([libelle, to]) => (
                <li key={libelle}>
                  <Link to={to} className="text-sm text-faible transition hover:text-accent">
                    {libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-bordure">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-faible
                        sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <Logo taille={18} />
            Envol — prototype d'enregistrement en ligne pour Air Burkina.
          </p>
          <p>
            L'enregistrement en ligne ne remplace pas les contrôles de sûreté
            à l'aéroport.
          </p>
        </div>
      </div>
    </footer>
  )
}
