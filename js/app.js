/* Main page. Everything on screen is rendered from data/portfolio.json */
(() => {
  const { $, $$, esc, safeUrl, ICON, reduced, chips, projectCard, copyText, toast, setTheme } = PF;

  PF.initTheme();

  /* ---------------------------------------------------------------- data */
  async function loadData() {
    const res = await fetch("data/portfolio.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function showLoadError(err) {
    console.error("Could not load portfolio data:", err);
    const host = $("#systems .wrap") || $("main");
    const box = document.createElement("div");
    box.className = "wrap load-error";
    box.innerHTML = `<h2 class="section-title" style="margin:0 0 .6rem">Data didn't load</h2>
      <p class="section-sub" style="margin:0">Browsers block <code>fetch()</code> on <code>file://</code> pages. Serve the folder instead:
      <code>npx serve .</code> or <code>python -m http.server</code>, then open the printed address.</p>`;
    host.prepend(box);
  }

  /* -------------------------------------------------------------- render */
  function renderChrome(d) {
    const p = d.profile;
    document.title = d.seo?.title || p.name;
    const md = $('meta[name="description"]');
    if (md && d.seo?.description) md.setAttribute("content", d.seo.description);

    $$("[data-mark]").forEach((el) => (el.innerHTML = PF.markSvg("logo-mark")));
    $("#logo-name").textContent = p.name;

    const [first, ...rest] = p.name.split(" ");
    $("#hero-first").textContent = p.firstName || first;
    $("#hero-last").textContent = rest.join(" ") || "";
    $("#hero-headline").textContent = p.headline;
    $("#hero-bio").textContent = p.bio;

    const photo = $("#hero-photo");
    photo.src = p.photo;
    photo.alt = p.photoAlt || p.name;

    const L = p.links || {};
    const socials = [
      L.github && { href: safeUrl(L.github), icon: ICON.github, label: "GitHub" },
      L.linkedin && { href: safeUrl(L.linkedin), icon: ICON.linkedin, label: "LinkedIn" },
      L.email && { href: "mailto:" + L.email, icon: ICON.mail, label: "Email" },
    ].filter((s) => s && s.href);
    $("#socials").innerHTML = socials
      .map((s) => `<a class="social" href="${esc(s.href)}" ${s.href.startsWith("mailto") ? "" : 'target="_blank" rel="noopener noreferrer"'} aria-label="${s.label}">${s.icon}</a>`)
      .join("");

    const resume = safeUrl(p.resume) || (p.resume && !/^[a-z]+:/i.test(p.resume) ? p.resume : "");
    if (resume) {
      const a = document.createElement("a");
      a.className = "btn btn-ghost";
      a.href = resume; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `Resume ${ICON.download}`;
      $("#hero-cta").appendChild(a);
    }

    $("#footer-name").textContent = p.name;
    $("#footer-year").textContent = new Date().getFullYear();
    $("#contact-mail").textContent = L.email || "";
    $("#contact-mail-btn").href = L.email ? `mailto:${L.email}?subject=${encodeURIComponent("Hello " + (p.firstName || ""))}` : "#";
    $("#contact-gh").href = safeUrl(L.github) || "#";
    $("#contact-li").href = safeUrl(L.linkedin) || "#";
  }

  function renderStats(d) {
    const techs = new Set([...(d.skills || []).flatMap((g) => g.items)]);
    const stats = [
      [d.projects.length, "Projects built"],
      [(d.systems || []).length, "Systems written up"],
      [techs.size, "Technologies used"],
    ];
    const host = $("#stats");
    host.style.setProperty("--n", stats.length);
    host.innerHTML = stats.map(([n, l]) => `<div class="stat"><b data-count="${n}">0</b><span>${esc(l)}</span></div>`).join("");

    const items = [...techs];
    const half = items.map((t) => `<span>${esc(t)}</span>`).join("");
    $("#marquee-track").innerHTML = half + half;
  }

  function renderSystems(d) {
    const sys = d.systems || [];
    if (!sys.length) { $("#systems").remove(); $$('[data-nav="systems"]').forEach((e) => e.remove()); return; }
    const tabs = $("#sys-tabs");
    const panels = $("#sys-panels");

    tabs.innerHTML = sys
      .map((s, i) => `<button class="sys-tab" role="tab" id="tab-${esc(s.id)}" aria-controls="panel-${esc(s.id)}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
          <small>${esc(s.topic || s.project || "")}</small><strong>${esc(s.title)}</strong></button>`)
      .join("");

    panels.innerHTML = sys
      .map((s, i) => `<div class="sys-panel" role="tabpanel" id="panel-${esc(s.id)}" aria-labelledby="tab-${esc(s.id)}" ${i ? "hidden" : ""}>
          <h3>${esc(s.title)}</h3>
          <p class="sys-lead">${esc(s.summary)}</p>
          <ol class="flow" aria-label="Request flow">${(s.steps || []).map((st, k) => `<li class="flow-node" style="--i:${k}">${esc(st)}</li>`).join("")}</ol>
          <div class="sys-cols">
            <div class="sys-col"><h4>The problem</h4><p>${esc(s.problem)}</p></div>
            <div class="sys-col"><h4>The approach</h4><p>${esc(s.approach)}</p></div>
            <div class="sys-col outcome"><h4>The outcome</h4><p>${esc(s.outcome)}</p></div>
          </div>
          <div class="chips">${chips(s.tags)}</div>
        </div>`)
      .join("");

    const tabEls = $$(".sys-tab", tabs);
    const panelEls = $$(".sys-panel", panels);
    const select = (idx, focus) => {
      tabEls.forEach((t, i) => { t.setAttribute("aria-selected", String(i === idx)); t.tabIndex = i === idx ? 0 : -1; });
      panelEls.forEach((p, i) => { p.hidden = i !== idx; p.classList.toggle("enter", i === idx); });
      if (focus) tabEls[idx].focus();
      if (matchMedia("(max-width:900px)").matches) tabEls[idx].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    };
    tabEls.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const n = tabEls.length;
        const map = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: n - 1 };
        if (e.key in map) { e.preventDefault(); select((map[e.key] + n) % n, true); }
      });
    });
  }

  function renderProjects(d) {
    const list = d.projects || [];
    const grid = $("#grid");
    grid.innerHTML = list.map(projectCard).join("");
    const cards = $$(".card", grid);

    /* Layout: choose 6/4 column spans so any visible count fills complete rows. */
    const layout = () => {
      const vis = cards.filter((c) => !c.classList.contains("hidden"));
      const n = vis.length, r = n % 3;
      const wide = n === 1 ? 1 : r === 2 ? 2 : r === 1 ? 4 : 0;
      vis.forEach((c, i) => {
        c.classList.toggle("w6", i < wide);
        c.classList.remove("solo");
      });
      if (n % 2 === 1 && vis.length) vis[n - 1].classList.add("solo");
    };

    const cardCats = cards.map((c) => c.dataset.cats.split("|").filter(Boolean));
    const cats = ["All", ...new Set(cardCats.flat())];
    const bar = $("#filters");
    bar.innerHTML = cats.map((c, i) => `<button class="filter" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    bar.addEventListener("click", (e) => {
      const b = e.target.closest(".filter");
      if (!b) return;
      $$(".filter", bar).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      cards.forEach((c, i) => c.classList.toggle("hidden", b.dataset.cat !== "All" && !cardCats[i].includes(b.dataset.cat)));
      layout();
      cards.forEach((c) => !c.classList.contains("hidden") && c.classList.add("in"));
    });
    layout();

    /* phone rail: position dots under the swipeable cards */
    const hint = $("#rail-hint");
    const railDots = () => {
      const vis = cards.filter((c) => !c.classList.contains("hidden"));
      hint.innerHTML = vis.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("");
      grid.scrollTo({ left: 0 });
    };
    const railPos = () => {
      const vis = cards.filter((c) => !c.classList.contains("hidden"));
      if (!vis.length) return;
      const step = vis[0].offsetWidth + parseFloat(getComputedStyle(grid).columnGap || 0);
      const atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
      const i = atEnd ? vis.length - 1 : Math.round(grid.scrollLeft / step);
      $$("i", hint).forEach((d, k) => d.classList.toggle("on", k === i));
    };
    grid.addEventListener("scroll", railPos, { passive: true });
    bar.addEventListener("click", railDots);
    railDots();

    grid.addEventListener("pointermove", (e) => {
      const c = e.target.closest(".card");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  }

  function renderStack(d) {
    const g = d.skills || [];
    if (!g.length) return $("#stack").remove();
    $("#stack-grid").innerHTML = g
      .map((s, i) => `<div class="stack-group reveal" style="--d:${i * 70}ms"><h3>${esc(s.group)}</h3><div class="chips">${chips(s.items)}</div></div>`)
      .join("");
  }

  function renderNow(d) {
    const now = d.now || [], exp = d.experience || [];
    if (!now.length && !exp.length) return $("#now").remove();
    $("#now-grid").innerHTML = now
      .map((n, i) => `<div class="now-card reveal" style="--d:${i * 90}ms"><small>${esc(n.label)}</small><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div>`)
      .join("");
    $("#timeline").innerHTML = exp
      .map((e) => `<div class="tl-item reveal"><small>${esc(e.period || "")}</small><h3>${esc(e.role)}${e.org ? " · " + esc(e.org) : ""}</h3><p>${esc(e.summary || "")}</p></div>`)
      .join("");
    if (!exp.length) $("#timeline").remove();
  }

  /* ----------------------------------------------------- hero behaviours */
  function startRotator(roles) {
    const el = $("#rotator-text");
    if (!roles?.length) return;
    if (reduced()) { el.textContent = roles.join(" · "); $(".caret").remove(); return; }
    let i = 0, j = 0, del = false;
    const tick = () => {
      const word = roles[i];
      el.textContent = word.slice(0, j);
      let delay = del ? 28 : 62;
      if (!del && j === word.length) { del = true; delay = 1500; }
      else if (del && j === 0) { del = false; i = (i + 1) % roles.length; delay = 320; }
      j += del ? -1 : 1;
      setTimeout(tick, delay);
    };
    tick();
  }

  function startTerminal(trace) {
    const body = $("#term-body");
    if (!trace?.length) return $(".terminal").remove();
    body.innerHTML = trace.map((l) => `<div class="term-line ${esc(l.k)}">${esc(l.t)}</div>`).join("");
    const lines = $$(".term-line", body);
    if (reduced()) return lines.forEach((l) => l.classList.add("on"));
    let n = 0;
    const step = () => {
      if (n < lines.length) { lines[n++].classList.add("on"); setTimeout(step, 520); }
      else setTimeout(() => { lines.forEach((l) => l.classList.remove("on")); n = 0; setTimeout(step, 500); }, 3800);
    };
    setTimeout(step, 900);
  }

  /* A charged particle field. The cursor acts as an electrode: nearby nodes are pulled toward it
     and joined to it by flickering lightning that also hops between neighbouring nodes.
     Clicking or tapping sends out a shockwave. Respects prefers-reduced-motion (static mesh only). */
  function startNet() {
    const c = $("#net"), ctx = c.getContext("2d");
    let w, h, nodes = [], raf = 0, frame = 0, burstId = 0, arcId = 0, seen = new Set();
    let rgb = "82,232,174", hot = "255,200,87", light = false;
    const mouse = { x: -999, y: -999, on: false };
    const bolts = new Map(), bursts = [], arcs = [];
    let corona = [];
    const still = reduced();

    const readColors = () => {
      const root = document.documentElement, cs = getComputedStyle(root);
      rgb = cs.getPropertyValue("--net").trim() || rgb;
      hot = cs.getPropertyValue("--net-hot").trim() || hot;
      light = root.dataset.theme === "sage";
    };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(125, Math.max(34, (w * h) / 13000)));
      nodes = Array.from({ length: n }, () => {
        const vx = (Math.random() - 0.5) * 0.3, vy = (Math.random() - 0.5) * 0.3;
        return { x: Math.random() * w, y: Math.random() * h, vx, vy, bvx: vx, bvy: vy, r: Math.random() * 1.3 + 0.7, hot: Math.random() < 0.09, charge: 0 };
      });
      if (still) draw(false);
    };
    const reach = () => Math.min(250, Math.max(140, w * 0.24));

    /* Fractal lightning. Midpoint displacement gives the jagged, self-similar path real bolts have.
       Points live in (t along the line, o sideways offset as a fraction of its length) so a bolt can
       stay glued to moving endpoints while its shape is only re-rolled now and then. */
    function fractal(iter, disp) {
      let p = [[0, 0], [1, 0]];
      for (let i = 0; i < iter; i++) {
        const q = [p[0]];
        for (let j = 1; j < p.length; j++) {
          const a = p[j - 1], b = p[j];
          q.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (Math.random() * 2 - 1) * disp]);
          q.push(b);
        }
        p = q; disp *= 0.55;
      }
      return p;
    }
    function newForks(n, count) {
      const out = [];
      for (let i = 0; i < count; i++) {
        out.push({
          idx: 2 + ((Math.random() * (n - 4)) | 0),
          ang: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.55),
          fl: 0.16 + Math.random() * 0.3,
          pts: fractal(3, 0.22),
        });
      }
      return out;
    }
    /* Three passes (halo, body, white-hot core) make the glow without any expensive blur. */
    function glowStroke(k, wScale) {
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(${hot},${Math.min(1, 0.07 * k)})`; ctx.lineWidth = 9 * wScale; ctx.stroke();
      ctx.strokeStyle = `rgba(${hot},${Math.min(1, 0.26 * k)})`; ctx.lineWidth = 3.6 * wScale; ctx.stroke();
      ctx.strokeStyle = light ? `rgba(${hot},${Math.min(1, 0.95 * k)})` : `rgba(255,255,255,${Math.min(1, 0.92 * k)})`;
      ctx.lineWidth = 1.3 * wScale; ctx.stroke();
    }

    function strike(key, x1, y1, x2, y2, k, forkCount = 0) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      let b = bolts.get(key);
      if (!b || frame >= b.next) {                       // a fresh "stroke": new channel, brief flash
        const pts = fractal(len < 90 ? 3 : len < 220 ? 4 : 5, 0.17);
        b = { f: frame, next: frame + 5 + ((Math.random() * 5) | 0), pts, forks: newForks(pts.length, forkCount ? 1 + ((Math.random() * forkCount) | 0) : 0), ff: frame };
        bolts.set(key, b);
      } else if (b.forks.length && frame - b.ff >= 3) {   // forks shimmer faster than the trunk
        b.forks.forEach((f) => (f.pts = fractal(3, 0.22))); b.ff = frame;
      }
      seen.add(key);
      const flash = frame - b.f < 2 ? 1.7 : 1;
      const flick = (0.72 + Math.random() * 0.28) * flash;
      const wScale = 0.6 + 0.4 * k;
      const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
      const P = b.pts.map(([t, o]) => [x1 + dx * t + nx * o * len, y1 + dy * t + ny * o * len]);

      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]);
      glowStroke(k * flick, wScale);

      for (const f of b.forks) {                           // branches leave the trunk at an angle and fade out
        const c = Math.cos(f.ang), s = Math.sin(f.ang), fx = ux * c - uy * s, fy = ux * s + uy * c, fnx = -fy, fny = fx;
        const L = f.fl * len, [sx, sy] = P[f.idx];
        ctx.beginPath(); ctx.moveTo(sx, sy);
        for (let i = 1; i < f.pts.length; i++) {
          const [t, o] = f.pts[i];
          ctx.lineTo(sx + fx * t * L + fnx * o * L, sy + fy * t * L + fny * o * L);
        }
        glowStroke(k * flick * 0.6, wScale * 0.6);
      }

      ctx.fillStyle = `rgba(${hot},${0.14 * k * flash})`;     // flare where the bolt lands
      ctx.beginPath(); ctx.arc(x2, y2, 4 + 5 * k, 0, Math.PI * 2); ctx.fill();
    }

    function draw(move = true) {
      ctx.clearRect(0, 0, w, h);
      frame++; seen = new Set();
      const R = reach(), now = performance.now();

      const sources = [];
      if (!still && mouse.on) sources.push({ id: "m", x: mouse.x, y: mouse.y, r: R, k: 1, max: 12 });
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i], t = (now - b.t0) / 560;
        if (t >= 1) { bursts.splice(i, 1); continue; }
        sources.push({ id: "b" + b.id, x: b.x, y: b.y, r: R * (1.1 + t * 1.1), k: 1 - t, max: 14, burst: true, t });
      }

      /* motion: drift, relax back to base velocity, get pulled toward (or shoved away from) sources */
      for (const a of nodes) {
        a.charge = 0;
        if (!move) continue;
        a.vx += (a.bvx - a.vx) * 0.02; a.vy += (a.bvy - a.vy) * 0.02;
        for (const s of sources) {
          const dx = s.x - a.x, dy = s.y - a.y, d = Math.hypot(dx, dy);
          if (d < s.r && d > 28) {
            const f = (1 - d / s.r) * 0.11 * s.k * (s.burst ? -2 : 1);
            a.vx += (dx / d) * f; a.vy += (dy / d) * f;
          }
        }
        const sp = Math.hypot(a.vx, a.vy);
        if (sp > 1.7) { a.vx *= 1.7 / sp; a.vy *= 1.7 / sp; }
        a.x += a.vx; a.y += a.vy;
        if (a.x < -10) a.x = w + 10; else if (a.x > w + 10) a.x = -10;
        if (a.y < -10) a.y = h + 10; else if (a.y > h + 10) a.y = -10;
      }

      /* resting mesh */
      const L = Math.min(140, w * 0.3);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < L) {
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / L) * 0.3})`; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      /* lightning (additive on dark themes so it glows) */
      if (!light) ctx.globalCompositeOperation = "lighter";
      for (const s of sources) {
        const inRange = [];
        for (let i = 0; i < nodes.length; i++) {
          const d = Math.hypot(nodes[i].x - s.x, nodes[i].y - s.y);
          if (d < s.r) inRange.push({ i, d });
        }
        inRange.sort((p, q) => p.d - q.d);
        inRange.length = Math.min(inRange.length, s.max);
        inRange.forEach((p, idx) => {
          const a = nodes[p.i], k = Math.min(1, (1 - p.d / s.r) * 1.5 + 0.2) * s.k;
          a.charge = Math.max(a.charge, k);
          strike(s.id + ":" + p.i, s.x, s.y, a.x, a.y, k, idx < 6 ? 2 : 0);
          if (idx) {                                   // chain: lightning hops to the next-nearest node
            const b = nodes[inRange[idx - 1].i], d2 = Math.hypot(a.x - b.x, a.y - b.y);
            if (d2 < 130) strike(s.id + ":c" + p.i, b.x, b.y, a.x, a.y, k * 0.7, 0);
          }
        });
        if (s.burst) {                                  // expanding shock ring
          ctx.strokeStyle = `rgba(${hot},${0.35 * s.k})`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.t, 0, Math.PI * 2); ctx.stroke();
        }
      }

      /* idle ambience: a short spark between two close nodes now and then */
      if (!still && move && frame % 55 === 0) {
        const a = nodes[(Math.random() * nodes.length) | 0];
        let best = null, bd = 150;
        for (const b of nodes) { if (b === a) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd) { bd = d; best = b; } }
        if (best) arcs.push({ id: ++arcId, a, b: best, life: 9 });
      }
      for (let i = arcs.length - 1; i >= 0; i--) {
        const r = arcs[i];
        if (--r.life <= 0) { arcs.splice(i, 1); continue; }
        strike("a" + r.id, r.a.x, r.a.y, r.b.x, r.b.y, (r.life / 9) * 0.7, 0);
      }

      /* the cursor: a flickering plasma ball with corona sparks */
      if (!still && mouse.on) {
        const rr = 34 + Math.random() * 12;
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, rr);
        g.addColorStop(0, light ? `rgba(${hot},0.5)` : "rgba(255,255,255,0.55)");
        g.addColorStop(0.25, `rgba(${hot},0.35)`); g.addColorStop(1, `rgba(${hot},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, rr, 0, Math.PI * 2); ctx.fill();
        if (frame % 2 === 0) {
          corona = Array.from({ length: 6 }, () => {
            const ang = Math.random() * Math.PI * 2, l = 10 + Math.random() * 22;
            return [ang, l, (Math.random() - 0.5) * 0.7];
          });
        }
        ctx.lineCap = "round";
        for (const [ang, l, bend] of corona) {
          const mx = mouse.x + Math.cos(ang) * l * 0.5, my = mouse.y + Math.sin(ang) * l * 0.5;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(mx + Math.cos(ang + 1.57) * bend * 6, my + Math.sin(ang + 1.57) * bend * 6);
          ctx.lineTo(mouse.x + Math.cos(ang + bend) * l, mouse.y + Math.sin(ang + bend) * l);
          ctx.strokeStyle = `rgba(${hot},0.5)`; ctx.lineWidth = 1.4; ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      /* nodes: charged ones swell and take the hot colour */
      for (const a of nodes) {
        const q = a.charge, isHot = a.hot || q > 0.05;
        if (q > 0.05) {
          ctx.fillStyle = `rgba(${hot},${0.18 * q})`;
          ctx.beginPath(); ctx.arc(a.x, a.y, 4 + q * 9, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `rgba(${isHot ? hot : rgb},${isHot ? 0.55 + q * 0.4 : 0.6})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + q * 1.8, 0, Math.PI * 2); ctx.fill();
      }
      for (const key of bolts.keys()) if (!seen.has(key)) bolts.delete(key);
    }

    const loop = () => { draw(); raf = requestAnimationFrame(loop); };

    readColors(); resize();
    addEventListener("resize", resize);
    document.addEventListener("themechange", () => { readColors(); if (still) draw(false); });
    if (still) return;

    addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; }, { passive: true });
    addEventListener("pointerdown", (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
      bursts.push({ id: ++burstId, x: e.clientX, y: e.clientY, t0: performance.now() });
    }, { passive: true });
    addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") setTimeout(() => (mouse.on = false), 500); }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => (mouse.on = false));
    document.addEventListener("visibilitychange", () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) loop();
    });
    loop();
  }

  /* --------------------------------------------------- page interactions */
  function initScroll() {
    const nav = $(".nav"), bar = $(".progress");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
        nav.classList.toggle("scrolled", y > 12);
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const links = $$(".nav-links a");
    const secs = $$("main section[id]");
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach((s) => spy.observe(s));
  }

  function initReveal() {
    const els = $$(".reveal");
    if (reduced() || !("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$("#grid .card").forEach((c, i) => c.style.setProperty("--d", (i % 3) * 90 + "ms"));
    els.forEach((e) => io.observe(e));

    const counters = $$("[data-count]");
    const cio = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, target = +el.dataset.count, t0 = performance.now();
        const run = (t) => {
          const k = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(run);
        };
        reduced() ? (el.textContent = target) : requestAnimationFrame(run);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  function initDrawer() {
    const btn = $("#burger"), drawer = $("#drawer");
    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      drawer.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      drawer.inert = !open;
    };
    set(false);
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    drawer.addEventListener("click", (e) => { if (e.target.closest("a, [data-open-palette]")) set(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    matchMedia("(min-width: 901px)").addEventListener("change", (m) => m.matches && set(false));
  }

  function initCopy(email) {
    $("#copy-mail")?.addEventListener("click", async () => {
      toast((await copyText(email)) ? "Email copied" : "Copy failed — select it manually");
    });
  }

  /* Ctrl/Cmd+K command palette */
  function initPalette(d) {
    const L = d.profile.links || {};
    const go = (id) => () => $(id)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    const items = [
      { t: "Go to top", k: "Navigate", run: () => scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }) },
      d.systems?.length && { t: "Systems", k: "Navigate", run: go("#systems") },
      { t: "Projects", k: "Navigate", run: go("#work") },
      d.skills?.length && { t: "Stack", k: "Navigate", run: go("#stack") },
      { t: "Now", k: "Navigate", run: go("#now") },
      { t: "Contact", k: "Navigate", run: go("#contact") },
      { t: "Theme: Graphite + Emerald + Gold", k: "Theme", run: () => setTheme("emerald") },
      { t: "Theme: Charcoal + Ember + Teal", k: "Theme", run: () => setTheme("ember") },
      { t: "Theme: Midnight Cobalt + Acid Lime", k: "Theme", run: () => setTheme("cobalt") },
      { t: "Theme: Orchid + Violet + Signal Orange", k: "Theme", run: () => setTheme("orchid") },
      { t: "Theme: Sage + Cream + Burgundy", k: "Theme", run: () => setTheme("sage") },
      L.github && { t: "Open GitHub", k: "Link", run: () => open(safeUrl(L.github), "_blank", "noopener") },
      L.linkedin && { t: "Open LinkedIn", k: "Link", run: () => open(safeUrl(L.linkedin), "_blank", "noopener") },
      L.email && { t: "Copy email address", k: "Action", run: async () => toast((await copyText(L.email)) ? "Email copied" : "Copy failed") },
      { t: "Open Studio (add a project)", k: "Tool", run: () => (location.href = "add-project.html") },
    ].filter(Boolean);

    const root = $("#palette"), input = $("#pal-input"), list = $("#pal-list");
    let shown = [], sel = 0, last = null;

    const paint = () => {
      list.innerHTML = shown.length
        ? shown.map((it, i) => `<button class="pal-item" role="option" aria-selected="${i === sel}" data-i="${i}"><span>${esc(it.t)}</span><small>${esc(it.k)}</small></button>`).join("")
        : `<div class="pal-empty">No matches</div>`;
      list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    };
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      shown = items.filter((i) => !q || (i.t + " " + i.k).toLowerCase().includes(q));
      sel = 0; paint();
    };
    const openP = () => { last = document.activeElement; root.classList.add("open"); input.value = ""; filter(); input.focus(); };
    const closeP = () => { root.classList.remove("open"); last?.focus?.(); };
    const run = (i) => { const it = shown[i]; if (!it) return; closeP(); setTimeout(it.run, 60); };

    addEventListener("keydown", (e) => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); root.classList.contains("open") ? closeP() : openP(); }
      else if (e.key === "/" && !typing && !root.classList.contains("open")) { e.preventDefault(); openP(); }
      else if (root.classList.contains("open")) {
        if (e.key === "Escape") closeP();
        else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); paint(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
        else if (e.key === "Enter") { e.preventDefault(); run(sel); }
      }
    });
    input.addEventListener("input", filter);
    list.addEventListener("click", (e) => { const b = e.target.closest(".pal-item"); if (b) run(+b.dataset.i); });
    root.addEventListener("click", (e) => { if (e.target === root) closeP(); });
    $$("[data-open-palette]").forEach((b) => b.addEventListener("click", openP));
  }

  /* ---------------------------------------------------------------- boot */
  startNet();
  initScroll();
  initDrawer();

  loadData()
    .then((d) => {
      renderChrome(d);
      renderStats(d);
      renderSystems(d);
      renderProjects(d);
      renderStack(d);
      renderNow(d);
      startRotator(d.profile.roles);
      startTerminal(d.profile.trace);
      initCopy(d.profile.links?.email || "");
      initPalette(d);
      initReveal();
    })
    .catch(showLoadError);
})();
