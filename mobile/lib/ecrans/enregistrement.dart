import 'package:flutter/material.dart';

import '../api/client.dart';
import '../composants/blocs.dart';
import '../composants/plan_cabine.dart';
import '../format.dart';
import '../theme/palette.dart';
import '../theme/theme_envol.dart';
import 'carte.dart';

/// Modules 6.3 à 6.6 — parcours d'enregistrement du passager.
///
/// Quatre étapes après la recherche du vol, soit cinq au total : c'est la
/// limite que fixe l'exigence non fonctionnelle « Ergonomie ». Chaque étape
/// est enregistrée côté serveur dès qu'elle est validée, de sorte qu'un
/// parcours interrompu se reprend là où il s'est arrêté.
class EcranEnregistrement extends StatefulWidget {
  const EcranEnregistrement({super.key, required this.api, required this.jeton});

  final ApiEnvol api;
  final String jeton;

  @override
  State<EcranEnregistrement> createState() => _EcranEnregistrementState();
}

const _etapes = ['Informations', 'Bagages', 'Siège', 'Confirmation'];

class _EcranEnregistrementState extends State<EcranEnregistrement> {
  int _etape = 0;
  Map<String, dynamic>? _dossier;
  String? _erreur;
  bool _occupe = false;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    try {
      final donnees = await widget.api.dossier(widget.jeton);
      if (!mounted) return;
      setState(() {
        _dossier = donnees;
        // Un dossier déjà finalisé ouvre directement sur le récapitulatif.
        final statut = donnees['statut'];
        if (statut == 'enregistre' || statut == 'embarque') _etape = 3;
      });
    } on ErreurApi catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  /// Exécute un appel d'API en gérant l'occupation et le message d'erreur.
  Future<bool> _agir(Future<void> Function() appel) async {
    setState(() {
      _occupe = true;
      _erreur = null;
    });
    try {
      await appel();
      return true;
    } on ErreurApi catch (e) {
      if (mounted) setState(() => _erreur = e.message);
      return false;
    } finally {
      if (mounted) setState(() => _occupe = false);
    }
  }

  void _allerA(int etape) => setState(() {
        _etape = etape;
        _erreur = null;
      });

  @override
  Widget build(BuildContext context) {
    final dossier = _dossier;

    if (dossier == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Enregistrement')),
        body: _erreur != null
            ? Padding(
                padding: const EdgeInsets.all(18),
                child: Alerte(ton: Ton.erreur, titre: 'Dossier introuvable', texte: _erreur!),
              )
            : const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Enregistrement')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 40),
        children: [
          _EnTeteVol(dossier: dossier),
          const SizedBox(height: 22),
          FilEtapes(etapes: _etapes, courante: _etape),
          const SizedBox(height: 24),

          switch (_etape) {
            0 => _EtapeInformations(
                jeton: widget.jeton,
                api: widget.api,
                occupe: _occupe,
                agir: _agir,
                surSucces: (maj) {
                  setState(() => _dossier = maj);
                  _allerA(1);
                },
              ),
            1 => _EtapeBagages(
                jeton: widget.jeton,
                api: widget.api,
                dossier: dossier,
                occupe: _occupe,
                agir: _agir,
                suivant: () => _allerA(2),
                precedent: () => _allerA(0),
              ),
            2 => _EtapeSiege(
                jeton: widget.jeton,
                api: widget.api,
                occupe: _occupe,
                agir: _agir,
                suivant: () => _allerA(3),
                precedent: () => _allerA(1),
              ),
            _ => _EtapeConfirmation(
                jeton: widget.jeton,
                api: widget.api,
                dossier: dossier,
                occupe: _occupe,
                agir: _agir,
                surFinalisation: (maj) => setState(() => _dossier = maj),
                precedent: () => _allerA(2),
              ),
          },

          if (_erreur != null) ...[
            const SizedBox(height: 18),
            Alerte(ton: Ton.erreur, texte: _erreur!),
          ],
        ],
      ),
    );
  }
}

/* ========================================================================== */

class _EnTeteVol extends StatelessWidget {
  const _EnTeteVol({required this.dossier});

  final Map<String, dynamic> dossier;

