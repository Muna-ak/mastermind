const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PALETTE, score, createGame } = require('../game.js');
const secret = ['rouge', 'bleu', 'vert', 'jaune'];
const repeated = ['rouge', 'rouge', 'bleu', 'vert'];
const wrong = Array(4).fill('bleu'), red = Array(4).fill('rouge');
const empty = status => ({ status, attempts: 0, history: [], lastGuess: null, lastResult: null, lastError: null });
const withoutError = ({ lastError, ...data }) => data;

test('état initial not-started ; priorité game-not-started ; getters purs', () => {
  const game = createGame(); assert.deepEqual(game.getState(), empty('not-started'));
  const state = game.submitGuess(null);
  assert.equal(state.lastError.code, 'game-not-started');
  assert.deepEqual(withoutError(state), withoutError(empty('not-started')));
  game.getConfig(); assert.deepEqual(game.getState(), state);
});
test('configuration exacte du contrat 0.2', () => {
  assert.deepEqual(createGame().getConfig(), { apiVersion: '0.2', rulesVersion: 'code-couleurs-1.0', secretLength: 4,
    maxAttempts: 10, allowDuplicates: true, colors: [...PALETTE] });
});
const cases = [
  [secret, ['rouge','vert','bleu','orange'], 1,2],
  [secret, ['orange','violet','rouge','bleu'], 0,2],
  [secret, ['bleu','rouge','jaune','vert'], 0,4],
  [secret, ['rouge','bleu','jaune','vert'], 2,2],
  [secret, secret, 4,0], [repeated, red, 2,0],
  [repeated, ['rouge','bleu','rouge','vert'], 2,2],
  [repeated, repeated, 4,0], [repeated, ['rouge','bleu','rouge','rouge'], 1,2]
];
cases.forEach(([fixed, guess, wellPlaced, misplaced], index) => {
  test(`T${String(index + 1).padStart(2,'0')} du PDF : attendu ${wellPlaced}/${misplaced}`, () => {
    const game = createGame(); game.startGame({ secret: fixed });
    const state = game.submitGuess(guess), result = { wellPlaced, misplaced };
    assert.deepEqual(state, { status: wellPlaced === 4 ? 'won' : 'playing', attempts: 1,
      history: [{ guess, result }], lastGuess: guess, lastResult: result, lastError: null });
    assert.equal(JSON.stringify(state).includes('secret'), false);
  });
});
test('refus : type avant longueur avant couleur, sans modifier les données', () => {
  const game = createGame(); game.startGame({ secret }); game.submitGuess(wrong);
  const before = withoutError(game.getState());
  const inputs = [
    [null,'invalid-type'], ['rouge','invalid-type'], [Array(4),'invalid-type'],
    [['rouge',null],'invalid-type'], [[1],'invalid-type'], [['rouge',undefined],'invalid-type'],
    [[], 'invalid-length'], [['rouge'],'invalid-length'], [['rose'],'invalid-length'],
    [[...secret,'rouge'],'invalid-length'], [['Violet','bleu','vert','jaune'],'invalid-color'],
    [['violet ','bleu','vert','jaune'],'invalid-color'], [['purple','bleu','vert','jaune'],'invalid-color']
  ];
  for (const [guess, code] of inputs) {
    const state = game.submitGuess(guess);
    assert.equal(state.lastError.code, code); assert.ok(state.lastError.message.length > 0);
    assert.deepEqual(withoutError(state), before);
  }
  assert.equal(game.submitGuess(wrong).lastError, null);
});
test('démarrage invalide : code normalisé, état complet inchangé', () => {
  const game = createGame(); game.startGame({ secret }); game.submitGuess(null);
  const before = game.getState();
  for (const [options, code] of [
    [null,'invalid-options'], [[], 'invalid-options'], [true,'invalid-options'], [new Date(),'invalid-options'],
    [{ secret: null, extra: true },'invalid-options'], [{ [Symbol('extra')]: 1 },'invalid-options'],
    [{secret:undefined},'invalid-type'], [{secret:null},'invalid-type'], [{secret:Array(4)},'invalid-type'],
    [{secret:['rouge',null]},'invalid-type'], [{secret:['rose']},'invalid-length'],
    [{secret:['rose','bleu','vert','jaune']},'invalid-color']
  ]) {
    assert.throws(() => game.startGame(options), error => error instanceof Error && error.code === code && !!error.message);
    assert.deepEqual(game.getState(), before);
  }
  for (const options of [undefined, {}, { secret }]) assert.deepEqual(game.startGame(options), empty('playing'));
});
test('victoire au dixième, refus au neuvième, priorité game-finished', () => {
  const game = createGame(); game.startGame({ secret: red });
  for (let i = 0; i < 9; i++) game.submitGuess(wrong);
  const refused = game.submitGuess(['rouge']);
  assert.equal(refused.lastError.code, 'invalid-length'); assert.equal(refused.attempts, 9);
  const won = game.submitGuess(red); assert.equal(won.status, 'won');
  assert.equal(won.attempts, 10); assert.equal(won.lastError, null);
  assert.deepEqual(won.lastResult, { wellPlaced: 4, misplaced: 0 });
  const after = game.submitGuess(null); assert.equal(after.lastError.code, 'game-finished');
  assert.deepEqual(withoutError(after), withoutError(won));
  assert.deepEqual(game.startGame(), empty('playing'));
});
test('défaite à dix, refus après fin, redémarrage depuis lost', () => {
  const game = createGame(); game.startGame({ secret: red });
  for (let i = 0; i < 10; i++) game.submitGuess(wrong);
  const lost = game.getState(); assert.equal(lost.status, 'lost'); assert.equal(lost.attempts, 10);
  assert.deepEqual(lost.lastResult, { wellPlaced: 0, misplaced: 0 });
  const after = game.submitGuess(red); assert.equal(after.lastError.code, 'game-finished');
  assert.deepEqual(withoutError(after), withoutError(lost));
  assert.deepEqual(game.startGame({}), empty('playing'));
});
test('copies indépendantes : configuration, options, propositions et états imbriqués', () => {
  const game = createGame(), fixed = [...secret]; game.startGame({ secret: fixed }); fixed[0] = 'violet';
  const guess = [...wrong], state = game.submitGuess(guess); guess[0] = 'rouge';
  state.history[0].guess[0] = 'orange'; state.history[0].result.wellPlaced = 99;
  state.lastGuess[0] = 'vert'; state.lastResult.misplaced = 99;
  const config = game.getConfig(); config.colors.length = 0;
  assert.deepEqual(game.getConfig().colors, PALETTE);
  assert.equal(game.getState().history[0].guess[0], 'bleu');
  assert.equal(game.getState().lastResult.wellPlaced, 1);
  assert.equal(game.getState().lastResult.misplaced, 0);
  const invalid = game.submitGuess(null); invalid.lastError.code = 'changed';
  assert.equal(game.getState().lastError.code, 'invalid-type');
  assert.equal(game.submitGuess(secret).status, 'won');
});
test('1296 propositions : comparaison à une référence indépendante par fréquences', () => {
  for (const a of PALETTE) for (const b of PALETTE) for (const c of PALETTE) for (const d of PALETTE) {
    const guess = [a,b,c,d], result = score(repeated, guess);
    const exact = guess.filter((color, i) => color === repeated[i]).length;
    const total = PALETTE.reduce((n, color) => n + Math.min(repeated.filter(v => v === color).length, guess.filter(v => v === color).length), 0);
    assert.deepEqual(result, { wellPlaced: exact, misplaced: total - exact });
  }
});
