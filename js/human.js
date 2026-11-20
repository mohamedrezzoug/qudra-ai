// QUDRA HUMAN – المساعد الشخصي (نص + صوت + ذاكرة بموافقة المستخدم)
import * as AI from './ai.js';
import * as S from './store.js';
import { ui, hooks, h, $, st, tr, lc, _, card, btn, pageHead, give, listen, speak, dayIndex, msg } from './core.js';
import { TIPS } from './content.js';

export function intent(text) {
  const x = text.toLowerCase(); const T = (re) => re.test(x);
  if (T(/^\s*(تذكر|تذكّر|remember|retiens|souviens)/)) return 'remember';
  if (T(/progr[eè]s|progress|تقدم|حالتي|\bxp\b|niveau|level|مستوى/)) return 'stats';
  if (T(/tired|fatigu|ملل|تعبان|motiv|ما قدرتش|bored|difficile|\bhard\b|صعيب|صعب|stress|ضغط/)) return 'motiv';
  if (T(/translat|ترجم|ترجمة|traduire|traduis|traduction/)) return 'translate';
  if (T(/\bcv\b|career|carri[eè]re|مهن|وظيف|مقابلة|entretien|interview|\bjob\b|emploi|travail/)) return 'career';
  if (T(/photo|image|camera|caméra|صورة|كاميرا|scan|وثيقة|document/)) return 'vision';
  if (T(/invent|اختراع|ابتكار|prototype|نموذج/)) return 'invent';
  if (T(/decid|décid|قرار|choose|choisir|اختار|hesit|تردد|should i/)) return 'think';
  if (T(/idea|idée|فكرة|projet|project|مشروع|startup|business/)) return 'idea';
  if (T(/word|\bmot\b|mots|vocab|كلمات|langue|language|english|anglais|français|francais|فرنسي|إنجليزي|انجليزي|speak/)) return 'lang';
  if (T(/learn|apprend|appren|تعلم|نتعلم|étudi|study|بغيت|want|skill|compétence|مهارة|وقت|time|argent|money|code|برمج|prog|\bia\b|\bai\b|cuisine|طبخ|design|تصميم|science|علوم/)) return 'learn';
  return 'fallback';
}
const matchSkill = (text) => { const x = text.toLowerCase(); return S.allSkills().find((k) => (k.kw || []).some((w) => x.includes(w.toLowerCase()))); };

export function appContext() {
  const s = st(); const nx = S.nextLesson(); const open = s.projects.reduce((a, p) => a + p.tasks.filter((t) => t.col < 2).length, 0);
  return `Next lesson: ${nx ? lc(nx.l.t) : 'none'}. Open project tasks: ${open}. Streak: ${s.streak} days. Level ${S.levelOf(s.xp)}.`;
}

