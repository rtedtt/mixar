/* access.js (v17) — التسجيل الذاتي واعتماد الحسابات | يعتمد على app.js (S, $, esc, smartName, show) */
const DEV_EMAIL = "belalbelalmoh@gmail.com", ADMIN_EMAIL = "no-admin@invalid";   // المالك فقط؛ لا حساب مدير ثابت في مشروع SaaS
const ACCESS = { role: "", site: "", appRole: "" };
const ownerRole = e => { e = String(e || "").toLowerCase(); return e === DEV_EMAIL ? "dev" : e === ADMIN_EMAIL ? "admin" : ""; };
const ACC_ROLES = { accountant: "محاسب / مهندس موقع", admin: "مدير" };
const accUsers = () => urs;

/* ---------- شاشة الدخول: تبديل / إنشاء حساب / نسيت كلمة المرور ---------- */
(function injectLoginUI() {
  const btn = $("#login-btn"); if (!btn) return;
  const inp = (id, ph, t = "text") => `<input id="${id}" type="${t}" placeholder="${ph}" class="inp mb-2" ${t !== "text" ? 'dir="ltr"' : ""}>`;
  const reg = document.createElement("div");
  reg.id = "reg-box"; reg.className = "hidden";
  reg.innerHTML = `<select id="reg-kind" class="inp mb-2"><option value="co">تسجيل شركة جديدة (تجربة مجانية 30 يوماً)</option><option value="join">الانضمام إلى شركة مسجلة</option></select>
    <div data-k="co">${inp("reg-co", "اسم الشركة")}<select id="reg-type" class="inp mb-2"><option>خرسانة جاهزة</option><option>خلاطة أسفلت</option><option>معدات ومقاولات</option></select>${inp("reg-phone", "رقم الهاتف", "tel")}</div>
    <div data-k="join" class="hidden">${inp("reg-code", "كود الشركة (مثال MX-1001)")}${inp("reg-job", "المهنة")}</div>
    ${inp("reg-name", "الاسم بالكامل")}${inp("reg-email", "البريد الإلكتروني", "email")}<p class="text-xs text-orange-700 mb-2">تنبيه: اكتب أي بريد افتراضي مثل name@gmail.com — لا تكتب بريدك الشخصي الحقيقي أو كلمة مرورك الحقيقية.</p>${inp("reg-pass", "كلمة المرور (6 أحرف على الأقل)", "password")}
    <button type="button" id="reg-btn" class="btn w-full">إنشاء الحساب</button>`;
  btn.before(reg);
  const links = document.createElement("div");
  links.className = "mt-3 flex justify-between text-sm font-bold text-orange-600";
  links.innerHTML = `<button type="button" id="to-reg">إنشاء حساب جديد</button><button type="button" id="to-forgot">نسيت كلمة المرور؟</button>`;
  btn.after(links);
  let mode = "login";
  const setMode = m => {
    mode = m;
    $("#reg-box").classList.toggle("hidden", m !== "reg");
    ["#email", "#password", "#login-btn"].forEach(s => { const el = $(s); (el.previousElementSibling && el.tagName === "INPUT" ? [el.previousElementSibling, el] : [el]).forEach(x => x.classList.toggle("hidden", m === "reg")); });
    $("#to-reg").textContent = m === "reg" ? "لدي حساب — تسجيل الدخول" : "إنشاء حساب جديد";
    $("#login-error").classList.add("hidden");
  };
  const fail = m => { const e = $("#login-error"); e.textContent = m; e.classList.remove("hidden"); };
  $("#to-reg").onclick = () => setMode(mode === "reg" ? "login" : "reg");
  $("#to-forgot").onclick = async () => {
    const who = (prompt("اكتب اسمك أو بريدك الافتراضي ليصل طلبك للمطور:") || "").trim(); if (!who) return;
    if (!S.rawAdd) return fail("متاح مع Firebase فقط.");
    try { await S.rawAdd("password_requests", { who: who.slice(0, 90), device: deviceInfo().slice(0, 180), at: Date.now(), status: "open" }); alert("تم إرسال طلبك للمطور."); }
    catch (ex) { fail("تعذر إرسال الطلب (" + (ex.code || "") + ")"); }
  };
  $("#reg-kind").onchange = () => document.querySelectorAll("[data-k]").forEach(d => d.classList.toggle("hidden", d.dataset.k !== $("#reg-kind").value));
  $("#reg-btn").onclick = async () => {
    const b = $("#reg-btn"), v = id => (($("#" + id) || {}).value || "").trim(), kind = v("reg-kind");
    const name = v("reg-name"), email = v("reg-email"), pass = $("#reg-pass").value, co = v("reg-co"), phone = v("reg-phone"), code = v("reg-code").toUpperCase(), job = v("reg-job");
    if (!name || !email || pass.length < 6 || (kind === "co" ? !co || !phone : !code || !job)) return fail("أكمل كل الحقول (كلمة المرور 6 أحرف على الأقل).");
    if (!S.register) return fail("إنشاء الحساب يعمل مع Firebase فقط.");
    b.disabled = true;
    try {
      let target = null;
      if (kind === "join") { target = await S.get("codes", code); if (!target) { b.disabled = false; return fail("كود الشركة غير صحيح."); } }
      const u = await S.register(email, pass), uid = u.user.uid, base = { kind: "user", name, email: email.toLowerCase(), phone, device: deviceInfo(), createdAt: Date.now() };
      if (kind === "co") {
        const c = "MX-" + (1000 + Math.floor(Math.random() * 9000));
        await S.rawSet("codes", c, { ws: uid });
        await S.rawSet("companies", uid, { name: co, code: c, type: v("reg-type"), phone, plan: "trial", status: "active", expiresAt: Date.now() + 30 * 864e5, createdAt: Date.now() });
        await S.rawSet("biz", uid, { ...base, job: "مدير الشركة", role: "admin", status: "active", ws: uid, wsName: co, perms: { ...DEFAULT_PERMS, isWorkspaceAdmin: true } });
      } else await S.rawSet("biz", uid, { ...base, job, role: "accountant", status: "pending", ws: target.ws, perms: { ...DEFAULT_PERMS, isWorkspaceAdmin: false } });
      location.reload();
    } catch (ex) { fail(ex.code === "auth/email-already-in-use" ? "هذا البريد مسجّل بالفعل." : "تعذر إنشاء الحساب (" + (ex.code || "") + ")"); }
    b.disabled = false;
  };
})();

