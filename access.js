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
    b.disabled = true; ACCESS.registering = true;                         // يؤجّل accessGate حتى تكتمل المستندات
    try {
      let target = null;
      if (kind === "join") { target = await S.get("codes", code); if (!target) { b.disabled = false; return fail("كود الشركة غير صحيح."); } }
      const u = await S.register(email, pass), uid = u.user.uid, base = { kind: "user", name, email: email.toLowerCase(), phone, device: deviceInfo(), createdAt: Date.now() };
      if (kind === "co") {
        const c = await genCompanyCode();
        await S.rawSet("codes", c, { ws: uid });
        await S.rawSet("companies", uid, { name: co, code: c, type: v("reg-type"), phone, planType: "company_starter", maxUsers: 5, maxSites: 1, plan: "trial", status: "active", expiresAt: expMs(30), createdAt: Date.now() });
        await S.rawSet("biz", uid, { ...base, job: "مدير الشركة", role: "admin", status: "active", ws: uid, wsName: co, perms: { ...DEFAULT_PERMS, isWorkspaceAdmin: true } });
      } else await S.rawSet("biz", uid, { ...base, job, role: "accountant", status: "pending", ws: target.ws, perms: { ...DEFAULT_PERMS, isWorkspaceAdmin: false } });
    } catch (ex) { fail(ex.code === "auth/email-already-in-use" ? "هذا البريد مسجّل بالفعل." : "تعذر إنشاء الحساب (" + (ex.code || "") + ")"); }
    ACCESS.registering = false; b.disabled = false;
  };
})();