function reply(text) {
  const s = st(); const it = intent(text); const bot = { who: 'bot', text: '', actions: [], local: true };
  const open = (label, tab) => bot.actions.push({ label, fn: () => hooks.go(tab) });
  if (it === 'remember') {
    const fact = text.replace(/^\s*(تذكر|تذكّر|remember|retiens|souviens-toi|souviens)\b[:\s,]*/i, '').trim().slice(0, 200);
    if (!s.memOn) bot.text = _('الذاكرة مطفية. فعّلها من لوحة الذاكرة تحت.', 'La mémoire est désactivée. Active-la dans le panneau ci-dessous.', 'Memory is off. Turn it on in the panel below.');
    else if (fact.length < 3) bot.text = _('شنو بغيتي نتذكر؟', 'Que dois-je retenir ?', 'What should I remember?');
    else { s.memories.unshift(fact); s.memories = s.memories.slice(0, 20); S.save(); bot.text = _('حفظتها: ', 'Retenu : ', 'Remembered: ') + fact; }
  } else if (it === 'stats') { bot.text = `${tr('coach_stats')} ${tr('level')} ${S.levelOf(s.xp)} · ${s.xp} ${tr('xp')} · 🔥 ${s.streak} ${tr('streak')} · ✅ ${S.doneCount()} ${tr('lessons_done')}`; open(tr('nav_grow'), 'grow'); }
  else if (it === 'motiv') { bot.text = `${tr('coach_motiv')} ${lc(TIPS[(dayIndex() + text.length) % TIPS.length])}`; open(tr('nav_think'), 'think'); }
  else if (it === 'translate') { bot.text = _('المترجم ديالي كيتوفر فوحدة UNIVERSAL (الدارجة، العربية، الأمازيغية واللغات العالمية).', 'Le traducteur est dans UNIVERSAL (darija, arabe, amazigh et langues du monde).', 'The translator lives in UNIVERSAL (Darija, Arabic, Amazigh and world languages).'); open(tr('nav_language'), 'language'); }
  else if (it === 'career') { bot.text = _('فـ CAREER غادي تلقى اكتشاف المهارات، السيرة الذاتية والتدرب على المقابلات.', 'Dans CAREER : découverte des talents, CV et entraînement aux entretiens.', 'In CAREER: skill discovery, CV builder and interview practice.'); open(tr('nav_career'), 'career'); }
  else if (it === 'vision') { bot.text = _('صور الوثيقة أو الشيء فـ VISION وأنا نشرحو ليك.', 'Photographie un document ou un objet dans VISION et je te l\'explique.', 'Snap a document or object in VISION and I will explain it.'); open(tr('nav_vision'), 'vision'); }
  else if (it === 'invent') { bot.text = _('فمختبر INVENT كنحولو الفكرة لنموذج أولي بخطوات واضحة.', 'Dans INVENT on transforme l\'idée en prototype étape par étape.', 'In INVENT we turn the idea into a prototype step by step.'); open(tr('nav_create'), 'create'); }
  else if (it === 'think') { bot.text = tr('coach_think'); open(tr('nav_think'), 'think'); }
  else if (it === 'idea') { bot.text = tr('coach_idea'); open(tr('nav_create'), 'create'); }
  else if (it === 'lang') { bot.text = tr('coach_lang'); open(tr('nav_language'), 'language'); }
  else if (it === 'learn') {
    const k = matchSkill(text) || S.allSkills().find((x) => !s.path.includes(x.id)) || S.allSkills()[0];
    bot.text = `${tr('coach_learn')} ${k.icon} ${lc(k.name)}`; bot.actions.push({ label: '＋ ' + tr('add_path') + ' → ' + tr('nav_learn'), fn: () => { if (!s.path.includes(k.id)) s.path.push(k.id); S.save(); hooks.go('learn'); } });
  } else { bot.text = tr('coach_fallback'); ['sug_learn', 'sug_think', 'sug_idea', 'sug_progress'].forEach((k) => bot.actions.push({ label: tr(k), fn: () => ask(tr(k)) })); }
  return bot;
}
export const coachReply = reply;

export async function ask(text, context = '') {
  ui.chat.push({ who: 'me', text }); ui.tab = 'coach';
  const scrollEnd = () => { const v = $('#view'); v.scrollTo({ top: v.scrollHeight }); };
  const say = (t) => { if (st().voice) speak(t); };
  if (intent(text) === 'remember' || !AI.enabled()) {
    const b = reply(text);
    if (!AI.configured() && ui.chat.filter((m) => m.who === 'bot').length < 4 && b.local) b.text += '\n\n' + tr('ai_enable_hint');
    ui.chat.push(b); say(b.text); hooks.render(); scrollEnd(); return;
  }
  const pending = { who: 'bot', text: tr('ai_thinking'), pending: true }; ui.chat.push(pending); hooks.render(); scrollEnd();
  const s = st(); const history = ui.chat.filter((m) => !m.pending && !m.local).map((m) => ({ role: m.who === 'me' ? 'user' : 'assistant', content: m.text }));
  try {
    const out = await AI.askAI({ task: 'chat', messages: history, lang: s.lang, profile: { name: s.name, level: s.level, goal: s.goal, memories: s.memOn ? s.memories : [] }, context: context || appContext() });
    pending.text = out; pending.pending = false; say(out);
  } catch (e) {
    const fb = reply(text); pending.text = fb.text + '\n' + tr('ai_fallback'); pending.actions = fb.actions; pending.pending = false; pending.local = true;
  }
  if (ui.tab === 'coach') { hooks.render(); scrollEnd(); }
}

