// QUDRA CAREER – اكتشاف المهارات، السيرة الذاتية، المقابلات
import * as S from './store.js';
import * as AI from './ai.js';
import { ui, hooks, h, st, tr, lc, _, card, btn, pageHead, tabs, give, giveOnce, msg, note, bar } from './core.js';

const sub = () => (ui.sub.career = ui.sub.career || 'discover');
const TYPES = {
  R: { icon: '🔧', name: () => _('عملي / تقني', 'Pratique / technique', 'Hands-on / technical'), jobs: () => [_('تقني كهرباء', 'Technicien électricien', 'Electrical technician'), _('ميكانيكي', 'Mécanicien', 'Mechanic'), _('مهندس فلاحي', 'Ingénieur agricole', 'Agricultural engineer'), _('طباخ محترف', 'Chef cuisinier', 'Chef')], skills: ['eng2', 'cook'] },
  I: { icon: '🔬', name: () => _('باحث / تحليلي', 'Chercheur / analytique', 'Investigative / analytical'), jobs: () => [_('مطور برمجيات', 'Développeur', 'Software developer'), _('محلل بيانات', 'Analyste de données', 'Data analyst'), _('باحث علمي', 'Chercheur', 'Researcher'), _('طبيب/صيدلي', 'Médecin / pharmacien', 'Doctor / pharmacist')], skills: ['code', 'science', 'crit'] },
  A: { icon: '🎨', name: () => _('مبدع / فني', 'Créatif / artistique', 'Creative / artistic'), jobs: () => [_('مصمم جرافيك', 'Graphiste', 'Graphic designer'), _('كاتب/صانع محتوى', 'Rédacteur / créateur de contenu', 'Writer / content creator'), _('مهندس معماري', 'Architecte', 'Architect'), _('مصور/مونتاج', 'Photographe / monteur', 'Photographer / editor')], skills: ['design', 'talk'] },
  S: { icon: '🤝', name: () => _('اجتماعي / مساعد', 'Social / aidant', 'Social / helping'), jobs: () => [_('أستاذ/مكوّن', 'Enseignant / formateur', 'Teacher / trainer'), _('ممرض/مساعد اجتماعي', 'Infirmier / assistant social', 'Nurse / social worker'), _('موارد بشرية', 'Ressources humaines', 'HR officer'), _('مرشد/مستشار', 'Conseiller', 'Counsellor')], skills: ['talk', 'study'] },
  E: { icon: '🚀', name: () => _('مقاول / قيادي', 'Entrepreneur / leader', 'Enterprising / leader'), jobs: () => [_('صاحب مشروع', 'Créateur d\'entreprise', 'Entrepreneur'), _('مسؤول مبيعات', 'Responsable commercial', 'Sales manager'), _('مدير مشاريع', 'Chef de projet', 'Project manager'), _('مسوّق رقمي', 'Marketeur digital', 'Digital marketer')], skills: ['biz', 'money', 'talk'] },
  C: { icon: '📊', name: () => _('منظم / إداري', 'Organisé / administratif', 'Organised / administrative'), jobs: () => [_('محاسب', 'Comptable', 'Accountant'), _('إداري', 'Gestionnaire administratif', 'Administrator'), _('مسؤول لوجستيك', 'Responsable logistique', 'Logistics officer'), _('مسؤول صفقات/مشتريات', 'Chargé des marchés / achats', 'Procurement officer')], skills: ['time', 'money', 'safe'] },
};
const Q = [
  ['R', _('كنحب نصلح أو نبني حوايج بيدي.', "J'aime réparer ou construire avec mes mains.", 'I enjoy fixing or building things with my hands.')],
  ['I', _('كنحب نحل الألغاز وأفهم كيفاش كتخدم الأشياء.', "J'aime résoudre des énigmes et comprendre comment ça marche.", 'I like solving puzzles and understanding how things work.')],
  ['A', _('كنحب نبدع: رسم، كتابة، موسيقى، تصميم.', "J'aime créer : dessin, écriture, musique, design.", 'I love creating: drawing, writing, music, design.')],
  ['S', _('كنحب نعاون ونعلم الناس.', "J'aime aider et enseigner.", 'I enjoy helping and teaching people.')],
  ['E', _('كنحب نقود مشاريع ونقنع الناس.', "J'aime diriger des projets et convaincre.", 'I like leading projects and persuading people.')],
  ['C', _('كنحب ننظم ونخطط ونحافظ على الترتيب.', "J'aime organiser, planifier et ranger.", 'I like organising, planning and keeping order.')],
  ['R', _('كنفضل الخدمة برا أو بالآلات والأدوات.', "Je préfère travailler dehors ou avec des outils.", 'I prefer working outdoors or with tools and machines.')],
  ['I', _('كنحب البحث وتحليل المعطيات.', "J'aime la recherche et l'analyse de données.", 'I enjoy research and analysing data.')],
  ['A', _('كنحب الأفكار الأصلية الغير مألوفة.', "J'aime les idées originales et peu conventionnelles.", 'I like original, unconventional ideas.')],
  ['S', _('كنعرف نسمع ونفهم الآخرين.', "Je sais écouter et comprendre les autres.", 'I am good at listening and understanding others.')],
  ['E', _('كنحب نبدا مشاريع ونأخذ المبادرة.', "J'aime lancer des projets et prendre l'initiative.", 'I enjoy starting projects and taking initiative.')],
  ['C', _('كنهتم بالتفاصيل والأرقام والمساطر.', "Je suis attentif aux détails, chiffres et procédures.", 'I am careful with details, numbers and procedures.')],
];

