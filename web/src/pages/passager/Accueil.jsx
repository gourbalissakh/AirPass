import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, Carte, CarteVedette, Champ, Compteur, Donnee, Etiquette } from '../../composants/Ui'
import HeroFond from '../../composants/HeroFond'
import Destinations from '../../composants/Destinations'
import Reveal from '../../composants/Reveal'
import { enDateHeure, LIBELLE_STATUT_VOL, ville } from '../../format'

/**
 * Page d'accueil.
 *
 * Elle porte à la fois la vitrine du service et l'entrée réelle du parcours :
 * le formulaire de recherche est dans le héros, sans redirection, parce que
 * c'est la seule chose que 90 % des visiteurs viennent faire (EF-2.1).
 */
export default function Accueil() {
  const [resultat, setResultat] = useState(null)

  return (
    <>
      <Hero resultat={resultat} setResultat={setResultat} />
      <Arguments />
      <Etapes />
      <Reseau />
      <Appel />
    </>
  )
}

/* ========================================================================== */

function Hero({ resultat, setResultat }) {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroFond />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-20 pt-12
                      sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pb-28 lg:pt-16">
        {/* Le voile posé sur la photographie est sombre dans les deux thèmes :
            on redéfinit ici les jetons de texte, dont héritent tous les
            descendants, plutôt que de repeindre chaque élément. */}
        <Reveal
          style={{
            '--texte': '#ffffff',
            '--texte-doux': '#d8e0f0',
            '--texte-faible': '#9dadc9',
          }}
        >
          <Etiquette ton="or" point>Nouveau chez Air Burkina</Etiquette>

          <h1 className="mt-5 font-titre text-[2.6rem] font-extrabold leading-[1.05] tracking-tight
                         sm:text-6xl lg:text-[4.1rem]">
            Votre vol commence
            <span className="block texte-degrade">avant l'aéroport.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-doux">
            Enregistrez-vous en ligne de 24 h à 3 h avant le départ, choisissez
            votre siège sur le plan réel de la cabine et présentez-vous au
            comptoir avec votre carte d'embarquement déjà en poche.
          </p>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            <Statistique valeur={24} suffixe=" h" label="Avant le départ" />
            <Statistique valeur={76} label="Sièges au plan" />
            <Statistique valeur={5} label="Étapes, pas plus" />
          </dl>
        </Reveal>

        <Reveal delai={140} depuis="zoom">
          <RechercheVol resultat={resultat} setResultat={setResultat} />
        </Reveal>
      </div>
    </section>
  )
}

function Statistique({ valeur, suffixe, label }) {
  return (
    <div>
      <dt className="font-titre text-3xl font-extrabold text-texte">
        <Compteur valeur={valeur} suffixe={suffixe} />
      </dt>
      <dd className="mt-1 text-xs leading-snug text-faible">{label}</dd>
    </div>
  )
}

/* ========================================================================== */

