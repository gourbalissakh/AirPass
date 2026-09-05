import 'package:flutter/material.dart';

import '../api/client.dart';
import '../composants/blocs.dart';
import '../composants/marque.dart';
import '../format.dart';
import '../theme/palette.dart';
import '../theme/theme_envol.dart';
import 'carte.dart';
import 'enregistrement.dart';
import 'statut_vol.dart';

/// Écran d'accueil : la recherche de réservation.
///
/// C'est la seule chose que la quasi-totalité des passagers vient faire
/// (EF-2.1), donc le formulaire occupe le premier écran, sans détour. Aucun
/// compte n'est demandé (EF-1.3) : le numéro de vol et le passeport suffisent.
class EcranAccueil extends StatefulWidget {
  const EcranAccueil({super.key, required this.api, required this.surBasculeTheme});

  final ApiEnvol api;
  final VoidCallback surBasculeTheme;

  @override
  State<EcranAccueil> createState() => _EcranAccueilState();
}

enum _Mode { passeport, dossier }

class _EcranAccueilState extends State<EcranAccueil> {
  final _formulaire = GlobalKey<FormState>();
  final _numeroVol = TextEditingController();
  final _passeport = TextEditingController();
  final _pnr = TextEditingController();
  final _nom = TextEditingController();

  _Mode _mode = _Mode.passeport;
  Map<String, dynamic>? _resultat;
  String? _erreur;
  bool _occupe = false;

  @override
  void dispose() {
    _numeroVol.dispose();
    _passeport.dispose();
    _pnr.dispose();
    _nom.dispose();
    super.dispose();
  }

  Map<String, dynamic> get _identifiants => _mode == _Mode.passeport
      ? {
          'numero_vol': _numeroVol.text.trim(),
          'numero_passeport': _passeport.text.trim(),
        }
      : {
          'pnr': _pnr.text.trim().toUpperCase(),
          'nom': _nom.text.trim(),
        };

