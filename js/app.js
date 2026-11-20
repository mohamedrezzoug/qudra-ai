// QUDRA AI 1.0 – the human potential platform
import { LANGS } from './i18n.js';
import { SKILLS, TIPS } from './content.js';
import * as S from './store.js';
import * as AI from './ai.js';
import { createScene } from './scene.js';
import { ui, hooks, $, h, st, tr, lc, _, isRtl, shortName, fmtDate, dayIndex, card, bar, btn, pageHead, give, giveOnce, msg, note, download, speak } from './core.js';
import * as Human from './human.js';
import { viewMind } from './mind.js';
import { viewInvent } from './invent.js';
import { viewUniversal } from './universal.js';
import { viewCareer } from './career.js';
import { viewWorld, handleHash, sanitize, courseToSkill } from './world.js';
import { viewVision } from './vision.js';
import { viewOffline, deferred } from './offline.js';
import { viewMemory } from './memory.js';
import { viewAccess, applyA11y } from './access.js';

let scene = null;

// ---------- navigation
const TABS = [{ id: 'home', icon: '🏠', k: 'nav_home' }, { id: 'learn', icon: '📘', k: 'nav_learn' }, { id: 'think', icon: '🧠', k: 'nav_think' }, { id: 'create', icon: '🛠️', k: 'nav_create' }, { id: 'more', icon: '☰', k: 'nav_more' }];
const MORE_GROUP = ['more', 'memory', 'access', 'language', 'career', 'world', 'grow', 'vision', 'offline'];
function go(tab) {
  if (ui.stop) { ui.stop(); ui.stop = null; }
  ui.tab = tab; if (tab !== 'learn') ui.lesson = null; if (tab !== 'language') ui.session = null;
  render(); $('#view').scrollTo({ top: 0 });
}
function renderChrome() {
  const active = (id) => (id === 'more' ? MORE_GROUP.includes(ui.tab) : ui.tab === id);
  $('#nav').replaceChildren(...TABS.map((x) => h('button', { class: 'nav-btn' + (active(x.id) ? ' on' : ''), onclick: () => go(x.id), 'aria-label': tr(x.k) }, h('span', { class: 'ic' }, x.icon), h('span', { class: 'lb' }, tr(x.k)))));
  $('#fab').className = 'fab' + (ui.tab === 'coach' ? ' on' : ''); $('#fab').setAttribute('aria-label', 'QUDRA HUMAN');
  $('#langs').replaceChildren(...Object.keys(LANGS).map((c) => h('button', { class: 'lang-btn' + (st().lang === c ? ' on' : ''), onclick: () => { st().lang = c; S.save(); applyLang(); render(); } }, c.toUpperCase())));
  $('#topxp').textContent = `${navigator.onLine === false ? '🟠 ' : ''}⭐ ${st().xp}`;
}
function applyLang() {
  const l = st().lang; document.documentElement.lang = l; document.documentElement.dir = LANGS[l].dir;
  if (scene) scene.setLabels(Object.fromEntries(['learn', 'think', 'create', 'language', 'career', 'world', 'grow'].map((m) => [m, tr('nav_' + m)])));
  renderChrome();
}
function sceneFor(tab) {
  if (!scene) return;
  if (tab === 'home') scene.setMode('home');
  else if (tab === 'grow') { scene.buildGrow(S.allSkills().map((k) => ({ label: shortName(lc(k.name), 13), color: k.color, p: S.skillDone(k) / k.lessons.length }))); scene.setMode('grow'); }
  else scene.setMode('ambient');
  document.body.dataset.tab = tab;
}
function render() {
  renderChrome(); sceneFor(ui.tab);
  const map = { home: viewHome, learn: viewLearn, think: viewMind, create: viewInvent, language: viewUniversal, career: viewCareer, world: viewWorld, vision: viewVision, grow: viewGrow, more: viewMore, offline: viewOffline, memory: viewMemory, access: viewAccess, coach: Human.viewHuman };
  $('#view').replaceChildren(map[ui.tab]());
}

