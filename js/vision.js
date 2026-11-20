// QUDRA VISION – فهم الصور والوثائق عبر الكاميرا (يحتاج الذكاء الاصطناعي)
import * as AI from './ai.js';
import { ui, hooks, h, st, tr, _, card, btn, pageHead, giveOnce, msg, note } from './core.js';

async function toJPEG(file, max = 1280, q = 0.82) {
  const bmp = await createImageBitmap(file); const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  let url = c.toDataURL('image/jpeg', q); if (url.length > 1900000) url = c.toDataURL('image/jpeg', 0.55);
  return { url, image: { media_type: 'image/jpeg', data: url.split(',')[1] } };
}
const PURPOSES = () => [
  ['explain', '📄 ' + _('اشرح الوثيقة/الصورة', 'Explique le document / l\'image', 'Explain document / image'), 'Explain what this document or image says in simple terms, list the key points and any required action or deadline.'],
  ['read', '🔤 ' + _('اقرا وترجم النص', 'Lis et traduis le texte', 'Read and translate text'), 'Read all visible text, then translate it into the app language. Mark unreadable parts.'],
  ['teach', '🔎 ' + _('شنو هادشي؟ علمني', 'C\'est quoi ? Apprends-moi', 'What is this? Teach me'), 'Identify what the object or scene is (not any real person) and teach me how it works with 3 interesting facts and one safety tip if relevant.'],
  ['homework', '✏️ ' + _('تمرين: اشرح الطريقة', 'Exercice : explique la méthode', 'Homework: explain the method'), 'This is schoolwork. Explain the method step by step and let me try the last step myself.'],
];
export function viewVision() {
  const sub = (ui.sub.vision = ui.sub.vision || { purpose: 'explain' }); const out = h('div', { class: 'stack' });
  const prev = h('img', { class: 'vprev', alt: '' }); prev.hidden = !sub.url; if (sub.url) prev.src = sub.url;
  const fileIn = (capture) => h('input', { type: 'file', accept: 'image/*', hidden: true, ...(capture ? { capture: 'environment' } : {}), onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await toJPEG(f); sub.url = r.url; sub.image = r.image; prev.src = r.url; prev.hidden = false; } catch (err) { msg(tr('bad_file')); } } });
  const cam = fileIn(true), gal = fileIn(false);
  const q = h('input', { placeholder: _('سؤال إضافي (اختياري)', 'Question supplémentaire (facultatif)', 'Extra question (optional)') });
  const chips = h('div', { class: 'row wrap' }, PURPOSES().map(([id, label]) => h('button', { class: 'chip' + (sub.purpose === id ? ' on' : ''), onclick: (e) => { sub.purpose = id; [...chips.children].forEach((c) => c.classList.toggle('on', c === e.currentTarget)); } }, label)));
  const run = async () => {
    if (!sub.image) { msg(_('اختار صورة أولا', 'Choisis d\'abord une image', 'Pick an image first')); return; }
    if (!AI.enabled()) { out.replaceChildren(card(h('p', {}, _('تحليل الصور كيحتاج الذكاء الاصطناعي والإنترنت.', 'L\'analyse d\'image nécessite l\'IA et Internet.', 'Image analysis needs AI and internet.')), h('p', { class: 'muted' }, tr('ai_enable_hint')))); return; }
    out.replaceChildren(card(h('p', { class: 'fb' }, tr('ai_thinking'))));
    const instr = PURPOSES().find((p) => p[0] === sub.purpose)[2];
    try { const res = await AI.askAI({ task: 'vision', messages: [{ role: 'user', content: instr + (q.value.trim() ? '\nUser question: ' + q.value.trim() : '') }], lang: st().lang, image: sub.image }); out.replaceChildren(card(h('p', { class: 'body', style: 'white-space:pre-wrap' }, res))); giveOnce('vision', 3); }
    catch (e) { out.replaceChildren(card(h('p', { class: 'fb bad' }, tr('ai_fail')))); }
  };
  return h('div', { class: 'page' }, pageHead('👁️', 'QUDRA VISION', _('صور وأنا نشرح ليك', 'Photographie, je t\'explique', 'Snap it and I will explain')),
    card(h('div', { class: 'row wrap' }, btn('📷 ' + _('كاميرا', 'Caméra', 'Camera'), () => cam.click(), 'primary'), btn('🖼 ' + _('معرض الصور', 'Galerie', 'Gallery'), () => gal.click(), 'ghost'), cam, gal), prev, chips, q, btn('✨ ' + _('حلل', 'Analyser', 'Analyse'), run, 'primary')), out,
    note(_('⚠️ ما تصورش بطاقة التعريف، البطاقات البنكية ولا وثائق سرية. الصورة كتتبعث لمزود الذكاء الاصطناعي ولا كتتخزن فالتطبيق.', '⚠️ Évite de photographier CIN, cartes bancaires ou documents confidentiels. L\'image est envoyée au fournisseur d\'IA et n\'est pas stockée dans l\'app.', '⚠️ Avoid photographing ID cards, bank cards or confidential documents. The image is sent to the AI provider and is not stored in the app.')));
}