  Future<void> _rechercher() async {
    if (!_formulaire.currentState!.validate()) return;

    setState(() {
      _occupe = true;
      _erreur = null;
      _resultat = null;
    });

    try {
      final donnees = await widget.api.rechercherVol(_identifiants);
      if (mounted) setState(() => _resultat = donnees);
    } on ErreurApi catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _occupe = false);
    }
  }

  Future<void> _demarrer() async {
    final dossier = _resultat?['dossier_existant'] as Map<String, dynamic>?;

    // Un dossier déjà ouvert se reprend au lieu d'en créer un second.
    if (dossier != null) {
      _ouvrirDossier(dossier['jeton'] as String, dossier['statut'] as String?);
      return;
    }

    setState(() {
      _occupe = true;
      _erreur = null;
    });

    try {
      final donnees = await widget.api.demarrerEnregistrement(_identifiants);
      if (mounted) _ouvrirDossier(donnees['jeton'] as String, donnees['statut'] as String?);
    } on ErreurApi catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _occupe = false);
    }
  }

  void _ouvrirDossier(String jeton, String? statut) {
    // Un dossier finalisé mène droit à la carte : le passager la cherche.
    final destination = (statut == 'enregistre' || statut == 'embarque')
        ? MaterialPageRoute<void>(
            builder: (_) => EcranCarte(api: widget.api, jeton: jeton),
          )
        : MaterialPageRoute<void>(
            builder: (_) => EcranEnregistrement(api: widget.api, jeton: jeton),
          );

    Navigator.of(context).push(destination);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _Heros(surBasculeTheme: widget.surBasculeTheme),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(18, 22, 18, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _formulaireRecherche(p),

                if (_erreur != null) ...[
                  const SizedBox(height: 16),
                  Alerte(ton: Ton.erreur, texte: _erreur!),
                ],

                if (_resultat != null) ...[
                  const SizedBox(height: 16),
                  _Resultat(
                    resultat: _resultat!,
                    occupe: _occupe,
                    surDemarrage: _demarrer,
                  ),
                ],

                const SizedBox(height: 26),
                _LienStatutVol(api: widget.api),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _formulaireRecherche(Palette p) {
    return CarteBloc(
      titre: 'Retrouver mon vol',
      icone: Icons.flight_takeoff_rounded,
      enfant: Form(
        key: _formulaire,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sans compte, sans mot de passe. Vos identifiants de voyage suffisent.',
              style: TextStyle(
                fontFamily: ThemeEnvol.texte,
                fontSize: 13,
                height: 1.5,
                color: p.texteFaible,
              ),
            ),
            const SizedBox(height: 16),

            SegmentedButton<_Mode>(
              segments: const [
                ButtonSegment(value: _Mode.passeport, label: Text('Vol + passeport')),
                ButtonSegment(value: _Mode.dossier, label: Text('Dossier + nom')),
              ],
              selected: {_mode},
              showSelectedIcon: false,
              onSelectionChanged: (choix) => setState(() {
                _mode = choix.first;
                _resultat = null;
                _erreur = null;
              }),
              style: SegmentedButton.styleFrom(
                backgroundColor: p.surface2,
                selectedBackgroundColor: p.accent,
                selectedForegroundColor: Colors.white,
                foregroundColor: p.texteDoux,
                side: BorderSide(color: p.bordure),
                textStyle: const TextStyle(
                  fontFamily: ThemeEnvol.texte,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 18),

            if (_mode == _Mode.passeport) ...[
              _Champ(
                controleur: _numeroVol,
                label: 'Numéro de vol',
                indice: '2J201',
                icone: Icons.flight_rounded,
                majuscules: true,
              ),
              const SizedBox(height: 14),
              _Champ(
                controleur: _passeport,
                label: 'Numéro de passeport',
                indice: 'BF1234567',
                icone: Icons.badge_outlined,
                majuscules: true,
              ),
            ] else ...[
              _Champ(
                controleur: _pnr,
                label: 'Numéro de dossier (PNR)',
                indice: 'ABC123',
                icone: Icons.confirmation_number_outlined,
                majuscules: true,
                longueurMax: 6,
                aide: 'Six caractères, sur votre confirmation de réservation.',
              ),
              const SizedBox(height: 14),
              _Champ(
                controleur: _nom,
                label: 'Nom de famille',
                indice: 'Traoré',
                icone: Icons.person_outline_rounded,
              ),
            ],

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _occupe ? null : _rechercher,
                icon: _occupe
                    ? const SizedBox(
                        width: 17,
                        height: 17,
                        child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                      )
                    : const Icon(Icons.search_rounded, size: 19),
                label: const Text('Rechercher mon vol'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/* ========================================================================== */

class _Heros extends StatelessWidget {
  const _Heros({required this.surBasculeTheme});

  final VoidCallback surBasculeTheme;

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 268,
      pinned: true,
      backgroundColor: Palette.sombre.fond,
      foregroundColor: Colors.white,
      actions: [
        IconButton(
          onPressed: surBasculeTheme,
          icon: Icon(
            Theme.of(context).brightness == Brightness.dark
                ? Icons.light_mode_outlined
                : Icons.dark_mode_outlined,
          ),
          color: Colors.white,
          tooltip: 'Changer de thème',
        ),
        const SizedBox(width: 4),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset('assets/images/hero.jpg', fit: BoxFit.cover),
            // Voile sombre dans les deux thèmes : le texte s'y écrit en blanc.
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [Palette.voileDoux, Palette.voileFort],
                  stops: [0, 0.75],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 22),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const LogoTexte(taille: 34, surFondSombre: true),
                  const SizedBox(height: 16),
                  const Text(
                    "L'envol commence\nbien avant l'aéroport.",
                    style: TextStyle(
                      fontFamily: ThemeEnvol.titre,
                      fontSize: 25,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                      letterSpacing: -0.8,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Enregistrement de 24 h à 3 h avant le départ.',
                    style: TextStyle(
                      fontFamily: ThemeEnvol.texte,
                      fontSize: 13.5,
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/* ========================================================================== */

class _Champ extends StatelessWidget {
  const _Champ({
    required this.controleur,
    required this.label,
    required this.indice,
    required this.icone,
    this.majuscules = false,
    this.longueurMax,
    this.aide,
  });

  final TextEditingController controleur;
  final String label;
  final String indice;
  final IconData icone;
  final bool majuscules;
  final int? longueurMax;
  final String? aide;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controleur,
      maxLength: longueurMax,
      textCapitalization:
          majuscules ? TextCapitalization.characters : TextCapitalization.words,
      autocorrect: false,
      decoration: InputDecoration(
        labelText: label,
        hintText: indice,
        helperText: aide,
        helperMaxLines: 2,
        counterText: '',
        prefixIcon: Icon(icone, size: 20),
      ),
      validator: (valeur) =>
          (valeur == null || valeur.trim().isEmpty) ? 'Ce champ est requis.' : null,
    );
  }
}

/* ========================================================================== */

class _Resultat extends StatelessWidget {
  const _Resultat({
    required this.resultat,
    required this.occupe,
    required this.surDemarrage,
  });

  final Map<String, dynamic> resultat;
  final bool occupe;
  final VoidCallback surDemarrage;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final vol = resultat['vol'] as Map<String, dynamic>;
    final reservation = resultat['reservation'] as Map<String, dynamic>;
    final enregistrement = resultat['enregistrement'] as Map<String, dynamic>;
    final dossier = resultat['dossier_existant'] as Map<String, dynamic>?;
    final franchise = reservation['franchise'] as Map<String, dynamic>? ?? const {};

    final ouvert = enregistrement['etat'] == 'ouvert';
    final statut = vol['statut'] as String?;

    return CarteBloc(
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
                      vol['numero'] as String? ?? '',
                      style: TextStyle(
                        fontFamily: ThemeEnvol.titre,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.6,
                        color: p.texte,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${ville(vol['origine'] as String?)} → ${ville(vol['destination'] as String?)}',
                      style: TextStyle(
                        fontFamily: ThemeEnvol.texte,
                        fontSize: 13.5,
                        color: p.texteDoux,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      enDateHeure(vol['depart_effectif'] as String?),
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
                ton: statut == 'annule'
                    ? Ton.erreur
                    : statut == 'retarde'
                        ? Ton.avertissement
                        : Ton.succes,
              ),
            ],
          ),

          const SizedBox(height: 20),
          Wrap(
            spacing: 30,
            runSpacing: 16,
            children: [
              Donnee(label: 'Passager', valeur: reservation['passager'] as String? ?? '—'),
              Donnee(label: 'Dossier', valeur: reservation['pnr'] as String? ?? '—', mono: true),
              Donnee(
                label: 'Classe',
                valeur: libelleClasse[reservation['classe']] ?? '—',
              ),
              Donnee(
                label: 'Franchise',
                valeur: '${franchise['nb'] ?? 0} × ${franchise['kg'] ?? 0} kg',
              ),
            ],
          ),

          const SizedBox(height: 18),
          Alerte(
            ton: ouvert ? Ton.succes : Ton.avertissement,
            texte: enregistrement['message'] as String? ?? '',
          ),

          if (dossier != null) ...[
            const SizedBox(height: 12),
            Alerte(
              ton: Ton.info,
              texte: 'Un dossier est déjà ouvert (référence '
                  '${dossier['reference']}) : vous allez le retrouver.',
            ),
          ],

          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: (!ouvert || occupe) ? null : surDemarrage,
              icon: const Icon(Icons.arrow_forward_rounded, size: 19),
              label: Text(
                dossier != null
                    ? 'Reprendre mon enregistrement'
                    : "Commencer l'enregistrement",
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/* ========================================================================== */

class _LienStatutVol extends StatelessWidget {
  const _LienStatutVol({required this.api});

  final ApiEnvol api;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => EcranStatutVol(api: api)),
      ),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: p.surface2,
          border: Border.all(color: p.bordure),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          children: [
            Icon(Icons.cell_tower_rounded, size: 22, color: p.accent),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Statut d'un vol",
                    style: TextStyle(
                      fontFamily: ThemeEnvol.titre,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: p.texte,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Retard, porte, annulation — en direct.',
                    style: TextStyle(
                      fontFamily: ThemeEnvol.texte,
                      fontSize: 12.5,
                      color: p.texteFaible,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: p.texteFaible),
          ],
        ),
      ),
    );
  }
}
