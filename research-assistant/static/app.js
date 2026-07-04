"use strict";

const state = {
  results: [], library: [], papers: {}, selected: new Set(),
  aiEnabled: false, view: "discover",
  detailId: null, fullPaper: false,
  drawer: { back: null, refresh: null, export: null },
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function api(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function download(name, text) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/* ── health ── */
async function loadHealth() {
  try {
    const h = await api("/api/health");
    state.aiEnabled = h.ai_enabled;
    state.fields = h.fields || [];
    const b = $("#ai-status");
    if (h.ai_enabled) { b.textContent = `AI ready · ${h.model}`; b.className = "ai-status on"; }
    else { b.textContent = "AI off · add API key"; b.className = "ai-status off"; }
    // populate field selects
    const pubSel = $("#pub-field"), comSel = $("#community-field");
    state.fields.forEach((f) => {
      pubSel.appendChild(new Option(f, f));
      comSel.appendChild(new Option(f, f));
    });
  } catch (_) { $("#ai-status").textContent = "status unknown"; }
}

/* ── community ── */
async function loadCommunity() {
  const box = $("#community");
  box.innerHTML = skeletons(3);
  const q = $("#community-q").value.trim();
  const field = $("#community-field").value;
  try {
    const data = await api(`/api/community?q=${encodeURIComponent(q)}&field=${encodeURIComponent(field)}`);
    data.results.forEach((p) => (state.papers[p.id] = p));
    renderInto(box, data.results,
      "No community papers yet. Be the first — head to Publish and share your work.");
  } catch (e) { box.innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
}

/* ── publish ── */
function updateAbsCount() { $("#abs-count").textContent = $("#pub-abstract").value.length; }

async function submitPublish(ev) {
  ev.preventDefault();
  const msg = $("#pub-msg");
  msg.className = "pub-msg"; msg.textContent = "Publishing…";
  const btn = $("#btn-submit-pub"); btn.disabled = true;
  try {
    const fd = new FormData($("#publish-form"));
    const res = await fetch("/api/publish", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
    msg.className = "pub-msg ok";
    msg.innerHTML = `✓ Published! <a href="#" id="pub-open">Open your paper ▸</a>`;
    $("#publish-form").reset(); updateAbsCount();
    const id = data.paper.id;
    state.papers[id] = data.paper;
    $("#pub-open").addEventListener("click", (e) => { e.preventDefault(); openDetails(id); });
  } catch (e) {
    msg.className = "pub-msg err"; msg.textContent = e.message;
  } finally { btn.disabled = false; }
}

async function runPreReview() {
  const title = $("#pub-title").value.trim();
  const abstract = $("#pub-abstract").value.trim();
  if (!title || abstract.length < 80) {
    const msg = $("#pub-msg"); msg.className = "pub-msg err";
    msg.textContent = "Add a title and an 80+ char abstract to get feedback.";
    return;
  }
  drawerOpen(); setHeader("Pre-submission", "AI pre-review of your draft"); setControls();
  bodyLoading("Claude is reviewing your draft…");
  try {
    const data = await api("/api/prereview", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, abstract, authors: $("#pub-authors").value, field: $("#pub-field").value }) });
    renderScorecard(data.review, { title }, false, false);
    setControls({ exp: { name: "pre-review.md", text: scorecardMd(data.review, { title }) } });
  } catch (e) { bodyError(e.message); }
}

/* ── views ── */
const VIEWS = ["discover", "community", "publish", "library"];
function switchView(v) {
  state.view = v;
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  VIEWS.forEach((name) => $(`#view-${name}`).classList.toggle("hidden", name !== v));
  if (v === "library") loadLibrary();
  if (v === "community") loadCommunity();
}

const skeletons = (n = 4) => Array.from({ length: n }, () => '<div class="skeleton"></div>').join("");

/* ── search / library ── */
async function runSearch(ev) {
  if (ev) ev.preventDefault();
  const q = $("#q").value.trim();
  if (!q) return;
  $("#hero").classList.add("hidden");
  const box = $("#results");
  box.innerHTML = skeletons();
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(q)}&sort=${$("#sort").value}`);
    state.results = data.results;
    data.results.forEach((p) => (state.papers[p.id] = p));
    renderInto(box, data.results, "No papers matched. Try broader keywords.");
  } catch (e) { box.innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
}

async function loadLibrary() {
  const box = $("#library");
  box.innerHTML = skeletons(3);
  try {
    const data = await api("/api/library");
    state.library = data.results;
    data.results.forEach((p) => (state.papers[p.id] = p));
    updateLibCount();
    renderInto(box, data.results, "Nothing saved yet. Open a paper and tap ★ to save it here.");
  } catch (e) { box.innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
}
const updateLibCount = () => ($("#lib-count").textContent = state.library.length);

/* ── cards ── */
function renderInto(box, papers, emptyMsg) {
  box.innerHTML = "";
  if (!papers.length) { box.appendChild(el("div", "empty", `<div class="big">Empty</div>${esc(emptyMsg)}`)); return; }
  papers.forEach((p, i) => { const c = renderCard(p); c.style.animationDelay = `${Math.min(i * 0.04, 0.3)}s`; box.appendChild(c); });
}

function renderCard(p) {
  const card = el("div", "card");
  card.dataset.id = p.id;
  if (state.selected.has(p.id)) card.classList.add("selected");
  const authors = p.authors.slice(0, 4).join(", ") + (p.authors.length > 4 ? " et al." : "");
  const cat = p.primary_category || p.categories[0] || "";
  const date = (p.published || "").slice(0, 10);
  const isCommunity = p.source === "community";
  const badge = isCommunity ? `<span class="badge-student">STUDENT</span>` : `<span class="cat">${esc(cat)}</span>`;
  const uni = isCommunity && p.university ? `<span class="dot">·</span><span class="badge-uni">${esc(p.university)}</span>` : "";
  card.innerHTML = `
    <div class="card-top">
      <h3 title="Open paper workspace">${esc(p.title)}</h3>
      <button class="bookmark ${p.saved ? "on" : ""}" title="${p.saved ? "Saved" : "Save to library"}">${p.saved ? "★" : "☆"}</button>
    </div>
    <div class="meta">${badge}<span class="dot">·</span><span>${esc(authors || "Unknown")}</span>${uni}<span class="dot">·</span><span>${esc(date)}</span></div>
    <p class="abstract clamp">${esc(p.summary)}</p>`;
  card.querySelector("h3").addEventListener("click", () => openDetails(p.id));
  const abs = card.querySelector(".abstract");
  abs.addEventListener("click", () => abs.classList.toggle("clamp"));
  card.querySelector(".bookmark").addEventListener("click", () => toggleSave(p.id));

  const actions = el("div", "card-actions");
  const open = el("button", "btn-open", "Open workspace ▸");
  open.addEventListener("click", () => openDetails(p.id));
  actions.appendChild(open);
  actions.appendChild(el("div", "sep"));
  const sel = el("button", "select-toggle" + (state.selected.has(p.id) ? " on" : ""), state.selected.has(p.id) ? "✓ Selected" : "+ Select");
  sel.addEventListener("click", () => toggleSelect(p.id));
  actions.appendChild(sel);
  card.appendChild(actions);
  return card;
}

const refreshCards = () =>
  state.view === "discover" ? renderInto($("#results"), state.results, "") : renderInto($("#library"), state.library, "");

async function toggleSave(id) {
  try {
    const { saved } = await api("/api/library/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (state.papers[id]) state.papers[id].saved = saved;
    state.results.forEach((p) => { if (p.id === id) p.saved = saved; });
    if (saved && state.papers[id]) { if (!state.library.find((p) => p.id === id)) state.library.unshift(state.papers[id]); }
    else state.library = state.library.filter((p) => p.id !== id);
    updateLibCount(); refreshCards();
  } catch (e) { alert(e.message); }
}

function toggleSelect(id) {
  state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
  refreshCards(); renderDock();
}
function renderDock() {
  const dock = $("#dock"), n = state.selected.size;
  if (n === 0) { dock.classList.add("hidden"); return; }
  dock.classList.remove("hidden");
  $("#dock-count").textContent = n;
  const ready = n >= 2 && state.aiEnabled;
  ["#btn-compare", "#btn-gaps", "#btn-plan"].forEach((s) => ($(s).disabled = !ready));
}

/* ── drawer plumbing ── */
function drawerOpen() { $("#drawer").classList.remove("hidden"); $("#overlay").classList.remove("hidden"); }
function closeDrawer() { $("#drawer").classList.add("hidden"); $("#overlay").classList.add("hidden"); }
function setHeader(kicker, title) { $("#drawer-kicker").textContent = kicker; $("#drawer-title").textContent = title; }
function setControls({ back = null, refresh = null, exp = null } = {}) {
  state.drawer = { back, refresh, export: exp };
  $("#drawer-back").hidden = !back;
  $("#drawer-refresh").hidden = !refresh;
  $("#drawer-export").hidden = !exp;
}
const bodyHTML = (h) => ($("#drawer-body").innerHTML = h);
const bodyLoading = (msg) => bodyHTML(`<div class="loading"><div class="spinner"></div>${esc(msg)}</div>`);
const bodyError = (m) => bodyHTML(`<div class="error-box">${esc(m)}</div>`);

/* ── DETAILS workspace (no key needed) ── */
async function openDetails(id) {
  state.detailId = id;
  drawerOpen();
  setHeader("Paper", state.papers[id] ? state.papers[id].title : "Loading…");
  setControls();
  bodyLoading("Loading paper, citations & credibility…");
  try {
    const d = await api(`/api/details/${encodeURIComponent(id)}`);
    state.papers[id] = d.paper;
    setHeader(d.paper.source === "community" ? "Student research" : "Paper workspace", d.paper.title);
    renderWorkspace(d);
    if (d.paper.source !== "community") { loadGraph(id); loadRelated(id); }  // arXiv only
  } catch (e) { bodyError(e.message); }
}

function stat(n, k) { return `<div class="stat"><div class="n">${esc(n)}</div><div class="k">${esc(k)}</div></div>`; }

function renderWorkspace(d) {
  const p = d.paper, s = d.scholar || {}, cr = d.credibility || {};
  const isCommunity = p.source === "community";
  const authors = p.authors.join(", ");
  const fields = (s.fields_of_study || []).join(" · ");
  const num = (v) => (v == null ? "—" : Intl.NumberFormat().format(v));

  const factors = (cr.factors || []).map((f) => {
    const pct = f.max ? (f.points / f.max) * 100 : 0;
    return `<div class="factor">
      <div class="fl">${esc(f.label)}<small>${esc(f.detail)}</small></div>
      <div class="fbar"><i style="width:${pct}%"></i></div>
      <div class="fp">${f.points}/${f.max}</div></div>`;
  }).join("");

  const gradeColor = cr.total >= 60 ? "var(--accent)" : cr.total >= 45 ? "var(--gold)" : "var(--rose)";

  const analyzeDisabled = !state.aiEnabled;
  const aiBtn = (kind, kicker, icon, label) =>
    `<button data-kind="${kind}" data-kicker="${esc(kicker)}" data-label="${esc(label)}" ${analyzeDisabled ? "disabled" : ""}>
       <span class="k">${icon}</span>${esc(label)}</button>`;

  const links = isCommunity
    ? `${p.pdf_url ? `<a href="${esc(p.pdf_url)}" target="_blank" rel="noopener">PDF ↗</a>` : ""}
       ${p.abs_url ? `<a href="${esc(p.abs_url)}" target="_blank" rel="noopener">Link ↗</a>` : ""}
       ${p.contact ? `<a href="mailto:${esc(p.contact)}">✉ Contact</a>` : ""}`
    : `<a href="${esc(p.abs_url)}" target="_blank" rel="noopener">arXiv ↗</a>
       <a href="${esc(p.pdf_url)}" target="_blank" rel="noopener">PDF ↗</a>
       ${s.s2_url ? `<a href="${esc(s.s2_url)}" target="_blank" rel="noopener">Semantic Scholar ↗</a>` : ""}`;

  bodyHTML(`
    <div class="workspace">
      <p class="ws-authors">${isCommunity ? `<span class="badge-student">STUDENT</span> ` : ""}${esc(authors)}${isCommunity && p.university ? ` — ${esc(p.university)}` : ""}</p>
      <div class="ws-links">
        ${links}
        <button class="bookmark ${p.saved ? "on" : ""}" id="ws-bookmark" style="width:auto;padding:5px 12px;font-size:12.5px;border-radius:8px">${p.saved ? "★ Saved" : "☆ Save"}</button>
      </div>

      <div>
        <div class="cred">
          <div class="ring">${ringSVG(cr.total, 100, 84, 6, gradeColor)}<div class="grade" style="color:${gradeColor}">${esc(cr.grade)}</div></div>
          <div class="cred-meta">
            <div class="score">${esc(cr.total)}<small>/100 credibility</small></div>
            <div class="label" style="color:${gradeColor}">${esc(cr.label)}</div>
            <div class="note">${esc(cr.note)}</div>
          </div>
        </div>
        <div class="factors" style="margin-top:12px">${factors}</div>
      </div>

      <div class="stats">
        ${stat(num(s.citation_count), "Citations")}
        ${stat(num(s.influential_citation_count), "Influential")}
        ${stat(num(s.reference_count), "References")}
        ${stat(s.year || (p.published || "").slice(0, 4) || "—", "Year")}
      </div>
      ${s.venue ? `<div class="tldr"><b>Venue</b> · ${esc(s.venue)}${fields ? " — " + esc(fields) : ""}</div>` : ""}
      ${s.tldr ? `<div class="tldr"><b>TL;DR</b> · ${esc(s.tldr)}</div>` : ""}
      ${isCommunity ? `<div class="tldr"><b>Field</b> · ${esc(p.primary_category)}${(p.keywords && p.keywords.length) ? " — " + esc(p.keywords.join(", ")) : ""}${p.license ? " · " + esc(p.license) : ""}</div>` : ""}
      ${isCommunity ? `<div class="tldr" style="border-left-color:var(--violet)"><b style="color:var(--violet)">Abstract</b> · ${esc(p.summary)}</div>` : ""}

      <div>
        <div class="analyze-head">
          <div>
            <div class="block-title">✦ Analyze with Claude</div>
            <div class="block-sub">${state.aiEnabled ? "Reads the abstract by default — flip the switch to read the full PDF." : "Add an API key to unlock these."}</div>
          </div>
          <label class="ft-toggle ${analyzeDisabled ? "disabled" : ""}" title="Read the entire PDF, not just the abstract">
            <input type="checkbox" id="ft-input" ${state.fullPaper ? "checked" : ""} ${analyzeDisabled ? "disabled" : ""}>
            <span class="ft-switch"></span> Full PDF
          </label>
        </div>
        <div class="analyze-grid">
          ${aiBtn("review", "Peer review", "✦", "Reviewer scorecard")}
          ${aiBtn("weaknesses", "Weaknesses", "⚠", "Weakness report")}
          ${aiBtn("beginner", "Beginner", "✎", "Beginner explanation")}
          ${aiBtn("implementation", "Reproduce", "⚙", "Reproduction guide")}
          ${`<button class="wide" data-kind="debate" data-kicker="Debate" data-label="Reviewer debate" ${analyzeDisabled ? "disabled" : ""}><span class="k">⚔</span>Reviewer debate — two AIs argue, one decides</button>`}
        </div>
        ${analyzeDisabled ? '<div class="gate-hint">Set ANTHROPIC_API_KEY in .env, then restart, to enable AI analysis.</div>' : ""}
      </div>

      ${isCommunity ? `
      <div>
        <div class="block-title">◈ Citation map</div>
        <div class="muted-box">Citation maps aren't available for community submissions — they're not indexed by citation databases yet. The AI analysis above works fully.</div>
      </div>` : `
      <div>
        <div class="block-title">◈ Citation map</div>
        <div class="block-sub">What this paper builds on (left) and who builds on it (right). Click a node to open it.</div>
        <div id="map-slot"><div class="muted-box">Loading citation graph…</div></div>
      </div>
      <div>
        <div class="block-title">↳ Related work</div>
        <div class="block-sub">Recommended by Semantic Scholar.</div>
        <div id="related-slot"><div class="muted-box">Loading recommendations…</div></div>
      </div>`}
    </div>`);

  // wire workspace bookmark
  $("#ws-bookmark").addEventListener("click", async () => { await toggleSave(p.id); openDetails(p.id); });
  // wire full-paper toggle
  const ft = $("#ft-input");
  if (ft) ft.addEventListener("change", () => (state.fullPaper = ft.checked));
  // wire analyze buttons
  $$(".analyze-grid button").forEach((b) => {
    if (b.disabled) return;
    b.addEventListener("click", () => {
      const kind = b.dataset.kind;
      if (kind === "review") openReview(p.id);
      else openAnalysis(p.id, kind, b.dataset.kicker, b.dataset.label);
    });
  });
}

/* ── citation map ── */
async function loadGraph(id) {
  try {
    const g = await api(`/api/graph/${encodeURIComponent(id)}`);
    const slot = $("#map-slot");
    if (!slot) return;
    if (!g.available) { slot.innerHTML = `<div class="muted-box">Citation graph unavailable right now (Semantic Scholar rate limit) — reopen in a moment.</div>`; return; }
    slot.innerHTML = buildMap(g);
    slot.querySelectorAll(".node.click").forEach((n) =>
      n.addEventListener("click", () => openDetails(n.dataset.arxiv)));
  } catch (e) {
    const slot = $("#map-slot"); if (slot) slot.innerHTML = `<div class="muted-box">${esc(e.message)}</div>`;
  }
}

function buildMap(g) {
  const W = 620, H = 440, cx = W / 2, cy = H / 2;
  const refs = g.references || [], cites = g.citations || [];
  const nodeR = (c) => 6 + Math.min(12, Math.log10((c || 0) + 1) * 4.5);
  const place = (arr, aStart, aEnd, radius) => arr.map((p, i) => {
    const t = arr.length === 1 ? 0.5 : i / (arr.length - 1);
    const ang = (aStart + (aEnd - aStart) * t) * Math.PI / 180;
    return { ...p, x: cx + radius * Math.cos(ang), y: cy + radius * Math.sin(ang) };
  });
  const R = place(refs, 132, 228, 185);   // left arc
  const C = place(cites, -48, 48, 185);   // right arc

  const edge = (n, color) => `<line x1="${cx}" y1="${cy}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" stroke="${color}" stroke-width="1" opacity="0.28"/>`;
  const node = (n, color) => {
    const clickable = !!n.arxiv;
    return `<g class="node ${clickable ? "click" : ""}" ${clickable ? `data-arxiv="${esc(n.arxiv)}"` : ""}>
      <title>${esc(n.title)}${n.year ? " (" + n.year + ")" : ""} — ${n.citations} citations${clickable ? "" : " (not on arXiv)"}</title>
      <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${nodeR(n.citations).toFixed(1)}" fill="${color}" opacity="${clickable ? 0.9 : 0.4}" stroke="var(--bg-2)" stroke-width="1.5"/>
    </g>`;
  };
  const VIO = "#a78bfa", ACC = "#5eead4";
  const svg = `<div class="map-wrap"><svg viewBox="0 0 ${W} ${H}">
      ${R.map((n) => edge(n, VIO)).join("")}
      ${C.map((n) => edge(n, ACC)).join("")}
      ${R.map((n) => node(n, VIO)).join("")}
      ${C.map((n) => node(n, ACC)).join("")}
      <circle cx="${cx}" cy="${cy}" r="22" fill="url(#cg)" stroke="var(--gold)" stroke-width="2"/>
      <text x="${cx}" y="${cy + 3}" text-anchor="middle" style="fill:#042f2a;font-weight:700;font-size:10px">THIS</text>
      <defs><radialGradient id="cg"><stop offset="0" stop-color="#f5c563"/><stop offset="1" stop-color="#d99a2b"/></radialGradient></defs>
    </svg></div>
    <div class="map-legend"><span><i style="background:${VIO}"></i>Builds on (${refs.length})</span><span><i style="background:${ACC}"></i>Cited by (${cites.length})</span><span><i style="background:var(--gold)"></i>This paper</span></div>`;
  return svg;
}

/* ── related ── */
async function loadRelated(id) {
  try {
    const data = await api(`/api/related/${encodeURIComponent(id)}`);
    const slot = $("#related-slot"); if (!slot) return;
    const items = data.results || [];
    if (!items.length) { slot.innerHTML = `<div class="muted-box">No recommendations available right now.</div>`; return; }
    slot.innerHTML = `<div class="related-list">${items.map((r) => `
      <div class="rel ${r.arxiv ? "" : "static"}">
        <div><div class="rt">${esc(r.title)}</div><div class="rm">${r.year || ""}${r.year ? " · " : ""}${Intl.NumberFormat().format(r.citations || 0)} citations${r.arxiv ? "" : " · not on arXiv"}</div></div>
        ${r.arxiv ? `<button data-arxiv="${esc(r.arxiv)}">Open ▸</button>` : ""}
      </div>`).join("")}</div>`;
    slot.querySelectorAll(".rel button").forEach((b) => b.addEventListener("click", () => openDetails(b.dataset.arxiv)));
  } catch (e) {
    const slot = $("#related-slot"); if (slot) slot.innerHTML = `<div class="muted-box">${esc(e.message)}</div>`;
  }
}

/* ── AI results ── */
function cacheNote(cached, fulltext) {
  const bits = [];
  if (fulltext) bits.push(`<span class="tag ft">full PDF</span>`);
  if (cached) bits.push(`<span class="tag">cached</span> loaded instantly — hit ↻ to regenerate`);
  else if (fulltext) bits.push("read the entire paper");
  if (!bits.length) return "";
  return `<div class="cache-note">${bits.join(" ")}</div>`;
}
const mdToHTML = (md) => (window.marked ? window.marked.parse(md) : `<pre>${esc(md)}</pre>`);

async function openAnalysis(id, kind, kicker, label, fresh = false) {
  drawerOpen();
  setHeader(kicker, label);
  setControls({ back: () => openDetails(id) });
  bodyLoading(state.fullPaper ? "Claude is reading the full PDF…" : "Claude is reading the paper…");
  try {
    const data = await api("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind, fresh, fulltext: state.fullPaper }) });
    const title = (state.papers[id] || {}).title || id;
    bodyHTML(cacheNote(data.cached, data.fulltext) + `<div class="md">${mdToHTML(data.markdown)}</div>`);
    setControls({
      back: () => openDetails(id),
      refresh: () => openAnalysis(id, kind, kicker, label, true),
      exp: { name: `${kind}-${id}.md`, text: `# ${label}\n\n> ${title}\n\n${data.markdown}` },
    });
  } catch (e) { bodyError(e.message); setControls({ back: () => openDetails(id) }); }
}

