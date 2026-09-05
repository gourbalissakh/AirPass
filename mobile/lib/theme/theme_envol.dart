import 'package:flutter/material.dart';

import 'palette.dart';

/// Thèmes Material 3 d'Envol.
///
/// Les couleurs viennent de [Palette], les polices sont embarquées dans
/// l'APK (voir `pubspec.yaml`) : Sora pour les titres, Inter pour le texte
/// courant, JetBrains Mono pour les codes — PNR, références, codes OACI.
class ThemeEnvol {
  const ThemeEnvol._();

  static const titre = 'Sora';
  static const texte = 'Inter';
  static const mono = 'JetBrainsMono';

  static ThemeData sombre() => _construire(Palette.sombre, Brightness.dark);
  static ThemeData clair() => _construire(Palette.clair, Brightness.light);

  static ThemeData _construire(Palette p, Brightness luminosite) {
    // La famille par défaut se pose sur le constructeur : `copyWith` ne
    // l'accepte pas, elle sert de repli à tout texte sans style explicite.
    final base = ThemeData(
      brightness: luminosite,
      useMaterial3: true,
      fontFamily: texte,
    );

    final schema = ColorScheme(
      brightness: luminosite,
      primary: p.accent,
      onPrimary: Colors.white,
      primaryContainer: p.accent.withValues(alpha: 0.14),
      onPrimaryContainer: p.accent,
      secondary: p.or,
      onSecondary: luminosite == Brightness.dark
          ? const Color(0xFF221A04)
          : Colors.white,
      tertiary: p.succes,
      onTertiary: Colors.white,
      error: p.danger,
      onError: Colors.white,
      surface: p.surface,
      onSurface: p.texte,
      surfaceContainerLowest: p.fond,
      surfaceContainerLow: p.surface,
      surfaceContainer: p.surface2,
      surfaceContainerHigh: p.surface2,
      surfaceContainerHighest: p.surface3,
      onSurfaceVariant: p.texteDoux,
      outline: p.bordure,
      outlineVariant: p.bordureForte,
    );

    return base.copyWith(
      colorScheme: schema,
      scaffoldBackgroundColor: p.fond,
      extensions: <ThemeExtension<dynamic>>[p],
      textTheme: _typographie(base.textTheme, p),

      appBarTheme: AppBarTheme(
        backgroundColor: p.fond,
        foregroundColor: p.texte,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: titre,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: p.texte,
          letterSpacing: -0.3,
        ),
      ),

      cardTheme: CardThemeData(
        color: p.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: p.bordure),
        ),
      ),

      // Le bouton principal reprend la hauteur généreuse du web : sur mobile
      // la cible tactile prime sur la densité.
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: p.accent,
          foregroundColor: Colors.white,
          disabledBackgroundColor: p.surface3,
          disabledForegroundColor: p.texteFaible,
          minimumSize: const Size(0, 52),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(
            fontFamily: texte,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.texte,
          backgroundColor: p.surface2,
          minimumSize: const Size(0, 52),
          padding: const EdgeInsets.symmetric(horizontal: 22),
          side: BorderSide(color: p.bordure),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(
            fontFamily: texte,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: p.accent,
          textStyle: const TextStyle(
            fontFamily: texte,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.surface,
        hintStyle: TextStyle(color: p.texteFaible, fontSize: 14),
        labelStyle: TextStyle(
          color: p.texteDoux,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        floatingLabelStyle: TextStyle(color: p.accent, fontWeight: FontWeight.w600),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: _bordure(p.bordure),
        enabledBorder: _bordure(p.bordure),
        focusedBorder: _bordure(p.accent, epaisseur: 2),
        errorBorder: _bordure(p.danger),
        focusedErrorBorder: _bordure(p.danger, epaisseur: 2),
        prefixIconColor: p.texteFaible,
      ),

      dividerTheme: DividerThemeData(color: p.bordure, thickness: 1, space: 1),

      chipTheme: ChipThemeData(
        backgroundColor: p.surface2,
        side: BorderSide(color: p.bordure),
        labelStyle: TextStyle(
          fontFamily: texte,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: p.texteDoux,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: p.surface3,
        contentTextStyle: TextStyle(fontFamily: texte, color: p.texte),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),

      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: p.accent,
        linearTrackColor: p.surface3,
        circularTrackColor: p.surface3,
      ),
    );
  }

  static OutlineInputBorder _bordure(Color couleur, {double epaisseur = 1}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: couleur, width: epaisseur),
    );
  }

  /// Sora sur les titres, Inter partout ailleurs. Les grands corps sont
  /// resserrés : Sora respire beaucoup par défaut.
  static TextTheme _typographie(TextTheme base, Palette p) {
    TextStyle t(double taille, FontWeight graisse, {double interlettre = -0.5}) =>
        TextStyle(
          fontFamily: titre,
          fontSize: taille,
          fontWeight: graisse,
          letterSpacing: interlettre,
          height: 1.1,
          color: p.texte,
        );

    TextStyle c(double taille, FontWeight graisse, {Color? couleur, double hauteur = 1.45}) =>
        TextStyle(
          fontFamily: texte,
          fontSize: taille,
          fontWeight: graisse,
          height: hauteur,
          color: couleur ?? p.texte,
        );

    return base.copyWith(
      displayLarge: t(40, FontWeight.w800),
      displayMedium: t(34, FontWeight.w800),
      displaySmall: t(28, FontWeight.w800),
      headlineMedium: t(24, FontWeight.w700),
      headlineSmall: t(20, FontWeight.w700),
      titleLarge: t(18, FontWeight.w700, interlettre: -0.3),
      titleMedium: t(16, FontWeight.w700, interlettre: -0.2),
      titleSmall: c(14, FontWeight.w600),
      bodyLarge: c(15, FontWeight.w400, couleur: p.texteDoux),
      bodyMedium: c(14, FontWeight.w400, couleur: p.texteDoux),
      bodySmall: c(12.5, FontWeight.w400, couleur: p.texteFaible),
      labelLarge: c(14, FontWeight.w600),
      labelMedium: c(12, FontWeight.w600, couleur: p.texteDoux),
      labelSmall: c(11, FontWeight.w700, couleur: p.texteFaible, hauteur: 1.2),
    );
  }
}