/* ---------- البوابة + تخزين الصلاحيات محلياً (تعمل أوفلاين) ---------- */
const DEFAULT_PERMS = { canAddEquipment: true, canEditDeleteEquipment: true, canAddTransactions: true, canEditDeleteTransactions: true, canManageCustody: true, canExportPrint: true, isWorkspaceAdmin: false };
const CK = "fawzy-access";
function applyRec(user, rec, own) {
  ACCESS.name = rec.name || ""; ACCESS.uid = user.uid; ACCESS.email = user.email; ACCESS.role = own || rec.role;
  ACCESS.ws = own ? "main" : (rec.ws || user.uid); ACCESS.perms = rec.perms || DEFAULT_PERMS; ACCESS.site = rec.site || "";
  ACCESS.appRole = own || rec.role === "admin" ? "manager" : "accountant";
  ACCESS.scope = ACCESS.role === "dev" ? (localStorage.getItem("fawzy-scope") || "main") : ACCESS.ws;
  try { localStorage.setItem(CK, JSON.stringify({ uid: user.uid, own, rec: { role: ACCESS.role, ws: ACCESS.ws, perms: ACCESS.perms, site: ACCESS.site, status: "active" } })); } catch (e) {}
  applyPermUI();
}
async function accessGate(user) {
  $("#pending")?.remove();
  if (!S.get) return true;                                              // الوضع التجريبي بدون Firebase
  const own = ownerRole(user.email); let c = null;
  try { c = JSON.parse(localStorage.getItem(CK)); } catch (e) {}
  if (c && c.uid !== user.uid) c = null;
  if (!navigator.onLine && c) { applyRec(user, c.rec, c.own); return true; }   // أوفلاين: الصلاحيات المحفوظة فوراً
  let rec = null, ok = false;
  try { rec = await S.get("biz", user.uid); ok = true; } catch (e) { console.warn("gate", e && e.code); }
  if (!ok && c) { applyRec(user, c.rec, c.own); return true; }
  if (own) {                                                             // مطور / مدير ثابتان: تفعيل تلقائي
    const all = Object.fromEntries(Object.keys(DEFAULT_PERMS).map(k => [k, true]));
    if (ok && (!rec || rec.status !== "active" || rec.role !== own || rec.ws !== "main"))
      try { await S.rawSet("biz", user.uid, { kind: "user", name: rec?.name || (own === "dev" ? "المطور" : "المدير"), email: user.email.toLowerCase(), role: own, status: "active", ws: "main", perms: all }); } catch (e) { console.warn(e); }
    applyRec(user, { perms: all }, own); return true;
  }
  if (rec && rec.status === "active") { applyRec(user, rec); return true; }
  try { localStorage.removeItem(CK); } catch (e) {}
  const st = rec && rec.status, off = st === "disabled" || st === "suspended", can = st === "cancelled", el = document.createElement("section");
  el.id = "pending"; el.className = "fixed inset-0 z-50 grid place-items-center bg-slate-900 p-4";
  el.innerHTML = `<div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4"><div class="text-4xl">${can ? "🚫" : off ? "⛔" : "⏳"}</div>
    <h2 class="font-extrabold">${can ? "تم إلغاء حسابك، يرجى التواصل مع الإدارة" : off ? "تم إيقاف حسابك مؤقتاً، يرجى التواصل مع الإدارة" : "تم إرسال طلبك للإدارة وبانتظار التفعيل"}</h2>
    <button id="pd-refresh" class="btn w-full">تحديث الحالة</button><button id="pd-out" class="w-full py-2.5 rounded-xl bg-slate-200 font-bold">تسجيل الخروج</button></div>`;
  document.body.appendChild(el);
  $("#pd-refresh").onclick = () => location.reload();
  $("#pd-out").onclick = async () => { try { localStorage.removeItem(CK); } catch (e) {} await S.logout(); el.remove(); };
  return false;
}

/* ---------- مساحات العمل: ختم السجلات + عزل القراءة ---------- */
const WS_COLS = ["vehicles", "expenses", "advances", "inventory", "operations", "costings", "materials", "acct", "biz"];
function listRef(fs, db, col) {                                          // غير المطور: يقرأ مساحته فقط (where بحقل واحد = بدون Composite Index)
  if (col === "biz@users") return fs.query(fs.collection(db, "biz"), fs.where("kind", "==", "user"), fs.where("ws", "==", ACCESS.ws), fs.where("role", "in", ["accountant", "admin"]), fs.where("status", "in", ["pending", "active", "suspended"]));   // المدير: لا يرى المطور ولا الموقوفين
  const r = fs.collection(db, col);
  return ACCESS.role && ACCESS.role !== "dev" && WS_COLS.includes(col) ? fs.query(r, fs.where("workspaceId", "==", ACCESS.ws)) : r;
}
function stampNew(col, d) {
  return ["users", "auditlog", "password_requests", "dev_logs", "chat_msgs", "presence", "app_config"].includes(col) ? d : { workspaceId: ACCESS.scope || "main", createdBy: ACCESS.email || "", ...d };
}
function scopeData() {                                                   // عزل العرض (app.js)
  if (!ACCESS.scope) return;
  const ok = r => (r.workspaceId || "main") === ACCESS.scope;
  vehicles = vehicles.filter(ok); expenses = expenses.filter(ok); advances = advances.filter(ok);
  inventory = inventory.filter(ok); operations = operations.filter(ok);
}
async function scopeExt() {                                              // عزل biz و acct (ext.js) + تحميل الحسابات
  const ok = r => (r.workspaceId || "main") === ACCESS.scope;
  urs = isDev() ? biz.filter(x => x.kind === "user") : [];
  biz = biz.filter(x => x.kind !== "user" && ok(x)); acct = acct.filter(ok);
  if (ACCESS.role === "admin") urs = await listSafe("biz@users");
  if (isDev()) companies = await listSafe("companies"); else await loadCo();
  applyPermUI(); renderAccess(); renderSub(); initChat();
}
const isDev = () => ACCESS.role === "dev", isAdm = () => ACCESS.role === "admin", canPage = () => isDev() || isAdm();
let urs = [], presAll = {};

