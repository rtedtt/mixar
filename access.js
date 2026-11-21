/* access.js (v30) — التسجيل الذاتي واعتماد الحسابات والمساعد الذكي + دمج patch-v27 | يعتمد على app.js */
const DEV_EMAIL = "belalbelalmoh@gmail.com", ADMIN_EMAIL = "no-admin@invalid";
const DEFAULT_AI_URL = "https://mixar-ai.belalbelalmoh.workers.dev";
const ACCESS = { role: "", site: "", appRole: "" };
const ownerRole = e => { e = String(e || "").toLowerCase(); return e === DEV_EMAIL ? "dev" : e === ADMIN_EMAIL ? "admin" : ""; };
const ACC_ROLES = { accountant: "محاسب / مهندس موقع", admin: "مدير" };
const accUsers = () => urs;

/* ---------- شاشة الدخول والتسجيل المنظمة (3 تبويبات + رجوع للصفحة التعريفية) ---------- */
(function injectLoginUI() {
  const btn = $("#login-btn"); if (!btn) return;
  const lbl = (t, h) => `<label class="block text-xs font-bold text-slate-600 mb-1">${t}</label>${h}`;
  const inp = (id, ph, t = "text") => `<input id="${id}" type="${t}" placeholder="${ph}" class="inp mb-2.5" ${t !== "text" ? 'dir="ltr"' : ""}>`;

  const navTop = document.createElement("div");
  navTop.className = "mb-4 space-y-3";
  navTop.innerHTML = `
    <div class="flex justify-between items-center">
      <button type="button" id="back-landing" class="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1">← العودة للصفحة التعريفية</button>
      <span class="text-xs font-bold text-slate-400">ميكسار SaaS</span>
    </div>
    <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-extrabold">
      <button type="button" data-amode="login" class="py-2 rounded-lg bg-white text-slate-900 shadow-sm">تسجيل الدخول</button>
      <button type="button" data-amode="co" class="py-2 rounded-lg text-slate-600">شركة جديدة</button>
      <button type="button" data-amode="join" class="py-2 rounded-lg text-slate-600">انضمام بكود</button>
    </div>`;
  const firstField = $("#email")?.previousElementSibling?.tagName === "LABEL" ? $("#email").previousElementSibling : $("#email");
  if (firstField) firstField.before(navTop); else btn.before(navTop);

  const reg = document.createElement("div");
  reg.id = "reg-box"; reg.className = "hidden text-right";
  reg.innerHTML = `
    <input type="hidden" id="reg-kind" value="co">
    <div data-k="co">
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-xs text-orange-800 mb-3">تجربة مجانية 30 يوماً شاملة جميع المميزات، وسيتم توليد كود شركة خاص بك لإضافة موظفيك.</div>
      ${lbl("اسم الشركة أو المحطة", inp("reg-co", "مثال: شركة النيل للخرسانة"))}
      ${lbl("نوع النشاط", `<select id="reg-type" class="inp mb-2.5"><option>خرسانة جاهزة</option><option>خلاطة أسفلت</option><option>معدات ومقاولات</option></select>`)}
      ${lbl("رقم الهاتف (واتساب)", inp("reg-phone", "01xxxxxxxxx", "tel"))}
    </div>
    <div data-k="join" class="hidden">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-800 mb-3">أدخل كود الشركة الذي حصلت عليه من مديرك (يبدأ بـ MX-) ليصل طلبك للاعتماد.</div>
      ${lbl("كود الشركة", inp("reg-code", "MX-1001"))}
      ${lbl("المسمى الوظيفي", inp("reg-job", "مثال: محاسب / مشرف موقع"))}
    </div>
    ${lbl("الاسم بالكامل", inp("reg-name", "الاسم الثلاثي"))}
    ${lbl("البريد الإلكتروني", inp("reg-email", "name@example.com", "email"))}
    ${lbl("كلمة المرور (6 أحرف على الأقل)", `<div class="relative mb-2.5"><input id="reg-pass" type="password" dir="ltr" placeholder="••••••••" class="inp !mb-0 pl-10"><button type="button" id="toggle-rpass" class="absolute left-2.5 top-2.5 text-slate-400 text-sm">👁️</button></div>`)}
    <button type="button" id="reg-btn" class="btn w-full mt-1">إنشاء الشركة وبدء التجربة</button>`;
  btn.before(reg);

  const links = document.createElement("div");
  links.id = "login-links";
  links.className = "mt-3 flex justify-center text-xs font-bold text-orange-600";
  links.innerHTML = `<button type="button" id="to-forgot">نسيت كلمة المرور؟</button>`;
  btn.after(links);

  $("#back-landing").onclick = () => { if (typeof window.showLanding === "function") window.showLanding(); };
  $("#toggle-rpass").onclick = () => { const p = $("#reg-pass"); p.type = p.type === "password" ? "text" : "password"; };

  window.setAuthMode = m => {
    const isReg = m === "co" || m === "join";
    navTop.querySelectorAll("[data-amode]").forEach(b => {
      const active = b.dataset.amode === m;
      b.className = active ? "py-2 rounded-lg bg-white text-slate-900 shadow-sm" : "py-2 rounded-lg text-slate-600";
    });
    $("#reg-box").classList.toggle("hidden", !isReg);
    $("#login-links").classList.toggle("hidden", isReg);
    ["#email", "#password", "#login-btn"].forEach(s => {
      const el = $(s); if (!el) return;
      (el.previousElementSibling && el.previousElementSibling.tagName === "LABEL" ? [el.previousElementSibling, el] : [el]).forEach(x => x.classList.toggle("hidden", isReg));
    });
    if (isReg) {
      $("#reg-kind").value = m;
      document.querySelectorAll("[data-k]").forEach(d => d.classList.toggle("hidden", d.dataset.k !== m));
      $("#reg-btn").textContent = m === "co" ? "إنشاء الشركة وبدء التجربة (30 يوم)" : "إرسال طلب الانضمام للشركة";
    }
    $("#login-error")?.classList.add("hidden");
  };

  navTop.querySelectorAll("[data-amode]").forEach(b => b.onclick = () => window.setAuthMode(b.dataset.amode));

  const fail = m => { const e = $("#login-error"); if (e) { e.textContent = m; e.classList.remove("hidden"); } else alert(m); };
  $("#to-forgot").onclick = async () => {
    const who = (prompt("اكتب اسمك أو بريدك الإلكتروني ليصل طلب استعادة الدخول للمطور:") || "").trim(); if (!who) return;
    if (!S.rawAdd) return fail("متاح مع Firebase فقط.");
    try { await S.rawAdd("password_requests", { who: who.slice(0, 90), device: deviceInfo().slice(0, 180), at: Date.now(), status: "open" }); alert("تم إرسال طلبك للمطور."); }
    catch (ex) { fail("تعذر إرسال الطلب (" + (ex.code || "") + ")"); }
  };

  $("#reg-btn").onclick = async () => {
    const b = $("#reg-btn"), v = id => (($("#" + id) || {}).value || "").trim(), kind = v("reg-kind");
    const name = v("reg-name"), email = v("reg-email"), pass = $("#reg-pass").value, co = v("reg-co"), phone = v("reg-phone"), code = v("reg-code").toUpperCase(), job = v("reg-job");
    if (!name || !email || pass.length < 6 || (kind === "co" ? !co || !phone : !code || !job)) return fail("أكمل كل الحقول المطلوبة (كلمة المرور 6 أحرف على الأقل).");
    if (!S.register) return fail("إنشاء الحساب يعمل مع Firebase فقط.");
    b.disabled = true;
    try {
      let target = null;
      if (kind === "join") { target = await S.get("codes", code); if (!target) { b.disabled = false; return fail("كود الشركة غير صحيح، تأكد منه من مدير الشركة."); } }
      const u = await S.register(email, pass), uid = u.user.uid, base = { kind: "user", name, email: email.toLowerCase(), phone, device: deviceInfo(), createdAt: Date.now() };
      if (kind === "co") {
        const c = "MX-" + (1000 + Math.floor(Math.random() * 9000));
        await S.rawSet("codes", c, { ws: uid });
        await S.rawSet("companies", uid, { name: co, code: c, type: v("reg-type"), phone, planType: "company_starter", maxUsers: 5, maxSites: 1, plan: "trial", status: "active", expiresAt: expMs(30), createdAt: Date.now() });
        await S.rawSet("biz", uid, { ...base, job: "مدير الشركة", role: "admin", status: "active", ws: uid, wsName: co, perms: { ...DEFAULT_PERMS, isWorkspaceAdmin: true } });
      } else await S.rawSet("biz", uid, { ...base, job, role: "accountant", status: "pending", ws: target.ws, perms: { ...DEFAULT_PERMS, isWorkspaceAdmin: false } });
      location.reload();
    } catch (ex) { fail(ex.code === "auth/email-already-in-use" ? "هذا البريد مسجّل بالفعل — انتقل لتبويب تسجيل الدخول." : "تعذر إنشاء الحساب (" + (ex.code || "") + ")"); }
    b.disabled = false;
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
  loadAi();
}
async function accessGate(user) {
  $("#pending")?.remove();
  if (!S.get) return true;
  const own = ownerRole(user.email); let c = null;
  try { c = JSON.parse(localStorage.getItem(CK)); } catch (e) {}
  if (c && c.uid !== user.uid) c = null;
  if (!navigator.onLine && c) { applyRec(user, c.rec, c.own); return true; }
  let rec = null, ok = false;
  try { rec = await S.get("biz", user.uid); ok = true; } catch (e) { console.warn("gate", e && e.code); }
  if (!ok && c) { applyRec(user, c.rec, c.own); return true; }
  if (own) {
    const all = Object.fromEntries(Object.keys(DEFAULT_PERMS).map(k => [k, true]));
    if (ok && (!rec || rec.status !== "active" || rec.role !== own || rec.ws !== "owner"))
      try { await S.rawSet("biz", user.uid, { kind: "user", name: rec?.name || (own === "dev" ? "المطور" : "المدير"), email: user.email.toLowerCase(), role: own, status: "active", ws: "owner", perms: all }); } catch (e) { console.warn(e); }
    applyRec(user, { perms: all }, own); return true;
  }
  if (rec && rec.status === "active") { if (await maintBlocked()) return false; applyRec(user, rec); return true; }
  try { localStorage.removeItem(CK); } catch (e) {}
  const st = rec && rec.status, off = st === "disabled" || st === "suspended", can = st === "cancelled", el = document.createElement("section");
  el.id = "pending"; el.className = "fixed inset-0 z-50 grid place-items-center bg-slate-900 p-4";
  el.innerHTML = `<div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4"><div class="text-4xl">${can ? "🚫" : off ? "⛔" : "⏳"}</div>
    <h2 class="font-extrabold">${can ? "تم إلغاء حسابك، يرجى التواصل مع الإدارة" : off ? "تم إيقاف حسابك مؤقتاً، يرجى التواصل مع الإدارة" : "تم إرسال طلبك للإدارة وبانتظار التفعيل"}</h2>
    <button id="pd-refresh" class="btn w-full">تحديث الحالة</button><button id="pd-out" class="w-full py-2.5 rounded-xl bg-slate-200 font-bold">تسجيل الخروج</button></div>`;
  document.body.appendChild(el);
  $("#pd-refresh").onclick = () => location.reload();
  $("#pd-out").onclick = async () => { try { localStorage.removeItem(CK); } catch (e) {} await S.logout(); el.remove(); if (typeof window.showLanding === "function") window.showLanding(); };
  return false;
}

/* ---------- مساحات العمل: ختم السجلات + عزل القراءة ---------- */
const WS_COLS = ["vehicles", "expenses", "advances", "inventory", "operations", "costings", "materials", "acct", "biz"];
function listRef(fs, db, col) {
  if (col === "biz@users") return fs.query(fs.collection(db, "biz"), fs.where("kind", "==", "user"), fs.where("ws", "==", ACCESS.ws), fs.where("status", "in", ["pending", "active", "suspended"]));
  if (col === "audit_logs" && ACCESS.role !== "dev") return fs.query(fs.collection(db, col), fs.where("ws", "==", ACCESS.ws));
  const r = fs.collection(db, col);
  return ACCESS.role && ACCESS.role !== "dev" && WS_COLS.includes(col) ? (restricted() ? (ACCESS.sites.length ? ACCESS.sites : []).slice(0, 5).map(s => fs.query(r, fs.where("workspaceId", "==", ACCESS.ws), fs.where("siteId", "==", s))) : fs.query(r, fs.where("workspaceId", "==", ACCESS.ws))) : r;
}
function stampNew(col, d) {
  return ["users", "auditlog", "audit_logs", "password_requests", "dev_logs", "chat_msgs", "presence", "app_config"].includes(col) ? d : { workspaceId: ACCESS.scope || "main", createdBy: ACCESS.email || "", ...d, ...siteStamp() };
}
function scopeData() {
  if (!ACCESS.scope) return;
  const ok = r => (r.workspaceId || "main") === ACCESS.scope && (!restricted() || ACCESS.sites.includes(r.siteId));
  vehicles = vehicles.filter(ok); expenses = expenses.filter(ok); advances = advances.filter(ok);
  inventory = inventory.filter(ok); operations = operations.filter(ok);
  xbiz = xbiz.filter(x => x.kind !== "user" && ok(x));
}
function hookPrint() {
  if (typeof window.printDoc === "function" && !window.printDoc._co) {
    const _printDoc = window.printDoc;
    window.printDoc = function (doc) {
      const coName = myCo && myCo.name;
      if (doc && coName && !String(doc.title || "").includes(coName)) doc = { ...doc, title: `${coName} — ${doc.title || ""}` };
      return _printDoc(doc);
    };
    window.printDoc._co = true;
  }
}
async function scopeExt() {
  const ok = r => (r.workspaceId || "main") === ACCESS.scope && (!restricted() || ACCESS.sites.includes(r.siteId));
  urs = isDev() ? biz.filter(x => x.kind === "user") : [];
  biz = biz.filter(x => x.kind !== "user" && ok(x)); acct = acct.filter(ok);
  if (ACCESS.role === "admin") urs = await listSafe("biz@users");
  if (isDev()) companies = await listSafe("companies"); else await loadCo();
  applyPermUI(); renderAccess(); renderSub(); initChat(); applyPlan(); startSession(); hookAudit(); hookPrint(); if (isDev()) rnList = await listSafe("renewal_requests"); renderBell(); injectBackup(); renderOnboard(); loadAi(); buildBnav(); buildHub(); inspectBar(); renderBroadcast();
}
const isDev = () => ACCESS.role === "dev", isAdm = () => ACCESS.role === "admin", canPage = () => isDev() || isAdm();
let urs = [], presAll = {};

/* ---------- سجل الأخطاء للمطور ---------- */
const deviceInfo = () => {
  const u = navigator.userAgent, os = /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Windows/.test(u) ? "Windows" : /Mac/.test(u) ? "Mac" : "Linux/غير معروف";
  const br = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "متصفح";
  return `${os}${((u.match(/Android[^;]*;\s*([^)]+)\)/) || [])[1] || "").trim().replace(/^/, " ")} · ${br}`.replace("  ", " ");
};

/* ---------- صفحة إدارة الحسابات والصلاحيات ---------- */
const PERM_LABELS = { canAddEquipment: "إضافة معدات", canEditDeleteEquipment: "تعديل/حذف المعدات", canAddTransactions: "تسجيل مصروفات وساعات", canEditDeleteTransactions: "تعديل/حذف الحركات", canManageCustody: "إدارة العُهد", canExportPrint: "تصدير وطباعة", isWorkspaceAdmin: "إدارة مساحة العمل", viewFinancials: "رؤية الأسعار والمبالغ", canApprove: "اعتماد العمليات" };
const TABS = { audit: "سجل التدقيق", plat: "المنصة والشركات", rn: "طلبات التجديد", su: "طلبات الاشتراك", req: "طلبات الاعتماد", forgot: "استعادة الدخول", acc: "الحسابات والصلاحيات", dev: "لوحة المطور" };
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

async function renderAccounts() {
  const v = $("#view-accounts"); if (!v || !canPage()) return;
  if (!isDev() && !["req", "acc", "audit"].includes(accTab)) accTab = "req";
  if (isDev() && accTab === "plat") { accData.vs = await S.list("vehicles").catch(() => []); accData.pricing = await getPricing(true).catch(() => null); }
  if (isDev() && accTab === "su") accData.su = (await S.list("signup_requests").catch(() => [])).sort((x, y) => (y.at || 0) - (x.at || 0));
  if (isDev() && accTab === "rn") accData.rn = (await S.list("renewal_requests").catch(() => [])).sort((x, y) => (y.at || 0) - (x.at || 0));
  if (accTab === "audit") accData.al = (await S.list("audit_logs").catch(() => [])).sort((x, y) => y.at - x.at).slice(0, 150);
  if (isDev() && accTab === "dev") accData.ai = await S.get("app_config", "ai_proxy").catch(() => null);
  if (isDev() && accTab === "dev") accData.cl = await S.get("app_config", "cloudinary").catch(() => null);
  if (accTab === "forgot") accData.pr = await S.list("password_requests").catch(() => []);
  if (accTab === "dev") accData.logs = (await S.list("system_errors").catch(() => [])).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)).slice(0, 50);
  const users = accUsers(), th = h => `<thead class="text-slate-500 border-b"><tr>${h.map(x => `<th class="py-2">${x}</th>`).join("")}</tr></thead>`;
  const btn = (a, id, t, c) => `<button data-a="${a}" data-id="${esc(id)}" class="${c} font-bold ml-3">${t}</button>`;
  let body = "";
  if (accTab === "plat") body = kpiCards() + pricingCard() + `<div class="flex flex-wrap gap-2 mb-3 items-end"><input id="nc-name" class="inp !w-auto" placeholder="اسم الشركة"><select id="nc-type" class="inp !w-auto"><option>خرسانة جاهزة</option><option>خلاطة أسفلت</option><option>معدات ومقاولات</option></select><input id="nc-days" type="number" value="30" class="inp !w-24"><button data-a="newco" class="btn">إنشاء شركة</button><button data-a="democo" class="px-4 py-2.5 rounded-xl bg-slate-200 font-bold">إنشاء شركة تجريبية لميكسار</button></div><table class="w-full text-sm text-right">${th(["الشركة", "الكود", "النشاط", "الباقة", "المعدات", "المستخدمون", "الحالة", "الأيام", ""])}<tbody>` + companies.map(c => { const d = dayLeft(c), n = (accData.vs || []).filter(x => (x.workspaceId || "main") === c.id).length, us = accUsers().filter(x => (x.ws || "main") === c.id).length; return `<tr class="border-b"><td class="py-2 font-bold">${esc(c.name)}</td><td dir="ltr">${esc(c.code)}</td><td>${esc(c.type || "")}</td><td><select data-plan="${esc(c.id)}" class="inp !py-1 !w-auto text-xs">${Object.entries(PLAN_DEFS).map(([k, d]) => `<option value="${k}" ${(c.planType || "company_growth") === k ? "selected" : ""}>${d.label}</option>`).join("")}</select></td><td>${n}</td><td>${us}</td><td>${c.status === "active" && d > 0 ? "✅ نشط" : "🔒 مقفل"}</td><td>${d}</td><td class="whitespace-nowrap">${[30, 90, 365].map(x => btn("ext" + x, c.id, "+" + x, "text-green-700")).join("")}${btn("extx", c.id, "مخصص", "text-slate-600")}${btn("cotog", c.id, c.status === "active" ? "إيقاف" : "تفعيل", "text-red-600")}</td></tr>`; }).join("") + `</tbody></table>`;
  if (accTab === "su") body = `<table class="w-full text-sm text-right">${th(["الشركة", "النشاط", "المدير", "الهاتف", "الباقة", "التاريخ", "الحالة", ""])}<tbody>` + (accData.su || []).map(r => `<tr class="border-b"><td class="py-2 font-bold">${esc(r.company)}</td><td>${esc(r.type)}</td><td>${esc(r.name)}</td><td dir="ltr">${esc(r.phone)}</td><td>${esc(r.plan)}</td><td class="text-xs">${dt(r.at)}</td><td>${esc(r.status)}</td><td class="whitespace-nowrap">${r.status === "pending" ? btn("suok", r.id, "تم التواصل", "text-green-700") : ""}${btn("sudel", r.id, "حذف", "text-red-600")}</td></tr>`).join("") + `</tbody></table>`;
  if (accTab === "rn") body = `<table class="w-full text-sm text-right">${th(["الشركة", "الكود", "الباقة", "رقم التحويل", "الإيصال", "التاريخ", "الحالة", ""])}<tbody>` + (accData.rn || []).map(r => `<tr class="border-b"><td class="py-2 font-bold">${esc(r.company)}</td><td dir="ltr">${esc(r.code)}</td><td>${esc(r.plan)}</td><td>${esc(r.ref)}</td><td>${r.receipt ? `<a href="${esc(r.receipt)}" target="_blank" rel="noopener"><img src="${esc(r.receipt)}" class="h-12 rounded"></a>` : "—"}</td><td class="text-xs">${dt(r.at)}</td><td>${esc(r.status)}</td><td class="whitespace-nowrap">${r.status === "pending" ? btn("rnok", r.id, "اعتماد وتمديد", "text-green-700") + btn("rnno", r.id, "رفض", "text-red-600") : ""}</td></tr>`).join("") + `</tbody></table>`;
  if (accTab === "audit") { const q = (accData.q || "").trim(); body = `<div class="flex gap-2 mb-3"><input id="al-q" class="inp" placeholder="بحث في السجل ثم Enter" value="${esc(q)}"><select id="al-type" class="inp !w-auto"><option value="">كل الأحداث</option>${[...new Set((accData.al || []).map(r => r.type))].map(t => `<option ${accData.t === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select><select id="al-user" class="inp !w-auto"><option value="">كل المنفّذين</option>${[...new Set((accData.al || []).map(r => r.name).filter(Boolean))].map(n => `<option ${accData.u === n ? "selected" : ""}>${esc(n)}</option>`).join("")}</select><select id="al-site" class="inp !w-auto"><option value="">كل المواقع</option>${[...new Set((accData.al || []).map(r => r.siteId).filter(Boolean))].map(n => `<option ${accData.s === n ? "selected" : ""}>${esc(n)}</option>`).join("")}</select><input id="al-from" type="date" class="inp !w-auto" value="${accData.f || ""}"><input id="al-to" type="date" class="inp !w-auto" value="${accData.to || ""}"><button data-a="alcsv" class="btn">تصدير CSV</button></div><table class="w-full text-sm text-right">${th(["الوقت", "المنفّذ", "الدور", "الحدث", "الهدف", "التفاصيل"])}<tbody>` + alRows().map(r => `<tr class="border-b text-xs"><td class="py-1">${dt(r.at)}</td><td>${esc(r.name)}</td><td>${esc(r.role)}</td><td>${esc(r.type)}</td><td>${esc(r.target)}</td><td>${esc(r.summary)}</td></tr>`).join("") + `</tbody></table>`; }
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
  if (accTab === "dev") body = aiCard() + toolsCard() + `<div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">إعدادات رفع الميديا (Cloudinary)</div><div class="grid sm:grid-cols-2 gap-2"><input id="cl-cloud" class="inp" placeholder="Cloud Name" dir="ltr" value="${esc(accData.cl?.cloud || "")}"><input id="cl-preset" class="inp" placeholder="Upload Preset (Unsigned)" dir="ltr" value="${esc(accData.cl?.preset || "")}"></div><button data-a="clsave" class="btn">حفظ</button></div><div class="flex gap-2 flex-wrap mb-3"><button data-a="cache" class="btn">تحديث الكاش إجبارياً</button><button data-a="stamp" class="btn">ختم البيانات السابقة بالنطاق الرئيسي</button></div><table class="w-full text-sm text-right">${th(["الوقت", "المستخدم", "الصفحة", "الجهاز", "الخطأ"])}<tbody>` +
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
      if (a === "prsave") { cur.discountStartedAt = pr0.discountStartedAt || 0; cur.discountEndsAt = pr0.discountEndsAt || 0; }
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
      let c = r && companies.find(x => x.id === r.ws); if (r && !c) c = await S.get("companies", r.ws).catch(() => null);
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
      const wid = "co_" + Date.now().toString(36), code = "MX-" + (1000 + Math.floor(Math.random() * 9000));
      await S.rawSet("codes", code, { ws: wid });
      await S.rawSet("companies", wid, { name: "شركة تجريبية لميكسار", code, type: "تجريبي", plan: "manual", planType: "company_growth", maxUsers: 15, maxSites: 3, status: "active", expiresAt: expMs(30), createdAt: Date.now() });
    }
    if (a === "newco") {
      const name = $("#nc-name").value.trim(), days = +$("#nc-days").value || 30; if (!name) { b.disabled = false; return alert("اكتب اسم الشركة."); }
      const wid = "co_" + Date.now().toString(36), code = "MX-" + (1000 + Math.floor(Math.random() * 9000));
      await S.rawSet("codes", code, { ws: wid });
      await S.rawSet("companies", wid, { name, code, type: $("#nc-type").value, plan: "manual", planType: "company_growth", maxUsers: 15, maxSites: 3, status: "active", expiresAt: expMs(days), createdAt: Date.now() });
    }
    if (a === "susp") await S.save("biz", { status: "suspended" }, id);
    if (a === "react") await S.save("biz", { status: "active" }, id);
    if (a === "cancel" && confirm("إلغاء هذا الحساب؟ لن تُحذف أي بيانات سجّلها.")) await S.save("biz", { status: "cancelled" }, id);
    if (a === "suok") await S.rawSet("signup_requests", id, { status: "contacted" });
    if (a === "sudel") await S.remove("signup_requests", id);
    if (a === "aisave") { const u = $("#ai-url").value.trim(); if (u && !/^https:\/\//.test(u)) { b.disabled = false; return alert("الرابط يجب أن يبدأ بـ https://"); } await S.rawSet("app_config", "ai_proxy", { url: u }); await loadAi(); alert("تم حفظ رابط المساعد الذكي."); }
    if (a === "pmadd" || a === "pmdel") {
      const p0 = accData.pricing || PRICING; let l = (p0.promoList || []).filter(x => x.code !== (a === "pmdel" ? id : $("#pm-code").value.trim().toUpperCase()));
      if (a === "pmadd") { const code = $("#pm-code").value.trim().toUpperCase(), pct = Math.min(90, +$("#pm-pct").value || 0); if (!/^[A-Z0-9]{3,20}$/.test(code) || pct <= 0) { b.disabled = false; return alert("اكتب كوداً (حروف/أرقام إنجليزية) ونسبة صحيحة."); } l.push({ code, pct }); }
      await S.rawSet("app_config", "pricing", { promoList: l }); pricingCache = null; accData.pricing = await getPricing(true);
    }
    if (a === "mton" || a === "mtoff") await S.rawSet("app_config", "maintenance", { on: a === "mton", msg: $("#mt-msg").value.trim().slice(0, 200) });
    if (a === "bcsend") { const tx = $("#bc-text").value.trim().slice(0, 250); if (tx) await S.rawSet("app_config", "broadcast", { text: tx, target: $("#bc-to").value, at: Date.now() }); }
    if (a === "bcclear") await S.rawSet("app_config", "broadcast", { text: "", at: Date.now() });
    if (a === "rawget") { let o = null; try { o = await S.get($("#raw-col").value.trim(), $("#raw-id").value.trim()); } catch (e) { o = { error: e.code || "denied" }; } $("#raw-out").textContent = o ? JSON.stringify(o, null, 2) : "غير موجود"; b.disabled = false; return; }
    if (a === "testiso") {
      const wsNow = curWs() || "main", sets = [["vehicles", vehicles], ["expenses", expenses], ["advances", advances], ["operations", operations], ["inventory", inventory], ["costings", typeof costings !== "undefined" ? costings : []], ["biz", biz], ["acct", typeof acct !== "undefined" ? acct : []]], issues = [];
      sets.forEach(([nm, arr]) => (arr || []).forEach(it => { if (!it.workspaceId) issues.push(`سجل بدون workspaceId في (${nm}): ${it.id}`); else if (it.workspaceId !== wsNow) issues.push(`تسريب من شركة أخرى في (${nm}): ${it.workspaceId}`); }));
      $("#iso-out").innerHTML = issues.length ? `<div class="p-2 rounded-lg bg-red-100 text-red-800 font-bold">تم اكتشاف ${issues.length} ملاحظة:<br>${issues.slice(0, 10).map(esc).join("<br>")}</div>` : `<div class="p-2 rounded-lg bg-green-100 text-green-800 font-bold">✓ العزل سليم 100% — كل السجلات المحمّلة تابعة لمساحة العمل (${esc(wsNow)}) فقط.</div>`;
      b.disabled = false; return;
    }
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
  const mg = ev.target.closest("#mig-file");
  if (mg && mg.files[0]) {
    const file = mg.files[0], out = $("#iso-out"); mg.value = "";
    try {
      const data = JSON.parse(await file.text()), targetWs = prompt("اكتب رمز مساحة العمل (workspaceId) المراد نقل البيانات إليها:", "main");
      if (!targetWs) return;
      const cols = ["vehicles", "expenses", "advances", "operations", "inventory", "costings", "biz", "acct", "fuel_in", "fuel_out", "rent_contracts", "rent_logs", "downtime", "parts_track", "production"];
      let count = 0; out.innerHTML = `<div class="text-orange-700 font-bold">جاري نقل البيانات إلى (${esc(targetWs)})... لا تغلق الصفحة.</div>`;
      for (const col of cols) for (const row of (Array.isArray(data[col]) ? data[col] : [])) { const { id, ...rest } = row; rest.workspaceId = targetWs; await S.save(col, rest, id || undefined); count++; }
      out.innerHTML = `<div class="p-2 rounded-lg bg-green-100 text-green-800 font-bold">✓ تم نقل ${count} سجل بنجاح إلى مساحة العمل (${esc(targetWs)}). حدّث الصفحة الآن.</div>`;
    } catch (err) { out.innerHTML = `<div class="p-2 rounded-lg bg-red-100 text-red-800 font-bold">خطأ في قراءة الملف: ${esc(err.message)}</div>`; }
    return;
  }
  const at = ev.target.closest("#al-type, #al-user, #al-site"); if (at) { accData[at.id === "al-type" ? "t" : at.id === "al-user" ? "u" : "s"] = at.value; return renderAccounts(); }
  const al = ev.target.closest("#al-q"); if (al) { accData.q = al.value; return renderAccounts(); }
  const tp = ev.target.closest("[data-tpl]");
  if (tp && tp.value) { const t = ROLE_TPL[tp.value]; try { await S.save("biz", { template: tp.value, perms: t.perms, pages: t.pages || [] }, tp.dataset.tpl); auditEvt("role_template", tp.dataset.tpl, t.label); await loadData(); } catch (e) { dbErr(e); } return; }
  const df = ev.target.closest("#al-from, #al-to"); if (df) { accData[df.id === "al-from" ? "f" : "to"] = df.value; return renderAccounts(); }
  const sc = ev.target.closest("[data-site-chk]");
  if (sc) {
    const uid = sc.dataset.siteChk, boxes = [...document.querySelectorAll(`[data-site-chk="${uid}"]`)];
    let v;
    if (sc.value === "*" && sc.checked) v = ["*"];
    else {
      const sites = boxes.filter(x => x.checked).map(x => x.value).filter(x => x !== "*");
      if (!sites.length) v = ["*"];
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

/* ---------- حالات الحسابات + الحضور + الشات الفوري ---------- */
const STAT = { active: "✅ تم القبول (نشط)", suspended: "⏸️ موقوف مؤقتاً", disabled: "⏸️ موقوف مؤقتاً", cancelled: "🚫 حساب ملغي", pending: "⏳ قيد الانتظار" };
const chatWs = () => ACCESS.role === "dev" ? ACCESS.scope : ACCESS.ws;
let chatMsgs = [], cl = null, unsubs = [], beating = false;
const ago = t => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "الآن" : m < 60 ? `منذ ${m} دقيقة` : m < 1440 ? `منذ ${Math.floor(m / 60)} ساعة` : `منذ ${Math.floor(m / 1440)} يوم`; };
const online = p => p && Date.now() - p.at < 100000;
const presTxt = id => { const p = presAll[id]; return !p ? "لم يدخل بعد" : online(p) ? "متصل الآن 🟢" : "آخر ظهور " + ago(p.at); };

(function permCss() {
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
  t("np-ted", "canEditDeleteTransactions"); t("np-cust", "canManageCustody"); t("np-exp", "canExportPrint"); if (!canSeeMoney()) document.body.classList.add("np-exp");
}

function initChat() {
  if (!S.listen || !ACCESS.uid) return;
  const key = chatWs() + ACCESS.role; if (initChat.k === key) return; initChat.k = key;
  unsubs.forEach(f => f && f()); unsubs = [];
  unsubs.push(S.listen("chat_msgs", chatWs(), rows => { chatMsgs = rows.sort((a, b) => a.at - b.at).slice(-200); paintChat(); }));
  unsubs.push(S.listen("presence", isDev() ? null : chatWs(), rows => { presAll = Object.fromEntries(rows.map(r => [r.id, r])); paintChat(); if (isDev() && accTab === "acc" && !$("#view-accounts").classList.contains("hidden")) renderAccounts(); }));
  if (!isDev() && !beating) {
    beating = true;
    const hb = () => { if (!document.hidden) S.rawSet("presence", ACCESS.uid, { ws: ACCESS.ws, name: ACCESS.name || ACCESS.email, at: Date.now() }).catch(() => {}); };
    hb(); setInterval(hb, 45000);
    setInterval(async () => { try { const r = await S.get("biz", ACCESS.uid); if (r && r.status !== "active") location.reload(); } catch (e) {} }, 60000);
    document.addEventListener("visibilitychange", hb);
  }
  buildChat();
}
const markSeen = () => { try { localStorage.setItem("mixar-seen-" + chatWs(), Date.now()); } catch (e) {} };

function buildChat() {
  if ($("#chat-fab")) { $("#chat-fab").classList.remove("hidden"); return paintChat(); }
  const f = document.createElement("button"), p = document.createElement("div");
  f.id = "chat-fab"; f.title = "شات الشركة"; f.className = "fixed bottom-4 left-4 z-40 w-14 h-14 rounded-full bg-amber-500 text-slate-900 text-2xl shadow-lg no-print";
  f.innerHTML = `<i class="fa-solid fa-comments"></i><span id="chat-badge" class="hidden absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">0</span>`;
  p.id = "chat-panel"; p.className = "hidden fixed bottom-20 left-4 z-40 w-[22rem] max-w-[calc(100vw-2rem)] h-[28rem] max-h-[70vh] bg-white rounded-2xl shadow-2xl border flex flex-col no-print";
  p.innerHTML = `<div class="p-3 border-b flex justify-between items-start"><div><div class="font-extrabold">شات مساحة العمل</div><div id="chat-mem" class="text-xs text-slate-500"></div></div><button id="chat-x" class="text-slate-400 font-bold px-1">✕</button></div>
    <div id="chat-list" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
    <div class="p-2 border-t flex gap-2 items-center"><label class="cursor-pointer text-xl px-1"><i class="fa-solid fa-paperclip"></i><input id="chat-file" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" class="hidden"></label><input id="chat-in" class="inp !py-1.5" placeholder="اكتب رسالة..."><button id="chat-mic" class="text-xl px-1" title="رسالة صوتية">🎤</button><button id="chat-send" class="btn !px-3 !py-1.5">إرسال</button></div>`;
  document.body.append(f, p);
  f.onclick = () => { $("#ai-panel")?.classList.add("hidden"); p.classList.toggle("hidden"); markSeen(); paintChat(); };
  $("#chat-x").onclick = () => p.classList.add("hidden");
  $("#chat-send").onclick = () => sendChat(); $("#chat-mic").onclick = toggleRec;
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
    return `<div class="flex ${mine ? "justify-start" : "justify-end"}"><div class="max-w-[85%] rounded-xl p-2 ${mine ? "bg-amber-100" : "bg-slate-100"}"><div class="text-[11px] font-bold text-slate-500">${esc(m.name || "")} · ${ago(m.at)}</div>${m.text ? `<div>${esc(m.text)}</div>` : ""}${m.voice ? `<audio controls src="${esc(m.voice)}" class="mt-1 h-8 w-full"></audio>` : ""}` +
      (f ? (f.type === "image" ? `<img src="${esc(f.url)}" data-zoom="${esc(f.url)}" class="mt-1 max-h-48 rounded cursor-zoom-in">` : f.type === "video" ? `<video src="${esc(f.url)}" controls class="mt-1 max-h-48 rounded"></video>` : `<a href="${esc(f.url)}" target="_blank" rel="noopener" download class="mt-1 block text-orange-700 underline">⬇ ${esc(f.name)}</a>`) : "") + `</div></div>`;
  }).join("");
  list.scrollTop = list.scrollHeight;
}

async function sendChat(file, voice) {
  const inp = $("#chat-in"), text = inp.value.trim(); if (!text && !file && !voice) return;
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
    await S.rawAdd("chat_msgs", { ws: chatWs(), uid: ACCESS.uid, name: isDev() ? "الدعم الفني" : (ACCESS.name || ACCESS.email), text, file: f, voice: voice || "", at: Date.now() });
  } catch (e) { console.error(e); alert("تعذر الإرسال: " + (e.message || e.code || "")); }
}

/* ---------- ميكسار: الشركات والاشتراكات والقفل التلقائي ---------- */
const PAY_NO = "01128079357";
let companies = [], myCo = null;
const toMs = x => typeof x === "number" && isFinite(x) ? x : (x && x.toMillis ? x.toMillis() : Number(x) || 0);
const GRACE = 259200000;
const expMs = d => Date.now() + Math.max(1, Math.floor(+d || 0)) * 864e5;
const dayLeft = c => c ? Math.ceil((toMs(c.expiresAt) - Date.now()) / 864e5) : 0;
const locked = () => !!ACCESS.locked;
async function loadCo() {
  myCo = null; ACCESS.locked = false;
  if (isDev() || !S.get || !ACCESS.ws) return;
  try { myCo = await S.get("companies", ACCESS.ws); } catch (e) { return; }
  ACCESS.locked = !!myCo && (myCo.status !== "active" || toMs(myCo.expiresAt) + GRACE < Date.now());
}
function renderSub() {
  let b = $("#sub-badge");
  if (!b) { b = document.createElement("button"); b.id = "sub-badge"; $("header").lastElementChild.before(b); b.onclick = openPlans; }
  b.classList.toggle("hidden", isDev() || !myCo); if (!myCo) return;
  graceBar(); const d = dayLeft(myCo), off = locked();
  b.textContent = off ? "🔒 الاشتراك منتهي — تجديد" : (d <= 0 ? "فترة سماح — جدّد الآن" : `${myCo.plan === "trial" ? "تجربة مجانية" : "مشترك"}: ${d} يوم · الاشتراك والتجديد`);
  b.className = "text-xs font-bold px-2 py-1 rounded-lg border " + (off ? "bg-red-50 text-red-700 border-red-300" : d <= 7 ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-green-50 text-green-700 border-green-300");
}

/* ---------- الأسعار والخصومات ---------- */
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
    ${promoBlock(p)}<div class="text-xs ${on ? "text-green-700" : "text-slate-500"}">${on ? `الخصم مفعّل — متبقٍ ${Math.ceil((p.discountEndsAt - Date.now()) / 864e5)} يوم` : "الخصم غير مفعّل — تظهر الأسعار الأساسية."}</div></div>`;
}
async function openPlans() {
  const co = myCo || {}; let p = null, stale = false;
  try { p = await getPricing(true); } catch (e) { console.warn("pricing", e); }
  if (!p) { p = pricingCache || PRICING; stale = true; }
  const on = discOn(p), left = Math.ceil((p.discountEndsAt - Date.now()) / 864e5);
  const L = [["month", "الباقة الشهرية", "30 يوماً"], ["quarter", "الباقة ربع السنوية", "90 يوماً"], ["year", "الباقة السنوية", "365 يوماً"]];
  const wa = (t, price) => `https://wa.me/201128079357?text=` + encodeURIComponent(`مرحباً، أرغب في الاشتراك/التجديد في ميكسار\nالشركة: ${co.name || ""}\nكود الشركة: ${co.code || ""}\nالباقة: ${t} (${price} ج.م)`);
  const o = document.createElement("div"); o.className = "fixed inset-0 z-[80] bg-black/60 grid place-items-center p-4";
  o.innerHTML = `<div class="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-start"><img src="logo-badge.png" alt="Mixar" class="h-16 object-contain" onerror="this.remove()"><button data-x>✕</button></div><h3 class="font-extrabold text-lg">الاشتراك والتجديد</h3>${stale ? `<div class="text-xs bg-red-50 text-red-700 rounded p-2">تعذر تحديث الأسعار الآن؛ أكّد السعر عبر واتساب.</div>` : ""}
    <div class="border rounded-xl p-3"><b>تجربة مجانية</b><div class="text-sm text-slate-600">30 يوماً مجاناً بالكامل عند تسجيل شركة جديدة.</div></div>` +
    L.map(([k, t, d]) => { const pl = p.plans[k], price = on ? pl.disc : pl.base; return `<div class="border rounded-xl p-3"><b>${t}</b> <span class="text-sm text-slate-500">${d}</span>
      <div class="mt-1">${on ? `<s class="text-slate-400">${pl.base}</s> <b class="text-green-700 text-lg">${pl.disc} ج.م</b> <span class="text-xs bg-orange-100 text-orange-800 rounded px-2 py-0.5">ينتهي العرض بعد ${left} يوم</span>` : `<b class="text-lg">${pl.base} ج.م</b>`}</div>
      <a href="${wa(t, price)}" target="_blank" rel="noopener" class="btn inline-block mt-2 text-sm">تأكيد الدفع عبر واتساب</a></div>`; }).join("") +
    renewalForm() + `<div class="bg-amber-50 rounded-xl p-3 text-sm">ادفع على محفظة اتصالات كاش: <b dir="ltr">${PAY_NO}</b> <button data-copy class="underline font-bold mr-2">نسخ الرقم</button></div></div>`;
  o.onclick = ev => { if (ev.target.closest("[data-rn]")) return sendRenewal(o); if (ev.target === o || ev.target.closest("[data-x]")) o.remove(); if (ev.target.closest("[data-copy]")) navigator.clipboard.writeText(PAY_NO).then(() => alert("تم نسخ الرقم")); };
  document.body.appendChild(o);
}

/* ---------- الباقات والسعات + الجلسة الواحدة ---------- */
const APP_VERSION = "v30";
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
function planHidden() {
  const m = isDev() ? "all" : planInfo(myCo).modules, out = [];
  if (ACCESS.pages && !isDev() && !isAdm()) ALL_PAGES.forEach(p => { if (!ACCESS.pages.includes(p) && !["dashboard", "settings", "accounts"].includes(p)) out.push(p); });
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

/* ---------- صائد الأخطاء الصامت ---------- */
const ERR = { sent: 0, seen: {} };
const fp = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
async function reportErr(msg, file, line, stack) {
  try {
    if (!S || !S.bump || !ACCESS.uid) return;
    const id = (ACCESS.ws || "x") + "_" + fp(`${APP_VERSION}|${msg}|${file}|${line}`);
    if (ERR.seen[id] || ERR.sent >= 5) return; ERR.seen[id] = 1; ERR.sent++;
    await S.bump("system_errors", id, { msg: String(msg).slice(0, 300), file: String(file || "").split("/").pop().slice(0, 80), line: line || 0, stack: String(stack || "").slice(0, 1500), version: APP_VERSION, ws: ACCESS.ws || "", lastUser: ACCESS.email || "", lastDevice: deviceInfo().slice(0, 120) });
  } catch (e) {}
}
window.addEventListener("error", e => reportErr(e.message, e.filename, e.lineno, e.error && e.error.stack));
window.addEventListener("unhandledrejection", e => { const r = e.reason || {}; reportErr(r.message || String(r), "promise", 0, r.stack); });

/* ---------- قوالب الأدوار + المواقع + سجل التدقيق ---------- */
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
const restricted = () => !isDev() && !isAdm() && Array.isArray(ACCESS.sites) && !ACCESS.sites.includes("*");
const siteStamp = () => restricted() && ACCESS.sites[0] ? { siteId: ACCESS.sites[0] } : {};
function bootShield(on) {
  let s = $("#boot-shield");
  if (!s) { s = document.createElement("div"); s.id = "boot-shield"; s.className = "fixed inset-0 z-[90] bg-white grid place-items-center font-bold text-slate-500"; s.textContent = "جارٍ تجهيز بياناتك…"; document.body.appendChild(s); }
  s.classList.toggle("hidden", !on);
}
function auditEvt(type, target, summary) {
  if (!S || !S.rawAdd || !ACCESS.uid) return;
  S.rawAdd("audit_logs", { ws: ACCESS.scope || ACCESS.ws, uid: ACCESS.uid, name: ACCESS.name || ACCESS.email || "", role: ACCESS.tpl || ACCESS.role || "", siteId: (ACCESS.sites || ["*"])[0], type, target: String(target || ""), summary: String(summary || "").slice(0, 300), at: Date.now() }).catch(() => {});
}
document.addEventListener("click", ev => { if (ev.target.closest("#export-btn")) auditEvt("export", "reports", "تصدير تقرير"); }, true);

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
const userOp = (col, d) => !!d && (d.kind === "user" || d.perms || d.template || d.assignedSites || (col === "biz" && (["active", "suspended", "cancelled"].includes(d.status) || d.role || d.ws)));
const findRec = (col, id) => {
  const pool = { vehicles, expenses, advances, operations, inventory, costings: typeof costings !== "undefined" ? costings : [], materials: typeof matList !== "undefined" ? matList : [], biz: [...(typeof xbiz !== "undefined" ? xbiz : []), ...(typeof biz !== "undefined" ? biz : [])], acct: typeof acct !== "undefined" ? acct : [] };
  return (pool[col] || []).find(x => x.id === id);
};
function hookAudit() {
  if (!S || S._aud) return; S._aud = true;
  const AUD = ["vehicles", "expenses", "advances", "inventory", "operations", "biz", "acct", "costings", "materials"], s0 = S.save.bind(S), r0 = S.remove.bind(S);
  const brief = d => [d.number || d.name || d.title || d.vehicleNo || d.category || "", d.amount != null ? "مبلغ " + d.amount : "", d.note || d.notes || ""].filter(Boolean).join(" · ").slice(0, 200);
  S.save = async (col, d, id) => { if (col === "auditlog") return "skipped"; const r = await s0(col, d, id); if (AUD.includes(col) && !userOp(col, d)) auditEvt(id ? "edit" : "create", col + "/" + (id || r), brief(d || {})); return r; };
  S.remove = async (col, id) => { const lbl = brief(findRec(col, id) || {}) || id; const r = await r0(col, id); if (AUD.includes(col)) auditEvt("delete", col + "/" + id, lbl); return r; };
}
const alRows = () => { const q = (accData.q || "").trim(), f = accData.f ? dayStart(accData.f) : 0, t = accData.to ? dayEnd(accData.to) : 0;
  return (accData.al || []).filter(r => (!q || JSON.stringify(r).includes(q)) && (!accData.t || r.type === accData.t) && (!accData.u || r.name === accData.u) && (!accData.s || r.siteId === accData.s) && (!f || r.at >= f) && (!t || r.at <= t)); };
function alertsList() {
  const o = [];
  if (myCo && !isDev()) { const d = dayLeft(myCo); if (locked()) o.push("🔒 اشتراك شركتك منتهٍ — جدّد لاستعادة الإضافة والتعديل."); else if (d <= 0) o.push("⚠️ انتهى اشتراكك وأنت في فترة السماح — جدّد قبل التحويل إلى قراءة فقط."); else if (d <= 7) o.push(`⏳ ينتهي اشتراك شركتك خلال ${d} يوم.`); }
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
  const k = [["إجمالي الشركات", c.length], ["نشطة (مدفوعة)", c.filter(x => live(x) && x.plan !== "trial").length], ["تجريبية", c.filter(x => live(x) && x.plan === "trial").length], ["منتهية / موقوفة", c.filter(x => !live(x)).length], ["تنتهي خلال 7 أيام", c.filter(x => live(x) && dayLeft(x) <= 7).length], ["المعدات (المنصة)", (accData.vs || []).length], ["المستخدمون النشطون", accUsers().filter(u => u.status === "active").length], ["MRR تقريبي (ج.م)", mrr()], ["ARR تقريبي (ج.م)", mrr() * 12]];
  return `<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">${k.map(([l, v]) => `<div class="border rounded-xl p-3 text-center"><div class="text-2xl font-extrabold">${v}</div><div class="text-xs text-slate-500">${l}</div></div>`).join("")}</div>`;
}
function renewalForm() {
  return `<div class="border rounded-xl p-3 space-y-2"><b>حوّلت المبلغ؟ سجّل طلب التجديد</b><select id="rn-plan" class="inp"><option value="month">الشهرية (30 يوماً)</option><option value="quarter">ربع السنوية (90 يوماً)</option><option value="year">السنوية (365 يوماً)</option></select><input id="rn-ref" class="inp" placeholder="رقم عملية التحويل / الرقم المحوّل منه"><input id="rn-file" type="file" accept="image/*" class="inp"><button data-rn class="btn">إرسال طلب التجديد</button></div>`;
}
async function cloudUpload(file) {
  cl = cl || await S.get("app_config", "cloudinary");
  if (!cl || !cl.cloud || !cl.preset) throw new Error("cloudinary");
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
  const old = $("#bk-json"), oc = old && old.closest(".card"); if (oc) oc.classList.add("hidden");
  const c = document.createElement("div"); c.id = "bk-card"; c.className = "card space-y-2 mb-3";
  c.innerHTML = `<h3 class="font-extrabold">النسخ الاحتياطي</h3><div class="flex flex-wrap gap-2"><button id="bk-exp" class="btn">تصدير نسخة احتياطية (JSON)</button><label class="btn cursor-pointer">استعادة من نسخة احتياطية<input id="bk-file" type="file" accept="application/json" class="hidden"></label></div>`;
  $("#view-settings").prepend(c); $("#bk-exp").onclick = exportBackup; $("#bk-file").onchange = e => { if (e.target.files[0]) restoreBackup(e.target.files[0]); e.target.value = ""; };
}

/* ---------- رسائل صوتية + تهيئة سريعة + أدوات إدخال ---------- */
const inScope = r => (r.workspaceId || "main") === ACCESS.scope && (!restricted() || ACCESS.sites.includes(r.siteId));
let rec = null;
async function toggleRec() {
  const btn = $("#chat-mic"); if (rec) return rec.stop();
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true }), mt = ["audio/webm;codecs=opus", "audio/mp4"].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!mt) { st.getTracks().forEach(t => t.stop()); return alert("المتصفح لا يدعم التسجيل الصوتي."); }
    const ch = []; rec = new MediaRecorder(st, { mimeType: mt, audioBitsPerSecond: 12000 }); btn.textContent = "⏹";
    const timer = setTimeout(() => rec && rec.stop(), 40000);
    rec.ondataavailable = e => ch.push(e.data);
    rec.onstop = async () => {
      clearTimeout(timer); st.getTracks().forEach(t => t.stop()); btn.textContent = "🎤"; rec = null;
      const blob = new Blob(ch, { type: mt }); if (blob.size > 70000) return alert("التسجيل طويل، اجعله أقصر (حتى 40 ثانية).");
      const uri = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); }); sendChat(null, uri);
    };
    rec.start();
  } catch (e) { rec = null; alert("تعذر الوصول للميكروفون."); }
}
function renderOnboard() {
  let b = $("#onb"); if (!b) { b = document.createElement("div"); b.id = "onb"; b.className = "card mb-3 text-sm"; $("#view-dashboard").prepend(b); }
  if (!isAdm() || !myCo) return b.classList.add("hidden");
  const st = [["إضافة موقع", (myCo.sites || []).length > 0], ["إضافة معدة", vehicles.length > 0], ["إنشاء حساب موظف", urs.filter(u => u.status === "active").length > 1], ["تسجيل أول عملية", expenses.length + operations.length > 0]];
  b.classList.toggle("hidden", st.every(x => x[1]));
  b.innerHTML = `<b>تهيئة سريعة لشركتك</b><div class="flex flex-wrap gap-3 mt-2">${st.map(x => `<span>${x[1] ? "✅" : "⬜"} ${x[0]}</span>`).join("")}</div>`;
}
document.addEventListener("input", e => {
  const t = e.target;
  if (t.tagName === "INPUT" && (t.type === "tel" || t.inputMode === "numeric" || t.inputMode === "decimal")) {
    let v = String(t.value || "").replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776).replace(/[٫،]/g, ".");
    if (t.inputMode === "decimal") v = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    if (v !== t.value) t.value = v;
  }
  if (t.id === "reg-pass") {
    const v = t.value; let s = 0; if (v.length >= 8) s++; if (/[A-Za-z]/.test(v) && /\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    let m = $("#pw-meter"); if (!m) { m = document.createElement("div"); m.id = "pw-meter"; m.className = "text-xs mb-2"; t.parentElement.after(m); }
    m.textContent = ["ضعيفة جداً", "ضعيفة", "جيدة", "قوية"][s]; m.style.color = ["#dc2626", "#ea580c", "#ca8a04", "#16a34a"][s];
  }
  if (t.id === "xs-q" && !canSeeMoney()) {
    $("#xs-res")?.querySelectorAll("span").forEach(sp => { sp.textContent = sp.textContent.replace(/\b\d+(\.\d+)?\b/g, "***"); });
  }
}, true);

