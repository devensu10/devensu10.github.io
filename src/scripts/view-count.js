// 阅读量全局脚本
// 策略：列表页用 batch 接口一次查完；详情页单查 + 同会话去重自增。
// API 不可用时（astro dev 或网络问题）静默降级，保留占位符 "—"。

(function () {
  "use strict";

  const LS_KEY = "blog_viewed_slugs";
  const SINGLE_API = "/api/views";
  const BATCH_API = "/api/views-batch";

  function fmt(n) {
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "w";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function setLabel(el, text) {
    const span = el.querySelector("span:last-child");
    if (span) span.textContent = text;
  }

  async function safeFetch(url, opts) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // —— 详情页：单个 slug，自增 +1 ——
  async function handleSingle(el) {
    const slug = el.dataset.slug;
    if (!slug) return;

    const viewed = (function viewedSet() {
      try {
        return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
      } catch {
        return new Set();
      }
    })();

    // 1) 先 GET 当前值，立即可见
    const current = await safeFetch(`${SINGLE_API}?slug=${encodeURIComponent(slug)}`);
    if (current && typeof current.count === "number") {
      setLabel(el, fmt(current.count));
    }

    // 2) 同会话只 POST 一次
    if (!viewed.has(slug)) {
      const inc = await safeFetch(`${SINGLE_API}?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (inc && typeof inc.count === "number") {
        setLabel(el, fmt(inc.count));
      }
      viewed.add(slug);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify([...viewed]));
      } catch {}
    }
  }

  // —— 列表页：多个 slug，一次 batch ——
  async function handleBatch(elements) {
    const slugs = Array.from(
      new Set(elements.map(el => el.dataset.slug).filter(Boolean))
    );
    if (slugs.length === 0) return;

    const map = await safeFetch(`${BATCH_API}?slugs=${slugs.map(encodeURIComponent).join(",")}`);
    if (!map) return;

    for (const el of elements) {
      const slug = el.dataset.slug;
      const n = slug ? map[slug] : undefined;
      if (typeof n === "number") setLabel(el, fmt(n));
    }
  }

  function init(scope) {
    scope = scope instanceof Document ? scope : document;
    const nodes = scope.querySelectorAll("[data-view-count]");
    if (!nodes.length) return;

    const els = Array.from(nodes);
    if (els.length === 1) {
      handleSingle(els[0]);
    } else {
      handleBatch(els);
    }
  }

  // 只初始化一次
  let attached = false;
  function attach() {
    if (attached) return;
    attached = true;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init(), { once: true });
    } else {
      init();
    }
    // Astro View Transitions — SPA 切页后重新扫描
    document.addEventListener("astro:page-load", e => {
      const d = e && e.detail && e.detail.newDocument;
      init(d instanceof Document ? d : document);
    });
  }

  attach();
})();
