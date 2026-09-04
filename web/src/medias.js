/**
 * Inventaire des visuels du site.
 *
 * Une seule source de vérité pour les chemins, les légendes et le cadrage :
 * les composants y puisent au lieu de coder les fichiers en dur, et l'ajout
 * d'une photographie se fait ici. Les crédits complets — auteur, licence,
 * source — sont dans docs/credits-photos.md, comme les licences l'exigent.
 */

export const CABINE = [
  { src: '/images/cabine/hublot.jpg',  legende: 'Un siège hublot, choisi à l’avance', origine: '50% 50%' },
  { src: '/images/cabine/rangee.jpg',  legende: 'La rangée telle qu’elle est au plan',  origine: '50% 45%' },
  { src: '/images/cabine/couloir.jpg', legende: 'Côté couloir, pour sortir en premier',   origine: '50% 50%' },
]

export const AEROPORT = [
  { src: '/images/aeroport/comptoir.jpg',     legende: 'Le comptoir, juste pour les bagages', origine: '50% 50%' },
  { src: '/images/aeroport/bornes.jpg',       legende: 'Plus de borne à chercher',            origine: '50% 55%' },
  { src: '/images/aeroport/hall.jpg',         legende: 'Le hall traversé sans faire la queue', origine: '50% 50%' },
  { src: '/images/aeroport/libre-service.jpg', legende: 'Libre-service, mais depuis chez vous', origine: '50% 50%' },
]

export const BURKINA = [
  { src: '/images/burkina/echangeur.jpg',     legende: 'L’échangeur du Nord, Ouagadougou', origine: '50% 50%' },
  { src: '/images/burkina/hotel-de-ville.jpg', legende: 'Carrefour de l’Hôtel de Ville',    origine: '50% 45%' },
  { src: '/images/burkina/barrage.jpg',       legende: 'Le barrage n° 2',                  origine: '50% 50%' },
  { src: '/images/burkina/fespaco.jpg',       legende: 'Le FESPACO, tous les deux ans',        origine: '50% 40%' },
  { src: '/images/burkina/fresque.jpg',       legende: 'Art de rue à Ouagadougou',             origine: '50% 50%' },
  { src: '/images/burkina/marche.jpg',        legende: 'Le marché de Bobo-Dioulasso',          origine: '50% 50%' },
  { src: '/images/burkina/art-deco.jpg',      legende: 'L’ancienne chambre de commerce',   origine: '50% 45%' },
  { src: '/images/burkina/bobo.jpg',          legende: 'Bobo-Dioulasso',                       origine: '50% 50%' },
  { src: '/images/burkina/sindou.jpg',        legende: 'Les pics de Sindou',                   origine: '50% 55%' },
]

export const HERO = [
  { src: '/images/hero/air-burkina.jpg',      legende: 'Un appareil Air Burkina',    origine: '50% 55%' },
  { src: '/images/hero/ouaga-crepuscule.jpg', legende: 'Crépuscule sur Ouagadougou', origine: '50% 50%' },
  { src: '/images/hero/atterrissage.jpg',     legende: 'À l’aéroport de Ouagadougou', origine: '50% 60%' },
  { src: '/images/hero/ciel.jpg',             legende: 'Au-dessus des nuages',       origine: '30% 60%' },
  { src: '/images/hero/aeroport.jpg',         legende: 'Aéroport au crépuscule',     origine: '50% 55%' },
  { src: '/images/hero/ouagadougou.jpg',      legende: 'Ouagadougou de nuit',        origine: '55% 50%' },
]

export const VILLES = [
  { src: '/images/villes/dakar.jpg',   legende: 'Dakar',   origine: '50% 60%' },
  { src: '/images/villes/abidjan.jpg', legende: 'Abidjan', origine: '50% 55%' },
  { src: '/images/villes/bamako.jpg',  legende: 'Bamako',  origine: '50% 50%' },
  { src: '/images/villes/lome.jpg',    legende: 'Lomé',    origine: '50% 45%' },
  { src: '/images/villes/niamey.jpg',  legende: 'Niamey',  origine: '50% 55%' },
  { src: '/images/villes/accra.jpg',   legende: 'Accra',   origine: '50% 45%' },
]

/** Le ruban du haut de page : un plan de chaque univers, dans cet ordre. */
export const RUBAN = [
  HERO[0], CABINE[0], VILLES[1], AEROPORT[0], BURKINA[0], HERO[1],
  CABINE[1], VILLES[3], AEROPORT[2], BURKINA[3], HERO[2], VILLES[5],
]