/* ---------- مساعد ميكسار الذكي (عبر Cloudflare Worker + سياق حي من patch-v27) ---------- */
let aiUrl = DEFAULT_AI_URL;
const aiCard = () => `<div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">مساعد ميكسار الذكي (رابط الـ Worker)</div><div class="flex gap-2"><input id="ai-url" class="inp" dir="ltr" placeholder="https://xxxx.workers.dev" value="${esc((accData.ai || {}).url || DEFAULT_AI_URL)}"><button data-a="aisave" class="btn">حفظ</button></div><div class="text-xs text-slate-500">المفتاح محفوظ في الـ Worker فقط.</div></div>`;
function promoBlock(p) {
  const l = p.promoList || [];
  return `<div class="flex flex-wrap gap-2 items-center text-sm"><b>أكواد الخصم:</b>${l.map(x => `<span class="bg-slate-100 rounded-lg px-2 py-1">${esc(x.code)} — ${x.pct}% <button data-a="pmdel" data-id="${esc(x.code)}" class="text-red-600 font-bold">✕</button></span>`).join("") || "<span class='text-slate-500'>لا أكواد</span>"}<input id="pm-code" class="inp !w-28" placeholder="RAMY10"><input id="pm-pct" type="number" class="inp !w-20" placeholder="%"><button data-a="pmadd" class="btn">إضافة</button></div>`;
}
async function loadAi() {
  aiUrl = DEFAULT_AI_URL;
  if (S.get) { try { const d = await S.get("app_config", "ai_proxy"); if (d && /^https:\/\//.test(d.url || "")) aiUrl = d.url.trim(); } catch (e) {} }
  if (!ACCESS.uid) return;
  let f = $("#ai-fab");
  if (!f) {
    f = document.createElement("button"); f.id = "ai-fab"; f.title = "مساعد ميكسار الذكي"; f.className = "fixed bottom-4 left-20 z-40 w-14 h-14 rounded-full text-white text-2xl shadow-lg no-print grid place-items-center"; f.style.background = "#1e3a5f"; f.textContent = "✨";
    const p = document.createElement("div"); p.id = "ai-panel"; p.className = "hidden fixed bottom-20 left-4 z-40 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border p-3 space-y-2 no-print";
    p.innerHTML = `<div class="flex justify-between items-center"><div class="font-extrabold">مساعد ميكسار الذكي ✨</div><button id="ai-x" class="text-slate-400 font-bold px-1">✕</button></div><div id="ai-out" class="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto bg-slate-50 rounded-xl p-2 min-h-[4rem]">اسألني عن معداتك أو أرقام شركتك.</div><div class="flex gap-2"><input id="ai-in" class="inp !py-1.5" placeholder="اكتب سؤالك..."><button id="ai-go" class="btn !px-3 !py-1.5">اسأل</button></div>`;
    document.body.append(f, p);
    f.onclick = () => { $("#chat-panel")?.classList.add("hidden"); p.classList.toggle("hidden"); };
    $("#ai-x").onclick = () => p.classList.add("hidden");
    $("#ai-go").onclick = askAi;
    $("#ai-in").onkeydown = e => { if (e.key === "Enter") askAi(); };
  }
  f.classList.toggle("hidden", !aiUrl);
  if (!aiUrl) $("#ai-panel").classList.add("hidden");
}
function buildRichAiContext() {
  const seeMoney = canSeeMoney(), actV = typeof activeVehicles === "function" ? activeVehicles() : [];
  const working = actV.filter(v => v.status !== "maintenance").length, maint = actV.filter(v => v.status === "maintenance").length;
  const fIn = (typeof fuelIn !== "undefined" ? fuelIn : []).reduce((s, x) => s + (+x.liters || 0), 0);
  const fOut = (typeof fuelOut !== "undefined" ? fuelOut : []).reduce((s, x) => s + (+x.liters || 0), 0);
  const openDown = (typeof downtime !== "undefined" ? downtime : []).filter(d => d.status === "open");
  const openAdv = (advances || []).filter(a => a.status !== "closed");
  const mKey = new Date().toISOString().slice(0, 7);
  const monthExp = (expenses || []).filter(e => (e.date || "").startsWith(mKey)).reduce((s, e) => s + (+e.amount || 0), 0);
  const notifs = typeof buildNotifs === "function" ? buildNotifs() : [];
  return [
    `الشركة: ${(myCo && myCo.name) || "غير محدد"}`,
    `المعدات: إجمالي ${actV.length} (تعمل: ${working}، في الصيانة: ${maint})`,
    `رصيد تانك السولار المركزي: ${Math.round(fIn - fOut)} لتر`,
    `الأعطال المفتوحة حالياً: ${openDown.length}${openDown.length ? " (" + openDown.map(d => d.vehicleNo || d.cause).join("، ") + ")" : ""}`,
    `العهد المفتوحة: ${openAdv.length} عهدة`,
    seeMoney ? `إجمالي مصروفات الشهر الحالي: ${Math.round(monthExp)}` : "الأرقام المالية: مخفية حسب صلاحية المستخدم",
    notifs.length ? `أهم التنبيهات (${notifs.length}): ${notifs.slice(0, 6).map(n => n.title + " - " + n.text).join(" | ")}` : "لا توجد تنبيهات عاجلة"
  ].join("\n");
}
async function askAi() {
  const q = $("#ai-in").value.trim().slice(0, 800), out = $("#ai-out"); if (!q || askAi.busy) return; askAi.busy = true; out.textContent = "جارٍ التحليل…";
  try {
    const t = await S.idToken(), r = await fetch(aiUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ question: q, context: buildRichAiContext() }) });
    const j = await r.json(); out.textContent = j.answer || j.error || "لا توجد إجابة.";
  } catch (e) { out.textContent = "تعذر الاتصال بالمساعد حالياً (" + (e.message || "خطأ شبكة") + ")."; }
  askAi.busy = false;
}
function graceBar() {
  let b = $("#grace-bar"); const g = myCo && myCo.status === "active" && !isDev() && toMs(myCo.expiresAt) < Date.now() && !locked();
  if (!g) return b && b.remove();
  if (!b) { b = document.createElement("div"); b.id = "grace-bar"; b.className = "bg-orange-500 text-white text-sm font-bold p-2 text-center"; $("header").after(b); }
  b.textContent = `انتهى اشتراكك — أنت في فترة سماح 72 ساعة (متبقٍ ${Math.max(0, Math.ceil((toMs(myCo.expiresAt) + GRACE - Date.now()) / 36e5))} ساعة) قبل تحويل الحساب إلى قراءة فقط`;
}
async function startSession() {
  if (isDev() || !S.listen || !myCo || planInfo(myCo).maxUsers !== 1 || startSession.done) return; startSession.done = true;
  ACCESS.sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  let cur = null; try { cur = await S.get("sessions", ACCESS.uid); } catch (e) {}
  const begin = async () => {
    try { await S.rawSet("sessions", ACCESS.uid, { ws: ACCESS.ws, sid: ACCESS.sid, device: deviceInfo().slice(0, 120), at: Date.now() }); } catch (e) { return; }
    setInterval(() => S.rawSet("sessions", ACCESS.uid, { at: Date.now() }).catch(() => {}), 45000);
    S.listen("sessions", ACCESS.ws, rows => { const m = rows.find(r => r.id === ACCESS.uid); if (m && m.sid !== ACCESS.sid) { alert("تم الدخول بهذا الحساب من جهاز آخر، وسيتم إنهاء هذه الجلسة."); S.logout().then(() => location.reload()); } });
  };
  if (cur && cur.sid && Date.now() - toMs(cur.at) < 180000) {
    const o = document.createElement("div"); o.className = "fixed inset-0 z-[95] bg-white grid place-items-center p-4"; o.dataset.lock = 1; o.dir = "rtl";
    o.innerHTML = `<div class="max-w-sm w-full text-center space-y-3"><div class="text-4xl">🔒</div><h2 class="font-extrabold text-lg">هذا الحساب مفتوح حالياً على جهاز آخر</h2><p class="text-sm text-slate-600">${esc(cur.device || "جهاز غير معروف")}</p><button data-take class="btn w-full">إنهاء الجلسة القديمة والدخول من هذا الجهاز</button><button data-out class="w-full py-2.5 rounded-xl bg-slate-200 font-bold">تسجيل الخروج</button></div>`;
    o.querySelector("[data-take]").onclick = () => { o.remove(); begin(); }; o.querySelector("[data-out]").onclick = async () => { await S.logout(); location.reload(); };
    return document.body.appendChild(o);
  }
  begin();
}
(function numFix() {
  const fix = r => (r.querySelectorAll ? r.querySelectorAll('input[type="number"]') : []).forEach(i => { i.type = "text"; i.inputMode = "decimal"; });
  fix(document); new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && (n.matches && n.matches('input[type="number"]') ? (n.type = "text", n.inputMode = "decimal") : fix(n))))).observe(document.body, { childList: true, subtree: true });
})();