// ---------- HOME
const MODS = [
  { id: 'learn', icon: '📘', c: '#4cc9f0', t: 'QUDRA ACADEMY', k: 'm_learn' }, { id: 'think', icon: '🧠', c: '#ffd166', t: 'QUDRA MIND', k: 'm_think' }, { id: 'create', icon: '🛠️', c: '#f72585', t: 'QUDRA INVENT', k: 'm_create' },
  { id: 'language', icon: '🌍', c: '#06d6a0', t: 'QUDRA UNIVERSAL', k: 'm_language' }, { id: 'career', icon: '💼', c: '#ff9f1c', t: 'QUDRA CAREER', k: 'm_career' }, { id: 'world', icon: '🌐', c: '#4895ef', t: 'QUDRA WORLD', k: 'm_world' },
  { id: 'grow', icon: '🌟', c: '#9b5de5', t: 'QUDRA LIFE MAP', k: 'm_grow' }, { id: 'vision', icon: '👁️', c: '#2ec4b6', t: 'QUDRA VISION', k: 'm_vision' }, { id: 'offline', icon: '📶', c: '#8d99ae', t: 'QUDRA OFFLINE', k: 'm_offline' }, { id: 'memory', icon: '🔁', c: '#e76f51', t: 'QUDRA MEMORY', k: 'm_memory' }, { id: 'access', icon: '♿', c: '#00b4d8', t: 'QUDRA ACCESS', k: 'm_access' }, { id: 'coach', icon: '🤖', c: '#c77dff', t: 'QUDRA HUMAN', k: 'm_human' },
];
const modGrid = (list) => h('div', { class: 'mods' }, list.map((m) => h('button', { class: 'mod', style: `--c:${m.c}`, onclick: () => go(m.id) }, h('span', { class: 'mi' }, m.icon), h('b', {}, m.t), h('small', {}, tr(m.k)))));
function viewHome() {
  const s = st(); const nx = S.nextLesson(); const lvl = S.levelOf(s.xp);
  const focus = nx
    ? card(h('div', { class: 'lbl' }, tr('today_focus')), h('div', { class: 'focus' }, h('div', { class: 'big' }, nx.sk.icon), h('div', {}, h('h3', {}, lc(nx.l.t)), h('p', { class: 'muted' }, lc(nx.sk.name)))), btn(tr('continue') + ' →', () => { ui.tab = 'learn'; openLesson(nx.l.id); }, 'primary'))
    : card(h('div', { class: 'lbl' }, tr('today_focus')), h('p', {}, s.path.length ? tr('all_done') : tr('m_learn')), btn(tr('nav_learn'), () => go('learn'), 'primary'));
  return h('div', { class: 'page' },
    h('div', { class: 'hero-space' }, h('div', { class: 'hero-text' }, h('h1', {}, `${tr('hi')} ${s.name || ''} 👋`), h('p', { class: 'tag' }, tr('tagline')), h('p', { class: 'hint' }, '✨ ' + tr('open_3d')))),
    h('div', { class: 'stats' }, card(h('div', { class: 'stat' }, h('b', {}, `${tr('level')} ${lvl}`), bar(S.levelProgress(s.xp)), h('small', {}, `${s.xp} ${tr('xp')}`))), card(h('div', { class: 'stat' }, h('b', {}, `🔥 ${s.streak}`), h('small', {}, tr('streak')))), card(h('div', { class: 'stat' }, h('b', {}, `✅ ${S.doneCount()}`), h('small', {}, tr('lessons_done'))))),
    focus, modGrid(MODS), card(h('div', { class: 'lbl' }, tr('daily_tip')), h('p', { class: 'tip' }, '💡 ' + lc(TIPS[dayIndex() % TIPS.length]))));
}
function viewMore() { return h('div', { class: 'page' }, pageHead('☰', tr('nav_more'), tr('tagline')), modGrid(MODS.filter((m) => ['language', 'career', 'world', 'grow', 'vision', 'memory', 'access', 'offline', 'coach'].includes(m.id)))); }

