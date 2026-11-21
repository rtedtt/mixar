/* landing.js — الواجهة التعريفية للزوار + بوابة التحقق العام (?verify=CODE) */
(function () {
  const $ = s => document.querySelector(s), esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const WA = "201128079357", vcode = (new URLSearchParams(location.search).get("verify") || "").trim().toUpperCase().slice(0, 40);
  let seen = false; try { seen = !!localStorage.getItem("mixar-seen-login"); } catch (e) {}
  if (seen && !vcode) return;                                            // من سجّل دخوله من قبل يذهب مباشرة للنظام
  let P = { plans: { month: { base: 250, disc: 100 }, quarter: { base: 650, disc: 300 }, year: { base: 2400, disc: 600 } }, discountEndsAt: 0, promos: {} }, promo = 0, plan = "";
  const LB = { month: ["الباقة الشهرية", "30 يوماً"], quarter: ["الباقة ربع السنوية", "90 يوماً"], year: ["الباقة السنوية", "365 يوماً"] };
  const ROLES = { owner: ["صاحب الشركة", [["معدات تعمل", "18 / 22"], ["مصروفات الشهر", "245,000 ج.م"], ["أعطال مفتوحة", "3"], ["اشتراك الشركة", "نشط"]]], acc: ["المحاسب", [["عُهد مفتوحة", "7"], ["فواتير بانتظار المراجعة", "12"], ["مصروف السولار اليوم", "38,400 ج.م"], ["تقرير الشهر", "جاهز"]]], shop: ["مدير الورشة", [["أوامر شغل مفتوحة", "5"], ["معدات تجاوزت موعد الزيت", "2"], ["قطع غيار ناقصة", "4"], ["صيانة هذا الأسبوع", "9"]]], site: ["مراقب الموقع", [["خلاطات في الموقع", "6"], ["صبّات اليوم", "14"], ["سولار مصروف", "1,250 لتر"], ["معدات خارج الخدمة", "1"]]] };
  const wa = t => `https://wa.me/${WA}?text=` + encodeURIComponent(t);
  const el = document.createElement("div"); el.id = "landing"; el.dir = "rtl";
  el.className = "fixed inset-0 z-[60] overflow-y-auto bg-white text-slate-800";
  el.innerHTML = `
  <header class="sticky top-0 z-10 bg-white/95 border-b flex items-center justify-between px-4 h-14"><div class="flex items-center gap-2"><img src="icon.png" alt="Mixar" class="h-9 w-9 object-contain" onerror="this.remove()"><b style="color:#1e3a5f">ميكسار <span style="color:#e85d04">Mixar</span></b></div><button data-enter class="rounded-xl px-4 py-2 font-extrabold text-white" style="background:#e85d04">دخول النظام</button></header>
  <section class="px-4 py-10 text-center" style="background:linear-gradient(160deg,#1e3a5f,#274b78);color:#fff"><svg viewBox="0 0 120 70" class="h-20 mx-auto mb-3" aria-hidden="true"><circle cx="86" cy="30" r="20" fill="none" stroke="#e85d04" stroke-width="8" stroke-dasharray="9 6"/><path d="M10 52V18l22 22 22-22v34" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg>
    <h1 class="text-2xl font-black">إدارة محطات الخرسانة والأسفلت والمعدات في مكان واحد</h1><p class="mt-2 opacity-90">سولار، أعطال، صيانة، عُهد، مخزن، وتقارير — بصلاحيات وعزل كامل لبياناتك.</p><button data-enter class="mt-5 rounded-xl px-6 py-3 font-extrabold" style="background:#e85d04">ابدأ الآن</button></section>
  <main class="max-w-3xl mx-auto p-4 space-y-8">
   <section class="border rounded-2xl p-4 space-y-2"><h2 class="font-extrabold text-lg" style="color:#1e3a5f">احسب توفيرك المتوقع</h2><div class="grid grid-cols-3 gap-2"><input id="r-eq" type="number" min="0" placeholder="عدد المعدات" class="border rounded-xl p-2"><input id="r-l" type="number" min="0" placeholder="لتر/يوم لكل معدة" class="border rounded-xl p-2"><input id="r-p" type="number" min="0" value="12" placeholder="سعر اللتر" class="border rounded-xl p-2"></div><div id="r-out" class="font-bold" style="color:#e85d04"></div><p class="text-xs text-slate-500">تقدير افتراضي: هدر 6% من السولار يمكن تقليله بالمتابعة. النتيجة تقريبية وليست وعداً.</p></section>
   <section class="border rounded-2xl p-4"><h2 class="font-extrabold text-lg mb-2" style="color:#1e3a5f">جرّب لوحة حسب دورك (بيانات تجريبية)</h2><div class="flex flex-wrap gap-2 mb-3">${Object.entries(ROLES).map(([k, r]) => `<button data-role="${k}" class="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-sm">${r[0]}</button>`).join("")}</div><div id="sim" class="grid grid-cols-2 gap-2"></div></section>
   <section><h2 class="font-extrabold text-lg mb-2" style="color:#1e3a5f">الباقات</h2><div id="lp-cd" class="text-sm font-bold mb-2" style="color:#e85d04"></div><div class="flex gap-2 mb-3"><input id="lp-promo" placeholder="كود خصم / إحالة" class="border rounded-xl p-2 flex-1"><button id="lp-apply" class="rounded-xl px-4 bg-slate-800 text-white font-bold">تطبيق</button></div><div id="lp-plans" class="grid sm:grid-cols-3 gap-3"></div></section>
   <section class="border rounded-2xl p-4 space-y-2"><h2 class="font-extrabold text-lg" style="color:#1e3a5f">اطلب تجربة مجانية / اشتراكاً</h2><form id="lp-form" class="grid sm:grid-cols-2 gap-2"><input name="company" required placeholder="اسم الشركة" class="border rounded-xl p-2"><select name="type" class="border rounded-xl p-2"><option>خرسانة جاهزة</option><option>خلاطة أسفلت</option><option>معدات ومقاولات</option></select><input name="name" required placeholder="اسم المدير" class="border rounded-xl p-2"><input name="phone" required placeholder="رقم الهاتف" class="border rounded-xl p-2"><input name="email" type="email" placeholder="البريد (اختياري)" class="border rounded-xl p-2"><select name="plan" class="border rounded-xl p-2"><option value="trial">تجربة مجانية 30 يوماً</option>${Object.entries(LB).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("")}</select><button class="sm:col-span-2 rounded-xl py-3 font-extrabold text-white" style="background:#1e3a5f">إرسال الطلب وفتح واتساب</button></form></section>
   <section><h2 class="font-extrabold text-lg mb-2" style="color:#1e3a5f">ميكسار مقابل الدفاتر والإكسل</h2><table class="w-full text-sm text-right border"><tr class="bg-slate-100"><th class="p-2"></th><th>ميكسار</th><th>دفاتر / إكسل</th></tr>${[["تنبيهات الزيت والصيانة", "تلقائية", "يدوية"], ["صلاحيات وعزل المواقع", "نعم", "لا"], ["سجل تدقيق لكل تعديل", "نعم", "لا"], ["العمل من الموبايل وأوفلاين", "نعم", "محدود"], ["تقارير فورية", "نعم", "جهد يدوي"]].map(r => `<tr class="border-t"><td class="p-2">${r[0]}</td><td class="font-bold text-green-700">${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</table></section>
   <section><h2 class="font-extrabold text-lg mb-2" style="color:#1e3a5f">الأسئلة الشائعة</h2>${[["هل بياناتي معزولة عن الشركات الأخرى؟", "نعم، لكل شركة مساحة عمل مستقلة وقواعد أمان تمنع أي اطلاع خارجها."], ["ماذا يحدث عند انتهاء الاشتراك؟", "تُقفل الإضافة والتعديل وتبقى بياناتك محفوظة وتُستعاد بالتجديد."], ["هل يعمل بدون إنترنت؟", "نعم، الصفحات الأساسية تعمل أوفلاين وتتزامن لاحقاً."], ["كيف أدفع؟", "عبر محفظة اتصالات كاش، ثم تأكيد عبر واتساب أو نموذج التجديد داخل النظام."]].map(f => `<details class="border rounded-xl p-3 mb-2"><summary class="font-bold cursor-pointer">${f[0]}</summary><p class="mt-2 text-sm text-slate-600">${f[1]}</p></details>`).join("")}</section>
  </main>
  <footer class="text-center text-xs text-slate-500 p-6">© ميكسار · <button data-terms class="underline">الشروط وسياسة الخصوصية</button></footer>
  <a id="lp-wa" target="_blank" rel="noopener" class="fixed bottom-4 right-4 z-20 rounded-full w-14 h-14 grid place-items-center text-2xl text-white shadow-lg" style="background:#25d366" href="#">💬</a>`;
  document.body.appendChild(el);
  const money = (p, k) => { const pl = P.plans[k], on = (P.discountEndsAt || 0) > Date.now(); let v = on ? pl.disc : pl.base; if (promo) v = Math.round(v * (1 - promo / 100)); return { v, on, base: pl.base }; };
  const setWa = () => { $("#lp-wa").href = wa(plan ? `مرحباً، أرغب في الاستفسار عن ${plan} في ميكسار` : "مرحباً، أرغب في الاستفسار عن ميكسار"); };
  function renderPlans() {
    $("#lp-plans").innerHTML = Object.entries(LB).map(([k, l]) => { const m = money(P, k); return `<div data-plan="${l[0]}" class="border rounded-2xl p-4 text-center"><b>${l[0]}</b><div class="text-xs text-slate-500">${l[1]}</div><div class="mt-2">${m.on || promo ? `<s class="text-slate-400">${m.base}</s> ` : ""}<b class="text-xl" style="color:#e85d04">${m.v} ج.م</b></div></div>`; }).join("");
    document.querySelectorAll("#lp-plans [data-plan]").forEach(c => c.onclick = () => { plan = c.dataset.plan; setWa(); });
  }
  function tick() { const d = (P.discountEndsAt || 0) - Date.now(); $("#lp-cd").textContent = d > 0 ? `ينتهي العرض بعد ${Math.floor(d / 864e5)} يوم ${Math.floor(d % 864e5 / 36e5)} ساعة ${Math.floor(d % 36e5 / 6e4)} دقيقة` : ""; }
  const roi = () => { const e = +$("#r-eq").value || 0, l = +$("#r-l").value || 0, p = +$("#r-p").value || 0, m = e * l * 30 * p * 0.06; $("#r-out").textContent = m ? `هدر شهري متوقع قابل للتوفير: ${Math.round(m).toLocaleString("en-US")} ج.م — سنوياً: ${Math.round(m * 12).toLocaleString("en-US")} ج.م` : ""; };
  const sim = k => { $("#sim").innerHTML = ROLES[k][1].map(x => `<div class="border rounded-xl p-3 text-center"><div class="text-lg font-extrabold" style="color:#1e3a5f">${x[1]}</div><div class="text-xs text-slate-500">${x[0]}</div></div>`).join(""); };
  ["r-eq", "r-l", "r-p"].forEach(i => $("#" + i).oninput = roi);
  el.querySelectorAll("[data-role]").forEach(b => b.onclick = () => sim(b.dataset.role)); sim("owner");
  $("#lp-apply").onclick = () => { const c = $("#lp-promo").value.trim().toUpperCase(); promo = +((P.promoList || []).find(x => x.code === c) || {}).pct || 0; if (!promo && c) alert("كود غير صالح."); renderPlans(); };
  el.querySelectorAll("[data-enter]").forEach(b => b.onclick = () => { el.style.display = "none"; });
  el.querySelector("[data-terms]").onclick = () => alert("الشروط: الاشتراك شهري/ربع سنوي/سنوي، وعند انتهائه تُقفل الإضافة والتعديل وتبقى بياناتك محفوظة.\nالخصوصية: بياناتك ملك شركتك ومعزولة عن غيرها، ولا نبيعها ولا نشاركها. يُراجَع هذا النص قانونياً قبل الاعتماد.");
  $("#lp-form").onsubmit = async e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), s = (x, n) => String(x || "").trim().slice(0, n);
    const d = { company: s(f.company, 90), type: s(f.type, 40), name: s(f.name, 60), phone: s(f.phone, 20), email: s(f.email, 80), plan: s(f.plan, 12), status: "pending", at: Date.now() };
    try { if (window.S && S.rawAdd) await S.rawAdd("signup_requests", d); } catch (er) {}
    window.open(wa(`طلب ${d.plan === "trial" ? "تجربة مجانية" : "اشتراك"} في ميكسار\nالشركة: ${d.company}\nالنشاط: ${d.type}\nالمدير: ${d.name}\nالهاتف: ${d.phone}\nالباقة: ${d.plan === "trial" ? "تجربة 30 يوماً" : LB[d.plan][0]}`), "_blank");
  };
  window.hideLanding = () => { el.remove(); try { localStorage.setItem("mixar-seen-login", "1"); } catch (e) {} };
  renderPlans(); setWa(); setInterval(tick, 30000);
  let tries = 0; const wait = setInterval(async () => {                    // الأسعار وبطاقة التحقق من Firestore عند جاهزية الاتصال
    if (++tries > 40) return clearInterval(wait); if (!(window.S && S.get)) return; clearInterval(wait);
    try { const d = await S.get("app_config", "pricing"); if (d) { P = { ...P, ...d, plans: { ...P.plans, ...(d.plans || {}) } }; renderPlans(); tick(); } } catch (e) {}
    if (vcode) {
      let r = null; try { r = await S.get("public_verifications", vcode); } catch (e) {}
      const o = document.createElement("div"); o.className = "fixed inset-0 z-[70] bg-black/60 grid place-items-center p-4"; o.dir = "rtl";
      o.innerHTML = `<div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-2"><div class="text-4xl">${r ? "✅" : "❌"}</div><h3 class="font-extrabold text-lg">${r ? "وثيقة موثّقة من ميكسار" : "لم يُعثر على هذا الكود"}</h3>${r ? `<div class="text-sm space-y-1"><div><b>${esc(r.title || r.type)}</b></div><div>التاريخ: ${esc(r.date || "")}</div><div>الجهة: ${esc(r.issuer || "")}</div>${r.site ? `<div>الموقع: ${esc(r.site)}</div>` : ""}<div>الحالة: ${esc(r.status || "")}</div></div>` : ""}<div class="text-xs text-slate-500">كود التحقق: ${esc(vcode)}</div><button class="rounded-xl px-5 py-2 font-bold text-white" style="background:#1e3a5f">إغلاق</button></div>`;
      o.querySelector("button").onclick = () => o.remove(); document.body.appendChild(o);
    }
  }, 300);
})();