/* ---------- البوابة + تخزين الصلاحيات محلياً (تعمل أوفلاين) ---------- */
const DEFAULT_PERMS = { canAddEquipment: true, canEditDeleteEquipment: true, canAddTransactions: true, canEditDeleteTransactions: true, canManageCustody: true, canExportPrint: true, isWorkspaceAdmin: false, viewFinancials: true, canApprove: false };
const CK = "mixar-access";
function applyRec(user, rec, own) {
  ACCESS.name = rec.name || ""; ACCESS.sites = rec.assignedSites || rec.sites || ["*"]; ACCESS.pages = rec.pages || null; ACCESS.tpl = rec.template || ""; ACCESS.uid = user.uid; ACCESS.email = user.email; ACCESS.role = own || rec.role;
  ACCESS.ws = own ? "main" : (rec.ws || user.uid); ACCESS.perms = rec.perms || DEFAULT_PERMS; ACCESS.site = rec.site || "";
  ACCESS.appRole = own || rec.role === "admin" ? "manager" : "accountant";
  ACCESS.scope = ACCESS.role === "dev" ? (localStorage.getItem("mixar-scope") || "main") : ACCESS.ws;
  try { localStorage.setItem(CK, JSON.stringify({ uid: user.uid, own, rec: { role: ACCESS.role, ws: ACCESS.ws, perms: ACCESS.perms, site: ACCESS.site, sites: ACCESS.sites, pages: ACCESS.pages, template: ACCESS.tpl, name: ACCESS.name, status: "active" } })); } catch (e) {}
  applyPermUI();
}
async function genCompanyCode() {                                        // كود فريد MX-XXXX (5 محاولات)
  for (let i = 0; i < 5; i++) { const c = "MX-" + (1000 + Math.floor(Math.random() * 9000)); let ex = null; try { ex = await S.get("codes", c); } catch (e) {} if (!ex) return c; }
  throw new Error("تعذر توليد كود شركة فريد، أعد المحاولة.");
}
async function accessGate(user) {
  while (ACCESS.registering) await new Promise(r => setTimeout(r, 120));   // انتظر اكتمال التسجيل
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
    if (ok && (!rec || rec.status !== "active" || rec.role !== own || rec.ws !== "owner"))
      try { await S.rawSet("biz", user.uid, { kind: "user", name: rec?.name || (own === "dev" ? "المطور" : "المدير"), email: user.email.toLowerCase(), role: own, status: "active", ws: "owner", perms: all }); } catch (e) { console.warn(e); }
    applyRec(user, { perms: all }, own); return true;
  }
  if (!ok && !c) {                                                       // فشل مؤقت في الاتصال: لا تُظهر «بانتظار التفعيل»
    const e2 = document.createElement("section"); e2.id = "pending"; e2.className = "fixed inset-0 z-50 grid place-items-center bg-slate-900 p-4";
    e2.innerHTML = `<div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4"><div class="text-4xl">📡</div><h2 class="font-extrabold">تعذر التحقق من صلاحياتك بسبب ضعف الاتصال</h2><button id="pd-retry" class="btn w-full">إعادة المحاولة</button><button id="pd-out2" class="w-full py-2.5 rounded-xl bg-slate-200 font-bold">تسجيل الخروج</button></div>`;
    document.body.appendChild(e2); $("#pd-retry").onclick = () => location.reload(); $("#pd-out2").onclick = async () => { await S.logout(); e2.remove(); }; return false;
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
function listRef(fs, db, col) {                                          // شرط where واحد فقط (بدون Composite Index) — الباقي في listFilter
  if (col === "biz@users") return fs.query(fs.collection(db, "biz"), fs.where("ws", "==", ACCESS.ws));
  if ((col === "audit_logs" || col === "auditlog") && ACCESS.role !== "dev") return fs.query(fs.collection(db, col), fs.where("ws", "==", ACCESS.ws));
  const r = fs.collection(db, col);
  if (!(ACCESS.role && ACCESS.role !== "dev" && WS_COLS.includes(col))) return r;
  return restricted() && !(ACCESS.sites || []).length ? [] : fs.query(r, fs.where("workspaceId", "==", ACCESS.ws));
}
function listFilter(col, rows) {                                         // فلترة JavaScript بعد الاستعلام
  if (col === "biz@users") return rows.filter(r => r.kind === "user" && ["pending", "active", "suspended"].includes(r.status));   // المدير: لا يرى المطور ولا الموقوفين
  if (ACCESS.role && ACCESS.role !== "dev" && WS_COLS.includes(col) && restricted()) return rows.filter(r => ACCESS.sites.includes(r.siteId));
  return rows;
}
function stampNew(col, d) {
  return ["users", "auditlog", "audit_logs", "password_requests", "dev_logs", "chat_msgs", "presence", "app_config"].includes(col) ? d : { workspaceId: ACCESS.scope || "main", createdBy: ACCESS.email || "", ...d, ...siteStamp() };
}
function scopeData() {                                                   // عزل العرض (app.js)
  if (!ACCESS.scope) return;
  const ok = r => (r.workspaceId || "main") === ACCESS.scope && (!restricted() || ACCESS.sites.includes(r.siteId));
  vehicles = vehicles.filter(ok); expenses = expenses.filter(ok); advances = advances.filter(ok);
  inventory = inventory.filter(ok); operations = operations.filter(ok);
  xbiz = xbiz.filter(x => x.kind !== "user" && ok(x));                  // سولار/إيجارات/أعطال/كاوتش/إنتاج
}
async function scopeExt() {                                              // عزل biz و acct (ext.js) + تحميل الحسابات
  const ok = r => (r.workspaceId || "main") === ACCESS.scope && (!restricted() || ACCESS.sites.includes(r.siteId));
  const B = typeof biz !== "undefined" ? biz : [], A = typeof acct !== "undefined" ? acct : [];
  urs = isDev() ? B.filter(x => x.kind === "user") : [];
  if (typeof biz !== "undefined") biz = B.filter(x => x.kind !== "user" && ok(x)); if (typeof acct !== "undefined") acct = A.filter(ok);
  if (isWsAdmin()) urs = await listSafe("biz@users");
  if (isDev()) companies = await listSafe("companies"); else await loadCo();
  applyPermUI(); renderAccess(); renderSub(); initChat(); applyPlan(); startSession(); hookAudit(); if (isDev()) rnList = await listSafe("renewal_requests"); renderBell(); injectBackup(); injectPeriodLock();
}
const isDev = () => ACCESS.role === "dev", isAdm = () => ACCESS.role === "admin", isWsAdmin = () => isAdm() || !!(ACCESS.perms || {}).isWorkspaceAdmin, canPage = () => isDev() || isWsAdmin();
let urs = [], presAll = {};

/* ---------- سجل الأخطاء للمطور ---------- */
const deviceInfo = () => {
  const u = navigator.userAgent, os = /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Windows/.test(u) ? "Windows" : /Mac/.test(u) ? "Mac" : "Linux/غير معروف";
  const br = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "متصفح";
  return `${os}${((u.match(/Android[^;]*;\s*([^)]+)\)/) || [])[1] || "").trim().replace(/^/, " ")} · ${br}`.replace("  ", " ");
};

/* ---------- صفحة إدارة الحسابات والصلاحيات (المطور فقط) ---------- */
const PERM_LABELS = { canAddEquipment: "إضافة معدات", canEditDeleteEquipment: "تعديل/حذف المعدات", canAddTransactions: "تسجيل مصروفات وساعات", canEditDeleteTransactions: "تعديل/حذف الحركات", canManageCustody: "إدارة العُهد", canExportPrint: "تصدير وطباعة", isWorkspaceAdmin: "إدارة مساحة العمل", viewFinancials: "رؤية الأسعار والمبالغ", canApprove: "اعتماد العمليات" };
const TABS = { audit: "سجل التدقيق", plat: "المنصة والشركات", rn: "طلبات التجديد", req: "طلبات الاعتماد", forgot: "استعادة الدخول", acc: "الحسابات والصلاحيات", dev: "لوحة المطور" };
let accTab = (() => { try { return localStorage.getItem("mixar-acctab") || "plat"; } catch (e) { return "plat"; } })(), accData = { pr: [], logs: [] };
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
    sel.onchange = () => { ACCESS.scope = sel.value; localStorage.setItem("mixar-scope", sel.value); loadData(); };
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

VIEW_HOOKS.accounts = renderAccounts;
async function renderAccounts() {
  const v = $("#view-accounts"); if (!v || !canPage()) return;
  if (!isDev() && !["req", "acc", "audit"].includes(accTab)) accTab = "req";
  if (isDev() && accTab === "plat") { accData.vs = await S.list("vehicles").catch(() => []); accData.pricing = await getPricing(true).catch(() => null); }
  if (isDev() && accTab === "rn") accData.rn = (await S.list("renewal_requests").catch(() => [])).sort((x, y) => (y.at || 0) - (x.at || 0));
  if (accTab === "audit") accData.al = (await S.list("audit_logs").catch(() => [])).filter(r => !isDev() || (r.ws || r.workspaceId || "main") === ACCESS.scope).sort((x, y) => y.at - x.at).slice(0, 150);
  if (isDev() && accTab === "dev") accData.cl = await S.get("app_config", "cloudinary").catch(() => null);
  if (accTab === "forgot") accData.pr = await S.list("password_requests").catch(() => []);
  if (accTab === "dev") accData.logs = (await S.list("system_errors").catch(() => [])).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)).slice(0, 50);
  const users = accUsers(), th = h => `<thead class="text-slate-500 border-b"><tr>${h.map(x => `<th class="py-2">${x}</th>`).join("")}</tr></thead>`;
  const btn = (a, id, t, c) => `<button data-a="${a}" data-id="${esc(id)}" class="${c} font-bold ml-3">${t}</button>`;
  let body = "";
  if (accTab === "plat") body = kpiCards() + pricingCard() + `<div class="flex flex-wrap gap-2 mb-3 items-end"><input id="nc-name" class="inp !w-auto" placeholder="اسم الشركة"><select id="nc-type" class="inp !w-auto"><option>خرسانة جاهزة</option><option>خلاطة أسفلت</option><option>معدات ومقاولات</option></select><input id="nc-days" type="number" value="30" class="inp !w-24"><button data-a="newco" class="btn">إنشاء شركة</button><button data-a="democo" class="px-4 py-2.5 rounded-xl bg-slate-200 font-bold">إنشاء شركة تجريبية لميكسار</button></div><table class="w-full text-sm text-right">${th(["الشركة", "الكود", "النشاط", "الباقة", "المعدات", "المستخدمون", "الحالة", "الأيام", ""])}<tbody>` + companies.map(c => { const d = dayLeft(c), n = (accData.vs || []).filter(x => (x.workspaceId || "main") === c.id).length, us = accUsers().filter(x => (x.ws || "main") === c.id).length; return `<tr class="border-b"><td class="py-2 font-bold">${esc(c.name)}</td><td dir="ltr">${esc(c.code)}</td><td>${esc(c.type || "")}</td><td><select data-plan="${esc(c.id)}" class="inp !py-1 !w-auto text-xs">${Object.entries(PLAN_DEFS).map(([k, d]) => `<option value="${k}" ${(c.planType || "company_growth") === k ? "selected" : ""}>${d.label}</option>`).join("")}</select></td><td>${n}</td><td>${us}</td><td>${c.status === "active" && d > 0 ? "✅ نشط" : "🔒 مقفل"}</td><td>${d}</td><td class="whitespace-nowrap">${[30, 90, 365].map(x => btn("ext" + x, c.id, "+" + x, "text-green-700")).join("")}${btn("extx", c.id, "مخصص", "text-slate-600")}${btn("cotog", c.id, c.status === "active" ? "إيقاف" : "تفعيل", "text-red-600")}</td></tr>`; }).join("") + `</tbody></table>`;
  if (accTab === "rn") body = `<table class="w-full text-sm text-right">${th(["الشركة", "الكود", "الباقة", "رقم التحويل", "الإيصال", "التاريخ", "الحالة", ""])}<tbody>` + (accData.rn || []).map(r => `<tr class="border-b"><td class="py-2 font-bold">${esc(r.company)}</td><td dir="ltr">${esc(r.code)}</td><td>${esc(r.plan)}</td><td>${esc(r.ref)}</td><td>${r.receipt ? `<a href="${esc(r.receipt)}" target="_blank" rel="noopener"><img src="${esc(r.receipt)}" class="h-12 rounded"></a>` : "—"}</td><td class="text-xs">${dt(r.at)}</td><td>${esc(r.status)}</td><td class="whitespace-nowrap">${r.status === "pending" ? btn("rnok", r.id, "اعتماد وتمديد", "text-green-700") + btn("rnno", r.id, "رفض", "text-red-600") : ""}</td></tr>`).join("") + `</tbody></table>`;
  if (accTab === "audit") { const q = (accData.q || "").trim(); body = `<div class="flex gap-2 mb-3"><input id="al-q" class="inp" placeholder="بحث في السجل ثم Enter" value="${esc(q)}"><select id="al-type" class="inp !w-auto"><option value="">كل الأحداث</option>${[...new Set((accData.al || []).map(r => r.type))].map(t => `<option ${accData.t === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select><input id="al-from" type="date" class="inp !w-auto" value="${accData.f || ""}"><input id="al-to" type="date" class="inp !w-auto" value="${accData.to || ""}"><button data-a="alcsv" class="btn">تصدير CSV</button></div><table class="w-full text-sm text-right">${th(["الوقت", "المنفّذ", "الدور", "الحدث", "الهدف", "التفاصيل"])}<tbody>` + alRows().map(r => `<tr class="border-b text-xs"><td class="py-1">${dt(r.at)}</td><td>${esc(r.name)}</td><td>${esc(r.role)}</td><td>${esc(r.type)}</td><td>${esc(r.target)}</td><td>${esc(r.summary)}</td></tr>`).join("") + `</tbody></table>`; }
  if (accTab === "req") body = `<table class="w-full text-sm text-right">${th(["الاسم / الوظيفة", "الموقع", "البريد", "الجهاز", ""])}<tbody>` +
    (users.filter(u => u.status === "pending").map(u => `<tr class="border-b"><td class="py-2"><b>${esc(u.name)}</b><div class="text-xs text-slate-500">${esc(u.job || "")}</div><div class="text-xs mt-1">⏳ قيد الانتظار</div></td><td>${esc(u.site || "")}</td><td dir="ltr" class="text-xs">${esc(u.email)}</td><td class="text-xs">${esc(u.device || "")}</td><td class="whitespace-nowrap">${btn("ok", u.id, "قبول", "text-green-700")}${btn("del", u.id, "رفض", "text-red-600")}</td></tr>`).join("") || `<tr><td colspan="5" class="py-4 text-slate-500">لا توجد طلبات.</td></tr>`) + `</tbody></table>`;
  if (accTab === "forgot") body = `<table class="w-full text-sm text-right">${th(["الاسم / البريد", "الجهاز", "التاريخ", ""])}<tbody>` +
    (accData.pr.filter(r => r.status === "open").map(r => `<tr class="border-b"><td class="py-2 font-bold">${esc(r.who)}</td><td class="text-xs">${esc(r.device)}</td><td class="text-xs">${dt(r.at)}</td><td>${btn("done", r.id, "تم الحل", "text-green-700")}</td></tr>`).join("") || `<tr><td colspan="4" class="py-4 text-slate-500">لا توجد طلبات.</td></tr>`) + `</tbody></table>
    <p class="text-xs text-slate-500 mt-3">لحل الطلب: من Firebase Console ← Authentication احذف المستخدم ليسجّل من جديد بنفس البريد، ثم اعتمده وانقله لمساحته القديمة من تبويب «الحسابات».</p>`;
  if (accTab === "acc") {
    const act = users.filter(u => u.status !== "pending");
    body = planCard() + sitesCard() + (isDev() || !myCo ? "" : `<div class="flex gap-2 mb-3"><input id="co-name" class="inp" value="${esc(myCo.name)}"><button data-a="conname" class="btn">حفظ اسم الشركة</button></div><div class="text-xs text-slate-500 mb-3">كود شركتك للانضمام: <b dir="ltr">${esc(myCo.code)}</b></div>`) + `<div class="space-y-3">` + act.map(u => { const fx = ownerRole(u.email), p = u.perms || DEFAULT_PERMS; return `<div class="border rounded-xl p-3"><div class="flex flex-wrap justify-between gap-2 items-center"><label class="font-bold">${fx ? "" : `<input type="checkbox" data-lk="${esc(u.id)}" class="ml-2">`}${esc(u.name)} <span class="text-xs text-slate-500" dir="ltr">${esc(u.email)}</span></label><span class="text-xs">${STAT[u.status] || STAT.suspended} · ${fx ? "نطاق رئيسي" : esc(u.wsName || (u.ws === u.id ? "مستقل" : u.ws || ""))}${isDev() ? " · " + presTxt(u.id) : ""}</span></div>` +
      (fx ? "" : tplControls(u) + `<div class="grid sm:grid-cols-2 gap-1 mt-2 text-sm">${Object.entries(PERM_LABELS).map(([k, l]) => `<label><input type="checkbox" data-perm="${k}" data-id="${esc(u.id)}" ${p[k] ? "checked" : ""} class="ml-2">${l}</label>`).join("")}</div><div class="mt-2">${u.role === "admin" && !isDev() ? "" : u.status === "active" ? btn("susp", u.id, "توقيف مؤقت", "text-orange-700") + btn("cancel", u.id, "إلغاء الحساب", "text-red-600") : btn("react", u.id, "إعادة تفعيل", "text-green-700") + (u.status === "cancelled" ? "" : btn("cancel", u.id, "إلغاء الحساب", "text-red-600"))}${isDev() ? btn("unlink", u.id, "فك الارتباط", "text-slate-600") + (u.role !== "admin" ? btn("promote", u.id, "ترقية لمدير شركة", "text-blue-700") : "") : ""}</div>`) + `</div>`; }).join("") +
      `</div><div class="mt-3 flex flex-wrap gap-2 items-end ${isDev() ? "" : "hidden"}"><input id="lk-name" class="inp !w-auto" placeholder="اسم المجموعة (مثال: موقع أبو رواش)"><button data-a="link" class="btn">ربط المحدَّدين في مساحة مشتركة</button></div>`;
  }
  if (accTab === "dev") body = `<div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">إعدادات رفع الميديا (Cloudinary)</div><div class="grid sm:grid-cols-2 gap-2"><input id="cl-cloud" class="inp" placeholder="Cloud Name" dir="ltr" value="${esc(accData.cl?.cloud || "")}"><input id="cl-preset" class="inp" placeholder="Upload Preset (Unsigned)" dir="ltr" value="${esc(accData.cl?.preset || "")}"></div><button data-a="clsave" class="btn">حفظ</button></div><div class="flex gap-2 flex-wrap mb-3"><button data-a="cache" class="btn">تحديث الكاش إجبارياً</button><button data-a="stamp" class="btn">ختم البيانات السابقة بالنطاق الرئيسي</button></div><table class="w-full text-sm text-right">${th(["الوقت", "المستخدم", "الصفحة", "الجهاز", "الخطأ"])}<tbody>` +
    accData.logs.map(l => `<tr class="border-b text-xs"><td class="py-1">${dt(l.lastAt)}</td><td dir="ltr">${esc(l.lastUser || l.user || "")}</td><td>${esc((l.file || "") + ":" + (l.line || ""))}</td><td>${esc(l.lastDevice || l.device || "")}</td><td>${esc(l.msg)} ×${l.count || 1}</td></tr>`).join("") + `</tbody></table>`;
  v.innerHTML = `<h2 class="text-xl font-extrabold">إدارة الحسابات والصلاحيات</h2><div class="flex gap-2 flex-wrap">${Object.entries(TABS).filter(([k]) => isDev() || ["req", "acc", "audit"].includes(k)).map(([k, l]) => `<button data-tab="${k}" class="px-3 py-1.5 rounded-xl text-sm font-bold ${k === accTab ? "bg-amber-500 text-slate-900" : "bg-slate-200"}">${l}</button>`).join("")}</div><div class="card overflow-x-auto">${body}</div>`;
}

async function accClick(ev) {
  const t = ev.target.closest("[data-tab]"); if (t) { accTab = t.dataset.tab; try { localStorage.setItem("mixar-acctab", accTab); } catch (e) {} return renderAccounts(); }
  const b = ev.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, id = b.dataset.id, u = accUsers().find(x => x.id === id);
  b.disabled = true;
  try {
    if (a === "ok" && !seatOk()) { b.disabled = false; return; }
    if (a === "ok") await S.save("biz", isDev() ? { status: "active", ws: u.ws || id, perms: u.perms || DEFAULT_PERMS } : { status: "active" }, id);
    if (a === "del" && confirm("رفض وحذف هذا الطلب؟")) await S.remove("biz", id);
    if (a === "promote") await S.save("biz", { role: "admin", perms: { ...(u.perms || DEFAULT_PERMS), isWorkspaceAdmin: true } }, id);
    if (a === "prsave" || a === "discstart" || a === "discstop") {
      const cur = { ...readPricing() }, now = Date.now(), pr0 = accData.pricing || PRICING;
      if (a === "prsave") { cur.discountStartedAt = pr0.discountStartedAt || 0; cur.discountEndsAt = pr0.discountEndsAt || 0; }   // لا يُلغى الخصم النشط
      if (a === "discstart") { cur.discountStartedAt = now; cur.discountEndsAt = now + cur.discountDays * 864e5; }
      if (a === "discstop") { delete cur.plans; delete cur.discountDays; cur.discountEndsAt = 0; }
      await S.rawSet("app_config", "pricing", cur); pricingCache = null;
    }
    if (/^ext/.test(a)) {
      const c = companies.find(x => x.id === id), days = a === "extx" ? +prompt("عدد الأيام؟", "30") : +a.slice(3);
      if (c && days > 0) await S.rawSet("companies", id, { expiresAt: Math.max(toMs(c.expiresAt), Date.now()) + days * 864e5, plan: days >= 365 ? "year" : days >= 90 ? "quarter" : days >= 30 ? "month" : c.plan || "manual", status: "active" });
    }
    if (a === "cotog") { const c = companies.find(x => x.id === id); await S.rawSet("companies", id, { status: c.status === "active" ? "off" : "active" }); }
    if (a === "conname") { const n = $("#co-name").value.trim(); if (n) { await S.rawSet("companies", ACCESS.ws, { name: n }); await refreshCo(); } }
    if (a === "siteadd" || a === "sitedel") {
      const c = curCo(), cid = coId(); if (!c || !cid) { b.disabled = false; return alert("اختر شركة أولاً."); }
      let s = [...(c.sites || [])];
      if (a === "siteadd") { const n = cleanName($("#site-new").value); if (!n || s.includes(n)) { b.disabled = false; return; } if (s.length >= planInfo(c).maxSites && !(isDev() && confirm("بلغت الشركة حد المواقع في باقتها. تجاوزه؟"))) { b.disabled = false; return isDev() ? 0 : alert(`وصلت للحد الأقصى للمواقع في باقتك (${planInfo(c).maxSites}). رقّ الباقة لإضافة المزيد.`); } s.push(n); } else s = s.filter(x => x !== id);
      await S.rawSet("companies", cid, { sites: s }); auditEvt(a, cid, s.join("، ")); await refreshCo();
    }
    if (a === "alcsv") {
      const csv = "\uFEFF" + ["الوقت,المنفّذ,الدور,الحدث,الهدف,التفاصيل", ...alRows().map(r => [new Date(r.at).toLocaleString("en-GB"), r.name, r.role, r.type, r.target, r.summary].map(x => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
      const l = document.createElement("a"); l.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); l.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`; l.click(); URL.revokeObjectURL(l.href); auditEvt("audit_export", "audit_logs", alRows().length + " سطر");
    }
    if (a === "rnok") {
      const r = (accData.rn || []).find(x => x.id === id), days = { month: 30, quarter: 90, year: 365 }[r && r.plan];
      let c = r && companies.find(x => x.id === r.ws); if (r && !c) c = await S.get("companies", r.ws).catch(() => null);   // شركة جديدة لم تُحمَّل بعد
      if (!r || !c || !days) { b.disabled = false; return alert("تعذر العثور على الشركة أو الباقة لهذا الطلب."); }
      await S.rawSet("companies", r.ws, { expiresAt: Math.max(toMs(c.expiresAt), Date.now()) + days * 864e5, plan: r.plan, status: "active" });
      await S.rawSet("renewal_requests", id, { status: "approved", decidedAt: Date.now() }); auditEvt("renewal_approved", r.ws, `${c.name || r.company} — ${r.plan} (+${days} يوم)`);
      r.status = "approved"; rnList = rnList.filter(x => x.id !== id); renderBell();
    }
    if (a === "rnno") {
      await S.rawSet("renewal_requests", id, { status: "rejected", decidedAt: Date.now() }); auditEvt("renewal_rejected", id, "");
      const q = (accData.rn || []).find(x => x.id === id); if (q) q.status = "rejected"; rnList = rnList.filter(x => x.id !== id); renderBell();
    }
    if (a === "democo") {
      const wid = "co_" + Date.now().toString(36), code = await genCompanyCode();
      await S.rawSet("codes", code, { ws: wid });
      await S.rawSet("companies", wid, { name: "شركة تجريبية لميكسار", code, type: "تجريبي", plan: "manual", planType: "company_growth", maxUsers: 15, maxSites: 3, status: "active", expiresAt: expMs(30), createdAt: Date.now() });
    }
    if (a === "newco") {
      const name = $("#nc-name").value.trim(), days = +$("#nc-days").value || 30; if (!name) { b.disabled = false; return alert("اكتب اسم الشركة."); }
      const wid = "co_" + Date.now().toString(36), code = await genCompanyCode();
      await S.rawSet("codes", code, { ws: wid });
      await S.rawSet("companies", wid, { name, code, type: $("#nc-type").value, plan: "manual", planType: "company_growth", maxUsers: 15, maxSites: 3, status: "active", expiresAt: expMs(days), createdAt: Date.now() });
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
      alert(`تم ختم ${n} سجل.`);
    }
    auditEvt("user_action", id, a + (u ? " — " + (u.email || "") : ""));
    await loadData();
  } catch (e) { dbErr(e); }
  b.disabled = false; renderAccounts();
}
async function accChange(ev) {
  const at = ev.target.closest("#al-type"); if (at) { accData.t = at.value; return renderAccounts(); }
  const al = ev.target.closest("#al-q"); if (al) { accData.q = al.value; return renderAccounts(); }
  const tp = ev.target.closest("[data-tpl]");
  if (tp && tp.value) { const t = ROLE_TPL[tp.value]; try { await S.save("biz", { template: tp.value, perms: t.perms, pages: t.pages || [] }, tp.dataset.tpl); auditEvt("role_template", tp.dataset.tpl, t.label); await loadData(); } catch (e) { dbErr(e); } return; }
  const df = ev.target.closest("#al-from, #al-to"); if (df) { accData[df.id === "al-from" ? "f" : "to"] = df.value; return renderAccounts(); }
  const sc = ev.target.closest("[data-site-chk]");
  if (sc) {
    const uid = sc.dataset.siteChk, boxes = [...document.querySelectorAll(`[data-site-chk="${uid}"]`)];
    let v;
    if (sc.value === "*" && sc.checked) v = ["*"];                          // اختيار «كل المواقع» يلغي بقية المربعات
    else {
      const sites = boxes.filter(x => x.checked).map(x => x.value).filter(x => x !== "*");
      if (!sites.length) v = ["*"];                                        // إلغاء كل المواقع = عودة إلى «كل المواقع»
      else { if (sites.length > 5) alert("الحد الأقصى 5 مواقع لكل مستخدم."); v = sites.slice(0, 5); }
    }
    try { await S.save("biz", { assignedSites: v }, uid); auditEvt("assigned_sites", uid, v.join(",")); await loadData(); } catch (e) { dbErr(e); }
    return renderAccounts();
  }
  const pl = ev.target.closest("[data-plan]");
  if (pl) { const d = PLAN_DEFS[pl.value]; try { await S.rawSet("companies", pl.dataset.plan, { planType: pl.value, maxUsers: d.maxUsers, maxSites: d.maxSites }); await loadData(); } catch (e) { dbErr(e); } return; }
  const c = ev.target.closest("[data-perm]"); if (!c) return;
  const u = accUsers().find(x => x.id === c.dataset.id); if (!u) return;
  const nextPerms = { ...(u.perms || DEFAULT_PERMS), [c.dataset.perm]: c.checked };
  try {
    await S.save("biz", { perms: nextPerms }, c.dataset.id); u.perms = nextPerms;
    auditEvt("perm_change", c.dataset.id, `${PERM_LABELS[c.dataset.perm] || c.dataset.perm}: ${c.checked ? "مفعّلة" : "موقوفة"} — ${u.name || ""} (${u.email || ""})`);
  } catch (e) { dbErr(e); c.checked = !c.checked; }
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
  s.textContent = `.np-eadd #vehicle-form,.np-eed #v-list [data-edit],.np-eed #v-list [data-del],.np-eed :is([data-arch],[data-restore],[data-purge],#arch-form),
.np-tadd :is([data-oil],#pt-end-form,#expense-form,#ops-form,#inv-form,#mat-form,#fout-form,#fin-form,#dn-form,#dr-form,#rc-form,#rd-form,#rl-form,#sp-form,#mt-form,#mv-form,#oil-form,#pay-form,#pd-form,#pt-form,#ac-form,#co-form),
.np-ted :is(#edit-form,#x-edit-form,[data-dn-fix],[data-pt-end],[data-a-pdel],[data-del-exp],[data-del-op],[data-inv-del],[data-mat-del],[data-cc-del],[data-cs-del],[data-q-del],[data-qs-del],[data-edit-exp],[data-edit-op],[data-inv-edit],[data-mat-edit],[data-co-edit],[data-dr-edit]),
.np-cust :is(#adv-form,#adv-edit-form,[data-adv-del],[data-adv-item-del],[data-adv-edit],[data-adv-item-edit],[data-adv-reopen]),
.np-exp :is([data-export],#export-btn){display:none!important}
@media(max-width:640px){header{gap:.25rem;padding-inline:.5rem}#scope-sel{max-width:6rem;font-size:11px}#sub-badge{font-size:10px;padding:2px 6px;max-width:5.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#bell{padding:0 .25rem}header #user-email{display:none}.fixed.inset-0>div{max-height:92vh;overflow-y:auto;max-width:100%}.card{overflow-x:auto}.card table{display:block;overflow-x:auto}input,select,textarea{max-width:100%}.btn,.btn-dark{padding-inline:.9rem}}`;
  document.head.appendChild(s);
})();
const LOCK_COLS = ["expenses", "operations", "biz", "acct"];
const lockUntil = () => String(((typeof curCo === "function" && curCo()) || {}).lockedUntilDate || "");
const recDate = r => String((r && (r.date || r.day || r.from || r.start)) || "").slice(0, 10);
function guardWrite(op, col, d, id) {                                    // منع برمجي: قفل فترة + قراءة فقط + صلاحيات + مواقع
  if (!ACCESS.uid || (!WS_COLS.includes(col) && col !== "biz")) return;
  if (col === "biz" && userOp(col, d)) return;
  const deny = m => { try { alert(m); } catch (e) {} throw new Error(m); };
  const L = lockUntil(), old = id ? findRec(col, id) : null;
  if (L && LOCK_COLS.includes(col)) {                                    // قفل الفترة المحاسبية: أثر رجعي ممنوع
    const nd = op === "save" ? (recDate(d) || (old ? "" : new Date().toISOString().slice(0, 10))) : "", od = recDate(old);
    if ((nd && nd <= L) || (od && od <= L)) deny(`الفترة المحاسبية مقفلة حتى ${L} — لا يمكن إضافة أو تعديل أو حذف سجل بتاريخ في أو قبل هذا اليوم.`);
  }
  if (isDev()) return;
  const p = ACCESS.perms || {}, all = isWsAdmin();
  if (ACCESS.locked) deny("اشتراك شركتك منتهٍ — النظام مقفل. جدّد الاشتراك.");
  if (ACCESS.readOnly) deny("اشتراك شركتك منتهٍ — النظام في وضع القراءة فقط خلال فترة السماح (72 ساعة). جدّد الاشتراك.");
  const edit = op === "remove" || !!id, meter = col === "vehicles" && op === "save" && !!id && Object.keys(d || {}).every(k => ["hours", "hoursDate", "hlog", "lastOil", "oilLog", "location"].includes(k));
  const need = col === "vehicles" ? (edit ? "canEditDeleteEquipment" : "canAddEquipment") : col === "advances" ? "canManageCustody" : (edit ? "canEditDeleteTransactions" : "canAddTransactions");
  if (!all && !p[need] && !(meter && p.canAddTransactions)) deny("ليست لديك صلاحية لتنفيذ هذه العملية.");   // تحديث عداد المعدة يكفيه صلاحية المعاملات
  if (restricted()) { const sid = (d && d.siteId) || (old && old.siteId); if (sid && !ACCESS.sites.includes(sid)) deny("هذا السجل خارج المواقع المخصصة لك."); }
}
function injectPeriodLock() {                                            // إعداد تاريخ إغلاق الفترة المحاسبية
  const v = $("#view-settings"); if (!v || !(isDev() || isWsAdmin())) return;
  let c = $("#pl-card");
  if (!c) { c = document.createElement("div"); c.id = "pl-card"; c.className = "card space-y-2 mb-3"; v.prepend(c);
    c.innerHTML = `<h3 class="font-extrabold">قفل الفترة المحاسبية</h3><p class="text-xs text-slate-500">لا يُسمح بإضافة أو تعديل أو حذف سجلات مالية أو تشغيلية بتاريخ في أو قبل هذا اليوم.</p><div class="flex gap-2 flex-wrap items-center"><input id="pl-date" type="date" class="inp !w-auto"><button type="button" id="pl-save" class="btn">حفظ</button><button type="button" id="pl-open" class="btn-dark">فتح الفترة</button></div>`;
    const save = async val => { const id = coId(); if (!id) return alert("اختر شركة محددة أولاً."); const old = lockUntil();
      try { await S.rawSet("companies", id, { lockedUntilDate: val }); const co = curCo(); if (co) co.lockedUntilDate = val; auditEvt("period_lock", "companies/" + id, `تغيير تاريخ إغلاق الفترة: من ${old || "—"} إلى ${val || "مفتوحة"}`); $("#pl-date").value = val; alert(val ? "تم قفل الفترة حتى " + val : "تم فتح الفترة."); } catch (e) { alert("تعذر الحفظ: " + (e.code || e.message)); } };
    $("#pl-save").onclick = () => save($("#pl-date").value); $("#pl-open").onclick = () => confirm("فتح الفترة المحاسبية بالكامل؟") && save(""); }
  $("#pl-date").value = lockUntil();
}
function applyPermUI() {
  const p = ACCESS.perms || {}, all = isDev() || isAdm() || p.isWorkspaceAdmin, t = (c, k) => document.body.classList.toggle(c, locked() || !(all || p[k]));
  t("np-eadd", "canAddEquipment"); t("np-eed", "canEditDeleteEquipment"); t("np-tadd", "canAddTransactions");
  t("np-ted", "canEditDeleteTransactions"); t("np-cust", "canManageCustody"); t("np-exp", "canExportPrint"); if (!canSeeMoney()) document.body.classList.add("np-exp");
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
    hb(); setInterval(hb, 45000);
    setInterval(async () => { try { const r = await S.get("biz", ACCESS.uid); if (r && r.status !== "active") location.reload(); } catch (e) {} }, 60000);   // الإيقاف يسري فوراً على الجلسة
    document.addEventListener("visibilitychange", hb);
  }
  buildChat();
}
const markSeen = () => { try { localStorage.setItem("mixar-seen-" + chatWs(), Date.now()); } catch (e) {} };

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
  const open = !$("#chat-panel").classList.contains("hidden"), seen = +localStorage.getItem("mixar-seen-" + chatWs()) || 0;
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
const toMs = x => typeof x === "number" && isFinite(x) ? x : (x && x.toMillis ? x.toMillis() : Number(x) || 0);
const expMs = d => Date.now() + Math.max(1, Math.floor(+d || 0)) * 864e5;   // مدة اشتراك رقمية صالحة دائماً
const dayLeft = c => c ? Math.ceil((toMs(c.expiresAt) - Date.now()) / 864e5) : 0;
const locked = () => !!ACCESS.locked;
async function loadCo() {
  myCo = null; ACCESS.locked = false;
  if (isDev() || !S.get || !ACCESS.ws) return;
  try { myCo = await S.get("companies", ACCESS.ws); } catch (e) { return; }
  ACCESS.locked = !!myCo && (myCo.status !== "active" || toMs(myCo.expiresAt) + 72 * 36e5 < Date.now());   // م8: سماح 72 ساعة
  ACCESS.readOnly = !!myCo && !ACCESS.locked && toMs(myCo.expiresAt) < Date.now();   // شركة بلا مستند اشتراك = حساب قديم يعمل كالمعتاد
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
    let d = null; try { d = await S.get("app_config", "pricing"); } catch (e) { if (!pricingCache) throw e; }
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
  const co = myCo || {}; let p = null, stale = false;
  try { p = await getPricing(true); } catch (e) { console.warn("pricing", e); }
  if (!p) { p = pricingCache || PRICING; stale = true; }
  const on = discOn(p), left = Math.ceil((p.discountEndsAt - Date.now()) / 864e5);
  const L = [["month", "الباقة الشهرية", "30 يوماً"], ["quarter", "الباقة ربع السنوية", "90 يوماً"], ["year", "الباقة السنوية", "365 يوماً"]];
  const wa = (t, price) => `https://wa.me/201128079357?text=` + encodeURIComponent(`مرحباً، أرغب في الاشتراك/التجديد في ميكسار\nالشركة: ${co.name || ""}\nكود الشركة: ${co.code || ""}\nالباقة: ${t} (${price} ج.م)`);
  const o = document.createElement("div"); o.className = "fixed inset-0 z-[80] bg-black/60 grid place-items-center p-4";
  o.innerHTML = `<div class="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-start"><img src="logo-badge.png" alt="Mixar" class="h-16 object-contain" onerror="this.remove()"><button data-x>✕</button></div><h3 class="font-extrabold text-lg">الاشتراك والتجديد</h3>${stale ? `<div class="text-xs bg-red-50 text-red-700 rounded p-2">تعذر تحديث الأسعار الآن (تحقق من الاتصال)؛ قد تكون الأسعار المعروضة غير محدثة — أكّد السعر عبر واتساب.</div>` : ""}
    <div class="border rounded-xl p-3"><b>تجربة مجانية</b><div class="text-sm text-slate-600">30 يوماً مجاناً بالكامل عند تسجيل شركة جديدة.</div></div>` +
    L.map(([k, t, d]) => { const pl = p.plans[k], price = on ? pl.disc : pl.base; return `<div class="border rounded-xl p-3"><b>${t}</b> <span class="text-sm text-slate-500">${d}</span>
      <div class="mt-1">${on ? `<s class="text-slate-400">${pl.base}</s> <b class="text-green-700 text-lg">${pl.disc} ج.م</b> <span class="text-xs bg-orange-100 text-orange-800 rounded px-2 py-0.5">ينتهي العرض بعد ${left} يوم</span>` : `<b class="text-lg">${pl.base} ج.م</b>`}</div>
      <a href="${wa(t, price)}" target="_blank" rel="noopener" class="btn inline-block mt-2 text-sm">تأكيد الدفع عبر واتساب</a></div>`; }).join("") +
    renewalForm() + `<div class="bg-amber-50 rounded-xl p-3 text-sm">ادفع على محفظة اتصالات كاش: <b dir="ltr">${PAY_NO}</b> <button data-copy class="underline font-bold mr-2">نسخ الرقم</button></div></div>`;
  o.onclick = ev => { if (ev.target.closest("[data-rn]")) return sendRenewal(o); if (ev.target === o || ev.target.closest("[data-x]")) o.remove(); if (ev.target.closest("[data-copy]")) navigator.clipboard.writeText(PAY_NO).then(() => alert("تم نسخ الرقم")); };
  document.body.appendChild(o);
}

/* ---------- الباقات والسعات + قفل الجلسة الواحدة ---------- */
const APP_VERSION = "v27";
const ACC_MODS = ["dashboard", "vehicles", "expenses", "advances", "inventory", "rent", "acct", "reports", "costing", "audit", "settings", "accounts"];
const PLAN_DEFS = {
  accountant_solo: { label: "محاسب فردي", maxUsers: 1, maxSites: 1, modules: ACC_MODS },
  accountant_team: { label: "مكتب / فريق محاسبة", maxUsers: 5, maxSites: 3, modules: ACC_MODS },
  workshop_pro: { label: "ورشة وصيانة", maxUsers: 10, maxSites: 2, modules: ["dashboard", "vehicles", "readings", "parts", "down", "inventory", "ops", "quick", "expenses", "reports", "audit", "settings", "accounts"] },
  hse_gate_pro: { label: "السلامة والبوابات", maxUsers: 10, maxSites: 3, modules: ["dashboard", "vehicles", "quick", "down", "ops", "reports", "audit", "settings", "accounts"] },
  company_starter: { label: "شركة — بداية", maxUsers: 5, maxSites: 1, modules: "all" },
  company_growth: { label: "شركة — نمو", maxUsers: 15, maxSites: 3, modules: "all" },
  company_enterprise: { label: "شركة — مؤسسات", maxUsers: 100, maxSites: 20, modules: "all" }
};
const planInfo = c => { const d = PLAN_DEFS[(c || {}).planType] || PLAN_DEFS.company_growth; return { label: d.label, maxUsers: (c || {}).maxUsers ?? d.maxUsers, maxSites: (c || {}).maxSites ?? d.maxSites, modules: (c && c.enabledModules && c.enabledModules.length) ? c.enabledModules : d.modules }; };
const curCo = () => isDev() ? companies.find(x => x.id === ACCESS.scope) : myCo;
function planHidden() {                                                  // الواجهة الديناميكية: صفحات خارج الباقة لا تُرسم
  const m = isDev() ? "all" : planInfo(myCo).modules, out = [];
  if (ACCESS.pages && !isDev() && !isWsAdmin()) ALL_PAGES.forEach(p => { if (!ACCESS.pages.includes(p) && !["dashboard", "settings", "accounts"].includes(p)) out.push(p); });
  if (m !== "all") ALL_PAGES.forEach(p => { if (!m.includes(p) && !["dashboard", "settings", "accounts"].includes(p)) out.push(p); });
  return out;
}
function applyPlan() { if (typeof applyPages === "function") applyPages(); renderAccess(); }
function usedSeats() { return accUsers().filter(u => u.status === "active" && (!isDev() || (u.ws || "main") === ACCESS.scope)).length; }
function seatOk() {
  const max = planInfo(curCo()).maxUsers, used = usedSeats(); if (used < max) return true;
  if (isDev()) return confirm(`وصلت الشركة للحد الأقصى (${max}). تجاوزه؟`);
  alert(`وصلت للحد الأقصى للمستخدمين في باقتك (${max}). رقّ الباقة لإضافة موظفين.`); return false;
}
function planCard() {
  const c = curCo(); if (!c) return "";
  const p = planInfo(c), used = usedSeats(), warn = used >= p.maxUsers ? "bg-red-50 text-red-700 border-red-300" : used >= p.maxUsers - 1 && p.maxUsers > 1 ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-slate-50 text-slate-700";
  return `<div class="border rounded-xl p-3 mb-3 text-sm ${warn}"><b>${esc(p.label)}</b> · المستخدمون: ${used} / ${p.maxUsers} · المواقع: حتى ${p.maxSites}${used >= p.maxUsers ? " — وصلت للحد الأقصى، رقّ الباقة" : ""}</div>`;
}
async function startSession() {                                          // مقعد واحد: جلسة واحدة فقط
  if (isDev() || !S.listen || !myCo || planInfo(myCo).maxUsers !== 1 || startSession.done) return; startSession.done = true;
  ACCESS.sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try {                                                                  // م8: تعارض الجلسة — اعرض الجهاز النشط
    const ex = S.get ? await S.get("sessions", ACCESS.uid) : null;
    if (ex && ex.sid && Date.now() - (ex.at || 0) < 150000 && !(typeof P8 !== "undefined" && P8.sessionConflict ? await P8.sessionConflict(ex) : confirm("الحساب مفتوح على جهاز آخر (" + (ex.device || "غير معروف") + "). إنهاء الجلسة الأخرى والدخول من هنا؟"))) { await S.logout(); return location.reload(); }
    await S.rawSet("sessions", ACCESS.uid, { ws: ACCESS.ws, sid: ACCESS.sid, at: Date.now(), device: deviceInfo().slice(0, 120) });
    setInterval(() => { if (!document.hidden) S.rawSet("sessions", ACCESS.uid, { at: Date.now() }).catch(() => {}); }, 60000);
  } catch (e) { return; }
  S.listen("sessions", ACCESS.ws, rows => {
    const m = rows.find(r => r.id === ACCESS.uid);
    if (m && m.sid !== ACCESS.sid) { alert("تم فتح هذا الحساب من جهاز أو متصفح آخر، وسيتم إنهاء هذه الجلسة."); S.logout().then(() => location.reload()); }
  });
}

/* ---------- صائد الأخطاء الصامت (system_errors) ---------- */
const ERR = { sent: 0, seen: {} };
const fp = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
async function reportErr(msg, file, line, stack) {
  try {
    if (!S || !S.bump || !ACCESS.uid) return;
    const id = (ACCESS.ws || "x") + "_" + fp(`${APP_VERSION}|${msg}|${file}|${line}`);
    if (ERR.seen[id] || ERR.sent >= 5) return; ERR.seen[id] = 1; ERR.sent++;   // بصمة واحدة = مستند واحد بعدّاد، وبحد أقصى 5 في الجلسة
    await S.bump("system_errors", id, { msg: String(msg).slice(0, 300), file: String(file || "").split("/").pop().slice(0, 80), line: line || 0, stack: String(stack || "").slice(0, 1500), version: APP_VERSION, ws: ACCESS.ws || "", lastUser: ACCESS.email || "", lastDevice: deviceInfo().slice(0, 120) });
  } catch (e) {}
}
window.addEventListener("error", e => reportErr(e.message, e.filename, e.lineno, e.error && e.error.stack));
window.addEventListener("unhandledrejection", e => { const r = e.reason || {}; reportErr(r.message || String(r), "promise", 0, r.stack); });

/* ---------- قوالب الأدوار التسعة + المواقع + إخفاء الأسعار + سجل التدقيق ---------- */
const P = (...on) => ({ canAddEquipment: false, canEditDeleteEquipment: false, canAddTransactions: false, canEditDeleteTransactions: false, canManageCustody: false, canExportPrint: false, isWorkspaceAdmin: false, viewFinancials: false, canApprove: false, ...Object.fromEntries(on.map(k => [k, true])) });
const ROLE_TPL = {
  general_manager: { label: "مدير عام / مدير مساحة", perms: P("canAddEquipment", "canEditDeleteEquipment", "canAddTransactions", "canEditDeleteTransactions", "canManageCustody", "canExportPrint", "isWorkspaceAdmin", "viewFinancials", "canApprove"), pages: null },
  project_accountant: { label: "محاسب مشاريع ومواقع", perms: P("canAddTransactions", "canEditDeleteTransactions", "canManageCustody", "canExportPrint", "viewFinancials", "canApprove"), pages: ["dashboard", "vehicles", "expenses", "advances", "inventory", "rent", "acct", "reports", "costing", "audit"] },
  financial_auditor: { label: "مراجع مالي", perms: P("canExportPrint", "viewFinancials"), pages: ["dashboard", "expenses", "advances", "acct", "reports", "costing", "audit", "rent"] },
  operations_supervisor: { label: "مهندس / مشرف تشغيل", perms: P("canAddTransactions"), pages: ["dashboard", "vehicles", "readings", "ops", "quick", "down", "prod", "fuel", "reports"] },
  workshop_maintenance: { label: "مسؤول ورشة وصيانة", perms: P("canAddTransactions", "canEditDeleteTransactions"), pages: ["dashboard", "vehicles", "parts", "down", "inventory", "quick", "readings"] },
  warehouse_fuel: { label: "مسؤول مخزن وسولار", perms: P("canAddTransactions", "canEditDeleteTransactions"), pages: ["dashboard", "inventory", "fuel", "vehicles"] },
  safety_gate: { label: "مسؤول سلامة وبوابات", perms: P("canAddTransactions"), pages: ["dashboard", "quick", "down", "vehicles"] },
  fleet_rental_monitor: { label: "مراقب إيجارات ومعدات", perms: P("viewFinancials"), pages: ["dashboard", "vehicles", "rent", "readings", "reports"] },
  viewer_readonly: { label: "مشاهد / مراقب فقط", perms: P(), pages: ["dashboard", "vehicles", "reports"] }
};
const canSeeMoney = () => isDev() || isAdm() || !!(ACCESS.perms || {}).isWorkspaceAdmin || (ACCESS.perms || {}).viewFinancials !== false;
const restricted = () => !isDev() && !isWsAdmin() && Array.isArray(ACCESS.sites) && !ACCESS.sites.includes("*");
const siteStamp = () => restricted() && ACCESS.sites[0] ? { siteId: ACCESS.sites[0] } : {};
function bootShield(on) {                                                // لا وميض لبيانات غير مفلترة قبل اكتمال الصلاحيات
  let s = $("#boot-shield");
  if (!s) { s = document.createElement("div"); s.id = "boot-shield"; s.className = "fixed inset-0 z-[90] bg-white grid place-items-center font-bold text-slate-500"; s.textContent = "جارٍ تجهيز بياناتك…"; document.body.appendChild(s); }
  s.classList.toggle("hidden", !on);
}
function auditEvt(type, target, summary) {
  if (!S || !S.rawAdd || !ACCESS.uid) return;
  S.rawAdd("audit_logs", { ws: ACCESS.scope || ACCESS.ws, workspaceId: ACCESS.scope || ACCESS.ws, uid: ACCESS.uid, name: ACCESS.name || ACCESS.email || "", role: ACCESS.tpl || ACCESS.role || "", siteId: (ACCESS.sites || ["*"])[0], type, target: String(target || ""), summary: String(summary || "").slice(0, 300), at: Date.now() }).catch(() => {});
}
document.addEventListener("click", ev => { if (ev.target.closest("#export-btn")) auditEvt("export", "reports", "تصدير تقرير"); }, true);

/* ---------- مواقع الشركة + تدقيق تلقائي + تنبيهات + مؤشرات + تجديد + نسخ احتياطي (v25) ---------- */
const coId = () => isDev() ? (companies.some(x => x.id === ACCESS.scope) ? ACCESS.scope : "") : ACCESS.ws;
const curWs = () => isDev() ? ACCESS.scope : ACCESS.ws;
let rnList = [];
async function refreshCo() { if (isDev()) companies = await listSafe("companies"); else await loadCo(); renderAccess(); }
function sitesCard() {
  const c = curCo(); if (!c) return "";
  const s = c.sites || [], max = planInfo(c).maxSites;
  return `<div class="border rounded-xl p-3 mb-3 text-sm"><b>مواقع الشركة</b> (${s.length} / ${max})<div class="flex flex-wrap gap-2 my-2">${s.map(n => `<span class="bg-slate-100 rounded-lg px-2 py-1">${esc(n)} <button data-a="sitedel" data-id="${esc(n)}" class="text-red-600 font-bold">✕</button></span>`).join("") || "<span class='text-slate-500'>لا مواقع بعد</span>"}</div><div class="flex gap-2"><input id="site-new" class="inp !w-48" placeholder="اسم موقع جديد"><button data-a="siteadd" class="btn">إضافة</button></div></div>`;
}
function tplControls(u) {
  const reg = (curCo() || {}).sites || [], mine = u.assignedSites || ["*"], all = [...new Set([...reg, ...mine.filter(x => x !== "*")])];
  return `<div class="flex flex-wrap gap-2 mt-2 items-center text-sm"><select data-tpl="${esc(u.id)}" class="inp !py-1 !w-auto"><option value="">قالب الدور…</option>${Object.entries(ROLE_TPL).map(([k, t]) => `<option value="${k}" ${u.template === k ? "selected" : ""}>${t.label}</option>`).join("")}</select>
    <label><input type="checkbox" data-site-chk="${esc(u.id)}" value="*" ${mine.includes("*") ? "checked" : ""} class="ml-1">كل المواقع</label>${all.map(n => `<label><input type="checkbox" data-site-chk="${esc(u.id)}" value="${esc(n)}" ${mine.includes(n) ? "checked" : ""} class="ml-1">${esc(n)}</label>`).join("")}</div>`;
}
const userOp = (col, d) => !!d && (d.kind === "user" || d.perms || d.template || d.assignedSites || (col === "biz" && (["active", "suspended", "cancelled"].includes(d.status) || d.role || d.ws)));   // عمليات الحسابات تُسجَّل كـ user_action
const findRec = (col, id) => {
  const pool = { vehicles, expenses, advances, operations, inventory, costings: typeof costings !== "undefined" ? costings : [], materials: typeof matList !== "undefined" ? matList : [], biz: [...(typeof xbiz !== "undefined" ? xbiz : []), ...(typeof biz !== "undefined" ? biz : [])], acct: typeof acct !== "undefined" ? acct : [] };
  return (pool[col] || []).find(x => x.id === id);
};
function hookAudit() { /* م9: التغليف الوحيد في wrapAudit (app.js) — يكتب auditlog وaudit_logs معاً */ }
const alRows = () => { const q = (accData.q || "").trim(), f = accData.f ? dayStart(accData.f) : 0, t = accData.to ? dayEnd(accData.to) : 0;
  return (accData.al || []).filter(r => (!q || JSON.stringify(r).includes(q)) && (!accData.t || r.type === accData.t) && (!f || r.at >= f) && (!t || r.at <= t)); };
function alertsList() {
  const o = [];
  if (myCo && !isDev()) { const d = dayLeft(myCo); if (locked()) o.push("🔒 اشتراك شركتك منتهٍ — جدّد لاستعادة الإضافة والتعديل."); else if (d <= 7) o.push(`⏳ ينتهي اشتراك شركتك خلال ${d} يوم.`); }
  if (canPage()) { const n = accUsers().filter(u => u.status === "pending").length; if (n) o.push(`👤 ${n} طلب انضمام بانتظار الاعتماد.`); }
  if (isDev()) { const n = rnList.filter(r => r.status === "pending").length, e = companies.filter(x => x.status === "active" && dayLeft(x) > 0 && dayLeft(x) <= 7).length; if (n) o.push(`💳 ${n} طلب تجديد بانتظار الاعتماد.`); if (e) o.push(`⏳ ${e} شركة ينتهي اشتراكها خلال 7 أيام.`); }
  try { const n = activeVehicles().filter(v => oilLeft(v) <= 0).length; if (n) o.push(`🛢️ ${n} معدة تجاوزت موعد تغيير الزيت.`); } catch (e) {}
  try { const d = docAlerts(); if (Array.isArray(d) && d.length) o.push(`📄 ${d.length} تنبيه تراخيص/مستندات.`); } catch (e) {}
  return o;
}
function renderBell() {
  let b = $("#bell");
  if (!b) {
    b = document.createElement("button"); b.id = "bell"; b.className = "relative text-xl px-2"; b.innerHTML = `🔔<span id="bell-n" class="hidden absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1"></span>`;
    $("header").lastElementChild.before(b);
    b.onclick = () => { let p = $("#bell-pop"); if (p) return p.remove(); p = document.createElement("div"); p.id = "bell-pop"; p.className = "fixed top-16 left-2 z-50 bg-white border rounded-xl shadow-xl p-3 w-72 text-sm space-y-2"; const l = alertsList(); p.innerHTML = l.length ? l.map(x => `<div>${x}</div>`).join("") : "لا توجد تنبيهات."; p.onclick = () => p.remove(); document.body.appendChild(p); };
  }
  const n = alertsList().length, e = $("#bell-n"); e.textContent = n; e.classList.toggle("hidden", !n);
}
function kpiCards() {
  const c = companies, live = x => x.status === "active" && dayLeft(x) > 0;
  const k = [["إجمالي الشركات", c.length], ["نشطة (مدفوعة)", c.filter(x => live(x) && x.plan !== "trial").length], ["تجريبية", c.filter(x => live(x) && x.plan === "trial").length], ["منتهية / موقوفة", c.filter(x => !live(x)).length], ["تنتهي خلال 7 أيام", c.filter(x => live(x) && dayLeft(x) <= 7).length], ["المعدات (المنصة)", (accData.vs || []).length], ["المستخدمون النشطون", accUsers().filter(u => u.status === "active").length]];
  return `<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">${k.map(([l, v]) => `<div class="border rounded-xl p-3 text-center"><div class="text-2xl font-extrabold">${v}</div><div class="text-xs text-slate-500">${l}</div></div>`).join("")}</div>`;
}
function renewalForm() {
  return `<div class="border rounded-xl p-3 space-y-2"><b>حوّلت المبلغ؟ سجّل طلب التجديد</b><select id="rn-plan" class="inp"><option value="month">الشهرية (30 يوماً)</option><option value="quarter">ربع السنوية (90 يوماً)</option><option value="year">السنوية (365 يوماً)</option></select><input id="rn-ref" class="inp" placeholder="رقم عملية التحويل / الرقم المحوّل منه"><input id="rn-file" type="file" accept="image/*" class="inp"><button data-rn class="btn">إرسال طلب التجديد</button></div>`;
}
async function cloudUpload(file) {
  try { cl = cl || await S.get("app_config", "cloudinary"); } catch (e) { cl = null; }
  if (!cl || !cl.cloud || !cl.preset) { if (S.upload) return await S.upload(file); throw new Error("cloudinary"); }   // بديل: ImgBB
  const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", cl.preset);
  const j = await (await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cl.cloud)}/auto/upload`, { method: "POST", body: fd })).json();
  if (!j.secure_url) throw new Error("upload"); return j.secure_url;
}
async function sendRenewal(o) {
  const ref = $("#rn-ref").value.trim(), f = $("#rn-file").files[0], co = myCo || {}, b = o.querySelector("[data-rn]");
  if (!ref) return alert("اكتب رقم عملية التحويل أو الرقم المحوّل منه.");
  b.disabled = true; let url = "";
  if (f) { try { url = await cloudUpload(f); } catch (e) { if (!confirm("تعذر رفع صورة الإيصال. إرسال الطلب بدونها؟")) { b.disabled = false; return; } } }
  try { await S.rawAdd("renewal_requests", { ws: ACCESS.ws, company: co.name || "", code: co.code || "", plan: $("#rn-plan").value, ref: ref.slice(0, 80), receipt: url, status: "pending", uid: ACCESS.uid, at: Date.now() }); alert("تم إرسال طلب التجديد، سيراجعه فريق ميكسار."); o.remove(); }
  catch (e) { dbErr(e); }
  b.disabled = false;
}
async function exportBackup() {
  const ws = curWs(), data = {};
  try { for (const c of WS_COLS) data[c] = (await S.list(c)).filter(r => (r.workspaceId || "main") === ws && r.kind !== "user"); } catch (e) { return dbErr(e); }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: "mixar-saas", version: APP_VERSION, workspaceId: ws, exportedAt: Date.now(), data })], { type: "application/json" }));
  a.download = `mixar-saas-backup-${ws}-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href);
  auditEvt("backup_export", ws, "تصدير نسخة احتياطية");
}
async function restoreBackup(file) {
  let o; try { o = JSON.parse(await file.text()); } catch (e) { return alert("ملف غير صالح."); }
  const ws = curWs(); if (!o || o.app !== "mixar-saas" || o.workspaceId !== ws || typeof o.data !== "object") return alert("هذه النسخة لا تخص مساحة العمل الحالية.");
  if (!confirm("ستُعاد كتابة سجلات هذه النسخة فوق الحالية. متابعة؟")) return;
  let n = 0;
  try { for (const c of WS_COLS) for (const { id, ...d } of (o.data[c] || [])) { if (!id || d.kind === "user") continue; await S.rawSet(c, id, { ...d, workspaceId: ws }); n++; } alert(`تمت استعادة ${n} سجل.`); auditEvt("backup_restore", ws, n + " سجل"); await loadData(); }
  catch (e) { dbErr(e); }
}
function injectBackup() {
  if ($("#bk-card") || !canPage()) return;
  const old = $("#bk-json"); if (old) old.classList.add("hidden");   // نخفي زر JSON القديم فقط؛ أزرار Excel وCSV تبقى
  const c = document.createElement("div"); c.id = "bk-card"; c.className = "card space-y-2 mb-3";
  c.innerHTML = `<h3 class="font-extrabold">النسخ الاحتياطي</h3><div class="flex flex-wrap gap-2"><button id="bk-exp" class="btn">تصدير نسخة احتياطية (JSON)</button><label class="btn cursor-pointer">استعادة من نسخة احتياطية<input id="bk-file" type="file" accept="application/json" class="hidden"></label></div>`;
  $("#view-settings").prepend(c); $("#bk-exp").onclick = exportBackup; $("#bk-file").onchange = e => { if (e.target.files[0]) restoreBackup(e.target.files[0]); e.target.value = ""; };
}
