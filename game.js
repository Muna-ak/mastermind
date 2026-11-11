/* Moteur partagé par l'interface et l'API de test. Aucune dépendance. */
(function (root) {
  "use strict";
  const PALETTE = Object.freeze(["rouge", "bleu", "vert", "jaune", "orange", "violet"]);
  const VERSION = "1.1.0";
  const messages = {
    "invalid-options": "Les options doivent être un objet contenant uniquement la clé secret, facultative.",
    "invalid-type": "Choisissez quatre couleurs : un tableau complet de noms de couleurs est nécessaire. Aucun essai utilisé.",
    "invalid-length": "Choisissez exactement quatre couleurs. Aucun essai utilisé.",
    "invalid-color": "Chaque couleur doit être rouge, bleu, vert, jaune, orange ou violet, en minuscules sans espace. Aucun essai utilisé.",
    "game-not-started": "Démarrez une partie avant de proposer un code.",
    "game-finished": "La partie est terminée. Lancez une nouvelle partie."
  };
  function codeError(code) { return { code, message: messages[code] }; }
  function validateCode(code) {
    if (!Array.isArray(code)) return "invalid-type";
    for (let i = 0; i < code.length; i++) {
      if (!Object.hasOwn(code, i) || typeof code[i] !== "string") return "invalid-type";
    }
    if (code.length !== 4) return "invalid-length";
    if (code.some(color => !PALETTE.includes(color))) return "invalid-color";
    return null;
  }
  function validCode(code) {
    return validateCode(code) === null;
  }
  function score(secret, guess) {
    if (!validCode(secret) || !validCode(guess)) throw new TypeError("Quatre couleurs autorisées sont nécessaires.");
    let wellPlaced = 0;
    const remainingSecret = [], remainingGuess = [];
    secret.forEach((color, index) => {
      if (color === guess[index]) wellPlaced++;
      else { remainingSecret.push(color); remainingGuess.push(guess[index]); }
    });
    // Retirer chaque occurrence appariée évite de compter deux fois une couleur.
    let misplaced = 0;
    remainingGuess.forEach(color => {
      const index = remainingSecret.indexOf(color);
      if (index !== -1) { misplaced++; remainingSecret.splice(index, 1); }
    });
    return { wellPlaced, misplaced };
  }
  function randomColor() {
    // Rejet des 4 valeurs en excès : tirage uniforme sur les six couleurs.
    if (root.crypto && root.crypto.getRandomValues) {
      const buffer = new Uint32Array(1);
      do { root.crypto.getRandomValues(buffer); } while (buffer[0] >= 4294967292);
      return PALETTE[buffer[0] % 6];
    }
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
  function createGame() {
    let secret = null, history = [], status = "not-started", lastError = null;
    function getConfig() {
      return { apiVersion: "0.2", rulesVersion: "code-couleurs-1.0", secretLength: 4,
        maxAttempts: 10, allowDuplicates: true, colors: [...PALETTE] };
    }
    function getState() {
      const last = history.at(-1);
      return {
        status, attempts: history.length,
        history: history.map(entry => ({ guess: [...entry.guess], result: { ...entry.result } })),
        lastGuess: last ? [...last.guess] : null,
        lastResult: last ? { ...last.result } : null,
        lastError: lastError ? { ...lastError } : null
      };
    }
    function startGame(options = {}) {
      let error = null;
      if (options === null || typeof options !== "object" || Array.isArray(options) ||
          ![Object.prototype, null].includes(Object.getPrototypeOf(options)) ||
          Reflect.ownKeys(options).some(key => key !== "secret")) error = "invalid-options";
      else if (Object.hasOwn(options, "secret")) error = validateCode(options.secret);
      if (error) {
        const rejection = new Error(messages[error]); rejection.code = error;
        throw rejection;
      }
      // Valider entièrement avant de modifier l'instance courante.
      const nextSecret = Object.hasOwn(options, "secret") ? [...options.secret] : Array.from({ length: 4 }, randomColor);
      secret = nextSecret; history = []; status = "playing"; lastError = null;
      return getState();
    }
    function submitGuess(guess) {
      const error = status === "not-started" ? "game-not-started"
        : status !== "playing" ? "game-finished" : validateCode(guess);
      if (error) { lastError = codeError(error); return getState(); }
      const result = score(secret, guess);
      history.push({ guess: [...guess], result }); lastError = null;
      if (result.wellPlaced === 4) status = "won";
      else if (history.length === 10) status = "lost";
      return getState();
    }
    return Object.freeze({ startGame, submitGuess, getState, getConfig });
  }
  const exported = Object.freeze({ PALETTE, VERSION, score, createGame });
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  else root.CodeSecret = exported;
})(globalThis);
