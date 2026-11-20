/* p8.js (v27) — المرحلة 8: الواجهة التعريفية، الشات الموحد (ذكاء + فريق + صوت)، وتحسينات التشغيل. يُحمَّل بعد access.js */
const P8 = { landing: true, cfg: null, tab: "ai", hist: [], WA: "201128079357" };
const p8$ = (s, r = document) => r.querySelector(s), p8h = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const AR = "٠١٢٣٤٥٦٧٨٩", toEn = s => String(s).replace(/[٠-٩]/g, d => AR.indexOf(d)).replace(/٫/g, ".");
const waLink = txt => `https://wa.me/${P8.WA}?text=${encodeURIComponent(txt)}`;
const el = (html, cls) => { const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; return d; };

/* ================= 1) الواجهة التعريفية ================= */
const PLANS8 = [
  { id: "accountant_solo", name: "محاسب فردي", price: 250, feat: "مستخدم واحد · موقع واحد" },
  { id: "company_starter", name: "شركة — بداية", price: 600, feat: "5 مستخدمين · موقع · كل الوحدات" },
  { id: "company_growth", name: "شركة — نمو", price: 1200, feat: "15 مستخدم · 3 مواقع" },
  { id: "company_enterprise", name: "مؤسسات", price: 3500, feat: "100 مستخدم · 20 موقع" }];
