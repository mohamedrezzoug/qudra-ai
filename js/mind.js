// QUDRA MIND – التفكير + تدريب العقل (بدون ادعاءات طبية)
import * as S from './store.js';
import { PUZZLES } from './content.js';
import { ui, hooks, h, st, tr, lc, _, card, btn, pageHead, tabs, give, giveOnce, lines, dayIndex, rnd, wait, spark, note } from './core.js';

const sub = () => (ui.sub.mind = ui.sub.mind || 'tools');
export function viewMind() {
  const t = sub();
  const head = tabs([['tools', '🧩 ' + _('أدوات التفكير', 'Outils de pensée', 'Thinking tools')], ['train', '🎯 ' + _('تدريب', 'Entraînement', 'Train')], ['prog', '📈 ' + _('التقدم', 'Progrès', 'Progress')]], t, (v) => { ui.sub.mind = v; hooks.render(); });
  let body;
  if (t === 'tools') {
    const tools = [['matrix', tr('tool_matrix')], ['pc', tr('tool_pc')], ['whys', tr('tool_whys')], ['puzzle', tr('tool_puzzle')]];
    body = h('div', { class: 'stack' }, tabs(tools, ui.think, (id) => { ui.think = id; hooks.render(); }), { matrix: toolMatrix, pc: toolPC, whys: toolWhys, puzzle: toolPuzzle }[ui.think]());
  } else if (t === 'train') body = viewTrain(); else body = viewProgress();
  return h('div', { class: 'page' }, pageHead('🧠', tr('think_title'), tr('m_think')), head, body);
}

// ---- أدوات التفكير
function toolMatrix() {
  const opts = h('textarea', { rows: 3, placeholder: tr('options') }); const crs = h('textarea', { rows: 3, placeholder: tr('criteria') }); const out = h('div', { class: 'mx-out' });
  const sel = (val, fn) => h('select', { onchange: (e) => fn(+e.target.value) }, [1, 2, 3, 4, 5].map((n) => h('option', { value: n, selected: n === val }, n)));
  function build() {
    const O = lines(opts.value).slice(0, 6), C = lines(crs.value).slice(0, 6);
    if (O.length < 2 || !C.length) { out.replaceChildren(); return; }
    const w = C.map(() => 3); const sc = C.map(() => O.map(() => 3)); const totals = O.map(() => h('b', {}, '0')); const best = h('p', { class: 'best' });
    const recalc = () => { const tot = O.map((_o, j) => C.reduce((a, _c, i) => a + w[i] * sc[i][j], 0)); const max = Math.max(...tot);
      totals.forEach((el, j) => { el.textContent = tot[j]; el.parentElement.classList.toggle('win', tot[j] === max); });
      best.textContent = `🏆 ${tr('best_option')}: ${O.filter((_o, j) => tot[j] === max).join(' / ')}`; };
    const table = h('table', { class: 'mx' }, h('thead', {}, h('tr', {}, h('th', {}), h('th', {}, tr('weight')), O.map((o) => h('th', {}, o)))),
      h('tbody', {}, C.map((c, i) => h('tr', {}, h('td', {}, c), h('td', {}, sel(3, (v) => { w[i] = v; recalc(); })), O.map((_o, j) => h('td', {}, sel(3, (v) => { sc[i][j] = v; recalc(); }))))),
        h('tr', { class: 'tot' }, h('td', {}, tr('result')), h('td', {}), totals.map((x) => h('td', {}, x)))));
    out.replaceChildren(h('p', { class: 'muted small' }, tr('score_hint')), h('div', { class: 'scroll-x' }, table), best, btn(tr('save_xp'), () => giveOnce('matrix', 8), 'ghost')); recalc();
  }
  return card(h('label', { class: 'fl' }, tr('options'), opts), h('label', { class: 'fl' }, tr('criteria'), crs), btn(tr('build_table'), build, 'primary'), out);
}
function toolPC() {
  const title = h('input', { placeholder: tr('decision_ph') });
  const mk = (cls, lab) => { const list = h('ul', { class: 'pc ' + cls }); const inp = h('input', { placeholder: lab }); const addI = () => { if (inp.value.trim()) { list.append(h('li', {}, inp.value.trim())); inp.value = ''; } };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addI(); }); return { el: h('div', { class: 'pccol' }, h('h4', {}, lab), list, h('div', { class: 'row' }, inp, btn('＋', addI, 'mini'))), list }; };
  const p = mk('pro', '✅ ' + tr('pros')); const c = mk('con', '⚠️ ' + tr('cons'));
  return card(title, h('div', { class: 'pcgrid' }, p.el, c.el), btn(tr('save_xp'), () => { if (p.list.children.length + c.list.children.length >= 2) giveOnce('pc', 6); }, 'ghost'));
}
function toolWhys() {
  const prob = h('input', { placeholder: tr('problem_ph') }); const inputs = [1, 2, 3, 4, 5].map((n) => h('input', { placeholder: `${n}. ${tr('why_n')}` }));
  const act = h('input', { placeholder: tr('next_step_ph') }); const root = h('p', { class: 'best' });
  inputs.forEach((i) => i.addEventListener('input', () => { const f = inputs.filter((x) => x.value.trim()); root.textContent = f.length ? `🎯 ${tr('root_cause')}: ${f[f.length - 1].value}` : ''; }));
  return card(prob, h('div', { class: 'stack' }, inputs), root, act, btn(tr('save_xp'), () => { if (prob.value.trim() && inputs.filter((x) => x.value.trim()).length >= 3) giveOnce('whys', 8); }, 'ghost'));
}
function toolPuzzle() {
  if (ui.puzzle == null) ui.puzzle = dayIndex() % PUZZLES.length;
  const p = PUZZLES[ui.puzzle]; const exp = h('p', { class: 'fb' }); const wrap = h('div', { class: 'quiz' });
  p.o.forEach((o, i) => wrap.append(h('button', { class: 'opt', onclick: (e) => {
    [...wrap.children].forEach((b) => (b.disabled = true)); const ok = i === p.a; e.currentTarget.classList.add(ok ? 'ok' : 'bad'); wrap.children[p.a].classList.add('ok');
    exp.className = 'fb ' + (ok ? 'ok' : 'bad'); exp.textContent = (ok ? tr('correct') + ' ' : '') + lc(p.e); if (ok) giveOnce('puzzle' + ui.puzzle, 5);
  } }, typeof o === 'string' ? o : lc(o))));
  return card(h('div', { class: 'lbl' }, '🧩 ' + tr('tool_puzzle')), h('p', { class: 'q' }, lc(p.q)), wrap, exp, btn(tr('more_puzzle') + ' ↻', () => { ui.puzzle = (ui.puzzle + 1) % PUZZLES.length; hooks.render(); }, 'ghost'));
}

