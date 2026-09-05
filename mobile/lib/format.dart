/// Formatage des dates et libellés, en français.
///
/// Le pendant Dart de `web/src/format.js` : les deux clients affichent les
/// mêmes chaînes, ce qui évite qu'un passager voie « ven. 04 sept., 12:30 »
/// sur le site et « 04/09/2026 12:30 » dans l'application.
///
/// Les noms de jours et de mois sont écrits ici plutôt que délégués à `intl` :
/// ce dernier exige `initializeDateFormatting('fr_FR')` avant tout usage et
/// lève une exception si on l'oublie. Pour dix mots, la dépendance et son
/// piège d'initialisation ne valent pas le service rendu.
library;

const _jours = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

const _mois = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

DateTime? _lire(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  return DateTime.tryParse(iso)?.toLocal();
}

String _deuxChiffres(int n) => n.toString().padLeft(2, '0');

String _heureDe(DateTime d) => '${_deuxChiffres(d.hour)}:${_deuxChiffres(d.minute)}';

/// « ven. 04 sept., 12:30 »
String enDateHeure(String? iso) {
  final d = _lire(iso);
  if (d == null) return '—';
  return '${_jours[d.weekday - 1]} ${_deuxChiffres(d.day)} ${_mois[d.month - 1]}, ${_heureDe(d)}';
}

/// « 12:30 »
String enHeure(String? iso) {
  final d = _lire(iso);
  return d == null ? '—' : _heureDe(d);
}

/// « 04/09/2026 »
String enDate(String? iso) {
  final d = _lire(iso);
  if (d == null) return '—';
  return '${_deuxChiffres(d.day)}/${_deuxChiffres(d.month)}/${d.year}';
}

/// « jeu. 12:30 » — l'ouverture à H-24 tombe à la même heure que le départ,
/// seul le jour les distingue.
String enJourHeure(String? iso) {
  final d = _lire(iso);
  if (d == null) return '—';
  return '${_jours[d.weekday - 1]} ${_heureDe(d)}';
}

/// Durée restante en clair : « 3 h 16 », « 45 min », « dépassé ».
String enDuree(String? iso) {
  final d = _lire(iso);
  if (d == null) return '—';

  final restant = d.difference(DateTime.now());
  if (restant.isNegative) return 'dépassé';

  final heures = restant.inHours;
  final minutes = restant.inMinutes % 60;

  return heures == 0 ? '$minutes min' : '$heures h ${_deuxChiffres(minutes)}';
}

/// Codes OACI du réseau Air Burkina. Le code brut reste affiché à côté :
/// c'est lui qui figure sur la carte d'embarquement.
const _villes = {
  'OUA': 'Ouagadougou',
  'BOY': 'Bobo-Dioulasso',
  'ABJ': 'Abidjan',
  'DSS': 'Dakar',
  'BKO': 'Bamako',
  'LFW': 'Lomé',
  'NIM': 'Niamey',
  'ACC': 'Accra',
  'COO': 'Cotonou',
  'CKY': 'Conakry',
};

String ville(String? code) => _villes[code] ?? code ?? '—';

const libelleStatutVol = {
  'a_lheure': "À l'heure",
  'retarde': 'Retardé',
  'annule': 'Annulé',
  'embarquement': 'Embarquement',
  'parti': 'Parti',
};

const libelleFenetre = {
  'pas_encore_ouvert': 'Pas encore ouvert',
  'ouvert': 'Ouvert',
  'ferme': 'Fermé',
};

const libelleClasse = {
  'affaires': 'Affaires',
  'economique': 'Économique',
};
