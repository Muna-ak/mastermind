/* Vérification réelle du DOM avec Playwright et Edge/Chromium. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch(process.env.BROWSER_PATH
    ? { executablePath: process.env.BROWSER_PATH, headless: true }
    : { channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    await page.goto(url + '?test=1');
    await page.waitForFunction(() => window.codeSecretTest);
    assert.deepEqual(await page.evaluate(() => codeSecretTest.getState()), {
      status: 'not-started', attempts: 0, history: [], lastGuess: null, lastResult: null, lastError: null
    });
    assert.equal(await page.locator('#submit').isDisabled(), true);
    assert.equal(await page.evaluate(async () => (await codeSecretTest.submitGuess(null)).lastError.code), 'game-not-started');
    assert.equal(await page.evaluate(() => codeSecretTest.version), '0.2');
    assert.deepEqual(await page.evaluate(() => codeSecretTest.getConfig()), {
      apiVersion:'0.2', rulesVersion:'code-couleurs-1.0', secretLength:4, maxAttempts:10,
      allowDuplicates:true, colors:['rouge','bleu','vert','jaune','orange','violet']
    });
    assert.equal(await page.evaluate(async () => {
      const pending = codeSecretTest.startGame();
      const isPromise = pending instanceof Promise; await pending;
      const submission = codeSecretTest.submitGuess(null);
      const alsoPromise = submission instanceof Promise; await submission;
      return isPromise && alsoPromise && !(codeSecretTest.getState() instanceof Promise) && !(codeSecretTest.getConfig() instanceof Promise);
    }), true);
    assert.equal(await page.locator('#history li').count(), 10);
    await page.evaluate(() => codeSecretTest.startGame({ secret: ['rouge', 'bleu', 'vert', 'jaune'] }));
    await page.locator('#submit').click();
    assert.equal(await page.evaluate(() => codeSecretTest.getState().attempts), 0);
    assert.match(await page.locator('#status').innerText(), /quatre couleurs/);
    // Clavier, modification d'une position, et validation dans le vrai DOM.
    await page.locator('#draft button').first().focus();
    await page.keyboard.type('1325');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.history-row.played').count(), 1);
    assert.match(await page.locator('.history-row.played .hint-counts').innerText(), /1 bien · 2 mal/);
    await page.locator('#draft button').first().click();
    await page.getByRole('button', { name: 'violet, raccourci 6', exact: true }).click();
    await page.locator('#draft button').first().click();
    await page.getByRole('button', { name: 'rouge, raccourci 1', exact: true }).click();
    assert.equal(await page.locator('#draft button').first().getAttribute('aria-label'), 'Position 1 : rouge');
    await page.locator('#clear').click();
    assert.equal(await page.evaluate(() => codeSecretTest.getState().attempts), 1);
    // Démarrage rejeté : ni l'état (lastError compris) ni le brouillon ne bougent.
    assert.equal(await page.evaluate(async () => {
      const beforeState = JSON.stringify(codeSecretTest.getState()), beforeDOM = document.body.innerHTML;
      const invalid = [
        [null,'invalid-options'], [[], 'invalid-options'], [{ extra: true, secret: null },'invalid-options'],
        [{secret:undefined},'invalid-type'], [{secret:null},'invalid-type'], [{secret:Array(4)},'invalid-type'],
        [{secret:['rouge',null]},'invalid-type'], [{secret:['rouge']},'invalid-length'],
        [{secret:['rose','rouge','rouge','rouge']},'invalid-color']
      ];
      for (const [options, code] of invalid) {
        let rejected = false;
        try { await codeSecretTest.startGame(options); }
        catch (error) { rejected = error instanceof Error && error.code === code && !!error.message; }
        if (!rejected || JSON.stringify(codeSecretTest.getState()) !== beforeState || document.body.innerHTML !== beforeDOM) return false;
      }
      return true;
    }), true);
    await page.locator('#draft button').first().focus();
    await page.keyboard.type('1234'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => codeSecretTest.getState().status), 'won');
    assert.equal(await page.locator('#submit').isDisabled(), true);
    assert.equal(await page.locator('#secret').getAttribute('aria-label'), 'Le code secret est caché');
    assert.equal(await page.evaluate(() => 'secret' in codeSecretTest.getState() || 'solution' in codeSecretTest.getState()), false);
    assert.equal(await page.locator('#restart').evaluate(el => el === document.activeElement), true);
    await page.locator('#restart').click();
    assert.equal(await page.locator('.history-row.played').count(), 0);
    assert.equal(await page.evaluate(() => codeSecretTest.getState().attempts), 0);
    // L'API partage l'instance : dixième essai gagnant et défaite visibles.
    await page.evaluate(async () => {
      await codeSecretTest.startGame({ secret: ['rouge', 'rouge', 'bleu', 'vert'] });
      for (let i = 0; i < 9; i++) await codeSecretTest.submitGuess(Array(4).fill('violet'));
      await codeSecretTest.submitGuess(['rouge', 'rouge', 'bleu', 'vert']);
    });
    assert.match(await page.locator('#status').innerText(), /gagné en 10 essais/);
    assert.equal(await page.locator('.history-row.played').count(), 10);
    await page.evaluate(async () => {
      await codeSecretTest.startGame({ secret: ['rouge', 'rouge', 'bleu', 'vert'] });
      for (let i = 0; i < 10; i++) await codeSecretTest.submitGuess(Array(4).fill('violet'));
    });
    assert.match(await page.locator('#status').innerText(), /dix essais sont écoulés/);
    assert.equal(await page.locator('#submit').isDisabled(), true);
    const frozen = await page.evaluate(() => { const {lastError,...data} = codeSecretTest.getState(); return data; });
    const after = await page.evaluate(() => codeSecretTest.submitGuess(null));
    assert.equal(after.lastError.code, 'game-finished');
    delete after.lastError; assert.deepEqual(after, frozen);
    await page.locator('#restart').click();
    fs.mkdirSync(path.resolve(__dirname, '../test-results'), { recursive: true });
    for (const width of [1360, 1024, 850, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `débordement à ${width}px`);
      const buttons = await page.locator('#draft button').all();
      for (const button of buttons) assert.ok((await button.boundingBox()).height >= 44);
      assert.equal(await page.locator('.history-row').first().evaluate(row => {
        const cells = [...row.children].map(el => el.getBoundingClientRect());
        return cells[1].right <= cells[2].left && cells[2].right <= row.getBoundingClientRect().right + 1;
      }), true, `colonnes de l'historique superposées à ${width}px`);
      if (width <= 850) {
        for (const button of await page.locator('#palette button').all()) {
          const box = await button.boundingBox();
          assert.ok(box.width >= 44 && box.height >= 44, `cible tactile insuffisante à ${width}px`);
        }
      }
      await page.screenshot({ path: path.resolve(__dirname, `../test-results/interface-${width}.png`), fullPage: true });
    }
    await page.reload();
    await page.waitForFunction(() => window.codeSecretTest);
    assert.equal(await page.evaluate(() => codeSecretTest.getState().status), 'not-started');
    await page.locator('#restart').click();
    assert.equal(await page.evaluate(() => codeSecretTest.getState().status), 'playing');
    await page.goto(url);
    await page.waitForSelector('#palette button');
    assert.equal(await page.evaluate(() => 'codeSecretTest' in window || 'mastermind' in window), false);
    assert.equal(await page.locator('#submit').isEnabled(), true);
    // Hébergement statique sous /nom-du-depot/, avec d'autres paramètres.
    const http = require('node:http');
    const server = http.createServer((req, res) => {
      const filename = new URL(req.url, 'http://localhost').pathname.replace('/nom-du-depot/', '') || 'index.html';
      if (!['index.html','game.js','app.js','styles.css'].includes(filename)) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript; charset=utf-8' : filename.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
      res.end(fs.readFileSync(path.resolve(__dirname, '..', filename)));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/nom-du-depot/?autre=conserve&test=1`);
      await page.waitForFunction(() => window.codeSecretTest);
      assert.equal(await page.evaluate(() => codeSecretTest.getState().status), 'not-started');
      const results = await page.evaluate(async () => {
        const R='rouge', B='bleu', V='vert', J='jaune', O='orange', Vi='violet';
        const examples = [
          [[R,B,V,J],[R,V,B,O],1,2], [[R,B,V,J],[O,Vi,R,B],0,2],
          [[R,B,V,J],[B,R,J,V],0,4], [[R,B,V,J],[R,B,J,V],2,2],
          [[R,B,V,J],[R,B,V,J],4,0], [[R,R,B,V],[R,R,R,R],2,0],
          [[R,R,B,V],[R,B,R,V],2,2], [[R,R,B,V],[R,R,B,V],4,0],
          [[R,R,B,V],[R,B,R,R],1,2]
        ];
        for (const [secret,guess,wellPlaced,misplaced] of examples) {
          await codeSecretTest.startGame({secret});
          const state = await codeSecretTest.submitGuess(guess);
          if (state.attempts !== 1 || state.history.length !== 1 || state.lastError !== null ||
              state.lastResult.wellPlaced !== wellPlaced || state.lastResult.misplaced !== misplaced ||
              state.status !== (wellPlaced === 4 ? 'won' : 'playing') ||
              document.querySelector('#counter').textContent !== '1 / 10 essais' ||
              document.querySelector('.played .hint-counts').textContent !== `${wellPlaced} bien · ${misplaced} mal` ||
              'secret' in state || 'solution' in state) return false;
        }
        // Copies publiques : y compris les résultats asynchrones et les erreurs.
        const state = codeSecretTest.getState(), before = JSON.stringify(state);
        state.history[0].guess[0]='jaune'; state.history[0].result.wellPlaced=99;
        state.lastGuess[0]='violet'; state.lastResult.misplaced=99;
        const config=codeSecretTest.getConfig(); config.colors.length=0;
        if (JSON.stringify(codeSecretTest.getState()) !== before || codeSecretTest.getConfig().colors.length !== 6) return false;
        const invalid=await codeSecretTest.submitGuess(['rouge',null]);
        invalid.lastError.code='changed';
        return codeSecretTest.getState().lastError.code === 'invalid-type';
      });
      assert.equal(results, true);
      await page.evaluate(() => codeSecretTest.startGame({secret:['rouge','rouge','bleu','vert']}));
      await page.evaluate(() => codeSecretTest.submitGuess(['rouge','bleu','rouge','vert']));
      await page.setViewportSize({ width: 390, height: 1000 });
      await page.screenshot({ path: path.resolve(__dirname, '../test-results/api-390.png'), fullPage: true });
    } finally { await new Promise(resolve => server.close(resolve)); }
    assert.deepEqual(errors, []);
    console.log('OK : interface, clavier, modification, invalidité, indices, victoire, dixième essai, défaite, fin figée, redémarrage, API partagée, mode test, largeurs 1360/1024/850/768/390/320, aucune erreur JavaScript.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