const FAQ8 = [["هل أحتاج إنترنت دائماً؟", "التسجيل يحفظ على جهازك ويُرفع تلقائياً عند عودة الاتصال."], ["هل بيانات شركتي معزولة؟", "نعم، كل شركة في مساحة عمل مستقلة ولا يراها غيرها."], ["كم مدة التجربة؟", "30 يوماً مجانية بدون بطاقة."], ["ماذا يحدث لو انتهى اشتراكي؟", "تعمل شركتك 3 أيام قراءة فقط قبل القفل الكامل حتى لا تتوقف صبّة جارية."]];
function buildLanding() {
  if (p8$("#landing")) return;
  const L = el(`
  <header class="sticky top-0 z-30 bg-[#1e3a5f] text-white px-4 h-14 flex items-center justify-between"><b class="text-lg">ميكسار <span class="text-[#e85d04]">Mixar</span></b>
    <button id="ld-enter" class="bg-[#e85d04] font-bold rounded-xl px-4 py-1.5">دخول النظام</button></header>
  <section class="bg-[#1e3a5f] text-white px-5 py-12 text-center"><svg class="mx-auto mb-4" width="120" height="64" viewBox="0 0 120 64" fill="none"><rect x="8" y="30" width="62" height="20" rx="4" fill="#e85d04"/><ellipse cx="40" cy="24" rx="26" ry="14" fill="#fff" opacity=".9"/><rect x="70" y="36" width="34" height="14" rx="3" fill="#fff"/><circle cx="26" cy="54" r="7" fill="#0f172a" stroke="#fff" stroke-width="3"/><circle cx="88" cy="54" r="7" fill="#0f172a" stroke="#fff" stroke-width="3"/></svg>
    <h1 class="text-3xl font-black mb-2">اضبط سولارك وأسطولك من الموبايل</h1><p class="text-slate-200 mb-5">نظام سحابي لمحطات الخرسانة والأسفلت والمعدات الثقيلة.</p>
    <a href="#ld-signup" class="inline-block bg-[#e85d04] font-extrabold rounded-xl px-6 py-3">ابدأ تجربة مجانية</a></section>
  <div class="max-w-3xl mx-auto p-4 space-y-8 text-slate-800">
  <section class="bg-white rounded-2xl border p-4"><h2 class="font-extrabold text-lg mb-3">احسب كام هتوفّر</h2>
    <div class="grid grid-cols-2 gap-2"><input id="roi-n" data-num class="inp" inputmode="numeric" placeholder="عدد المعدات"><input id="roi-l" data-num class="inp" inputmode="decimal" placeholder="لتر سولار/يوم للمعدة"></div>
    <p id="roi-out" class="mt-3 font-bold text-[#1e3a5f]">أدخل الأرقام لتظهر النتيجة (تقدير بهدر 8% وسعر سولار 13.5 ج/لتر).</p></section>
  <section class="bg-white rounded-2xl border p-4"><h2 class="font-extrabold text-lg mb-3">جرّب النظام حسب دورك</h2><div class="flex flex-wrap gap-2" id="sim-btns">${["صاحب شركة", "محاسب", "مدير ورشة", "مراقب موقع"].map(r => `<button data-r="${r}" class="btn-dark text-sm">${r}</button>`).join("")}</div><div id="sim-out" class="mt-3 text-sm"></div></section>
  <section><h2 class="font-extrabold text-lg mb-1">الباقات</h2><p id="promo-cd" class="text-sm text-[#e85d04] font-bold mb-2"></p>
    <div class="flex gap-2 mb-3"><input id="promo" class="inp" placeholder="كود خصم / إحالة" dir="ltr"><button id="promo-ok" class="btn-dark">تطبيق</button></div><div id="plans" class="grid sm:grid-cols-2 gap-3"></div></section>
  <section class="bg-white rounded-2xl border p-4 overflow-x-auto"><h2 class="font-extrabold text-lg mb-3">ميكسار vs الدفاتر والإكسل</h2><table class="w-full text-sm text-center"><tr class="bg-slate-100"><th class="p-2"></th><th>ميكسار</th><th>دفاتر/إكسل</th></tr>
    ${[["كشف هدر السولار", "تلقائي", "يدوي"], ["العمل من الموقع", "موبايل أوفلاين", "غير ممكن"], ["سجل تدقيق", "لكل عملية", "لا يوجد"], ["صلاحيات الموظفين", "9 أدوار", "لا يوجد"]].map(r => `<tr class="border-t"><td class="p-2 font-bold">${r[0]}</td><td class="text-green-700">${r[1]}</td><td class="text-red-600">${r[2]}</td></tr>`).join("")}</table></section>
  <section id="ld-signup" class="bg-white rounded-2xl border p-4"><h2 class="font-extrabold text-lg mb-3">اطلب اشتراكاً / تجربة مجانية</h2>
    <input id="su-name" class="inp mb-2" placeholder="اسم الشركة"><input id="su-phone" data-num class="inp mb-2" inputmode="tel" placeholder="رقم الهاتف" dir="ltr"><select id="su-plan" class="inp mb-2">${PLANS8.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}</select>
    <button id="su-btn" class="btn w-full">إرسال الطلب</button><p id="su-msg" class="text-sm mt-2"></p></section>
  <section><h2 class="font-extrabold text-lg mb-2">أسئلة شائعة</h2>${FAQ8.map(f => `<details class="bg-white border rounded-xl p-3 mb-2"><summary class="font-bold cursor-pointer">${f[0]}</summary><p class="text-sm mt-2 text-slate-600">${f[1]}</p></details>`).join("")}</section>
  <footer class="text-center text-xs text-slate-500 pb-24"><button id="ld-terms" class="underline">الشروط وسياسة الخصوصية</button></footer></div>`, "");
  L.id = "landing"; L.className = "min-h-screen bg-slate-50"; document.body.prepend(L);
  const lg = p8$("#login"), app = p8$("#app"), fix = () => { if (P8.landing && !lg.classList.contains("hidden")) lg.classList.add("hidden"); if (!app.classList.contains("hidden")) L.classList.add("hidden"); else if (P8.landing) L.classList.remove("hidden"); };
  lg.classList.add("hidden"); new MutationObserver(fix).observe(lg, { attributes: true, attributeFilter: ["class"] }); new MutationObserver(fix).observe(app, { attributes: true, attributeFilter: ["class"] });
  p8$("#ld-enter").onclick = () => { P8.landing = false; L.classList.add("hidden"); lg.classList.remove("hidden"); };
  const roi = () => { const n = +toEn(p8$("#roi-n").value) || 0, l = +toEn(p8$("#roi-l").value) || 0, m = n * l * 13.5 * 0.08 * 30; if (n && l) p8$("#roi-out").textContent = `هدر متوقع توفيره: ${Math.round(m).toLocaleString("ar-EG")} ج شهرياً — ${Math.round(m * 12).toLocaleString("ar-EG")} ج سنوياً`; };
  p8$("#roi-n").oninput = p8$("#roi-l").oninput = roi;
  const SIM = { "صاحب شركة": "إيرادات الشهر 1.2 مليون · مصروفات 740 ألف · 3 أعطال مفتوحة · أعلى معدة سولار: خلاطة 07", "محاسب": "عُهد مفتوحة: 6 · فواتير لم تُرحَّل: 14 · قيود الفترة جاهزة للقفل", "مدير ورشة": "صيانة مستحقة: 4 معدات · قطع منخفضة: 9 · ورديات اليوم: 2", "مراقب موقع": "صبّات اليوم: 18 · سولار منصرف: 620 لتر · لا مخالفات" };
  p8$("#sim-btns").onclick = e => { const r = e.target.dataset.r; if (r) p8$("#sim-out").innerHTML = `<div class="bg-amber-50 border border-amber-200 rounded-xl p-3"><b>${r}</b> (بيانات تجريبية معزولة): ${SIM[r]}</div>`; };
  let promo = null, plans = PLANS8, until = 0;
  const draw = () => { p8$("#plans").innerHTML = plans.map(p => { const pr = promo ? Math.round(p.price * (1 - promo)) : p.price; return `<div class="bg-white border rounded-2xl p-4"><b>${p8h(p.name)}</b><div class="text-2xl font-black text-[#1e3a5f]">${pr} <span class="text-sm">ج/شهر</span> ${promo ? `<s class="text-sm text-slate-400">${p.price}</s>` : ""}</div><p class="text-sm text-slate-500 mb-2">${p8h(p.feat)}</p><button data-p="${p.id}" class="btn w-full text-sm">اختر الباقة</button></div>`; }).join(""); };
  draw(); p8$("#plans").onclick = e => { const id = e.target.dataset.p; if (id) { p8$("#su-plan").value = id; P8.plan = (plans.find(x => x.id === id) || {}).name; p8$("#ld-signup").scrollIntoView({ behavior: "smooth" }); } };
  p8$("#promo-ok").onclick = () => { const c = p8$("#promo").value.trim().toUpperCase(), m = (P8.promos || {})[c]; promo = m || null; P8.promoCode = m ? c : ""; draw(); p8$("#promo-ok").textContent = m ? "تم ✓" : "كود غير صالح"; };
  (async () => { try { await new Promise(r => { const t = setInterval(() => { if (S) { clearInterval(t); r(); } }, 200); }); const d = S.get && await S.get("pricing", "current"); if (d) { if (Array.isArray(d.plans) && d.plans.length) plans = d.plans; P8.promos = d.promos || {}; until = d.offerUntil || 0; draw(); } } catch (e) {}
    if (until > Date.now()) setInterval(() => { const s = Math.max(0, Math.floor((until - Date.now()) / 1000)); p8$("#promo-cd").textContent = `العرض ينتهي بعد ${Math.floor(s / 86400)} يوم ${Math.floor(s % 86400 / 3600)} س ${Math.floor(s % 3600 / 60)} د ${s % 60} ث`; }, 1000); })();
  p8$("#su-btn").onclick = async () => {
    const n = p8$("#su-name").value.trim(), ph = toEn(p8$("#su-phone").value.trim()), pl = p8$("#su-plan").value, msg = p8$("#su-msg"); if (!n || ph.length < 8) return msg.textContent = "أدخل اسم الشركة ورقماً صحيحاً.";
    const b = p8$("#su-btn"); b.disabled = true;
    try { if (S && S.rawAdd) await S.rawAdd("workspaces", { name: n, phone: ph, plan: pl, promo: P8.promoCode || "", status: "pending", createdAt: Date.now() }); msg.textContent = "تم تسجيل طلبك ✓ — جاري فتح واتساب"; } catch (e) { msg.textContent = "تعذّر حفظ الطلب، سنكمل عبر واتساب."; }
    window.open(waLink(`طلب اشتراك ميكسار\nالشركة: ${n}\nالهاتف: ${ph}\nالباقة: ${(PLANS8.find(x => x.id === pl) || {}).name}${P8.promoCode ? "\nكود: " + P8.promoCode : ""}`), "_blank"); b.disabled = false;
  };
  p8$("#ld-terms").onclick = () => modal("الشروط وسياسة الخصوصية", "<p>الخدمة اشتراك شهري، وبيانات كل شركة معزولة ولا تُباع أو تُشارَك. شهادات التحقق العامة تعرض ملخصاً فقط. يمكنك طلب حذف بياناتك بالتواصل مع الدعم. الاشتراك المنتهي يتحول لقراءة فقط 3 أيام ثم يُقفل.</p>");
  const fab = el(`<a href="#" id="wa-fab" class="fixed bottom-4 left-4 z-40 bg-green-500 text-white rounded-full w-14 h-14 grid place-items-center text-2xl shadow-lg" aria-label="واتساب">☎</a>`);
  fab.firstChild.onclick = e => { e.preventDefault(); window.open(waLink("مهتم بميكسار" + (P8.plan ? " — باقة " + P8.plan : "")), "_blank"); }; L.append(fab.firstChild);
}
function modal(title, body) { const o = el(`<div class="bg-white rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto"><div class="flex justify-between mb-2"><b>${title}</b><button data-x class="text-xl">×</button></div><div class="text-sm">${body}</div></div>`, "fixed inset-0 z-[80] bg-black/50 grid place-items-center p-4"); o.onclick = e => { if (e.target === o || e.target.dataset.x != null) o.remove(); }; document.body.appendChild(o); return o; }