/* ---------- سجل الأخطاء للمطور ---------- */
let lastLog = 0;
const deviceInfo = () => {
  const u = navigator.userAgent, os = /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Windows/.test(u) ? "Windows" : /Mac/.test(u) ? "Mac" : "Linux/غير معروف";
  const br = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "متصفح";
  return `${os}${((u.match(/Android[^;]*;\s*([^)]+)\)/) || [])[1] || "").trim().replace(/^/, " ")} · ${br}`.replace("  ", " ");
};
window.addEventListener("error", e => {
  if (!ACCESS.uid || !S || !S.rawAdd || Date.now() - lastLog < 5000) return; lastLog = Date.now();
  S.rawAdd("dev_logs", { user: ACCESS.email, page: document.querySelector(".view:not(.hidden)")?.id || "", device: deviceInfo(), msg: String(e.message || e).slice(0, 400), at: Date.now() }).catch(() => {});
});

/* ---------- صفحة إدارة الحسابات والصلاحيات (المطور فقط) ---------- */
const PERM_LABELS = { canAddEquipment: "إضافة معدات", canEditDeleteEquipment: "تعديل/حذف المعدات", canAddTransactions: "تسجيل مصروفات وساعات", canEditDeleteTransactions: "تعديل/حذف الحركات", canManageCustody: "إدارة العُهد", canExportPrint: "تصدير وطباعة", isWorkspaceAdmin: "إدارة مساحة العمل" };
const TABS = { plat: "المنصة والشركات", req: "طلبات الاعتماد", forgot: "استعادة الدخول", acc: "الحسابات والصلاحيات", dev: "لوحة المطور" };
let accTab = "plat", accData = { pr: [], logs: [] };
const dt = t => t ? new Date(t).toLocaleString("ar-EG") : "";

function renderAccess() {
  const nav = $("#nav-accounts"); if (nav) nav.classList.toggle("hidden", !canPage());
  if (!canPage()) return;
  let note = $("#acc-note"), sel = $("#scope-sel");
  if (!note) {
    note = document.createElement("div"); note.id = "acc-note";
    note.className = "hidden p-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-sm font-bold cursor-pointer";
    note.onclick = () => { accTab = "req"; show("accounts"); renderAccounts(); };
    $("#view-dashboard").prepend(note);
    sel = document.createElement("select"); sel.id = "scope-sel"; sel.className = "inp !py-1 !w-auto text-xs max-w-[11rem]";
    $("header").lastElementChild.before(sel);
    sel.onchange = () => { ACCESS.scope = sel.value; localStorage.setItem("fawzy-scope", sel.value); loadData(); };
    document.addEventListener("click", ev => { if (ev.target.closest('[data-nav="accounts"]')) renderAccounts(); });
    $("#view-accounts").onclick = accClick; $("#view-accounts").onchange = accChange;
  }
  sel.classList.toggle("hidden", !isDev());
  const users = accUsers(), pend = users.filter(u => u.status === "pending");
  note.classList.toggle("hidden", !pend.length); note.textContent = `⏳ ${pend.length} حساب جديد بانتظار الاعتماد — اضغط للمراجعة`;
  const groups = {}; companies.forEach(c => { if (c.id !== "main") groups[c.id] = c.name + " · " + c.code; });
  sel.innerHTML = `<option value="main">الخلاطات والأسفلت (النطاق الرئيسي)</option>` + Object.entries(groups).map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("");
  sel.value = groups[ACCESS.scope] || ACCESS.scope === "main" ? ACCESS.scope : "main";
  if (!$("#view-accounts").classList.contains("hidden")) renderAccounts();
}