// ---------- ACADEMY
function openLesson(id) { ui.lesson = id; ui.quizOk = !!st().done[id]; ui.exDone = !!st().done[id]; render(); $('#view').scrollTo({ top: 0 }); }
async function genCourse(topic, out) {
  if (topic.trim().length < 3) { msg(_('كتب الموضوع', 'Écris le sujet', 'Write the topic')); return; }
  if (!AI.enabled()) { out.replaceChildren(card(h('p', {}, _('توليد الكورسات كيحتاج الذكاء الاصطناعي والإنترنت.', 'La génération de cours nécessite l\'IA et Internet.', 'Course generation needs AI and internet.')), h('p', { class: 'muted' }, tr('ai_enable_hint')), btn('⚙️', () => go('offline'), 'ghost'))); return; }
  out.replaceChildren(card(h('p', { class: 'fb' }, '✨ ' + tr('ai_thinking') + ' (~20s)')));
  try {
    const j = await AI.askJSON({ task: 'course', messages: [{ role: 'user', content: topic.trim().slice(0, 200) }], lang: st().lang, profile: { level: st().level } });
    const c = sanitize({ t: 'course', title: j.title, icon: j.icon, desc: j.description, lang: st().lang, lessons: (j.lessons || []).map((l) => ({ t: l.title, body: l.body, ex: l.exercise, q: { q: l.quiz && l.quiz.question || l.quiz && l.quiz.q, o: l.quiz && (l.quiz.options || l.quiz.o), a: l.quiz && (l.quiz.answer != null ? l.quiz.answer : l.quiz.a) } })) });
    if (c.lessons.length < 3) throw new Error('too few lessons');
    const sk = courseToSkill(c); st().custom.push(sk); st().path.push(sk.id); S.logEvent('course', c.title); give(15); render();
  } catch (e) { out.replaceChildren(card(h('p', { class: 'fb bad' }, _('ما قدرتش نصاوب الكورس، عاود حاول أو بدّل الموضوع.', 'Impossible de créer le cours, réessaie ou change de sujet.', 'Could not create the course, try again or change the topic.')))); }
}
function viewLearn() {
  if (ui.lesson) return viewLesson();
  const s = st(); const fd = S.finishDate();
  const pathEls = S.pathLessons().map(({ sk, l }, i) => h('button', { class: 'lrow' + (s.done[l.id] ? ' done' : ''), onclick: () => openLesson(l.id) }, h('span', { class: 'dot', style: `--c:${sk.color}` }, s.done[l.id] ? '✓' : i + 1), h('span', { class: 'lt' }, h('b', {}, lc(l.t)), h('small', {}, sk.icon + ' ' + lc(sk.name)))));
  const topic = h('input', { placeholder: _('مثلا: التصوير، السباكة، الإسعافات الأولية…', 'ex. : photographie, plomberie, premiers secours…', 'e.g. photography, plumbing, first aid…') }); const out = h('div', { class: 'stack' });
  topic.addEventListener('keydown', (e) => { if (e.key === 'Enter') genCourse(topic.value, out); });
  const skills = S.allSkills().map((k) => {
    const inPath = s.path.includes(k.id); const d = S.skillDone(k);
    return card(h('div', { class: 'skill' }, h('div', { class: 'big', style: `--c:${k.color}` }, k.icon), h('div', { class: 'grow1' }, h('h3', {}, lc(k.name), k.custom && ' ✨'), h('p', { class: 'muted' }, lc(k.desc)), bar(d / k.lessons.length, k.color), h('small', {}, `${d}/${k.lessons.length} ${tr('lessons')}`))),
      h('div', { class: 'row wrap' }, btn(inPath ? '✓ ' + tr('in_path') + ' · ' + tr('remove') : '＋ ' + tr('add_path'), () => { s.path = inPath ? s.path.filter((x) => x !== k.id) : [...s.path, k.id]; S.save(); render(); }, inPath ? 'ghost' : 'primary'),
        k.custom && btn(tr('delete'), () => { if (confirm(tr('reset_confirm'))) { s.custom = s.custom.filter((x) => x.id !== k.id); s.path = s.path.filter((x) => x !== k.id); k.lessons.forEach((l) => delete s.done[l.id]); S.save(); render(); } }, 'ghost danger')));
  });
  return h('div', { class: 'page' }, pageHead('📘', tr('learn_title'), tr('m_learn')),
    card(h('h3', {}, tr('my_path')), fd && h('p', { class: 'muted' }, `${tr('est_finish')} ${fmtDate(fd)} · ⏱ ${s.minutes} ${tr('min')}`), pathEls.length ? h('div', { class: 'list' }, pathEls) : h('p', { class: 'muted' }, tr('m_learn'))),
    card(h('h3', {}, '✨ ' + _('تعلم أي حاجة: كورس بالذكاء الاصطناعي', 'Apprends tout : cours généré par l\'IA', 'Learn anything: AI-built course')), h('p', { class: 'muted' }, _('كتب الموضوع وأنا نصاوب ليك كورس من 5 دروس مع تمارين واختبارات.', 'Écris un sujet et je crée un cours de 5 leçons avec exercices et quiz.', 'Type a topic and I will build a 5-lesson course with exercises and quizzes.')), h('div', { class: 'row' }, topic, btn('✨', () => genCourse(topic.value, out), 'primary')), out),
    h('h3', { class: 'sec' }, tr('all_skills')), ...skills);
}
const lessonCtx = (k, l) => `${lc(k.name)} — ${lc(l.t)}: ${lc(l.body)}`.slice(0, 380);
function viewLesson() {
  const found = S.allSkills().flatMap((k) => k.lessons.map((l) => ({ k, l }))).find((x) => x.l.id === ui.lesson);
  if (!found) { ui.lesson = null; return viewLearn(); }
  const { k, l } = found; const done = !!st().done[l.id];
  const quiz = h('div', { class: 'quiz' }); const fb = h('p', { class: 'fb' });
  l.q.o.forEach((o, i) => quiz.append(h('button', { class: 'opt', onclick: (e) => {
    if (i === l.q.a) { ui.quizOk = true; e.currentTarget.classList.add('ok'); fb.textContent = tr('correct'); fb.className = 'fb ok'; refreshFinish(); } else { e.currentTarget.classList.add('bad'); fb.textContent = tr('wrong'); fb.className = 'fb bad'; }
  } }, lc(o))));
  const finish = btn(done ? '✓ ' + tr('done') : tr('complete_lesson'), () => {
    if (done || !(ui.quizOk && ui.exDone)) return;
    st().done[l.id] = 1; S.logEvent('lesson', lc(l.t)); const complete = S.skillDone(k) === k.lessons.length; if (complete) S.logEvent('skill', lc(k.name)); give(20 + (complete ? 30 : 0)); render();
  }, 'primary'); finish.disabled = done || !(ui.quizOk && ui.exDone);
  function refreshFinish() { finish.disabled = done || !(ui.quizOk && ui.exDone); }
  const idx = k.lessons.indexOf(l); const nextL = k.lessons[idx + 1];
  return h('div', { class: 'page' },
    h('button', { class: 'back', onclick: () => { ui.lesson = null; render(); } }, (isRtl() ? '→ ' : '← ') + tr('back')),
    card(h('div', { class: 'lbl', style: `color:${k.color}` }, `${k.icon} ${lc(k.name)} · ${tr('lesson')} ${idx + 1}/${k.lessons.length}`), h('h2', {}, lc(l.t)), h('p', { class: 'body' }, lc(l.body)), (st().a11y && st().a11y.readAll) && h('button', { class: 'chip', onclick: () => speak(lc(l.t) + '. ' + lc(l.body)) }, '🔊 ' + _('اقرأ بالصوت', 'Lire à voix haute', 'Read aloud')), l.code && h('pre', { class: 'code', dir: 'ltr' }, l.code)),
    card(h('div', { class: 'lbl' }, '🎯 ' + tr('exercise')), h('p', {}, lc(l.ex)), h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: ui.exDone, disabled: done, onchange: (e) => { ui.exDone = e.target.checked; refreshFinish(); } }), tr('ex_done'))),
    card(h('div', { class: 'lbl' }, '❓ ' + tr('quiz')), h('p', { class: 'q' }, lc(l.q.q)), quiz, fb),
    card(h('div', { class: 'row wrap' }, h('button', { class: 'chip', onclick: () => Human.ask(tr('ask_explain_p'), lessonCtx(k, l)) }, tr('ask_explain')), h('button', { class: 'chip', onclick: () => Human.ask(tr('ask_practice_p'), lessonCtx(k, l)) }, tr('ask_practice')))),
    h('div', { class: 'row' }, finish, done && nextL && btn(tr('next_lesson') + ' →', () => openLesson(nextL.id), 'ghost')),
    !done && h('p', { class: 'muted small' }, tr('need_quiz')));
}