/* ---------- واجهة v30: تصميم موحّد + تنقل سفلي + المزيد + زر الرجوع + مركز تواصل + معاينة المطور + الصيانة والبث ---------- */
(function css() {
  const s = document.createElement("style");
  s.textContent = `body{background:#f8fafc}header{background:#1e3a5f!important;color:#fff!important}header .text-slate-900,header .text-slate-500,header .text-slate-700{color:#fff!important}
#chat-fab,#ai-fab{display:none!important}#hub-fab{position:fixed;left:16px;bottom:16px;z-index:41;width:56px;height:56px;border-radius:50%;background:#e85d04;color:#fff;font-size:24px;box-shadow:0 6px 18px rgba(0,0,0,.25)}
#hub-menu{position:fixed;left:16px;bottom:82px;z-index:41;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.2);padding:6px;display:flex;flex-direction:column;gap:4px}#hub-menu.hidden{display:none}#hub-menu button{padding:10px 14px;text-align:right;font-weight:700;border-radius:10px;color:#1e3a5f}#hub-menu button:hover{background:#f1f5f9}
#app.hidden~#hub-fab,#app.hidden~#hub-menu,#app.hidden~#bnav,#app.hidden~#more-sheet,#app.hidden~#chat-panel,#app.hidden~#ai-panel{display:none!important}
#insp-bar,#bcast{position:sticky;top:3.5rem;z-index:25;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff}#insp-bar{background:#e85d04}#bcast{background:#1e3a5f}#insp-bar button,#bcast button{background:rgba(255,255,255,.2);border-radius:8px;padding:2px 10px}
#bnav{display:none;position:fixed;bottom:0;right:0;left:0;z-index:40;height:64px;background:#fff;border-top:1px solid #e2e8f0;box-shadow:0 -4px 16px rgba(0,0,0,.08)}#bnav button{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#64748b;position:relative;z-index:1}#bnav button span{font-size:20px;line-height:1}#bnav button.on{color:#e85d04}
#bnav-ind{position:absolute;top:0;height:3px;border-radius:0 0 4px 4px;background:#e85d04;width:calc(100% / var(--n));right:calc(var(--i) * 100% / var(--n));transition:right .25s ease}
#more-sheet{position:fixed;inset:0;z-index:60;visibility:hidden}#more-sheet.open{visibility:visible}#more-sheet [data-bg]{position:absolute;inset:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .25s}#more-sheet.open [data-bg]{opacity:1}
#more-sheet [data-box]{position:absolute;bottom:0;right:0;left:0;max-height:75vh;overflow-y:auto;background:#fff;border-radius:20px 20px 0 0;padding:16px 16px 84px;transform:translateY(100%);transition:transform .28s ease}#more-sheet.open [data-box]{transform:none}
#more-sheet h4{font-weight:800;color:#1e3a5f;margin:10px 0 6px}#more-sheet .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}#more-sheet .grid button{padding:12px;border-radius:12px;background:#f1f5f9;font-weight:700;color:#1e3a5f}
#toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:#1e3a5f;color:#fff;padding:8px 16px;border-radius:12px;font-size:13px;z-index:100;opacity:0;pointer-events:none;transition:opacity .2s}#toast.on{opacity:1}
@media(min-width:768px){#bnav,#more-sheet{display:none!important}}
@media(max-width:767px){#bnav{display:flex}#sidebar,#menu-btn,#user-email,#sub-badge{display:none!important}.md\\:mr-64{margin-right:0!important}main{padding-bottom:84px!important}#hub-fab{bottom:84px}#hub-menu{bottom:150px}#chat-panel,#ai-panel{bottom:150px!important}
 table.cardify thead{display:none}table.cardify,table.cardify tbody{display:block}table.cardify tr{display:block;background:#fff;border:1px solid #e2e8f0;border-radius:16px;margin:8px 0;padding:8px 12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}table.cardify td{display:flex;justify-content:space-between;gap:12px;padding:4px 0!important;border:0!important;white-space:normal!important;text-align:left}table.cardify td::before{content:attr(data-label);font-weight:700;color:#64748b;text-align:right}}`;
  document.head.appendChild(s);
})();
(function cardify() {                                                    // الجداول العريضة تتحول إلى كروت على الموبايل
  let t; const run = () => document.querySelectorAll("main table, .card table").forEach(tb => {
    const hs = [...tb.querySelectorAll("thead th")].map(x => x.textContent.trim()); if (!hs.length) return; tb.classList.add("cardify");
    tb.querySelectorAll("tbody tr").forEach(tr => [...tr.children].forEach((td, i) => { if (td.dataset.label !== hs[i]) td.dataset.label = hs[i] || ""; }));
  });
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 120); }).observe(document.body, { childList: true, subtree: true });
})();