async function renderAccounts() {
  const v = $("#view-accounts"); if (!v || !canPage()) return;
  if (!isDev() && !["req", "acc"].includes(accTab)) accTab = "req";
  if (isDev() && accTab === "plat") { accData.vs = await S.list("vehicles").catch(() => []); accData.pricing = await getPricing(true); }
  if (isDev() && accTab === "dev") accData.cl = await S.get("app_config", "cloudinary").catch(() => null);
  if (accTab === "forgot") accData.pr = await S.list("password_requests").catch(() => []);
  if (accTab === "dev") accData.logs = (await S.list("dev_logs").catch(() => [])).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 50);
  const users = accUsers(), th = h => `<thead class="text-slate-500 border-b"><tr>${h.map(x => `<th class="py-2">${x}</th>`).join("")}</tr></thead>`;
  const btn = (a, id, t, c) => `<button data-a="${a}" data-id="${esc(id)}" class="${c} font-bold ml-3">${t}</button>`;
  let body = "";
  if (accTab === "plat") body = pricingCard() + `<div class="flex flex-wrap gap-2 mb-3 items-end"><input id="nc-name" class="inp !w-auto" placeholder="اسم الشركة"><select id="nc-type" class="inp !w-auto"><option>خرسانة جاهزة</option><option>خلاطة أسفلت</option><option>معدات ومقاولات</option></select><input id="nc-days" type="number" value="30" class="inp !w-24"><button data-a="newco" class="btn">إنشاء شركة</button></div><table class="w-full text-sm text-right">${th(["الشركة", "الكود", "النشاط", "المعدات", "المستخدمون", "الحالة", "الأيام", ""])}<tbody>` + companies.map(c => { const d = dayLeft(c), n = (accData.vs || []).filter(x => (x.workspaceId || "main") === c.id).length, us = accUsers().filter(x => (x.ws || "main") === c.id).length; return `<tr class="border-b"><td class="py-2 font-bold">${esc(c.name)}</td><td dir="ltr">${esc(c.code)}</td><td>${esc(c.type || "")}</td><td>${n}</td><td>${us}</td><td>${c.status === "active" && d > 0 ? "✅ نشط" : "🔒 مقفل"}</td><td>${d}</td><td class="whitespace-nowrap">${[30, 90, 365].map(x => btn("ext" + x, c.id, "+" + x, "text-green-700")).join("")}${btn("extx", c.id, "مخصص", "text-slate-600")}${btn("cotog", c.id, c.status === "active" ? "إيقاف" : "تفعيل", "text-red-600")}</td></tr>`; }).join("") + `</tbody></table>`;
  if (accTab === "req") body = `<table class="w-full text-sm text-right">${th(["الاسم / الوظيفة", "الموقع", "البريد", "الجهاز", ""])}<tbody>` +
    (users.filter(u => u.status === "pending").map(u => `<tr class="border-b"><td class="py-2"><b>${esc(u.name)}</b><div class="text-xs text-slate-500">${esc(u.job || "")}</div><div class="text-xs mt-1">⏳ قيد الانتظار</div></td><td>${esc(u.site || "")}</td><td dir="ltr" class="text-xs">${esc(u.email)}</td><td class="text-xs">${esc(u.device || "")}</td><td class="whitespace-nowrap">${btn("ok", u.id, "قبول", "text-green-700")}${btn("del", u.id, "رفض", "text-red-600")}</td></tr>`).join("") || `<tr><td colspan="5" class="py-4 text-slate-500">لا توجد طلبات.</td></tr>`) + `</tbody></table>`;
  if (accTab === "forgot") body = `<table class="w-full text-sm text-right">${th(["الاسم / البريد", "الجهاز", "التاريخ", ""])}<tbody>` +
    (accData.pr.filter(r => r.status === "open").map(r => `<tr class="border-b"><td class="py-2 font-bold">${esc(r.who)}</td><td class="text-xs">${esc(r.device)}</td><td class="text-xs">${dt(r.at)}</td><td>${btn("done", r.id, "تم الحل", "text-green-700")}</td></tr>`).join("") || `<tr><td colspan="4" class="py-4 text-slate-500">لا توجد طلبات.</td></tr>`) + `</tbody></table>
    <p class="text-xs text-slate-500 mt-3">لحل الطلب: من Firebase Console ← Authentication احذف المستخدم ليسجّل من جديد بنفس البريد، ثم اعتمده وانقله لمساحته القديمة من تبويب «الحسابات».</p>`;
  if (accTab === "acc") {
    const act = users.filter(u => u.status !== "pending");
    body = (isDev() || !myCo ? "" : `<div class="flex gap-2 mb-3"><input id="co-name" class="inp" value="${esc(myCo.name)}"><button data-a="conname" class="btn">حفظ اسم الشركة</button></div><div class="text-xs text-slate-500 mb-3">كود شركتك للانضمام: <b dir="ltr">${esc(myCo.code)}</b></div>`) + `<div class="space-y-3">` + act.map(u => { const fx = ownerRole(u.email), p = u.perms || DEFAULT_PERMS; return `<div class="border rounded-xl p-3"><div class="flex flex-wrap justify-between gap-2 items-center"><label class="font-bold">${fx ? "" : `<input type="checkbox" data-lk="${esc(u.id)}" class="ml-2">`}${esc(u.name)} <span class="text-xs text-slate-500" dir="ltr">${esc(u.email)}</span></label><span class="text-xs">${STAT[u.status] || STAT.suspended} · ${fx ? "نطاق رئيسي" : esc(u.wsName || (u.ws === u.id ? "مستقل" : u.ws || ""))}${isDev() ? " · " + presTxt(u.id) : ""}</span></div>` +
      (fx ? "" : `<div class="grid sm:grid-cols-2 gap-1 mt-2 text-sm">${Object.entries(PERM_LABELS).map(([k, l]) => `<label><input type="checkbox" data-perm="${k}" data-id="${esc(u.id)}" ${p[k] ? "checked" : ""} class="ml-2">${l}</label>`).join("")}</div><div class="mt-2">${u.role === "admin" && !isDev() ? "" : u.status === "active" ? btn("susp", u.id, "توقيف مؤقت", "text-orange-700") + btn("cancel", u.id, "إلغاء الحساب", "text-red-600") : btn("react", u.id, "إعادة تفعيل", "text-green-700") + (u.status === "cancelled" ? "" : btn("cancel", u.id, "إلغاء الحساب", "text-red-600"))}${isDev() ? btn("unlink", u.id, "فك الارتباط", "text-slate-600") + (u.role !== "admin" ? btn("promote", u.id, "ترقية لمدير شركة", "text-blue-700") : "") : ""}</div>`) + `</div>`; }).join("") +
      `</div><div class="mt-3 flex flex-wrap gap-2 items-end ${isDev() ? "" : "hidden"}"><input id="lk-name" class="inp !w-auto" placeholder="اسم المجموعة (مثال: موقع أبو رواش)"><button data-a="link" class="btn">ربط المحدَّدين في مساحة مشتركة</button></div>`;
  }
  if (accTab === "dev") body = `<div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">إعدادات رفع الميديا (Cloudinary)</div><div class="grid sm:grid-cols-2 gap-2"><input id="cl-cloud" class="inp" placeholder="Cloud Name" dir="ltr" value="${esc(accData.cl?.cloud || "")}"><input id="cl-preset" class="inp" placeholder="Upload Preset (Unsigned)" dir="ltr" value="${esc(accData.cl?.preset || "")}"></div><button data-a="clsave" class="btn">حفظ</button></div><div class="flex gap-2 flex-wrap mb-3"><button data-a="cache" class="btn">تحديث الكاش إجبارياً</button><button data-a="stamp" class="btn">ختم البيانات السابقة بالنطاق الرئيسي</button></div><table class="w-full text-sm text-right">${th(["الوقت", "المستخدم", "الصفحة", "الجهاز", "الخطأ"])}<tbody>` +
    accData.logs.map(l => `<tr class="border-b text-xs"><td class="py-1">${dt(l.at)}</td><td dir="ltr">${esc(l.user)}</td><td>${esc(l.page)}</td><td>${esc(l.device)}</td><td>${esc(l.msg)}</td></tr>`).join("") + `</tbody></table>`;
  v.innerHTML = `<h2 class="text-xl font-extrabold">إدارة الحسابات والصلاحيات</h2><div class="flex gap-2 flex-wrap">${Object.entries(TABS).filter(([k]) => isDev() || ["req", "acc"].includes(k)).map(([k, l]) => `<button data-tab="${k}" class="px-3 py-1.5 rounded-xl text-sm font-bold ${k === accTab ? "bg-amber-500 text-slate-900" : "bg-slate-200"}">${l}</button>`).join("")}</div><div class="card overflow-x-auto">${body}</div>`;
}

