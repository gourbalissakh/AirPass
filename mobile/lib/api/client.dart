import 'dart:convert';

import 'package:http/http.dart' as http;

/// Erreur remontée par l'API, déjà traduite en message affichable.
///
/// Laravel renvoie soit `{"message": "..."}`, soit un dictionnaire d'erreurs
/// de validation `{"errors": {"champ": ["..."]}}` : les deux formes sont
/// ramenées ici à une phrase unique, comme le fait `messageErreur()` côté web.
class ErreurApi implements Exception {
  ErreurApi(this.message, {this.code});

  final String message;
  final int? code;

  @override
  String toString() => message;
}

/// Client de l'API Envol.
///
/// L'adresse se règle à la compilation :
///
///   flutter run --dart-define=ENVOL_API=http://192.168.1.20:8001/api
///
/// La valeur par défaut vise `10.0.2.2`, l'alias de la machine hôte vu depuis
/// l'émulateur Android. Sur un téléphone réel il faut passer l'IP du poste de
/// développement, `localhost` y désignant le téléphone lui-même.
class ApiEnvol {
  ApiEnvol({http.Client? client, String? base})
      : _client = client ?? http.Client(),
        base = base ?? adresseParDefaut;

  static const adresseParDefaut = String.fromEnvironment(
    'ENVOL_API',
    defaultValue: 'http://10.0.2.2:8001/api',
  );

  final http.Client _client;
  final String base;

  static const _entetes = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  static const _delai = Duration(seconds: 15);

  // ---------------------------------------------------------------- transport

  Future<Map<String, dynamic>> _get(String chemin) async {
    return _traiter(() => _client.get(Uri.parse('$base$chemin'), headers: _entetes));
  }

  Future<Map<String, dynamic>> _envoyer(
    String methode,
    String chemin,
    Map<String, dynamic> corps,
  ) async {
    final url = Uri.parse('$base$chemin');
    final donnees = jsonEncode(corps);

    return _traiter(() => switch (methode) {
          'POST' => _client.post(url, headers: _entetes, body: donnees),
          'PATCH' => _client.patch(url, headers: _entetes, body: donnees),
          _ => throw ArgumentError('Méthode non gérée : $methode'),
        });
  }

  Future<Map<String, dynamic>> _traiter(
    Future<http.Response> Function() appel,
  ) async {
    final http.Response reponse;
    try {
      reponse = await appel().timeout(_delai);
    } catch (e) {
      throw ErreurApi(
        "Le serveur Envol est injoignable. Vérifiez votre connexion, "
        "puis réessayez.",
      );
    }

    // Le corps est toujours du JSON : l'API n'a pas de route HTML.
    final Map<String, dynamic> corps;
    try {
      corps = reponse.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(utf8.decode(reponse.bodyBytes)) as Map<String, dynamic>;
    } catch (_) {
      throw ErreurApi('Réponse inattendue du serveur.', code: reponse.statusCode);
    }

    if (reponse.statusCode >= 200 && reponse.statusCode < 300) return corps;

    throw ErreurApi(_message(corps), code: reponse.statusCode);
  }

  static String _message(Map<String, dynamic> corps) {
    final erreurs = corps['errors'];
    if (erreurs is Map && erreurs.isNotEmpty) {
      final premiere = erreurs.values.first;
      if (premiere is List && premiere.isNotEmpty) return premiere.first.toString();
    }

    final message = corps['message'];
    if (message is String && message.isNotEmpty) return message;

    return "Une erreur est survenue. Réessayez dans un instant.";
  }

  // ------------------------------------------------------------------ parcours

  /// EF-2.1 — retrouver une réservation, sans compte (EF-1.3).
  Future<Map<String, dynamic>> rechercherVol(Map<String, dynamic> identifiants) {
    return _envoyer('POST', '/recherche-vol', identifiants);
  }

  /// Ouvre le dossier d'enregistrement et renvoie son jeton.
  ///
  /// Le canal `mobile` est transmis pour que le back-office distingue les
  /// enregistrements faits depuis l'application de ceux faits sur le web.
  Future<Map<String, dynamic>> demarrerEnregistrement(
    Map<String, dynamic> identifiants,
  ) {
    return _envoyer('POST', '/enregistrement/demarrer', {
      ...identifiants,
      'canal': 'mobile',
    });
  }

  Future<Map<String, dynamic>> dossier(String jeton) {
    return _get('/enregistrement/$jeton');
  }

  /// EF-3.2, EF-3.3 — informations passager et question de sûreté.
  Future<Map<String, dynamic>> enregistrerInformations(
    String jeton,
    Map<String, dynamic> champs,
  ) {
    return _envoyer('PATCH', '/enregistrement/$jeton/informations', champs);
  }

  /// EF-5.2, EF-5.3 — déclaration des bagages en soute.
  Future<Map<String, dynamic>> declarerBagages(
    String jeton, {
    required int nb,
    required double poidsEstime,
  }) {
    return _envoyer('POST', '/enregistrement/$jeton/bagages', {
      'nb': nb,
      'poids_estime': poidsEstime,
    });
  }

  /// EF-4.1, EF-4.2 — plan de cabine et disponibilité des sièges.
  Future<Map<String, dynamic>> cabine(String jeton) {
    return _get('/enregistrement/$jeton/cabine');
  }

  /// EF-4.3 — verrouille un siège pour la durée de la sélection.
  Future<Map<String, dynamic>> choisirSiege(String jeton, String code) {
    return _envoyer('POST', '/enregistrement/$jeton/siege', {'code': code});
  }

  /// EF-6.1 — finalise et émet la carte d'embarquement.
  Future<Map<String, dynamic>> finaliser(String jeton) {
    return _envoyer('POST', '/enregistrement/$jeton/finaliser', const {});
  }

  /// EF-7.1 — statut public d'un vol.
  Future<Map<String, dynamic>> statutVol(String numero) {
    return _get('/vols/${Uri.encodeComponent(numero)}/statut');
  }

  void fermer() => _client.close();
}
