import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ConciergeBell, LayoutDashboard, LockKeyhole, RadioTower, ShieldCheck } from 'lucide-react'
import { api, definirJeton, messageErreur } from '../../api'
import { Alerte, Bouton, Champ } from '../../composants/Ui'
import Logo from '../../composants/Logo'
import Reveal from '../../composants/Reveal'

/**
 * EF-1.2 — connexion du personnel Air Burkina (agents et administrateurs).
 *
 * Écran scindé : à gauche le terrain, en photographie, avec ce à quoi la
 * console donne accès ; à droite le formulaire, seul, sur fond neutre. Le
 * personnel doit voir tout de suite qu'il change d'univers — le site public
 * s'arrête ici.
 */
export default function Connexion({ surConnexion, utilisateur }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [occupe, setOccupe] = useState(false)

  if (utilisateur) {
    return <Navigate to={utilisateur.role === 'admin' ? '/admin' : '/guichet'} replace />
  }

  const connecter = async (e) => {
    e.preventDefault()
    setOccupe(true); setErreur(null)
    try {
      const { data } = await api.post('/auth/connexion', { email, password: motDePasse })
      definirJeton(data.jeton)
      surConnexion(data.utilisateur)
      navigate(data.utilisateur.role === 'admin' ? '/admin' : '/guichet')
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[1.05fr_1fr]">
      <Vitrine />

      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <Reveal className="w-full max-w-sm" depuis="droite">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl
                           bg-[var(--accent-voile)] text-accent">
            <LockKeyhole size={22} strokeWidth={2} />
          </span>

          <h1 className="mt-6 font-titre text-3xl font-extrabold tracking-tight">
            Espace personnel
          </h1>
          <p className="mt-2.5 leading-relaxed text-faible">
            Réservé aux agents de comptoir et aux équipes d'exploitation
            d'Air Burkina.
          </p>

          <form onSubmit={connecter} className="mt-8 space-y-4">
            <Champ
              label="Adresse e-mail" type="email" required autoComplete="username"
              placeholder="agent@airburkina.bf"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <Champ
              label="Mot de passe" type="password" required autoComplete="current-password"
              value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
            />
            <Bouton type="submit" taille="lg" chargement={occupe} className="w-full">
              Se connecter
            </Bouton>
          </form>

          {erreur && <div className="mt-4"><Alerte ton="erreur">{erreur}</Alerte></div>}

          <ComptesDemo />
        </Reveal>
      </div>
    </div>
  )
}

/* ========================================================================== */

const ACCES = [
  { icone: ConciergeBell,    titre: "Comptoir d'enregistrement",
    texte: 'Scan du QR, pesée des bagages, changement de siège, embarquement.' },
  { icone: LayoutDashboard,  titre: 'Tableau de bord',
    texte: "Taux d'enregistrement en ligne, fenêtres qui se clôturent, journal." },
  { icone: RadioTower,       titre: 'Programme des vols',
    texte: 'Création, retard, changement de porte, annulation — et notification.' },
]

function Vitrine() {
  return (
    <aside className="grain relative isolate hidden overflow-hidden lg:flex lg:items-center">
      <img
        src="/images/aeroport/comptoir.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '50% 50%' }}
      />
      <span
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, var(--voile-fort) 0%, var(--voile-fort) 45%, var(--voile-doux) 100%)',
        }}
      />

      <div className="sur-photo relative w-full px-10 py-16 xl:px-16">
        <Logo taille={44} />

        <p className="mt-8 max-w-md font-titre text-[2.5rem] font-extrabold leading-[1.08]
                      tracking-tight text-texte">
          La console d'escale
          <span className="block texte-degrade">d'Air Burkina.</span>
        </p>

        <ul className="mt-10 max-w-md space-y-5">
          {ACCES.map((a) => {
            const Icone = a.icone
            return (
              <li key={a.titre} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center
                                 rounded-xl border border-white/20 bg-white/10 text-or
                                 backdrop-blur-sm">
                  <Icone size={18} strokeWidth={2} />
                </span>
                <span>
                  <span className="block font-titre text-[15px] font-bold text-texte">{a.titre}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-doux">{a.texte}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <p className="mt-12 flex items-center gap-2 text-xs text-faible">
          <ShieldCheck size={15} strokeWidth={2} />
          Toutes les actions du personnel sont journalisées et horodatées.
        </p>
      </div>
    </aside>
  )
}

function ComptesDemo() {
  const comptes = [
    ['Agent de comptoir', 'agent@airburkina.bf'],
    ['Administrateur', 'admin@airburkina.bf'],
  ]

  return (
    <div className="mt-10 rounded-xl border border-dashed border-bordure-forte bg-surface-2 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-faible">
        Comptes de démonstration
      </p>
      <dl className="mt-3 space-y-1.5">
        {comptes.map(([role, mail]) => (
          <div key={mail} className="flex items-baseline justify-between gap-3 text-[12px]">
            <dt className="text-faible">{role}</dt>
            <dd className="font-mono text-doux">{mail}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-bordure pt-1.5 text-[12px]">
          <dt className="text-faible">Mot de passe</dt>
          <dd className="font-mono text-doux">password</dd>
        </div>
      </dl>
    </div>
  )
}