async function accClick(ev) {
  const t = ev.target.closest("[data-tab]"); if (t) { accTab = t.dataset.tab; return renderAccounts(); }
  const b = ev.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, id = b.dataset.id, u = accUsers().find(x => x.id === id);
  b.disabled = true;
  try {
    if (a === "ok") await S.save("biz", isDev() ? { status: "active", ws: u.ws || id, perms: u.perms || DEFAULT_PERMS } : { status: "active" }, id);
    if (a === "del" && confirm("رفض وحذف هذا الطلب؟")) await S.remove("biz", id);
    if (a === "promote") await S.save("biz", { role: "admin", perms: { ...(u.perms || DEFAULT_PERMS), isWorkspaceAdmin: true } }, id);
    if (a === "prsave" || a === "discstart" || a === "discstop") {
      const cur = { ...readPricing() }, now = Date.now();
      if (a === "discstart") { cur.discountStartedAt = now; cur.discountEndsAt = now + cur.discountDays * 864e5; }
      if (a === "discstop") { delete cur.plans; delete cur.discountDays; cur.discountEndsAt = 0; }
      await S.rawSet("app_config", "pricing", cur); pricingCache = null;
    }
    if (/^ext/.test(a)) {
      const c = companies.find(x => x.id === id), days = a === "extx" ? +prompt("عدد الأيام؟", "30") : +a.slice(3);
      if (days > 0) await S.rawSet("companies", id, { expiresAt: Math.max(c.expiresAt || 0, Date.now()) + days * 864e5, plan: days >= 365 ? "year" : days >= 90 ? "quarter" : days >= 30 ? "month" : c.plan || "manual", status: "active" });
    }
    if (a === "cotog") { const c = companies.find(x => x.id === id); await S.rawSet("companies", id, { status: c.status === "active" ? "off" : "active" }); }
    if (a === "conname") { const n = $("#co-name").value.trim(); if (n) await S.rawSet("companies", ACCESS.ws, { name: n }); }
    if (a === "newco") {
      const name = $("#nc-name").value.trim(), days = +$("#nc-days").value || 30; if (!name) { b.disabled = false; return alert("اكتب اسم الشركة."); }
      const wid = "co_" + Date.now().toString(36), code = "MX-" + (1000 + Math.floor(Math.random() * 9000));
      await S.rawSet("codes", code, { ws: wid });
      await S.rawSet("companies", wid, { name, code, type: $("#nc-type").value, plan: "manual", status: "active", expiresAt: Date.now() + days * 864e5, createdAt: Date.now() });
    }
    if (a === "susp") await S.save("biz", { status: "suspended" }, id);
    if (a === "react") await S.save("biz", { status: "active" }, id);
    if (a === "cancel" && confirm("إلغاء هذا الحساب؟ لن تُحذف أي بيانات سجّلها.")) await S.save("biz", { status: "cancelled" }, id);
    if (a === "clsave") { await S.rawSet("app_config", "cloudinary", { cloud: $("#cl-cloud").value.trim(), preset: $("#cl-preset").value.trim() }); cl = null; alert("تم حفظ إعدادات Cloudinary."); }
    if (a === "unlink") await S.save("biz", { ws: id, wsName: "" }, id);
    if (a === "done") { await S.remove("password_requests", id); accData.pr = accData.pr.filter(r => r.id !== id); }
    if (a === "link") {
      const ids = [...document.querySelectorAll("[data-lk]:checked")].map(x => x.dataset.lk), name = cleanName($("#lk-name").value);
      if (ids.length < 2 || !name) { b.disabled = false; return alert("حدّد حسابين على الأقل واكتب اسم المجموعة."); }
      const wid = "ws_" + Date.now().toString(36);
      for (const i of ids) await S.save("biz", { ws: wid, wsName: name }, i);
    }
    if (a === "cache") { (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister()); (await caches.keys()).forEach(k => caches.delete(k)); return location.reload(); }
    if (a === "stamp" && confirm("سيُختم كل سجل بلا نطاق بالنطاق الرئيسي. متابعة؟")) {
      let n = 0; for (const c of WS_COLS) for (const r of await S.list(c)) if (!r.workspaceId && r.kind !== "user") { await S.rawSet(c, r.id, { workspaceId: "main" }); n++; }
      const m = await S.get("companies", "main").catch(() => null);
      if (!m) { await S.rawSet("codes", "MX-1000", { ws: "main" }); await S.rawSet("companies", "main", { name: "شركة فوزي عبده", code: "MX-1000", type: "خرسانة وأسفلت", plan: "legacy", status: "active", expiresAt: Date.now() + 45 * 864e5, createdAt: Date.now() }); }
      alert(`تم ختم ${n} سجل، وتفعيل اشتراك الشركة الرئيسية 45 يوماً.`);
    }
    await loadData();
  } catch (e) { dbErr(e); }
  b.disabled = false; renderAccounts();
}
async function accChange(ev) {
  const c = ev.target.closest("[data-perm]"); if (!c) return;
  try { await S.save("biz", { perms: { [c.dataset.perm]: c.checked } }, c.dataset.id); const u = accUsers().find(x => x.id === c.dataset.id); if (u) u.perms = { ...(u.perms || DEFAULT_PERMS), [c.dataset.perm]: c.checked }; } catch (e) { dbErr(e); c.checked = !c.checked; }
}

