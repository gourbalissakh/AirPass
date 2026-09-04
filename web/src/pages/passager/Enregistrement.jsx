import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, messageErreur } from '../../api'
import { Alerte, Bascule, Bouton, Carte, Champ, Donnee, Etiquette, FilEtapes, Squelette } from '../../composants/Ui'
import PlanCabine from '../../composants/PlanCabine'
import Reveal from '../../composants/Reveal'
import { enDateHeure, ville } from '../../format'

const ETAPES = ['Informations', 'Bagages', 'Siège', 'Confirmation']

/**
 * Modules 6.3 à 6.6 — parcours d'enregistrement.
 *
 * L'exigence non fonctionnelle « Ergonomie » demande un parcours en moins de
 * cinq étapes : la recherche du vol est la première, les quatre suivantes
 * sont ici.
 */
export default function Enregistrement() {
  const { jeton } = useParams()
  const navigate = useNavigate()

  const [etape, setEtape] = useState(0)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [occupe, setOccupe] = useState(false)

  const charger = useCallback(async () => {
    try {
      const { data } = await api.get('/enregistrement/' + jeton)
      setDossier(data)
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }, [jeton])

  useEffect(() => { charger() }, [charger])

  if (erreur && !dossier) return <Alerte ton="erreur" titre="Dossier introuvable">{erreur}</Alerte>
  if (!dossier) return <ChargementDossier />

  // Un dossier déjà finalisé ouvre directement sur le récapitulatif.
  if ((dossier.statut === 'enregistre' || dossier.statut === 'embarque') && etape !== 3) {
    setEtape(3)
  }

  const contexte = { jeton, dossier, setDossier, setErreur, occupe, setOccupe, charger }

  return (
    <div className="mx-auto max-w-3xl">
      <EnTeteVol dossier={dossier} />
      <FilEtapes etapes={ETAPES} courante={etape} />

      {etape === 0 && <EtapeInformations {...contexte} suivant={() => setEtape(1)} />}
      {etape === 1 && <EtapeBagages {...contexte} suivant={() => setEtape(2)} precedent={() => setEtape(0)} />}
      {etape === 2 && <EtapeSiege {...contexte} suivant={() => setEtape(3)} precedent={() => setEtape(1)} />}
      {etape === 3 && <EtapeConfirmation {...contexte} surAnnulation={() => navigate('/')} />}

      {erreur && <div className="mt-6"><Alerte ton="erreur">{erreur}</Alerte></div>}
    </div>
  )
}

function ChargementDossier() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Squelette className="h-24 w-full rounded-2xl" />
      <Squelette className="h-8 w-2/3 rounded-lg" />
      <Squelette className="h-72 w-full rounded-2xl" />
    </div>
  )
}

function EnTeteVol({ dossier }) {
  const vol = dossier.vol

  return (
    <div
      className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5 text-white"
      style={{ background: 'linear-gradient(115deg, var(--accent-fort), var(--accent) 55%, var(--or))' }}
    >
      <div>
        <p className="font-titre text-xl font-extrabold">
          {vol.numero} · {ville(vol.origine)} → {ville(vol.destination)}
        </p>
        <p className="mt-0.5 text-sm opacity-90">{enDateHeure(vol.depart_effectif)}</p>
      </div>
      <p className="text-sm">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-85">Référence</span>
        <span className="font-mono text-base font-bold">{dossier.reference}</span>
      </p>
    </div>
  )
}

/* ========================================================================== */