export function viewCareer() {
  const t = sub();
  const body = t === 'discover' ? discover() : t === 'cv' ? cv() : interview();
  return h('div', { class: 'page' }, pageHead('💼', 'QUDRA CAREER', _('اكتشف مهاراتك، بني سيرتك وتدرب على المقابلة', 'Découvre tes talents, crée ton CV et prépare tes entretiens', 'Discover your strengths, build your CV and practise interviews')),
    tabs([['discover', '🧭 ' + _('اكتشاف', 'Découvrir', 'Discover')], ['cv', '📄 CV'], ['interview', '🎤 ' + _('مقابلة', 'Entretien', 'Interview')]], t, (v) => { ui.sub.career = v; hooks.render(); }), body);
}

function discover() {
  const s = st(); const ans = Q.map(() => 3);
  if (s.career && s.career.top && !ui.sub.retake) return results(s.career.top);
  const rows = Q.map(([, text], i) => h('div', { class: 'qrow' }, h('p', { class: 'q' }, `${i + 1}. ${text}`), h('div', { class: 'likert' }, [1, 2, 3, 4, 5].map((n) => h('button', { class: 'lk' + (n === 3 ? ' on' : ''), onclick: (e) => { ans[i] = n; [...e.currentTarget.parentElement.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); } }, n)))));
  return h('div', { class: 'stack' }, card(h('p', { class: 'muted' }, _('1 = ما كيعجبنيش، 5 = كيعجبني بزاف', '1 = pas du tout, 5 = tout à fait', '1 = not at all, 5 = very much')), rows,
    btn(_('شوف النتيجة', 'Voir le résultat', 'See my result'), () => {
      const sc = {}; Q.forEach(([k], i) => { sc[k] = (sc[k] || 0) + ans[i]; });
      const top = Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
      s.career = { top, scores: sc, d: S.today() }; ui.sub.retake = false; S.logEvent('career', top.join('+')); give(10); hooks.render();
    }, 'primary')));
}
function results(top) {
  const s = st();
  return h('div', { class: 'stack' }, top.map((k) => { const T = TYPES[k]; const all = S.allSkills();
    return card(h('h3', {}, `${T.icon} ${T.name()}`), h('div', { class: 'lbl' }, _('مهن مقترحة', 'Métiers possibles', 'Possible careers')), h('div', { class: 'row wrap' }, T.jobs().map((j) => h('span', { class: 'chip' }, j))),
      h('div', { class: 'lbl' }, _('مهارات تبدا بيها', 'Compétences pour commencer', 'Skills to start with')),
      h('div', { class: 'row wrap' }, T.skills.map((id) => all.find((x) => x.id === id)).filter(Boolean).map((sk) => h('button', { class: 'chip', onclick: () => { if (!s.path.includes(sk.id)) s.path.push(sk.id); S.save(); hooks.go('learn'); } }, `${sk.icon} ${lc(sk.name)} ＋`)))); }),
    note(_('هادشي توجيه أولي مبني على اهتماماتك، ماشي حكم نهائي ولا اختبار نفسي. استشر مرشد مختص للقرارات الكبرى.', 'Orientation indicative basée sur tes intérêts, pas un test psychologique. Consulte un conseiller pour les grandes décisions.', 'This is indicative guidance from your interests, not a psychological test. See a counsellor for big decisions.')),
    btn('↻ ' + _('عاود الاختبار', 'Refaire le test', 'Retake'), () => { ui.sub.retake = true; hooks.render(); }, 'ghost'));
}