export function viewHuman() {
  if (!ui.chat.length) ui.chat.push({ who: 'bot', local: true, text: tr('coach_hello'), actions: ['sug_learn', 'sug_think', 'sug_idea', 'sug_progress'].map((k) => ({ label: tr(k), fn: () => ask(tr(k)) })) });
  const inp = h('input', { placeholder: tr('coach_ph'), enterkeyhint: 'send' });
  const send = () => { const v = inp.value.trim(); if (v) ask(v); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  const micBtn = h('button', { class: 'mini', 'aria-label': 'mic', onclick: () => {
    const r = listen(null, (t) => { inp.value = t; send(); }, (on) => micBtn.classList.toggle('rec', on));
    if (!r) msg(_('الميكروفون غير مدعوم فهاد المتصفح (جرب Chrome)', 'Micro non supporté par ce navigateur (essaie Chrome)', 'Mic not supported in this browser (try Chrome)'));
  } }, '🎙️');
  const msgs = ui.chat.map((m) => h('div', { class: 'msg ' + m.who + (m.pending ? ' pending' : '') }, m.text, m.actions && m.actions.length ? h('div', { class: 'acts' }, m.actions.map((a) => h('button', { class: 'chip', onclick: a.fn }, a.label))) : null));
  const s = st(); const mi = h('input', { placeholder: _('زيد شي حاجة باش نتذكرها…', 'Ajoute quelque chose à retenir…', 'Add something to remember…') });
  const addMem = () => { const v = mi.value.trim().slice(0, 200); if (v) { s.memories.unshift(v); S.save(); hooks.render(); } };
  mi.addEventListener('keydown', (e) => { if (e.key === 'Enter') addMem(); });
  const memCard = h('details', { class: 'card mem' }, h('summary', {}, '🧠 ' + _('ذاكرة المساعد', 'Mémoire de l\'assistant', 'Assistant memory') + ` (${s.memories.length})`),
    h('p', { class: 'muted small' }, _('كتبقى فهاد الجهاز فقط، وكتتبعث للذكاء الاصطناعي غير إلا كان الاتصال مفعل. تقدر تمسحها فأي وقت.', 'Reste sur cet appareil et n\'est envoyée à l\'IA que si elle est connectée. Supprimable à tout moment.', 'Stays on this device and is sent to the AI only when it is connected. Delete any time.')),
    h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: s.memOn, onchange: (e) => { s.memOn = e.target.checked; S.save(); } }), _('السماح للمساعد بالتذكر', 'Autoriser la mémoire', 'Allow memory')),
    h('div', { class: 'row' }, mi, btn('＋', addMem, 'mini')),
    s.memories.map((m, i) => h('div', { class: 'jitem row between' }, h('span', {}, m), h('button', { class: 'mini danger', onclick: () => { s.memories.splice(i, 1); S.save(); hooks.render(); } }, '✕'))));
  setTimeout(() => inp.focus({ preventScroll: true }), 0);
  const speakTog = h('label', { class: 'chk small' }, h('input', { type: 'checkbox', checked: s.voice, onchange: (e) => { s.voice = e.target.checked; S.save(); if (!s.voice) speechSynthesis.cancel(); } }), '🔊 ' + _('قراءة الأجوبة بصوت', 'Lire les réponses à voix haute', 'Read answers aloud'));
  return h('div', { class: 'page chat' }, pageHead('🤖', 'QUDRA HUMAN', AI.enabled() ? tr('ai_status_on') : tr('coach_note')), speakTog, h('div', { class: 'msgs' }, msgs), memCard,
    h('div', { class: 'composer' }, micBtn, inp, btn(tr('send'), send, 'primary')));
}