const goDev = t => { accTab = t; try { localStorage.setItem("mixar-acctab", t); } catch (e) {} show("accounts"); renderAccounts(); };
const DEVK = ["plat", "rn", "audit", "dev"];
const BN = () => isDev()
  ? [["الشركات", "🏢", () => goDev("plat")], ["الطلبات", "📥", () => goDev("rn")], ["المراقبة", "📡", () => goDev("audit")], ["الأدوات", "🛠️", () => goDev("dev")]]
  : [["الرئيسية", "🏠", () => show("dashboard"), "dashboard"], ["المعدات", "🚜", () => show("vehicles"), "vehicles"], ["التشغيل", "⚙️", () => show("ops"), "ops"], ["المالية", "💰", () => show("expenses"), "expenses"]];
function markNav() {
  const n = $("#bnav"); if (!n) return; const items = BN(), cur = (document.querySelector(".view:not(.hidden)") || {}).id || "";
  let i = isDev() ? (cur === "view-accounts" ? DEVK.indexOf(accTab) : -1) : items.findIndex(x => "view-" + x[3] === cur);
  if (i < 0) i = items.length;
  n.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === i)); n.style.setProperty("--i", i);
}
function buildBnav() {
  let n = $("#bnav"); if (!n) { n = document.createElement("nav"); n.id = "bnav"; document.body.appendChild(n); }
  const items = BN(); n.style.setProperty("--n", items.length + 1);
  n.innerHTML = `<div id="bnav-ind"></div>` + items.map((x, i) => `<button data-i="${i}"><span>${x[1]}</span>${x[0]}</button>`).join("") + `<button data-more><span>☰</span>المزيد</button>`;
  n.onclick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.more !== undefined) return openSheet(); closeSheet(); items[b.dataset.i][2](); markNav(); };
  markNav();
}
const GROUPS = { "التشغيل": ["readings", "ops", "quick", "down", "parts", "prod", "fuel", "rent"], "المالية": ["expenses", "advances", "acct", "costing", "reports"], "المخزن والإدارة": ["inventory", "settings", "audit", "accounts"] };
function openSheet() {
  let s = $("#more-sheet");
  if (!s) { s = document.createElement("div"); s.id = "more-sheet"; s.innerHTML = `<div data-bg></div><div data-box></div>`; document.body.appendChild(s);
    s.onclick = e => { if (e.target.dataset.bg !== undefined) return closeSheet(); const b = e.target.closest("[data-go]"); if (!b) return; closeSheet(); if (b.dataset.go === "plans") return openPlans(); show(b.dataset.go); markNav(); }; }
  const navs = [...document.querySelectorAll("#sidebar [data-nav]")].filter(b => !b.closest(".hidden") && getComputedStyle(b).display !== "none").map(b => [b.dataset.nav, b.textContent.trim()]), used = new Set();
  const grid = l => `<div class="grid">${l.map(x => `<button data-go="${x[0]}">${esc(x[1])}</button>`).join("")}</div>`; let h = "";
  for (const [g, keys] of Object.entries(GROUPS)) { const l = navs.filter(x => keys.includes(x[0])); l.forEach(x => used.add(x[0])); if (l.length) h += `<h4>${g}</h4>${grid(l)}`; }
  const rest = navs.filter(x => !used.has(x[0])); if (rest.length) h += `<h4>أخرى</h4>${grid(rest)}`;
  if (!isDev() && myCo) h += `<h4>الاشتراك</h4>${grid([["plans", "الاشتراك والتجديد"]])}`;
  s.querySelector("[data-box]").innerHTML = h; requestAnimationFrame(() => s.classList.add("open"));
}
const closeSheet = () => { const s = $("#more-sheet"); if (s) s.classList.remove("open"); };
function toast(t) { let e = $("#toast"); if (!e) { e = document.createElement("div"); e.id = "toast"; document.body.appendChild(e); } e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 1800); }
const show0 = show; show = function (v) { show0(v); markNav(); };
(function backBtn() {                                                    // زر الرجوع: يغلق الأعلى أولاً ثم يعود للرئيسية ثم يطلب تأكيد الخروج
  let armed = false; const push = () => history.pushState({ mx: 1 }, ""); push();
  const closeTop = () => {
    const sh = $("#more-sheet"); if (sh && sh.classList.contains("open")) { closeSheet(); return true; }
    const ov = [...document.querySelectorAll("body > div.fixed.inset-0")].filter(e => !e.dataset.lock && !["landing", "boot-shield", "more-sheet"].includes(e.id) && !e.classList.contains("hidden")).pop();
    if (ov) { ov.remove(); return true; }
    for (const p of ["#chat-panel", "#ai-panel", "#hub-menu"]) { const e = $(p); if (e && !e.classList.contains("hidden")) { e.classList.add("hidden"); return true; } }
    return false;
  };
  addEventListener("popstate", () => {
    const app = $("#app"); if (!app || app.classList.contains("hidden")) return push();
    if (closeTop()) return push();
    const cur = (document.querySelector(".view:not(.hidden)") || {}).id;
    if (cur && cur !== "view-dashboard" && !isDev()) { show("dashboard"); return push(); }
    if (armed) return history.back();
    armed = true; toast("اضغط رجوع مرة أخرى للخروج"); push(); setTimeout(() => { armed = false; }, 2000);
  });
})();
function buildHub() {
  if ($("#hub-fab")) return;
  const f = document.createElement("button"), m = document.createElement("div"); f.id = "hub-fab"; f.textContent = "💬"; m.id = "hub-menu"; m.className = "hidden";
  m.innerHTML = `<button data-h="ai">✨ مساعد ميكسار الذكي</button><button data-h="chat">💬 شات فريق العمل</button>`; document.body.append(f, m);
  f.onclick = () => m.classList.toggle("hidden");
  m.onclick = e => { const b = e.target.closest("[data-h]"); if (!b) return; m.classList.add("hidden"); ["#ai-panel", "#chat-panel"].forEach(p => $(p) && $(p).classList.add("hidden")); const t = $(b.dataset.h === "ai" ? "#ai-fab" : "#chat-fab"); if (t) t.click(); };
}
function inspectBar() {
  let b = $("#insp-bar"); if (!(isDev() && ACCESS.scope && ACCESS.scope !== "main")) return b && b.remove();
  const c = companies.find(x => x.id === ACCESS.scope);
  if (!b) { b = document.createElement("div"); b.id = "insp-bar"; $("header").after(b); b.onclick = e => { if (!e.target.closest("button")) return; const sel = $("#scope-sel"); sel.value = "main"; sel.onchange(); goDev("plat"); }; }
  b.innerHTML = `<span>أنت تعاين الآن: <b>${esc(c ? c.name : ACCESS.scope)}</b></span><button>رجوع للوحة المطور</button>`;
}
async function renderBroadcast() {
  let b = $("#bcast"), d = null; try { d = await S.get("app_config", "broadcast"); } catch (e) {}
  const vis = d && d.text && !isDev() && (d.target === "all" || d.target === ACCESS.ws) && sessionStorage.getItem("bc-" + d.at) !== "1";
  if (!vis) return b && b.remove();
  if (!b) { b = document.createElement("div"); b.id = "bcast"; $("header").after(b); }
  b.innerHTML = `<span>📢 ${esc(d.text)}</span><button>✕</button>`; b.querySelector("button").onclick = () => { sessionStorage.setItem("bc-" + d.at, "1"); b.remove(); };
}
async function maintBlocked() {
  let m = null; try { m = await S.get("app_config", "maintenance"); } catch (e) {}
  if (!m || !m.on) return false;
  const el = document.createElement("section"); el.id = "pending"; el.dataset.lock = 1; el.className = "fixed inset-0 z-50 grid place-items-center bg-slate-900 p-4";
  el.innerHTML = `<div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4"><div class="text-4xl">🛠️</div><h2 class="font-extrabold">${esc(m.msg || "المنصة تحت الصيانة حالياً، نعتذر عن الإزعاج وسنعود قريباً.")}</h2><button id="mt-out" class="w-full py-2.5 rounded-xl bg-slate-200 font-bold">تسجيل الخروج</button></div>`;
  document.body.appendChild(el); $("#mt-out").onclick = async () => { await S.logout(); location.reload(); }; return true;
}
const mrr = () => { const pl = (accData.pricing || PRICING).plans, mo = { month: 1, quarter: 3, year: 12 }; return Math.round(companies.filter(x => x.status === "active" && dayLeft(x) > 0 && mo[x.plan]).reduce((s, x) => s + (pl[x.plan] ? pl[x.plan].base / mo[x.plan] : 0), 0)); };
const toolsCard = () => `<div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">وضع الصيانة العام</div><div class="flex gap-2"><input id="mt-msg" class="inp" placeholder="رسالة تظهر للشركات"><button data-a="mton" class="btn">تفعيل</button><button data-a="mtoff" class="px-4 py-2.5 rounded-xl bg-slate-200 font-bold">إيقاف</button></div></div>
  <div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">بانر إداري (Broadcast)</div><div class="flex flex-wrap gap-2"><input id="bc-text" class="inp" placeholder="نص الإشعار"><select id="bc-to" class="inp !w-auto"><option value="all">كل الشركات</option>${companies.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}</select><button data-a="bcsend" class="btn">إرسال</button><button data-a="bcclear" class="px-4 py-2.5 rounded-xl bg-slate-200 font-bold">مسح</button></div></div>
  <div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">فاحص المستندات الخام</div><div class="flex flex-wrap gap-2"><input id="raw-col" class="inp !w-44" placeholder="المجموعة" dir="ltr"><input id="raw-id" class="inp !w-56" dir="ltr" placeholder="Document ID"><button data-a="rawget" class="btn">عرض</button></div><pre id="raw-out" class="text-xs bg-slate-50 rounded-xl p-2 overflow-x-auto max-h-64" dir="ltr"></pre></div>
  <div class="border rounded-xl p-3 mb-3 space-y-2"><div class="font-bold">فحص العزل ونقل البيانات القديمة</div><div class="flex flex-wrap gap-2"><button data-a="testiso" class="btn">فحص عزل الشركات</button><label class="btn cursor-pointer">نقل بيانات قديمة (JSON)<input id="mig-file" type="file" accept="application/json" class="hidden"></label></div><div id="iso-out" class="text-xs space-y-1"></div></div>`;