/* بوابة التحقق العام ?verify=CODE */
async function verifyGate() {
  const code = new URLSearchParams(location.search).get("verify"); if (!code) return false;
  P8.landing = false; document.body.innerHTML = `<div class="min-h-screen grid place-items-center bg-slate-100 p-4" dir="rtl"><div id="vc" class="bg-white rounded-2xl shadow p-6 max-w-sm w-full text-center border-t-8 border-[#e85d04]">جاري التحقق…</div></div>`;
  try { await new Promise(r => { const t = setInterval(() => { if (S) { clearInterval(t); r(); } }, 150); }); const d = await S.get("public_verifications", code.slice(0, 60));
    p8$("#vc").innerHTML = d ? `<div class="text-green-600 text-4xl">✓</div><b class="text-lg">مستند موثّق — ميكسار</b><p class="text-sm mt-2">${p8h(d.type || "")} · ${p8h(d.company || "")}</p><p class="text-sm">رقم: <span dir="ltr">${p8h(code)}</span></p><p class="text-sm text-slate-500">${p8h(d.summary || "")}</p><p class="text-xs text-slate-400 mt-2">${d.at ? new Date(d.at).toLocaleDateString("ar-EG") : ""}</p>` : `<div class="text-red-600 text-4xl">✗</div><b>لم يُعثر على هذا المستند</b>`;
  } catch (e) { p8$("#vc").textContent = "تعذّر التحقق الآن."; }
  return true;
}
P8.publishVerification = (code, o) => S.rawSet("public_verifications", String(code), { ws: ACCESS.ws, company: (typeof curCo === "function" && curCo() || {}).name || "", type: o.type || "", summary: String(o.summary || "").slice(0, 160), at: Date.now() });   // استدعِها عند طباعة البون/الشهادة

