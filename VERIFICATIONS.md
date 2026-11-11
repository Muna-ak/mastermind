# Vérifications de la version 1.1.0

Exécutées le 11 novembre 2026 sous Windows, Node.js 24 et Microsoft Edge piloté par Playwright en mode sans interface.

## Moteur et contrat 0.2 : 17 tests réussis, 0 échec

Commande : `node --test tests/contract.test.cjs`.

| Cas | Attendu | Obtenu |
| --- | --- | --- |
| T01 à T09 du contrat fourni | Résultats exacts de chaque exemple | Conforme |
| Quatre rouges pour un secret avec deux rouges | 2 bien placées, 0 mal placée | Conforme |
| Répétitions déplacées | 2 bien placées, 2 mal placées | Conforme |
| État initial et configuration | not-started et configuration exacte 0.2 | Conforme |
| Entrées incomplètes ou inconnues | Priorité type, longueur, couleur ; seul lastError change | Conforme |
| Démarrage invalide | Error avec code ; état complet inchangé | Conforme |
| Victoire au dixième essai après refus au neuvième | Victoire à 10, erreur effacée | Conforme |
| Dix propositions erronées | Défaite, résultat 0/0 | Conforme |
| Proposition après la fin, même invalide | game-finished ; seul lastError change | Conforme |
| Nouvelle partie depuis won et lost | playing, 0 essai, historique vide, last… à null | Conforme |
| Modification d'une entrée ou d'un résultat retourné | État interne inchangé | Conforme |
| Les 1296 propositions pour un code répété | Même résultat qu'un calcul indépendant par fréquences | Conforme |

Plusieurs cas sont regroupés dans un même test.

## Interface et API : parcours réussi

Commande : `node tests/browser.cjs` avec Playwright accessible à Node.js.

Parcours vérifié : disponibilité de `window.codeSecretTest` uniquement avec `test=1` ; version et configuration exactes ; getters synchrones et mutations renvoyant des promesses ; état initial not-started ; refus avant démarrage ; affichage des dix lignes ; validation incomplète sans essai ; saisie au clavier lue ensuite par l'API ; indices visibles ; remplacement d'une couleur ; effacement sans consommation ; démarrages invalides rejetés sans modification de l'état ni du DOM ; victoire via l'interface et focus sur Nouvelle partie ; redémarrage ; victoire au dixième essai via l'API ; défaite et blocage ; absence de champ secret/solution ; code caché à l'écran ; rechargement sans conservation du code imposé.

Les exemples T01 à T09 ont aussi été exécutés via l'API publique dans le navigateur, avec comparaison immédiate de l'état retourné, du compteur et des indices visibles. Les copies publiques ont été modifiées pour vérifier leur indépendance. Une simulation HTTP locale sous `/nom-du-depot/?autre=conserve&test=1` a confirmé le chargement des chemins relatifs et l'accès à l'API en présence d'autres paramètres.

Largeurs de fenêtre vérifiées : **1360, 1024, 850, 768, 390 et 320 pixels**. Aucun débordement horizontal de la page ni chevauchement des colonnes de l'historique. Les boutons de palette et les positions ont une cible d'au moins 44 pixels sur les petites fenêtres. Captures locales générées dans `test-results/` (dossier ignoré par Git). Inspection visuelle des captures ordinateur et petites fenêtres : disposition lisible après correction. Aucune erreur JavaScript capturée.

## Correction de disposition réalisée en version 1.0.0 et retestée en 1.1.0

Défaut détecté lors de l'inspection à 320 pixels : les colonnes de l'historique occupaient plus que la largeur du panneau et les indices étaient trop près des pions.

Avant correction, ajout d'une assertion géométrique au test navigateur puis exécution : **échec**, message `colonnes de l'historique superposées à 320px` (obtenu `false`, attendu `true`).

Correction : réduire les espacements et les pions de l'historique aux très petites largeurs, réserver une largeur aux indices et disposer la palette sur deux rangées pour conserver des cibles tactiles suffisantes. Passer en colonne unique à partir de 850 pixels évite également de comprimer les panneaux sur tablette.

Après correction, même test : **réussi** pour les six largeurs. Les captures 320 et 850 pixels ont ensuite été inspectées visuellement.

## Limites des preuves

Ce sont des tests dans Edge sur ordinateur avec dimensions de fenêtre simulées. Aucun vrai smartphone, lecteur d'écran ou navigateur Safari/Firefox n'a été testé. Le contrat 0.2 fourni a servi de référence aux tests locaux ; l'outil enseignant n'a pas été fourni. La publication GitHub Pages et l'exécution sur une URL publique restent à réaliser. Les preuves ne remplacent pas les essais personnels et les éléments pédagogiques à remettre.