async function openReview(id, fresh = false) {
  drawerOpen();
  setHeader("Peer review", "Reviewer scorecard");
  setControls({ back: () => openDetails(id) });
  bodyLoading(state.fullPaper ? "Claude is reviewing the full PDF…" : "Claude is reviewing the paper…");
  try {
    const data = await api("/api/review", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fresh, fulltext: state.fullPaper }) });
    renderScorecard(data.review, data.paper, data.cached, data.fulltext);
    setControls({
      back: () => openDetails(id),
      refresh: () => openReview(id, true),
      exp: { name: `review-${id}.md`, text: scorecardMd(data.review, data.paper) },
    });
  } catch (e) { bodyError(e.message); setControls({ back: () => openDetails(id) }); }
}

/* ── multi-paper (dock) ── */
async function runMulti(endpoint, kicker, title, kind, extra = {}) {
  if (state.selected.size < 2) return;
  drawerOpen();
  setHeader(kicker, title);
  setControls();
  bodyLoading("Claude is working across the selected papers…");
  const ids = [...state.selected];
  try {
    const data = await api(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, ...extra }) });
    bodyHTML(`<div class="md">${mdToHTML(data.markdown)}</div>`);
    setControls({ exp: { name: `${kind}.md`, text: `# ${title}\n\n${data.markdown}` } });
  } catch (e) { bodyError(e.message); }
}
const runCompare = () => runMulti("/api/compare", "Compare", "Paper comparison", "comparison");
const runGaps = () => runMulti("/api/gaps", "Gap finder", "Research gap analysis", "gaps", { topic: $("#gap-topic").value.trim() });
const runPlan = () => runMulti("/api/reading-plan", "Reading plan", "Reading plan", "reading-plan");