// ---------- LIFE MAP
const EV_ICON = { lesson: '📘', skill: '🏆', project: '🛠️', 'project-done': '✅', mind: '🎯', career: '💼', course: '✨', milestone: '🚩', journal: '📓' };
function viewGrow() {
  const s = st(); const all = S.allSkills();
  const prog = all.map((k) => h('div', { class: 'prow' }, h('span', {}, k.icon + ' ' + lc(k.name)), bar(S.skillDone(k) / k.lessons.length, k.color)));
  const badges = S.BADGES.map((b) => h('div', { class: 'badge' + (s.badges.includes(b.id) ? ' on' : '') }, h('span', {}, b.icon), h('small', {}, tr(b.k))));
  const completed = all.filter((k) => S.skillDone(k) === k.lessons.length);
  const certs = completed.length ? completed.map((k) => btn('🎓 ' + lc(k.name), () => certificate(k), 'ghost')) : [h('p', { class: 'muted small' }, tr('cert_need'))];
  const jt = h('textarea', { rows: 3, placeholder: tr('journal_ph') });
  const jl = s.journal.slice(0, 6).map((j) => h('div', { class: 'jitem' }, h('small', {}, j.d), h('p', {}, j.t)));
  const mt = h('input', { placeholder: _('هدف: مثلا أنجز أول تطبيق', 'Objectif : ex. terminer ma 1re app', 'Goal: e.g. ship my first app') }); const md = h('input', { type: 'date', 'aria-label': 'date' });
  const ms = [...s.milestones].sort((a, b) => a.date.localeCompare(b.date));
  const days = (d) => Math.ceil((new Date(d + 'T00:00:00') - Date.now()) / 86400000);
  const msEls = ms.map((m) => h('div', { class: 'jitem row between' }, h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: m.done, onchange: (e) => { m.done = e.target.checked; if (m.done) { S.logEvent('milestone', m.text); give(10); } else S.save(); render(); } }), h('span', { style: m.done ? 'text-decoration:line-through;opacity:.6' : '' }, m.text)),
    h('small', { class: 'muted' }, m.done ? '✓' : (days(m.date) >= 0 ? `${days(m.date)} ${_('يوم', 'j', 'd')}` : _('فات الوقت', 'dépassé', 'overdue'))), h('button', { class: 'mini danger', onclick: () => { s.milestones = s.milestones.filter((x) => x.id !== m.id); S.save(); render(); } }, '✕')));
  const addMs = () => { if (mt.value.trim() && md.value) { s.milestones.push({ id: Date.now(), text: mt.value.trim().slice(0, 100), date: md.value, done: false }); S.save(); render(); } };
  const addIn = (n) => { const d = new Date(Date.now() + n * 86400000); md.value = d.toISOString().slice(0, 10); };
  const evs = s.events.slice(0, 12).map((e) => h('div', { class: 'tl' }, h('span', { class: 'tld' }, EV_ICON[e.type] || '•'), h('div', {}, h('small', { class: 'muted' }, e.d), h('p', {}, e.text))));
  const nextStep = () => Human.ask(_('شنو هي الخطوة الجاية الأنسب ليا حسب تقدمي؟ عطيني خطوة وحدة صغيرة.', 'Quelle est ma prochaine meilleure étape selon mes progrès ? Donne-moi une seule petite action.', 'What is my best next step given my progress? Give me one small action.'),
    `Learner events (latest first): ${s.events.slice(0, 15).map((e) => `${e.d} ${e.type}: ${e.text}`).join(' | ')}. Open goals: ${s.milestones.filter((m) => !m.done).map((m) => `${m.text} (${m.date})`).join('; ') || 'none'}. Completed skills: ${completed.map((k) => lc(k.name)).join(', ') || 'none'}.`);
  return h('div', { class: 'page' }, h('div', { class: 'hero-space short' }, h('h2', { class: 'ghead' }, '🌟 ' + tr('grow_title'))),
    h('div', { class: 'stats' }, card(h('div', { class: 'stat' }, h('b', {}, `${tr('level')} ${S.levelOf(s.xp)}`), bar(S.levelProgress(s.xp)), h('small', {}, `${s.xp} ${tr('xp')}`))), card(h('div', { class: 'stat' }, h('b', {}, `🔥 ${s.streak}`), h('small', {}, tr('streak')))), card(h('div', { class: 'stat' }, h('b', {}, `🚩 ${s.milestones.filter((m) => m.done).length}/${s.milestones.length}`), h('small', {}, _('أهداف', 'objectifs', 'goals'))))),
    card(h('h3', {}, '🧭 ' + _('خريطة تطورك', 'Ta carte d\'évolution', 'Your life map')), btn('✨ ' + _('شنو الخطوة الجاية؟', 'Prochaine étape ?', 'What\'s my next step?'), nextStep, 'primary'),
      h('div', { class: 'lbl' }, _('أهدافي', 'Mes objectifs', 'My goals')), msEls.length ? msEls : note(_('زيد أهداف: بعد شهر، 3 شهور، 6 شهور…', 'Ajoute des objectifs : 1 mois, 3 mois, 6 mois…', 'Add goals: 1 month, 3 months, 6 months…')),
      h('div', { class: 'row' }, mt, md), h('div', { class: 'row wrap' }, [[30, '+1m'], [90, '+3m'], [180, '+6m']].map(([n, l]) => h('button', { class: 'chip', onclick: () => addIn(n) }, l)), btn('＋', addMs, 'mini')),
      h('div', { class: 'lbl' }, _('رحلتي', 'Mon parcours', 'My journey')), evs.length ? evs : note(_('غادي تظهر هنا كل إنجازاتك.', 'Tes réussites apparaîtront ici.', 'Your achievements will appear here.'))),
    card(h('h3', {}, tr('skills_progress')), prog), card(h('h3', {}, tr('badges')), h('div', { class: 'badges' }, badges)),
    card(h('h3', {}, '🎓 ' + tr('certificate')), h('div', { class: 'stack' }, certs)),
    card(h('h3', {}, '📓 ' + tr('journal')), jt, btn(tr('save'), () => { if (jt.value.trim()) { s.journal.unshift({ d: S.today(), t: jt.value.trim() }); S.logEvent('journal', jt.value.trim().slice(0, 60)); give(3); render(); } }, 'primary'), jl),
    card(h('h3', {}, '🔒 ' + _('بياناتك ديالك', 'Tes données', 'Your data')), note(_('كلشي كيتخزن فهاد الجهاز. صدّر أو امسح فأي وقت.', 'Tout reste sur cet appareil. Exporte ou supprime à tout moment.', 'Everything stays on this device. Export or delete any time.')), h('div', { class: 'row wrap' }, btn('⬇ ' + tr('export'), () => download('qudra-backup.json', S.exportJSON(), 'application/json'), 'ghost'), btn('⚙️ ' + tr('settings'), () => go('offline'), 'ghost'))));
}
function certificate(k) {
  const c = document.createElement('canvas'); c.width = 1400; c.height = 990; const g = c.getContext('2d'); g.direction = isRtl() ? 'rtl' : 'ltr';
  const grd = g.createLinearGradient(0, 0, 1400, 990); grd.addColorStop(0, '#0b1030'); grd.addColorStop(1, '#2b1a6b'); g.fillStyle = grd; g.fillRect(0, 0, 1400, 990);
  g.strokeStyle = '#ffd166'; g.lineWidth = 8; g.strokeRect(40, 40, 1320, 910); g.lineWidth = 2; g.strokeRect(62, 62, 1276, 866);
  g.textAlign = 'center'; g.fillStyle = '#7ee0ff'; g.font = '700 54px system-ui, sans-serif'; g.fillText('QUDRA AI · قُدرة', 700, 170);
  g.fillStyle = '#fff'; g.font = '700 84px system-ui, sans-serif'; g.fillText(tr('cert_of'), 700, 330);
  g.font = '600 66px system-ui, sans-serif'; g.fillStyle = '#ffd166'; g.fillText(st().name || '—', 700, 480);
  g.fillStyle = '#cfd6ff'; g.font = '400 44px system-ui, sans-serif'; g.fillText(tr('cert_text'), 700, 580);
  g.fillStyle = '#fff'; g.font = '700 64px system-ui, sans-serif'; g.fillText(k.icon + ' ' + lc(k.name), 700, 690, 1100);
  g.fillStyle = '#9aa4d6'; g.font = '400 36px system-ui, sans-serif'; g.fillText(fmtDate(new Date()), 700, 840);
  c.toBlob((b) => download(`qudra-${k.id}.png`, URL.createObjectURL(b)));
}

