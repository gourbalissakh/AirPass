import { useEffect, useRef, useState } from 'react'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, Champ, Etiquette, Vide } from '../../composants/Ui'
import { enDateHeure, enHeure, initiales, LIBELLE_STATUT_DOSSIER, ville } from '../../format'

/**
 * Module 6.8 — poste de l'agent au comptoir.
 *
 * Un seul champ de saisie accepte tout : nom, numéro de vol, PNR, référence
 * Envol ou contenu d'un QR code scanné (EF-8.1). Le reste de l'écran est
 * un volet maître-détail : la file à gauche, le dossier ouvert à droite.
 */
export default function Guichet() {
  const champRecherche = useRef(null)
  const [requete, setRequete] = useState('')
  const [resultats, setResultats] = useState(null)
  const [dossier, setDossier] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [message, setMessage] = useState(null)
  const [occupe, setOccupe] = useState(false)

  // Le lecteur de code-barres tape puis envoie Entrée : le champ doit être
  // prêt en permanence. « / » y ramène le curseur depuis n'importe où.
  useEffect(() => {
    const surTouche = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        champRecherche.current?.focus()
      }
      if (e.key === 'Escape') setDossier(null)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [])

  const rechercher = async (e) => {
    e?.preventDefault()
    if (!requete.trim()) return
    setOccupe(true); setErreur(null); setMessage(null); setDossier(null)
    try {
      const { data } = await api.get('/guichet/recherche', { params: { q: requete } })
      setResultats(data)
      // Un scan ne renvoie qu'un dossier : on l'ouvre sans clic supplémentaire.
      if (data.enregistrements.length === 1 && data.non_enregistres.length === 0) {
        await ouvrir(data.enregistrements[0].reference)
      }
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  const ouvrir = async (reference) => {
    setErreur(null)
    try {
      const { data } = await api.get('/guichet/' + reference)
      setDossier({ reference, ...data })
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }

  const agir = async (appel, succes) => {
    setOccupe(true); setErreur(null); setMessage(null)
    try {
      await appel()
      setMessage(succes)
      await ouvrir(dossier.reference)
      await rafraichirListe()
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  const rafraichirListe = async () => {
    if (!requete.trim()) return
    try {
      const { data } = await api.get('/guichet/recherche', { params: { q: requete } })
      setResultats(data)
    } catch { /* la liste peut rester en l'état */ }
  }

  return (
    <div className="space-y-5">
      <BarreRecherche
        champRef={champRecherche}
        requete={requete} setRequete={setRequete}
        surRecherche={rechercher} occupe={occupe}
      />

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {message && <Alerte ton="succes">{message}</Alerte>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Liste resultats={resultats} ouverte={dossier?.reference} surOuverture={ouvrir} />
        <Detail dossier={dossier} occupe={occupe} agir={agir} />
      </div>
    </div>
  )
}

/* ========================================================================== */

function BarreRecherche({ champRef, requete, setRequete, surRecherche, occupe }) {
  return (
    <form
      onSubmit={surRecherche}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-bordure
                 bg-surface p-3 shadow-[var(--ombre-douce)]"
    >
      <span className="relative min-w-[16rem] flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faible">
          <IconeScan />
        </span>
        <input
          ref={champRef}
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          autoFocus
          placeholder="Scannez la carte, ou saisissez un nom, un vol, un PNR…"
          className="h-14 w-full rounded-xl border border-transparent bg-surface-2 pl-12 pr-20
                     text-[15px] text-texte outline-none transition
                     placeholder:text-faible focus:border-accent focus:bg-surface
                     focus:ring-4 focus:ring-[var(--anneau)]"
        />
        <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2
                        rounded border border-bordure bg-surface px-1.5 py-0.5 font-mono
                        text-[10px] text-faible sm:block">
          /
        </kbd>
      </span>

      <Bouton type="submit" taille="lg" chargement={occupe} className="h-14 px-8">
        Rechercher
      </Bouton>
    </form>
  )
}

/* ========================================================================== */

function Liste({ resultats, ouverte, surOuverture }) {
  if (!resultats) {
    return (
      <section className="rounded-2xl border border-bordure bg-surface p-8">
        <Vide titre="Prêt à scanner">
          Passez la carte d'embarquement devant le lecteur, ou tapez un nom.
          La touche <kbd className="rounded border border-bordure px-1 font-mono text-[11px]">/</kbd>
          {' '}ramène le curseur dans le champ à tout moment.
        </Vide>
      </section>
    )
  }

  const { enregistrements, non_enregistres: attente } = resultats
  const total = enregistrements.length + attente.length

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-bordure bg-surface p-8">
        <Vide titre="Aucun passager trouvé">
          Vérifiez l'orthographe, ou essayez le numéro de dossier plutôt que le nom.
        </Vide>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-bordure bg-surface">
      <header className="flex items-center justify-between border-b border-bordure px-5 py-3">
        <h2 className="font-titre text-[13px] font-bold uppercase tracking-[0.12em] text-doux">
          File d'attente
        </h2>
        <span className="flex gap-2 text-[11px]">
          <Etiquette ton="succes">{enregistrements.length} enregistré(s)</Etiquette>
          {attente.length > 0 && <Etiquette>{attente.length} à traiter</Etiquette>}
        </span>
      </header>

      <ul className="max-h-[34rem] divide-y divide-bordure overflow-y-auto">
        {enregistrements.map((r) => (
          <li key={r.reference}>
            <button
              onClick={() => surOuverture(r.reference)}
              className={'flex w-full items-center gap-3 px-4 py-3 text-left transition ' +
                (ouverte === r.reference
                  ? 'bg-[var(--accent-voile)]'
                  : 'hover:bg-surface-2')}
            >
              <Pastille nom={r.passager} statut={r.statut} />

              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.passager}</span>
                <span className="block truncate text-[11px] text-faible">
                  {r.vol} · {enHeure(r.depart)} · {r.pnr}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span className="block font-titre text-base font-bold text-accent">
                  {r.siege ?? '—'}
                </span>
                <span className="block text-[10px] text-faible">
                  {r.bagages_nb} bagage(s)
                </span>
              </span>
            </button>
          </li>
        ))}

        {attente.map((r) => (
          <li key={r.pnr} className="flex items-center gap-3 px-4 py-3 opacity-70">
            <Pastille nom={r.passager} statut="attente" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-doux">{r.passager}</span>
              <span className="block truncate text-[11px] text-faible">
                {r.vol} · {enHeure(r.depart)} · {r.pnr}
              </span>
            </span>
            <Etiquette>Non enregistré</Etiquette>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Pastille({ nom, statut }) {
  const couleur = {
    embarque: 'bg-succes',
    enregistre: 'bg-accent',
    en_cours: 'bg-or',
    annule: 'bg-danger',
    attente: 'bg-surface-3 text-doux',
  }[statut] ?? 'bg-surface-3'

  return (
    <span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' +
                     'text-[13px] font-bold text-white ' + couleur}>
      {initiales(nom)}
    </span>
  )
}

/* ========================================================================== */

function Detail({ dossier, occupe, agir }) {
  if (!dossier) {
    return (
      <section className="hidden rounded-2xl border border-dashed border-bordure
                          bg-surface/50 p-10 xl:block">
        <Vide titre="Aucun dossier ouvert">
          Sélectionnez un passager à gauche pour voir son siège, ses bagages
          déclarés et les actions du comptoir.
        </Vide>
      </section>
    )
  }

  const carte = dossier.carte
  const embarque = carte.statut === 'embarque'

  return (
    <section className="overflow-hidden rounded-2xl border border-bordure bg-surface">
      {/* Résumé façon souche de carte d'embarquement. */}
      <header
        className="px-5 py-4 text-white"
        style={{ background: 'linear-gradient(110deg, var(--accent-fort), var(--accent) 55%, var(--or))' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-85">
              {carte.vol.numero} · {ville(carte.vol.origine)} → {ville(carte.vol.destination)}
            </p>
            <p className="truncate font-titre text-2xl font-extrabold">
              {carte.passager.nom_complet}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-85">Dossier</p>
            <p className="font-mono text-base font-bold">{carte.reference}</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-4 gap-3">
          <Case label="Siège" valeur={carte.siege ?? '—'} vedette />
          <Case label="Porte" valeur={carte.vol.porte ?? '—'} vedette />
          <Case label="Départ" valeur={enHeure(carte.vol.depart_effectif)} />
          <Case label="Classe" valeur={carte.classe === 'affaires' ? 'Affaires' : 'Écon.'} />
        </dl>
      </header>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Etiquette
            point={!embarque}
            ton={embarque ? 'succes' : carte.statut === 'annule' ? 'danger' : 'accent'}
          >
            {LIBELLE_STATUT_DOSSIER[carte.statut]}
          </Etiquette>
          <span className="text-[12px] text-faible">
            Vol du {enDateHeure(carte.vol.depart_prevu)}
          </span>
        </div>

        <Bagages dossier={dossier} />

        {dossier.depassement && (
          <Alerte ton="avertissement" titre="Franchise dépassée">
            {dossier.depassement.pieces_en_trop} pièce(s) et {dossier.depassement.kg_en_trop} kg
            en trop — un supplément est à percevoir avant embarquement.
          </Alerte>
        )}

        <ActionsComptoir carte={carte} occupe={occupe} agir={agir} embarque={embarque} />
      </div>
    </section>
  )
}

function Case({ label, valeur, vedette }) {
  return (
    <div>
      <dt className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-80">{label}</dt>
      <dd className={vedette ? 'font-titre text-xl font-extrabold' : 'text-sm font-semibold'}>
        {valeur}
      </dd>
    </div>
  )
}

/** EF-5.4 puis EF-8.3 : ce que le passager a déclaré, puis ce qui est pesé. */
function Bagages({ dossier }) {
  const carte = dossier.carte
  const peses = dossier.bagages_peses ?? []
  const poidsReel = peses.reduce((s, b) => s + Number(b.poids_reel), 0)

  return (
    <div className="rounded-xl border border-bordure bg-surface-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-faible">Bagages</h3>
        <span className="text-[12px] text-faible">
          franchise {dossier.franchise.nb_autorise} × {dossier.franchise.kg_par_piece} kg
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-faible">Déclarés en ligne</p>
          <p className="font-titre text-lg font-bold tabular-nums">
            {carte.bagages.nb} <span className="text-sm font-semibold text-doux">
              pièce(s) · {carte.bagages.poids_estime} kg
            </span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-faible">Pesés au comptoir</p>
          <p className="font-titre text-lg font-bold tabular-nums">
            {peses.length} <span className="text-sm font-semibold text-doux">
              pièce(s) · {poidsReel.toFixed(1)} kg
            </span>
          </p>
        </div>
      </div>

      {peses.length > 0 && (
        <ul className="mt-3 space-y-1">
          {peses.map((b) => (
            <li key={b.etiquette}
              className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5">
              <span className="font-mono text-[11px] text-doux">{b.etiquette}</span>
              <span className="text-[13px] font-semibold tabular-nums">{b.poids_reel} kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ActionsComptoir({ carte, occupe, agir, embarque }) {
  const [poids, setPoids] = useState('')
  const [siege, setSiege] = useState('')

  const peser = () => agir(
    () => api.post('/guichet/' + carte.reference + '/bagage', { poids_reel: Number(poids) }),
    'Bagage étiqueté.',
  ).then(() => setPoids(''))

  const attribuer = () => agir(
    () => api.post('/guichet/' + carte.reference + '/siege', { code: siege }),
    'Siège modifié.',
  ).then(() => setSiege(''))

  return (
    <div className="space-y-4 border-t border-bordure pt-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <Champ
            label="Peser un bagage" type="number" step="0.1" min="0" placeholder="kg"
            className="flex-1" value={poids} onChange={(e) => setPoids(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && poids) { e.preventDefault(); peser() } }}
          />
          <Bouton variante="secondaire" disabled={occupe || !poids} onClick={peser}>
            Étiqueter
          </Bouton>
        </div>

        <div className="flex items-end gap-2">
          <Champ
            label="Changer de siège" placeholder="12A" className="flex-1"
            value={siege} onChange={(e) => setSiege(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && siege) { e.preventDefault(); attribuer() } }}
          />
          <Bouton variante="secondaire" disabled={occupe || !siege} onClick={attribuer}>
            Attribuer
          </Bouton>
        </div>
      </div>

      <Bouton
        taille="lg" className="w-full"
        disabled={occupe || carte.statut !== 'enregistre'}
        onClick={() => agir(
          () => api.post('/guichet/' + carte.reference + '/embarquer'),
          "Passager admis à l'embarquement.",
        )}
      >
        {embarque ? 'Déjà embarqué' : "Valider l'embarquement"}
      </Bouton>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function IconeScan() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" />
      <path d="M7 12h10" />
    </svg>
  )
}
