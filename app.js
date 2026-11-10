(function () {
  "use strict";

  const CFG = window.GAME_CONFIG;
  const CHIPS = CFG.CHIPS;
  const SVGNS = "http://www.w3.org/2000/svg";
  const KEY_NICE = "npd_nice_v1";
  const KEY_SUBMITTED = "npd_submitted_v1";

  /* ---------- tiny storage helpers (never let storage break the game) ---------- */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  let niceSet = new Set(store.get(KEY_NICE, []));
  const saveNice = () => store.set(KEY_NICE, [...niceSet]);

  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, html) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (html != null) n.innerHTML = html;
    return n;
  };
  const svg = (tag, attrs = {}) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* =========================================================
     ROUTER
     ========================================================= */
  const routes = { "": "office", "office": "office", "board": "board", "accuse": "accuse", "computer": "computer" };
  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const name = routes[hash] || "office";
    document.querySelectorAll(".scene").forEach((s) => (s.hidden = s.dataset.scene !== name));
    closeModal();
    window.scrollTo(0, 0);
    if (name === "board") {
      renderBoard();
      requestAnimationFrame(() => { fitNames(); drawString(); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitNames(); drawString(); });
    }
    if (name === "accuse") renderAccuse();
    if (name === "computer") renderCases();
    setMusic(name);
  }
  // Which loop plays where: office = Loop 1, computer = Loop 2, board + accusation form = Loop 3,
  // thank-you screen after submitting = Loop 4
  function setMusic(scene) {
    if (!window.NPD_AUDIO) return;
    let track = "office";
    if (scene === "computer") track = "computer";
    else if (scene === "board") track = "board";
    else if (scene === "accuse") track = store.get(KEY_SUBMITTED, null) ? "submitted" : "board";
    window.NPD_AUDIO.scene(track);
  }
  window.addEventListener("hashchange", route);
  window.NPD_REFRESH = route;

  /* =========================================================
     OFFICE HOLIDAY DECORATIONS (SVG in 2000x1286 image space)
     ========================================================= */
  function decorateOffice() {
    // Snow outside the window
    const snow = $("#deco-snow");
    for (let i = 0; i < 46; i++) {
      const x = 130 + Math.random() * 290;
      const y = 200 + Math.random() * 520;
      const c = svg("circle", { cx: x, cy: y, r: (1.5 + Math.random() * 3.5).toFixed(1), class: "flake" });
      c.style.animationDuration = (5 + Math.random() * 6).toFixed(1) + "s";
      c.style.animationDelay = (-Math.random() * 10).toFixed(1) + "s";
      snow.appendChild(c);
    }
    // snow pile on sill
    snow.appendChild(svg("path", { d: "M208,690 Q260,668 300,676 Q350,660 410,665 L410,700 L200,700 Z", fill: "#eaf6ff", opacity: ".95" }));

    // String lights along the ceiling trim
    const lights = $("#deco-lights");
    const colors = ["#ff3b4e", "#f4c542", "#32e07a", "#4fb3ff", "#ff8ad8"];
    const strands = [
      "M0,40 Q150,120 300,110 Q450,170 588,205",
      "M588,205 Q650,245 712,205 Q774,245 836,205 Q898,245 960,205 Q1022,245 1084,205 Q1146,245 1208,205 Q1264,245 1320,205",
      "M1320,205 Q1460,190 1600,120 Q1760,90 2000,10"
    ];
    let bulbIndex = 0;
    strands.forEach((d) => {
      const p = svg("path", { d, fill: "none", stroke: "#0d2a1a", "stroke-width": "4" });
      lights.appendChild(p);
      const len = p.getTotalLength();
      const step = 38;
      for (let t = 12; t < len; t += step) {
        const pt = p.getPointAtLength(t);
        const color = colors[bulbIndex % colors.length];
        const g = svg("g", { class: "bulb", filter: "url(#glow)" });
        g.style.animationDelay = ((bulbIndex % 5) * 0.32).toFixed(2) + "s";
        g.appendChild(svg("rect", { x: pt.x - 3, y: pt.y - 2, width: 6, height: 6, fill: "#333" }));
        g.appendChild(svg("ellipse", { cx: pt.x, cy: pt.y + 10, rx: 6, ry: 9, fill: color }));
        lights.appendChild(g);
        bulbIndex++;
      }
    });

    const deco = $("#deco-static");

    // Wreath around the clock
    const cx = 938, cy = 268;
    for (let a = 0; a < 360; a += 15) {
      const r = (a * Math.PI) / 180;
      deco.appendChild(svg("ellipse", {
        cx: cx + Math.cos(r) * 58, cy: cy + Math.sin(r) * 58, rx: 15, ry: 8,
        fill: a % 30 ? "#1f7a43" : "#2a9a55",
        transform: `rotate(${a + 90} ${cx + Math.cos(r) * 58} ${cy + Math.sin(r) * 58})`
      }));
    }
    [20, 95, 160, 230, 300].forEach((a) => {
      const r = (a * Math.PI) / 180;
      deco.appendChild(svg("circle", { cx: cx + Math.cos(r) * 60, cy: cy + Math.sin(r) * 60, r: 6, fill: "#e0243a" }));
    });
    // bow
    deco.appendChild(svg("path", { d: `M${cx},${cy + 58} l-26,-14 l0,28 Z M${cx},${cy + 58} l26,-14 l0,28 Z`, fill: "#d6283b" }));
    deco.appendChild(svg("path", { d: `M${cx - 4},${cy + 62} l-14,34 l10,-4 l6,8 Z M${cx + 4},${cy + 62} l14,34 l-10,-4 l-6,8 Z`, fill: "#b81c2e" }));
    deco.appendChild(svg("circle", { cx, cy: cy + 58, r: 7, fill: "#ff3b4e" }));

    // Garland swags over the suspect board
    const gx1 = 1330, gy1 = 326, gx2 = 1602, gy2 = 298;
    const swags = 4;
    let gd = `M${gx1},${gy1}`;
    for (let i = 1; i <= swags; i++) {
      const x = gx1 + ((gx2 - gx1) * i) / swags, y = gy1 + ((gy2 - gy1) * i) / swags;
      const mx = gx1 + ((gx2 - gx1) * (i - 0.5)) / swags, my = gy1 + ((gy2 - gy1) * (i - 0.5)) / swags + 40;
      gd += ` Q${mx},${my} ${x},${y}`;
    }
    deco.appendChild(svg("path", { d: gd, fill: "none", stroke: "#1c6b3a", "stroke-width": "16", "stroke-linecap": "round", "stroke-dasharray": "2 6" }));
    deco.appendChild(svg("path", { d: gd, fill: "none", stroke: "#2a9a55", "stroke-width": "9", "stroke-linecap": "round" }));
    for (let i = 0; i <= swags; i++) {
      const x = gx1 + ((gx2 - gx1) * i) / swags, y = gy1 + ((gy2 - gy1) * i) / swags;
      deco.appendChild(svg("circle", { cx: x, cy: y, r: 9, fill: i % 2 ? "#f4c542" : "#e0243a", stroke: "#fff", "stroke-width": "2" }));
    }

    // Santa hat on the desk lamp
    deco.appendChild(svg("path", { d: "M690,664 Q700,600 760,588 Q812,584 832,640 L842,684 Q800,640 790,664 Z", fill: "#d6283b" }));
    deco.appendChild(svg("rect", { x: 680, y: 652, width: 124, height: 22, rx: 11, fill: "#f6f6f6", transform: "rotate(-6 742 663)" }));
    deco.appendChild(svg("circle", { cx: 844, cy: 690, r: 13, fill: "#f6f6f6" }));

    // Little tree in the corner with presents
    const tx = 300, base = 1110;
    deco.appendChild(svg("rect", { x: tx - 12, y: base - 30, width: 24, height: 32, fill: "#5a3a22" }));
    [[base - 30, 92], [base - 95, 74], [base - 155, 56]].forEach(([y, w]) => {
      deco.appendChild(svg("polygon", { points: `${tx - w},${y} ${tx + w},${y} ${tx},${y - 95}`, fill: "#1f7a43", stroke: "#165a31", "stroke-width": "3" }));
    });
    const ornaments = [[260, 1060], [335, 1068], [300, 1030], [272, 995], [325, 1000], [290, 945], [315, 925], [240, 1075], [360, 1075]];
    ornaments.forEach(([x, y], i) => {
      const o = svg("circle", { cx: x, cy: y, r: 7, fill: colors[i % colors.length], class: "bulb", filter: "url(#glow)" });
      o.style.animationDelay = (i * 0.25).toFixed(2) + "s";
      deco.appendChild(o);
    });
    deco.appendChild(svg("polygon", { points: star(tx, base - 252, 20, 9), fill: "#f4c542", filter: "url(#glow)" }));
    const gift = (x, w, h, c, rib) => {
      deco.appendChild(svg("rect", { x, y: base + 22 - h, width: w, height: h, fill: c }));
      deco.appendChild(svg("rect", { x: x + w / 2 - 4, y: base + 22 - h, width: 8, height: h, fill: rib }));
      deco.appendChild(svg("rect", { x, y: base + 22 - h / 2 - 4, width: w, height: 8, fill: rib }));
    };
    gift(222, 56, 48, "#d6283b", "#f4c542");
    gift(330, 64, 38, "#4fb3ff", "#ffffff");
    gift(282, 44, 30, "#f4c542", "#d6283b");
  }
  function star(cx, cy, R, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r : R;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  /* =========================================================
     SUSPECT BOARD
     ========================================================= */
  const grid = $("#suspect-grid");
  function buildBoard() {
    CHIPS.forEach((c) => {
      const b = el("button", { type: "button", class: "polaroid", "data-id": c.id, "aria-pressed": "false" },
        `<span class="pin"></span>
         <span class="num">#${String(c.id).padStart(2, "0")}</span>
         <span class="mug"><img src="${esc(c.img)}" alt="" loading="lazy"></span>
         <span class="tag"><span>${esc(c.name)}</span></span>
         <span class="stamp">NICE</span>`);
      b.addEventListener("click", () => {
        if (niceSet.has(c.id)) niceSet.delete(c.id); else niceSet.add(c.id);
        saveNice();
        renderBoard();
        drawString();
      });
      grid.appendChild(b);
    });

    // Garland across the top of the board frame
    const g = $("#board-garland");
    let d = "M0,14";
    const n = 8;
    for (let i = 1; i <= n; i++) d += ` Q${(i - 0.5) * (1000 / n)},48 ${i * (1000 / n)},14`;
    g.appendChild(svg("path", { d, fill: "none", stroke: "#1c6b3a", "stroke-width": "12", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }));
    g.appendChild(svg("path", { d, fill: "none", stroke: "#2a9a55", "stroke-width": "6", "stroke-dasharray": "3 5", "vector-effect": "non-scaling-stroke" }));
    for (let i = 0; i <= n; i++) {
      g.appendChild(svg("ellipse", { cx: i * (1000 / n), cy: 14, rx: 7, ry: 9, fill: i % 2 ? "#f4c542" : "#e0243a" }));
    }

    $("#reset-board").addEventListener("click", () => {
      niceSet.clear(); saveNice(); renderBoard(); drawString();
    });
    window.addEventListener("resize", () => { if (!$("#scene-board").hidden) { fitNames(); drawString(); } });
  }

  // Make each Chip's name as big as possible while still fitting under its photo
  function fitNames() {
    grid.querySelectorAll(".polaroid .tag").forEach((box) => {
      const txt = box.firstElementChild;
      if (!box.clientWidth) return;
      for (let size = 19; size >= 7; size -= 0.5) {
        box.style.fontSize = size + "cqw";
        if (txt.offsetHeight <= box.clientHeight && txt.scrollWidth <= box.clientWidth) return;
      }
    });
  }

  function renderBoard() {
    grid.querySelectorAll(".polaroid").forEach((b) => {
      const id = Number(b.dataset.id);
      const nice = niceSet.has(id);
      b.classList.toggle("nice", nice);
      b.setAttribute("aria-pressed", String(nice));
      b.setAttribute("aria-label", `${CHIPS.find((c) => c.id === id).name}${nice ? " — cleared as NICE" : " — suspect"}`);
    });
    const left = CHIPS.length - niceSet.size;
    $("#suspect-counter").textContent = `${left} suspect${left === 1 ? "" : "s"} remaining`;
  }

  // Red string connecting remaining suspects, snaking row by row
  function drawString() {
    const layer = $("#string-layer");
    layer.innerHTML = "";
    const wrapBox = layer.getBoundingClientRect();
    const cards = [...grid.querySelectorAll(".polaroid")];
    if (!cards.length || !wrapBox.width) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const ordered = [];
    for (let r = 0; r * cols < cards.length; r++) {
      const row = cards.slice(r * cols, r * cols + cols);
      if (r % 2) row.reverse();
      ordered.push(...row);
    }
    const pts = ordered
      .filter((c) => !c.classList.contains("nice"))
      .map((c) => {
        const p = c.querySelector(".pin").getBoundingClientRect();
        return [p.left + p.width / 2 - wrapBox.left, p.top + p.height / 2 - wrapBox.top];
      });
    for (let i = 1; i < pts.length; i++) {
      layer.appendChild(svg("line", { x1: pts[i - 1][0], y1: pts[i - 1][1], x2: pts[i][0], y2: pts[i][1] }));
    }
  }

  /* =========================================================
     ACCUSATION / SUBMIT GUESS
     ========================================================= */
  let selectedId = null;
  const lineup = $("#lineup-grid");

  function buildAccuse() {
    CHIPS.forEach((c) => {
      const b = el("button", { type: "button", class: "pick", role: "radio", "aria-checked": "false", "data-id": c.id },
        `<img src="${esc(c.img)}" alt="" loading="lazy"><span>${esc(c.name)}</span>`);
      b.addEventListener("click", () => { selectedId = c.id; updatePicks(); $("#form-error").textContent = ""; });
      lineup.appendChild(b);
    });
    $("#accuse-form").addEventListener("submit", onSubmit);
  }

  function updatePicks() {
    lineup.querySelectorAll(".pick").forEach((b) => {
      const id = Number(b.dataset.id);
      b.setAttribute("aria-checked", String(id === selectedId));
      b.classList.toggle("is-nice", niceSet.has(id));
      b.setAttribute("aria-label", CHIPS.find((c) => c.id === id).name + (niceSet.has(id) ? " (marked nice)" : ""));
    });
  }

  function renderAccuse() {
    const done = store.get(KEY_SUBMITTED, null);
    const form = $("#accuse-form");
    const closed = $("#accuse-closed");
    if (done) {
      const chip = CHIPS.find((c) => c.id === done.chipId);
      form.hidden = true;
      closed.hidden = false;
      closed.innerHTML = `<h3>Thank you for your selection!</h3>
        ${chip ? `<img src="${esc(chip.img)}" alt="">` : ""}
        <p>Detective <b>${esc(done.name)}</b>, your accusation of <b>${esc(chip ? chip.name : "a suspect")}</b> is on file.</p>
        <p>The North Police Department will be in contact with you soon.</p>
        <p><a href="#office" class="btn btn-primary">Back to the office</a></p>`;
      return;
    }
    form.hidden = false;
    closed.hidden = true;
    updatePicks();
  }

  function onSubmit(e) {
    e.preventDefault();
    const err = $("#form-error");
    const name = $("#f-name").value.trim().replace(/\s+/g, " ");
    const email = $("#f-email").value.trim().toLowerCase();
    if (!selectedId) { err.textContent = "Pick the Chip you think is on the Naughty List."; return; }
    if (name.length < 2) { err.textContent = "Please enter your full name."; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please enter a valid email address."; return; }
    err.textContent = "";
    const chip = CHIPS.find((c) => c.id === selectedId);

    openModal({
      title: "Final answer?",
      body: `<div class="confirm-chip"><img src="${esc(chip.img)}" alt="">
               <p>You're accusing <b>${esc(chip.name)}</b> of being on this year's Naughty List.<br><br>
               Detective: <b>${esc(name)}</b><br>${esc(email)}<br><br>
               <b>This can't be changed.</b></p></div>`,
      actions: [
        { label: "Go back", cls: "btn-ghost", onClick: closeModal },
        { label: "Lock it in", cls: "btn-primary", onClick: () => send(name, email, chip) }
      ]
    });
  }

  async function send(name, email, chip) {
    const btns = document.querySelectorAll("#modal-actions button");
    btns.forEach((b) => (b.disabled = true));
    btns[btns.length - 1].textContent = "Submitting…";
    const err = $("#form-error");

    if (!CFG.SUBMIT_URL) {
      closeModal();
      err.textContent = "Submissions aren't connected yet (SUBMIT_URL is empty in config.js).";
      return;
    }

    try {
      // text/plain avoids a CORS preflight, which Apps Script can't answer
      const res = await fetch(CFG.SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ name, email, chipId: chip.id, chipName: chip.name })
      });
      const data = await res.json();
      closeModal();
      if (data.ok) {
        store.set(KEY_SUBMITTED, { name, chipId: chip.id, at: Date.now() });
        renderAccuse();
        setMusic("accuse");
        window.scrollTo(0, 0);
      } else if (data.error === "duplicate") {
        err.textContent = data.message || "A guess has already been submitted with that name or email.";
      } else {
        err.textContent = data.message || "Something went wrong. Please try again.";
      }
    } catch (ex) {
      closeModal();
      err.textContent = "Couldn't reach the North Police server. Check your connection and try again.";
    }
  }

  /* =========================================================
     COMPUTER / PUZZLES
     ========================================================= */
  function unlockDate(p) {
    if (!p.unlock) return null;            // no date = always open
    const [y, m, d] = p.unlock.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0);
  }
  function isUnlocked(p) { const d = unlockDate(p); return CFG.DEV_UNLOCK_ALL || !d || (CFG.NOW ? new Date(CFG.NOW) : new Date()) >= d; }

  const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const ICON_FOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M3 6h7l2 2h9v11H3z"/></svg>';
  function renderCases() {
    const list = $("#case-list");
    list.innerHTML = "";
    CFG.PUZZLES.forEach((p) => {
      const open = isUnlocked(p);
      const when = unlockDate(p) ? unlockDate(p).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
      const li = el("li");
      // Unlocked external case files are real links so they open in a new tab/window everywhere
      const b = open && p.external
        ? el("a", { class: "case", href: p.url, target: "_blank", rel: "noopener" })
        : el("button", { type: "button", class: "case" + (open ? "" : " locked"), "aria-disabled": String(!open) });
      b.innerHTML =
        `<span class="icon">${open ? ICON_FOLDER : ICON_LOCK}</span>
         <span><span class="t">${esc(p.title)}</span>
         <span class="s">${open ? esc(p.subtitle || "Open file") : "LOCKED &middot; Unlocks " + esc(when)}</span></span>`;
      if (!(open && p.external)) b.addEventListener("click", () => {
        if (!open) {
          openModal({ title: "Access denied", body: `<p><b>${esc(p.title)}</b> is still classified. It unlocks on <b>${esc(when)}</b>.</p>`,
            actions: [{ label: "OK", cls: "btn-primary", onClick: closeModal }] });
          return;
        }
        openPuzzle(p);
      });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function openPuzzle(p) {
    if (p.url) {
      openModal({ title: p.title, body: `<iframe src="${esc(p.url)}" title="${esc(p.title)}"></iframe>`, wide: true,
        actions: [{ label: "Close file", cls: "btn-primary", onClick: closeModal }] });
    } else {
      openModal({ title: p.title, body: `<p>This case file is open, but the evidence hasn't been uploaded yet. Check back soon, Detective.</p>`,
        actions: [{ label: "Close file", cls: "btn-primary", onClick: closeModal }] });
    }
  }

  /* =========================================================
     MODAL
     ========================================================= */
  const modal = $("#modal");
  let lastFocus = null;
  function openModal({ title, body, actions = [], wide = false }) {
    lastFocus = document.activeElement;
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = body;
    $(".modal-card").classList.toggle("wide", wide);
    const act = $("#modal-actions");
    act.innerHTML = "";
    actions.forEach((a) => {
      const b = el("button", { type: "button", class: "btn " + a.cls }, esc(a.label));
      b.addEventListener("click", a.onClick);
      act.appendChild(b);
    });
    modal.hidden = false;
    const focusTarget = act.querySelector(".btn-primary") || $("#modal-x");
    focusTarget.focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    $("#modal-body").innerHTML = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("#modal-x").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- secret sounds (clock + window), no visual cue ---------- */
  function secretSound(selector, file) {
    const snd = new Audio(file);
    snd.preload = "auto";
    $(selector).addEventListener("click", () => {
      if (window.NPD_AUDIO && window.NPD_AUDIO.muted) return;
      try { snd.currentTime = 0; const p = snd.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    });
  }
  secretSound("#clock-secret", "assets/about-time.mp3");
  secretSound("#window-secret", "assets/audio/snow.mp3");
  secretSound("#lamp-secret", "assets/audio/drawing-in-the-dark.mp3");
  secretSound("#trash-secret", "assets/audio/not-quite.mp3");
  secretSound("#tree-secret", "assets/audio/better-luck.mp3");
  secretSound("#door-secret", "assets/audio/bye.mp3");

  /* ---------- mission briefing ---------- */
  const briefing = $("#briefing");
  function openBriefing() { briefing.hidden = false; $("#close-briefing").focus(); }
  function closeBriefing() { briefing.hidden = true; }
  $("#open-briefing").addEventListener("click", openBriefing);
  $("#close-briefing").addEventListener("click", closeBriefing);
  briefing.addEventListener("click", (e) => { if (e.target === briefing) closeBriefing(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !briefing.hidden) closeBriefing(); });

  /* ---------- boot ---------- */
  decorateOffice();
  buildBoard();
  buildAccuse();
  route();
  // Browsers only allow sound after a click, so the game opens on a one-button gate.
  // That click starts the opening SFX + music, then the mission briefing appears.
  $("#gate-open").addEventListener("click", () => {
    if (window.NPD_AUDIO) window.NPD_AUDIO.start();
    $("#gate").hidden = true;
    openBriefing();
  });
  $("#gate-open").focus();
})();
