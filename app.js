"use strict";
(() => {
  const { PALETTE, createGame } = CodeSecret;
  const game = createGame();
  const testMode = new URLSearchParams(location.search).get("test") === "1";
  if (!testMode) game.startGame();
  const symbols = ["R", "B", "V", "J", "O", "Vi"];
  const $ = id => document.getElementById(id);
  let draft = Array(4).fill(null), selected = 0;
  function peg(color, extra = "") {
    const span = document.createElement("span");
    span.className = `peg ${color || "empty"} ${extra}`;
    span.textContent = color ? symbols[PALETTE.indexOf(color)] : "·";
    span.setAttribute("aria-label", color || "vide");
    return span;
  }
  const slots = draft.map((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.addEventListener("click", () => { selected = index; renderDraft(); });
    button.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        selected = (index + (event.key === "ArrowRight" ? 1 : 3)) % 4;
        renderDraft(); slots[selected].focus();
      }
    });
    $("draft").append(button);
    return button;
  });
  function choose(color) {
    if (game.getState().status !== "playing") return;
    draft[selected] = color;
    const nextEmpty = draft.findIndex((value, index) => index > selected && value === null);
    if (nextEmpty !== -1) selected = nextEmpty;
    else if (draft.includes(null)) selected = draft.indexOf(null);
    else selected = (selected + 1) % 4;
    $("status").className = "status";
    $("status").textContent = draft.every(Boolean) ? "Votre proposition est prête à être validée." : "Complétez les quatre positions.";
    renderDraft();
  }
  const paletteButtons = PALETTE.map((color, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "color-choice";
    button.setAttribute("aria-label", `${color}, raccourci ${index + 1}`);
    button.append(peg(color));
    const label = document.createElement("span"); label.textContent = color;
    button.append(label); button.addEventListener("click", () => choose(color));
    $("palette").append(button); return button;
  });
  function renderDraft() {
    const over = game.getState().status !== "playing";
    slots.forEach((button, index) => {
      button.replaceChildren(peg(draft[index]));
      button.classList.toggle("selected", selected === index);
      button.setAttribute("aria-label", `Position ${index + 1} : ${draft[index] || "vide"}`);
      button.setAttribute("aria-pressed", String(selected === index));
      button.disabled = over;
    });
    paletteButtons.forEach(button => { button.disabled = over; });
    $("submit").disabled = over; $("clear").disabled = over;
  }
  function render() {
    const state = game.getState();
    $("counter").textContent = `${state.attempts} / 10 essais`;
    $("turn").textContent = state.status === "not-started" ? "—" : state.status === "playing" ? String(state.attempts + 1).padStart(2, "0") : "FIN";
    $("restart").lastChild.textContent = state.status === "not-started" ? " Démarrer la partie" : " Nouvelle partie";
    $("secret").replaceChildren(...Array(4).fill(null).map(color => {
      const item = peg(color);
      if (!color) { item.textContent = "?"; item.setAttribute("aria-label", "caché"); }
      return item;
    }));
    $("secret").setAttribute("aria-label", "Le code secret est caché");
    $("history").replaceChildren(...Array.from({ length: 10 }, (_, index) => {
      const entry = state.history[index];
      const row = document.createElement("li");
      row.className = `history-row ${entry ? "played" : ""} ${state.status === "playing" && index === state.attempts ? "current" : ""}`;
      const number = document.createElement("span"); number.className = "row-number"; number.textContent = String(index + 1).padStart(2, "0");
      const code = document.createElement("div"); code.className = "pegs";
      code.append(...(entry ? entry.guess : Array(4).fill(null)).map(color => peg(color)));
      const hints = document.createElement("div"); hints.className = "hints";
      if (entry) {
        const { wellPlaced, misplaced } = entry.result;
        const description = `${wellPlaced} bien placées, ${misplaced} mal placées`;
        hints.setAttribute("role", "img"); hints.setAttribute("aria-label", description); hints.title = description;
        for (let i = 0; i < 4; i++) {
          const dot = document.createElement("i");
          dot.className = `hint ${i < wellPlaced ? "exact" : i < wellPlaced + misplaced ? "misplaced" : "absent"}`;
          hints.append(dot);
        }
        const counts = document.createElement("span"); counts.className = "hint-counts";
        counts.textContent = `${wellPlaced} bien · ${misplaced} mal`;
        hints.append(counts);
      } else {
        hints.textContent = state.status === "playing" && index === state.attempts ? "À vous" : "—";
        hints.classList.add("pending");
      }
      row.setAttribute("aria-label", `Essai ${index + 1}${entry ? "" : " : non joué"}`);
      row.append(number, code, hints); return row;
    }));
    renderDraft();
  }
  function submitGuess(guess) {
    const state = game.submitGuess(guess);
    if (!state.lastError) { draft = Array(4).fill(null); selected = 0; }
    render();
    $("status").className = `status ${state.lastError ? "error" : state.status === "won" ? "success" : ""}`;
    $("status").textContent = state.lastError ? state.lastError.message : state.status === "won"
      ? `Code découvert ! Bravo, vous avez gagné en ${state.attempts} essai${state.attempts > 1 ? "s" : ""}.`
      : state.status === "lost" ? "Les dix essais sont écoulés. Retentez votre chance avec un nouveau code !"
      : `${state.lastResult.wellPlaced} bien placée(s), ${state.lastResult.misplaced} mal placée(s). Encore ${10 - state.attempts} essai(s).`;
    return state;
  }
  function newGame(options = {}) {
    const state = game.startGame(options);
    draft = Array(4).fill(null); selected = 0;
    render(); $("status").className = "status";
    $("status").textContent = "Nouvelle partie. Un nouveau code vous attend !";
    return state;
  }
  $("submit").addEventListener("click", () => {
    submitGuess(draft);
    if (game.getState().status === "playing") slots[0].focus();
    else $("restart").focus();
  });
  $("clear").addEventListener("click", () => {
    draft = Array(4).fill(null); selected = 0; renderDraft();
    $("status").className = "status"; $("status").textContent = "Proposition effacée. Aucun essai utilisé.";
    slots[0].focus();
  });
  $("restart").addEventListener("click", () => { newGame(); slots[0].focus(); });
  document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || game.getState().status !== "playing") return;
    if (/^[1-6]$/.test(event.key)) { event.preventDefault(); choose(PALETTE[Number(event.key) - 1]); }
    // Les boutons conservent leur activation native avec Entrée et Espace.
    if (event.key === "Enter" && (event.target === document.body || slots.includes(event.target))) {
      event.preventDefault(); $("submit").click();
    }
    if (["Backspace", "Delete"].includes(event.key)) { event.preventDefault(); draft[selected] = null; renderDraft(); }
  });
  render();
  if (testMode) {
    $("status").textContent = "Mode test : aucune partie démarrée. Utilisez Démarrer la partie ou l’API.";
    // Exposer seulement après l'initialisation de l'interface. Les mutations
    // terminent leur rendu synchrone avant de résoudre leur promesse.
    window.codeSecretTest = Object.freeze({
      version: "0.2", getConfig: game.getConfig, getState: game.getState,
      startGame: async options => newGame(options),
      submitGuess: async guess => submitGuess(guess)
    });
  }
})();
