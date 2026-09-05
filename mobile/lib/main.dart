import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api/client.dart';
import 'ecrans/accueil.dart';
import 'theme/theme_envol.dart';

/// Envol — enregistrement en ligne des passagers Air Burkina.
///
/// L'application consomme la même API que le site : aucun point d'entrée ne
/// lui est propre, seul le canal déclaré change (`mobile` au lieu de `web`),
/// ce qui permet au back-office de distinguer les deux dans ses statistiques.
void main() {
  runApp(const ApplicationEnvol());
}

class ApplicationEnvol extends StatefulWidget {
  const ApplicationEnvol({super.key});

  @override
  State<ApplicationEnvol> createState() => _ApplicationEnvolState();
}

class _ApplicationEnvolState extends State<ApplicationEnvol> {
  static const _cleTheme = 'envol.theme';

  final _api = ApiEnvol();
  ThemeMode _theme = ThemeMode.system;

  @override
  void initState() {
    super.initState();
    _restaurerTheme();
  }

  @override
  void dispose() {
    _api.fermer();
    super.dispose();
  }

  Future<void> _restaurerTheme() async {
    final rangement = await SharedPreferences.getInstance();
    final enregistre = rangement.getString(_cleTheme);
    if (!mounted || enregistre == null) return;

    setState(() {
      _theme = switch (enregistre) {
        'clair' => ThemeMode.light,
        'sombre' => ThemeMode.dark,
        _ => ThemeMode.system,
      };
    });
  }

  /// Bascule clair / sombre. Le mode « système » compte comme clair au
  /// premier appui : l'utilisateur qui touche le bouton veut voir un
  /// changement, pas revenir à son réglage d'origine.
  Future<void> _basculerTheme() async {
    final sombreActuel = _theme == ThemeMode.dark ||
        (_theme == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);

    final nouveau = sombreActuel ? ThemeMode.light : ThemeMode.dark;
    setState(() => _theme = nouveau);

    final rangement = await SharedPreferences.getInstance();
    await rangement.setString(_cleTheme, nouveau == ThemeMode.dark ? 'sombre' : 'clair');
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Envol',
      debugShowCheckedModeBanner: false,
      theme: ThemeEnvol.clair(),
      darkTheme: ThemeEnvol.sombre(),
      themeMode: _theme,
      home: AnnotatedRegion<SystemUiOverlayStyle>(
        // Le héros de l'accueil est sombre dans les deux thèmes : la barre
        // d'état doit y écrire en blanc.
        value: SystemUiOverlayStyle.light,
        child: EcranAccueil(api: _api, surBasculeTheme: _basculerTheme),
      ),
    );
  }
}
