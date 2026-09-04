import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, PlaneTakeoff, Plus } from 'lucide-react'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, Champ, Etiquette, Selecteur, Squelette, Vide } from '../../composants/Ui'
import { FriseEnregistrement, Jauge } from '../../composants/Graphiques'
import { enDateHeure, enJourHeure, LIBELLE_STATUT_VOL } from '../../format'

/**
 * EF-9.1, EF-9.2, EF-9.3 — programme des vols.
 *
 * La liste est l'écran principal ; la création se fait dans un volet qui
 * s'ouvre à la demande, parce qu'on consulte le programme dix fois pour une
 * fois qu'on crée un vol.
 */
export default function Vols() {
  const [vols, setVols] = useState(null)
  const [types, setTypes] = useState([])
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)
  const [occupe, setOccupe] = useState(false)
  const [voletCreation, setVoletCreation] = useState(false)
  const [detail, setDetail] = useState(null)

  const charger = useCallback(async () => {
    try {
      const [v, t] = await Promise.all([
        api.get('/admin/vols'),
        api.get('/admin/types-appareil'),
      ])
      setVols(v.data.data)
      setTypes(t.data)
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  const agir = async (appel, succes) => {
    setOccupe(true); setErreur(null); setMessage(null)
    try {
      await appel()
      setMessage(succes)
      await charger()
      return true
    } catch (err) {
      setErreur(messageErreur(err))
      return false
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-doux">
          {vols ? vols.length + ' vol(s) programmé(s)' : 'Chargement…'}
        </p>
        <Bouton onClick={() => setVoletCreation(true)}>
          <Plus size={16} strokeWidth={2.4} />
          Programmer un vol
        </Bouton>
      </div>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {message && <Alerte ton="succes">{message}</Alerte>}

      {!vols ? (
        <Squelette className="h-96 rounded-2xl" />
      ) : vols.length === 0 ? (
        <section className="rounded-2xl border border-bordure bg-surface p-10">
          <Vide titre="Aucun vol programmé" icone={PlaneTakeoff}>
            Créez un premier vol : ses sièges seront générés automatiquement
            à partir du plan de cabine de l'appareil.
          </Vide>
        </section>
      ) : (
        <TableauVols
          vols={vols} occupe={occupe} agir={agir}
          detail={detail} setDetail={setDetail}
        />
      )}

      {voletCreation && (
        <VoletCreation
          types={types} occupe={occupe} agir={agir}
          surFermeture={() => setVoletCreation(false)}
        />
      )}
    </div>
  )
}

/* ========================================================================== */

function TableauVols({ vols, occupe, agir, detail, setDetail }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-bordure bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[54rem] text-sm">
          <thead>
            <tr className="border-b border-bordure text-left text-[10px] uppercase
                           tracking-[0.12em] text-faible">
              <th className="px-5 py-3 font-bold">Vol</th>
              <th className="px-3 py-3 font-bold">Départ</th>
              <th className="px-3 py-3 font-bold">Appareil</th>
              <th className="px-3 py-3 font-bold">Enregistrement</th>
              <th className="px-3 py-3 text-right font-bold">Passagers</th>
              <th className="px-5 py-3 text-right font-bold">État</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-bordure">
            {vols.map((vol) => (
              <LigneVol
                key={vol.id} vol={vol} occupe={occupe} agir={agir}
                ouvert={detail === vol.id}
                surBascule={() => setDetail(detail === vol.id ? null : vol.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LigneVol({ vol, occupe, agir, ouvert, surBascule }) {
  const taux = vol.reservations_count > 0
    ? Math.round((vol.enregistres_count / vol.reservations_count) * 100)
    : 0

  return (
    <>
      <tr
        onClick={surBascule}
        className={'cursor-pointer transition ' + (ouvert ? 'bg-surface-2' : 'hover:bg-surface-2')}
      >
        <td className="px-5 py-3.5">
          <span className="flex items-center gap-2.5">
            <ChevronRight
              size={16}
              strokeWidth={2.4}
              className={'shrink-0 text-faible transition-transform ' + (ouvert ? 'rotate-90' : '')}
            />
            <span>
              <span className="block font-titre text-[15px] font-bold">{vol.numero_vol}</span>
              <span className="block font-mono text-[11px] text-faible">
                {vol.origine} → {vol.destination}
              </span>
            </span>
          </span>
        </td>

        <td className="px-3 py-3.5">
          <span className="block text-[13px]">{enDateHeure(vol.depart_prevu)}</span>
          {vol.porte && <span className="block text-[11px] text-faible">porte {vol.porte}</span>}
        </td>

        <td className="px-3 py-3.5 text-[13px] text-doux">{vol.aircraft_type.nom}</td>

        <td className="px-3 py-3.5 text-[12px] text-faible">
          H-{vol.checkin_ouverture_h} → H-{vol.checkin_fermeture_h}
        </td>

        <td className="px-3 py-3.5 text-right">
          <span className="block font-semibold tabular-nums">
            {vol.enregistres_count}<span className="text-faible">/{vol.reservations_count}</span>
          </span>
          <span className="mt-1 flex justify-end"><Jauge valeur={taux} largeur="w-16" /></span>
        </td>

        <td className="px-5 py-3.5 text-right">
          <span className="inline-flex items-center gap-2">
            {!vol.publie && <Etiquette ton="or">Brouillon</Etiquette>}
            <Etiquette ton={vol.statut === 'annule' ? 'danger' : vol.statut === 'retarde' ? 'or' : 'succes'}>
              {LIBELLE_STATUT_VOL[vol.statut]}
            </Etiquette>
          </span>
        </td>
      </tr>

      {ouvert && (
        <tr>
          <td colSpan={6} className="bg-surface-2 px-5 py-5">
            <DetailVol vol={vol} occupe={occupe} agir={agir} />
          </td>
        </tr>
      )}
    </>
  )
}

/* ========================================================================== */

function DetailVol({ vol, occupe, agir }) {
  const depart = new Date(vol.depart_prevu)
  const ouverture = new Date(depart.getTime() - vol.checkin_ouverture_h * 3600000)
  const fermeture = new Date(depart.getTime() - vol.checkin_fermeture_h * 3600000)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border border-bordure bg-surface p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-faible">
            Fenêtre d'enregistrement en ligne
          </p>
          <FriseEnregistrement
            ouverture={ouverture.toISOString()}
            fermeture={fermeture.toISOString()}
            depart={vol.depart_prevu}
          />
          <div className="mt-1.5 flex justify-between text-[10px] text-faible">
            <span>ouvre {enJourHeure(ouverture.toISOString())}</span>
            <span>clôture {enJourHeure(fermeture.toISOString())}</span>
            <span>départ {enJourHeure(vol.depart_prevu)}</span>
          </div>
        </div>

        {!vol.publie && (
          <Alerte ton="avertissement" titre="Vol non publié">
            Les passagers ne le voient pas encore. La publication génère les
            sièges à partir du plan de cabine, puis ouvre la recherche.
            <span className="mt-3 block">
              <Bouton
                taille="sm" disabled={occupe}
                onClick={() => agir(
                  () => api.post('/admin/vols/' + vol.id + '/publier'),
                  'Vol ' + vol.numero_vol + ' publié.',
                )}
              >
                Publier ce vol
              </Bouton>
            </span>
          </Alerte>
        )}
      </div>

      <FormulaireChangement vol={vol} occupe={occupe} agir={agir} />
    </div>
  )
}

/** EF-9.3 — publication d'un changement, qui notifie les passagers (EF-7.2). */
function FormulaireChangement({ vol, occupe, agir }) {
  const [type, setType] = useState('retard')
  const [valeur, setValeur] = useState('')
  const [message, setMessage] = useState('')

  const publier = async (e) => {
    e.preventDefault()
    const ok = await agir(
      () => api.post('/admin/vols/' + vol.id + '/changement', {
        type,
        nouvelle_valeur: valeur || null,
        message: message || null,
      }),
      'Changement publié — les passagers enregistrés sont notifiés.',
    )
    if (ok) { setValeur(''); setMessage('') }
  }

  return (
    <form onSubmit={publier} className="rounded-xl border border-bordure bg-surface p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-faible">
        Publier un changement
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Selecteur label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="retard">Retard</option>
          <option value="horaire">Changement d'horaire</option>
          <option value="porte">Changement de porte</option>
          <option value="annulation">Annulation</option>
        </Selecteur>

        {type !== 'annulation' && (
          <Champ
            label={type === 'porte' ? 'Nouvelle porte' : 'Nouvel horaire'}
            type={type === 'porte' ? 'text' : 'datetime-local'}
            required placeholder={type === 'porte' ? 'C7' : ''}
            value={valeur} onChange={(e) => setValeur(e.target.value)}
          />
        )}
      </div>

      <div className="mt-3">
        <Champ
          label="Message aux passagers"
          aide="Laissez vide pour un message automatique."
          value={message} onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <Bouton type="submit" chargement={occupe}>Publier et notifier</Bouton>
      </div>
    </form>
  )
}

/* ========================================================================== */

function VoletCreation({ types, occupe, agir, surFermeture }) {
  const vide = {
    numero_vol: '', aircraft_type_id: '', origine: 'OUA', destination: '',
    depart_prevu: '', arrivee_prevue: '', porte: '',
    checkin_ouverture_h: 24, checkin_fermeture_h: 3,
  }
  const [champs, setChamps] = useState(vide)

  const maj = (nom) => (e) => setChamps({ ...champs, [nom]: e.target.value })

  const creer = async (e) => {
    e.preventDefault()
    const ok = await agir(
      () => api.post('/admin/vols', champs),
      'Vol créé, sièges générés.',
    )
    if (ok) { setChamps(vide); surFermeture() }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Fermer" onClick={surFermeture}
        className="absolute inset-0 bg-black/50"
      />

      <aside className="relative flex w-full max-w-md flex-col border-l border-bordure bg-surface
                        shadow-[var(--ombre-forte)]">
        <header className="flex items-center justify-between border-b border-bordure px-5 py-4">
          <h2 className="font-titre text-lg font-bold">Programmer un vol</h2>
          <button
            onClick={surFermeture} aria-label="Fermer"
            className="rounded-lg p-1.5 text-faible transition hover:bg-surface-2 hover:text-texte"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <form onSubmit={creer} className="flex-1 space-y-4 overflow-y-auto p-5">
          <Champ label="Numéro de vol" required placeholder="2J201"
            value={champs.numero_vol} onChange={maj('numero_vol')} />

          <Selecteur
            label="Type d'appareil" required
            value={champs.aircraft_type_id} onChange={maj('aircraft_type_id')}
            aide="Détermine le plan de cabine et le nombre de sièges créés."
          >
            <option value="">Choisir…</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.nom} — {t.nb_sieges} sièges</option>
            ))}
          </Selecteur>

          <div className="grid grid-cols-2 gap-4">
            <Champ label="Origine" required maxLength={3} value={champs.origine} onChange={maj('origine')} />
            <Champ label="Destination" required maxLength={3} placeholder="DSS"
              value={champs.destination} onChange={maj('destination')} />
          </div>

          <Champ label="Départ prévu" type="datetime-local" required
            value={champs.depart_prevu} onChange={maj('depart_prevu')} />
          <Champ label="Arrivée prévue" type="datetime-local" required
            value={champs.arrivee_prevue} onChange={maj('arrivee_prevue')} />

          <div className="grid grid-cols-3 gap-3">
            <Champ label="Porte" placeholder="B3" value={champs.porte} onChange={maj('porte')} />
            <Champ label="Ouverture" type="number" min={1} max={168} aide="h avant"
              value={champs.checkin_ouverture_h} onChange={maj('checkin_ouverture_h')} />
            <Champ label="Fermeture" type="number" min={0} max={24} aide="h avant"
              value={champs.checkin_fermeture_h} onChange={maj('checkin_fermeture_h')} />
          </div>
        </form>

        <footer className="flex gap-3 border-t border-bordure p-5">
          <Bouton variante="secondaire" onClick={surFermeture} className="flex-1">Annuler</Bouton>
          <Bouton onClick={creer} chargement={occupe} className="flex-1">Créer le vol</Bouton>
        </footer>
      </aside>
    </div>
  )
}
