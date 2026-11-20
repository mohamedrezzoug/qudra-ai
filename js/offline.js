// QUDRA OFFLINE + الإعدادات: حالة الاتصال، تحديث الكاش، حزم دراسة، الذكاء الاصطناعي، البيانات
import * as S from './store.js';
import * as AI from './ai.js';
import { ui, hooks, h, st, tr, lc, _, card, btn, pageHead, msg, note, download, isRtl, giveOnce } from './core.js';
import { LANGS } from './i18n.js';

export function packHTML(k) {
  const lg = st().lang; const dir = LANGS[lg].dir; const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const L = lc;
  const les = k.lessons.map((l, i) => `<section><h2>${i + 1}. ${esc(L(l.t))}</h2><p>${esc(L(l.body)).replace(/\n/g, '<br>')}</p>${l.code ? `<pre dir="ltr">${esc(l.code)}</pre>` : ''}<p class="ex">🎯 ${esc(L(l.ex))}</p><div class="q"><b>❓ ${esc(L(l.q.q))}</b><ol type="A">${l.q.o.map((o) => `<li>${esc(L(o))}</li>`).join('')}</ol></div></section>`).join('');
  const ans = k.lessons.map((l, i) => `${i + 1}: ${'ABC'[l.q.a]}`).join(' · ');
  return `<!doctype html><html lang="${lg}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(L(k.name))} – QUDRA</title><style>
  body{font-family:system-ui,"Segoe UI",Tahoma,Arial,sans-serif;max-width:720px;margin:0 auto;padding:18px;line-height:1.7;color:#1a1a2e;background:#fafaff}h1{color:#4b2fb5}h2{color:#2b1a6b;margin-top:28px}
  section{background:#fff;border:1px solid #dcd6f7;border-radius:14px;padding:6px 16px;margin:14px 0}pre{background:#0b1030;color:#aef;padding:12px;border-radius:10px;overflow:auto}.ex{background:#fff5d6;padding:8px 12px;border-radius:10px}.q{background:#eef6ff;padding:8px 12px;border-radius:10px}footer{color:#666;font-size:.85rem;margin-top:24px}
  </style></head><body><h1>${esc(k.icon)} ${esc(L(k.name))}</h1><p>${esc(L(k.desc))}</p>${les}<hr><p><b>${_('الأجوبة', 'Réponses', 'Answers')}:</b> ${ans}</p><footer>QUDRA AI · ${_('قُدرة', 'Capacité', 'Capability')} — ${_('نسخة للقراءة بدون إنترنت', 'Version hors ligne', 'Offline copy')}</footer></body></html>`;
}

async function cacheInfo() {
  try { const keys = await caches.keys(); let n = 0; for (const k of keys) n += (await (await caches.open(k)).keys()).length; const est = navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; return { n, mb: est ? (est.usage / 1048576).toFixed(1) : null }; } catch (e) { return null; }
}

