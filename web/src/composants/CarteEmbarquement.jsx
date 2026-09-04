import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { PlaneTakeoff } from 'lucide-react'
import Logo from './Logo'
import { enDate, enDateHeure, enHeure, ville } from '../format'

/**
 * EF-6.1, EF-6.4 — carte d'embarquement numérique, imprimable.
 *
 * La mise en page reprend le talon détachable d'une vraie carte : le bloc de
 * gauche pour le passager, la souche de droite avec le QR pour l'agent.
 */
export default function CarteEmbarquement({ carte }) {
  const [qr, setQr] = useState(null)

  useEffect(() => {
    if (!carte?.qr) return
    // Le QR est rendu en noir sur blanc : il doit rester scannable après
    // impression comme sur un écran en thème sombre.
    QRCode.toDataURL(carte.qr, { width: 360, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [carte?.qr])

  if (!carte) return null

  const vol = carte.vol
  const retarde = vol.depart_effectif !== vol.depart_prevu

  return (
    <article className="carte-imprimable overflow-hidden rounded-2xl border border-bordure
                        bg-surface shadow-[var(--ombre-forte)]">
      {/* Bandeau. */}
      <header
        className="flex items-center justify-between gap-4 px-6 py-5 text-white"
        style={{ background: 'linear-gradient(110deg, var(--accent-fort), var(--accent) 45%, var(--or))' }}
      >
        <span className="flex items-center gap-3">
          <Logo taille={34} />
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] opacity-85">
              Carte d'embarquement
            </span>
            <span className="block font-titre text-xl font-extrabold">Air Burkina · {vol.numero}</span>
          </span>
        </span>
        <span className="text-right">
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-85">
            Référence
          </span>
          <span className="block font-mono text-lg font-bold">{carte.reference}</span>
        </span>
      </header>

      <div className="grid sm:grid-cols-[1fr_auto]">
        {/* Corps. */}
        <div className="space-y-6 p-6">
          <div className="flex items-end gap-5">
            <Escale code={vol.origine} heure={vol.depart_effectif} />
            <PlaneTakeoff size={24} strokeWidth={2} className="mb-8 shrink-0 text-accent" aria-hidden="true" />
            <Escale code={vol.destination} />
          </div>

          {retarde && (
            <p className="rounded-xl border border-or/40 bg-[var(--or-voile)] px-3.5 py-2.5 text-xs text-texte">
              Horaire modifié — départ initialement prévu à {enHeure(vol.depart_prevu)}.
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
            <Case label="Passager" valeur={carte.passager.nom_complet} large />
            <Case label="Siège" valeur={carte.siege ?? '—'} vedette />
            <Case label="Porte" valeur={vol.porte ?? '—'} vedette />
            <Case label="Embarquement" valeur={enHeure(vol.embarquement)} />
            <Case label="Classe" valeur={carte.classe === 'affaires' ? 'Affaires' : 'Économique'} />
            <Case label="Dossier" valeur={carte.pnr} mono />
            <Case label="Bagages" valeur={`${carte.bagages.nb} pièce(s)`} />
            <Case label="Date" valeur={enDate(vol.depart_prevu)} />
          </dl>
        </div>

        {/* Souche détachable. */}
        <div className="relative flex flex-col items-center justify-center gap-3 border-t border-dashed
                        border-bordure-forte p-6 sm:border-l sm:border-t-0">
          <span
            aria-hidden="true"
            className="absolute -top-2.5 left-1/2 hidden h-5 w-5 -translate-x-1/2 rounded-full
                       bg-fond sm:-left-2.5 sm:top-1/2 sm:block sm:-translate-x-0 sm:-translate-y-1/2"
          />
          {qr ? (
            <img
              src={qr}
              alt="QR code de la carte d'embarquement"
              className="h-40 w-40 rounded-lg bg-white p-1.5"
            />
          ) : (
            <div className="squelette h-40 w-40 rounded-lg" />
          )}
          <p className="max-w-[10rem] break-all text-center font-mono text-[9px] leading-tight text-faible">
            {carte.qr}
          </p>
        </div>
      </div>

      <footer className="border-t border-bordure bg-surface-2 px-6 py-4 text-xs leading-relaxed text-faible">
        Présentez-vous au comptoir Air Burkina avec une pièce d'identité valide.
        L'enregistrement en ligne ne dispense ni des contrôles de sûreté ni du
        dépôt des bagages en soute. Départ prévu {enDateHeure(vol.depart_effectif)}.
      </footer>
    </article>
  )
}

function Escale({ code, heure }) {
  return (
    <div>
      <p className="font-titre text-4xl font-extrabold leading-none text-texte">{code}</p>
      <p className="mt-1 text-xs text-faible">{ville(code)}</p>
      {heure && <p className="mt-1.5 font-titre text-xl font-bold text-accent">{enHeure(heure)}</p>}
    </div>
  )
}

function Case({ label, valeur, vedette, large, mono }) {
  return (
    <div className={large ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-faible">{label}</dt>
      <dd
        className={
          vedette ? 'font-titre text-2xl font-extrabold text-accent'
          : mono ? 'mt-0.5 font-mono text-sm font-semibold'
          : 'mt-0.5 text-sm font-semibold'
        }
      >
        {valeur}
      </dd>
    </div>
  )
}