// ---------- onboarding
function startOnboarding() {
  const s = st(); const d = { step: 0, lang: s.lang, name: s.name, goal: s.goal, level: s.level, minutes: s.minutes, picks: new Set(s.path) };
  const ov = $('#overlay'); ov.hidden = false;
  const draw = () => {
    const T = (k) => tr(k); let body;
    const dots = h('div', { class: 'dots' }, [0, 1, 2, 3].map((i) => h('i', { class: i <= d.step ? 'on' : '' })));
    const chip = (label, on, fn) => h('button', { class: 'chip big' + (on ? ' on' : ''), onclick: fn }, label);
    if (d.step === 0) body = [h('div', { class: 'logo3' }, '✦'), h('h1', {}, T('ob_welcome')), h('p', { class: 'muted' }, T('tagline')), h('h3', {}, T('ob_lang')), h('div', { class: 'row wrap center' }, Object.entries(LANGS).map(([c, l]) => chip(l.name, d.lang === c, () => { d.lang = c; s.lang = c; applyLang(); draw(); })))];
    if (d.step === 1) { const n = h('input', { value: d.name, placeholder: T('ob_name_ph'), oninput: (e) => (d.name = e.target.value) }); const g = h('textarea', { rows: 3, placeholder: T('ob_goal_ph'), oninput: (e) => (d.goal = e.target.value) }, d.goal); body = [h('h2', {}, T('ob_name')), n, h('h2', {}, T('ob_goal')), g]; }
    if (d.step === 2) body = [h('h2', {}, T('ob_level')), h('div', { class: 'row wrap center' }, [['beginner', 'lvl_beginner'], ['inter', 'lvl_inter'], ['adv', 'lvl_adv']].map(([v, k]) => chip(T(k), d.level === v, () => { d.level = v; draw(); }))), h('h2', {}, T('ob_time')), h('div', { class: 'row wrap center' }, [10, 20, 30, 45].map((m) => chip(`${m} ${T('min')}`, d.minutes === m, () => { d.minutes = m; draw(); })))];
    if (d.step === 3) body = [h('h2', {}, T('ob_interests')), h('div', { class: 'row wrap center' }, SKILLS.map((k) => chip(`${k.icon} ${lc(k.name)}`, d.picks.has(k.id), () => { d.picks.has(k.id) ? d.picks.delete(k.id) : d.picks.add(k.id); draw(); })))];
    const nextBtn = btn(d.step === 3 ? T('ob_start') + ' 🚀' : T('next'), () => {
      if (d.step < 3) { d.step++; draw(); return; }
      s.lang = d.lang; s.name = d.name.trim(); s.goal = d.goal.trim(); s.level = d.level; s.minutes = d.minutes;
      const picks = new Set(d.picks); const m = S.allSkills().find((k) => (k.kw || []).some((w) => d.goal.toLowerCase().includes(w.toLowerCase()))); if (m) picks.add(m.id); if (!picks.size) picks.add('code');
      s.path = S.allSkills().map((k) => k.id).filter((id) => picks.has(id)); s.onboarded = true; S.save(); ov.hidden = true; applyLang(); go('home');
    }, 'primary');
    ov.replaceChildren(h('div', { class: 'ob' }, dots, h('div', { class: 'obbody' }, body), h('div', { class: 'row between' }, d.step > 0 ? btn(T('back'), () => { d.step--; draw(); }, 'ghost') : h('span'), nextBtn)));
    ov.dir = LANGS[d.lang].dir;
  };
  draw();
}

