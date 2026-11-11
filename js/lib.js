/* Shared helpers: safe rendering, themes, icons, card builders. Used by app.js and studio.js */
const PF = (() => {
  const THEMES = ["emerald", "ember", "cobalt", "orchid", "sage"];
  const FAVICON = {
    emerald: { bg: "#050908", i: "#ffc857", c: "#3ee6a8" },
    ember: { bg: "#0d0908", i: "#2ad4c0", c: "#ff5b2e" },
    cobalt: { bg: "#070810", i: "#c8ff1a", c: "#4d7bff" },
    orchid: { bg: "#17102a", i: "#ff6a1a", c: "#f0a8e3" },
    sage: { bg: "#f4eddc", i: "#7a1630", c: "#4a5846" },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Only allow http(s) links in rendered data. Anything else becomes "". */
  const safeUrl = (u) => {
    if (!u) return "";
    try {
      const x = new URL(u, location.href);
      return x.protocol === "http:" || x.protocol === "https:" ? x.href : "";
    } catch {
      return "";
    }
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage can be blocked; theme just won't persist */ } },
  };

  const ICON = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7.5 8 6 8-6"/></svg>',
    arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
  };

  /* Monogram mark, themed through CSS variables so it follows the palette. */
  const markSvg = (cls = "logo-mark") =>
    `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" style="fill:var(--surface-solid)"/>
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.25" fill="none" style="stroke:var(--line-strong)" stroke-width="1.5"/>
      <rect x="12" y="15" width="6" height="34" rx="3" style="fill:var(--accent)"/>
      <path d="M47.7 23A14 14 0 1 0 47.7 41" fill="none" style="stroke:var(--primary-ink)" stroke-width="6" stroke-linecap="round"/>
    </svg>`;

  const faviconUri = (t) => {
    const f = FAVICON[t] || FAVICON.emerald;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${f.bg}"/><rect x="12" y="15" width="6" height="34" rx="3" fill="${f.i}"/><path d="M47.7 23A14 14 0 1 0 47.7 41" fill="none" stroke="${f.c}" stroke-width="6" stroke-linecap="round"/></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  };

  function setTheme(t, persist = true) {
    if (!THEMES.includes(t)) t = "emerald";
    const root = document.documentElement;
    root.dataset.theme = t;
    if (persist) store.set("theme", t);
    const tc = getComputedStyle(root).getPropertyValue("--theme-color").trim();
    const meta = $('meta[name="theme-color"]');
    if (meta && tc) meta.setAttribute("content", tc);
    const fav = $("#fav-svg");
    if (fav) fav.setAttribute("href", faviconUri(t));
    $$(".theme-dot").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.theme === t)));
    document.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  }

  function initTheme() {
    const saved = store.get("theme");
    const t = THEMES.includes(saved) ? saved : "emerald";
    setTheme(t, false);
    $$(".theme-dot").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.theme)));
  }

  function toast(msg) {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  const chips = (arr) => (arr || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("");

  function projectCard(p, i = 0) {
    const gh = safeUrl(p.githubUrl);
    const live = safeUrl(p.liveUrl);
    const vid = safeUrl(p.videoUrl);
    const links = [
      gh ? `<a href="${esc(gh)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.title)} source code on GitHub">${ICON.github}</a>` : "",
      live ? `<a href="${esc(live)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(p.title)} website">${ICON.external}</a>` : "",
      p.private && !gh ? `<button type="button" class="lock" data-private="${esc(p.title)}" aria-label="${esc(p.title)} is a private repository. Read more">PRIVATE REPO</button>` : "",
    ].join("");
    const cats = p.filters?.length ? p.filters : [(p.category || "").split("/")[0].trim()].filter(Boolean);
    const title = live ? `<a class="card-title-link" href="${esc(live)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : esc(p.title);
    const gated = p.private && !gh && !live;      // private and nowhere to send people: the whole card explains why
    return `
      <article class="card reveal${gated ? " gated" : ""}" data-cats="${esc(cats.join("|"))}"${gated ? ` data-private="${esc(p.title)}" tabindex="0" role="button" aria-label="${esc(p.title)}: private repository, read more"` : ""}>
        <div class="card-top">
          <span class="card-cat">${esc(p.category || "Project")}</span>
          <div class="card-links">${links}</div>
        </div>
        <h3>${title}</h3>
        <p>${esc(p.description)}</p>
        ${vid ? `<div class="video"><video controls preload="metadata" playsinline><source src="${esc(vid)}" type="video/mp4"></video></div>` : ""}
        <div class="chips">${chips(p.tags)}</div>
        <span class="card-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
      </article>`;
  }

  /* A small modal used for "this repository is private". Closes on Esc, backdrop click or either button. */
  const modalState = { prev: null };
  function closeModal() {
    const m = $("#modal");
    if (!m || !m.classList.contains("open")) return;
    m.classList.remove("open"); document.body.style.overflow = "";
    modalState.prev?.focus?.();
  }
  function privateDialog(name) {
    let m = $("#modal");
    if (!m) {
      m = document.createElement("div");
      m.id = "modal"; m.className = "modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "modal-title");
      m.innerHTML = `<div class="modal-box">
        <div class="modal-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></div>
        <h3 id="modal-title">Private repository</h3>
        <p id="modal-text"></p>
        <div class="modal-actions"><a class="btn btn-primary" href="#contact" data-close>Get in touch</a><button class="btn btn-ghost" type="button" data-close>Close</button></div>
      </div>`;
      document.body.appendChild(m);
      m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModal(); });
      addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    }
    modalState.prev = document.activeElement;
    $("#modal-text", m).textContent = `${name} is built in a private repository, so the source code isn't public. I'm happy to walk through the architecture and the code on a call.`;
    m.classList.add("open"); document.body.style.overflow = "hidden";
    $(".btn-primary", m).focus();
  }

  return { THEMES, $, $$, reduced, esc, safeUrl, store, ICON, markSvg, faviconUri, setTheme, initTheme, toast, copyText, chips, projectCard, privateDialog };
})();
