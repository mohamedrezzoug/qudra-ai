// QUDRA AI 1.0 – مشتركات الواجهة (يستعملها كل module)
import { t, L, LANGS } from './i18n.js';
import * as S from './store.js';

export const ui = { tab: 'home', lesson: null, quizOk: false, exDone: false, think: 'matrix', session: null, chat: [], puzzle: null, sub: {}, stop: null };
export const hooks = { go() {}, render() {}, chrome() {}, pulse() {}, ask() {} };

export const $ = (s, el = document) => el.querySelector(s);
export const st = () => S.state;
export const tr = (k) => t(k, st().lang);
export const lc = (o) => L(o, st().lang);
export const _ = (ar, fr, en) => lc({ ar, fr, en });
export const isRtl = () => LANGS[st().lang].dir === 'rtl';
export const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
export const shortName = (s, n = 16) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
export const fmtDate = (d) => d.toLocaleDateString(st().lang === 'ar' ? 'ar-MA-u-nu-latn' : st().lang, { day: 'numeric', month: 'long', year: 'numeric' });
export const dayIndex = () => Math.floor(Date.now() / 86400000);
export const rnd = (n) => Math.floor(Math.random() * n);
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => { if (Array.isArray(c)) c.forEach(add); else if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); };
  kids.forEach(add);
  return el;
}
export const card = (...k) => h('section', { class: 'card' }, ...k);
export const bar = (p, color) => h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%;${color ? 'background:' + color : ''}` }));
export const btn = (label, fn, cls = '') => h('button', { class: 'btn ' + cls, onclick: fn }, label);
export const pageHead = (icon, title, sub) => h('header', { class: 'phead' }, h('div', { class: 'pic' }, icon), h('div', {}, h('h2', {}, title), sub && h('p', { class: 'muted' }, sub)));
export const tabs = (items, cur, set) => h('div', { class: 'tabs' }, items.map(([id, lab]) => h('button', { class: 'tab' + (cur === id ? ' on' : ''), onclick: () => set(id) }, lab)));
export const note = (txt, cls = '') => h('p', { class: 'muted small ' + cls }, txt);

export function toast(events) {
  const parts = [];
  events.forEach((e) => {
    if (e.type === 'xp') parts.push(`+${e.n} ${tr('xp_gain')}`);
    if (e.type === 'level') parts.push(`🎉 ${tr('level_up')} ${e.n}`);
    if (e.type === 'badge') parts.push(`🏅 ${tr('badge_new')}: ${tr(e.b.k)}`);
  });
  if (!parts.length) return;
  const el = h('div', { class: 'toast' }, parts.join('  •  '));
  $('#toasts').append(el); hooks.pulse();
  setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}
export const msg = (text) => { const el = h('div', { class: 'toast' }, text); $('#toasts').append(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100); };
export const give = (n) => { toast(S.award(n)); hooks.chrome(); };
export function giveOnce(key, n) {
  const k = S.today() + ':' + key;
  if (st().thinkDone[k]) return false;
  st().thinkDone[k] = 1; give(n); return true;
}

export const SPEECH = { ar: 'ar-MA', fr: 'fr-FR', en: 'en-US' };
export function speak(text, lang) { try { const u = new SpeechSynthesisUtterance(String(text).slice(0, 600)); u.lang = lang || SPEECH[st().lang]; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* no TTS */ } }
export function listen(langCode, onFinal, onState) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return null;
  const r = new SR(); r.lang = langCode || SPEECH[st().lang]; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = (e) => onFinal(e.results[0][0].transcript); r.onend = () => onState && onState(false); r.onerror = () => onState && onState(false);
  try { r.start(); onState && onState(true); } catch (e) { return null; } return r;
}
export function download(name, data, type) {
  const a = document.createElement('a'); a.href = typeof data === 'string' && !data.startsWith('blob:') ? URL.createObjectURL(new Blob([data], { type })) : data; a.download = name;
  document.body.append(a); a.click(); a.remove();
}
export function spark(values, color = '#7ee0ff') {
  const W = 220, H = 48, ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'spark');
  if (values.length) { const max = Math.max(...values, 1); const pts = values.map((v, i) => `${values.length === 1 ? W / 2 : (i / (values.length - 1)) * (W - 8) + 4},${H - 4 - (v / max) * (H - 8)}`).join(' ');
    const pl = document.createElementNS(ns, 'polyline'); pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', color); pl.setAttribute('stroke-width', '2.5'); svg.append(pl); }
  return svg;
}
