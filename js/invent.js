// QUDRA INVENT – مختبر الابتكار + المشاريع
import * as S from './store.js';
import * as AI from './ai.js';
import { PROJECT_STEPS } from './content.js';
import { ui, hooks, h, st, tr, lc, _, card, btn, pageHead, tabs, give, msg, isRtl, note, download } from './core.js';

const sub = () => (ui.sub.invent = ui.sub.invent || 'lab');
const SCAMPER = [
  ['S', _('بدّل', 'Substituer', 'Substitute'), _('شنو نقدر نعوض فهاد الشي؟', 'Que remplacer ?', 'What can be replaced?')],
  ['C', _('جمّع', 'Combiner', 'Combine'), _('مع شنو نقدر نجمعو؟', 'Avec quoi le combiner ?', 'What can it combine with?')],
  ['A', _('كيّف', 'Adapter', 'Adapt'), _('شنو كيشبهو فمجال آخر؟', 'À quoi ressemble-t-il ailleurs ?', 'What is similar in another field?')],
  ['M', _('عدّل', 'Modifier', 'Modify'), _('شنو نكبر أو نصغر أو نبدل؟', 'Que grossir, réduire ou changer ?', 'What to enlarge, shrink or change?')],
  ['P', _('استعمال آخر', 'Autre usage', 'Put to other use'), _('شكون آخر ممكن يستعملو؟', 'Qui d\'autre pourrait l\'utiliser ?', 'Who else could use it?')],
  ['E', _('احذف', 'Éliminer', 'Eliminate'), _('شنو نحيد باش يولي أبسط؟', 'Que retirer pour simplifier ?', 'What to remove to simplify?')],
  ['R', _('اعكس', 'Inverser', 'Reverse'), _('شنو لو عكسنا الترتيب؟', 'Et si on inversait ?', 'What if we reversed it?')],
];
const LAB_TASKS = () => [_('حدد المشكل وشكون كيعاني منو', 'Définir le problème et qui en souffre', 'Define the problem and who suffers from it'), _('لائحة المواد والأدوات المتوفرة', 'Lister matériaux et outils disponibles', 'List available materials and tools'), _('رسم النموذج الأولي فورقة', 'Dessiner le prototype sur papier', 'Sketch the prototype on paper'), _('بناء النسخة 0 بأرخص طريقة', 'Construire la version 0 à bas coût', 'Build version 0 as cheaply as possible'), _('اختبارها مع 3 أشخاص', 'La tester avec 3 personnes', 'Test it with 3 people'), _('تحسين وتوثيق النتائج', 'Améliorer et documenter', 'Improve and document')];

function makeProject(title, tasks) {
  st().projects.unshift({ id: Date.now(), title: title.slice(0, 80), tasks: tasks.map((t, i) => ({ id: i, text: String(t).slice(0, 140), col: 0 })) });
  S.logEvent('project', title); give(10); ui.sub.invent = 'projects'; hooks.render();
}

export function viewInvent() {
  const t = sub();
  return h('div', { class: 'page' }, pageHead('🛠️', tr('create_title'), tr('m_create')),
    tabs([['lab', '💡 ' + _('مختبر الابتكار', 'Labo d\'innovation', 'Invention lab')], ['projects', '🚀 ' + _('مشاريعي', 'Mes projets', 'My projects')]], t, (v) => { ui.sub.invent = v; hooks.render(); }),
    t === 'lab' ? lab() : projects());
}