/* ── scorecard ── */
const levelClass = (v) => { const s = String(v).toLowerCase(); return s.startsWith("high") ? "high" : s.startsWith("med") ? "medium" : "low"; };
function ringSVG(val, max = 100, size = 78, sw = 6, color = "var(--accent)") {
  const frac = Math.max(0, Math.min(1, (val || 0) / max));
  const r = size / 2 - sw, c = 2 * Math.PI * r, off = c * (1 - frac);
  const cc = size / 2;
  return `<svg width="${size}" height="${size}"><circle cx="${cc}" cy="${cc}" r="${r}" fill="none" stroke="var(--panel-3)" stroke-width="${sw}"/>
    <circle cx="${cc}" cy="${cc}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>`;
}
function scoreCell(label, v, max = 10) {
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  return `<div class="score-cell"><div class="label">${esc(label)}</div><div class="val">${esc(v)}<small>/${max}</small></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
}
function section(cls, title, items) {
  if (!items || !items.length) return "";
  return `<div class="section ${cls}"><h4>${esc(title)}</h4><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
}
function renderScorecard(r, paper, cached, fulltext) {
  const s = r.scores || {}, a = r.acceptance || {};
  bodyHTML(`${cacheNote(cached, fulltext)}
    <div class="scorecard">
      <div class="sc-title">${esc(paper.title)}</div>
      <div class="overall">
        <div class="ring">${ringSVG(r.overall, 10, 78, 6)}<div class="num">${esc(r.overall)}<small>/10</small></div></div>
        <div><div class="label">Overall rating</div><div class="sub">Reviewer confidence ${esc(r.confidence)}/5</div></div>
      </div>
      <div class="md"><p>${esc(r.summary)}</p></div>
      <div class="score-grid">
        ${scoreCell("Originality", s.originality)}${scoreCell("Methodology", s.methodology)}
        ${scoreCell("Clarity", s.clarity)}${scoreCell("Significance", s.significance)}
      </div>
      ${section("good", "Strengths", r.strengths)}
      ${section("warn", "Weaknesses", r.weaknesses)}
      ${section("crit", "Likely reviewer criticisms", r.predicted_criticisms)}
      ${section("", "Suggested experiments", r.suggested_experiments)}
      <div class="section"><h4>Acceptance likelihood</h4>
        <div class="accept-grid">
          <div class="accept-cell"><div class="tier">Top tier</div><div class="lvl ${levelClass(a.top_tier)}">${esc(a.top_tier)}</div></div>
          <div class="accept-cell"><div class="tier">Mid tier</div><div class="lvl ${levelClass(a.mid_tier)}">${esc(a.mid_tier)}</div></div>
          <div class="accept-cell"><div class="tier">Workshop</div><div class="lvl ${levelClass(a.workshop)}">${esc(a.workshop)}</div></div>
        </div>
        <div class="md"><p style="color:var(--muted);font-size:13px;margin-top:12px">${esc(a.rationale)}</p></div>
      </div>
    </div>`);
}
function scorecardMd(r, paper) {
  const s = r.scores || {}, a = r.acceptance || {};
  const li = (arr) => (arr || []).map((x) => `- ${x}`).join("\n");
  return `# Reviewer scorecard\n\n> ${paper.title}\n\n**Overall: ${r.overall}/10** (confidence ${r.confidence}/5)\n\n${r.summary}\n\n`
    + `| Axis | Score |\n|---|---|\n| Originality | ${s.originality}/10 |\n| Methodology | ${s.methodology}/10 |\n| Clarity | ${s.clarity}/10 |\n| Significance | ${s.significance}/10 |\n\n`
    + `## Strengths\n${li(r.strengths)}\n\n## Weaknesses\n${li(r.weaknesses)}\n\n## Likely reviewer criticisms\n${li(r.predicted_criticisms)}\n\n## Suggested experiments\n${li(r.suggested_experiments)}\n\n`
    + `## Acceptance likelihood\n- Top tier: ${a.top_tier}\n- Mid tier: ${a.mid_tier}\n- Workshop: ${a.workshop}\n\n${a.rationale}\n`;
}

