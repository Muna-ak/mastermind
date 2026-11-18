# Consignes de travail - Code secret

Ces consignes s’appliquent au dossier Mastermind et à ses sous-dossiers. Dans le dépôt GitHub dédié, ce fichier se trouve à la racine.

## Repères

- Lire [README.md](README.md), puis les fichiers utiles à la demande. Consulter [API.md](API.md) pour les changements du moteur ou de l’API et [VERIFICATIONS.md](VERIFICATIONS.md) pour les preuves existantes.
- Le jeu est une application statique en HTML, CSS et JavaScript : `index.html` et `styles.css` pour la présentation, `game.js` pour les règles, `app.js` pour l’interface et l’API. Les tests sont dans `tests/`.
- Les références métier sont les règles **code-couleurs-1.0** et le contrat API **0.2**, identifiés dans le README. Si une source nécessaire est inaccessible ou contradictoire, le signaler ; ne pas inventer son contenu.

## Méthode et conventions

- Limiter les changements à la demande, préserver le travail existant et avancer par modifications faciles à examiner et à annuler. Ne pas modifier le projet Morpion voisin.
- Continuer les actions réversibles autorisées. Poser une question si une information manquante change le résultat attendu ; poursuivre entre-temps les tâches indépendantes de cette réponse.
- Écrire l’interface, les messages et la documentation en français. Conserver les identifiants exacts de l’API et la casse des noms de fichiers.
- Préserver l’ouverture directe de `index.html` et les chemins relatifs compatibles avec GitHub Pages. Ne pas ajouter de dépendance, compilation ou service externe sans besoin lié à la demande.
- Conserver les noms et les lettres des couleurs, les indices chiffrés, les boutons accessibles au clavier et les commandes tactiles. Vérifier les petites largeurs après une modification de disposition.

## Comportements à préserver

- Quatre positions, six identifiants dans l’ordre `rouge`, `bleu`, `vert`, `jaune`, `orange`, `violet` ; répétitions autorisées ; dix essais valides maximum.
- Compter d’abord les couleurs bien placées, puis les mal placées parmi les occurrences restantes, sans double comptage. Une victoire au dixième essai reste une victoire.
- Une proposition refusée ne consomme pas d’essai et ne modifie pas l’historique. Après la fin, conserver la partie terminée jusqu’au redémarrage.
- L’interface et l’API doivent utiliser la même instance du moteur. Exposer `window.codeSecretTest` uniquement avec `test=1`, initialement à `not-started`. Respecter les formats, promesses et priorités d’erreur décrits dans `API.md`.
- Ne pas révéler le code secret dans l’état retourné ni dans un affichage séparé. Préserver l’indépendance des tableaux fournis et des objets retournés.

## Vérifier selon le changement

Exécuter les commandes depuis la racine du projet Mastermind.

- **Règles ou API :** avec Node.js (version 24 vérifiée), lancer `node --test tests/contract.test.cjs`. Pour une correction, définir l’attendu, reproduire le défaut et relancer le même cas après modification.
- **Interface ou intégration :** si Playwright et Edge sont installés et accessibles à Node.js, lancer `node tests/browser.cjs`. Le script accepte aussi `BROWSER_PATH` vers Chromium. Sinon, signaler le contrôle non réalisé et effectuer les vérifications manuelles disponibles, sans prétendre avoir exécuté le script.
- **Disposition :** contrôler notamment les largeurs de 320 et 390 pixels, l’absence de chevauchement dans l’historique, les positions modifiables et la navigation au clavier. Une fenêtre simulée ne prouve pas un essai sur smartphone réel.
- **Documentation seule :** vérifier les liens relatifs, les noms de fichiers, les commandes citées et la cohérence des affirmations. Ne pas relancer toute la suite pour une simple reformulation.
- Rapporter les résultats réellement observés avec l’environnement et la version utiles. Ne pas inventer de test, de retour personnel ou de preuve avant/après. Mettre à jour `VERIFICATIONS.md` si de nouvelles vérifications doivent être conservées.

## Publication et restitution

- Ne pas publier de conversation, donnée privée, identifiant d’accès, clé ou chemin personnel dans le dépôt. Le jeu reste sans compte, paiement, serveur applicatif ni service d’IA.
- Demander avant une publication non autorisée ou une action destructive. Si l’action est déjà autorisée dans la conversation, poursuivre dans ce périmètre sans redemander. Ne pas écraser des changements distants ni déplacer un tag existant sans accord explicite.
- Garder le calendrier et les tâches de remise dans le README, sans les recopier ici. Actualiser le README si l’usage, les prérequis ou les limites changent.
- À la fin, résumer les fichiers modifiés, la raison du changement, les contrôles réussis ou échoués et les limites non résolues. Signaler tout outil ou accès manquant.
