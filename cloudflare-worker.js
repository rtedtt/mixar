/* Cloudflare Worker (الخطة المجانية) — وسيط آمن لـ Gemini لمنصة ميكسار
   الإعدادات (Settings → Variables → Secrets):
     GEMINI_API_KEY      مفتاح Gemini (Secret)
     FIREBASE_PROJECT_ID مثال: mixar-saas
     ALLOWED_ORIGIN      رابط موقعك مثل https://yourname.github.io
     GEMINI_MODEL        اختياري (الافتراضي gemini-2.0-flash)                                   */
const JWKS = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const b64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
const hits = new Map();                                                  // حد بسيط لكل مستخدم (يُصفَّر عند إعادة تشغيل الـ Worker)
async function verify(token, project) {
  const [h, p, s] = String(token).split("."); if (!h || !p || !s) throw new Error("bad token");
  const hd = JSON.parse(new TextDecoder().decode(b64(h))), pl = JSON.parse(new TextDecoder().decode(b64(p)));
  const k = (await (await fetch(JWKS, { cf: { cacheTtl: 3600, cacheEverything: true } })).json()).keys.find(x => x.kid === hd.kid);
  if (!k || hd.alg !== "RS256") throw new Error("bad key");
  const key = await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64(s), new TextEncoder().encode(h + "." + p)))) throw new Error("bad sig");
  const now = Date.now() / 1000;
  if (pl.aud !== project || pl.iss !== "https://securetoken.google.com/" + project || pl.exp < now || !pl.sub) throw new Error("bad claims");
  return pl;
}
const SYS = "أنت «مساعد ميكسار»، محلل تشغيل لمحطات الخرسانة والأسفلت وأساطيل المعدات الثقيلة. أجب بالعربية المصرية العملية وباختصار. اعتمد فقط على الأرقام الموجودة في السياق المرسل ولا تخترع أرقاماً؛ وإن لم تكفِ البيانات فاذكر ما ينقص. لا تكشف أي بيانات لشركات أخرى.";
export default {
  async fetch(req, env) {
    const cors = { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
    const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return out({ error: "method" }, 405);
    let user; try { user = await verify((req.headers.get("Authorization") || "").replace(/^Bearer /, ""), env.FIREBASE_PROJECT_ID); } catch (e) { return out({ error: "غير مصرّح" }, 401); }
    const t = Date.now(), arr = (hits.get(user.sub) || []).filter(x => t - x < 60000); if (arr.length >= 8) return out({ error: "طلبات كثيرة، حاول بعد دقيقة." }, 429); arr.push(t); hits.set(user.sub, arr);
    let b; try { b = await req.json(); } catch (e) { return out({ error: "طلب غير صالح" }, 400); }
    const q = String(b.question || "").slice(0, 800), ctx = JSON.stringify(b.context || {}).slice(0, 6000); if (!q) return out({ error: "اكتب سؤالاً" }, 400);
    const model = env.GEMINI_MODEL || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYS }] }, contents: [{ role: "user", parts: [{ text: `السياق (JSON):\n${ctx}\n\nالسؤال: ${q}` }] }], generationConfig: { maxOutputTokens: 700, temperature: 0.3 } })
    });
    if (!r.ok) return out({ error: "تعذر الحصول على إجابة الآن." }, 502);
    const j = await r.json(); return out({ answer: ((j.candidates || [])[0]?.content?.parts || []).map(p => p.text || "").join("").trim() || "لا توجد إجابة." });
  }
};
