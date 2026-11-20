// QUDRA UNIVERSAL – ترجمة، عبارات جاهزة، وتعلم اللغات
import * as S from './store.js';
import * as AI from './ai.js';
import { DECKS } from './content.js';
import { ui, hooks, h, st, tr, lc, _, card, btn, bar, pageHead, tabs, give, giveOnce, toast, msg, speak, listen, SPEECH, note } from './core.js';

const sub = () => (ui.sub.uni = ui.sub.uni || 'tr');
const TARGETS = [
  { id: 'ary', en: 'Moroccan Darija (Arabic script)', name: () => _('الدارجة المغربية', 'Darija marocaine', 'Moroccan Darija'), tts: 'ar-SA' },
  { id: 'ar', en: 'Modern Standard Arabic', name: () => _('العربية الفصحى', 'Arabe standard', 'Modern Arabic'), tts: 'ar-SA' },
  { id: 'zgh', en: 'Amazigh / Tamazight (Tifinagh script)', name: () => _('الأمازيغية (تيفيناغ)', 'Amazigh (tifinagh)', 'Amazigh (Tifinagh)'), tts: null },
  { id: 'fr', en: 'French', name: () => 'Français', tts: 'fr-FR' },
  { id: 'en', en: 'English', name: () => 'English', tts: 'en-US' },
  { id: 'es', en: 'Spanish', name: () => 'Español', tts: 'es-ES' },
  { id: 'de', en: 'German', name: () => 'Deutsch', tts: 'de-DE' },
];
const PHRASES = [
  ['مرحبا', 'السلام', 'Bonjour', 'Hello'], ['شكرا', 'شكرا بزاف', 'Merci', 'Thank you'], ['من فضلك', 'عافاك', "S'il vous plaît", 'Please'],
  ['بكم هذا؟', 'شحال هادا؟', 'Combien ça coûte ?', 'How much is this?'], ['أين ...؟', 'فين كاين ...؟', 'Où est… ?', 'Where is…?'], ['لا أفهم', 'ما فهمتش', 'Je ne comprends pas', "I don't understand"],
  ['هل يمكنك مساعدتي؟', 'واش تقدر تعاوني؟', "Pouvez-vous m'aider ?", 'Can you help me?'], ['أريد ماء', 'بغيت الما', "Je voudrais de l'eau", 'I would like water'],
  ['أين الحمام؟', 'فين كاين بيت الما؟', 'Où sont les toilettes ?', 'Where is the bathroom?'], ['مساء الخير', 'مسا الخير', 'Bonsoir', 'Good evening'], ['مع السلامة', 'بسلامة', 'Au revoir', 'Goodbye'],
  ['اسمي ...', 'سميتي ...', "Je m'appelle…", 'My name is…'], ['لقد ضللت الطريق', 'تهت', 'Je suis perdu(e)', 'I am lost'], ['أحتاج إلى طبيب', 'خاصني طبيب', "J'ai besoin d'un médecin", 'I need a doctor'], ['آسف', 'سمح ليا', 'Désolé', 'Sorry'],
];

export function viewUniversal() {
  if (ui.session) return viewSession();
  const t = sub();
  const body = t === 'tr' ? translator() : t === 'ph' ? phrasebook() : words();
  return h('div', { class: 'page' }, pageHead('🌍', tr('language_title'), tr('m_language')),
    tabs([['tr', '🔁 ' + _('مترجم', 'Traducteur', 'Translator')], ['ph', '📒 ' + _('عبارات جاهزة', 'Phrases', 'Phrasebook')], ['words', '🔤 ' + _('تعلم الكلمات', 'Mots', 'Words')]], t, (v) => { ui.sub.uni = v; hooks.render(); }), body);
}

function translator() {
  const src = h('textarea', { rows: 4, placeholder: _('كتب أو هضر…', 'Écris ou parle…', 'Type or speak…') });
  const tgt = h('select', {}, TARGETS.map((x) => h('option', { value: x.id, selected: x.id === (ui.sub.target || 'en') }, x.name())));
  const out = h('div', { class: 'stack' }); let busy = false;
  const run = async (auto) => {
    const text = src.value.trim(); if (!text || busy) return; ui.sub.target = tgt.value; const T = TARGETS.find((x) => x.id === tgt.value);
    if (!AI.enabled()) { out.replaceChildren(card(h('p', {}, _('الترجمة الحرة كتحتاج الذكاء الاصطناعي والإنترنت. شوف العبارات الجاهزة (خدامة بلا إنترنت) أو فعّل الاتصال.', 'La traduction libre nécessite l\'IA et Internet. Utilise les phrases (hors ligne) ou active la connexion.', 'Free translation needs AI and internet. Use the phrasebook (works offline) or enable the connection.')), btn('📒', () => { ui.sub.uni = 'ph'; hooks.render(); }, 'ghost'))); return; }
    busy = true; out.replaceChildren(card(h('p', { class: 'fb' }, tr('ai_thinking'))));
    try {
      const res = (await AI.askAI({ task: 'translate', messages: [{ role: 'user', content: text.slice(0, 1500) }], lang: st().lang, params: { target: T.en } })).trim();
      out.replaceChildren(card(h('p', { class: 'body', dir: 'auto' }, res), h('div', { class: 'row wrap' }, T.tts && btn('🔊', () => speak(res, T.tts), 'ghost'), btn('📋', () => { try { navigator.clipboard.writeText(res); msg('✓'); } catch (e) { /* ignore */ } }, 'ghost'))));
      giveOnce('translate', 2); if (auto && T.tts) speak(res, T.tts);
    } catch (e) { out.replaceChildren(card(h('p', { class: 'fb bad' }, tr('ai_fail')))); } finally { busy = false; }
  };
  const mic = h('button', { class: 'mini', onclick: () => { const r = listen(SPEECH[st().lang], (tx) => { src.value = tx; run(true); }, (on) => mic.classList.toggle('rec', on)); if (!r) msg(_('الميكروفون غير مدعوم (جرب Chrome)', 'Micro non supporté (essaie Chrome)', 'Mic not supported (try Chrome)')); } }, '🎙️');
  return h('div', { class: 'stack' }, card(src, h('div', { class: 'row' }, mic, tgt, btn(_('ترجم', 'Traduire', 'Translate'), () => run(false), 'primary'))), out,
    note(_('الدارجة والأمازيغية كيتعاملو بنفس النموذج وممكن تكون الجودة أقل من اللغات الكبرى، راجع الترجمة المهمة.', 'Darija et amazigh sont gérés par le même modèle ; la qualité peut être moindre que pour les grandes langues : relis les traductions importantes.', 'Darija and Amazigh use the same model and quality may be lower than for major languages; double-check important translations.')));
}

