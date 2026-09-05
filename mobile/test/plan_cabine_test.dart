import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:envol/composants/plan_cabine.dart';
import 'package:envol/theme/palette.dart';
import 'package:envol/theme/theme_envol.dart';

/// Le plan de cabine porte une règle métier visible à l'œil nu : un siège
/// occupé ou bloqué ne doit pas être sélectionnable (EF-4.2). Ces tests la
/// vérifient sur le rendu réel plutôt que sur l'intention.
void main() {
  Map<String, dynamic> siege(
    String code, {
    required int rangee,
    required String lettre,
    String statut = 'libre',
    String type = 'standard',
  }) =>
      {
        'code': code,
        'rangee': rangee,
        'lettre': lettre,
        'classe': 'economique',
        'type': type,
        'statut': statut,
      };

  Future<List<String>> poser(
    WidgetTester testeur, {
    required List<Map<String, dynamic>> sieges,
    String? selection,
  }) async {
    final touches = <String>[];

    await testeur.pumpWidget(
      MaterialApp(
        theme: ThemeEnvol.clair(),
        home: Scaffold(
          body: SingleChildScrollView(
            child: PlanCabine(
              plan: const {'couloir_apres': 'C'},
              sieges: sieges,
              selection: selection,
              surChoix: touches.add,
            ),
          ),
        ),
      ),
    );

    return touches;
  }

  testWidgets('un siège libre répond au toucher', (testeur) async {
    final touches = await poser(testeur, sieges: [
      siege('1A', rangee: 1, lettre: 'A'),
      siege('1B', rangee: 1, lettre: 'B'),
    ]);

    await testeur.tap(find.text('A'));
    await testeur.pump();

    expect(touches, ['1A']);
  });

  testWidgets('un siège occupé ne répond pas', (testeur) async {
    final touches = await poser(testeur, sieges: [
      siege('1A', rangee: 1, lettre: 'A', statut: 'occupe'),
    ]);

    await testeur.tap(find.text('A'));
    await testeur.pump();

    expect(touches, isEmpty);
  });

  testWidgets('un siège non attribuable ne répond pas', (testeur) async {
    final touches = await poser(testeur, sieges: [
      siege('1A', rangee: 1, lettre: 'A', statut: 'bloque'),
    ]);

    await testeur.tap(find.text('A'));
    await testeur.pump();

    expect(touches, isEmpty);
  });

  testWidgets('les rangées sont numérotées et ordonnées', (testeur) async {
    await poser(testeur, sieges: [
      siege('12A', rangee: 12, lettre: 'A'),
      siege('3A', rangee: 3, lettre: 'A'),
      siege('7A', rangee: 7, lettre: 'A'),
    ]);

    // Les numéros de rangée sont rendus ; l'ordre est croissant même si
    // l'API les a envoyés en désordre.
    final numeros = testeur
        .widgetList<Text>(find.byType(Text))
        .map((t) => t.data)
        .where((t) => t == '3' || t == '7' || t == '12')
        .toList();

    expect(numeros, ['3', '7', '12']);
  });

  testWidgets('la légende annonce les cinq états possibles', (testeur) async {
    await poser(testeur, sieges: [siege('1A', rangee: 1, lettre: 'A')]);

    for (final libelle in [
      'Disponible',
      'Votre siège',
      'Occupé',
      'Issue de secours',
      'Affaires',
    ]) {
      expect(find.text(libelle), findsOneWidget, reason: libelle);
    }
  });

  testWidgets('le siège retenu se distingue visuellement des autres', (testeur) async {
    await poser(
      testeur,
      sieges: [
        siege('1A', rangee: 1, lettre: 'A'),
        siege('1B', rangee: 1, lettre: 'B'),
      ],
      selection: '1A',
    );

    Color? fondDe(String lettre) {
      final boite = testeur.widget<AnimatedContainer>(
        find.ancestor(
          of: find.text(lettre),
          matching: find.byType(AnimatedContainer),
        ),
      );
      return (boite.decoration as BoxDecoration?)?.color;
    }

    // Le siège retenu prend la couleur d'accent, les autres restent sur la
    // surface neutre : c'est la seule chose que le passager voit.
    expect(fondDe('A'), Palette.clair.accent);
    expect(fondDe('B'), isNot(Palette.clair.accent));
  });

  testWidgets('chaque siège porte une description pour les lecteurs d\'écran',
      (testeur) async {
    await poser(testeur, sieges: [
      siege('1A', rangee: 1, lettre: 'A', type: 'issue_secours'),
      siege('1B', rangee: 1, lettre: 'B', statut: 'occupe'),
    ]);

    expect(find.bySemanticsLabel('Siège 1A — issue de secours, disponible'),
        findsOneWidget);
    expect(find.bySemanticsLabel('Siège 1B — standard, occupé'), findsOneWidget);
  });
}
