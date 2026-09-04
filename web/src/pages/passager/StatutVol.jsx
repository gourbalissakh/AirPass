import { useState } from 'react'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, Carte, Champ, Donnee, Etiquette, Vide } from '../../composants/Ui'
import Reveal from '../../composants/Reveal'
import { enDateHeure, LIBELLE_STATUT_VOL, ville } from '../../format'

/** EF-7.1 — consultation du statut d'un vol. */
export default function StatutVol() {
  const [numero, setNumero] = useState('')
  const [vol, setVol] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [occupe, setOccupe] = useState(false)

  const chercher = async (e) => {
    e.preventDefault()
    setOccupe(true); setErreur(null); setVol(null)
    try {
      const { data } = await api.get('/vols/' + numero.trim() + '/statut')
      setVol(data)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-titre text-3xl font-extrabold tracking-tight">Statut d'un vol</h1>
        <p className="mt-2 text-doux">
          Retard, changement de porte, annulation : l'état de votre vol en direct.
        </p>
      </header>

      <Carte>
        <form onSubmit={chercher} className="flex flex-wrap items-end gap-3">
          <Champ
            label="Numéro de vol" required placeholder="2J201" className="min-w-[12rem] flex-1"
            value={numero} onChange={(e) => setNumero(e.target.value)}
          />
          <Bouton type="submit" taille="lg" chargement={occupe}>Consulter</Bouton>
        </form>
      </Carte>

      {erreur && <div className="mt-5"><Alerte ton="erreur">{erreur}</Alerte></div>}

      {vol && (
        <Reveal>
          <Carte className="mt-5" titre={`Vol ${vol.numero}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-titre text-2xl font-bold">
                  {ville(vol.origine)} → {ville(vol.destination)}
                </p>
                <p className="mt-1 text-sm text-faible">{vol.appareil}</p>
              </div>
              <Etiquette
                point={vol.statut === 'retarde' || vol.statut === 'embarquement'}
                ton={vol.statut === 'annule' ? 'danger' : vol.statut === 'retarde' ? 'or' : 'succes'}
              >
                {LIBELLE_STATUT_VOL[vol.statut]}
              </Etiquette>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-bordure pt-6">
              <Donnee label="Départ prévu" valeur={enDateHeure(vol.depart_prevu)} />
              <Donnee label="Départ estimé" valeur={enDateHeure(vol.depart_effectif)} />
              <Donnee label="Porte" valeur={vol.porte ?? '—'} accent />
              <Donnee label="Enregistrement" valeur={vol.enregistrement.message} />
            </dl>

            {vol.dernier_changement && (
              <div className="mt-6">
                <Alerte ton="avertissement" titre="Dernier changement publié">
                  {vol.dernier_changement.message}
                  <span className="mt-1.5 block text-xs opacity-75">
                    Publié le {enDateHeure(vol.dernier_changement.publie_le)}
                  </span>
                </Alerte>
              </div>
            )}
          </Carte>
        </Reveal>
      )}

      {!vol && !erreur && (
        <Carte className="mt-5">
          <Vide titre="Aucun vol consulté">
            Saisissez un numéro de vol Air Burkina, par exemple 2J201.
          </Vide>
        </Carte>
      )}
    </div>
  )
}