// ---- CV
export function cvHTML(c, rtl) {
  const esc = (x) => String(x || '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const li = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('');
  const sec = (title, body) => (body ? `<h2>${title}</h2>${body}` : '');
  return `<!doctype html><html lang="${st().lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(c.name)} – CV</title><style>
  body{font-family:system-ui,"Segoe UI",Tahoma,Arial,sans-serif;color:#111;margin:32px;line-height:1.5}h1{margin:0;font-size:28px}.t{color:#4a4a8a;font-size:16px;margin:2px 0}
  .ct{color:#555;font-size:13px;margin-bottom:12px}h2{font-size:14px;letter-spacing:.06em;text-transform:uppercase;border-bottom:2px solid #7b5cf0;padding-bottom:2px;margin:18px 0 6px}ul{margin:4px 0;padding-inline-start:20px}p{margin:4px 0}
  </style></head><body><h1>${esc(c.name)}</h1><div class="t">${esc(c.title)}</div><div class="ct">${[c.email, c.phone, c.city].filter(Boolean).map(esc).join(' · ')}</div>
  ${sec(_('ملخص', 'Profil', 'Summary'), c.summary ? `<p>${esc(c.summary)}</p>` : '')}${sec(_('التجارب', 'Expérience', 'Experience'), c.exp ? `<ul>${li(c.exp)}</ul>` : '')}
  ${sec(_('التكوين', 'Formation', 'Education'), c.edu ? `<ul>${li(c.edu)}</ul>` : '')}${sec(_('المهارات', 'Compétences', 'Skills'), c.skills ? `<p>${esc(c.skills)}</p>` : '')}</body></html>`;
}
function cv() {
  const s = st(); const c = (s.cv = s.cv || {});
  const f = (key, label, rows) => h('label', { class: 'fl' }, label, rows ? h('textarea', { rows, oninput: (e) => { c[key] = e.target.value; S.save(); }, value: c[key] || '' }) : h('input', { value: c[key] || '', oninput: (e) => { c[key] = e.target.value; S.save(); } }));
  const msgEl = h('p', { class: 'fb' });
  const printIt = () => { const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0'; document.body.append(fr); fr.srcdoc = cvHTML(c, st().lang === 'ar'); fr.onload = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { /* ignore */ } setTimeout(() => fr.remove(), 4000); }; };
  const improve = async () => {
    if (!c.summary || c.summary.length < 10) { msgEl.textContent = _('كتب ملخص أولا', 'Écris d\'abord un résumé', 'Write a summary first'); return; }
    if (!AI.enabled()) { msgEl.textContent = tr('ai_enable_hint'); return; }
    msgEl.className = 'fb'; msgEl.textContent = tr('ai_thinking');
    try { const out = await AI.askAI({ task: 'chat', messages: [{ role: 'user', content: `Rewrite this CV summary in 2-3 professional sentences, same language, first person omitted, no invented facts. Reply with ONLY the rewritten summary:\n${c.summary}` }], lang: s.lang, profile: {} }); c.summary = out.trim().slice(0, 600); S.save(); hooks.render(); }
    catch (e) { msgEl.className = 'fb bad'; msgEl.textContent = tr('ai_fail'); }
  };
  return h('div', { class: 'stack' }, card(f('name', _('الاسم الكامل', 'Nom complet', 'Full name')), f('title', _('المسمى المهني', 'Titre', 'Job title')), f('email', 'Email'), f('phone', _('الهاتف', 'Téléphone', 'Phone')), f('city', _('المدينة', 'Ville', 'City')),
    f('summary', _('ملخص قصير', 'Résumé', 'Short summary'), 3), f('exp', _('التجارب (سطر لكل تجربة)', 'Expériences (une par ligne)', 'Experience (one per line)'), 4), f('edu', _('التكوين (سطر لكل شهادة)', 'Formation (une par ligne)', 'Education (one per line)'), 3), f('skills', _('المهارات (مفصولة بفاصلة)', 'Compétences (séparées par des virgules)', 'Skills (comma-separated)')),
    h('div', { class: 'row wrap' }, btn('🖨 ' + _('طباعة / PDF', 'Imprimer / PDF', 'Print / PDF'), printIt, 'primary'), btn('✨ ' + _('حسّن الملخص', 'Améliorer le résumé', 'Improve summary'), improve, 'ghost')), msgEl),
    note(_('معلوماتك كتبقى فهاد الجهاز. الطباعة كتفتح نافذة الطباعة باش تحفظ PDF.', 'Tes infos restent sur cet appareil. L\'impression permet d\'enregistrer en PDF.', 'Your info stays on this device. Printing lets you save as PDF.')));
}

// ---- Interview
const IQ = [
  _('عرّف بنفسك فدقيقة.', 'Présente-toi en une minute.', 'Tell me about yourself in one minute.'),
  _('علاش بغيتي هاد الوظيفة؟', 'Pourquoi ce poste ?', 'Why do you want this job?'),
  _('شنو هي نقط قوتك؟', 'Quelles sont tes forces ?', 'What are your strengths?'),
  _('شنو هي نقطة ضعف كتخدم عليها؟', 'Une faiblesse sur laquelle tu travailles ?', 'A weakness you are working on?'),
  _('حكي على مشكل حليتيه فالخدمة أو الدراسة.', 'Raconte un problème que tu as résolu.', 'Describe a problem you solved.'),
  _('كيفاش كتتعامل مع الضغط؟', 'Comment gères-tu la pression ?', 'How do you handle pressure?'),
  _('حكي على وقت اشتغلتي فيه فريق.', 'Parle d\'une expérience de travail en équipe.', 'Tell me about teamwork you did.'),
  _('فين كتشوف راسك من بعد 5 سنين؟', 'Où te vois-tu dans 5 ans ?', 'Where do you see yourself in 5 years?'),
];
function interview() {
  const s = st(); const i = ui.sub.iq == null ? (ui.sub.iq = Math.floor(Math.random() * IQ.length)) : ui.sub.iq;
  const ans = h('textarea', { rows: 5, placeholder: _('جاوب بطريقة STAR…', 'Réponds avec la méthode STAR…', 'Answer using the STAR method…') });
  const checks = [_('الوضعية (Situation)', 'Situation', 'Situation'), _('المهمة (Task)', 'Tâche', 'Task'), _('الفعل (Action)', 'Action', 'Action'), _('النتيجة (Result)', 'Résultat', 'Result')].map((x) => h('label', { class: 'chk' }, h('input', { type: 'checkbox' }), x));
  const fb = h('div', { class: 'stack' });
  const feed = async () => {
    if (ans.value.trim().length < 20) { fb.replaceChildren(h('p', { class: 'muted' }, _('جاوب أكثر باش نقيمو', 'Développe ta réponse', 'Write a fuller answer'))); return; }
    if (checks.filter((c) => c.firstChild.checked).length >= 3) giveOnce('interview', 5);
    if (!AI.enabled()) { fb.replaceChildren(card(h('p', {}, tr('ai_enable_hint')))); return; }
    fb.replaceChildren(h('p', { class: 'fb' }, tr('ai_thinking')));
    try { const out = await AI.askAI({ task: 'chat', messages: [{ role: 'user', content: `Interview question: ${IQ[i]}\nMy answer: ${ans.value.trim()}\nGive brief feedback: 2 strengths, 2 improvements (STAR structure, clarity), and one improved opening sentence.` }], lang: s.lang, profile: { level: s.level }, context: 'Interview practice' }); fb.replaceChildren(card(h('p', { class: 'body', style: 'white-space:pre-wrap' }, out))); }
    catch (e) { fb.replaceChildren(h('p', { class: 'fb bad' }, tr('ai_fail'))); }
  };
  return h('div', { class: 'stack' }, card(h('div', { class: 'lbl' }, '🎤 ' + _('سؤال', 'Question', 'Question')), h('p', { class: 'q' }, IQ[i]), ans, h('div', { class: 'lbl' }, 'STAR'), checks,
    h('div', { class: 'row wrap' }, btn('✨ ' + _('تقييم', 'Évaluer', 'Get feedback'), feed, 'primary'), btn('↻ ' + _('سؤال آخر', 'Autre question', 'Another question'), () => { ui.sub.iq = (i + 1) % IQ.length; hooks.render(); }, 'ghost'))), fb);
}
