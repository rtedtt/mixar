/* =====================================================
   patch-v27.js — إصلاحات ما قبل النشر + أدوات المطور
   تطوير: بلال محمد سليمان
   ===================================================== */
(() => {
  "use strict";

  // ضع رابط Cloudflare Worker الخاص بك هنا بعد إنشائه:
  const WORKER_URL = "https://mixar-ai.belalbelalmoh.workers.dev";

  /* 1. إصلاح الفاصلة العشرية العربية (12،5) ومنع الحروف في حقول الأرقام */
  document.addEventListener("input", ev => {
    const t = ev.target;
    if (!t || t.inputMode !== "decimal") return;
    let v = String(t.value || "")
      .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
      .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٫،]/g, ".");
    v = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    if (v !== t.value) t.value = v;
  }, true);

  /* 2. منع الكتابة المزدوجة في مجموعة auditlog القديمة */
  if (window.S && typeof S.save === "function") {
    const _save = S.save.bind(S);
    S.save = async (col, d, id) => {
      if (col === "auditlog") return "skipped";
      return _save(col, d, id);
    };
  }

  /* 3. تزويد مساعد Gemini ببيانات حية شاملة مع احترام صلاحية رؤية الأموال */
  function buildRichAiContext() {
    const seeMoney = typeof canSeeMoney === "function" ? canSeeMoney() : true;
    const actV = typeof activeVehicles === "function" ? activeVehicles() : [];
    const working = actV.filter(v => v.status !== "maintenance").length;
    const maint = actV.filter(v => v.status === "maintenance").length;
    const fIn = (window.fuelIn || []).reduce((s, x) => s + (+x.liters || 0), 0);
    const fOut = (window.fuelOut || []).reduce((s, x) => s + (+x.liters || 0), 0);
    const openDown = (window.downtime || []).filter(d => d.status === "open");
    const openAdv = (window.advances || []).filter(a => a.status !== "closed");
    const mKey = new Date().toISOString().slice(0, 7);
    const monthExp = (window.expenses || [])
      .filter(e => (e.date || "").startsWith(mKey))
      .reduce((s, e) => s + (+e.amount || 0), 0);
    const notifs = typeof buildNotifs === "function" ? buildNotifs() : [];

    return [
      `الشركة: ${(window.myCo && myCo.name) || "غير محدد"}`,
      `المعدات: إجمالي ${actV.length} (تعمل: ${working}، في الصيانة: ${maint})`,
      `رصيد تانك السولار المركزي: ${Math.round(fIn - fOut)} لتر`,
      `الأعطال المفتوحة حالياً: ${openDown.length}${openDown.length ? " (" + openDown.map(d => d.vehicleNo || d.cause).join("، ") + ")" : ""}`,
      `العهد المفتوحة: ${openAdv.length} عهدة`,
      seeMoney ? `إجمالي مصروفات الشهر الحالي: ${Math.round(monthExp)}` : "الأرقام المالية: مخفية حسب صلاحية المستخدم",
      notifs.length ? `أهم التنبيهات (${notifs.length}): ${notifs.slice(0, 6).map(n => n.title + " - " + n.text).join(" | ")}` : "لا توجد تنبيهات عاجلة"
    ].join("\n");
  }

  const _fetch = window.fetch.bind(window);
  window.fetch = async (url, opts) => {
    const target = typeof url === "string" ? url : "";
    const isAiCall = target && (target.includes("workers.dev") || (WORKER_URL && target.startsWith(WORKER_URL)));
    if (isAiCall && opts && opts.body) {
      const finalUrl = (!WORKER_URL.includes("YOUR-WORKER-NAME")) ? WORKER_URL : target;
      try {
        const bodyObj = JSON.parse(opts.body);
        bodyObj.context = buildRichAiContext();
        opts = { ...opts, body: JSON.stringify(bodyObj) };
      } catch (e) { /* تجاهل */ }
      return _fetch(finalUrl, opts);
    }
    return _fetch(url, opts);
  };

  /* 4. طباعة اسم شركة العميل في ترويسة التقارير والمطبوعات */
  if (typeof window.printDoc === "function") {
    const _printDoc = window.printDoc;
    window.printDoc = function (doc) {
      const coName = window.myCo && myCo.name;
      if (doc && coName && !String(doc.title || "").includes(coName)) {
        doc = { ...doc, title: `${coName} — ${doc.title || ""}` };
      }
      return _printDoc(doc);
    };
  }

  /* 5. إخفاء الأرقام في البحث الشامل عن غير المصرح لهم برؤية الفلوس */
  document.addEventListener("input", ev => {
    if (ev.target && ev.target.id === "xs-q") {
      if (typeof canSeeMoney === "function" && !canSeeMoney()) {
        const res = document.getElementById("xs-res");
        if (res) {
          res.querySelectorAll("span").forEach(sp => {
            sp.textContent = sp.textContent.replace(/\b\d+(\.\d+)?\b/g, "***");
          });
        }
      }
    }
  });

  /* 6. أدوات المطور في لوحة الإدارة: فحص العزل + نقل البيانات القديمة */
  function injectDevTools() {
    const accView = document.getElementById("view-accounts");
    if (!accView || document.getElementById("dev-tools-card")) return;
    if (typeof isDev !== "function" || !isDev()) return;

    const card = document.createElement("div");
    card.id = "dev-tools-card";
    card.className = "card space-y-3 border-2 border-dashed border-orange-300 bg-orange-50/40";
    card.innerHTML = `
      <div class="font-extrabold text-slate-900"><i class="fa-solid fa-shield-halved text-orange-600 ml-2"></i>أدوات المطور (فحص العزل ونقل البيانات القديمة)</div>
      <div class="flex flex-wrap gap-2">
        <button type="button" id="btn-test-iso" class="btn-dark text-sm"><i class="fa-solid fa-vial-circle-check ml-1"></i>فحص عزل الشركات</button>
        <label class="btn text-sm cursor-pointer"><i class="fa-solid fa-file-import ml-1"></i>نقل بيانات قديمة (JSON)
          <input type="file" id="inp-migrate-json" accept=".json" class="hidden">
        </label>
      </div>
      <div id="dev-tools-out" class="text-xs space-y-1 text-slate-700"></div>
    `;
    accView.prepend(card);

    /* أ) فحص عزل الشركات */
    document.getElementById("btn-test-iso").onclick = () => {
      const out = document.getElementById("dev-tools-out");
      const curWs = (typeof ws === "function" && ws()) || "main";
      const sets = [
        ["vehicles", window.vehicles],
        ["expenses", window.expenses],
        ["advances", window.advances],
        ["operations", window.operations],
        ["inventory", window.inventory],
        ["costings", window.costings],
        ["biz", window.FZ && FZ.ext ? FZ.ext.biz() : []],
        ["acct", window.FZ && FZ.ext ? FZ.ext.acct() : []]
      ];
      const issues = [];
      sets.forEach(([name, arr]) => {
        (arr || []).forEach(item => {
          if (!item.workspaceId) issues.push(`سجل بدون workspaceId في (${name}): ${item.id}`);
          else if (item.workspaceId !== curWs) issues.push(`تسريب من شركة أخرى في (${name}): ${item.workspaceId}`);
        });
      });
      out.innerHTML = issues.length
        ? `<div class="p-2 rounded-lg bg-red-100 text-red-800 font-bold">تم اكتشاف ${issues.length} ملاحظة:<br>${issues.slice(0, 10).join("<br>")}</div>`
        : `<div class="p-2 rounded-lg bg-green-100 text-green-800 font-bold">✓ العزل سليم 100% — كل السجلات المحمّلة تابعة لمساحة العمل (${curWs}) فقط.</div>`;
    };

    /* ب) استيراد ونقل بيانات النسخة القديمة */
    document.getElementById("inp-migrate-json").onchange = async ev => {
      const file = ev.target.files[0];
      const out = document.getElementById("dev-tools-out");
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const targetWs = prompt("اكتب رمز مساحة العمل (workspaceId) المراد نقل البيانات إليها:", "main");
        if (!targetWs) return;
        const cols = ["vehicles", "expenses", "advances", "operations", "inventory", "costings", "biz", "acct", "fuel_in", "fuel_out", "rent_contracts", "rent_logs", "downtime", "parts_track", "production"];
        let count = 0;
        out.innerHTML = `<div class="text-orange-700 font-bold">جاري نقل البيانات إلى (${targetWs})... لا تغلق الصفحة.</div>`;
        for (const col of cols) {
          const rows = Array.isArray(data[col]) ? data[col] : [];
          for (const row of rows) {
            const { id, ...rest } = row;
            rest.workspaceId = targetWs;
            await S.save(col, rest, id || undefined);
            count++;
          }
        }
        out.innerHTML = `<div class="p-2 rounded-lg bg-green-100 text-green-800 font-bold">✓ تم نقل ${count} سجل بنجاح إلى مساحة العمل (${targetWs}). حدّث الصفحة الآن.</div>`;
      } catch (err) {
        out.innerHTML = `<div class="p-2 rounded-lg bg-red-100 text-red-800 font-bold">خطأ في قراءة الملف: ${err.message}</div>`;
      }
      ev.target.value = "";
    };
  }

  document.addEventListener("click", ev => {
    if (ev.target.closest('[data-nav="accounts"]')) {
      setTimeout(injectDevTools, 250);
    }
  });
})();
