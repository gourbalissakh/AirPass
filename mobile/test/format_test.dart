import 'package:flutter_test/flutter_test.dart';

import 'package:envol/format.dart';

/// Le formatage est écrit à la main plutôt que délégué à `intl` : il mérite
/// donc d'être couvert, notamment sur les pièges de la langue française
/// (mois abrégés, minuit, passage à l'heure).
void main() {
  group('dates', () {
    // Les chaînes sont converties en heure locale : on construit donc les
    // dates attendues en local, sinon le test échouerait selon le fuseau.
    String iso(int a, int mo, int j, int h, int mi) =>
        DateTime(a, mo, j, h, mi).toIso8601String();

    test('enDateHeure rend le jour, le mois abrégé et l\'heure', () {
      expect(enDateHeure(iso(2026, 9, 4, 12, 30)), 'ven. 04 sept., 12:30');
    });

    test('enDateHeure gère minuit sans passer à 24:00', () {
      expect(enDateHeure(iso(2026, 1, 1, 0, 5)), 'jeu. 01 janv., 00:05');
    });

    test('enHeure ne garde que l\'heure, sur deux chiffres', () {
      expect(enHeure(iso(2026, 9, 4, 7, 5)), '07:05');
    });

    test('enDate rend le format court français', () {
      expect(enDate(iso(2026, 12, 25, 18, 0)), '25/12/2026');
    });

    test('enJourHeure distingue deux créneaux de même heure', () {
      expect(enJourHeure(iso(2026, 9, 3, 12, 30)), 'jeu. 12:30');
      expect(enJourHeure(iso(2026, 9, 4, 12, 30)), 'ven. 12:30');
    });

    test('une date absente ou illisible donne un tiret, jamais une exception', () {
      expect(enDateHeure(null), '—');
      expect(enDateHeure(''), '—');
      expect(enHeure('pas une date'), '—');
      expect(enDate(null), '—');
    });
  });

  group('enDuree', () {
    // Les échéances portent quelques secondes de marge : `inMinutes` tronque,
    // et une échéance posée pile à 45 min serait déjà à 44 min 59 s au moment
    // du calcul. C'est le bon comportement — mieux vaut annoncer moins de
    // temps que plus — mais cela rendrait le test dépendant de sa vitesse.
    test('rend les heures et les minutes sur deux chiffres', () {
      final dans = DateTime.now().add(const Duration(hours: 3, minutes: 5, seconds: 5));
      expect(enDuree(dans.toIso8601String()), '3 h 05');
    });

    test('sous une heure, ne rend que les minutes', () {
      final dans = DateTime.now().add(const Duration(minutes: 45, seconds: 5));
      expect(enDuree(dans.toIso8601String()), '45 min');
    });

    test('une échéance passée est signalée, pas rendue en négatif', () {
      final avant = DateTime.now().subtract(const Duration(hours: 2));
      expect(enDuree(avant.toIso8601String()), 'dépassé');
    });
  });

  group('libellés', () {
    test('les codes OACI du réseau sont traduits', () {
      expect(ville('OUA'), 'Ouagadougou');
      expect(ville('DSS'), 'Dakar');
    });

    test('un code inconnu est rendu tel quel plutôt que masqué', () {
      expect(ville('XYZ'), 'XYZ');
      expect(ville(null), '—');
    });

    test('les statuts de vol ont tous un libellé', () {
      for (final statut in ['a_lheure', 'retarde', 'annule', 'embarquement', 'parti']) {
        expect(libelleStatutVol[statut], isNotNull, reason: 'statut $statut');
      }
    });

    test('les états de fenêtre ont tous un libellé', () {
      for (final etat in ['pas_encore_ouvert', 'ouvert', 'ferme']) {
        expect(libelleFenetre[etat], isNotNull, reason: 'état $etat');
      }
    });
  });
}
