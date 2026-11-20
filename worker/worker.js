// QUDRA AI – Cloudflare Worker (proxy آمن لـ Anthropic API)
// المفتاح سري فالخادم؛ الموقع كيبعث غير المهمة والرسائل، والـ prompts كتتبنى هنا.
// النشر: wrangler secret put GEMINI_API_KEY (مجاني) أو ANTHROPIC_API_KEY  &&  wrangler deploy
// المتغيرات: ALLOWED_ORIGIN (مثلا https://mohamedrezzoug.github.io) ، MODEL (اختياري)
import { buildSystem, maxTokens, TASKS } from '../js/prompts.js';

const MEDIA = ['image/jpeg', 'image/png', 'image/webp'];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim());
    const ok = allowed.includes('*') || allowed.includes(origin);
    const cors = { 'access-control-allow-origin': ok ? (allowed.includes('*') ? '*' : origin) : 'null', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'method' }, 405);
    if (!ok) return json({ error: 'origin' }, 403);
    if (!env.ANTHROPIC_API_KEY && !env.GEMINI_API_KEY) return json({ error: 'server not configured' }, 500);

    const raw = await req.text();
    if (raw.length > 2200000) return json({ error: 'too large' }, 413);
    let body; try { body = JSON.parse(raw); } catch (e) { return json({ error: 'json' }, 400); }
    const task = TASKS.includes(body.task) ? body.task : 'chat';
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })).slice(-10);
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length) return json({ error: 'no messages' }, 400);

    if (task === 'vision') {
      const img = body.image;
      if (!img || !MEDIA.includes(img.media_type) || typeof img.data !== 'string' || img.data.length > 2000000 || !/^[A-Za-z0-9+/=]+$/.test(img.data)) return json({ error: 'image' }, 400);
      const last = messages[messages.length - 1];
      last.content = [{ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } }, { type: 'text', text: last.content }];
    }
    const system = buildSystem(task, { lang: body.lang, profile: body.profile, context: body.context, params: body.params });
    if (!env.ANTHROPIC_API_KEY) { // مجاني: Google Gemini عبر AI Studio
      const parts = (c) => (typeof c === 'string' ? [{ text: c }] : c.map((p) => (p.type === 'image' ? { inline_data: { mime_type: p.source.media_type, data: p.source.data } } : { text: p.text })));
      const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: parts(m.content) }));
      const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
      const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: maxTokens(task) } }),
      });
      if (!g.ok) return json({ error: 'upstream', status: g.status }, 502);
      const gd = await g.json();
      const gt = ((gd.candidates && gd.candidates[0] && gd.candidates[0].content && gd.candidates[0].content.parts) || []).map((p) => p.text || '').join('\n');
      if (!gt) return json({ error: 'empty' }, 502);
      return json({ text: gt });
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: maxTokens(task), system, messages }),
    });
    if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    return json({ text });
  },
};
