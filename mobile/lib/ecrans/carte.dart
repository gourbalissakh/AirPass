import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/client.dart';
import '../composants/blocs.dart';
import '../composants/carte_embarquement.dart';
import '../theme/palette.dart';
import '../theme/theme_envol.dart';

/// EF-6.1, EF-6.4 — carte d'embarquement.
///
/// La carte est aussi conservée sur l'appareil : le passager la retrouve même
/// sans réseau à l'aéroport (exigence non fonctionnelle « Connectivité
/// limitée »). C'est l'intérêt principal de l'application par rapport au
/// site — un onglet de navigateur, lui, ne survit pas au mode avion.
class EcranCarte extends StatefulWidget {
  const EcranCarte({super.key, required this.api, required this.jeton});

  final ApiEnvol api;
  final String jeton;

  @override
  State<EcranCarte> createState() => _EcranCarteState();
}

class _EcranCarteState extends State<EcranCarte> {
  Map<String, dynamic>? _carte;
  String? _erreur;
  bool _horsLigne = false;
  bool _chargement = true;

  String get _cle => 'envol.carte.${widget.jeton}';

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    setState(() => _chargement = true);
    final rangement = await SharedPreferences.getInstance();

    try {
      final donnees = await widget.api.dossier(widget.jeton);
      await rangement.setString(_cle, jsonEncode(donnees));
      if (!mounted) return;
      setState(() {
        _carte = donnees;
        _horsLigne = false;
        _erreur = null;
      });
    } on ErreurApi catch (e) {
      // Le réseau a manqué : on ressort la copie locale s'il y en a une.
      final cache = rangement.getString(_cle);
      if (!mounted) return;

      if (cache != null) {
        setState(() {
          _carte = jsonDecode(cache) as Map<String, dynamic>;
          _horsLigne = true;
          _erreur = null;
        });
      } else {
        setState(() => _erreur = e.message);
      }
    } finally {
      if (mounted) setState(() => _chargement = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Carte d'embarquement"),
        actions: [
          IconButton(
            onPressed: _chargement ? null : _charger,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Actualiser',
          ),
        ],
      ),
      body: switch ((_chargement, _carte, _erreur)) {
        (true, null, _) => const Center(child: CircularProgressIndicator()),
        (_, null, final String message) => Padding(
            padding: const EdgeInsets.all(18),
            child: Alerte(ton: Ton.erreur, titre: 'Carte indisponible', texte: message),
          ),
        (_, final Map<String, dynamic> carte, _) => RefreshIndicator(
            onRefresh: _charger,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 40),
              children: [
                if (_horsLigne) ...[
                  const Alerte(
                    ton: Ton.avertissement,
                    titre: 'Vous êtes hors ligne',
                    texte: "Cette carte provient de la copie enregistrée sur cet "
                        "appareil. Un changement de vol récent peut ne pas y figurer.",
                  ),
                  const SizedBox(height: 16),
                ],
                CarteEmbarquement(carte: carte),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Icon(Icons.offline_pin_outlined, size: 17, color: p.succes),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Cette carte reste consultable sans réseau.',
                        style: TextStyle(
                          fontFamily: ThemeEnvol.texte,
                          fontSize: 12.5,
                          color: p.texteFaible,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        _ => const SizedBox.shrink(),
      },
    );
  }
}