  @override
  Widget build(BuildContext context) {
    final vol = dossier['vol'] as Map<String, dynamic>;

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.asset('assets/images/cabine.jpg', fit: BoxFit.cover),
          ),
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                  colors: [Palette.voileDoux, Palette.voileFort],
                  stops: [0, 0.6],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.flight_takeoff_rounded, size: 15, color: Colors.white70),
                    const SizedBox(width: 7),
                    Text(
                      'ENREGISTREMENT EN LIGNE',
                      style: TextStyle(
                        fontFamily: ThemeEnvol.texte,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.8,
                        color: Colors.white.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  '${vol['numero']} · ${ville(vol['origine'] as String?)} → ${ville(vol['destination'] as String?)}',
                  style: const TextStyle(
                    fontFamily: ThemeEnvol.titre,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  enDateHeure(vol['depart_effectif'] as String?),
                  style: TextStyle(
                    fontFamily: ThemeEnvol.texte,
                    fontSize: 13,
                    color: Colors.white.withValues(alpha: 0.75),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Text(
                      'RÉFÉRENCE  ',
                      style: TextStyle(
                        fontFamily: ThemeEnvol.texte,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.4,
                        color: Colors.white.withValues(alpha: 0.6),
                      ),
                    ),
                    Text(
                      dossier['reference'] as String? ?? '',
                      style: const TextStyle(
                        fontFamily: ThemeEnvol.mono,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/* ================================================== Étape 1 — informations */

/// EF-3.2, EF-3.3 — informations passager et question de sûreté.
class _EtapeInformations extends StatefulWidget {
  const _EtapeInformations({
    required this.jeton,
    required this.api,
    required this.occupe,
    required this.agir,
    required this.surSucces,
  });

  final String jeton;
  final ApiEnvol api;
  final bool occupe;
  final Future<bool> Function(Future<void> Function()) agir;
  final void Function(Map<String, dynamic>) surSucces;

  @override
  State<_EtapeInformations> createState() => _EtapeInformationsState();
}

class _EtapeInformationsState extends State<_EtapeInformations> {
  final _formulaire = GlobalKey<FormState>();
  final _champs = {
    'nationalite': TextEditingController(),
    'numero_passeport': TextEditingController(),
    'passeport_expiration': TextEditingController(),
    'date_naissance': TextEditingController(),
    'email': TextEditingController(),
    'telephone': TextEditingController(),
  };
  bool _surete = false;

  @override
  void dispose() {
    for (final c in _champs.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _valider() async {
    if (!_formulaire.currentState!.validate()) return;

    // Les champs laissés vides ne sont pas envoyés : l'API les traite comme
    // « inchangés » plutôt que comme « effacés ».
    final utiles = <String, dynamic>{
      for (final e in _champs.entries)
        if (e.value.text.trim().isNotEmpty) e.key: e.value.text.trim(),
      'securite_confirmee': _surete,
    };

    late Map<String, dynamic> maj;
    final ok = await widget.agir(() async {
      maj = await widget.api.enregistrerInformations(widget.jeton, utiles);
    });

    if (ok && mounted) widget.surSucces(maj);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return CarteBloc(
      titre: 'Vos informations de voyage',
      icone: Icons.badge_outlined,
      enfant: Form(
        key: _formulaire,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ChampTexte(
              controleur: _champs['nationalite']!,
              label: 'Nationalité (code à 3 lettres)',
              indice: 'BFA',
              longueurMax: 3,
              majuscules: true,
              validateur: (v) => (v != null && v.isNotEmpty && v.length != 3)
                  ? 'Trois lettres, par exemple BFA.'
                  : null,
            ),
            const SizedBox(height: 14),
            _ChampTexte(
              controleur: _champs['numero_passeport']!,
              label: 'Numéro de passeport',
              indice: 'BF1234567',
              majuscules: true,
            ),
            const SizedBox(height: 14),
            _ChampDate(
              controleur: _champs['passeport_expiration']!,
              label: "Expiration du passeport",
              futur: true,
            ),
            const SizedBox(height: 14),
            _ChampDate(
              controleur: _champs['date_naissance']!,
              label: 'Date de naissance',
              futur: false,
            ),
            const SizedBox(height: 14),
            _ChampTexte(
              controleur: _champs['email']!,
              label: 'Adresse e-mail',
              indice: 'awa@example.com',
              clavier: TextInputType.emailAddress,
            ),
            const SizedBox(height: 14),
            _ChampTexte(
              controleur: _champs['telephone']!,
              label: 'Téléphone',
              indice: '+226 70 00 00 00',
              clavier: TextInputType.phone,
            ),

            const SizedBox(height: 20),
            // EF-3.3 — la question de sûreté conditionne la suite du parcours.
            InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => setState(() => _surete = !_surete),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: p.surface2,
                  border: Border.all(color: _surete ? p.accent : p.bordure),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _surete,
                      onChanged: (v) => setState(() => _surete = v ?? false),
                      activeColor: p.accent,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Je confirme que mes bagages ont été préparés par mes soins "
                        "et ne contiennent aucun objet interdit au transport aérien.",
                        style: TextStyle(
                          fontFamily: ThemeEnvol.texte,
                          fontSize: 13,
                          height: 1.5,
                          color: p.texte,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: widget.occupe ? null : _valider,
                child: const Text('Continuer'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/* ======================================================= Étape 2 — bagages */

/// EF-5.2, EF-5.3 — déclaration des bagages en soute.
class _EtapeBagages extends StatefulWidget {
  const _EtapeBagages({
    required this.jeton,
    required this.api,
    required this.dossier,
    required this.occupe,
    required this.agir,
    required this.suivant,
    required this.precedent,
  });

  final String jeton;
  final ApiEnvol api;
  final Map<String, dynamic> dossier;
  final bool occupe;
  final Future<bool> Function(Future<void> Function()) agir;
  final VoidCallback suivant;
  final VoidCallback precedent;

  @override
  State<_EtapeBagages> createState() => _EtapeBagagesState();
}

class _EtapeBagagesState extends State<_EtapeBagages> {
  int _nb = 1;
  final _poids = TextEditingController(text: '20');
  Map<String, dynamic>? _depassement;

  @override
  void dispose() {
    _poids.dispose();
    super.dispose();
  }

  Future<void> _declarer() async {
    final poids = double.tryParse(_poids.text.replaceAll(',', '.'));
    if (poids == null) return;

    late Map<String, dynamic> reponse;
    final ok = await widget.agir(() async {
      reponse = await widget.api.declarerBagages(widget.jeton, nb: _nb, poidsEstime: poids);
    });

    if (!ok || !mounted) return;

    final depassement = reponse['depassement'] as Map<String, dynamic>?;
    if (depassement == null) {
      widget.suivant();
    } else {
      // Le dépassement n'est pas bloquant : on le montre, le passager décide.
      setState(() => _depassement = depassement);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return CarteBloc(
      titre: 'Vos bagages en soute',
      icone: Icons.luggage_outlined,
      enfant: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Nombre de pièces',
            style: TextStyle(
              fontFamily: ThemeEnvol.texte,
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: p.texteDoux,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _BoutonRond(
                icone: Icons.remove_rounded,
                actif: _nb > 0,
                surAppui: () => setState(() => _nb--),
              ),
              Expanded(
                child: Text(
                  '$_nb',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: ThemeEnvol.titre,
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                    color: p.texte,
                  ),
                ),
              ),
              _BoutonRond(
                icone: Icons.add_rounded,
                actif: _nb < 9,
                surAppui: () => setState(() => _nb++),
              ),
            ],
          ),

          const SizedBox(height: 20),
          TextField(
            controller: _poids,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Poids total estimé',
              suffixText: 'kg',
              prefixIcon: Icon(Icons.scale_outlined, size: 20),
            ),
          ),

          const SizedBox(height: 14),
          Text(
            'Le poids définitif est celui de la balance du comptoir. '
            'Cette estimation sert à vous prévenir en cas de dépassement.',
            style: TextStyle(
              fontFamily: ThemeEnvol.texte,
              fontSize: 12,
              height: 1.5,
              color: p.texteFaible,
            ),
          ),

          if (_depassement != null) ...[
            const SizedBox(height: 16),
            Alerte(
              ton: Ton.avertissement,
              titre: 'Franchise dépassée',
              texte: _depassement!['message'] as String? ?? '',
            ),
          ],

          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.occupe ? null : widget.precedent,
                  child: const Text('Retour'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: widget.occupe ? null : (_depassement != null ? widget.suivant : _declarer),
                  child: Text(_depassement != null ? 'Continuer quand même' : 'Continuer'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BoutonRond extends StatelessWidget {
  const _BoutonRond({required this.icone, required this.actif, required this.surAppui});

  final IconData icone;
  final bool actif;
  final VoidCallback surAppui;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return IconButton.filled(
      onPressed: actif ? surAppui : null,
      icon: Icon(icone, size: 22),
      style: IconButton.styleFrom(
        backgroundColor: p.surface2,
        foregroundColor: p.texte,
        disabledBackgroundColor: p.surface2,
        disabledForegroundColor: p.texteFaible,
        side: BorderSide(color: p.bordure),
        minimumSize: const Size(48, 48),
      ),
    );
  }
}

/* ========================================================= Étape 3 — siège */

/// EF-4.1 à EF-4.5 — plan de cabine et sélection du siège.
class _EtapeSiege extends StatefulWidget {
  const _EtapeSiege({
    required this.jeton,
    required this.api,
    required this.occupe,
    required this.agir,
    required this.suivant,
    required this.precedent,
  });

  final String jeton;
  final ApiEnvol api;
  final bool occupe;
  final Future<bool> Function(Future<void> Function()) agir;
  final VoidCallback suivant;
  final VoidCallback precedent;

  @override
  State<_EtapeSiege> createState() => _EtapeSiegeState();
}

class _EtapeSiegeState extends State<_EtapeSiege> {
  Map<String, dynamic>? _cabine;
  String? _selection;

  @override
  void initState() {
    super.initState();
    _chargerCabine();
  }

  Future<void> _chargerCabine() async {
    await widget.agir(() async {
      final donnees = await widget.api.cabine(widget.jeton);
      if (!mounted) return;
      setState(() {
        _cabine = donnees;
        // Un siège déjà verrouillé par ce dossier revient marqué « selectionne ».
        final sieges = (donnees['sieges'] as List).cast<Map<String, dynamic>>();
        for (final s in sieges) {
          if (s['statut'] == 'selectionne') _selection = s['code'] as String;
        }
      });
    });
  }

  Future<void> _choisir(String code) async {
    final ok = await widget.agir(() async {
      await widget.api.choisirSiege(widget.jeton, code);
    });

    if (!ok) {
      // Le siège a pu être pris entre l'affichage et le clic : on recharge.
      await _chargerCabine();
      return;
    }
    if (mounted) setState(() => _selection = code);
  }

  @override
  Widget build(BuildContext context) {
    final cabine = _cabine;
    final p = context.palette;

    if (cabine == null) {
      return const CarteBloc(
        titre: 'Choix du siège',
        icone: Icons.airline_seat_recline_normal_rounded,
        enfant: Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 40),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    final avion = cabine['avion'] as Map<String, dynamic>;

    return CarteBloc(
      titre: 'Choix du siège — ${avion['nom']}',
      icone: Icons.airline_seat_recline_normal_rounded,
      enfant: Column(
        children: [
          PlanCabine(
            plan: cabine['plan'] as Map<String, dynamic>,
            sieges: (cabine['sieges'] as List).cast<Map<String, dynamic>>(),
            selection: _selection,
            surChoix: _choisir,
            occupe: widget.occupe,
          ),

          const SizedBox(height: 20),
          if (_selection != null)
            Alerte(
              ton: Ton.succes,
              texte: 'Siège $_selection retenu. Il vous est réservé le temps '
                  'de terminer votre enregistrement.',
            )
          else
            Text(
              'Touchez un siège libre pour le réserver.',
              style: TextStyle(
                fontFamily: ThemeEnvol.texte,
                fontSize: 13,
                color: p.texteFaible,
              ),
            ),

          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.occupe ? null : widget.precedent,
                  child: const Text('Retour'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: (widget.occupe || _selection == null) ? null : widget.suivant,
                  child: const Text('Continuer'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/* ================================================== Étape 4 — confirmation */

/// EF-6.1 — récapitulatif puis émission de la carte d'embarquement.
class _EtapeConfirmation extends StatelessWidget {
  const _EtapeConfirmation({
    required this.jeton,
    required this.api,
    required this.dossier,
    required this.occupe,
    required this.agir,
    required this.surFinalisation,
    required this.precedent,
  });

  final String jeton;
  final ApiEnvol api;
  final Map<String, dynamic> dossier;
  final bool occupe;
  final Future<bool> Function(Future<void> Function()) agir;
  final void Function(Map<String, dynamic>) surFinalisation;
  final VoidCallback precedent;

  bool get _finalise =>
      dossier['statut'] == 'enregistre' || dossier['statut'] == 'embarque';

  @override
  Widget build(BuildContext context) {
    final vol = dossier['vol'] as Map<String, dynamic>;
    final passager = dossier['passager'] as Map<String, dynamic>;
    final bagages = dossier['bagages'] as Map<String, dynamic>? ?? const {};

    return CarteBloc(
      titre: 'Récapitulatif',
      icone: Icons.fact_check_outlined,
      enfant: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 30,
            runSpacing: 18,
            children: [
              Donnee(label: 'Passager', valeur: passager['nom_complet'] as String? ?? '—'),
              Donnee(label: 'Vol', valeur: vol['numero'] as String? ?? '—'),
              Donnee(label: 'Siège', valeur: dossier['siege'] as String? ?? '—', accent: true),
              Donnee(label: 'Porte', valeur: vol['porte'] as String? ?? '—'),
              Donnee(
                label: 'Bagages déclarés',
                valeur: '${bagages['nb'] ?? 0} pièce(s) · ${bagages['poids_estime'] ?? 0} kg',
              ),
              Donnee(label: 'Départ', valeur: enDateHeure(vol['depart_effectif'] as String?)),
            ],
          ),

          const SizedBox(height: 22),

          if (_finalise) ...[
            const Alerte(
              ton: Ton.succes,
              titre: 'Enregistrement terminé',
              texte: "Votre carte d'embarquement est prête. Elle reste "
                  "consultable sans réseau depuis cet appareil.",
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () => Navigator.of(context).pushReplacement(
                  MaterialPageRoute<void>(
                    builder: (_) => EcranCarte(api: api, jeton: jeton),
                  ),
                ),
                icon: const Icon(Icons.qr_code_2_rounded, size: 20),
                label: const Text("Voir ma carte d'embarquement"),
              ),
            ),
          ] else ...[
            const Alerte(
              ton: Ton.info,
              texte: "En finalisant, vous recevez votre carte d'embarquement. "
                  "Vous pourrez encore modifier votre siège jusqu'à la clôture.",
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: occupe ? null : precedent,
                    child: const Text('Retour'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    onPressed: occupe
                        ? null
                        : () async {
                            late Map<String, dynamic> maj;
                            final ok = await agir(() async {
                              maj = await api.finaliser(jeton);
                            });
                            if (ok) surFinalisation(maj);
                          },
                    child: const Text("Finaliser l'enregistrement"),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/* ========================================================================== */

class _ChampTexte extends StatelessWidget {
  const _ChampTexte({
    required this.controleur,
    required this.label,
    this.indice,
    this.longueurMax,
    this.majuscules = false,
    this.clavier,
    this.validateur,
  });

  final TextEditingController controleur;
  final String label;
  final String? indice;
  final int? longueurMax;
  final bool majuscules;
  final TextInputType? clavier;
  final String? Function(String?)? validateur;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controleur,
      maxLength: longueurMax,
      keyboardType: clavier,
      autocorrect: false,
      textCapitalization:
          majuscules ? TextCapitalization.characters : TextCapitalization.none,
      decoration: InputDecoration(
        labelText: label,
        hintText: indice,
        counterText: '',
      ),
      validator: validateur,
    );
  }
}

/// Champ de date : le sélecteur natif évite les formats douteux saisis à la
/// main, que l'API refuserait.
class _ChampDate extends StatelessWidget {
  const _ChampDate({
    required this.controleur,
    required this.label,
    required this.futur,
  });

  final TextEditingController controleur;
  final String label;
  final bool futur;

  @override
  Widget build(BuildContext context) {
    final maintenant = DateTime.now();

    return TextFormField(
      controller: controleur,
      readOnly: true,
      decoration: InputDecoration(
        labelText: label,
        hintText: 'AAAA-MM-JJ',
        prefixIcon: const Icon(Icons.calendar_today_outlined, size: 19),
      ),
      onTap: () async {
        final choix = await showDatePicker(
          context: context,
          initialDate: futur
              ? maintenant.add(const Duration(days: 365))
              : DateTime(maintenant.year - 30),
          firstDate: futur ? maintenant : DateTime(1920),
          lastDate: futur ? DateTime(maintenant.year + 20) : maintenant,
          helpText: label,
        );

        if (choix != null) {
          // L'API attend une date ISO ; c'est aussi ce que Dart produit.
          controleur.text = choix.toIso8601String().split('T').first;
        }
      },
    );
  }
}
