import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import 'package:envol/api/client.dart';

/// Le client parle à un faux serveur : ces tests vérifient le contrat côté
/// application — chemins appelés, corps envoyé, traduction des erreurs — sans
/// dépendre d'une API qui tourne.
void main() {
  ApiEnvol clientQuiRepond(
    Object corps, {
    int code = 200,
    void Function(http.Request)? espion,
  }) {
    return ApiEnvol(
      base: 'https://exemple.test/api',
      client: MockClient((requete) async {
        espion?.call(requete);
        return http.Response(
          jsonEncode(corps),
          code,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      }),
    );
  }

  group('recherche de vol', () {
    test('envoie les identifiants au bon chemin', () async {
      http.Request? vue;
      final api = clientQuiRepond({'vol': {'numero': '2J201'}}, espion: (r) => vue = r);

      final reponse = await api.rechercherVol({
        'numero_vol': '2J201',
        'numero_passeport': 'BF1234567',
      });

      expect(vue!.method, 'POST');
      expect(vue!.url.path, '/api/recherche-vol');
      expect(jsonDecode(vue!.body), {
        'numero_vol': '2J201',
        'numero_passeport': 'BF1234567',
      });
      expect((reponse['vol'] as Map)['numero'], '2J201');
    });
  });

  group('démarrage du parcours', () {
    test('déclare le canal mobile, ce que le back-office compte à part', () async {
      http.Request? vue;
      final api = clientQuiRepond(
        {'jeton': 'abc', 'reference': 'EN123456', 'statut': 'en_cours'},
        code: 201,
        espion: (r) => vue = r,
      );

      await api.demarrerEnregistrement({'pnr': 'ABC123', 'nom': 'Traoré'});

      expect(jsonDecode(vue!.body), containsPair('canal', 'mobile'));
    });
  });

  group('bagages', () {
    test('transmet le nombre et le poids déclarés', () async {
      http.Request? vue;
      final api = clientQuiRepond({'franchise': {}, 'depassement': null},
          espion: (r) => vue = r);

      await api.declarerBagages('jeton-x', nb: 2, poidsEstime: 23.5);

      expect(vue!.url.path, '/api/enregistrement/jeton-x/bagages');
      expect(jsonDecode(vue!.body), {'nb': 2, 'poids_estime': 23.5});
    });
  });

  group('traduction des erreurs', () {
    test('un message Laravel remonte tel quel', () async {
      final api = clientQuiRepond({'message': 'Réservation introuvable.'}, code: 404);

      expect(
        () => api.rechercherVol({'pnr': 'ZZZZZZ', 'nom': 'Inconnu'}),
        throwsA(isA<ErreurApi>()
            .having((e) => e.message, 'message', 'Réservation introuvable.')
            .having((e) => e.code, 'code', 404)),
      );
    });

    test('une erreur de validation est réduite à sa première phrase', () async {
      final api = clientQuiRepond({
        'message': 'The given data was invalid.',
        'errors': {
          'numero_vol': ['Le numéro de vol est obligatoire.'],
        },
      }, code: 422);

      expect(
        () => api.rechercherVol(const {}),
        throwsA(isA<ErreurApi>().having(
          (e) => e.message,
          'message',
          'Le numéro de vol est obligatoire.',
        )),
      );
    });

    test('une réponse illisible ne fait pas planter l\'application', () async {
      final api = ApiEnvol(
        base: 'https://exemple.test/api',
        client: MockClient((_) async => http.Response('<html>502</html>', 502)),
      );

      expect(
        () => api.statutVol('2J201'),
        throwsA(isA<ErreurApi>().having((e) => e.code, 'code', 502)),
      );
    });

    test('un réseau absent donne un message actionnable, pas une trace', () async {
      final api = ApiEnvol(
        base: 'https://exemple.test/api',
        client: MockClient((_) async => throw const SocketExceptionFactice()),
      );

      expect(
        () => api.statutVol('2J201'),
        throwsA(isA<ErreurApi>()
            .having((e) => e.message, 'message', contains('injoignable'))),
      );
    });
  });

  group('accents', () {
    test('les caractères accentués survivent au décodage', () async {
      final api = clientQuiRepond({'message': 'Enregistrement clôturé, siège réservé.'},
          code: 409);

      expect(
        () => api.finaliser('jeton-x'),
        throwsA(isA<ErreurApi>().having(
          (e) => e.message,
          'message',
          'Enregistrement clôturé, siège réservé.',
        )),
      );
    });
  });
}

/// Panne réseau simulée : le vrai `SocketException` vient de `dart:io`, absent
/// sur la cible web ; une exception quelconque suffit à emprunter le même
/// chemin de code.
class SocketExceptionFactice implements Exception {
  const SocketExceptionFactice();
}