/** Module de recherche — EF-2.1, EF-1.3 (aucun compte requis). */
function RechercheVol({ resultat, setResultat }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('passeport')
  const [champs, setChamps] = useState({ numero_vol: '', numero_passeport: '', pnr: '', nom: '' })
  const [erreur, setErreur] = useState(null)
  const [occupe, setOccupe] = useState(false)

  const maj = (nom) => (e) => setChamps({ ...champs, [nom]: e.target.value })

  const corps = () =>
    mode === 'passeport'
      ? { numero_vol: champs.numero_vol, numero_passeport: champs.numero_passeport }
      : { pnr: champs.pnr, nom: champs.nom }

  const rechercher = async (e) => {
    e.preventDefault()
    setOccupe(true); setErreur(null); setResultat(null)
    try {
      const { data } = await api.post('/recherche-vol', corps())
      setResultat(data)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  const demarrer = async () => {
    if (resultat.dossier_existant) {
      navigate('/enregistrement/' + resultat.dossier_existant.jeton)
      return
    }
    setOccupe(true); setErreur(null)
    try {
      const { data } = await api.post('/enregistrement/demarrer', corps())
      navigate('/enregistrement/' + data.jeton)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setOccupe(false)
    }
  }

  return (
    <CarteVedette className="shadow-[var(--ombre-forte)]">
      <h2 className="font-titre text-xl font-bold">Retrouver mon vol</h2>
      <p className="mt-1 text-sm text-faible">
        Sans compte, sans mot de passe. Vos identifiants de voyage suffisent.
      </p>

      <div className="mt-5 flex gap-1 rounded-xl bg-surface-2 p-1">
        <Onglet actif={mode === 'passeport'} onClick={() => setMode('passeport')}>
          Vol + passeport
        </Onglet>
        <Onglet actif={mode === 'pnr'} onClick={() => setMode('pnr')}>
          Dossier + nom
        </Onglet>
      </div>

      <form onSubmit={rechercher} className="mt-5 space-y-4">
        {mode === 'passeport' ? (
          <>
            <Champ
              label="Numéro de vol" required placeholder="2J201" autoComplete="off"
              value={champs.numero_vol} onChange={maj('numero_vol')} icone={<IconeAvion />}
            />
            <Champ
              label="Numéro de passeport" required placeholder="BF1234567" autoComplete="off"
              value={champs.numero_passeport} onChange={maj('numero_passeport')} icone={<IconePiece />}
            />
          </>
        ) : (
          <>
            <Champ
              label="Numéro de dossier (PNR)" required maxLength={6} placeholder="ABC123"
              autoComplete="off" aide="Six caractères, sur votre confirmation de réservation."
              value={champs.pnr} onChange={maj('pnr')} icone={<IconePiece />}
            />
            <Champ
              label="Nom de famille" required placeholder="Traoré" autoComplete="off"
              value={champs.nom} onChange={maj('nom')} icone={<IconePersonne />}
            />
          </>
        )}

        <Bouton type="submit" taille="lg" chargement={occupe} className="w-full">
          Rechercher mon vol
        </Bouton>
      </form>

      {erreur && <div className="mt-4"><Alerte ton="erreur">{erreur}</Alerte></div>}

      {resultat && (
        <div className="mt-5 border-t border-bordure pt-5">
          <Resultat resultat={resultat} surDemarrage={demarrer} occupe={occupe} />
        </div>
      )}
    </CarteVedette>
  )
}

function Onglet({ actif, children, ...props }) {
  return (
    <button
      type="button" {...props}
      className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
        actif ? 'bg-surface text-texte shadow-[var(--ombre-douce)]' : 'text-faible hover:text-doux'
      }`}
    >
      {children}
    </button>
  )
}

function Resultat({ resultat, surDemarrage, occupe }) {
  const { vol, reservation, enregistrement, dossier_existant: dossier } = resultat
  const ouvert = enregistrement.etat === 'ouvert'

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-titre text-2xl font-extrabold">{vol.numero}</p>
          <p className="text-sm text-doux">
            {ville(vol.origine)} → {ville(vol.destination)}
          </p>
          <p className="mt-1 text-sm text-faible">{enDateHeure(vol.depart_effectif)}</p>
        </div>
        <Etiquette ton={vol.statut === 'annule' ? 'danger' : vol.statut === 'retarde' ? 'or' : 'succes'}>
          {LIBELLE_STATUT_VOL[vol.statut]}
        </Etiquette>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <Donnee label="Passager" valeur={reservation.passager} />
        <Donnee label="Dossier" valeur={reservation.pnr} />
        <Donnee label="Classe" valeur={reservation.classe === 'affaires' ? 'Affaires' : 'Économique'} />
        <Donnee label="Franchise" valeur={`${reservation.franchise.nb} × ${reservation.franchise.kg} kg`} />
      </dl>

      <div className="mt-4 space-y-3">
        <Alerte ton={ouvert ? 'succes' : 'avertissement'}>{enregistrement.message}</Alerte>

        {dossier && (
          <Alerte ton="info">
            Un dossier est déjà ouvert (référence {dossier.reference}) : vous allez le retrouver.
          </Alerte>
        )}

        <Bouton onClick={surDemarrage} taille="lg" disabled={!ouvert} chargement={occupe} className="w-full">
          {dossier ? 'Reprendre mon enregistrement' : "Commencer l'enregistrement"}
        </Bouton>
      </div>
    </div>
  )
}

/* ========================================================================== */

function Arguments() {
  const points = [
    {
      titre: 'Plus de file au comptoir',
      texte: "Votre dossier est déjà au guichet le jour du vol : l'agent le retrouve d'un scan et vous n'avez plus qu'à déposer vos bagages.",
      icone: <IconeFile />,
    },
    {
      titre: 'Le siège que vous voulez',
      texte: "Le plan interactif reflète la cabine réelle de votre appareil, avec la disponibilité à la seconde. Hublot, couloir, issue de secours : à vous de voir.",
      icone: <IconeSiege />,
    },
    {
      titre: 'Prévenu avant tout le monde',
      texte: "Retard, changement de porte, annulation : la notification part dès que l'exploitation publie le changement.",
      icone: <IconeCloche />,
    },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-5 md:grid-cols-3">
        {points.map((p, i) => (
          <Reveal key={p.titre} delai={i * 110}>
            <Carte className="h-full">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl
                               bg-[var(--accent-voile)] text-accent">
                {p.icone}
              </span>
              <h3 className="font-titre text-lg font-bold">{p.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-faible">{p.texte}</p>
            </Carte>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ========================================================================== */

function Etapes() {
  const etapes = [
    ['Retrouvez votre vol', 'Numéro de vol et passeport, ou dossier et nom de famille.'],
    ['Confirmez vos informations', "Identité, passeport et questions de sûreté."],
    ['Déclarez vos bagages', 'Nombre et poids estimé : la franchise de votre billet est rappelée.'],
    ['Choisissez votre siège', 'Sur le plan réel de la cabine, avec la disponibilité en direct.'],
    ["Recevez votre carte", "QR code à présenter au comptoir, imprimable et consultable hors ligne."],
  ]

  return (
    <section className="border-y border-bordure bg-surface transition-theme">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <Etiquette ton="accent">Le parcours</Etiquette>
          <h2 className="mt-4 max-w-2xl font-titre text-3xl font-extrabold tracking-tight sm:text-4xl">
            Cinq étapes, une dizaine de minutes.
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-bordure
                       bg-bordure sm:grid-cols-2 lg:grid-cols-5">
          {etapes.map(([titre, texte], i) => (
            <Reveal key={titre} delai={i * 90} as="li" className="bg-surface p-6">
              <span className="font-titre text-4xl font-extrabold text-[var(--accent)] opacity-30">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-titre text-base font-bold leading-snug">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-faible">{texte}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ========================================================================== */

function Reseau() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Etiquette ton="accent">Le réseau</Etiquette>
            <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight sm:text-4xl">
              Depuis Ouagadougou, vers toute la sous-région.
            </h2>
          </div>
          <Link
            to="/vol"
            className="text-sm font-semibold text-accent transition hover:text-accent-fort"
          >
            Consulter le statut d'un vol →
          </Link>
        </div>
      </Reveal>

      <Reveal delai={120}>
        <Destinations surChoix={() => navigate('/vol')} />
      </Reveal>
    </section>
  )
}

/* ========================================================================== */

function Appel() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
      <Reveal depuis="zoom">
        <div className="relative overflow-hidden rounded-3xl border border-bordure bg-surface p-10 sm:p-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
            style={{ background: 'var(--lueur-accent)' }}
          />

          <div className="relative max-w-2xl">
            <h2 className="font-titre text-3xl font-extrabold tracking-tight sm:text-4xl">
              Votre siège vous attend.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-doux">
              L'enregistrement ouvre 24 h avant le départ et ferme 3 h avant.
              Passé ce délai, seul le comptoir peut vous enregistrer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Bouton taille="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                M'enregistrer maintenant
              </Bouton>
              <Link to="/vol">
                <Bouton variante="secondaire" taille="lg">Suivre un vol</Bouton>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ==========================================================================
   Icônes — tracées à la main pour rester cohérentes entre elles.
   ========================================================================== */

const traits = {
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.9,
  strokeLinecap: 'round', strokeLinejoin: 'round',
}

function IconeAvion() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...traits} aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.6.6 0 0 0-.6 1L9 11l-3 3H4l-.8 1.6 2.6 1.6 1.6 2.6L9 19v-2l3-3 3.8 4.8a.6.6 0 0 0 1-.6Z" />
    </svg>
  )
}

function IconePiece() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...traits} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="2.2" />
      <path d="M5.5 16.5c.7-1.7 2-2.5 3.5-2.5s2.8.8 3.5 2.5M15 9h4M15 13h4" />
    </svg>
  )
}

function IconePersonne() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...traits} aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" />
    </svg>
  )
}

function IconeFile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...traits} aria-hidden="true">
      <circle cx="7" cy="6.5" r="2.4" /><path d="M3.6 15c.6-2.6 1.9-3.8 3.4-3.8S9.8 12.4 10.4 15" />
      <circle cx="17" cy="6.5" r="2.4" /><path d="M13.6 15c.6-2.6 1.9-3.8 3.4-3.8s2.8 1.2 3.4 3.8" />
      <path d="M4 19.5h16" />
    </svg>
  )
}

function IconeSiege() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...traits} aria-hidden="true">
      <path d="M7 4h5a2 2 0 0 1 2 2v7H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M14 13h3.2a2 2 0 0 1 2 2.3l-.5 3A2 2 0 0 1 16.7 20H8a3 3 0 0 1-3-3v-4" />
    </svg>
  )
}

function IconeCloche() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...traits} aria-hidden="true">
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  )
}
