import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, messageErreur } from '../../api'
import { Alerte, Bouton, Etiquette, Squelette, Vide } from '../../composants/Ui'
import { Anneau, FriseEnregistrement, Jauge } from '../../composants/Graphiques'
import {
  enDuree, enHeure, enJourHeure, enRelatif, familleAction, LIBELLE_FENETRE,
  LIBELLE_STATUT_VOL,
} from '../../format'

/**
 * EF-9.4 — vue d'exploitation.
 *
 * L'écran répond à trois questions, dans cet ordre : est-ce que les passagers
 * s'enregistrent en ligne, qu'est-ce qui va se clôturer bientôt, et qui a
 * fait quoi. Le reste serait du bruit.
 */
export default function TableauBord() {
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [rafraichi, setRafraichi] = useState(null)

  const charger = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/tableau-de-bord')
      setDonnees(data)
      setRafraichi(new Date().toISOString())
      setErreur(null)
    } catch (err) {
      setErreur(messageErreur(err))
    }
  }, [])

  useEffect(() => {
    charger()
    // L'exploitation laisse cet écran ouvert toute la journée.
    const t = setInterval(charger, 30000)
    return () => clearInterval(t)
  }, [charger])

  if (erreur && !donnees) return <Alerte ton="erreur">{erreur}</Alerte>
  if (!donnees) return <Chargement />

  return (
    <div className="space-y-6">
      <BandeauSynthese
        synthese={donnees.synthese}
        rafraichi={rafraichi}
        surRafraichir={charger}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Fenetres vols={donnees.vols} />
        <div className="space-y-6">
          <Repartition synthese={donnees.synthese} />
          <Journal entrees={donnees.journal} />
        </div>
      </div>
    </div>
  )
}

function Chargement() {
  return (
    <div className="space-y-6">
      <Squelette className="h-36 rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Squelette className="h-[26rem] rounded-2xl" />
        <Squelette className="h-[26rem] rounded-2xl" />
      </div>
    </div>
  )
}

/* ========================================================================== */

function BandeauSynthese({ synthese: s, rafraichi, surRafraichir }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-bordure bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bordure px-5 py-3">
        <h2 className="font-titre text-[13px] font-bold uppercase tracking-[0.12em] text-doux">
          Adoption de l'enregistrement en ligne
        </h2>
        <span className="flex items-center gap-3 text-[11px] text-faible">
          {rafraichi && <span>Actualisé {enRelatif(rafraichi)}</span>}
          <Bouton variante="fantome" taille="sm" onClick={surRafraichir}>Actualiser</Bouton>
        </span>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre
          label="Taux en ligne" valeur={s.taux_en_ligne} suffixe=" %" vedette
          detail={<Jauge valeur={s.taux_en_ligne} />}
        />
        <Chiffre
          label="Enregistrés en ligne" valeur={s.enregistrements_en_ligne}
          detail={'sur ' + s.enregistrements_total + ' au total'}
        />
        <Chiffre
          label="Enregistrés au guichet" valeur={s.enregistrements_guichet}
          detail="traités par un agent"
        />
        <Chiffre
          label="Vols publiés" valeur={s.vols_publies}
          detail="à venir sur le réseau"
        />
      </div>
    </section>
  )
}

function Chiffre({ label, valeur, suffixe = '', detail, vedette }) {
  return (
    <div className={'border-b border-bordure p-5 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 ' +
                    'lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0 ' +
                    (vedette ? 'bg-[var(--accent-voile)]' : '')}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-faible">{label}</p>
      <p className={'mt-1.5 font-titre text-[2.5rem] font-extrabold leading-none tabular-nums ' +
                    (vedette ? 'text-accent' : 'text-texte')}>
        {valeur}<span className="text-xl">{suffixe}</span>
      </p>
      <div className="mt-3 text-[11px] text-faible">{detail}</div>
    </div>
  )
}

/* ========================================================================== */

/**
 * Frises des fenêtres d'enregistrement, triées par urgence : ce qui se
 * clôture le plus tôt remonte en haut.
 */
function Fenetres({ vols }) {
  const rang = { ouvert: 0, pas_encore_ouvert: 1, ferme: 2 }
  const tries = [...vols].sort((a, b) => {
    const d = rang[a.enregistrement.etat] - rang[b.enregistrement.etat]
    return d !== 0 ? d : new Date(a.depart) - new Date(b.depart)
  })

  return (
    <section className="rounded-2xl border border-bordure bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-bordure px-5 py-3">
        <h2 className="font-titre text-[13px] font-bold uppercase tracking-[0.12em] text-doux">
          Fenêtres d'enregistrement
        </h2>
        <Link to="/admin/vols" className="text-[12px] font-semibold text-accent hover:underline">
          Programme →
        </Link>
      </header>

      {tries.length === 0 ? (
        <div className="p-6"><Vide titre="Aucun vol à venir" /></div>
      ) : (
        <ul className="divide-y divide-bordure">
          {tries.map((v) => <LigneVol key={v.numero + v.depart} vol={v} />)}
        </ul>
      )}
    </section>
  )
}