// ---- تدريب
const GAMES = [
  { id: 'memory', icon: '🔢', name: () => _('ذاكرة التسلسل', 'Mémoire de séquence', 'Sequence memory'), desc: () => _('شوف التسلسل وعاودو. كل مرة كيطول.', 'Regarde la séquence et répète-la. Elle s\'allonge.', 'Watch the sequence and repeat it. It grows each round.') },
  { id: 'focus', icon: '🎨', name: () => _('التركيز (ستروب)', 'Concentration (Stroop)', 'Focus (Stroop)'), desc: () => _('اختار لون الحبر ماشي معنى الكلمة. 30 ثانية.', 'Choisis la couleur de l\'encre, pas le mot. 30 s.', 'Pick the ink colour, not the word. 30 s.') },
  { id: 'speed', icon: '⚡', name: () => _('حساب سريع', 'Calcul rapide', 'Speed math'), desc: () => _('أكبر عدد من العمليات فـ 30 ثانية.', 'Un maximum de calculs en 30 s.', 'As many sums as you can in 30 s.') },
];
function record(game, score) {
  const s = st(); s.mind.push({ d: S.today(), g: game, s: score }); s.mind = s.mind.slice(-120); S.logEvent('mind', `${game}: ${score}`);
  if (!giveOnce('mind-' + game, 3)) S.save(); else S.save();
}
function viewTrain() {
  const area = h('div', { class: 'stack' });
  const list = GAMES.map((g) => card(h('div', { class: 'skill' }, h('div', { class: 'big' }, g.icon), h('div', { class: 'grow1' }, h('h3', {}, g.name()), h('p', { class: 'muted' }, g.desc()))), btn('▶ ' + _('ابدا', 'Démarrer', 'Start'), () => runGame(g, area, list), 'primary')));
  area.append(...list);
  area.append(note(_('هاد التمارين للتسلية وتتبع الأداء الشخصي، ماشي تشخيص ولا علاج طبي.', 'Ces exercices servent à s\'entraîner et suivre ses progrès, pas à diagnostiquer ni soigner.', 'These exercises are for practice and tracking your own progress, not diagnosis or treatment.')));
  return area;
}
function runGame(g, area, list) {
  if (ui.stop) ui.stop();
  const box = h('div', { class: 'stack' }); area.replaceChildren(card(h('h3', {}, g.icon + ' ' + g.name()), box, btn('← ' + tr('back'), () => { if (ui.stop) ui.stop(); hooks.render(); }, 'ghost')));
  const finish = (score) => { record(g.id, score); box.replaceChildren(h('h2', { class: 'center' }, `🏁 ${score}`), btn('↻ ' + _('عاود', 'Rejouer', 'Again'), () => runGame(g, area, list), 'primary')); };
  ({ memory: gMemory, focus: gFocus, speed: gSpeed }[g.id])(box, finish);
}
function gMemory(box, done) {
  let seq = [rnd(9)], pos = 0, lock = true, alive = true; const info = h('p', { class: 'center muted' }, '…');
  const pads = [...Array(9)].map((_n, i) => h('button', { class: 'pad', 'aria-label': 'pad ' + (i + 1), onclick: () => press(i) }));
  const flash = (i) => { pads[i].classList.add('lit'); setTimeout(() => pads[i].classList.remove('lit'), 320); };
  async function play() { lock = true; info.textContent = _('شوف…', 'Regarde…', 'Watch…') + ` (${seq.length})`; for (const i of seq) { await wait(620); if (!alive) return; flash(i); } await wait(450); if (!alive) return; lock = false; pos = 0; info.textContent = _('دورك!', 'À toi !', 'Your turn!'); }
  function press(i) { if (lock || !alive) return; flash(i); if (i !== seq[pos]) { alive = false; done(seq.length - 1); return; } pos++; if (pos === seq.length) { seq.push(rnd(9)); lock = true; setTimeout(play, 700); } }
  ui.stop = () => { alive = false; }; box.append(info, h('div', { class: 'pads' }, pads)); play();
}
function gFocus(box, done) {
  const C = [['#e63946', _('أحمر', 'Rouge', 'Red')], ['#2ec4b6', _('أخضر', 'Vert', 'Green')], ['#4895ef', _('أزرق', 'Bleu', 'Blue')], ['#ffd166', _('أصفر', 'Jaune', 'Yellow')]];
  let score = 0, wrong = 0, left = 30, cur; const timer = h('p', { class: 'center muted' }, '30'); const word = h('div', { class: 'stroop' }); const sc = h('p', { class: 'center' }, '0');
  const next = () => { const w = rnd(4); let ink = rnd(4); if (Math.random() < 0.75) while (ink === w) ink = rnd(4); cur = ink; word.textContent = C[w][1]; word.style.color = C[ink][0]; };
  const btns = C.map((c, i) => h('button', { class: 'btn', onclick: () => { if (i === cur) score++; else wrong++; sc.textContent = `${score}  ✕${wrong}`; next(); } }, c[1]));
  const iv = setInterval(() => { left--; timer.textContent = left; if (left <= 0) { clearInterval(iv); done(Math.max(0, score - wrong)); } }, 1000);
  ui.stop = () => clearInterval(iv); box.append(timer, word, h('div', { class: 'row wrap center' }, btns), sc); next();
}
function gSpeed(box, done) {
  let score = 0, left = 30, ans; const timer = h('p', { class: 'center muted' }, '30'); const q = h('div', { class: 'stroop' }); const inp = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': 'answer' }); const sc = h('p', { class: 'center' }, '0');
  const next = () => { const a = 2 + rnd(18), b = 2 + rnd(9), op = rnd(3); ans = op === 0 ? a + b : op === 1 ? a - b : (a % 10 || 3) * b; q.textContent = op === 0 ? `${a} + ${b}` : op === 1 ? `${a} − ${b}` : `${a % 10 || 3} × ${b}`; inp.value = ''; inp.focus(); };
  const check = () => { if (inp.value === '') return; if (+inp.value === ans) { score++; sc.textContent = score; } next(); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  const iv = setInterval(() => { left--; timer.textContent = left; if (left <= 0) { clearInterval(iv); done(score); } }, 1000);
  ui.stop = () => clearInterval(iv); box.append(timer, q, h('div', { class: 'row' }, inp, btn('✓', check, 'primary')), sc); next();
}
function viewProgress() {
  const s = st();
  return h('div', { class: 'stack' }, GAMES.map((g) => { const rows = s.mind.filter((m) => m.g === g.id); const vals = rows.slice(-12).map((m) => m.s);
    return card(h('h3', {}, g.icon + ' ' + g.name()), rows.length ? [spark(vals), h('small', {}, `${_('الأفضل', 'Meilleur', 'Best')}: ${Math.max(...rows.map((m) => m.s))} · ${_('جلسات', 'sessions', 'sessions')}: ${rows.length}`)] : note(_('ما بقاش لعبتي. جرب فتبويب «تدريب».', 'Pas encore joué. Essaie l\'onglet « Entraînement ».', 'Not played yet. Try the Train tab.'))); }));
}
