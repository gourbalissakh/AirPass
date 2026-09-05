import 'package:flutter/material.dart';

import '../theme/palette.dart';
import '../theme/theme_envol.dart';

/// EF-4.1, EF-4.2 — plan interactif de la cabine.
///
/// Les sièges arrivent à plat depuis l'API ; on les regroupe par rangée et on
/// insère le couloir à l'endroit indiqué par le plan du type d'appareil, ce
/// qui rend le composant valable pour n'importe quelle configuration.
class PlanCabine extends StatelessWidget {
  const PlanCabine({
    super.key,
    required this.plan,
    required this.sieges,
    required this.selection,
    required this.surChoix,
    this.occupe = false,
  });

  final Map<String, dynamic> plan;
  final List<Map<String, dynamic>> sieges;
  final String? selection;
  final void Function(String code) surChoix;
  final bool occupe;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    // Regroupement par rangée, dans l'ordre croissant.
    final parRangee = <int, List<Map<String, dynamic>>>{};
    for (final siege in sieges) {
      final rangee = (siege['rangee'] as num).toInt();
      parRangee.putIfAbsent(rangee, () => []).add(siege);
    }
    final rangees = parRangee.keys.toList()..sort();

    final couloirApres = plan['couloir_apres'] as String?;

    return Column(
      children: [
        const _Legende(),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.fromLTRB(10, 42, 10, 26),
          decoration: BoxDecoration(
            color: p.surface2,
            border: Border.all(color: p.bordure, width: 2),
            borderRadius: const BorderRadius.vertical(
              top: Radius.elliptical(160, 90),
              bottom: Radius.circular(26),
            ),
          ),
          child: Column(
            children: [
              Text(
                "AVANT DE L'APPAREIL",
                style: TextStyle(
                  fontFamily: ThemeEnvol.texte,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: p.texteFaible,
                ),
              ),
              const SizedBox(height: 20),
              for (final rangee in rangees)
                Padding(
                  padding: const EdgeInsets.only(bottom: 7),
                  child: _Rangee(
                    numero: rangee,
                    sieges: parRangee[rangee]!,
                    couloirApres: couloirApres,
                    selection: selection,
                    surChoix: surChoix,
                    occupe: occupe,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Rangee extends StatelessWidget {
  const _Rangee({
    required this.numero,
    required this.sieges,
    required this.couloirApres,
    required this.selection,
    required this.surChoix,
    required this.occupe,
  });

  final int numero;
  final List<Map<String, dynamic>> sieges;
  final String? couloirApres;
  final String? selection;
  final void Function(String code) surChoix;
  final bool occupe;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: 22,
          child: Text(
            '$numero',
            textAlign: TextAlign.right,
            style: TextStyle(
              fontFamily: ThemeEnvol.mono,
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: p.texteFaible,
            ),
          ),
        ),
        const SizedBox(width: 6),
        for (var i = 0; i < sieges.length; i++) ...[
          _Siege(
            siege: sieges[i],
            selectionne: selection == sieges[i]['code'],
            surChoix: surChoix,
            desactive: occupe,
          ),
          if (couloirApres != null &&
              couloirApres == sieges[i]['lettre'] &&
              i < sieges.length - 1)
            const SizedBox(width: 22)
          else if (i < sieges.length - 1)
            const SizedBox(width: 6),
        ],
      ],
    );
  }
}

class _Siege extends StatelessWidget {
  const _Siege({
    required this.siege,
    required this.selectionne,
    required this.surChoix,
    required this.desactive,
  });

  final Map<String, dynamic> siege;
  final bool selectionne;
  final void Function(String code) surChoix;
  final bool desactive;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final statut = siege['statut'] as String?;
    final type = siege['type'] as String?;
    final code = siege['code'] as String;

    final retenu = selectionne || statut == 'selectionne';
    final libre = statut == 'libre' || statut == 'selectionne';
    final cliquable = libre && !desactive;

    late final Color fond;
    late final Color bordure;
    late final Color encre;
    var pointille = false;

    if (retenu) {
      fond = p.accent;
      bordure = p.accent;
      encre = Colors.white;
    } else if (statut == 'occupe') {
      fond = p.surface3;
      bordure = p.surface3;
      encre = p.texteFaible;
    } else if (statut == 'bloque') {
      fond = Colors.transparent;
      bordure = p.bordure;
      encre = p.texteFaible.withValues(alpha: 0.5);
      pointille = true;
    } else if (type == 'issue_secours') {
      fond = p.surface;
      bordure = p.succes.withValues(alpha: 0.6);
      encre = p.succes;
    } else if (type == 'premium') {
      fond = p.surface;
      bordure = p.or.withValues(alpha: 0.6);
      encre = p.or;
    } else {
      fond = p.surface;
      bordure = p.bordure;
      encre = p.texteDoux;
    }

    return Semantics(
      // `container` fait du siège un nœud à part entière : sans lui, la
      // lettre affichée à l'intérieur se fond dans l'étiquette et un lecteur
      // d'écran annonce « Siège 12A — hublot, disponible A ».
      container: true,
      excludeSemantics: true,
      button: cliquable,
      selected: retenu,
      label: 'Siège $code — ${_description(siege)}',
      child: GestureDetector(
        onTap: cliquable ? () => surChoix(code) : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: fond,
            borderRadius: BorderRadius.circular(9),
            border: Border.all(
              color: bordure,
              // Flutter ne trace pas de pointillé nativement : un liseré plus
              // pâle suffit à distinguer un siège non attribuable.
              width: pointille ? 1 : 1.4,
            ),
            boxShadow: retenu
                ? [
                    BoxShadow(
                      color: p.accent.withValues(alpha: 0.35),
                      blurRadius: 0,
                      spreadRadius: 3,
                    ),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            siege['lettre'] as String? ?? '',
            style: TextStyle(
              fontFamily: ThemeEnvol.texte,
              fontSize: 11,
              fontWeight: retenu ? FontWeight.w700 : FontWeight.w600,
              color: encre,
            ),
          ),
        ),
      ),
    );
  }

  static String _description(Map<String, dynamic> siege) {
    const types = {
      'issue_secours': 'issue de secours',
      'premium': 'classe affaires',
      'espace_sup': 'espace supplémentaire',
      'standard': 'standard',
    };
    const statuts = {
      'libre': 'disponible',
      'selectionne': 'votre sélection',
      'occupe': 'occupé',
      'bloque': 'non attribuable',
    };

    final type = types[siege['type']] ?? 'standard';
    final statut = statuts[siege['statut']] ?? '';
    return '$type, $statut';
  }
}

class _Legende extends StatelessWidget {
  const _Legende();

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    final entrees = <({Color fond, Color bordure, String libelle})>[
      (fond: p.surface, bordure: p.bordure, libelle: 'Disponible'),
      (fond: p.accent, bordure: p.accent, libelle: 'Votre siège'),
      (fond: p.surface3, bordure: p.surface3, libelle: 'Occupé'),
      (fond: p.surface, bordure: p.succes.withValues(alpha: 0.6), libelle: 'Issue de secours'),
      (fond: p.surface, bordure: p.or.withValues(alpha: 0.6), libelle: 'Affaires'),
    ];

    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 14,
      runSpacing: 8,
      children: [
        for (final e in entrees)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: e.fond,
                  border: Border.all(color: e.bordure, width: 1.4),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                e.libelle,
                style: TextStyle(
                  fontFamily: ThemeEnvol.texte,
                  fontSize: 11.5,
                  color: p.texteFaible,
                ),
              ),
            ],
          ),
      ],
    );
  }
}
