import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Pencil, Printer, QrCode } from 'lucide-react'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, EnTetePage, Squelette } from '../../composants/Ui'
import CarteEmbarquement from '../../composants/CarteEmbarquement'
import Reveal from '../../composants/Reveal'

/**
 * EF-6.1, EF-6.4 — affichage et impression de la carte d'embarquement.
 *
 * La carte est aussi conservée en local : le passager la retrouve même sans
 * réseau à l'aéroport (exigence non fonctionnelle « Connectivité limitée »).
 */
export default function CartePage() {
  const { jeton } = useParams()
  const navigate = useNavigate()
  const [carte, setCarte] = useState(null)
  const [horsLigne, setHorsLigne] = useState(false)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    const cle = 'envol.carte.' + jeton

    api.get('/enregistrement/' + jeton)
      .then(({ data }) => {
        setCarte(data)
        try { localStorage.setItem(cle, JSON.stringify(data)) } catch { /* quota */ }
      })
      .catch((err) => {
        const cache = localStorage.getItem(cle)
        if (cache) { setCarte(JSON.parse(cache)); setHorsLigne(true) }
        else setErreur(messageErreur(err))
      })
  }, [jeton])

  if (erreur) return <Alerte ton="erreur" titre="Carte indisponible">{erreur}</Alerte>
  if (!carte) return <Squelette className="mx-auto h-96 w-full max-w-2xl rounded-2xl" />

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sans-impression">
        <EnTetePage icone={QrCode} surtitre="Prêt à embarquer" titre="Votre carte d'embarquement">
          Présentez ce QR code au comptoir Air Burkina, puis à l'embarquement.
        </EnTetePage>

        {horsLigne && (
          <div className="mt-5">
            <Alerte ton="avertissement" titre="Vous êtes hors ligne">
              Cette carte provient de la copie enregistrée sur cet appareil.
              Les changements de vol récents peuvent ne pas y figurer.
            </Alerte>
          </div>
        )}
      </div>

      <Reveal depuis="zoom">
        <CarteEmbarquement carte={carte} />
      </Reveal>

      <div className="sans-impression mt-8 flex flex-wrap gap-3">
        <Bouton taille="lg" onClick={() => window.print()}>
          <Printer size={17} strokeWidth={2.2} />
          Imprimer
        </Bouton>
        <Bouton variante="secondaire" taille="lg" onClick={() => navigate('/enregistrement/' + jeton)}>
          <Pencil size={16} strokeWidth={2.2} />
          Modifier mon enregistrement
        </Bouton>
        <Link
          to="/vol"
          className="inline-flex h-13 items-center gap-1.5 px-4 text-sm font-semibold text-accent
                     transition hover:gap-2.5 hover:text-accent-fort"
        >
          Suivre mon vol
          <ArrowRight size={16} strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  )
}
