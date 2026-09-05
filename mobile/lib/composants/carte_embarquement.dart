import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../format.dart';
import '../theme/palette.dart';
import '../theme/theme_envol.dart';
import 'blocs.dart';
import 'marque.dart';

/// EF-6.1, EF-6.4 — carte d'embarquement numérique.
///
/// La mise en page reprend le talon d'une vraie carte : le bandeau de la
/// compagnie, le trajet, les cases de renseignements, puis la souche portant
/// le QR code que l'agent scanne au comptoir.
///
/// Le QR est toujours tracé en noir sur blanc, même en thème sombre : un
/// lecteur optique attend ce contraste, et l'écran d'un téléphone en pleine
/// lumière ne pardonne rien.
class CarteEmbarquement extends StatelessWidget {
  const CarteEmbarquement({super.key, required this.carte});

  final Map<String, dynamic> carte;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;
    final vol = carte['vol'] as Map<String, dynamic>;
    final passager = carte['passager'] as Map<String, dynamic>;
    final bagages = carte['bagages'] as Map<String, dynamic>? ?? const {};
    final retarde = vol['depart_effectif'] != vol['depart_prevu'];

    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border.all(color: p.bordure),
        borderRadius: BorderRadius.circular(20),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Bandeau(numero: vol['numero'] as String? ?? '', reference: carte['reference'] as String? ?? ''),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Trajet(vol: vol),

                if (retarde) ...[
                  const SizedBox(height: 18),
                  Alerte(
                    ton: Ton.avertissement,
                    texte: 'Horaire modifié — départ initialement prévu à '
                        '${enHeure(vol['depart_prevu'] as String?)}.',
                  ),
                ],

                const SizedBox(height: 22),
                Wrap(
                  spacing: 28,
                  runSpacing: 18,
                  children: [
                    Donnee(label: 'Passager', valeur: passager['nom_complet'] as String? ?? '—'),
                    Donnee(label: 'Siège', valeur: carte['siege'] as String? ?? '—', accent: true),
                    Donnee(label: 'Porte', valeur: vol['porte'] as String? ?? '—', accent: true),
                    Donnee(label: 'Embarquement', valeur: enHeure(vol['embarquement'] as String?)),
                    Donnee(
                      label: 'Classe',
                      valeur: libelleClasse[carte['classe']] ?? '—',
                    ),
                    Donnee(label: 'Dossier', valeur: carte['pnr'] as String? ?? '—', mono: true),
                    Donnee(label: 'Bagages', valeur: '${bagages['nb'] ?? 0} pièce(s)'),
                    Donnee(label: 'Date', valeur: enDate(vol['depart_prevu'] as String?)),
                  ],
                ),
              ],
            ),
          ),

          _Souche(contenu: carte['qr'] as String? ?? ''),

          Container(
            width: double.infinity,
            color: p.surface2,
            padding: const EdgeInsets.all(18),
            child: Text(
              "Présentez-vous au comptoir Air Burkina avec une pièce d'identité "
              "valide. L'enregistrement en ligne ne dispense ni des contrôles de "
              "sûreté ni du dépôt des bagages en soute.",
              style: TextStyle(
                fontFamily: ThemeEnvol.texte,
                fontSize: 11.5,
                height: 1.6,
                color: p.texteFaible,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bandeau extends StatelessWidget {
  const _Bandeau({required this.numero, required this.reference});

  final String numero;
  final String reference;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [p.accentFort, p.accent, p.or],
          stops: const [0, 0.5, 1],
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Logo(taille: 32, surFondSombre: true),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "CARTE D'EMBARQUEMENT",
                  style: TextStyle(
                    fontFamily: ThemeEnvol.texte,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Air Burkina · $numero',
                  style: const TextStyle(
                    fontFamily: ThemeEnvol.titre,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'RÉFÉRENCE',
                style: TextStyle(
                  fontFamily: ThemeEnvol.texte,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.6,
                  color: Colors.white.withValues(alpha: 0.85),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                reference,
                style: const TextStyle(
                  fontFamily: ThemeEnvol.mono,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Trajet extends StatelessWidget {
  const _Trajet({required this.vol});

  final Map<String, dynamic> vol;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _Escale(
          code: vol['origine'] as String? ?? '',
          heure: vol['depart_effectif'] as String?,
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 26),
            child: Icon(Icons.flight_takeoff_rounded, size: 24, color: p.accent),
          ),
        ),
        _Escale(code: vol['destination'] as String? ?? ''),
      ],
    );
  }
}

class _Escale extends StatelessWidget {
  const _Escale({required this.code, this.heure});

  final String code;
  final String? heure;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          code,
          style: TextStyle(
            fontFamily: ThemeEnvol.titre,
            fontSize: 36,
            fontWeight: FontWeight.w800,
            height: 1,
            letterSpacing: -1,
            color: p.texte,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          ville(code),
          style: TextStyle(
            fontFamily: ThemeEnvol.texte,
            fontSize: 11.5,
            color: p.texteFaible,
          ),
        ),
        if (heure != null) ...[
          const SizedBox(height: 5),
          Text(
            enHeure(heure),
            style: TextStyle(
              fontFamily: ThemeEnvol.titre,
              fontSize: 19,
              fontWeight: FontWeight.w700,
              color: p.accent,
            ),
          ),
        ],
      ],
    );
  }
}

/// Souche détachable : le QR et sa transcription lisible.
class _Souche extends StatelessWidget {
  const _Souche({required this.contenu});

  final String contenu;

  @override
  Widget build(BuildContext context) {
    final p = context.palette;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 20),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: p.bordureForte)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: QrImageView(
              data: contenu,
              version: QrVersions.auto,
              size: 190,
              gapless: true,
              // Le lecteur du comptoir attend du noir sur blanc, quel que
              // soit le thème choisi par le passager.
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: Colors.black,
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: Colors.black,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            contenu,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: ThemeEnvol.mono,
              fontSize: 9.5,
              height: 1.5,
              color: p.texteFaible,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "Si le scan échoue, l'agent peut saisir cette ligne à la main.",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: ThemeEnvol.texte,
              fontSize: 11,
              color: p.texteFaible,
            ),
          ),
        ],
      ),
    );
  }
}