/* ── wiring ── */
$("#search-form").addEventListener("submit", runSearch);
$$(".nav-item").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
$$("#example-chips button").forEach((b) => b.addEventListener("click", () => { $("#q").value = b.textContent; runSearch(); }));
$("#drawer-close").addEventListener("click", closeDrawer);
$("#overlay").addEventListener("click", closeDrawer);
$("#drawer-back").addEventListener("click", () => state.drawer.back && state.drawer.back());
$("#drawer-refresh").addEventListener("click", () => state.drawer.refresh && state.drawer.refresh());
$("#drawer-export").addEventListener("click", () => { const e = state.drawer.export; if (e) download(e.name, e.text); });
$("#dock-clear").addEventListener("click", () => { state.selected.clear(); refreshCards(); renderDock(); });
$("#btn-compare").addEventListener("click", runCompare);
$("#btn-gaps").addEventListener("click", runGaps);
$("#btn-plan").addEventListener("click", runPlan);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

// community + publish
$("#community-q").addEventListener("input", () => { clearTimeout(window._cq); window._cq = setTimeout(loadCommunity, 300); });
$("#community-field").addEventListener("change", loadCommunity);
$("#btn-publish-cta").addEventListener("click", () => switchView("publish"));
$("#publish-form").addEventListener("submit", submitPublish);
$("#btn-prereview").addEventListener("click", runPreReview);
$("#pub-abstract").addEventListener("input", updateAbsCount);

loadHealth();
