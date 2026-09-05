import 'package:flutter/material.dart';

import '../api/client.dart';
import '../composants/blocs.dart';
import '../format.dart';
import '../theme/palette.dart';
import '../theme/theme_envol.dart';

/// EF-7.1 — consultation du statut d'un vol, sans dossier ni compte.
class EcranStatutVol extends StatefulWidget {
  const EcranStatutVol({super.key, required this.api});

  final ApiEnvol api;

  @override
  State<EcranStatutVol> createState() => _EcranStatutVolState();
}

class _EcranStatutVolState extends State<EcranStatutVol> {
  final _numero = TextEditingController();

  Map<String, dynamic>? _vol;
  String? _erreur;
  bool _occupe = false;

  @override
  void dispose() {
    _numero.dispose();
    super.dispose();
  }

  Future<void> _consulter() async {
    final numero = _numero.text.trim();
    if (numero.isEmpty) return;

    setState(() {
      _occupe = true;
      _erreur = null;
      _vol = null;
    });

    try {
      final donnees = await widget.api.statutVol(numero);
      if (mounted) setState(() => _vol = donnees);
    } on ErreurApi catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _occupe = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Scaffold(
      appBar: AppBar(title: const Text("Statut d'un vol")),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 40),
        children: [
          Text(
            "Retard, changement de porte, annulation : l'état de votre vol, "
            "tel que l'exploitation vient de le publier.",
            style: TextStyle(
              fontFamily: ThemeEnvol.texte,
              fontSize: 14,
              height: 1.55,
              color: p.texteDoux,
            ),
          ),
          const SizedBox(height: 20),

          CarteBloc(
            enfant: Column(
              children: [
                TextField(
                  controller: _numero,
                  textCapitalization: TextCapitalization.characters,
                  autocorrect: false,
                  onSubmitted: (_) => _consulter(),
                  decoration: const InputDecoration(
                    labelText: 'Numéro de vol',
                    hintText: '2J201',
                    prefixIcon: Icon(Icons.flight_rounded, size: 20),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _occupe ? null : _consulter,
                    icon: _occupe
                        ? const SizedBox(
                            width: 17,
                            height: 17,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.search_rounded, size: 19),
                    label: const Text('Consulter'),
                  ),
                ),
              ],
            ),
          ),

          if (_erreur != null) ...[
            const SizedBox(height: 16),
            Alerte(ton: Ton.erreur, texte: _erreur!),
          ],

          if (_vol != null) ...[
            const SizedBox(height: 16),
            _FicheVol(vol: _vol!),
          ],

          if (_vol == null && _erreur == null) ...[
            const SizedBox(height: 16),
            CarteBloc(
              enfant: const Vide(
                titre: 'Aucun vol consulté',
                icone: Icons.flight_takeoff_rounded,
                texte: 'Saisissez un numéro de vol Air Burkina, par exemple 2J201.',
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _FicheVol extends StatelessWidget {
  const _FicheVol({required this.vol});

  final Map<String, dynamic> vol;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final statut = vol['statut'] as String?;
    final enregistrement = vol['enregistrement'] as Map<String, dynamic>? ?? const {};
    final changement = vol['dernier_changement'] as Map<String, dynamic>?;

    return CarteBloc(
      titre: 'Vol ${vol['numero']}',
      icone: Icons.flight_rounded,
      enfant: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${ville(vol['origine'] as String?)} → ${ville(vol['destination'] as String?)}',
                      style: TextStyle(
                        fontFamily: ThemeEnvol.titre,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.4,
                        color: p.texte,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      vol['appareil'] as String? ?? '',
                      style: TextStyle(
                        fontFamily: ThemeEnvol.texte,
                        fontSize: 12.5,
                        color: p.texteFaible,
                      ),
                    ),
                  ],
                ),
              ),
              Etiquette(
                texte: libelleStatutVol[statut] ?? statut ?? '',
                point: statut == 'retarde' || statut == 'embarquement',
                ton: statut == 'annule'
                    ? Ton.erreur
                    : statut == 'retarde'
                        ? Ton.avertissement
                        : Ton.succes,
              ),
            ],
          ),

          const SizedBox(height: 20),
          const Divider(),
          const SizedBox(height: 18),

          Wrap(
            spacing: 30,
            runSpacing: 18,
            children: [
              Donnee(label: 'Départ prévu', valeur: enDateHeure(vol['depart_prevu'] as String?)),
              Donnee(label: 'Départ estimé', valeur: enDateHeure(vol['depart_effectif'] as String?)),
              Donnee(label: 'Porte', valeur: vol['porte'] as String? ?? '—', accent: true),
            ],
          ),

          if (enregistrement['message'] != null) ...[
            const SizedBox(height: 18),
            Alerte(
              ton: enregistrement['etat'] == 'ouvert' ? Ton.succes : Ton.info,
              texte: enregistrement['message'] as String,
            ),
          ],

          if (changement != null) ...[
            const SizedBox(height: 12),
            Alerte(
              ton: Ton.avertissement,
              titre: 'Dernier changement publié',
              texte: '${changement['message']}\n'
                  'Publié le ${enDateHeure(changement['publie_le'] as String?)}',
            ),
          ],
        ],
      ),
    );
  }
}