/* ================= 2) الشات الموحد ================= */
async function aiCfg() { if (P8.cfg) return P8.cfg; try { P8.cfg = (await S.get("sys_config", "ai_keys")) || { keys: [], limits: {} }; } catch (e) { P8.cfg = { keys: [], limits: {} }; } return P8.cfg; }
function aiContext() {
  const tab = (p8$(".view:not(.hidden)") || {}).id || "", co = typeof curCo === "function" ? curCo() : null, kind = k => (typeof xbiz !== "undefined" ? xbiz : []).filter(x => x.kind === k);
  const sum = { المعدات: (typeof vehicles !== "undefined" ? vehicles : []).length, أعطال_مسجلة: kind("downtime").length, سجلات_سولار: kind("fuelout").length, عدد_المصروفات: (typeof expenses !== "undefined" ? expenses : []).length, إجمالي_المصروفات: Math.round((typeof expenses !== "undefined" ? expenses : []).reduce((a, x) => a + (+x.amount || +x.total || 0), 0)) };
  return `التبويب الحالي: ${tab}\nالدور: ${ACCESS.role}\nالمواقع: ${(ACCESS.sites || []).join(",")}\nالشركة: ${co ? co.name : ""}\nملخص: ${JSON.stringify(sum)}`;
}
const SYS8 = "أنت «مساعد ميكسار» محلل تشغيلي بلهجة مصرية عملية ومختصرة. ميكسار نظام لإدارة محطات الخرسانة والأسفلت والمعدات الثقيلة: المعدات، قراءات العدادات، المصروفات والصيانة، العهد، المخزن، التشغيل، سولار التانك، الإيجارات، الأعطال، الكاوتش، الإنتاج وتكلفة الوحدة، التقارير، التسعير. اعتمد فقط على الأرقام المرفقة في السياق ولا تخترع أرقاماً، ولا تكشف بيانات خارج صلاحيات دور المستخدم. في آخر ردك اكتب سطراً منفصلاً بالشكل: SUGGEST:[\"سؤال1\",\"سؤال2\",\"سؤال3\"] (3 أسئلة متابعة).";
async function askGemini(q) {
  const c = await aiCfg(), keys = (c.keys || []).filter(k => k.key && k.active !== false); if (!keys.length) throw new Error("لم يُضف المطور مفتاح Gemini بعد.");
  const co = typeof curCo === "function" ? curCo() : null, lim = (c.limits || {})[(co || {}).planType] ?? 0, mid = (ACCESS.ws || "x") + "_" + new Date().toISOString().slice(0, 7);
  if (lim && S.get && ACCESS.role !== "dev") { const u = await S.get("ai_usage", mid).catch(() => null); if (u && u.count >= lim) throw new Error("وصلت للحد الشهري لرسائل المساعد في باقتك."); }
  const body = { systemInstruction: { parts: [{ text: SYS8 + "\n\n" + aiContext() }] }, contents: [...P8.hist.slice(-8), { role: "user", parts: [{ text: q }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 900 } };
  let last; for (const k of keys) { try { const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(k.key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error("HTTP " + r.status); const j = await r.json(), txt = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(p => p.text || "").join("");
      P8.hist.push({ role: "user", parts: [{ text: q }] }, { role: "model", parts: [{ text: txt }] }); if (S.bump) S.bump("ai_usage", mid, { ws: ACCESS.ws || "x" }).catch(() => {}); return txt; } catch (e) { last = e; } }
  throw new Error("تعذّر الوصول للمساعد (" + (last && last.message) + ")");
}
const QUICK8 = ["ملخص مصاريف الأسبوع", "المعدات الأعلى استهلاكاً للسولار بنسبة تزيد عن 20% عن المتوسط", "صياغة تنبيه للسائقين عن ترشيد السولار"];
function buildChat8() {
  if (p8$("#p8-fab") || !ACCESS.uid) return;
  const fab = el("💬", "fixed bottom-4 right-4 z-[55] bg-[#1e3a5f] text-white w-14 h-14 rounded-full grid place-items-center text-2xl shadow-lg cursor-pointer"); fab.id = "p8-fab";
  const bub = el("", "hidden fixed bottom-20 right-4 z-[55] bg-white border rounded-2xl shadow p-3 text-sm max-w-[220px]"); bub.id = "p8-bub";
  const box = el(`<div class="flex border-b"><button data-t="ai" class="flex-1 p-2 font-bold">🤖 المساعد</button>${S.msgs ? '' : ''}<button data-t="team" class="${S.msgs ? 'flex-1' : 'hidden'} p-2 font-bold">👥 الفريق <span id="p8-unread" class="hidden bg-red-600 text-white rounded-full px-1.5 text-xs"></span></button><button data-x class="px-3">×</button></div><div id="p8-body" class="flex-1 overflow-y-auto p-3 text-sm space-y-2"></div><div id="p8-foot" class="border-t p-2"></div>`, "hidden fixed bottom-20 right-3 left-3 sm:left-auto sm:w-96 h-[70vh] z-[56] bg-white rounded-2xl shadow-2xl border flex flex-col"); box.id = "p8-box";
  document.body.append(fab, bub, box);
  const open = () => { box.classList.toggle("hidden"); bub.classList.add("hidden"); paintTab(); }; fab.onclick = open;
  box.onclick = e => { const t = e.target.closest("[data-t]"); if (t) { P8.tab = t.dataset.t; paintTab(); } if (e.target.closest("[data-x]")) box.classList.add("hidden"); };
  P8.bubble = txt => { if (!box.classList.contains("hidden") || P8.bubbled[txt]) return; P8.bubbled[txt] = 1; bub.textContent = txt; bub.classList.remove("hidden"); setTimeout(() => bub.classList.add("hidden"), 9000); };
  P8.bubbled = {};
  if (S.msgs && ACCESS.ws) S.msgs.listen(ACCESS.ws, rows => { P8.msgs = rows.sort((a, b) => a.at - b.at).slice(-150); const seen = +localStorage.getItem("p8seen") || 0, n = P8.msgs.filter(m => m.uid !== ACCESS.uid && m.at > seen && (!m.to || m.to === ACCESS.uid)).length, u = p8$("#p8-unread"); if (u) { u.textContent = n; u.classList.toggle("hidden", !n); } if (P8.tab === "team" && !box.classList.contains("hidden")) paintTab(); });
}
function paintTab() {
  if (!S.msgs) P8.tab = "ai";
  const body = p8$("#p8-body"), foot = p8$("#p8-foot"); if (!body) return;
  if (P8.tab === "ai") {
    body.innerHTML = (P8.aiLog || []).map(m => `<div class="${m.me ? "bg-amber-50 mr-8" : "bg-slate-100 ml-8"} rounded-xl p-2 whitespace-pre-wrap">${p8h(m.t)}${m.me ? "" : `<div class="mt-1 text-xs"><button data-cp="${m.i}" class="underline">نسخ لواتساب</button></div>`}</div>`).join("") + (P8.sug ? `<div class="flex flex-wrap gap-1">${P8.sug.map(s => `<button data-q="${p8h(s)}" class="border rounded-full px-2 py-1 text-xs">${p8h(s)}</button>`).join("")}</div>` : `<div class="flex flex-wrap gap-1">${QUICK8.map(s => `<button data-q="${p8h(s)}" class="border rounded-full px-2 py-1 text-xs">${p8h(s)}</button>`).join("")}</div>`);
    foot.innerHTML = `<div class="flex gap-1"><button id="p8-mic" class="btn-dark px-3">🎤</button><input id="p8-in" class="inp" placeholder="اسأل المساعد…"><button id="p8-send" class="btn px-3">➤</button></div>`;
    const go = async q => { q = q.trim(); if (!q) return; P8.aiLog = P8.aiLog || []; P8.aiLog.push({ me: 1, t: q }); P8.sug = null; paintTab(); body.insertAdjacentHTML("beforeend", "<div class='text-slate-400'>…</div>");
      try { let r = await askGemini(q), m = r.match(/SUGGEST:\s*(\[[\s\S]*\])\s*$/); if (m) { try { P8.sug = JSON.parse(m[1]).slice(0, 3); } catch (e) {} r = r.replace(m[0], "").trim(); } P8.aiLog.push({ t: r, i: P8.aiLog.length }); } catch (e) { P8.aiLog.push({ t: "⚠ " + e.message, i: P8.aiLog.length }); } paintTab(); };
    p8$("#p8-send").onclick = () => { const i = p8$("#p8-in"), v = i.value; i.value = ""; go(v); }; p8$("#p8-in").onkeydown = e => { if (e.key === "Enter") p8$("#p8-send").click(); };
    p8$("#p8-mic").onclick = () => { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return alert("المتصفح لا يدعم الإدخال الصوتي."); const r = new SR(); r.lang = "ar-EG"; r.onresult = e => { p8$("#p8-in").value = e.results[0][0].transcript; }; r.start(); };
    body.onclick = e => { const q = e.target.dataset.q, c = e.target.dataset.cp; if (q) go(q); if (c != null) { const t = (P8.aiLog[+c] || {}).t || ""; navigator.clipboard.writeText("*ميكسار*\n" + t.replace(/\*\*/g, "*")).then(() => e.target.textContent = "تم النسخ ✓"); } };
  } else {
    const co = (typeof urs !== "undefined" ? urs : []).filter(u => u.id !== ACCESS.uid && u.status === "active"), to = P8.to || "";
    const rows = (P8.msgs || []).filter(m => (!m.to && !to) || (to && ((m.uid === ACCESS.uid && m.to === to) || (m.uid === to && m.to === ACCESS.uid))));
    body.innerHTML = `<select id="p8-to" class="inp"><option value="">قناة الشركة العامة</option>${co.map(u => `<option value="${p8h(u.id)}" ${u.id === to ? "selected" : ""}>${p8h(u.name || u.email)}</option>`).join("")}</select>` + rows.map(m => `<div class="${m.uid === ACCESS.uid ? "bg-amber-50 mr-8" : "bg-slate-100 ml-8"} rounded-xl p-2"><div class="text-[11px] text-slate-500">${p8h(m.name || "")}</div>${m.audio ? `<audio controls preload="none" src="${m.audio}" class="w-full h-8"></audio>` : p8h(m.text)}</div>`).join("");
    foot.innerHTML = `<div class="flex gap-1"><button id="p8-rec" class="btn-dark px-3">⏺</button><input id="p8-in" class="inp" placeholder="اكتب رسالة…"><button id="p8-send" class="btn px-3">➤</button></div><div id="p8-rs" class="text-xs text-red-600"></div>`;
    p8$("#p8-to").onchange = e => { P8.to = e.target.value; paintTab(); }; body.scrollTop = body.scrollHeight; localStorage.setItem("p8seen", Date.now()); const u = p8$("#p8-unread"); if (u) u.classList.add("hidden");
    const send = d => S.msgs.send(ACCESS.ws, { uid: ACCESS.uid, name: ACCESS.name || ACCESS.email, to: P8.to || "", at: Date.now(), ...d }).catch(e => alert("تعذّر الإرسال"));
    p8$("#p8-send").onclick = () => { const i = p8$("#p8-in"), v = i.value.trim(); if (v) { send({ text: v.slice(0, 1500) }); i.value = ""; } };
    let rec = null, chunks = [], timer = 0; p8$("#p8-rec").onclick = async () => {
      if (rec) { rec.stop(); return; }
      try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }), mime = ["audio/webm;codecs=opus", "audio/mp4"].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)); rec = new MediaRecorder(st, mime ? { mimeType: mime, audioBitsPerSecond: 12000 } : { audioBitsPerSecond: 12000 }); chunks = []; rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => { clearTimeout(timer); st.getTracks().forEach(t => t.stop()); p8$("#p8-rec") && (p8$("#p8-rec").textContent = "⏺"); const b = new Blob(chunks, { type: rec.mimeType }); rec = null; const fr = new FileReader(); fr.onload = () => { if (fr.result.length > 65000) return alert("التسجيل طويل، اختصره."); send({ audio: fr.result }); }; fr.readAsDataURL(b); };
        rec.start(); p8$("#p8-rec").textContent = "⏹"; timer = setTimeout(() => rec && rec.stop(), 45000); } catch (e) { alert("لا يمكن الوصول للميكروفون."); } };
  }
}
/* لوحة المطور: مفاتيح Gemini */
function devKeysUI() {
  if (ACCESS.role !== "dev" || p8$("#p8-keys") || !p8$("#view-accounts")) return;
  const box = el(`<b>🔑 مفاتيح Gemini (sys_config/ai_keys)</b><div id="k-list" class="my-2 text-sm"></div><input id="k-new" class="inp mb-2" dir="ltr" placeholder="الصق مفتاح API"><button id="k-add" class="btn-dark text-sm">إضافة مفتاح</button>
    <div class="mt-3 text-sm">حد الرسائل الشهري لكل باقة:</div><div id="k-lim" class="grid grid-cols-2 gap-2 mt-1"></div><button id="k-save" class="btn mt-2 text-sm">حفظ الحدود</button>`, "card mb-3"); box.id = "p8-keys";
  p8$("#view-accounts").prepend(box); const save = async c => { await S.rawSet("sys_config", "ai_keys", c); P8.cfg = c; paint(); };
  const paint = async () => { const c = await aiCfg(); p8$("#k-list").innerHTML = (c.keys || []).map((k, i) => `<div class="flex justify-between border-b py-1"><span dir="ltr">${i ? "احتياطي" : "أساسي"} …${p8h(String(k.key).slice(-4))}</span><button data-d="${i}" class="text-red-600">حذف</button></div>`).join("") || "لا مفاتيح"; p8$("#k-lim").innerHTML = Object.keys(PLAN_DEFS).map(p => `<label class="text-xs">${PLAN_DEFS[p].label}<input data-l="${p}" data-num class="inp" inputmode="numeric" value="${(c.limits || {})[p] || ""}"></label>`).join(""); };
  p8$("#k-add").onclick = async () => { const v = p8$("#k-new").value.trim(); if (!v) return; const c = await aiCfg(); p8$("#k-new").value = ""; save({ ...c, keys: [...(c.keys || []), { key: v, active: true }] }); };
  p8$("#k-list").onclick = async e => { const i = e.target.dataset.d; if (i == null) return; const c = await aiCfg(); save({ ...c, keys: c.keys.filter((_, j) => j !== +i) }); };
  p8$("#k-save").onclick = async () => { const c = await aiCfg(), l = {}; document.querySelectorAll("[data-l]").forEach(x => { const n = +toEn(x.value); if (n) l[x.dataset.l] = n; }); save({ ...c, limits: l }); }; paint();
}

