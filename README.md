# Code secret · v1.1.0

Jeu solo en français inspiré du Mastermind. Ouvrir **index.html** dans un navigateur : aucune installation, dépendance ni connexion nécessaire. Le dossier est indépendant du projet Morpion.

## Règles et source

Référence : document de cours « Projet — Code secret en couleurs, inspiré du Mastermind », édition 2.2, mise à jour du 03/11/2026, annexe **code-couleurs-1.0**.

Quatre couleurs ordonnées parmi rouge, bleu, vert, jaune, orange et violet. Répétitions autorisées. Dix propositions valides maximum. Une proposition invalide ne consomme pas d'essai et ne modifie pas l'historique. Les correspondances exactes sont comptées avant les couleurs mal placées, chaque occurrence au plus une fois. Quatre bien placées gagnent, y compris au dixième essai. Après la fin, les propositions sont bloquées. Le code reste caché, conformément au contrat API 0.2. Nouvelle partie réinitialise le jeu avec un nouveau tirage (qui peut fortuitement être identique).

## Utilisation et choix faits avec Codex

Sélectionner une des quatre positions, puis une couleur. La sélection avance automatiquement. Recliquer sur une position permet de la modifier. Valider pour obtenir les indices. Les lettres et noms permettent d'identifier les couleurs sans se fier uniquement à leur teinte. Les indices affichent aussi des quantités écrites.

Tout fonctionne au clavier : Tabulation puis Entrée/Espace sur les boutons ; touches 1 à 6 pour les couleurs dans l'ordre de la palette ; flèches gauche/droite entre positions ; Suppr pour vider la position ; Entrée depuis une position pour valider.

Décision de conception : séparer un moteur pur (`game.js`) de l'interface (`app.js`) pour tester les répétitions et la fin de partie sans dépendre du navigateur. L'API de test appelle la même instance que l'interface. HTML/CSS/JavaScript natifs : déploiement statique et ouverture locale sans compilation. Aucun compte, service d'IA, serveur applicatif ni collecte de données.

## Vérifications

Avec Node.js : `npm test` ou `node --test tests/contract.test.cjs`.

Les 17 tests couvrent les neuf exemples T01 à T09 du contrat, l'état initial, la configuration, les répétitions, les priorités des erreurs, les démarrages invalides sans modification de l'état, la victoire au dixième essai, la défaite, le blocage après la fin, le redémarrage et l'isolation des copies. Une référence indépendante par fréquences vérifie les 1296 propositions possibles face à un code répété.

Le fichier `tests/browser.cjs` vérifie l'interface et son API dans Edge/Chromium, de 320 à 1360 pixels. Il requiert Playwright et Edge (ou la variable `BROWSER_PATH` vers Chromium), uniquement pour le développement. Les résultats exécutés sont consignés dans `VERIFICATIONS.md`.

## API commune de test 0.2

Source : « API commune de test — Code secret en couleurs », contrat **0.2**, édition Google 1.5 du 28/10/2026. Ouvrir **index.html?test=1** puis utiliser la console du navigateur :

```js
const api = window.codeSecretTest;
api.version;                      // "0.2" (version du contrat)
api.getConfig();                  // synchrone
api.getState();                   // synchrone, initialement not-started
await api.startGame({ secret: ["rouge", "rouge", "bleu", "vert"] });
const state = await api.submitGuess(["rouge", "bleu", "rouge", "rouge"]);
console.assert(state.lastResult.wellPlaced === 1);
console.assert(state.lastResult.misplaced === 2);
await api.startGame();            // nouvelle partie aléatoire
```

Sans `test=1`, l'objet `codeSecretTest` n'est pas exposé et le jeu démarre normalement. Avec ce paramètre, le jeu attend `startGame()` ou le bouton Démarrer la partie. Un rechargement revient à `not-started` et ne conserve aucun code imposé. Tous les appels passent par la même instance du moteur que les boutons et le clavier. Les mutations renvoient une promesse après mise à jour de l'écran.

État : `status` (`not-started`, `playing`, `won`, `lost`), `attempts`, `history` (entrées `{ guess, result: { wellPlaced, misplaced } }`), `lastGuess`, `lastResult`, `lastError`. Aucun champ `secret` ou `solution` n'est retourné. Les copies sont indépendantes de l'état interne. Un refus de proposition se lit dans `lastError: { code, message }`. Un démarrage invalide rejette la promesse avec une `Error` portant `code` et `message`, sans modifier l'état ni l'écran. Voir [API.md](API.md) pour les détails et les codes d'erreur.

## Publication et éléments restant à fournir

Pour GitHub Pages : placer le contenu de ce dossier à la racine d'un dépôt dédié, puis publier la branche et le dossier racine avec GitHub Pages. Tous les chemins sont relatifs. Aucune publication n'a été effectuée par cette création locale.

À compléter avant remise : liens du dépôt et du jeu publié ; historique Git et tags `jalon-1` / `final` aux versions réellement remises ; vérification de l'API sur l'URL publiée avec l'outil de l'enseignant ; essai sur un vrai smartphone avec appareil et résultat ; retour personnel sur le jeu d'un camarade ; capsule avec votre voix. Les tests locaux de conformité sont documentés dans `VERIFICATIONS.md`. Aucun résultat sur appareil réel ni retour d'un camarade n'est inventé ici. La PWA est facultative et n'est pas implémentée. La partie n'est pas conservée après rechargement.