function phrasebook() {
  const q = h('input', { placeholder: '🔎', oninput: () => draw() }); const list = h('div', { class: 'stack' });
  const order = st().lang === 'ar' ? [1, 0, 2, 3] : st().lang === 'fr' ? [2, 3, 1, 0] : [3, 2, 1, 0]; const names = ['العربية', 'الدارجة', 'Français', 'English'];
  function draw() {
    const f = q.value.trim().toLowerCase();
    list.replaceChildren(...PHRASES.filter((p) => !f || p.join(' ').toLowerCase().includes(f)).map((p) => card(order.map((i, n) => h('div', { class: 'prow row between' }, h('span', { class: n === 0 ? 'q' : 'muted', dir: 'auto' }, p[i]), (i === 2 || i === 3) && h('button', { class: 'mini', 'aria-label': names[i], onclick: () => speak(p[i], i === 2 ? 'fr-FR' : 'en-US') }, '🔊'))))));
  }
  draw(); return h('div', { class: 'stack' }, q, note(_('خدامة بلا إنترنت ✅', 'Fonctionne hors ligne ✅', 'Works offline ✅')), list);
}

function words() {
  const s = st();
  const decks = DECKS.map((d) => { const due = S.dueWords(d.id).length; const learned = d.words.filter((_w, i) => (s.words[S.wordKey(d.id, i)] || {}).box >= 3).length;
    return card(h('div', { class: 'skill' }, h('div', { class: 'big' }, d.icon), h('div', { class: 'grow1' }, h('h3', {}, lc(d.name)), h('small', {}, `${learned}/${d.words.length} ${tr('learned_words')} · ${due} ${tr('due_today')}`), bar(learned / d.words.length, '#06d6a0'))),
      due ? btn(tr('start_review') + ` (${due})`, () => { ui.session = { deck: d, queue: S.dueWords(d.id), flipped: false, total: due }; hooks.render(); }, 'primary') : h('p', { class: 'muted' }, tr('no_due'))); });
  const checks = [tr('chk1'), tr('chk2'), tr('chk3')].map((x) => h('label', { class: 'chk' }, h('input', { type: 'checkbox' }), x)); const wr = h('textarea', { rows: 4, placeholder: tr('write_prompt') });
  return h('div', { class: 'stack' }, decks, card(h('h3', {}, '✍️ ' + tr('writing')), h('p', { class: 'muted' }, tr('write_prompt')), wr, h('div', { class: 'lbl' }, tr('write_checks')), checks, btn(tr('save_xp'), () => { if (wr.value.trim().length > 10 && checks.every((c) => c.firstChild.checked)) giveOnce('write', 8); }, 'ghost')));
}
function viewSession() {
  const ss = ui.session; const cur = ss.queue[0];
  if (!cur) return h('div', { class: 'page' }, card(h('h3', {}, tr('no_due')), btn(tr('back'), () => { ui.session = null; hooks.render(); }, 'primary')));
  const w = cur.w; const l = st().lang; const first = l === 'ar' ? [w[1], w[2]] : [w[2], w[1]];
  const grade = (ok) => { toast(S.gradeWord(ss.deck.id, cur.i, ok)); hooks.chrome(); ss.queue.shift(); if (!ok) ss.queue.push(cur); ss.flipped = false; hooks.render(); };
  return h('div', { class: 'page' }, h('button', { class: 'back', onclick: () => { ui.session = null; hooks.render(); } }, '← ' + tr('back')),
    h('small', { class: 'muted' }, `${ss.total - ss.queue.length + (ss.queue.length ? 1 : 0)}/${ss.total}`),
    h('button', { class: 'flash' + (ss.flipped ? ' flip' : ''), onclick: () => { ss.flipped = !ss.flipped; hooks.render(); } },
      ss.flipped ? h('div', {}, h('div', { class: 'fw' }, first[0]), h('div', { class: 'fs' }, first[1])) : h('div', {}, h('div', { class: 'fw', dir: 'ltr' }, w[0]), h('div', { class: 'fs' }, tr('tap_flip')))),
    h('div', { class: 'row center' }, btn('🔊 ' + tr('speak'), () => speak(w[0], ss.deck.speak), 'ghost')),
    ss.flipped && h('div', { class: 'row' }, btn(tr('dont_know'), () => grade(false), 'ghost danger'), btn(tr('know'), () => grade(true), 'primary')));
}