/* ================= 3) تحسينات التشغيل ================= */
document.addEventListener("input", e => { const t = e.target; if (t.tagName === "INPUT" && !/password|email/.test(t.type) && /[٠-٩٫]/.test(t.value)) { const p = t.selectionStart; t.value = toEn(t.value); try { t.setSelectionRange(p, p); } catch (x) {} } }, true);
document.addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.closest("#p8-box") && !b.id) return; if (/حفظ|إضافة|تسجيل|إنشاء|اعتماد|إرسال/.test(b.textContent) || b.id === "login-btn") { if (b.dataset.busy) { e.stopImmediatePropagation(); e.preventDefault(); return; } b.dataset.busy = 1; b.style.opacity = ".6"; setTimeout(() => { delete b.dataset.busy; b.style.opacity = ""; }, 1500); } }, true);
document.addEventListener("focusin", e => { const t = e.target; if (t.type !== "password" || t.id === "password" || t.dataset.pw) return; t.dataset.pw = 1; const m = el("", "text-xs mb-2"); t.after(m);
  t.addEventListener("input", () => { const v = t.value, s = [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length; m.innerHTML = v ? `<span style="color:${["#dc2626", "#dc2626", "#d97706", "#16a34a", "#16a34a"][s]}">قوة كلمة المرور: ${["ضعيفة جداً", "ضعيفة", "متوسطة", "جيدة", "قوية"][s]}</span>` : ""; }); });
function guardTabs() {                                                   // Error Boundary لكل تبويب
  if (typeof VIEW_HOOKS === "undefined") return;
  Object.keys(VIEW_HOOKS).forEach(k => { const f = VIEW_HOOKS[k]; if (f.__g) return; const g = function () { try { const r = f.apply(this, arguments); if (r && r.catch) r.catch(x => bad(k, x)); return r; } catch (x) { bad(k, x); } }; g.__g = 1; VIEW_HOOKS[k] = g; });
  function bad(k, x) { console.error("tab", k, x); const v = p8$("#view-" + k); if (v && !v.querySelector("[data-eb]")) { const b = el(`<p class="font-bold text-red-700 mb-2">حدث خطأ في هذا التبويب.</p><button class="btn text-sm">إعادة تحميل التبويب</button>`, "bg-red-50 border border-red-200 rounded-xl p-4 m-3"); b.dataset.eb = 1; b.querySelector("button").onclick = () => { b.remove(); try { VIEW_HOOKS[k](); } catch (y) { bad(k, y); } }; v.prepend(b); } }
}
function onboarding() {
  if (!ACCESS.uid || ACCESS.role === "dev" || p8$("#p8-ob") || localStorage.getItem("p8ob-" + ACCESS.ws)) return; const d = p8$("#view-dashboard"); if (!d) return;
  const steps = [["إضافة موقع", () => ((curCo() || {}).sites || []).length > 0 || (ACCESS.sites || ["*"]).some(s => s !== "*")], ["إضافة معدة", () => vehicles.length > 0], ["إنشاء حساب موظف", () => urs.filter(u => u.status === "active").length > 1], ["تسجيل أول عملية", () => expenses.length + operations.length + advances.length > 0]];
  const ok = steps.map(s => { try { return !!s[1](); } catch (e) { return false; } }); if (ok.every(Boolean)) return localStorage.setItem("p8ob-" + ACCESS.ws, 1);
  const o = el(`<b>تهيئة سريعة (${ok.filter(Boolean).length}/4)</b><div class="flex flex-wrap gap-2 mt-2 text-sm">${steps.map((s, i) => `<span class="${ok[i] ? "bg-green-100 text-green-800" : "bg-slate-100"} rounded-full px-3 py-1">${ok[i] ? "✓" : "○"} ${s[0]}</span>`).join("")}</div>`, "bg-white border-r-4 border-[#e85d04] rounded-xl p-3 mb-3"); o.id = "p8-ob"; d.prepend(o);
}
function graceBanner() { if (ACCESS.readOnly && !p8$("#p8-gr")) { const b = el("⚠ انتهى اشتراك شركتك — وضع قراءة فقط لمدة 72 ساعة ثم يُقفل النظام. جدّد الآن.", "bg-red-600 text-white text-center text-sm font-bold p-2"); b.id = "p8-gr"; p8$("#app").prepend(b); } }
P8.sessionConflict = ex => new Promise(res => { const o = modal("الحساب مفتوح على جهاز آخر", `<p class="mb-3">الجهاز النشط الآن: <b dir="ltr">${p8h(ex.device || "غير معروف")}</b></p><button id="sc-y" class="btn w-full mb-2">إنهاء الجلسة الأخرى والدخول من هذا الجهاز</button><button id="sc-n" class="btn-dark w-full">إلغاء</button>`); p8$("#sc-y", o).onclick = () => { o.remove(); res(true); }; p8$("#sc-n", o).onclick = () => { o.remove(); res(false); }; });
function csvImport() {
  if (p8$("#p8-csv") || !p8$("#view-vehicles") || !(ACCESS.perms && (ACCESS.perms.canAddEquipment || ACCESS.perms.isWorkspaceAdmin) || ACCESS.role === "dev" || ACCESS.role === "admin")) return;
  const b = el(`<label class="btn-dark text-sm cursor-pointer inline-block">استيراد معدات من CSV<input type="file" accept=".csv" hidden></label>`, "mb-3"); b.id = "p8-csv"; p8$("#view-vehicles").prepend(b);
  b.querySelector("input").onchange = async e => { const f = e.target.files[0]; if (!f) return; const rows = (await f.text()).split(/\r?\n/).filter(Boolean).slice(1, 301).map(l => l.split(",").map(x => toEn(x.trim()))); let n = 0; const defOil = (typeof SETTINGS !== "undefined" && SETTINGS.oilInterval) || 250;
    for (const r of rows) { if (!r[0]) continue; try { await S.save("vehicles", { number: r[0], type: r[1] || "", status: "active", hours: 0, lastOil: 0, oilInterval: defOil }); n++; } catch (x) {} } alert(`تم استيراد ${n} معدة (الأعمدة: الرقم، النوع).`); if (typeof loadData === "function") loadData(); };
}
function eodButton() {
  if (p8$("#p8-eod") || p8$("#wa-report-btn") || !p8$("#view-dashboard")) return; const b = el(`<button class="btn-dark text-sm">ملخص نهاية اليوم لواتساب</button>`, "mb-3"); b.id = "p8-eod"; p8$("#view-dashboard").prepend(b);
  b.onclick = () => { const td = new Date().toDateString(), isT = r => new Date(r.date || r.createdAt || 0).toDateString() === td, x = k => xbiz.filter(r => r.kind === k); const fuel = x("fuelout").filter(isT).reduce((a, r) => a + (+r.liters || +r.qty || 0), 0);
    window.open(waLink(`*ملخص اليوم — ${new Date().toLocaleDateString("ar-EG")}*\nعمليات اليوم: ${operations.filter(isT).length}\nالسولار المنصرف: ${Math.round(fuel)} لتر\nأعطال مسجلة: ${x("downtime").length}`), "_blank"); };
}
function tour() {
  if (!ACCESS.uid || localStorage.getItem("p8tour-" + ACCESS.uid)) return; localStorage.setItem("p8tour-" + ACCESS.uid, 1);
  const st = ["الرئيسية: ملخص شركتك وأهم الأرقام.", "المعدات والمصروفات: سجّل كل معدة وكل صرف.", "المساعد الذكي والفريق: الأيقونة 💬 أسفل الشاشة."]; let i = 0, o;
  const draw = () => { o && o.remove(); o = modal("جولة سريعة", `<p class="mb-3">${st[i]}</p><button class="btn w-full">${i < st.length - 1 ? "التالي" : "ابدأ"}</button>`); o.querySelector(".btn").onclick = () => { i++; i < st.length ? draw() : o.remove(); }; }; draw();
}
function auditTools() {
  const v = p8$("#view-audit"); if (!v || p8$("#p8-af", v) || p8$("#au-col", v)) return; const f = el(`<div class="grid grid-cols-2 gap-2 mb-2"><input id="af-u" class="inp" placeholder="الموظف (بريد)"><input id="af-a" class="inp" placeholder="نوع العملية"><input id="af-d" type="date" class="inp"><button id="af-x" class="btn-dark text-sm">تصدير CSV</button></div>`); f.id = "p8-af"; v.prepend(f);
  p8$("#af-x").onclick = async () => { const u = p8$("#af-u").value.toLowerCase(), a = p8$("#af-a").value, d = p8$("#af-d").value; const rows = (await S.list("audit_logs")).filter(r => (!u || String(r.email || r.user || "").toLowerCase().includes(u)) && (!a || String(r.action || r.op || "").includes(a)) && (!d || new Date(r.at || 0).toISOString().slice(0, 10) === d));
    const csv = "\ufeffالوقت,الموظف,العملية,التفاصيل\n" + rows.map(r => [new Date(r.at || 0).toISOString(), r.email || r.user || "", r.action || r.op || "", String(r.detail || r.details || r.col || "").replace(/[\r\n,]/g, " ")].join(",")).join("\n"), l = document.createElement("a"); l.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); l.download = "audit.csv"; l.click(); };
}
/* ================= تشغيل ================= */
(async function initP8() {
  if (await verifyGate()) return; buildLanding();
  let started = 0; const iv = setInterval(() => { if (!ACCESS.uid || p8$("#app").classList.contains("hidden")) return; clearInterval(iv); if (started++) return;
    setTimeout(() => { buildChat8(); guardTabs(); onboarding(); graceBanner(); devKeysUI(); csvImport(); eodButton(); auditTools(); tour();
      if (typeof vehicles !== "undefined" && !vehicles.length && ACCESS.role !== "dev") P8.bubble && P8.bubble("ابدأ بإضافة أول معدة لشركتك 👇");
    }, 2500); }, 500);
  setTimeout(() => { if (P8.landing && !ACCESS.uid) { const b = p8$("#landing") && p8$("#landing:not(.hidden)"); if (b && !p8$("#p8-vb")) { const x = el("جرّب حاسبة التوفير ⬆ أو ابدأ تجربتك المجانية", "fixed bottom-20 left-4 z-40 bg-white border rounded-2xl shadow p-3 text-sm max-w-[220px]"); x.id = "p8-vb"; document.body.append(x); setTimeout(() => x.remove(), 9000); } } }, 10000);
})();
