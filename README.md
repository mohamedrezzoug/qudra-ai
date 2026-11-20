# QUDRA AI 1.1

**أسهل طريقة مجانية (بلا Worker):** فالتطبيق QUDRA OFFLINE ← الوضع «Gemini مجاني» ← لصق مفتاح من aistudio.google.com/apikey. المفتاح كيبقى فجهازك.

**ذكاء مجاني:** الـ Worker كيدعم Google Gemini (مفتاح مجاني من aistudio.google.com/apikey): `wrangler secret put GEMINI_API_KEY`. إلا كان ANTHROPIC_API_KEY كيتستعمل هو بالأولوية.


الوحدات: HUMAN (مساعد صوت+نص مع ذاكرة بموافقتك) · ACADEMY (+ كورسات يولّدها الذكاء) · MIND · INVENT · UNIVERSAL (ترجمة) · CAREER · WORLD (مشاركة عبر روابط) · LIFE MAP · OFFLINE · VISION.

## شنو كيخدم بلا إنترنت / بلا ذكاء اصطناعي
- كلشي: الدروس (14 مهارة)، MIND، LIFE MAP، CV، المراجعة المتباعدة، المساعد المحلي، تصدير/حذف البيانات.
## شنو كيحتاج الذكاء الاصطناعي (Worker أو مفتاح)
- توليد الكورسات، INVENT الذكي، ترجمة الجمل، VISION، ردود المساعد الحرة.
## حدود صريحة
- WORLD ما فيهش سيرفر: المشاركة بروابط/ملفات فقط (مجتمع حي كيحتاج backend).
- VISION كيرسل الصورة للنموذج؛ بلا ذكاء ما كيخدمش.
- الصوت (Web Speech) كيعتمد على المتصفح؛ الدارجة ar-MA ماشي مدعومة فكل الأجهزة.

---
# QUDRA AI – قُدرة
مساعد ذكي مجاني: تعلّم، فكّر، أنشئ، لغات، تطوّر. PWA ثلاثية الأبعاد (Three.js)، AR/FR/EN، تعمل بدون إنترنت.

## النشر على GitHub Pages
```bash
cd qudra-ai
git init && git add . && git commit -m "QUDRA AI v0.2"
git branch -M main
git remote add origin https://github.com/mohamedrezzoug/qudra-ai.git
git push -u origin main
```
GitHub → Settings → Pages → Source: `main` / root → https://mohamedrezzoug.github.io/qudra-ai/

## اختبار محلي
`python3 -m http.server 8000` ثم http://localhost:8000 (Service Worker يحتاج http(s)).

## ملاحظات
- غيّر `CACHE` في `sw.js` (qudra-v1 → v2) عند كل نشر.
- المساعد (Coach) يعمل حالياً بقواعد محلية بدون إنترنت؛ ربطه بنموذج ذكاء اصطناعي حقيقي = خطوة قادمة (يحتاج خادم وسيط لحماية المفتاح).
- البيانات محلية (localStorage) مع تصدير/استيراد JSON.

## ربط المساعد بنموذج حقيقي (v0.3)
**الطريقة الموصى بها: Cloudflare Worker (المفتاح كيبقى سري)**
```bash
cd worker
npm i -g wrangler && wrangler login
wrangler secret put ANTHROPIC_API_KEY     # الصق المفتاح هنا
wrangler deploy                            # كيعطيك رابط https://qudra-ai-proxy.xxx.workers.dev
```
عدّل `ALLOWED_ORIGIN` فـ `wrangler.toml` لدومين موقعك. من بعد فالتطبيق: تطور ← الإعدادات ← المساعد الذكي ← «خادم وسيط» ← الصق الرابط ← جرّب الاتصال.
لحماية الميزانية: فعّل Rate Limiting فـ Cloudflare وحدد سقف شهري فـ console.anthropic.com.

**للاستعمال الشخصي فقط:** وضع «مفتاح شخصي» كيخزن المفتاح فمتصفحك. ما تنشرش تطبيق عام بمفتاحك.
بدون إعداد، المساعد كيخدم محليا بقواعد بسيطة وكيرجع ليها أوتوماتيكيا إلا فشل الاتصال.