/** EF-3.2, EF-3.3 */
function EtapeInformations({ jeton, dossier, setDossier, setErreur, occupe, setOccupe, suivant }) {
  const [champs, setChamps] = useState({
    nationalite: '', numero_passeport: '', passeport_expiration: '',
    date_naissance: '', email: '', telephone: '',
  })
  const [surete, setSurete] = useState(false)

  const maj = (nom) => (e) => setChamps({ ...champs, [nom]: e.target.value })

  const valider = async (e) => {
    e.preventDefault()
    setOccupe(true); setErreur(null)
    try {
      const utiles = Object.fromEntries(Object.entries(champs).filter(([, v]) => v !== ''))
      const { data } = await api.patch('/enregistrement/' + jeton + '/informations', {
        ...utiles,
        securite_confirmee: surete,
      })
      setDossier(data)
      suivant()
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <Reveal>
      <Carte titre="Vos informations de voyage">
        <p className="mb-6 text-sm leading-relaxed text-faible">
          Vérifiez et complétez les informations exigées pour{' '}
          <strong className="text-texte">{dossier.passager.nom_complet}</strong>.
          Les champs déjà connus d'Air Burkina peuvent rester vides.
        </p>

        <form onSubmit={valider} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Date de naissance" type="date" value={champs.date_naissance} onChange={maj('date_naissance')} />
            <Champ label="Nationalité" maxLength={3} placeholder="BFA" aide="Code pays à 3 lettres."
              value={champs.nationalite} onChange={maj('nationalite')} />
            <Champ label="Numéro de passeport" placeholder="BF1234567"
              value={champs.numero_passeport} onChange={maj('numero_passeport')} />
            <Champ label="Expiration du passeport" type="date"
              value={champs.passeport_expiration} onChange={maj('passeport_expiration')} />
            <Champ label="Adresse e-mail" type="email" aide="Pour recevoir les alertes de vol."
              value={champs.email} onChange={maj('email')} />
            <Champ label="Téléphone" placeholder="+226…" aide="Pour les alertes par SMS."
              value={champs.telephone} onChange={maj('telephone')} />
          </div>

          <Bascule
            required
            checked={surete}
            onChange={(e) => setSurete(e.target.checked)}
            label="Je confirme les questions de sûreté."
            description="J'ai préparé mes bagages moi-même, je ne transporte aucun objet interdit et je n'ai accepté aucun colis d'un tiers."
          />

          <Bouton type="submit" taille="lg" chargement={occupe} className="w-full">
            Continuer
          </Bouton>
        </form>
      </Carte>
    </Reveal>
  )
}

/* ========================================================================== */

/** EF-5.1, EF-5.2, EF-5.3 */
function EtapeBagages({ jeton, dossier, setErreur, occupe, setOccupe, charger, suivant, precedent }) {
  const [nb, setNb] = useState(dossier.bagages.nb ?? 0)
  const [poids, setPoids] = useState(dossier.bagages.poids_estime ?? 0)
  const [franchise, setFranchise] = useState(null)
  const [depassement, setDepassement] = useState(null)
  // EF-5.3 : le dépassement n'est pas bloquant, mais doit avoir été lu une fois.
  const [avertissementVu, setAvertissementVu] = useState(false)

  const enregistrer = async (e) => {
    e.preventDefault()
    setOccupe(true); setErreur(null)
    try {
      const { data } = await api.post('/enregistrement/' + jeton + '/bagages', {
        nb: Number(nb), poids_estime: Number(poids),
      })
      setFranchise(data.franchise)
      setDepassement(data.depassement)
      await charger()

      if (!data.depassement || avertissementVu) suivant()
      else setAvertissementVu(true)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <Reveal>
      <Carte titre="Vos bagages en soute">
        <form onSubmit={enregistrer} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nombre de bagages" type="number" min={0} max={9} required
              value={nb} onChange={(e) => setNb(e.target.value)} />
            <Champ label="Poids total estimé (kg)" type="number" min={0} max={200} step="0.5" required
              value={poids} onChange={(e) => setPoids(e.target.value)} />
          </div>

          {franchise && (
            <Alerte ton="info" titre="Franchise incluse dans votre billet">
              {franchise.nb_autorise} bagage(s) de {franchise.kg_par_piece} kg,
              soit {franchise.poids_total_autorise} kg au total.
            </Alerte>
          )}

          {depassement && (
            <Alerte ton="avertissement" titre="Franchise dépassée">
              {depassement.message}
              {depassement.pieces_en_trop > 0 && <> ({depassement.pieces_en_trop} pièce(s) en trop)</>}
              {depassement.kg_en_trop > 0 && <> ({depassement.kg_en_trop} kg en trop)</>}
            </Alerte>
          )}

          <div className="flex gap-3">
            <Bouton variante="secondaire" taille="lg" type="button" onClick={precedent}>
              Retour
            </Bouton>
            <Bouton type="submit" taille="lg" chargement={occupe} className="flex-1">
              {depassement && !avertissementVu ? "J'ai compris, continuer" : 'Continuer'}
            </Bouton>
          </div>
        </form>
      </Carte>
    </Reveal>
  )
}

/* ========================================================================== */

/** EF-4.1 à EF-4.5 */
function EtapeSiege({ jeton, setErreur, occupe, setOccupe, charger, suivant, precedent }) {
  const [cabine, setCabine] = useState(null)
  const [selection, setSelection] = useState(null)

  const chargerCabine = useCallback(async () => {
    try {
      const { data } = await api.get('/enregistrement/' + jeton + '/cabine')
      setCabine(data)
      setSelection(data.sieges.find((s) => s.statut === 'selectionne')?.code ?? null)
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }, [jeton, setErreur])

  useEffect(() => { chargerCabine() }, [chargerCabine])

  const choisir = async (code) => {
    setOccupe(true); setErreur(null)
    try {
      await api.post('/enregistrement/' + jeton + '/siege', { code })
      setSelection(code)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      // Le plan a pu changer entre-temps : on le recharge dans tous les cas.
      await chargerCabine()
      setOccupe(false)
    }
  }

  const continuer = async () => { await charger(); suivant() }

  if (!cabine) {
    return (
      <Carte titre="Choix du siège">
        <Squelette className="mx-auto h-[30rem] w-[22rem] rounded-3xl" />
      </Carte>
    )
  }

  return (
    <Reveal>
      <Carte titre={`Choix du siège — ${cabine.avion.nom}`}>
        <p className="mb-6 text-sm leading-relaxed text-faible">
          Sélectionnez un siège disponible. Sans choix de votre part, un siège
          vous sera attribué automatiquement à la confirmation.
        </p>

        <PlanCabine
          plan={cabine.plan} sieges={cabine.sieges}
          selection={selection} surChoix={choisir} occupe={occupe}
        />

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-bordure pt-6">
          <Bouton variante="secondaire" onClick={precedent}>Retour</Bouton>
          <p className="flex-1 text-sm">
            {selection ? (
              <span className="inline-flex items-center gap-2">
                Siège retenu
                <Etiquette ton="accent">{selection}</Etiquette>
              </span>
            ) : (
              <span className="text-faible">Aucun siège sélectionné</span>
            )}
          </p>
          <Bouton onClick={continuer} chargement={occupe}>Continuer</Bouton>
        </div>
      </Carte>
    </Reveal>
  )
}

/* ========================================================================== */

/** EF-6.1, EF-3.5 */
function EtapeConfirmation({ jeton, dossier, setDossier, setErreur, occupe, setOccupe, surAnnulation }) {
  const navigate = useNavigate()
  const finalise = dossier.statut === 'enregistre' || dossier.statut === 'embarque'

  const finaliser = async () => {
    setOccupe(true); setErreur(null)
    try {
      const { data } = await api.post('/enregistrement/' + jeton + '/finaliser')
      setDossier(data)
      navigate('/carte/' + jeton)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  const annuler = async () => {
    setOccupe(true); setErreur(null)
    try {
      await api.delete('/enregistrement/' + jeton)
      surAnnulation()
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <Reveal>
      <Carte titre="Récapitulatif">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Donnee label="Passager" valeur={dossier.passager.nom_complet} />
          <Donnee label="Vol" valeur={dossier.vol.numero} />
          <Donnee label="Siège" valeur={dossier.siege ?? 'Attribué automatiquement'} accent={!!dossier.siege} />
          <Donnee label="Porte" valeur={dossier.vol.porte ?? '—'} />
          <Donnee
            label="Bagages déclarés"
            valeur={`${dossier.bagages.nb} pièce(s) · ${dossier.bagages.poids_estime} kg`}
          />
          <Donnee label="Départ" valeur={enDateHeure(dossier.vol.depart_effectif)} />
        </dl>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-bordure pt-6">
          {finalise ? (
            <>
              <Bouton taille="lg" onClick={() => navigate('/carte/' + jeton)} className="flex-1">
                Voir ma carte d'embarquement
              </Bouton>
              <Bouton variante="danger" taille="lg" onClick={annuler} chargement={occupe}>
                Annuler mon enregistrement
              </Bouton>
            </>
          ) : (
            <Bouton taille="lg" onClick={finaliser} chargement={occupe} className="w-full">
              Finaliser et obtenir ma carte d'embarquement
            </Bouton>
          )}
        </div>
      </Carte>
    </Reveal>
  )
}
