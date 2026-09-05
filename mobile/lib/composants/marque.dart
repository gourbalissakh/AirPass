import 'package:flutter/material.dart';

import '../theme/palette.dart';
import '../theme/theme_envol.dart';

/// Marque Envol.
///
/// Un « E » couché : trois barres inclinées de 18° vers le haut, la première
/// terminée en pointe comme une aile, les suivantes plus courtes et plus
/// pâles — la traînée que laisse un appareil qui prend de l'altitude.
///
/// Même tracé que `web/src/composants/Logo.jsx`, redessiné en widgets plutôt
/// qu'en SVG : à cette échelle, trois rectangles arrondis et un triangle
/// suffisent, et rien n'a besoin d'être rasterisé.
class Logo extends StatelessWidget {
  const Logo({super.key, this.taille = 40, this.surFondSombre = false});

  final double taille;

  /// Sur une photographie, le dégradé passe en version « nuit » : les teintes
  /// assombries du thème clair y seraient trop sourdes.
  final bool surFondSombre;

  @override
  Widget build(BuildContext context) {
    final p = surFondSombre ? Palette.sombre : context.palette;
    final u = taille / 48; // Le tracé est défini dans une grille de 48 unités.

    return SizedBox(
      width: taille,
      height: taille,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(13.5 * u),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [p.accentFort, p.accent, p.or],
            stops: const [0, 0.48, 1],
          ),
        ),
        child: Center(
          child: Transform.rotate(
            angle: -18 * 3.1415926535 / 180,
            child: SizedBox(
              width: 30 * u,
              height: 26 * u,
              child: CustomPaint(painter: _TraceE(unite: u)),
            ),
          ),
        ),
      ),
    );
  }
}

class _TraceE extends CustomPainter {
  const _TraceE({required this.unite});

  final double unite;

  @override
  void paint(Canvas toile, Size taille) {
    final u = unite;
    final pinceau = Paint()..color = Colors.white;
    final rayon = Radius.circular(2.6 * u);

    // Barre haute : un rectangle arrondi prolongé d'une pointe.
    final barre = RRect.fromLTRBR(0, 0, 13.1 * u, 5.2 * u, rayon);
    toile.drawRRect(barre, pinceau);

    final pointe = Path()
      ..moveTo(13.1 * u, 0)
      ..lineTo(19.8 * u, 2.6 * u)
      ..lineTo(13.1 * u, 5.2 * u)
      ..close();
    toile.drawPath(pointe, pinceau);

    // Deux barres de traînée, plus courtes et plus pâles.
    toile.drawRRect(
      RRect.fromLTRBR(0, 8.2 * u, 15 * u, 13.4 * u, rayon),
      Paint()..color = Colors.white.withValues(alpha: 0.9),
    );
    toile.drawRRect(
      RRect.fromLTRBR(0, 16.4 * u, 9.4 * u, 21.6 * u, rayon),
      Paint()..color = Colors.white.withValues(alpha: 0.72),
    );
  }

  @override
  bool shouldRepaint(_TraceE ancien) => ancien.unite != unite;
}

/// Logo + mot-symbole. `Envol` est le service, `Air Burkina` l'exploitant.
class LogoTexte extends StatelessWidget {
  const LogoTexte({
    super.key,
    this.taille = 36,
    this.sousTitre = 'par Air Burkina',
    this.surFondSombre = false,
  });

  final double taille;
  final String? sousTitre;
  final bool surFondSombre;

  @override
  Widget build(BuildContext context) {
    final p = surFondSombre ? Palette.sombre : context.palette;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Logo(taille: taille, surFondSombre: surFondSombre),
        SizedBox(width: taille * 0.24),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Envol',
              style: TextStyle(
                fontFamily: ThemeEnvol.titre,
                fontSize: taille * 0.5,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
                height: 1.1,
                color: p.texte,
              ),
            ),
            if (sousTitre != null)
              Text(
                sousTitre!.toUpperCase(),
                style: TextStyle(
                  fontFamily: ThemeEnvol.texte,
                  fontSize: taille * 0.28,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.6,
                  height: 1.3,
                  color: p.texteFaible,
                ),
              ),
          ],
        ),
      ],
    );
  }
}
