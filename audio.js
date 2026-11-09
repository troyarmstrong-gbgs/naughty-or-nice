/* ==========================================================
   MUSIC + SFX
   - Browsers block sound until the player clicks or presses a key,
     so audio starts on the first interaction (usually START INVESTIGATING).
   - The opening SFX (Agents Listen) and the current scene's loop start together.
   - Loops hard-cut when the scene changes; every selection plays a click SFX.
   ========================================================== */
(function () {
  "use strict";
  const FILES = {
    intro:     "assets/audio/agents-listen.mp3", // opening SFX (plays once)
    click:     "assets/audio/click.mp3",         // SFX for every selection
    office:    "assets/audio/loop-1.mp3",        // overworld
    computer:  "assets/audio/loop-2.mp3",        // computer / case files (Pantry, streamed)
    board:     "assets/audio/loop-3.mp3",        // suspect board + accusation form
    submitted: "assets/audio/loop-4.mp3"         // thank-you screen after submitting
  };
  const VOLUME = 0.8;
  const KEY_MUTE = "npd_muted_v1";

  let ctx = null, master = null;
  let started = false;
  let want = null;          // track the current scene wants
  let playing = null;       // { name, src, gain }
  const buffers = {};
  let muted = false;
  try { muted = localStorage.getItem(KEY_MUTE) === "1"; } catch (e) {}

  function load(name) {
    if (!buffers[name]) {
      buffers[name] = fetch(FILES[name])
        .then((r) => { if (!r.ok) throw new Error("missing"); return r.arrayBuffer(); })
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null);
    }
    return buffers[name];
  }

  // Hard cut: stop the old loop immediately
  function stopNow(p) {
    if (!p) return;
    if (p.el) { try { p.el.pause(); } catch (e) {} return; }
    try { p.src.stop(); } catch (e) {}
    try { p.src.disconnect(); } catch (e) {}
  }

  // Long tracks (like the 46-minute computer track) stream instead of being fully
  // decoded into memory. They still run through `master`, so mute works.
  const STREAM = new Set(["computer"]);
  const streams = {};
  function streamFor(name) {
    if (!streams[name]) {
      const el = new Audio(FILES[name]);
      el.loop = true;
      el.preload = "auto";
      try { ctx.createMediaElementSource(el).connect(master); } catch (e) {}
      streams[name] = el;
    }
    return streams[name];
  }

  async function switchTo(name) {
    if (!ctx || !name) return;
    if (playing && playing.name === name) return;
    stopNow(playing);
    playing = null;
    if (STREAM.has(name)) {
      const el = streamFor(name);
      try { el.currentTime = 0; } catch (e) {}
      const pr = el.play(); if (pr && pr.catch) pr.catch(() => {});
      playing = { name, el };
      return;
    }
    const buf = await load(name);
    if (want !== name || !buf || (playing && playing.name === name)) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    src.connect(gain).connect(master);
    const t = ctx.currentTime;
    gain.gain.value = 1;
    src.start(t);
    playing = { name, src, gain };
  }

  // Create the (silent, suspended) audio engine right away so the opening sounds
  // can be downloaded and decoded before the player clicks OPEN THE CASE.
  function init() {
    if (ctx) return true;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
    ["intro", "click", "office"].forEach(load);
    return true;
  }

  async function start() {
    if (started) return;
    started = true;
    if (!init()) return;
    if (ctx.state === "suspended") { try { await ctx.resume(); } catch (e) {} }

    // Agents Listen and the scene's loop start at the same moment
    const [intro] = await Promise.all([load("intro"), STREAM.has(want) ? null : load(want)]);
    if (intro) {
      const s = ctx.createBufferSource();
      s.buffer = intro;
      s.connect(master);
      s.start();
    }
    switchTo(want);
    // warm up the other sounds in the background
    Object.keys(FILES).forEach((k) => { if (!STREAM.has(k)) load(k); });
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(KEY_MUTE, m ? "1" : "0"); } catch (e) {}
    if (master) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(m ? 0 : VOLUME, t + 0.25);
    }
    updateButton();
  }

  async function playSfx(name) {
    if (!ctx) return;
    const buf = await load(name);
    if (!buf) return;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.connect(master);
    s.start();
  }

  // Click SFX on every selection: buttons, links, hotspots and cards
  // (not the hidden clock, which has its own sound, and not the sound toggle)
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("button, a, [role='radio'], .hotspot");
    if (!t || t.id === "sound-toggle" || t.closest("#tp, #tp-toggle")) return;
    playSfx("click");
  }, true);

  /* ---------- sound toggle button ---------- */
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "sound-toggle";
  btn.className = "sound-toggle";
  function updateButton() {
    btn.textContent = muted ? "Sound: Off" : "Sound: On";
    btn.setAttribute("aria-pressed", String(!muted));
  }
  btn.addEventListener("click", (e) => { e.stopPropagation(); start(); setMuted(!muted); });
  updateButton();
  document.body.appendChild(btn);

  // First interaction anywhere starts audio
  const kick = () => start();
  ["pointerdown", "keydown", "touchend"].forEach((ev) => document.addEventListener(ev, kick, { once: true, capture: true }));

  init();

  window.NPD_AUDIO = {
    scene(name) { want = name; if (started) switchTo(name); },
    start,
    get current() { return playing ? playing.name : null; },
    get muted() { return muted; }
  };
})();
