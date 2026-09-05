import 'package:flutter/material.dart';

/// Jetons de couleur d'Envol, portés depuis `web/src/index.css`.
///
/// Material ne connaît qu'une poignée de rôles (primary, surface, error…) ;
/// Envol en utilise davantage — trois niveaux de surface, trois niveaux de
/// texte, une couleur or. Ils voyagent donc dans une extension de thème,
/// récupérable partout par `Theme.of(context).extension<Palette>()`.
///
/// Le thème clair n'est pas le négatif du sombre : fond ivoire plutôt que
/// blanc, encre brune plutôt que noir, et teintes d'accent assombries pour
/// tenir le contraste AA.
@immutable
class Palette extends ThemeExtension<Palette> {
  const Palette({
    required this.fond,
    required this.surface,
    required this.surface2,
    required this.surface3,
    required this.bordure,
    required this.bordureForte,
    required this.texte,
    required this.texteDoux,
    required this.texteFaible,
    required this.accent,
    required this.accentFort,
    required this.or,
    required this.succes,
    required this.danger,
  });

  final Color fond;
  final Color surface;
  final Color surface2;
  final Color surface3;
  final Color bordure;
  final Color bordureForte;
  final Color texte;
  final Color texteDoux;
  final Color texteFaible;
  final Color accent;
  final Color accentFort;
  final Color or;
  final Color succes;
  final Color danger;

  /// Nuit sahélienne : bleu d'encre, terre cuite, or de latérite.
  static const sombre = Palette(
    fond: Color(0xFF0A0F1F),
    surface: Color(0xFF111829),
    surface2: Color(0xFF19233A),
    surface3: Color(0xFF223050),
    bordure: Color(0xFF283654),
    bordureForte: Color(0xFF3B4D75),
    texte: Color(0xFFEDF2FF),
    texteDoux: Color(0xFF9DABC9),
    texteFaible: Color(0xFF6A789E),
    accent: Color(0xFFF26B3A),
    accentFort: Color(0xFFFF8355),
    or: Color(0xFFFFC24B),
    succes: Color(0xFF2FB89A),
    danger: Color(0xFFF0546B),
  );

  /// Plein jour : ivoire chaud, encre brune, accents assombris.
  static const clair = Palette(
    fond: Color(0xFFFBF8F3),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFF4EEE4),
    surface3: Color(0xFFEAE1D3),
    bordure: Color(0xFFE6DCCB),
    bordureForte: Color(0xFFC9B99E),
    texte: Color(0xFF1C1710),
    texteDoux: Color(0xFF574C3D),
    texteFaible: Color(0xFF8A7D6A),
    accent: Color(0xFFC2451A),
    accentFort: Color(0xFFA2380F),
    or: Color(0xFFA8730B),
    succes: Color(0xFF0F6B57),
    danger: Color(0xFFB3261E),
  );

  /// Voile posé sur les photographies : sombre dans les deux thèmes, car les
  /// visuels retenus sont contrastés et le texte s'y écrit en blanc.
  static const voileFort = Color(0xF2060A17);
  static const voileDoux = Color(0xA6060A17);

  @override
  Palette copyWith({
    Color? fond,
    Color? surface,
    Color? surface2,
    Color? surface3,
    Color? bordure,
    Color? bordureForte,
    Color? texte,
    Color? texteDoux,
    Color? texteFaible,
    Color? accent,
    Color? accentFort,
    Color? or,
    Color? succes,
    Color? danger,
  }) {
    return Palette(
      fond: fond ?? this.fond,
      surface: surface ?? this.surface,
      surface2: surface2 ?? this.surface2,
      surface3: surface3 ?? this.surface3,
      bordure: bordure ?? this.bordure,
      bordureForte: bordureForte ?? this.bordureForte,
      texte: texte ?? this.texte,
      texteDoux: texteDoux ?? this.texteDoux,
      texteFaible: texteFaible ?? this.texteFaible,
      accent: accent ?? this.accent,
      accentFort: accentFort ?? this.accentFort,
      or: or ?? this.or,
      succes: succes ?? this.succes,
      danger: danger ?? this.danger,
    );
  }

  @override
  Palette lerp(ThemeExtension<Palette>? autre, double t) {
    if (autre is! Palette) return this;
    Color m(Color a, Color b) => Color.lerp(a, b, t)!;

    return Palette(
      fond: m(fond, autre.fond),
      surface: m(surface, autre.surface),
      surface2: m(surface2, autre.surface2),
      surface3: m(surface3, autre.surface3),
      bordure: m(bordure, autre.bordure),
      bordureForte: m(bordureForte, autre.bordureForte),
      texte: m(texte, autre.texte),
      texteDoux: m(texteDoux, autre.texteDoux),
      texteFaible: m(texteFaible, autre.texteFaible),
      accent: m(accent, autre.accent),
      accentFort: m(accentFort, autre.accentFort),
      or: m(or, autre.or),
      succes: m(succes, autre.succes),
      danger: m(danger, autre.danger),
    );
  }
}

/// Raccourci de lecture : `contexte.palette.accent`.
extension PaletteDuContexte on BuildContext {
  Palette get palette => Theme.of(this).extension<Palette>()!;
}
