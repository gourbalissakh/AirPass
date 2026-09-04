import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Armchair, BadgeCheck, BellRing, Clock, IdCard, Luggage,
  MapPin, PlaneTakeoff, QrCode, ScanLine, Sparkles, UserRound,
} from 'lucide-react'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, CarteVedette, Champ, Compteur, Donnee, Etiquette } from '../../composants/Ui'
import HeroMedia from '../../composants/HeroMedia'
import Bandeau from '../../composants/Bandeau'
import Galerie from '../../composants/Galerie'
import CarteReseau from '../../composants/CarteReseau'
import BandeauImmersif from '../../composants/BandeauImmersif'
import Destinations from '../../composants/Destinations'
import Reveal from '../../composants/Reveal'
import { AEROPORT, BURKINA, CABINE, RUBAN } from '../../medias'
import { enDateHeure, LIBELLE_STATUT_VOL, ville } from '../../format'

/**
 * Page d'accueil.
 *
 * Elle porte à la fois la vitrine du service et l'entrée réelle du parcours :
 * le formulaire de recherche est dans le héros, sans redirection, parce que
 * c'est la seule chose que 90 % des visiteurs viennent faire (EF-2.1). Tout
 * ce qui suit sert à convaincre les 10 % restants.
 */
export default function Accueil() {
  const [resultat, setResultat] = useState(null)

  return (
    <>
      <Hero resultat={resultat} setResultat={setResultat} />
      <Ruban />
      <Promesses />
      <Parcours />
      <Cabine />
      <Reseau />
      <Immersion />
      <Decouvrir />
      <Appel />
    </>
  )
}

/* ==========================================================================
   Héros
   ========================================================================== */

function Hero({ resultat, setResultat }) {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroMedia />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-24 pt-14
                      sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pb-32 lg:pt-20">
        {/* `sur-photo` bascule les jetons de couleur en version « nuit » :
            le voile posé sur le média est sombre dans les deux thèmes. */}
        <Reveal className="sur-photo">
          <Etiquette ton="or" point>Nouveau chez Air Burkina</Etiquette>

          <h1 className="mt-5 font-titre text-[2.7rem] font-extrabold leading-[1.02] tracking-tight
                         sm:text-6xl lg:text-[4.3rem]">
            L'envol commence
            <span className="block texte-degrade">bien avant l'aéroport.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-doux">
            Enregistrez-vous de 24 h à 3 h avant le départ, choisissez votre
            siège sur le plan réel de la cabine, et présentez-vous au comptoir
            avec votre carte d'embarquement déjà en poche.
          </p>

          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4">
            <Statistique valeur={24} suffixe=" h" label="Avant le départ" />
            <Statistique valeur={76} label="Sièges au plan" />
            <Statistique valeur={6} label="Destinations" />
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
      <dt className="font-titre text-[2rem] font-extrabold leading-none text-texte">
        <Compteur valeur={valeur} suffixe={suffixe} />
      </dt>
      <dd className="mt-1.5 text-xs leading-snug text-faible">{label}</dd>
    </div>
  )
}