function LigneVol({ vol }) {
  const etat = vol.enregistrement.etat
  const ton = { ouvert: 'succes', pas_encore_ouvert: 'neutre', ferme: 'danger' }[etat]

  return (
    <li className="px-5 py-4 transition hover:bg-surface-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-titre text-base font-bold">{vol.numero}</span>
        <span className="font-mono text-[13px] text-doux">{vol.origine} → {vol.destination}</span>
        <span className="text-[12px] text-faible">
          départ {enHeure(vol.depart_effectif)}{vol.porte ? ' · porte ' + vol.porte : ''}
        </span>

        <span className="ml-auto flex items-center gap-2">
          <Etiquette ton={ton} point={etat === 'ouvert'}>{LIBELLE_FENETRE[etat]}</Etiquette>
          <Etiquette ton={vol.statut === 'annule' ? 'danger' : vol.statut === 'retarde' ? 'or' : 'neutre'}>
            {LIBELLE_STATUT_VOL[vol.statut]}
          </Etiquette>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-5">
        <span className="min-w-0 flex-1">
          <FriseEnregistrement
            ouverture={vol.enregistrement.ouverture}
            fermeture={vol.enregistrement.fermeture}
            depart={vol.depart}
          />
          <span className="mt-1 flex justify-between text-[10px] text-faible">
            <span>ouvre {enJourHeure(vol.enregistrement.ouverture)}</span>
            <span className={etat === 'ouvert' ? 'font-semibold text-succes' : ''}>
              {etat === 'ouvert'
                ? 'clôture dans ' + enDuree(vol.enregistrement.fermeture)
                : 'clôture ' + enJourHeure(vol.enregistrement.fermeture)}
            </span>
            <span>départ {enJourHeure(vol.depart)}</span>
          </span>
        </span>

        <span className="w-24 shrink-0 text-right">
          <span className="block font-titre text-lg font-bold tabular-nums">
            {vol.en_ligne}<span className="text-faible">/{vol.reservations}</span>
          </span>
          <span className="mt-1.5 block"><Jauge valeur={vol.taux_en_ligne} /></span>
        </span>
      </div>
    </li>
  )
}

/* ========================================================================== */

function Repartition({ synthese: s }) {
  const total = s.enregistrements_total

  return (
    <section className="rounded-2xl border border-bordure bg-surface">
      <header className="border-b border-bordure px-5 py-3">
        <h2 className="font-titre text-[13px] font-bold uppercase tracking-[0.12em] text-doux">
          Par canal
        </h2>
      </header>

      <div className="flex items-center gap-6 p-5">
        <Anneau valeur={s.enregistrements_en_ligne} total={total} legende="en ligne" />

        <dl className="min-w-0 flex-1 space-y-3">
          <Part label="En ligne" valeur={s.enregistrements_en_ligne} total={total} couleur="bg-accent" />
          <Part label="Au guichet" valeur={s.enregistrements_guichet} total={total} couleur="bg-surface-3" />
        </dl>
      </div>

      {total === 0 && (
        <p className="border-t border-bordure px-5 py-3 text-[12px] text-faible">
          Aucun enregistrement pour l'instant : les chiffres apparaîtront dès le premier passager.
        </p>
      )}
    </section>
  )
}

function Part({ label, valeur, total, couleur }) {
  const pourcent = total > 0 ? Math.round((valeur / total) * 100) : 0

  return (
    <div className="flex items-center gap-3">
      <span className={'h-2.5 w-2.5 shrink-0 rounded-full ' + couleur} />
      <dt className="flex-1 truncate text-[13px] text-doux">{label}</dt>
      <dd className="font-semibold tabular-nums">{valeur}</dd>
      <dd className="w-11 text-right text-[12px] tabular-nums text-faible">{pourcent} %</dd>
    </div>
  )
}

/* ========================================================================== */

const ICONES_JOURNAL = {
  enregistrement: { fond: 'bg-[var(--accent-voile)] text-accent', signe: '✓' },
  guichet:        { fond: 'bg-[var(--or-voile)] text-or',         signe: '▤' },
  vol:            { fond: 'bg-[var(--succes-voile)] text-succes', signe: '✈' },
  siege:          { fond: 'bg-surface-3 text-doux',               signe: '▦' },
  compte:         { fond: 'bg-surface-3 text-doux',               signe: '◍' },
  dcs:            { fond: 'bg-surface-3 text-faible',             signe: '⇄' },
}

/** Exigence non fonctionnelle « Journalisation / Traçabilité ». */
function Journal({ entrees }) {
  return (
    <section className="rounded-2xl border border-bordure bg-surface">
      <header className="border-b border-bordure px-5 py-3">
        <h2 className="font-titre text-[13px] font-bold uppercase tracking-[0.12em] text-doux">
          Journal des actions
        </h2>
      </header>

      {entrees.length === 0 ? (
        <div className="p-5"><Vide titre="Journal vide" /></div>
      ) : (
        <ul className="max-h-[24rem] divide-y divide-bordure overflow-y-auto">
          {entrees.map((l, i) => {
            const style = ICONES_JOURNAL[familleAction(l.action)]
            return (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className={'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] ' + style.fond}>
                  {style.signe}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12px] font-semibold text-texte">
                    {l.action}
                  </span>
                  <span className="block truncate text-[11px] text-faible">
                    {l.acteur}{l.entite ? ' · ' + l.entite + ' #' + l.entite_id : ''}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-faible">
                  {enRelatif(l.horodatage)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
