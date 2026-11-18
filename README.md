# Code secret - Mastermind

Un jeu solo de déduction : retrouver quatre couleurs dans le bon ordre en dix essais. Réalisé avec l’aide de Codex dans le cadre du séminaire, il fonctionne dans un navigateur, sans compte ni installation.

**[Jouer en ligne](https://muna-ak.github.io/mastermind/)** · [Dépôt GitHub](https://github.com/Muna-ak/mastermind) · [Mode test](https://muna-ak.github.io/mastermind/?test=1)

## État actuel

Jeu **v1.1.0**, publié sur GitHub Pages, avec l’API commune de test **0.2**. Le code vérifié correspond au commit [`ffb86d5`](https://github.com/Muna-ak/mastermind/commit/ffb86d5b8fb3edc788b3b42e7fd96614a3730b66). Documentation actualisée le **18 novembre 2026**.

Disponibles : propositions modifiables, historique et indices, victoire/défaite, nouvelle partie, commandes au clavier et disposition adaptée aux petites fenêtres. Le projet est séparé du morpion.

## Commencer

1. Ouvrir **Jouer en ligne** : une partie démarre automatiquement.
2. Choisir une position, puis une couleur, jusqu’à compléter les quatre positions. Recliquer sur une position pour la modifier.
3. **Valider la proposition**, lire les indices et recommencer. **Nouvelle partie** réinitialise le jeu.

Au clavier : Tabulation pour parcourir les boutons, Entrée/Espace pour les activer ; touches 1 à 6 pour les couleurs ; flèches gauche/droite entre positions ; Suppr pour vider une position ; Entrée depuis une position pour valider.

Pour jouer localement, télécharger et extraire le dépôt, puis ouvrir `index.html`. Aucun serveur n’est nécessaire ; les fichiers téléchargés fonctionnent sans connexion.

## Règles

- Quatre couleurs parmi **rouge, bleu, vert, jaune, orange et violet**, avec répétitions possibles.
- **Dix essais**. Une proposition incomplète ou inconnue est refusée sans consommer d’essai ni modifier l’historique.
- Les indices donnent le nombre de couleurs **bien placées**, puis **mal placées** parmi les occurrences restantes. Chaque occurrence compte une seule fois. Ils ne désignent pas les positions concernées.
- Quatre bien placées donnent la victoire, même au dixième essai. Sinon, dix essais donnent une défaite. Les propositions sont ensuite bloquées.
- Le code reste caché, même après une défaite, conformément au contrat API.

## Un choix fait avec Codex

J’ai choisi d’afficher des **lettres et des noms en plus des couleurs**, pour identifier les pions sans dépendre uniquement de leur teinte : « V » pour vert, « Vi » pour violet, par exemple. Les indices comportent aussi des nombres écrits. Cela facilite l’identification, sans constituer une validation complète de l’accessibilité.

Codex a aidé à générer le code, les tests et la documentation. Les règles sont séparées de l’affichage pour faciliter leur vérification. L’IA n’intervient pas pendant une partie.

## Vérifications et preuves

### Trois scénarios

Attendus inscrits dans ce README **avant l’exécution**, puis comparés aux obtenus le **18 novembre 2026**. Chaque cas part d’une nouvelle partie connue. Tests automatisés dans Edge sous Windows, via l’API locale, avec contrôle du compteur et de l’historique visibles. Les fichiers du moteur et de l’interface sont identiques à ceux du commit `ffb86d5` publié.

| Cas | Départ et action | Attendu | Obtenu et statut |
| --- | --- | --- | --- |
| Normal | Secret rouge-bleu-vert-jaune ; jouer rouge-vert-bleu-orange | 1 bien, 2 mal, 1 essai, 1 entrée d’historique | 1 / 2, 1 essai, 1 entrée : **réussi** |
| Limite : répétitions | Secret rouge-rouge-bleu-vert ; jouer quatre rouges | 2 bien, 0 mal, 1 essai, 1 entrée | 2 / 0, 1 essai, 1 entrée : **réussi** |
| Négatif | Secret rouge-rouge-bleu-vert ; jouer rouge-bleu-vert | Refus invalid-length, 0 essai, historique vide | invalid-length, 0 essai, 0 entrée : **réussi** |

Les deux rouges supplémentaires du cas limite ne doivent pas compter.

### Tests automatisés et site publié

Depuis la racine du projet, avec Node.js :

```sh
node --test tests/contract.test.cjs
```

Le **18 novembre 2026**, sous Windows avec Node.js **24.22.3** : **17 tests réussis, 0 échec**. Ils couvrent les exemples du contrat, les refus, la victoire au dixième essai, la défaite, le redémarrage et les copies des données. Une référence indépendante vérifie aussi les 1296 propositions possibles face à un code répété.

Le même jour, un parcours automatisé sur **l’URL publique**, dans Edge, a confirmé : HTTP 200, saisie d’un coup, API 0.2, répétitions, refus sans essai, victoire au dixième et redémarrage, sans erreur JavaScript capturée. Les tests locaux du navigateur avaient également couvert six largeurs, de 320 à 1360 pixels.

Détails et limites : [VERIFICATIONS.md](VERIFICATIONS.md). Le parcours [tests/browser.cjs](tests/browser.cjs) nécessite Playwright et Edge pour être relancé ; ces outils ne sont pas nécessaires pour jouer.

### Correction expliquée

À 320 pixels, les colonnes de l’historique se chevauchaient. **Avant :** le test échouait avec « colonnes de l’historique superposées à 320px » (`false` au lieu de `true`). Les pions et espacements ont été réduits, une largeur a été réservée aux indices et la palette répartie sur deux rangées. **Après :** le même test réussissait pour les six largeurs vérifiées. Cette correction locale, antérieure au premier envoi sur GitHub, est décrite dans [VERIFICATIONS.md](VERIFICATIONS.md).

### Essais personnels

- **Smartphone :** j’ai testé le jeu avec **Safari** et il fonctionne correctement. Le modèle, la version du navigateur et les étapes n’ont pas été relevés ; il s’agit d’un retour général.
- **Test croisé :** j’ai essayé le jeu d’un camarade à partir de son lien et il fonctionnait. Je n’ai pas détaillé les scénarios ni relevé les attendus et obtenus. Aucun retour précis sur mon propre jeu n’est documenté.

## API commune de test

L’API permet de piloter **la même partie que l’interface**. Ouvrir le [mode test](https://muna-ak.github.io/mastermind/?test=1), puis utiliser la console du navigateur :

```js
const api = window.codeSecretTest;
await api.startGame({ secret: ["rouge", "rouge", "bleu", "vert"] });
const state = await api.submitGuess(["rouge", "rouge", "rouge", "rouge"]);
console.log(state.lastResult); // { wellPlaced: 2, misplaced: 0 }
console.log(state.attempts);   // 1
```

Avec `test=1`, l’état initial est `not-started`. Sans ce paramètre, l’API n’est pas exposée. Fonctions et erreurs : [API.md](API.md).

## Se repérer et obtenir de l’aide

- [index.html](index.html) et [styles.css](styles.css) : structure et apparence.
- [game.js](game.js) : règles et indices ; [app.js](app.js) : interface et API.
- [tests/contract.test.cjs](tests/contract.test.cjs) : tests des règles et du contrat ; [tests/browser.cjs](tests/browser.cjs) : parcours du navigateur.
- [API.md](API.md) et [VERIFICATIONS.md](VERIFICATIONS.md) : documentation complémentaire.

Maintenance : compte GitHub **Muna-ak**. Signaler un problème dans les [issues du dépôt](https://github.com/Muna-ak/mastermind/issues), avec les étapes, l’attendu, l’obtenu et le navigateur.

## Limites et préparation de J1

La partie n’est pas sauvegardée au rechargement. L’installation comme application web n’est pas implémentée. Aucun test avec lecteur d’écran, Firefox ou l’outil de l’enseignant n’est documenté. Le retour Safari ne prouve pas une compatibilité avec tous les smartphones.

Avant J1 : ajouter `AGENTS.md`, choisir et vérifier le tag **jalon-1** sur la version remise, puis déposer le document demandé sur Cyberlearn avec les liens du dépôt, du jeu et du tag. La création du tag n’est pas attestée ici. Selon l’atelier du 18 novembre, l’API n’est pas obligatoire pour J1 ; elle est déjà intégrée à ce projet.

## Sources

- **Projet - Code secret en couleurs**, édition 2.2 du 03/11/2026 : règles **code-couleurs-1.0**.
- **API commune de test**, contrat **0.2**, édition Google 1.5 du 28/10/2026.
- **Rédiger un bon README.md - Guide général**, version 1.0 du 03/11/2026.
- **Atelier 5 du 18 novembre 2026 - Tester le jeu et préparer J1**, édition 1.17.