/* ==========================================================================
   Recherche de vol — EF-2.1, EF-1.3 (aucun compte requis)
   ========================================================================== */

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
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                         bg-[var(--accent-voile)] text-accent">
          <PlaneTakeoff size={21} strokeWidth={2} />
        </span>
        <div>
          <h2 className="font-titre text-xl font-extrabold">Retrouver mon vol</h2>
          <p className="mt-0.5 text-sm text-faible">
            Sans compte, sans mot de passe. Vos identifiants de voyage suffisent.
          </p>
        </div>
      </div>

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
              value={champs.numero_vol} onChange={maj('numero_vol')}
              icone={<PlaneTakeoff size={17} strokeWidth={1.9} />}
            />
            <Champ
              label="Numéro de passeport" required placeholder="BF1234567" autoComplete="off"
              value={champs.numero_passeport} onChange={maj('numero_passeport')}
              icone={<IdCard size={17} strokeWidth={1.9} />}
            />
          </>
        ) : (
          <>
            <Champ
              label="Numéro de dossier (PNR)" required maxLength={6} placeholder="ABC123"
              autoComplete="off" aide="Six caractères, sur votre confirmation de réservation."
              value={champs.pnr} onChange={maj('pnr')}
              icone={<ScanLine size={17} strokeWidth={1.9} />}
            />
            <Champ
              label="Nom de famille" required placeholder="Traoré" autoComplete="off"
              value={champs.nom} onChange={maj('nom')}
              icone={<UserRound size={17} strokeWidth={1.9} />}
            />
          </>
        )}

        <Bouton type="submit" taille="lg" chargement={occupe} className="w-full">
          Rechercher mon vol
          <ArrowRight size={17} strokeWidth={2.4} />
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

/* ==========================================================================
   Ruban — un aperçu de tout ce que la page contient, en mouvement
   ========================================================================== */

function Ruban() {
  return (
    <section className="border-y border-bordure bg-surface py-8 transition-theme">
      <p className="mb-5 px-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-faible sm:px-6">
        Du salon à la passerelle · six destinations · une seule application
      </p>
      <Bandeau images={RUBAN} />
    </section>
  )
}

/* ==========================================================================
   Promesses
   ========================================================================== */