/* ---------- حالات الحسابات + الحضور (Presence) + الشات الفوري (Cloudinary) ---------- */
const STAT = { active: "✅ تم القبول (نشط)", suspended: "⏸️ موقوف مؤقتاً", disabled: "⏸️ موقوف مؤقتاً", cancelled: "🚫 حساب ملغي", pending: "⏳ قيد الانتظار" };
const chatWs = () => ACCESS.role === "dev" ? ACCESS.scope : ACCESS.ws;
let chatMsgs = [], cl = null, unsubs = [], beating = false;
const ago = t => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "الآن" : m < 60 ? `منذ ${m} دقيقة` : m < 1440 ? `منذ ${Math.floor(m / 60)} ساعة` : `منذ ${Math.floor(m / 1440)} يوم`; };
const online = p => p && Date.now() - p.at < 100000;
const presTxt = id => { const p = presAll[id]; return !p ? "لم يدخل بعد" : online(p) ? "متصل الآن 🟢" : "آخر ظهور " + ago(p.at); };

(function permCss() {                                                    // إخفاء الأزرار غير المصرح بها
  const s = document.createElement("style");
  s.textContent = `.np-eadd #vehicle-form,.np-eed #v-list [data-edit],.np-eed #v-list [data-del],
.np-tadd :is([data-oil],#arch-form,#pt-end-form,#expense-form,#ops-form,#inv-form,#mat-form,#fout-form,#fin-form,#dn-form,#dr-form,#rc-form,#rd-form,#rl-form,#sp-form,#mt-form,#mv-form,#oil-form,#pay-form,#pd-form,#pt-form,#ac-form,#co-form),
.np-ted :is(#edit-form,#x-edit-form,[data-arch],[data-dn-fix],[data-pt-end],[data-a-pdel],[data-del-exp],[data-del-op],[data-inv-del],[data-mat-del],[data-cc-del],[data-cs-del],[data-q-del],[data-qs-del],[data-edit-exp],[data-edit-op],[data-inv-edit],[data-mat-edit],[data-co-edit],[data-dr-edit]),
.np-cust :is(#adv-form,#adv-edit-form,[data-adv-del],[data-adv-item-del],[data-adv-edit],[data-adv-item-edit],[data-adv-reopen]),
.np-exp :is([data-export],#export-btn){display:none!important}`;
  document.head.appendChild(s);
})();
function applyPermUI() {
  const p = ACCESS.perms || {}, all = isDev() || isAdm() || p.isWorkspaceAdmin, t = (c, k) => document.body.classList.toggle(c, locked() || !(all || p[k]));
  t("np-eadd", "canAddEquipment"); t("np-eed", "canEditDeleteEquipment"); t("np-tadd", "canAddTransactions");
  t("np-ted", "canEditDeleteTransactions"); t("np-cust", "canManageCustody"); t("np-exp", "canExportPrint");
}

function initChat() {
  if (!S.listen || !ACCESS.uid) return;
  const key = chatWs() + ACCESS.role; if (initChat.k === key) return; initChat.k = key;
  unsubs.forEach(f => f && f()); unsubs = [];
  unsubs.push(S.listen("chat_msgs", chatWs(), rows => { chatMsgs = rows.sort((a, b) => a.at - b.at).slice(-200); paintChat(); }));
  unsubs.push(S.listen("presence", isDev() ? null : chatWs(), rows => { presAll = Object.fromEntries(rows.map(r => [r.id, r])); paintChat(); if (isDev() && accTab === "acc" && !$("#view-accounts").classList.contains("hidden")) renderAccounts(); }));
  if (!isDev() && !beating) {                                            // المطور لا يكتب حضوراً أبداً (وضع الشبح)
    beating = true;
    const hb = () => { if (!document.hidden) S.rawSet("presence", ACCESS.uid, { ws: ACCESS.ws, name: ACCESS.name || ACCESS.email, at: Date.now() }).catch(() => {}); };
    hb(); setInterval(hb, 45000); document.addEventListener("visibilitychange", hb);
  }
  buildChat();
}
const markSeen = () => { try { localStorage.setItem("fawzy-seen-" + chatWs(), Date.now()); } catch (e) {} };

