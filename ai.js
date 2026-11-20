// QUDRA AI – ربط المساعد بنموذج حقيقي (chat / course / invent / translate / vision)
// mode 'proxy': POST إلى Cloudflare Worker (المفتاح سري فالخادم) – الموصى به للنشر العام
// mode 'key'  : مفتاح Anthropic شخصي مخزن فهاد الجهاز فقط (للتجربة الشخصية)
import { buildSystem, maxTokens, extractJSON } from './prompts.js';
export { extractJSON };
const KEY = 'qudra.ai';
const DEFAULT = { mode: 'off', endpoint: '', key: '', model: 'claude-haiku-5-5', gkey: '', gmodel: 'gemini-3.8-flash' };

export function cfg() { try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...DEFAULT }; } }
export function saveCfg(c) { try { localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT, ...c })); } catch (e) { /* ignore */ } }
export function clearCfg() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
export function enabled() { const c = cfg(); return navigator.onLine !== false && ((c.mode === 'proxy' && /^https?:\/\//.test(c.endpoint)) || (c.mode === 'key' && c.key.length > 20) || (c.mode === 'gemini' && c.gkey.length > 20)); }
export function configured() { const c = cfg(); return (c.mode === 'proxy' && /^https?:\/\//.test(c.endpoint)) || (c.mode === 'key' && c.key.length > 20) || (c.mode === 'gemini' && c.gkey.length > 20); }

const clean = (messages) => {
  const m = messages.filter((x) => x && (x.role === 'user' || x.role === 'assistant') && String(x.content || '').trim())
    .map((x) => ({ role: x.role, content: String(x.content).slice(0, 2000) })).slice(-10);
  while (m.length && m[0].role !== 'user') m.shift();
  return m;
};

export async function askAI({ task = 'chat', messages, lang, profile = {}, context = '', params = {}, image = null }) {
  const c = cfg(); const msgs = clean(messages);
  if (!msgs.length) throw new Error('empty');
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), (task === 'course' || c.mode === 'gemini') ? 90000 : 30000);
  try {
    if (c.mode === 'proxy') {
      const res = await fetch(c.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ task, messages: msgs, lang, profile, context, params, image }) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json(); if (!j.text) throw new Error('no text'); return String(j.text);
    }
    if (c.mode === 'gemini') { // مفتاح Gemini مجاني شخصي؛ إعادة المحاولة + نماذج بديلة عند الضغط
      const contents = msgs.map((m, k) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: (image && k === msgs.length - 1) ? [{ inline_data: { mime_type: image.media_type, data: image.data } }, { text: m.content }] : [{ text: m.content }] }));
      const system = buildSystem(task, { lang, profile, context, params });
      const models = [...new Set([c.gmodel || DEFAULT.gmodel, 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'])];
      let lastErr = new Error('failed');
      for (let n = 0; n < models.length; n++) {
        const model = models[n];
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': c.gkey },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: maxTokens(task) + 1024, thinkingConfig: /gemini-3/.test(model) ? { thinkingLevel: 'low' } : undefined } }) });
        if (res.ok) {
          const j = await res.json(); const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map((p) => p.text || '').join('\n');
          if (text) { if (n > 0) c.lastModel = model; return text; }
          lastErr = new Error('no text (' + model + ')'); continue;
        }
        let m = ''; try { m = ((await res.json()).error || {}).message || ''; } catch (e) { /* no body */ }
        lastErr = new Error('HTTP ' + res.status + ' [' + model + ']' + (m ? ' — ' + m.slice(0, 120) : ''));
        if (![404, 429, 500, 503].includes(res.status)) throw lastErr; // مفتاح خاطئ الخ: ما كاين لا إعادة لا بديل
        if (res.status === 503 && n === 0) await new Promise((r) => setTimeout(r, 1500));
      }
      throw lastErr;
    }
    if (image) { const last = msgs[msgs.length - 1]; last.content = [{ type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } }, { type: 'text', text: last.content }]; }
    const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: c.model || DEFAULT.model, max_tokens: maxTokens(task), system: buildSystem(task, { lang, profile, context, params }), messages: msgs }) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json(); const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    if (!text) throw new Error('no text'); return text;
  } finally { clearTimeout(timer); }
}
export async function askJSON(opts) { return extractJSON(await askAI(opts)); }
