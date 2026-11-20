// QUDRA MEMORY – spaced review of everything you learned (Leitner on lesson quizzes)
import { ui, hooks, h, st, tr, lc, _, card, bar, btn, pageHead, note, give, speak } from './core.js';
import * as S from './store.js';

const INT = [0, 0, 1, 2, 4, 8, 16];
const dayAdd = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
function cards() {
  const s = st(); s.rev = s.rev || {}; const out = [];
  for (const k of S.allSkills()) for (const l of k.lessons) if (s.done[l.id] && l.q) out.push({ id: l.id, k, l, r: s.rev[l.id] || { box: 1, due: S.today() } });
  return out;
}
const due = () => cards().filter((c) => c.r.due <= S.today());
function grade(c, ok) {
  const s = st(); const r = s.rev[c.id] || { box: 1 }; r.box = ok ? Math.min(6, r.box + 1) : 1; r.due = dayAdd(INT[r.box]); s.rev[c.id] = r; give(ok ? 3 : 1);
}
export function viewMemory() {
  const all = cards(); const d = due(); const mastered = all.filter((c) => c.r.box >= 5).length;
  const box = h('div', { class: 'stack' });
  const next = () => {
    const q = due()[0]; box.replaceChildren();
    if (!q) { box.append(card(h('h3', {}, '🎉 ' + _('ما بقا والو للمراجعة اليوم', 'Rien à réviser aujourd\'hui', 'Nothing to review today')), note(_('رجع غدا. المراجعة المتباعدة كتثبت المعلومة فالذاكرة.', 'Reviens demain : la répétition espacée ancre le savoir.', 'Come back tomorrow: spaced repetition makes knowledge stick.')))); return; }
    const fb = h('p', { class: 'fb' }); const opts = h('div', { class: 'quiz' });
    q.l.q.o.forEach((o, i) => opts.append(h('button', { class: 'opt', onclick: (e) => {
      [...opts.children].forEach((b) => (b.disabled = true)); const ok = i === q.l.q.a;
      e.currentTarget.classList.add(ok ? 'ok' : 'bad'); opts.children[q.l.q.a].classList.add('ok');
      fb.textContent = ok ? tr('correct') : tr('wrong'); fb.className = 'fb ' + (ok ? 'ok' : 'bad'); grade(q, ok);
      box.append(btn(tr('next') + ' →', () => { hooks.render(); }, 'primary'));
    } }, lc(o))));
    box.append(card(h('div', { class: 'lbl' }, `${q.k.icon} ${lc(q.k.name)} · ${lc(q.l.t)}`), h('p', { class: 'q' }, lc(q.l.q.q)), h('button', { class: 'chip', onclick: () => speak(lc(q.l.q.q)) }, '🔊'), opts, fb));
  };
  next();
  return h('div', { class: 'page' }, pageHead('🔁', 'QUDRA MEMORY', _('ما تنساش اللي تعلمتي', 'N\'oublie plus ce que tu apprends', 'Never forget what you learn')),
    h('div', { class: 'stats' }, card(h('div', { class: 'stat' }, h('b', {}, `📥 ${d.length}`), h('small', {}, _('للمراجعة اليوم', 'à réviser', 'due today')))), card(h('div', { class: 'stat' }, h('b', {}, `📚 ${all.length}`), h('small', {}, _('دروس محفوظة', 'leçons suivies', 'lessons tracked')))), card(h('div', { class: 'stat' }, h('b', {}, `🏅 ${mastered}`), bar(all.length ? mastered / all.length : 0), h('small', {}, _('متقنة', 'maîtrisées', 'mastered'))))),
    all.length ? box : card(note(_('كمل درس واحد على الأقل باش تبدا المراجعة.', 'Termine au moins une leçon pour commencer.', 'Finish at least one lesson to start reviewing.'))));
}