// ---------- 3D toggle + boot
function apply3d() { const on = st().fx3d && !(st().a11y && st().a11y.calm) && !!scene; document.body.classList.toggle('no3d', !on); if (scene) scene.setRunning(on); }
function boot() {
  S.load();
  const cv = $('#scene');
  try { scene = createScene(cv, (id) => go(id)); } catch (e) { scene = null; }
  if (scene && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) scene.setReduce(true);
  Object.assign(hooks, { go, render, chrome: renderChrome, pulse: () => scene && scene.pulse(), ask: Human.ask, applyLang, apply3d, onboard: startOnboarding });
  $('#fab').addEventListener('click', () => go('coach'));
  let ty = null;
  cv.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  cv.addEventListener('touchmove', (e) => { const y = e.touches[0].clientY; $('#view').scrollTop += ty - y; ty = y; }, { passive: true });
  window.addEventListener('wheel', (e) => { if (e.target === cv) $('#view').scrollTop += e.deltaY; }, { passive: true });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred.ev = e; });
  window.addEventListener('online', () => { renderChrome(); msg('🟢 online'); }); window.addEventListener('offline', () => { renderChrome(); msg('🟠 offline'); });
  const imported = handleHash();
  applyA11y(); applyLang(); apply3d(); render();
  if (!st().onboarded) startOnboarding();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
  window.__qudra = { go, ui, S, imported };
}
boot();