function Promesses() {
  const points = [
    {
      titre: 'Plus de file au comptoir',
      texte: "Votre dossier est déjà au guichet le jour du vol : l'agent le retrouve d'un scan et vous n'avez plus qu'à déposer vos bagages.",
      icone: BadgeCheck,
      image: AEROPORT[0],
    },
    {
      titre: 'Le siège que vous voulez',
      texte: "Le plan interactif reflète la cabine réelle de votre appareil, avec la disponibilité à la seconde. Hublot, couloir, issue de secours : à vous de voir.",
      icone: Armchair,
      image: CABINE[0],
    },
    {
      titre: 'Prévenu avant tout le monde',
      texte: "Retard, changement de porte, annulation : la notification part dès que l'exploitation publie le changement.",
      icone: BellRing,
      image: AEROPORT[2],
    },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
      <Reveal className="mb-12 max-w-2xl">
        <Etiquette ton="accent">Pourquoi Envol</Etiquette>
        <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">
          Trois heures gagnées, à chaque voyage.
        </h2>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-3">
        {points.map((p, i) => {
          const Icone = p.icone
          return (
            <Reveal key={p.titre} delai={i * 110}>
              <article className="group h-full overflow-hidden rounded-2xl border border-bordure
                                  bg-surface shadow-[var(--ombre-douce)] transition-theme
                                  hover:shadow-[var(--ombre-forte)]">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={p.image.src}
                    alt={p.image.legende}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1100ms]
                               ease-out group-hover:scale-[1.07]"
                    style={{ objectPosition: p.image.origine }}
                  />
                  <span
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, #00000099, transparent 62%)' }}
                  />
                  <span className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center
                                   rounded-xl bg-accent text-white shadow-[var(--ombre-marque)]">
                    <Icone size={19} strokeWidth={2} />
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <h3 className="font-titre text-lg font-bold">{p.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-faible">{p.texte}</p>
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* ==========================================================================
   Parcours — les cinq étapes
   ========================================================================== */

const ETAPES = [
  { icone: PlaneTakeoff, titre: 'Retrouvez votre vol',
    texte: 'Numéro de vol et passeport, ou dossier et nom de famille.' },
  { icone: IdCard, titre: 'Confirmez vos informations',
    texte: 'Identité, passeport et questions de sûreté.' },
  { icone: Luggage, titre: 'Déclarez vos bagages',
    texte: 'Nombre et poids estimé : la franchise de votre billet est rappelée.' },
  { icone: Armchair, titre: 'Choisissez votre siège',
    texte: 'Sur le plan réel de la cabine, avec la disponibilité en direct.' },
  { icone: QrCode, titre: 'Recevez votre carte',
    texte: 'QR code à présenter au comptoir, imprimable et consultable hors ligne.' },
]

function Parcours() {
  return (
    <section className="border-y border-bordure bg-surface transition-theme">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.85fr]
                      lg:items-center lg:py-24">
        <div>
          <Reveal>
            <Etiquette ton="accent">Le parcours</Etiquette>
            <h2 className="mt-4 max-w-xl font-titre text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">
              Cinq étapes, une dizaine de minutes.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-faible">
              Aucun compte à créer, aucune application à installer. Le parcours
              se reprend là où vous l'avez laissé, depuis n'importe quel appareil.
            </p>
          </Reveal>

          <ol className="mt-10 space-y-1">
            {ETAPES.map((e, i) => {
              const Icone = e.icone
              return (
                <Reveal key={e.titre} delai={i * 80} as="li">
                  <div className="group flex gap-4 rounded-2xl p-4 transition hover:bg-surface-2">
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center
                                     rounded-xl border border-bordure bg-fond text-accent
                                     transition group-hover:border-accent">
                      <Icone size={19} strokeWidth={2} />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center
                                       justify-center rounded-full bg-accent font-mono text-[10px]
                                       font-bold text-white">
                        {i + 1}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-titre text-base font-bold leading-snug">{e.titre}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-faible">{e.texte}</p>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </ol>
        </div>

        {/* Collage : deux formats verticaux décalés, pour éviter la grille sage. */}
        <Reveal delai={160} depuis="droite">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-8">
              <Vignette image={AEROPORT[1]} ratio="aspect-[3/4]" />
              <Vignette image={CABINE[1]} ratio="aspect-square" />
            </div>
            <div className="space-y-4">
              <Vignette image={CABINE[0]} ratio="aspect-square" />
              <Vignette image={AEROPORT[3]} ratio="aspect-[3/4]" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Vignette({ image, ratio }) {
  return (
    <figure className={`group relative overflow-hidden rounded-2xl ring-1 ring-bordure ${ratio}`}>
      <img
        src={image.src}
        alt={image.legende}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out
                   group-hover:scale-[1.08]"
        style={{ objectPosition: image.origine }}
      />
      <span
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'linear-gradient(to top, #000000b3, transparent 60%)' }}
      />
      <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-[11px] font-semibold
                             text-white opacity-0 transition-all duration-500
                             group-hover:translate-y-0 group-hover:opacity-100">
        {image.legende}
      </figcaption>
    </figure>
  )
}

/* ==========================================================================
   Cabine — la promesse du choix de siège
   ========================================================================== */

function Cabine() {
  const atouts = [
    ['Hublot ou couloir', 'Le plan distingue les deux, rangée par rangée.'],
    ['Issue de secours', "Réservée aux passagers éligibles, comme l'exige la sûreté."],
    ['Verrouillage 10 min', 'Le siège choisi vous est réservé le temps de finir.'],
    ['Affaires et économique', 'Les deux cabines, avec leur pas réel entre rangées.'],
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
      <Reveal className="mb-12 max-w-2xl">
        <Etiquette ton="or">La cabine</Etiquette>
        <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">
          Vous ne choisissez pas un numéro. Vous choisissez une place.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-faible">
          Le plan est généré depuis le type d'appareil réellement affecté au vol :
          ce que vous voyez à l'écran est ce que vous trouverez à bord.
        </p>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-3">
        {CABINE.map((image, i) => (
          <Reveal key={image.src} delai={i * 110}>
            <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-bordure">
              <img
                src={image.src}
                alt={image.legende}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms]
                           ease-out group-hover:scale-[1.07]"
                style={{ objectPosition: image.origine }}
              />
              <span
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, #000000cc, #00000026 50%, transparent)' }}
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 font-titre text-lg font-bold text-white">
                {image.legende}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <Reveal delai={140}>
        <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-bordure bg-bordure
                       sm:grid-cols-2 lg:grid-cols-4">
          {atouts.map(([titre, texte]) => (
            <div key={titre} className="bg-surface p-5">
              <dt className="flex items-center gap-2 font-titre text-sm font-bold">
                <Sparkles size={15} className="text-or" strokeWidth={2.2} />
                {titre}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-faible">{texte}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}

/* ==========================================================================
   Réseau
   ========================================================================== */

function Reseau() {
  const navigate = useNavigate()

  return (
    <section className="border-y border-bordure bg-surface transition-theme">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Etiquette ton="accent">Le réseau</Etiquette>
              <h2 className="mt-4 max-w-2xl font-titre text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">
                Depuis Ouagadougou, vers toute la sous-région.
              </h2>
            </div>
            <Link
              to="/vol"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent
                         transition hover:gap-2.5 hover:text-accent-fort"
            >
              Consulter le statut d'un vol
              <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
          </div>
        </Reveal>

        <Reveal delai={100}>
          <div className="grille-points -mx-2 overflow-hidden rounded-3xl border border-bordure
                          bg-fond px-2 py-4 sm:px-6 sm:py-8">
            <CarteReseau className="mx-auto max-w-4xl" />
          </div>
        </Reveal>

        <Reveal delai={140} className="mt-8">
          <Destinations surChoix={() => navigate('/vol')} />
        </Reveal>
      </div>
    </section>
  )
}

/* ==========================================================================
   Immersion — une respiration entre deux blocs denses
   ========================================================================== */

function Immersion() {
  return (
    <BandeauImmersif image="/images/hero/ciel.jpg" origine="30% 55%" hauteur="min-h-[28rem]">
      <Reveal className="sur-photo max-w-2xl">
        <Clock size={26} className="text-or" strokeWidth={2} />
        <p className="mt-6 font-titre text-3xl font-extrabold leading-tight tracking-tight text-texte sm:text-[2.7rem]">
          « L'enregistrement ouvre 24 h avant le départ.
          Il ferme 3 h avant. Entre les deux, tout se règle d'ici. »
        </p>
        <p className="mt-6 text-base text-doux">
          Passé ce délai, seul le comptoir de l'aéroport peut vous enregistrer.
        </p>
      </Reveal>
    </BandeauImmersif>
  )
}

/* ==========================================================================
   Découvrir le Burkina
   ========================================================================== */

function Decouvrir() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
      <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Etiquette ton="or">Le pays</Etiquette>
          <h2 className="mt-4 font-titre text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">
            Ouagadougou, Bobo, Sindou.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-faible">
            Neuf regards sur le Burkina Faso, d'où part chacun de nos vols.
            Cliquez pour agrandir.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-faible">
          <MapPin size={16} strokeWidth={2.2} />
          Burkina Faso
        </span>
      </Reveal>

      <Reveal delai={100}>
        <Galerie images={BURKINA} />
      </Reveal>
    </section>
  )
}

/* ==========================================================================
   Appel à l'action
   ========================================================================== */

function Appel() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <Reveal depuis="zoom">
        <div className="grain relative isolate overflow-hidden rounded-3xl border border-bordure
                        bg-surface p-10 sm:p-16">
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full
                       blur-3xl animate-respire"
            style={{ background: 'var(--lueur-accent)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full blur-3xl"
            style={{ background: 'var(--lueur-or)' }}
          />

          <div className="relative max-w-2xl">
            <h2 className="font-titre text-3xl font-extrabold tracking-tight sm:text-[2.8rem]">
              Votre siège vous attend.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-doux">
              Il ne faut qu'un numéro de vol et un passeport. Dix minutes plus
              tard, votre carte d'embarquement est sur votre téléphone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Bouton taille="lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                M'enregistrer maintenant
                <ArrowRight size={17} strokeWidth={2.4} />
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
