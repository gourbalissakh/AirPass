import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, definirJeton, messageErreur } from '../../api'
import { Alerte, Bouton, CarteVedette, Champ } from '../../composants/Ui'
import Logo from '../../composants/Logo'
import Reveal from '../../composants/Reveal'

/** EF-1.2 — connexion du personnel Air Burkina (agents et administrateurs). */
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
    <div className="mx-auto max-w-md">
      <Reveal depuis="zoom">
        <CarteVedette>
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo taille={52} />
            <h1 className="mt-4 font-titre text-2xl font-extrabold tracking-tight">
              Espace personnel
            </h1>
            <p className="mt-1.5 text-sm text-faible">
              Réservé aux agents de comptoir et aux équipes d'exploitation.
            </p>
          </div>

          <form onSubmit={connecter} className="space-y-4">
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
        </CarteVedette>
      </Reveal>

      <p className="mt-6 text-center text-xs leading-relaxed text-faible">
        Démonstration — agent : <code className="font-mono text-doux">agent@airburkina.bf</code>
        {' · '}administrateur : <code className="font-mono text-doux">admin@airburkina.bf</code>
        <br />mot de passe : <code className="font-mono text-doux">password</code>
      </p>
    </div>
  )
}
