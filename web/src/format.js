/** Formatage des dates et libellés, en français. */

const OPTIONS_DATE_HEURE = {
  weekday: 'short', day: '2-digit', month: 'short',
  hour: '2-digit', minute: '2-digit',
}

const OPTIONS_HEURE = { hour: '2-digit', minute: '2-digit' }

export const enDateHeure = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', OPTIONS_DATE_HEURE) : '—'

export const enHeure = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', OPTIONS_HEURE) : '—'

export const enDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'

/**
 * « jeu. 12:30 » — indispensable sur les frises d'enregistrement : l'ouverture
 * à H-24 tombe à la même heure que le départ, seul le jour les distingue.
 */
export const enJourHeure = (iso) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', {
        weekday: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—'

/**
 * Temps relatif : « à l'instant », « il y a 3 min », « dans 2 h 15 ».
 *
 * Écrit à la main plutôt que délégué à Intl : les libellés courts de
 * l'exploitation ne correspondent pas à ceux que produit la locale, et on
 * veut « dans 2 h 15 » et non « dans 2 heures ».
 */
export function enRelatif(iso) {
  if (!iso) return '—'

  const secondes = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const passe = secondes < 0
  const abs = Math.abs(secondes)

  const quantite =
    abs < 45 ? null
    : abs < 3600 ? `${Math.round(abs / 60)} min`
    : abs < 86400 ? dureeHeures(abs)
    : abs < 604800 ? `${Math.round(abs / 86400)} j`
    : `${Math.round(abs / 604800)} sem.`

  if (quantite === null) return "à l'instant"
  return passe ? `il y a ${quantite}` : `dans ${quantite}`
}

/** Durée restante compacte : « 4 h 20 », « 38 min ». */
export function enDuree(iso) {
  if (!iso) return '—'
  const secondes = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  if (secondes <= 0) return 'échu'
  if (secondes < 3600) return `${Math.max(1, Math.round(secondes / 60))} min`
  return dureeHeures(secondes)
}

function dureeHeures(secondes) {
  const heures = Math.floor(secondes / 3600)
  const minutes = Math.round((secondes % 3600) / 60)
  return `${heures} h ${String(minutes).padStart(2, '0')}`
}

export const LIBELLE_STATUT_VOL = {
  programme: 'Programmé',
  a_lheure: "À l'heure",
  retarde: 'Retardé',
  embarquement: 'Embarquement',
  parti: 'Parti',
  annule: 'Annulé',
}

export const LIBELLE_STATUT_DOSSIER = {
  en_cours: 'En cours',
  enregistre: 'Enregistré',
  annule: 'Annulé',
  embarque: 'Embarqué',
}

export const LIBELLE_FENETRE = {
  pas_encore_ouvert: 'Pas encore ouvert',
  ouvert: 'Ouvert',
  ferme: 'Clôturé',
}

export const VILLES = {
  OUA: 'Ouagadougou', BOY: 'Bobo-Dioulasso', DSS: 'Dakar', ABJ: 'Abidjan',
  BKO: 'Bamako', LFW: 'Lomé', COO: 'Cotonou', NIM: 'Niamey', ACC: 'Accra',
}

export const ville = (code) => VILLES[code] ?? code

/** Regroupe les actions du journal par famille, pour l'icône et la couleur. */
export function familleAction(action = '') {
  if (action.startsWith('guichet.')) return 'guichet'
  if (action.startsWith('vol.')) return 'vol'
  if (action.startsWith('siege.')) return 'siege'
  if (action.startsWith('compte.') || action.startsWith('utilisateur.')) return 'compte'
  if (action.startsWith('dcs.')) return 'dcs'
  return 'enregistrement'
}

/** Initiales d'un nom, pour les pastilles d'avatar. */
export function initiales(nom) {
  if (!nom) return '?'
  return nom.trim().split(/\s+/).slice(0, 2).map((m) => m[0].toUpperCase()).join('')
}
