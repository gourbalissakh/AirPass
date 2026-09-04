import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ConciergeBell, LayoutDashboard, LogOut, Menu, RadioTower } from 'lucide-react'
import { definirJeton } from '../api'
import Logo from './Logo'
import BasculeTheme from './BasculeTheme'

/**
 * Coquille des écrans d'exploitation (guichet et back-office).
 *
 * Délibérément différente du site public : barre latérale fixe, fond plus
 * dense, horloge de Ouagadougou. L'agent doit sentir qu'il est dans un outil
 * de travail, pas sur une brochure.
 */
export default function ConsoleLayout({ children, utilisateur, surDeconnexion, theme, surBascule }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => setOuvert(false), [pathname])

  const deconnecter = () => {
    definirJeton(null)
    surDeconnexion?.()
    navigate('/')
  }

  const estAdmin = utilisateur?.role === 'admin'

  const sections = [
    {
      titre: 'Escale',
      liens: [{ to: '/guichet', libelle: "Comptoir d'enregistrement", icone: ConciergeBell }],
    },
    ...(estAdmin ? [{
      titre: 'Exploitation',
      liens: [
        { to: '/admin', libelle: 'Tableau de bord', icone: LayoutDashboard },
        { to: '/admin/vols', libelle: 'Programme des vols', icone: RadioTower },
      ],
    }] : []),
  ]

  const titre = {
    '/guichet': "Comptoir d'enregistrement",
    '/admin': 'Tableau de bord',
    '/admin/vols': 'Programme des vols',
  }[pathname] ?? 'Console'

  return (
    <div className="flex min-h-screen bg-surface-2 transition-theme">
      {/* Voile du menu mobile. */}
      {ouvert && (
        <button
          aria-label="Fermer le menu"
          onClick={() => setOuvert(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Barre latérale. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-bordure
                    bg-surface transition-transform duration-300 lg:translate-x-0
                    ${ouvert ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Link to="/" className="flex items-center gap-2.5 border-b border-bordure px-5 py-4">
          <Logo taille={34} />
          <span className="leading-tight">
            <strong className="block font-titre text-[15px] font-bold">Envol</strong>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-faible">
              Console d'escale
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {sections.map((s) => (
            <div key={s.titre} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-faible">
                {s.titre}
              </p>
              <ul className="space-y-0.5">
                {s.liens.map((l) => {
                  const Icone = l.icone
                  return (
                    <li key={l.to}>
                      <NavLink
                        to={l.to}
                        end
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                           text-[13px] font-semibold transition ${
                            isActive
                              ? 'bg-[var(--accent-voile)] text-accent'
                              : 'text-doux hover:bg-surface-2 hover:text-texte'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Repère vertical de l'onglet courant. */}
                            <span
                              className={`absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent
                                          transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            />
                            <Icone size={17} strokeWidth={2} className="shrink-0" />
                            <span className="truncate">{l.libelle}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-bordure p-3">
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                             bg-accent text-[13px] font-bold text-white">
              {initiales(utilisateur?.nom)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{utilisateur?.nom}</span>
              <span className="block text-[11px] capitalize text-faible">{utilisateur?.role}</span>
            </span>
            <button
              onClick={deconnecter}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="shrink-0 rounded-md p-1.5 text-faible transition hover:bg-surface-3 hover:text-danger"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      {/* Colonne principale. */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[258px]">
        <header className="verre sticky top-0 z-30 flex h-16 items-center gap-3 border-b
                           border-bordure px-4 sm:px-6">
          <button
            onClick={() => setOuvert(true)}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-bordure
                       text-texte transition hover:border-bordure-forte lg:hidden"
          >
            <Menu size={18} strokeWidth={2.4} />
          </button>

          <h1 className="truncate font-titre text-base font-bold">{titre}</h1>

          <div className="ml-auto flex items-center gap-3">
            <Horloge />
            <BasculeTheme theme={theme} surBascule={surBascule} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}

function initiales(nom) {
  if (!nom) return '?'
  return nom.split(/\s+/).slice(0, 2).map((m) => m[0]?.toUpperCase() ?? '').join('')
}

/** Heure de Ouagadougou : c'est celle du terrain, pas celle du poste. */
function Horloge() {
  const [maintenant, setMaintenant] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const heure = maintenant.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Africa/Ouagadougou',
  })

  return (
    <span className="hidden items-center gap-2 rounded-lg border border-bordure bg-surface
                     px-3 py-1.5 sm:flex">
      <span className="h-1.5 w-1.5 rounded-full bg-succes animate-pulse-douce" />
      <span className="font-mono text-[13px] font-semibold tabular-nums">{heure}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-faible">OUA</span>
    </span>
  )
}