function buildChat() {
  if ($("#chat-fab")) return paintChat();
  const f = document.createElement("button"), p = document.createElement("div");
  f.id = "chat-fab"; f.className = "fixed bottom-4 left-4 z-40 w-14 h-14 rounded-full bg-amber-500 text-slate-900 text-2xl shadow-lg no-print";
  f.innerHTML = `<i class="fa-solid fa-comments"></i><span id="chat-badge" class="hidden absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">0</span>`;
  p.id = "chat-panel"; p.className = "hidden fixed bottom-20 left-4 z-40 w-[22rem] max-w-[calc(100vw-2rem)] h-[28rem] max-h-[70vh] bg-white rounded-2xl shadow-2xl border flex flex-col no-print";
  p.innerHTML = `<div class="p-3 border-b"><div class="font-extrabold">شات مساحة العمل</div><div id="chat-mem" class="text-xs text-slate-500"></div><div class="text-[10px] text-slate-400">للإدارة الفنية صلاحية الاطلاع على المحادثات لأغراض الدعم.</div></div>
    <div id="chat-list" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
    <div class="p-2 border-t flex gap-2 items-center"><label class="cursor-pointer text-xl px-1"><i class="fa-solid fa-paperclip"></i><input id="chat-file" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" class="hidden"></label><input id="chat-in" class="inp !py-1.5" placeholder="اكتب رسالة..."><button id="chat-send" class="btn !px-3 !py-1.5">إرسال</button></div>`;
  document.body.append(f, p);
  f.onclick = () => { p.classList.toggle("hidden"); markSeen(); paintChat(); };
  $("#chat-send").onclick = () => sendChat();
  $("#chat-in").onkeydown = e => { if (e.key === "Enter") sendChat(); };
  $("#chat-file").onchange = e => { if (e.target.files[0]) sendChat(e.target.files[0]); e.target.value = ""; };
  p.onclick = e => {
    const z = e.target.closest("[data-zoom]"); if (!z) return;
    const o = document.createElement("div"); o.className = "fixed inset-0 z-[70] bg-black/80 grid place-items-center p-4";
    o.innerHTML = `<img src="${esc(z.dataset.zoom)}" class="max-w-full max-h-full">`; o.onclick = () => o.remove(); document.body.appendChild(o);
  };
  paintChat();
}

function paintChat() {
  const list = $("#chat-list"); if (!list) return;
  const open = !$("#chat-panel").classList.contains("hidden"), seen = +localStorage.getItem("fawzy-seen-" + chatWs()) || 0;
  const un = chatMsgs.filter(m => m.uid !== ACCESS.uid && m.at > seen).length, bd = $("#chat-badge");
  bd.textContent = un; bd.classList.toggle("hidden", !un || open);
  $("#chat-mem").innerHTML = Object.values(presAll).filter(p => p.ws === chatWs()).map(p => `${esc(p.name)} ${online(p) ? "🟢 متصل الآن" : "· آخر ظهور " + ago(p.at)}`).join(" | ") || "—";
  if (!open) return; markSeen();
  list.innerHTML = chatMsgs.map(m => {
    const mine = m.uid === ACCESS.uid, f = m.file;
    return `<div class="flex ${mine ? "justify-start" : "justify-end"}"><div class="max-w-[85%] rounded-xl p-2 ${mine ? "bg-amber-100" : "bg-slate-100"}"><div class="text-[11px] font-bold text-slate-500">${esc(m.name || "")} · ${ago(m.at)}</div>${m.text ? `<div>${esc(m.text)}</div>` : ""}` +
      (f ? (f.type === "image" ? `<img src="${esc(f.url)}" data-zoom="${esc(f.url)}" class="mt-1 max-h-48 rounded cursor-zoom-in">` : f.type === "video" ? `<video src="${esc(f.url)}" controls class="mt-1 max-h-48 rounded"></video>` : `<a href="${esc(f.url)}" target="_blank" rel="noopener" download class="mt-1 block text-orange-700 underline">⬇ ${esc(f.name)}</a>`) : "") + `</div></div>`;
  }).join("");
  list.scrollTop = list.scrollHeight;
}

