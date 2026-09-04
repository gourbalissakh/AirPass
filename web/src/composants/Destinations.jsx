/**
 * Cartes des destinations du réseau Air Burkina.
 *
 * Photographies réelles (voir docs/credits-photos.md), recadrées en 3/2 et
 * animées au survol : léger zoom façon Ken Burns, remontée du texte et
 * apparition de la durée de vol.
 */

const DESTINATIONS = [
  { code: 'DSS', ville: 'Dakar',  pays: 'Sénégal',        duree: '3 h 00',
    image: '/images/villes/dakar.jpg',   origine: '50% 60%', legende: 'Mosquée de la Divinité, Ouakam' },
  { code: 'ABJ', ville: 'Abidjan', pays: "Côte d'Ivoire", duree: '1 h 30',
    image: '/images/villes/abidjan.jpg', origine: '50% 55%', legende: 'Le Plateau et la lagune Ébrié' },
  { code: 'BKO', ville: 'Bamako', pays: 'Mali',           duree: '1 h 30',
    image: '/images/villes/bamako.jpg',  origine: '50% 50%', legende: 'Le troisième pont sur le Niger' },
  { code: 'LFW', ville: 'Lomé',   pays: 'Togo',           duree: '1 h 45',
    image: '/images/villes/lome.jpg',    origine: '50% 45%', legende: 'Le boulevard du bord de mer' },
  { code: 'NIM', ville: 'Niamey', pays: 'Niger',          duree: '1 h 15',
    image: '/images/villes/niamey.jpg',  origine: '50% 55%', legende: 'La ville vue de la grande mosquée' },
  { code: 'ACC', ville: 'Accra',  pays: 'Ghana',          duree: '1 h 40',
    image: '/images/villes/accra.jpg',   origine: '50% 45%', legende: "L'Independence Arch au crépuscule" },
]

export default function Destinations({ surChoix }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {DESTINATIONS.map((d) => (
        <CarteDestination key={d.code} destination={d} surChoix={surChoix} />
      ))}
    </div>
  )
}

function CarteDestination({ destination: d, surChoix }) {
  return (
    <button
      type="button"
      onClick={() => surChoix?.(d)}
      title={d.legende}
      className="group relative isolate block aspect-[3/2] overflow-hidden rounded-2xl
                 text-left ring-1 ring-bordure transition-all duration-500
                 hover:ring-accent hover:shadow-[var(--ombre-forte)]
                 focus-visible:ring-2 focus-visible:ring-accent"
    >
      <img
        src={d.image}
        alt={`${d.ville}, ${d.pays} — ${d.legende}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms]
                   ease-out group-hover:scale-[1.09]"
        style={{ objectPosition: d.origine }}
      />

      {/* Voile de lecture, qui se renforce au survol. */}
      <span
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: 'linear-gradient(to top, #000000d9 0%, #00000059 42%, #0000000f 100%)' }}
      />

      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 font-mono
                       text-[11px] font-bold tracking-[0.12em] text-white backdrop-blur-md">
        {d.code}
      </span>

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <span className="min-w-0">
          <span className="block font-titre text-2xl font-extrabold leading-tight text-white drop-shadow">
            {d.ville}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-white/70">{d.pays}</span>
        </span>

        <span className="shrink-0 translate-y-1 rounded-full bg-white/12 px-3 py-1.5 text-right
                         opacity-90 backdrop-blur-md transition-all duration-500
                         group-hover:translate-y-0 group-hover:bg-accent group-hover:opacity-100">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/70
                           transition group-hover:text-white/80">
            Direct
          </span>
          <span className="block text-sm font-bold text-white">{d.duree}</span>
        </span>
      </span>
    </button>
  )
}
