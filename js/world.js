// QUDRA WORLD – تبادل المعرفة عبر روابط وملفات (بدون خادم)
import * as S from './store.js';
import { ui, hooks, h, st, tr, lc, _, card, btn, pageHead, tabs, give, msg, note, download, $ } from './core.js';

const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (t) => { const s = atob(t.replace(/-/g, '+').replace(/_/g, '/')); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
export async function pack(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') { const out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); return 'z.' + b64(out); }
  return 'j.' + b64(bytes);
}
export async function unpack(code) {
  const c = String(code).trim().replace(/^.*#qs=/, ''); const kind = c.slice(0, 2); const u = unb64(c.slice(2));
  if (kind === 'z.') { const out = await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); return JSON.parse(new TextDecoder().decode(out)); }
  if (kind === 'j.') return JSON.parse(new TextDecoder().decode(u));
  throw new Error('bad code');
}
const cl = (x, n) => String(x == null ? '' : x).slice(0, n);
export function sanitize(o) {
  if (!o || typeof o !== 'object') throw new Error('bad');
  if (o.t === 'project') return { t: 'project', title: cl(o.title, 80), tasks: (Array.isArray(o.tasks) ? o.tasks : []).slice(0, 30).map((x) => ({ text: cl(x.text || x, 140), col: [0, 1, 2].includes(x.col) ? x.col : 0 })) };
  if (o.t === 'course') return { t: 'course', title: cl(o.title, 80), icon: cl(o.icon, 4) || '📚', desc: cl(o.desc, 160), lang: ['ar', 'fr', 'en'].includes(o.lang) ? o.lang : 'en',
    lessons: (Array.isArray(o.lessons) ? o.lessons : []).slice(0, 10).map((l) => ({ t: cl(l.t, 90), body: cl(l.body, 1200), ex: cl(l.ex, 300), q: { q: cl(l.q && l.q.q, 200), o: ((l.q && l.q.o) || []).slice(0, 3).map((x) => cl(x, 120)), a: [0, 1, 2].includes(l.q && l.q.a) ? l.q.a : 0 } })).filter((l) => l.t && l.body && l.q.o.length === 3) };
  if (o.t === 'card') return { t: 'card', name: cl(o.name, 40), level: +o.level || 1, xp: +o.xp || 0, badges: (Array.isArray(o.badges) ? o.badges : []).slice(0, 20).map((x) => cl(x, 20)), skills: (Array.isArray(o.skills) ? o.skills : []).slice(0, 14).map((x) => cl(x, 60)) };
  if (o.t === 'help') return { t: 'help', kind: o.kind === 'offer' ? 'offer' : 'ask', topic: cl(o.topic, 80), text: cl(o.text, 500), name: cl(o.name, 40) };
  throw new Error('bad type');
}
export function courseToSkill(c) {
  const id = 'c_' + Date.now().toString(36); const lg = c.lang; const L = (x) => ({ [lg]: x });
  return { id, icon: c.icon, color: '#' + ((Math.random() * 0xffffff) | 0x555555).toString(16).padStart(6, '0').slice(0, 6), custom: true, name: L(c.title), desc: L(c.desc), kw: [],
    lessons: c.lessons.map((l, i) => ({ id: `${id}_${i}`, t: L(l.t), body: L(l.body), ex: L(l.ex), q: { q: L(l.q.q), o: l.q.o.map(L), a: l.q.a } })) };
}
export function skillToCourse(k) {
  const lg = st().lang; const g = (o) => lc(o);
  return { t: 'course', title: g(k.name), icon: k.icon, desc: g(k.desc), lang: k.custom ? Object.keys(k.name)[0] : lg, lessons: k.lessons.map((l) => ({ t: g(l.t), body: g(l.body), ex: g(l.ex), q: { q: g(l.q.q), o: l.q.o.map(g), a: l.q.a } })) };
}

const sub = () => (ui.sub.world = ui.sub.world || 'share');
export function viewWorld() {
  const t = sub();
  return h('div', { class: 'page' }, pageHead('🌐', 'QUDRA WORLD', _('تبادل المعرفة والمشاريع مع الآخرين', 'Échange savoirs et projets avec les autres', 'Exchange knowledge and projects with others')),
    tabs([['share', '📤 ' + _('شارك', 'Partager', 'Share')], ['import', '📥 ' + _('استورد', 'Importer', 'Import')]], t, (v) => { ui.sub.world = v; hooks.render(); }), t === 'share' ? share() : importer(),
    note(_('المجتمع الحي (دردشة، ملفات شخصية عامة، تصنيفات) كيحتاج خادم وإشراف على المحتوى؛ هاد النسخة كتتبادل عبر الروابط والملفات بلا ما تمر بيناتك بأي خادم.', 'Une communauté en direct (chat, profils publics, classements) exige un serveur et de la modération ; cette version échange via liens et fichiers, sans serveur intermédiaire.', 'A live community (chat, public profiles, leaderboards) needs a server and moderation; this version exchanges via links and files, with no server in between.')));
}

function share() {
  const s = st(); const out = h('div', { class: 'stack' }); const kind = h('select', {}, [['card', _('بطاقة إنجازاتي', 'Ma carte de progrès', 'My progress card')], ['project', _('مشروع', 'Un projet', 'A project')], ['course', _('كورس', 'Un cours', 'A course')], ['help', _('طلب/عرض مساعدة', 'Demande / offre d\'aide', 'Help request / offer')]].map(([v, l]) => h('option', { value: v }, l)));
  const pick = h('select', {}); const topic = h('input', { placeholder: _('الموضوع', 'Sujet', 'Topic') }); const text = h('textarea', { rows: 3, placeholder: _('الرسالة', 'Message', 'Message') }); const hk = h('select', {}, [['ask', _('كنطلب مساعدة', 'Je demande de l\'aide', 'I need help')], ['offer', _('كنعرض مساعدة', 'Je propose mon aide', 'I can help')]].map(([v, l]) => h('option', { value: v }, l)));
  const holder = h('div', { class: 'stack' });
  const sync = () => {
    const k = kind.value; pick.replaceChildren(); holder.replaceChildren();
    if (k === 'project') { s.projects.forEach((p) => pick.append(h('option', { value: p.id }, p.title))); holder.append(pick); }
    if (k === 'course') { S.allSkills().forEach((x) => pick.append(h('option', { value: x.id }, lc(x.name)))); holder.append(pick); }
    if (k === 'help') holder.append(hk, topic, text);
  };
  kind.onchange = sync; sync();
  const gen = async () => {
    let obj; const k = kind.value;
    if (k === 'card') obj = { t: 'card', name: s.name, level: S.levelOf(s.xp), xp: s.xp, badges: s.badges, skills: S.allSkills().filter((x) => S.skillDone(x) > 0).map((x) => `${x.icon} ${lc(x.name)} ${S.skillDone(x)}/${x.lessons.length}`) };
    else if (k === 'project') { const p = s.projects.find((x) => String(x.id) === pick.value); if (!p) { msg(_('ما عندك مشاريع', 'Aucun projet', 'No projects')); return; } obj = { t: 'project', title: p.title, tasks: p.tasks.map((x) => ({ text: x.text, col: x.col })) }; }
    else if (k === 'course') { const sk = S.allSkills().find((x) => x.id === pick.value); obj = skillToCourse(sk); }
    else { if (text.value.trim().length < 3) { msg(_('كتب رسالة', 'Écris un message', 'Write a message')); return; } obj = { t: 'help', kind: hk.value, topic: topic.value, text: text.value, name: s.name }; }
    obj = sanitize(obj); const code = await pack(obj); const url = location.origin + location.pathname + '#qs=' + code;
    s.shared++; S.save(); S.award(0);
    const box = h('textarea', { rows: 3, readonly: true, dir: 'ltr', onclick: (e) => e.target.select() }, url);
    out.replaceChildren(card(h('h3', {}, '🔗 ' + _('رابط المشاركة', 'Lien de partage', 'Share link')), box, h('small', { class: 'muted' }, `${url.length} ${_('حرف', 'caractères', 'chars')}${url.length > 7000 ? ' — ' + _('طويل، فضل الملف', 'long, préfère le fichier', 'long, prefer the file') : ''}`),
      h('div', { class: 'row wrap' }, navigator.share && btn('📤 ' + _('شارك', 'Partager', 'Share'), () => navigator.share({ title: 'QUDRA AI', url }).catch(() => {}), 'primary'),
        btn('📋 ' + _('نسخ', 'Copier', 'Copy'), () => { try { navigator.clipboard.writeText(url); msg('✓'); } catch (e) { box.select(); } }, 'ghost'), btn('⬇ .qudra', () => download('share.qudra', code, 'text/plain'), 'ghost'))));
  };
  return h('div', { class: 'stack' }, card(h('label', { class: 'fl' }, _('شنو بغيتي تشارك؟', 'Que partager ?', 'What to share?'), kind), holder, btn(_('صاوب الرابط', 'Générer le lien', 'Create link'), gen, 'primary')), out,
    note(_('كيتشارك غير اللي اخترتي. ما كيتبعثش شي حاجة لخادم.', 'Seul ce que tu choisis est partagé. Rien n\'est envoyé à un serveur.', 'Only what you choose is shared. Nothing is sent to a server.')));
}

function importer() {
  const s = st(); const out = h('div', { class: 'stack' }); const ta = h('textarea', { rows: 3, dir: 'ltr', placeholder: 'https://…#qs=… / z.…' });
  const show = async (code) => {
    try {
      const o = sanitize(await unpack(code));
      const accept = (fn, label) => btn(label, () => { fn(); S.save(); hooks.render(); }, 'primary');
      let body;
      if (o.t === 'project') body = [h('h3', {}, '🚀 ' + o.title), h('ul', { class: 'pc' }, o.tasks.map((x) => h('li', {}, x.text))), accept(() => { s.projects.unshift({ id: Date.now(), title: o.title, tasks: o.tasks.map((x, i) => ({ id: i, text: x.text, col: x.col })) }); give(5); ui.sub.world = 'share'; ui.tab = 'create'; }, '＋ ' + _('أضف لمشاريعي', 'Ajouter à mes projets', 'Add to my projects'))];
      else if (o.t === 'course') { if (!o.lessons.length) throw new Error('empty'); body = [h('h3', {}, `${o.icon} ${o.title}`), h('p', { class: 'muted' }, o.desc), h('p', {}, `${o.lessons.length} ${tr('lessons')}`), accept(() => { const sk = courseToSkill(o); s.custom.push(sk); s.path.push(sk.id); S.logEvent('course', o.title); give(5); ui.tab = 'learn'; }, '＋ ' + _('أضف للأكاديمية', 'Ajouter à l\'Académie', 'Add to Academy'))]; }
      else if (o.t === 'card') body = [h('h3', {}, `🏅 ${o.name || '—'} · ${tr('level')} ${o.level}`), h('p', {}, `${o.xp} ${tr('xp')}`), h('p', {}, o.skills.join(' • ')), h('p', {}, o.badges.length + ' ' + tr('badges'))];
      else body = [h('h3', {}, (o.kind === 'offer' ? '🤝 ' : '🆘 ') + (o.name ? o.name + ' — ' : '') + o.topic), h('p', { class: 'body' }, o.text)];
      out.replaceChildren(card(h('div', { class: 'lbl' }, _('معاينة (تأكد من المصدر)', 'Aperçu (vérifie la source)', 'Preview (check the source)')), body));
    } catch (e) { out.replaceChildren(h('p', { class: 'fb bad' }, tr('bad_file'))); }
  };
  const file = h('input', { type: 'file', hidden: true, onchange: (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => show(String(r.result)); r.readAsText(f); } });
  if (ui.sub.worldCode) { const c = ui.sub.worldCode; ui.sub.worldCode = null; ta.value = c; setTimeout(() => show(c), 0); }
  return h('div', { class: 'stack' }, card(ta, h('div', { class: 'row wrap' }, btn(_('معاينة', 'Aperçu', 'Preview'), () => show(ta.value), 'primary'), btn('📁 ' + _('ملف', 'Fichier', 'File'), () => file.click(), 'ghost'), file)), out);
}
export function handleHash() {
  if (location.hash.startsWith('#qs=')) { ui.sub.worldCode = location.hash.slice(4); ui.sub.world = 'import'; ui.tab = 'world'; history.replaceState(null, '', location.pathname + location.search); return true; }
  return false;
}