async function sendChat(file) {
  const inp = $("#chat-in"), text = inp.value.trim(); if (!text && !file) return;
  try {
    let f = null;
    if (file) {
      cl = cl || await S.get("app_config", "cloudinary");
      if (!cl || !cl.cloud || !cl.preset) return alert("لم يُضبط رفع الميديا بعد. اطلب من المطور إدخال إعدادات Cloudinary.");
      const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", cl.preset);
      const j = await (await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cl.cloud)}/auto/upload`, { method: "POST", body: fd })).json();
      if (!j.secure_url) throw new Error((j.error && j.error.message) || "فشل الرفع");
      f = { url: j.secure_url, type: j.resource_type === "image" || j.resource_type === "video" ? j.resource_type : "file", name: file.name };
    }
    inp.value = "";
    await S.rawAdd("chat_msgs", { ws: chatWs(), uid: ACCESS.uid, name: isDev() ? "الدعم الفني" : (ACCESS.name || ACCESS.email), text, file: f, at: Date.now() });
  } catch (e) { console.error(e); alert("تعذر الإرسال: " + (e.message || e.code || "")); }
}

/* ---------- ميكسار: الشركات والاشتراكات والقفل التلقائي ---------- */
const PAY_NO = "01128079357";
let companies = [], myCo = null;
const dayLeft = c => c ? Math.ceil(((c.expiresAt || 0) - Date.now()) / 864e5) : 0;
const locked = () => !!ACCESS.locked;
async function loadCo() {
  myCo = null; ACCESS.locked = false;
  if (isDev() || !S.get || !ACCESS.ws) return;
  try { myCo = await S.get("companies", ACCESS.ws); } catch (e) { return; }
  ACCESS.locked = !!myCo && (myCo.status !== "active" || (myCo.expiresAt || 0) < Date.now());   // شركة بلا مستند اشتراك = حساب قديم يعمل كالمعتاد
}
function renderSub() {
  let b = $("#sub-badge");
  if (!b) { b = document.createElement("button"); b.id = "sub-badge"; $("header").lastElementChild.before(b); b.onclick = openPlans; }
  b.classList.toggle("hidden", isDev() || !myCo); if (!myCo) return;
  const d = dayLeft(myCo), off = locked();
  b.textContent = off ? "🔒 الاشتراك منتهي — تجديد" : `${myCo.plan === "trial" ? "تجربة مجانية" : "مشترك"}: ${d} يوم · الاشتراك والتجديد`;
  b.className = "text-xs font-bold px-2 py-1 rounded-lg border " + (off ? "bg-red-50 text-red-700 border-red-300" : d <= 7 ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-green-50 text-green-700 border-green-300");
}

/* ---------- الأسعار والخصومات (app_config/pricing) ---------- */
const PRICING = { plans: { month: { base: 250, disc: 100 }, quarter: { base: 650, disc: 300 }, year: { base: 2400, disc: 600 } }, discountDays: 90, discountStartedAt: 0, discountEndsAt: 0 };
const discOn = p => (p.discountEndsAt || 0) > Date.now();
let pricingCache = null;
async function getPricing(force) {
  if (!pricingCache || force) {
    let d = null; try { d = await S.get("app_config", "pricing"); } catch (e) {}
    pricingCache = { ...PRICING, ...(d || {}), plans: { ...PRICING.plans, ...((d || {}).plans || {}) } };
  }
  return pricingCache;
}
const readPricing = () => ({ plans: Object.fromEntries(["month", "quarter", "year"].map(k => [k, { base: +$("#pr-" + k + "-base").value || 0, disc: +$("#pr-" + k + "-disc").value || 0 }])), discountDays: +$("#pr-days").value || 90 });
function pricingCard() {
  const p = accData.pricing || PRICING, on = discOn(p), L = [["month", "الشهرية (30 يوماً)"], ["quarter", "ربع السنوية (90 يوماً)"], ["year", "السنوية (365 يوماً)"]];
  return `<div class="border rounded-xl p-3 mb-4 space-y-2"><div class="font-bold">إدارة الأسعار والخصومات</div>
    <div class="grid sm:grid-cols-3 gap-2">${L.map(([k, l]) => `<div class="text-sm"><b>${l}</b><input id="pr-${k}-base" type="number" class="inp mt-1" value="${p.plans[k].base}" placeholder="السعر الأساسي"><input id="pr-${k}-disc" type="number" class="inp mt-1" value="${p.plans[k].disc}" placeholder="سعر الخصم"></div>`).join("")}</div>
    <div class="flex flex-wrap gap-2 items-center"><label class="text-sm">مدة الخصم (أيام)</label><input id="pr-days" type="number" class="inp !w-24" value="${p.discountDays}"><button data-a="prsave" class="btn">حفظ الأسعار</button><button data-a="discstart" class="btn">بدء / تفعيل الخصم الآن</button><button data-a="discstop" class="px-4 py-2.5 rounded-xl bg-slate-200 font-bold">إيقاف الخصم</button></div>
    <div class="text-xs ${on ? "text-green-700" : "text-slate-500"}">${on ? `الخصم مفعّل — متبقٍ ${Math.ceil((p.discountEndsAt - Date.now()) / 864e5)} يوم` : "الخصم غير مفعّل — تظهر الأسعار الأساسية."}</div></div>`;
}
async function openPlans() {
  const co = myCo || {}, p = await getPricing(true), on = discOn(p), left = Math.ceil((p.discountEndsAt - Date.now()) / 864e5);
  const L = [["month", "الباقة الشهرية", "30 يوماً"], ["quarter", "الباقة ربع السنوية", "90 يوماً"], ["year", "الباقة السنوية", "365 يوماً"]];
  const wa = (t, price) => `https://wa.me/201128079357?text=` + encodeURIComponent(`مرحباً، أرغب في الاشتراك/التجديد في ميكسار\nالشركة: ${co.name || ""}\nكود الشركة: ${co.code || ""}\nالباقة: ${t} (${price} ج.م)`);
  const o = document.createElement("div"); o.className = "fixed inset-0 z-[80] bg-black/60 grid place-items-center p-4";
  o.innerHTML = `<div class="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-start"><img src="logo-badge.png" alt="Mixar" class="h-16 object-contain" onerror="this.remove()"><button data-x>✕</button></div><h3 class="font-extrabold text-lg">الاشتراك والتجديد</h3>
    <div class="border rounded-xl p-3"><b>تجربة مجانية</b><div class="text-sm text-slate-600">30 يوماً مجاناً بالكامل عند تسجيل شركة جديدة.</div></div>` +
    L.map(([k, t, d]) => { const pl = p.plans[k], price = on ? pl.disc : pl.base; return `<div class="border rounded-xl p-3"><b>${t}</b> <span class="text-sm text-slate-500">${d}</span>
      <div class="mt-1">${on ? `<s class="text-slate-400">${pl.base}</s> <b class="text-green-700 text-lg">${pl.disc} ج.م</b> <span class="text-xs bg-orange-100 text-orange-800 rounded px-2 py-0.5">ينتهي العرض بعد ${left} يوم</span>` : `<b class="text-lg">${pl.base} ج.م</b>`}</div>
      <a href="${wa(t, price)}" target="_blank" rel="noopener" class="btn inline-block mt-2 text-sm">تأكيد الدفع عبر واتساب</a></div>`; }).join("") +
    `<div class="bg-amber-50 rounded-xl p-3 text-sm">ادفع على محفظة اتصالات كاش: <b dir="ltr">${PAY_NO}</b> <button data-copy class="underline font-bold mr-2">نسخ الرقم</button></div></div>`;
  o.onclick = ev => { if (ev.target === o || ev.target.closest("[data-x]")) o.remove(); if (ev.target.closest("[data-copy]")) navigator.clipboard.writeText(PAY_NO).then(() => alert("تم نسخ الرقم")); };
  document.body.appendChild(o);
}
