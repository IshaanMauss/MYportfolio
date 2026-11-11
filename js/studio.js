/* Studio: generate entries for data/portfolio.json */
(() => {
  const { $, $$, esc, projectCard, copyText, toast } = PF;
  PF.initTheme();
  $$("[data-mark]").forEach((el) => (el.innerHTML = PF.markSvg("logo-mark")));

  const SCHEMAS = {
    project: {
      array: "projects",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "category", l: "Category", t: "text", ph: "Full-stack / SaaS", hint: "Shown on the card. The word before the slash becomes a filter button." },
        { k: "filters", l: "Filters (optional)", t: "list", ph: "Full-stack, Backend", hint: "Use this to list the project under several filter buttons." },
        { k: "description", l: "Description", t: "area", req: true },
        { k: "githubUrl", l: "GitHub URL", t: "url" },
        { k: "liveUrl", l: "Live demo URL", t: "url" },
        { k: "videoUrl", l: "Video URL (mp4)", t: "url" },
        { k: "tags", l: "Tags", t: "list", ph: "FastAPI, PostgreSQL, Redis", hint: "Comma separated." },
        { k: "featured", l: "Featured (listed first, wider card)", t: "check" },
        { k: "private", l: "Private project (shows a PRIVATE badge when there are no links)", t: "check" },
      ],
    },
    system: {
      array: "systems",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "topic", l: "Topic label", t: "text", ph: "Multi-tenancy" },
        { k: "summary", l: "One-line summary", t: "text" },
        { k: "problem", l: "The problem", t: "area" },
        { k: "approach", l: "The approach", t: "area" },
        { k: "outcome", l: "The outcome", t: "area" },
        { k: "steps", l: "Flow steps", t: "lines", hint: "One step per line, in order. Shown as a numbered flow diagram." },
        { k: "tags", l: "Tags", t: "list", hint: "Comma separated." },
      ],
    },
    skill: {
      array: "skills",
      fields: [
        { k: "group", l: "Group name", t: "text", req: true, ph: "Backend" },
        { k: "items", l: "Items", t: "list", hint: "Comma separated." },
      ],
    },
    now: {
      array: "now",
      fields: [
        { k: "label", l: "Label", t: "text", ph: "Building / Studying / Shipping" },
        { k: "title", l: "Title", t: "text", req: true },
        { k: "text", l: "Text", t: "area" },
      ],
    },
  };

  let mode = "project";
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

  function buildFields() {
    $("#fields").innerHTML = SCHEMAS[mode].fields.map((f) => {
      const id = "f-" + f.k;
      if (f.t === "check") return `<label class="check"><input type="checkbox" id="${id}" data-k="${f.k}">${esc(f.l)}</label>`;
      const ctl = f.t === "area" || f.t === "lines"
        ? `<textarea id="${id}" data-k="${f.k}" rows="${f.t === "lines" ? 6 : 4}" placeholder="${esc(f.ph || "")}"></textarea>`
        : `<input id="${id}" data-k="${f.k}" type="${f.t === "url" ? "url" : "text"}" placeholder="${esc(f.ph || "")}">`;
      return `<div class="field"><label for="${id}">${esc(f.l)}${f.req ? " *" : ""}</label>${ctl}${f.hint ? `<small>${esc(f.hint)}</small>` : ""}</div>`;
    }).join("");
    $("#gh-box").style.display = mode === "project" ? "" : "none";
    $("#how").innerHTML = `Paste the entry into the <code>${SCHEMAS[mode].array}</code> array in <code>data/portfolio.json</code>, or use "Copy full portfolio.json" to get the whole file with it already added (needs the site served over http).`;
    update();
  }

  function collect() {
    const o = {};
    for (const f of SCHEMAS[mode].fields) {
      const el = $("#f-" + f.k);
      if (f.t === "check") { if (el.checked) o[f.k] = true; continue; }
      const v = el.value.trim();
      if (f.t === "list") o[f.k] = v.split(",").map((s) => s.trim()).filter(Boolean);
      else if (f.t === "lines") o[f.k] = v.split("\n").map((s) => s.trim()).filter(Boolean);
      else o[f.k] = v;
    }
    if (mode === "project") for (const k of ["githubUrl", "liveUrl", "videoUrl"]) o[k] = o[k] || "";
    if (mode === "system") return { id: slug(o.title || "") || "system-" + Date.now().toString(36), ...o };
    return o;
  }

  const entry = collect;

  function update() {
    const o = entry();
    $("#out").value = JSON.stringify(o, null, 2);
    const pv = $("#preview");
    if (mode === "project") {
      pv.innerHTML = projectCard({ ...o, title: o.title || "Your project title", description: o.description || "Your description appears here.", tags: o.tags?.length ? o.tags : ["Tag", "Tag"] }, 0);
      pv.firstElementChild.classList.add("in");
    } else {
      pv.innerHTML = "";
    }
  }

  $("#mode").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (!b) return;
    mode = b.dataset.mode;
    $$("#mode button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    buildFields();
  });
  $("#form").addEventListener("input", update);
  $("#form").addEventListener("submit", (e) => e.preventDefault());
  $("#clear").addEventListener("click", () => { $("#form").reset(); $("#gh-status").textContent = ""; update(); });

  $("#copy-entry").addEventListener("click", async () => {
    toast((await copyText($("#out").value)) ? "Entry copied" : "Copy failed");
  });

  $("#copy-full").addEventListener("click", async () => {
    try {
      const res = await fetch("data/portfolio.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const full = await res.json();
      const key = SCHEMAS[mode].array;
      (full[key] = full[key] || []).push(entry());
      toast((await copyText(JSON.stringify(full, null, 2) + "\n")) ? "Full file copied. Replace data/portfolio.json with it" : "Copy failed");
    } catch (err) {
      console.error(err);
      toast("Serve the site over http to use this (npx serve .)");
    }
  });

  /* ---- GitHub autofill (projects only) ---- */
  async function readmeTags(user, repo) {
    try {
      const r = await fetch(`https://api.github.com/repos/${user}/${repo}/readme`);
      if (!r.ok) return [];
      const j = await r.json();
      const text = new TextDecoder().decode(Uint8Array.from(atob(j.content.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
      const head = /^#+\s*(technologies used|tech stack|built with)/i;
      const tags = [];
      let on = false;
      for (const line of text.split("\n")) {
        if (head.test(line)) { on = true; continue; }
        if (!on) continue;
        const t = line.trim();
        if (/^[-*]\s+/.test(t)) {
          const tag = t.replace(/^[-*]\s*/, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*_]/g, "").split(/[:(]/)[0].trim();
          if (tag) tags.push(tag);
        } else if (t.startsWith("#") || (t === "" && tags.length)) break;
      }
      return tags;
    } catch { return []; }
  }

  $("#gh-fetch").addEventListener("click", async () => {
    const status = $("#gh-status");
    const m = $("#gh-url").value.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
    if (!m) { status.textContent = "Enter a valid GitHub repo URL."; return; }
    const [, user, repoRaw] = m;
    const repo = repoRaw.replace(/\.git$/, "");
    status.textContent = "Fetching…";
    try {
      const r = await fetch(`https://api.github.com/repos/${user}/${repo}`);
      if (!r.ok) throw new Error(r.status === 403 ? "GitHub rate limit reached. Try again later." : "Repo not found (private repos can't be fetched).");
      const d = await r.json();
      $("#f-title").value = d.name.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      $("#f-description").value = d.description || "";
      $("#f-githubUrl").value = d.html_url;
      if (d.homepage) $("#f-liveUrl").value = d.homepage;
      let tags = await readmeTags(user, repo);
      if (!tags.length) {
        const lr = await fetch(d.languages_url);
        if (lr.ok) tags = Object.keys(await lr.json());
      }
      if (tags.length) $("#f-tags").value = tags.join(", ");
      update();
      status.textContent = "Filled in. Review and edit anything before copying.";
    } catch (err) {
      status.textContent = err.message || "Could not fetch.";
    }
  });

  buildFields();
})();