function lab() {
  const idea = h('input', { placeholder: _('شنو الاختراع أو المشكل اللي بغيتي تحل؟', 'Quelle invention ou quel problème ?', 'What invention or problem?') });
  const notes = SCAMPER.map(([k, name, q]) => h('label', { class: 'fl' }, `${k} · ${name} — ${q}`, h('textarea', { rows: 2 })));
  const out = h('div', { class: 'stack' });
  const noteText = () => SCAMPER.map(([k, name], i) => notes[i].querySelector('textarea').value.trim() && `${name}: ${notes[i].querySelector('textarea').value.trim()}`).filter(Boolean).join('\n');
  const brief = () => {
    const i = idea.value.trim(); if (!i) { msg(_('كتب الفكرة أولا', 'Écris d\'abord l\'idée', 'Write the idea first')); return; }
    const text = `📌 ${i}\n\n${noteText() || '—'}\n\n${LAB_TASKS().map((x, n) => `${n + 1}. ${x}`).join('\n')}`;
    out.replaceChildren(card(h('h3', {}, '📄 ' + _('ملخص النموذج الأولي', 'Fiche prototype', 'Prototype brief')), h('pre', { class: 'code', dir: 'auto' }, text), h('div', { class: 'row wrap' }, btn('🚀 ' + _('حوّلو لمشروع', 'En faire un projet', 'Make it a project'), () => makeProject(i, LAB_TASKS()), 'primary'), btn('⬇ .txt', () => download('qudra-brief.txt', text, 'text/plain'), 'ghost'))));
  };
  const aiBtn = btn('✨ ' + _('اقتراحات الذكاء الاصطناعي', 'Suggestions de l\'IA', 'AI suggestions'), async () => {
    const i = idea.value.trim(); if (!i) { msg(_('كتب الفكرة أولا', 'Écris d\'abord l\'idée', 'Write the idea first')); return; }
    if (!AI.enabled()) { out.replaceChildren(card(h('p', {}, tr('ai_enable_hint')))); return; }
    out.replaceChildren(card(h('p', { class: 'fb' }, tr('ai_thinking'))));
    try {
      const j = await AI.askJSON({ task: 'invent', messages: [{ role: 'user', content: `${i}\n${noteText()}` }], lang: st().lang, profile: { level: st().level } });
      const ideas = (j.ideas || []).slice(0, 3); const tasks = (j.tasks || []).slice(0, 8).map(String); const risks = (j.risks || []).slice(0, 4).map(String);
      out.replaceChildren(card(h('h3', {}, '💡 ' + _('أفكار', 'Idées', 'Ideas')), ideas.map((x) => h('div', { class: 'jitem' }, h('b', {}, String(x.title || '')), h('p', {}, String(x.pitch || '')))),
        h('h3', {}, '🧪 ' + _('النموذج الأولي', 'Prototype', 'Prototype')), h('p', {}, String(j.prototype || '')),
        risks.length ? [h('h3', {}, '⚠️ ' + _('مخاطر', 'Risques', 'Risks')), h('ul', { class: 'pc con' }, risks.map((r) => h('li', {}, r)))] : null,
        tasks.length ? btn('🚀 ' + _('حوّل الخطة لمشروع', 'Transformer le plan en projet', 'Turn the plan into a project'), () => makeProject(i, tasks), 'primary') : null));
    } catch (e) { out.replaceChildren(card(h('p', { class: 'fb bad' }, tr('ai_fail')))); }
  }, 'ghost');
  return h('div', { class: 'stack' }, card(h('h3', {}, '💡 ' + _('الفكرة', 'L\'idée', 'The idea')), idea,
    h('details', {}, h('summary', {}, 'SCAMPER · ' + _('7 أسئلة باش تطور الفكرة', '7 questions pour la développer', '7 prompts to develop it')), h('div', { class: 'stack' }, notes)),
    h('div', { class: 'row wrap' }, btn('📄 ' + _('ملخص النموذج الأولي', 'Fiche prototype', 'Prototype brief'), brief, 'primary'), aiBtn)), out,
    note(_('ما تصاوبش شي حاجة خطيرة: الكهرباء العالية، المواد الكيميائية والأسلحة خارج النطاق.', 'Pas de projets dangereux : haute tension, produits chimiques et armes sont exclus.', 'No dangerous builds: high voltage, hazardous chemicals and weapons are out of scope.')));
}

function projects() {
  const s = st(); const prev = isRtl() ? '→' : '←', nextG = isRtl() ? '←' : '→';
  if (!s.projects.length) return h('p', { class: 'muted center' }, tr('no_projects'));
  return h('div', { class: 'stack' }, s.projects.map((p) => {
    const done = p.tasks.filter((x) => x.col === 2).length; const add = h('input', { placeholder: tr('new_task_ph') });
    const addT = () => { if (add.value.trim()) { p.tasks.push({ id: Date.now(), text: add.value.trim(), col: 0 }); S.save(); hooks.render(); } };
    add.addEventListener('keydown', (e) => { if (e.key === 'Enter') addT(); });
    const move = (task, d) => { task.col = Math.max(0, Math.min(2, task.col + d)); S.save(); if (task.col === 2 && d > 0) { give(5); if (p.tasks.every((x) => x.col === 2)) S.logEvent('project-done', p.title); } hooks.render(); };
    const cols = [tr('col_todo'), tr('col_doing'), tr('col_done')].map((name, ci) => h('div', { class: 'kcol c' + ci }, h('h4', {}, name, h('span', {}, p.tasks.filter((x) => x.col === ci).length)),
      p.tasks.filter((x) => x.col === ci).map((task) => h('div', { class: 'task' }, h('span', {}, task.text), h('div', { class: 'tb' }, ci > 0 && h('button', { onclick: () => move(task, -1), 'aria-label': 'prev' }, prev), ci < 2 && h('button', { onclick: () => move(task, 1), 'aria-label': 'next' }, nextG))))));
    return card(h('div', { class: 'row between' }, h('h3', {}, '🚀 ' + p.title), h('button', { class: 'mini danger', onclick: () => { s.projects = s.projects.filter((x) => x.id !== p.id); S.save(); hooks.render(); } }, tr('delete'))),
      h('small', {}, `${tr('progress')}: ${done}/${p.tasks.length}`), bar2(p.tasks.length ? done / p.tasks.length : 0), h('div', { class: 'kanban' }, cols), h('div', { class: 'row' }, add, btn('＋', addT, 'mini')));
  }));
}
const bar2 = (p) => h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(p * 100)}%;background:#f72585` }));

export function quickProject() { // من الواجهة القديمة: فكرة -> مشروع بـ 6 خطوات
  return null;
}
export { PROJECT_STEPS };
