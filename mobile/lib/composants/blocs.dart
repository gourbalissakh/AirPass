import 'package:flutter/material.dart';

import '../theme/palette.dart';
import '../theme/theme_envol.dart';

/// Briques d'interface communes à tous les écrans.
///
/// Le pendant Dart de `web/src/composants/Ui.jsx` : mêmes noms, mêmes tons,
/// pour qu'une correction de style se répercute des deux côtés sans avoir à
/// retrouver l'équivalent.

/// Ton d'un message. Détermine la couleur, l'icône et le fond.
enum Ton { info, succes, avertissement, erreur, neutre }

({Color teinte, IconData icone}) _styleTon(Ton ton, Palette p) => switch (ton) {
      Ton.info => (teinte: p.accent, icone: Icons.info_outline_rounded),
      Ton.succes => (teinte: p.succes, icone: Icons.check_circle_outline_rounded),
      Ton.avertissement => (teinte: p.or, icone: Icons.warning_amber_rounded),
      Ton.erreur => (teinte: p.danger, icone: Icons.error_outline_rounded),
      Ton.neutre => (teinte: p.texteDoux, icone: Icons.circle_outlined),
    };

/// Message encadré, teinté selon son ton.
class Alerte extends StatelessWidget {
  const Alerte({super.key, this.ton = Ton.info, this.titre, required this.texte});

  final Ton ton;
  final String? titre;
  final String texte;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final style = _styleTon(ton, p);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: style.teinte.withValues(alpha: 0.10),
        border: Border.all(color: style.teinte.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(style.icone, size: 19, color: style.teinte),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (titre != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Text(
                      titre!,
                      style: TextStyle(
                        fontFamily: ThemeEnvol.texte,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: p.texte,
                      ),
                    ),
                  ),
                Text(
                  texte,
                  style: TextStyle(
                    fontFamily: ThemeEnvol.texte,
                    fontSize: 13.5,
                    height: 1.45,
                    color: p.texte,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Pastille de statut, à poser près d'un titre.
class Etiquette extends StatelessWidget {
  const Etiquette({
    super.key,
    required this.texte,
    this.ton = Ton.neutre,
    this.point = false,
    this.surFondSombre = false,
  });

  final String texte;
  final Ton ton;
  final bool point;
  final bool surFondSombre;

  @override
  Widget build(BuildContext context) {
    final p = surFondSombre ? Palette.sombre : context.palette;
    final teinte = _styleTon(ton, p).teinte;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: teinte.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (point) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: teinte, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            texte.toUpperCase(),
            style: TextStyle(
              fontFamily: ThemeEnvol.texte,
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: teinte,
            ),
          ),
        ],
      ),
    );
  }
}

/// Carte de contenu, avec titre facultatif et icône.
class CarteBloc extends StatelessWidget {
  const CarteBloc({
    super.key,
    this.titre,
    this.icone,
    this.action,
    required this.enfant,
    this.remplissage = const EdgeInsets.all(18),
  });

  final String? titre;
  final IconData? icone;
  final Widget? action;
  final Widget enfant;
  final EdgeInsets remplissage;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: p.surface,
        border: Border.all(color: p.bordure),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (titre != null)
            Container(
              padding: const EdgeInsets.fromLTRB(18, 13, 12, 13),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: p.bordure)),
              ),
              child: Row(
                children: [
                  if (icone != null) ...[
                    Icon(icone, size: 16, color: p.accent),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text(
                      titre!.toUpperCase(),
                      style: TextStyle(
                        fontFamily: ThemeEnvol.titre,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.1,
                        color: p.texteDoux,
                      ),
                    ),
                  ),
                  ?action,
                ],
              ),
            ),
          Padding(padding: remplissage, child: enfant),
        ],
      ),
    );
  }
}

/// Paire libellé / valeur — la brique de tous les récapitulatifs.
class Donnee extends StatelessWidget {
  const Donnee({
    super.key,
    required this.label,
    required this.valeur,
    this.accent = false,
    this.mono = false,
    this.surFondSombre = false,
  });

  final String label;
  final String valeur;
  final bool accent;
  final bool mono;
  final bool surFondSombre;

  @override
  Widget build(BuildContext context) {
    final p = surFondSombre ? Palette.sombre : context.palette;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontFamily: ThemeEnvol.texte,
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.9,
            color: p.texteFaible,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          valeur,
          style: TextStyle(
            fontFamily: accent
                ? ThemeEnvol.titre
                : mono
                    ? ThemeEnvol.mono
                    : ThemeEnvol.texte,
            fontSize: accent ? 22 : 14.5,
            fontWeight: accent ? FontWeight.w800 : FontWeight.w600,
            color: accent ? p.accent : p.texte,
          ),
        ),
      ],
    );
  }
}

/// État vide, neutre et explicite.
class Vide extends StatelessWidget {
  const Vide({super.key, required this.titre, this.icone, this.texte});

  final String titre;
  final IconData? icone;
  final String? texte;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      child: Column(
        children: [
          if (icone != null) ...[
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: p.surface2,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icone, size: 21, color: p.texteFaible),
            ),
            const SizedBox(height: 14),
          ],
          Text(
            titre,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: ThemeEnvol.titre,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: p.texteDoux,
            ),
          ),
          if (texte != null) ...[
            const SizedBox(height: 6),
            Text(
              texte!,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: ThemeEnvol.texte,
                fontSize: 13.5,
                height: 1.5,
                color: p.texteFaible,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Fil des étapes du parcours d'enregistrement.
class FilEtapes extends StatelessWidget {
  const FilEtapes({super.key, required this.etapes, required this.courante});

  final List<String> etapes;
  final int courante;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Row(
      children: List.generate(etapes.length * 2 - 1, (i) {
        if (i.isOdd) {
          final avant = i ~/ 2;
          return Expanded(
            child: Container(
              height: 2,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              color: avant < courante ? p.succes : p.bordure,
            ),
          );
        }

        final index = i ~/ 2;
        final faite = index < courante;
        final active = index == courante;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: faite
                    ? p.succes
                    : active
                        ? p.accent
                        : p.surface2,
                border: Border.all(
                  color: faite || active ? Colors.transparent : p.bordure,
                ),
              ),
              child: faite
                  ? const Icon(Icons.check_rounded, size: 17, color: Colors.white)
                  : Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          fontFamily: ThemeEnvol.texte,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: active ? Colors.white : p.texteFaible,
                        ),
                      ),
                    ),
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: 66,
              child: Text(
                etapes[index],
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: ThemeEnvol.texte,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: faite || active ? p.texte : p.texteFaible,
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
