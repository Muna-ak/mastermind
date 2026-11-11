# API commune de test 0.2

Implémentée dans `app.js`, sur l'unique instance créée par `game.js`. Version du jeu : 1.1.0 ; version de l'API : 0.2. Référence : PDF « API commune de test — Code secret en couleurs », édition Google 1.5 du 28/10/2026.

## Accès

Ouvrir `index.html?test=1`. Sur GitHub Pages, ajouter `test=1` à l'URL du jeu en conservant les autres paramètres éventuels. Attendre la présence de `window.codeSecretTest`. Sans ce paramètre exact, cet objet n'existe pas. L'ancienne façade provisoire `window.mastermind` a été remplacée.

Le mode test commence à `not-started`, sans secret généré ou conservé. Le jeu ordinaire démarre automatiquement une partie aléatoire. L'API ne nécessite ni serveur applicatif, ni compte, ni clé.

## Fonctions

| Appel | Retour | Comportement |
| --- | --- | --- |
| `getConfig()` | Objet synchrone | Configuration fixe copiée |
| `getState()` | État synchrone | Copie indépendante, aucune mutation |
| `startGame(options?)` | `Promise<State>` | Remise à zéro et démarrage aléatoire ou imposé |
| `submitGuess(guess)` | `Promise<State>` | Proposition, puis état après mise à jour de l'écran |

Attendre chaque mutation avant l'appel suivant. `version` vaut la chaîne `"0.2"`.

```js
const api = window.codeSecretTest;
api.getConfig();
// { apiVersion: "0.2", rulesVersion: "code-couleurs-1.0",
//   secretLength: 4, maxAttempts: 10, allowDuplicates: true,
//   colors: ["rouge", "bleu", "vert", "jaune", "orange", "violet"] }

await api.startGame({ secret: ["rouge", "rouge", "bleu", "vert"] });
await api.submitGuess(["rouge", "bleu", "rouge", "vert"]);
// { status: "playing", attempts: 1,
//   history: [{ guess: ["rouge", "bleu", "rouge", "vert"],
//               result: { wellPlaced: 2, misplaced: 2 } }],
//   lastGuess: ["rouge", "bleu", "rouge", "vert"],
//   lastResult: { wellPlaced: 2, misplaced: 2 }, lastError: null }
```

`startGame()`, `startGame(undefined)` et `startGame({})` démarrent un tirage aléatoire. Les options doivent être un objet ordinaire dont la seule clé autorisée est `secret`. Si cette clé existe, sa valeur doit être un tableau dense de quatre chaînes exactes de la palette ; `null` et `undefined` sont invalides. Les répétitions sont autorisées. Le code n'est jamais retourné dans un champ dédié ou révélé dans l'interface, même après la fin.

## État et erreurs

L'état initial comporte `status: "not-started"`, `attempts: 0`, `history: []`, et `lastGuess`, `lastResult`, `lastError` à `null`. Après un démarrage réussi : même structure, `status: "playing"`.

Les refus de `submitGuess()` résolvent la promesse avec `lastError: { code, message }`. Seul ce champ change ; la dernière proposition valide et son résultat sont conservés. Une proposition valide ou un démarrage réussi effacent cette erreur.

Priorités de validation de `submitGuess()` :

1. `game-not-started` : aucune partie démarrée.
2. `game-finished` : partie gagnée ou perdue.
3. `invalid-type` : autre chose qu'un tableau dense de chaînes, élément absent ou non textuel.
4. `invalid-length` : longueur différente de quatre.
5. `invalid-color` : identifiant absent de la palette, sans conversion de casse ni suppression d'espace.

`startGame()` vérifie d'abord les options (`invalid-options`), puis le secret (type, longueur, couleur). Une erreur rejette la promesse avec une `Error` portant `code` et un `message` non vide, sans toucher à l'état précédent, à `lastError` ni au brouillon visible.

```js
const state = await api.submitGuess(["rouge", null]);
console.assert(state.lastError.code === "invalid-type");

try {
  await api.startGame({ secret: undefined });
} catch (error) {
  console.assert(error.code === "invalid-type");
}
```

`attempts` est toujours égal à `history.length`. Les entrées de l'historique sont chronologiques. Les résultats ont deux entiers dont la somme ne dépasse pas quatre. Une victoire au dixième essai reste `won`, sinon dix essais donnent `lost`. Après la fin, aucune proposition ne consomme d'essai. Le bouton Nouvelle partie et l'API réinitialisent la même instance.