export function viewOffline() {
  const s = st(); const info = h('p', { class: 'muted' }, '…'); const online = navigator.onLine;
  cacheInfo().then((i) => { info.textContent = i ? `💾 ${i.n} ${_('ملف مخزن', 'fichiers en cache', 'cached files')}${i.mb ? ` · ${i.mb} MB` : ''}` : _('الكاش غير متوفر (افتح التطبيق عبر http/https)', 'Cache indisponible (ouvre via http/https)', 'Cache unavailable (open via http/https)'); });
  const refresh = async () => { if (navigator.serviceWorker && navigator.serviceWorker.controller) { navigator.serviceWorker.controller.postMessage('refresh'); msg(_('جاري تحديث الكاش…', 'Mise à jour du cache…', 'Refreshing cache…')); setTimeout(() => hooks.render(), 1500); } else msg(_('Service Worker ما تفعلش بعد، عاود حمّل الصفحة', 'Service Worker pas encore actif, recharge la page', 'Service Worker not active yet, reload the page')); };
  const packs = S.allSkills().map((k) => h('div', { class: 'row between jitem' }, h('span', {}, `${k.icon} ${lc(k.name)}`), h('button', { class: 'mini', 'aria-label': 'download', onclick: () => { download(`qudra-${k.id}-${st().lang}.html`, packHTML(k), 'text/html'); giveOnce('pack', 1); } }, '⬇')));
  const file = h('input', { type: 'file', accept: 'application/json', hidden: true, onchange: (e) => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { S.importJSON(String(r.result)); hooks.applyLang(); alert(tr('imported')); hooks.go('home'); } catch (err) { alert(tr('bad_file')); } }; r.readAsText(f); } });
  return h('div', { class: 'page' }, pageHead('📶', 'QUDRA OFFLINE', _('المعرفة للجميع، حتى بلا إنترنت', 'Le savoir pour tous, même hors ligne', 'Knowledge for everyone, even offline')),
    card(h('h3', {}, online ? '🟢 ' + _('متصل', 'En ligne', 'Online') : '🟠 ' + _('بدون إنترنت', 'Hors ligne', 'Offline')), info,
      note(_('الدروس، الاختبارات، الألعاب العقلية، العبارات الجاهزة والـ CV كتخدم بلا إنترنت. المساعد، المترجم الحر، VISION وتوليد الكورسات كيحتاجو إنترنت.', 'Leçons, quiz, jeux mentaux, phrases et CV fonctionnent hors ligne. Assistant, traduction libre, VISION et génération de cours nécessitent Internet.', 'Lessons, quizzes, brain games, phrasebook and CV work offline. The assistant, free translation, VISION and course generation need internet.')),
      h('div', { class: 'row wrap' }, btn('🔄 ' + _('حدّث الكاش', 'Rafraîchir le cache', 'Refresh cache'), refresh, 'ghost'), deferred.ev && btn('📲 ' + tr('install'), async () => { deferred.ev.prompt(); deferred.ev = null; hooks.render(); }, 'primary'))),
    card(h('h3', {}, '📚 ' + _('حزم دراسة قابلة للتحميل', 'Packs d\'étude à télécharger', 'Downloadable study packs')), note(_('ملف HTML واحد كتقدر تبعتو بالواتساب أو USB وكيتقرا بلا إنترنت فأي هاتف.', 'Un seul fichier HTML à partager par WhatsApp ou clé USB, lisible sans Internet sur tout téléphone.', 'A single HTML file to share via WhatsApp or USB, readable offline on any phone.')), h('div', { class: 'stack' }, packs)),
    aiCard(), card(h('h3', {}, '⚙️ ' + tr('settings')),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: s.fx3d, onchange: (e) => { s.fx3d = e.target.checked; S.save(); hooks.apply3d(); } }), tr('fx3d')),
      h('div', { class: 'row wrap' }, btn('⬇ ' + tr('export'), () => download('qudra-backup.json', S.exportJSON(), 'application/json'), 'ghost'), btn('⬆ ' + tr('import'), () => file.click(), 'ghost'),
        btn('🗑 ' + tr('reset'), () => { if (confirm(tr('reset_confirm'))) { S.reset(); AI.clearCfg(); hooks.onboard(); } }, 'ghost danger')), file,
      note(_('بياناتك ديالك: تقدر تصدرها أو تمسحها فأي وقت.', 'Tes données t\'appartiennent : exporte ou supprime-les à tout moment.', 'Your data is yours: export or delete it at any time.'))));
}
export const deferred = { ev: null };

export function aiCard() {
  const c = AI.cfg(); const msgEl = h('p', { class: 'fb' }); const save = (patch) => { Object.assign(c, patch); AI.saveCfg(c); };
  const mode = h('select', { onchange: (e) => { save({ mode: e.target.value }); hooks.render(); } }, [['off', 'ai_off'], ['gemini', 'ai_gemini'], ['proxy', 'ai_proxy'], ['key', 'ai_key']].map(([v, k]) => h('option', { value: v, selected: c.mode === v }, tr(k))));
  const fields = [];
  if (c.mode === 'proxy') fields.push(h('label', { class: 'fl' }, tr('ai_endpoint'), h('input', { dir: 'ltr', value: c.endpoint, placeholder: 'https://qudra-ai-proxy.xxx.workers.dev', oninput: (e) => save({ endpoint: e.target.value.trim() }) })));
  if (c.mode === 'gemini') fields.push(h('label', { class: 'fl' }, tr('ai_gkey'), h('input', { dir: 'ltr', type: 'password', autocomplete: 'off', value: c.gkey, placeholder: 'AIza…', oninput: (e) => save({ gkey: e.target.value.trim() }) })), h('p', { class: 'muted small' }, _('مفتاح مجاني من aistudio.google.com/apikey. كيبقى فهاد الجهاز فقط.', 'Clé gratuite sur aistudio.google.com/apikey. Reste sur cet appareil.', 'Free key from aistudio.google.com/apikey. Stays on this device only.')));
  if (c.mode === 'key') fields.push(h('label', { class: 'fl' }, tr('ai_key'), h('input', { dir: 'ltr', type: 'password', autocomplete: 'off', value: c.key, placeholder: tr('ai_keyph'), oninput: (e) => save({ key: e.target.value.trim() }) })), h('label', { class: 'fl' }, tr('ai_model'), h('input', { dir: 'ltr', value: c.model, oninput: (e) => save({ model: e.target.value.trim() }) })));
  const test = c.mode !== 'off' && btn(tr('ai_test'), async () => { msgEl.className = 'fb'; msgEl.textContent = tr('ai_thinking');
    try { await AI.askAI({ task: 'chat', messages: [{ role: 'user', content: 'ping: reply with the single word OK' }], lang: st().lang, profile: {} }); msgEl.className = 'fb ok'; msgEl.textContent = tr('ai_ok'); } catch (e) { msgEl.className = 'fb bad'; msgEl.textContent = tr('ai_fail'); } }, 'ghost');
  return card(h('h3', {}, '✨ ' + tr('ai_title')), h('label', { class: 'fl' }, tr('ai_mode'), mode), fields, test, msgEl, h('p', { class: 'muted small' }, tr('ai_privacy')));
}
