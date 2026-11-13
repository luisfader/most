/* «Мост» — мини-игра в стиле динозаврика Chrome.
   Наталья бежит по стеклянному мосту у Киевского вокзала, прыгает и пригибается,
   а в конце её ждёт Роберт. MostRunner.mount(element, {onWin}) */
(function () {
  "use strict";
  const W = 256, H = 160, G = 134;          // размер сцены в пикселях и уровень настила моста
  const GOAL = 4800;                         // длина моста
  const GRAV = 1400, JUMP = 400;

  const PAL = {
    k: "#3a2633", H: "#f3d68f", h: "#d7b464", S: "#f7d0b5", b: "#f2a6a6", E: "#3a2a35", M: "#d9737b",
    O: "#ffffff", W: "#fffaf2", J: "#93b6d8", j: "#6f93ba", P: "#f6b1c3", p: "#e98fa8", B: "#fdfbf7",
    D: "#3b2b24", g: "#c9a08a", C: "#8d9099", c: "#6f727b", T: "#46546a", N: "#2e3341",
    R: "#e8456a", e: "#cdbfd2"
  };
  function sprite(rows) {
    const cv = document.createElement("canvas"); cv.width = rows[0].length; cv.height = rows.length;
    const x = cv.getContext("2d");
    rows.forEach((row, y) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, y, 1, 1); } } });
    return cv;
  }

  /* ---------- Наталья ---------- */
  const TOP = [
    ".....kkkkkk.....",
    "...kkHHHHHHkk...",
    "..kHHHHHHHHHHk..",
    ".kHHHHHHHHHHHHk.",
    ".kHHHHHHHHHhHHk.",
    ".kHHhhSSSSShHHk.",
    ".kHhSSSSSSSShHk.",
    ".kHSSESSSSESSHk.",
    ".kHSbSSSSSSbSHk.",
    ".kHHSSSMMSSSHHk.",
    ".kHHkSSSSSSkHHk.",
    ".kOHHkSSSSkHHOk.",
    "kOOOk.kSSk.kOOOk",
    ".kOk.kjWWjk.kOk.",
    "...kjjjWWjjjk...",
    "..kjjjWWWWjjjk..",
    "..kjjJWWWWJjjk..",
    ".kjjJJWWWWJJjjk.",
    ".kjjJJWWWWJJjjk.",
    ".kSkJJWWWWJJkSk.",
    ".kSkPPPPPPPPkSk.",
    "..kPPPpPPPpPPPk.",
    "..kPPpPPPPPpPPk.",
    ".kPPPPpPPPpPPPk.",
    ".kPPpPPPPPPpPPk.",
    "kPPPPPpPPpPPPPPk",
    ".kkkkkkkkkkkkkk."
  ];
  const LEGS1 = [".....kSk.kSk....", "....kSk...kSk...", "...kSk.....kSk..", "..kBBk.....kBBk."];
  const LEGS2 = ["......kSkSk.....", "......kSkSk.....", "......kSkSk.....", ".....kBBkBBk...."];
  const LEGSJ = ["....kSSk.kSSk...", "....kBBk.kBBk...", "................", "................"];
  const duckRows = legs => TOP.slice(0, 12).map(r => ".." + r.slice(0, 14))
    .concat([13, 15, 17, 19].map(i => TOP[i]), [21, 23, 25, 26].map(i => TOP[i]), legs.slice(2));
  let NAT = null, ROB = null, HEART = null, HEART0 = null, MINI = null;
  function buildSprites() {
    if (NAT) return;
    NAT = {
      run: [sprite(TOP.concat(LEGS1)), sprite(TOP.concat(LEGS2))],
      jump: sprite(TOP.concat(LEGSJ)),
      stand: sprite(TOP.concat(LEGS2)),
      duck: [sprite(duckRows(LEGS1)), sprite(duckRows(LEGS2))]
    };
    /* ---------- Роберт: тёмные волосы, лёгкая небритость, серое пальто нараспашку ---------- */
    const legs = Array(11).fill(".....kNNkNNk....");
    ROB = sprite([
      ".....kkkkkk.....",
      "....kDDDDDDk....",
      "...kDDDDDDDDk...",
      "...kDDDDDDDDk...",
      "...kDDSSSSDDk...",
      "...kDSSSSSSDk...",
      "...kSSESSESSk...",
      "...kSSSSSSSSk...",
      "...kSgSMMSgSk...",
      "....kSggggSk....",
      ".....kkSSkk.....",
      "...kkCTTTTCkk...",
      "..kCCCTTTTCCCk..",
      "..kCCcTTTTcCCk..",
      ".kCCCcTTTTcCCCk.",
      ".kCCkcTTTTckCCk.",
      ".kCCkcTTTTckCCk.",
      ".kCCkcTTTTckCCk.",
      ".kCCkcTTTTckCCk.",
      ".kSSkcNNNNckSSk.",
      ".kkkkcNNNNckkkk.",
      "....kcNNNNck....",
      "....kcNkkNck...."
    ].concat(legs, ["....kBBBkBBBk..."]));
    HEART = sprite([".kk.kk.", "kRRkRRk", "kRRRRRk", ".kRRRk.", "..kRk..", "...k..."]);
    HEART0 = sprite([".kk.kk.", "keekeek", "keeeeek", ".keeek.", "..kek..", "...k..."]);
    MINI = sprite([".RR.RR.", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."]);
  }

  /* ---------- Фон: закат, Москва, река ---------- */
  let SKY = null, CITY = null;
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function buildBackground() {
    if (SKY) return;
    SKY = document.createElement("canvas"); SKY.width = W; SKY.height = 100;
    let s = SKY.getContext("2d");
    const gr = s.createLinearGradient(0, 0, 0, 100);
    gr.addColorStop(0, "#2a2654"); gr.addColorStop(0.42, "#634689"); gr.addColorStop(0.72, "#d47f9c"); gr.addColorStop(1, "#f7c690");
    s.fillStyle = gr; s.fillRect(0, 0, W, 100);
    const sun = s.createRadialGradient(170, 96, 2, 170, 96, 60);
    sun.addColorStop(0, "rgba(255,226,170,.9)"); sun.addColorStop(1, "rgba(255,200,160,0)");
    s.fillStyle = sun; s.fillRect(0, 30, W, 70);

    CITY = document.createElement("canvas"); CITY.width = 512; CITY.height = 64;
    s = CITY.getContext("2d");
    const r = rng(7);
    const block = (x, w, h, col, lit) => {
      s.fillStyle = col; s.fillRect(x, 64 - h, w, h);
      if (lit) for (let yy = 64 - h + 3; yy < 62; yy += 4) for (let xx = x + 2; xx < x + w - 1; xx += 3)
        if (r() < 0.35) { s.fillStyle = r() < 0.5 ? "#ffd98a" : "#ffc27a"; s.fillRect(xx, yy, 1, 1); }
    };
    for (let x = 0; x < 512; x += 6 + Math.floor(r() * 12)) block(x, 10 + Math.floor(r() * 14), 12 + Math.floor(r() * 16), "#8a6aa6", false);
    for (let x = 0; x < 512; x += 10 + Math.floor(r() * 16)) {
      if ((x > 30 && x < 140) || (x > 270 && x < 360)) continue;
      block(x, 8 + Math.floor(r() * 14), 10 + Math.floor(r() * 18), "#4a3866", true);
    }
    // Киевский вокзал с часовой башней
    block(36, 96, 18, "#4a3866", true);
    s.fillStyle = "#4a3866"; s.fillRect(60, 40, 48, 6);
    for (let i = 0; i < 4; i++) { s.fillStyle = "#ffcf8a"; s.fillRect(66 + i * 10, 50, 5, 7); }
    s.fillStyle = "#4a3866"; s.fillRect(118, 10, 10, 42); s.fillRect(120, 4, 6, 6); s.fillRect(122, 0, 2, 4);
    s.fillStyle = "#f6e3b0"; s.fillRect(120, 14, 6, 6); s.fillStyle = "#4a3866"; s.fillRect(122, 15, 1, 3); s.fillRect(123, 17, 2, 1);
    // Сталинская высотка (гостиница «Украина»)
    block(282, 64, 20, "#4a3866", true);
    block(294, 40, 34, "#4a3866", true);
    block(304, 20, 46, "#4a3866", true);
    s.fillStyle = "#4a3866"; s.fillRect(309, 8, 10, 10); s.fillRect(312, 2, 4, 6); s.fillRect(313, 0, 2, 2);
    s.fillStyle = "#ffd98a"; s.fillRect(313, 0, 2, 1);
  }

  /* ---------- Стили ---------- */
  function css() {
    if (document.getElementById("mg-css")) return;
    const st = document.createElement("style"); st.id = "mg-css";
    st.textContent = `
.mg{margin:36px 0 10px;font-family:var(--sans,system-ui);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.mg-title{font:600 12px var(--sans,system-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#7a6e62);text-align:center;margin-bottom:12px}
.mg-screen{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.25);background:#2a2654;touch-action:none}
.mg-screen canvas{display:block;width:100%;height:auto;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}
.mg-ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:12px;background:rgba(32,22,48,.55);color:#fff}
.mg-ov[hidden]{display:none}
.mg-ov h3{font-family:var(--display,Georgia);font-size:28px;font-weight:600;margin:0;line-height:1.1}
.mg-ov p{margin:0;font-size:14px;line-height:1.4;max-width:300px}
.mg-ov .row2{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.mg-btn{font:600 15px var(--sans,system-ui);border-radius:10px;padding:11px 18px;background:var(--accent,#8c2f2f);color:#fff;border:1px solid var(--accent,#8c2f2f);cursor:pointer}
.mg-btn.ghost{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.6)}
.mg-toast{position:absolute;left:0;right:0;bottom:10px;text-align:center;color:#fff;font:italic 14px var(--serif,Georgia);text-shadow:0 1px 4px rgba(0,0,0,.7);opacity:0;transition:opacity .6s;pointer-events:none;padding:0 10px}
.mg-ctrl{display:flex;gap:10px;margin-top:12px}
.mg-ctrl[hidden],.mg-hint[hidden]{display:none}
.mg-ctrl button{flex:1;font:600 16px var(--sans,system-ui);padding:16px 10px;border-radius:12px;border:1px solid var(--accent,#8c2f2f);background:var(--accent-soft,#f0e2dc);color:var(--ink,#2a2420);touch-action:none;cursor:pointer}
.mg-ctrl button.on{background:var(--accent,#8c2f2f);color:#fff}
.mg-hint{font-size:12px;color:var(--muted,#7a6e62);text-align:center;margin:8px 0 0}
.mg-win{text-align:center;margin-top:16px}
.mg-win h3{font-family:var(--display,Georgia);font-size:30px;font-weight:600;margin:0 0 4px}
.mg-win p{margin:0 0 14px;color:var(--muted,#7a6e62)}`;
    document.head.appendChild(st);
  }

  /* ---------- Игра ---------- */
  function mount(host, opts) {
    opts = opts || {};
    buildSprites(); buildBackground(); css();
    const root = document.createElement("div"); root.className = "mg";
    root.innerHTML = `<div class="mg-title">Перейди мост — на том берегу тебя ждут</div>
      <div class="mg-screen"><canvas width="${W}" height="${H}" aria-label="Игра: Наталья переходит мост"></canvas><div class="mg-ov"></div><div class="mg-toast"></div></div>
      <div class="mg-ctrl"><button type="button" data-a="jump">▲ Прыжок</button><button type="button" data-a="duck">▼ Пригнуться</button></div>
      <p class="mg-hint">На компьютере: пробел или ↑ — прыжок, ↓ — пригнуться</p>`;
    host.appendChild(root);
    const cv = root.querySelector("canvas"), c = cv.getContext("2d");
    const ov = root.querySelector(".mg-ov"), toastEl = root.querySelector(".mg-toast"), ctrl = root.querySelector(".mg-ctrl"), hint = root.querySelector(".mg-hint");
    const bJump = ctrl.querySelector('[data-a="jump"]'), bDuck = ctrl.querySelector('[data-a="duck"]');

    let st = "intro", t = 0, off = 0, dist = 0, v = 0, hearts = 3, inv = 0, fails = 0, shake = 0, flash = 0;
    let ny = 0, vy = 0, onGround = true, duck = false, jumpHeld = false, jumpBuf = 0, animT = 0;
    let obs = [], nextSpawn = 0, past = false, flipped = false, unflipped = false, bargeX = W + 40;
    let phase = null, rx = 0, nx = 36, parts = [], endT = 0, winShown = false, raf = 0, last = 0, toastT = 0;

    function reset() {
      dist = 0; off = 0; v = 105; hearts = 3; inv = 0; ny = 0; vy = 0; onGround = true; obs = []; nextSpawn = 170;
      past = false; flipped = false; unflipped = false; flash = 0; phase = null; nx = 36; parts = []; endT = 0; winShown = false; bargeX = W + 40;
    }
    function overlay(html, buttons) {
      if (!html) { ov.hidden = true; ov.innerHTML = ""; return; }
      ov.hidden = false; ov.innerHTML = html + `<div class="row2">${buttons.map((b, i) => `<button type="button" class="mg-btn${b.ghost ? " ghost" : ""}" data-i="${i}">${b.label}</button>`).join("")}</div>`;
      ov.querySelectorAll("button").forEach(el => el.onclick = e => { e.stopPropagation(); buttons[+el.dataset.i].fn(); });
    }
    function toast(text) { toastEl.textContent = text; toastEl.style.opacity = 1; toastT = 3.2; }
    function start() { reset(); st = "run"; overlay(null); }
    function intro() {
      overlay(`<h3>Мост</h3><p>Помоги Наталье перейти мост: прыгай через препятствия и пригибайся от чаек.</p>`,
        [{label: "Играть", fn: start}]);
    }
    function gameOver() {
      st = "over"; fails++;
      const btns = [{label: "Ещё раз", fn: start}];
      if (fails >= 2) btns.push({label: "Пропустить игру", ghost: true, fn: finish});
      overlay(`<h3>Ой! Наталья споткнулась</h3><p>Ничего страшного — попробуй ещё раз.</p>`, btns);
    }
    function finish() {
      if (st === "won") return;
      st = "won"; overlay(null);
      ctrl.hidden = true; hint.hidden = true;
      const w = document.createElement("div"); w.className = "mg-win";
      w.innerHTML = `<h3>Ты дошла! ♥</h3><p>Роберт ждал тебя у конца моста.</p><button type="button" class="mg-btn">Продолжить историю →</button>`;
      root.appendChild(w);
      const b = w.querySelector("button");
      b.onclick = () => { b.disabled = true; opts.onWin && opts.onWin(); };
    }
    function pause() { if (st !== "run") return; st = "paused"; overlay(`<h3>Пауза</h3>`, [{label: "Продолжить", fn: () => { st = "run"; overlay(null); last = 0; }}]); }

    /* ---------- Управление ---------- */
    const press = () => { jumpHeld = true; jumpBuf = 0.14; };
    const release = () => { jumpHeld = false; };
    function onDown(e) { e.preventDefault(); const a = e.currentTarget.dataset.a; e.currentTarget.classList.add("on");
      if (a === "jump") press(); else duck = true; }
    function onUp(e) { const a = e.currentTarget.dataset.a; e.currentTarget.classList.remove("on");
      if (a === "jump") release(); else duck = false; }
    [bJump, bDuck].forEach(b => {
      b.addEventListener("pointerdown", onDown);
      ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, onUp));
      b.addEventListener("contextmenu", e => e.preventDefault());
    });
    cv.addEventListener("pointerdown", e => { e.preventDefault(); if (st === "run") press(); });
    cv.addEventListener("pointerup", release);
    const visible = () => { const r = cv.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
    function onKey(e) {
      if (!root.isConnected) return cleanup();
      if (!visible() || st !== "run") return;
      const down = e.type === "keydown";
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); if (down) { if (!e.repeat) press(); } else release(); }
      else if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); duck = down; }
    }
    function onVis() { if (document.hidden) pause(); }
    addEventListener("keydown", onKey); addEventListener("keyup", onKey);
    document.addEventListener("visibilitychange", onVis);
    function cleanup() { cancelAnimationFrame(raf); removeEventListener("keydown", onKey); removeEventListener("keyup", onKey); document.removeEventListener("visibilitychange", onVis); }

    /* ---------- Препятствия ---------- */
    function spawn(prog) {
      const air = prog > 0.12 && Math.random() < 0.3;
      if (air) { obs.push({kind: past ? "crow" : "gull", x: W + 4, y: G - 31, w: 14, h: 7, seed: Math.random() * 9}); return; }
      const pool = past ? ["wood", "pigeon", "wood"] : ["suitcase", "pigeon", "pot"];
      const kind = pool[Math.floor(Math.random() * pool.length)];
      const size = {suitcase: [12, 11], pigeon: [10, 8], pot: [9, 14], wood: [14, 9]}[kind];
      obs.push({kind, x: W + 4, y: G - size[1], w: size[0], h: size[1], seed: Math.random() * 9});
      if (kind === "pigeon" && prog > 0.3 && Math.random() < 0.4) obs.push({kind, x: W + 18, y: G - 8, w: 10, h: 8, seed: Math.random() * 9});
    }
    function box() {
      if (onGround && duck) return {x: nx + 3, y: G - 20, w: 11, h: 20};
      return {x: nx + 3, y: G - 28 - ny, w: 10, h: 27};
    }
    const hit = (a, o) => a.x < o.x + o.w - 1 && a.x + a.w > o.x + 1 && a.y < o.y + o.h - 1 && a.y + a.h > o.y + 1;

    /* ---------- Логика ---------- */
    function update(dt) {
      t += dt;
      if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.opacity = 0;
      if (flash > 0) flash = Math.max(0, flash - dt * 1.6);
      if (shake > 0) shake -= dt;
      if (st !== "run") return;
      const prog = dist / GOAL;
      if (!phase) v = 105 + 65 * Math.min(1, prog);
      dist += v * dt; off += v * dt;
      if (!flipped && prog > 0.45) { flipped = true; past = true; flash = 1; bargeX = W + 30; toast("Мир на несколько секунд переворачивает страницу…"); }
      if (flipped && !unflipped && prog > 0.62) { unflipped = true; past = false; flash = 1; }
      if (past) bargeX -= (v * 0.22 + 6) * dt;

      if (!phase) {
        nextSpawn -= v * dt;
        if (nextSpawn <= 0) {
          if (dist < GOAL && !(prog > 0.42 && prog < 0.49) && !(prog > 0.6 && prog < 0.64)) spawn(prog);
          nextSpawn = v * (0.85 + Math.random() * 0.9) + 30;
        }
        if (dist >= GOAL && obs.length === 0) { phase = "arrive"; rx = W + 20; }
      }
      obs.forEach(o => o.x -= v * dt * (o.kind === "gull" || o.kind === "crow" ? 1.15 : 1));
      obs = obs.filter(o => o.x > -30);

      if (jumpBuf > 0) jumpBuf -= dt;
      if (onGround && jumpBuf > 0 && !phase) { vy = JUMP; onGround = false; jumpBuf = 0; }
      if (!onGround) {
        let g = GRAV; if (duck) g *= 2.6; else if (!jumpHeld && vy > 0) g *= 2.2;
        vy -= g * dt; ny += vy * dt;
        if (ny <= 0) { ny = 0; vy = 0; onGround = true; }
      }

      if (!phase) {
        if (inv > 0) inv -= dt;
        else {
          const a = box();
          for (const o of obs) if (hit(a, o)) { o.dead = true; hearts--; inv = 1.4; shake = 0.25; break; }
          obs = obs.filter(o => !o.dead);
          if (hearts <= 0) return gameOver();
        }
      }
      if (phase === "arrive") {
        rx -= v * dt;
        if (rx - v * v / 440 <= 182) v = Math.max(0, v - 220 * dt); else v = Math.max(70, v - 25 * dt);
        if (v === 0) phase = "walk";
      } else if (phase === "walk") {
        nx += 42 * dt;
        if (nx >= rx - 15) { nx = rx - 15; phase = "meet"; endT = 0; }
      } else if (phase === "meet") {
        endT += dt;
        if (endT > 1.6 && !winShown) { winShown = true; finish(); }
      }
      animT += dt * (phase === "walk" ? 6 : phase === "meet" ? 0 : Math.max(4, v / 12));
    }
    function updateParts(dt) {
      if ((phase === "meet" || st === "won") && Math.random() < dt * 7)
        parts.push({x: nx + 12 + Math.random() * 8, y: G - 36, vx: (Math.random() - 0.5) * 14, vy: -16 - Math.random() * 12, life: 2.2});
      parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
      parts = parts.filter(p => p.life > 0);
    }

    /* ---------- Рисование ---------- */
    const R = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
    function drawObstacle(o) {
      const x = Math.round(o.x), y = o.y;
      if (o.kind === "suitcase") {
        R("#3a2633", x + 4, y, 4, 1); R("#3a2633", x + 4, y, 1, 2); R("#3a2633", x + 7, y, 1, 2);
        R("#3a2633", x, y + 2, 12, 8); R("#c4515a", x + 1, y + 3, 10, 6); R("#e07a80", x + 1, y + 3, 10, 1);
        R("#8f3240", x + 4, y + 3, 1, 6); R("#8f3240", x + 7, y + 3, 1, 6);
        R("#3a2633", x + 1, y + 10, 2, 1); R("#3a2633", x + 9, y + 10, 2, 1);
      } else if (o.kind === "pigeon") {
        const b = Math.floor(t * 6 + o.seed) % 2;
        R("#7f8794", x + 3, y + 3, 6, 4); R("#7f8794", x + 8, y + 2, 2, 2); R("#a3abb8", x + 4, y + 3, 4, 2);
        R("#5f6a7a", x + 1, y + 1 + b, 3, 3); R("#6fb08a", x + 2, y + 4, 2, 1);
        R("#ffffff", x + 1, y + 2 + b, 1, 1); R("#e7a04a", x, y + 3 + b, 1, 1);
        R("#d9737b", x + 4, y + 7, 1, 1); R("#d9737b", x + 6, y + 7, 1, 1);
      } else if (o.kind === "pot") {
        R("#4f9a5a", x + 4, y + 3, 1, 5); R("#4f9a5a", x + 2, y + 5, 1, 3); R("#4f9a5a", x + 6, y + 4, 1, 4);
        R("#f28bb0", x + 3, y, 3, 3); R("#ffd166", x + 4, y + 1, 1, 1);
        R("#ffd166", x + 1, y + 3, 2, 2); R("#f6f0ff", x + 6, y + 2, 2, 2);
        R("#3a2633", x, y + 8, 9, 6); R("#c8693f", x + 1, y + 8, 7, 5); R("#e08a5a", x + 1, y + 8, 7, 1);
      } else if (o.kind === "wood") {
        R("#3a2633", x, y + 1, 14, 8);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { R("#8a5a34", x + 1 + i * 3, y + 2 + j * 3, 3, 3); R("#d9a066", x + 2 + i * 3, y + 3 + j * 3, 1, 1); }
        R("#e8d4a0", x + 6, y + 1, 1, 8);
      } else {
        const crow = o.kind === "crow", f = Math.floor(t * 8 + o.seed) % 2;
        const body = crow ? "#2b2530" : "#fdfcff", wing = crow ? "#3e3646" : "#c9d0dc";
        R(body, x + 3, y + 3, 8, 2); R(body, x + 1, y + 2, 3, 2); R("#f2b84b", x, y + 3, 1, 1);
        R(crow ? "#f2b84b" : "#3a2633", x + 2, y + 2, 1, 1); R(crow ? "#2b2530" : "#9aa3b5", x + 11, y + 3, 2, 1);
        if (f) { R(wing, x + 5, y, 2, 3); R(wing, x + 7, y + 1, 3, 2); R("#3a2633", x + 5, y, 1, 1); }
        else { R(wing, x + 5, y + 5, 2, 2); R(wing, x + 7, y + 5, 3, 1); R("#3a2633", x + 5, y + 6, 1, 1); }
      }
    }
    function glow(x, y, rad, col) {
      const g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, "rgba(255,210,140,0)");
      c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    function draw() {
      c.save();
      if (shake > 0) c.translate(Math.round((Math.random() - 0.5) * 3), Math.round((Math.random() - 0.5) * 2));
      c.drawImage(SKY, 0, 0);
      for (let i = 0; i < 18; i++) { const sx = (i * 61 + 13) % W, sy = (i * 37 + 5) % 38; if (Math.sin(t * 2 + i) > -0.3) R("rgba(255,248,230,.85)", sx, sy, 1, 1); }
      for (let i = 0; i < 4; i++) {         // облака
        const cx = ((i * 140 + 30 - off * 0.04) % 560 + 560) % 560 - 60, cy = 44 + (i * 9) % 24;
        R("rgba(255,190,200,.35)", cx, cy, 46, 2); R("rgba(255,210,210,.25)", cx + 8, cy - 2, 26, 2);
      }
      const cxo = -((off * 0.15) % 512);    // город
      c.drawImage(CITY, Math.round(cxo), 36); c.drawImage(CITY, Math.round(cxo) + 512, 36);
      const rg = c.createLinearGradient(0, 100, 0, G); rg.addColorStop(0, "#8a5f95"); rg.addColorStop(1, "#2c2752");
      c.fillStyle = rg; c.fillRect(0, 100, W, G - 100);   // река
      for (let i = 0; i < 36; i++) {
        const span = 300, sx = (((i * 53 + 7) - off * (0.25 + (i % 3) * 0.05)) % span + span) % span - 20;
        const sy = 102 + (i * 7) % 30, a = (0.35 + 0.35 * Math.sin(t * 3 + i)).toFixed(2);
        R(i % 2 ? `rgba(247,197,140,${a})` : `rgba(242,160,176,${a})`, sx, sy, 3 + (i % 4) * 2, 1);
      }
      if (past && bargeX > -60) {           // баржа с дровами
        const bx = Math.round(bargeX), by = 112;
        R("#2a1d18", bx, by + 4, 46, 4); R("#2a1d18", bx + 2, by + 8, 42, 1);
        for (let i = 0; i < 8; i++) { R("#8a5a34", bx + 4 + i * 4, by + 1 - (i % 2), 4, 3); R("#d9a066", bx + 5 + i * 4, by + 2 - (i % 2), 1, 1); }
        R("#3b2a22", bx + 36, by - 4, 7, 8); R("#ffcf8a", bx + 38, by - 2, 2, 2); R("#2a1d18", bx + 40, by - 10, 1, 6);
      }
      if (!past) {                          // стеклянная галерея моста
        R("rgba(225,235,255,.10)", 0, 10, W, 8); R("rgba(235,240,255,.35)", 0, 18, W, 1);
        const sp = 48, o0 = -(off % sp);
        c.strokeStyle = "rgba(235,240,255,.22)"; c.lineWidth = 1;
        for (let x = o0; x < W + sp; x += sp) {
          const xr = Math.round(x);
          R("rgba(235,240,255,.22)", xr, 18, 2, G - 38);
          c.beginPath(); c.moveTo(xr + 1, 36); c.quadraticCurveTo(xr + sp / 2 + 1, 14, xr + sp + 1, 36); c.stroke();
        }
        for (let x = -(off % 96) + 24; x < W + 96; x += 96) { glow(x, 28, 14, "rgba(255,214,150,.75)"); R("#fff4d6", x - 1, 27, 2, 2); }
        R("rgba(200,225,255,.16)", 0, G - 20, W, 20); R("#d6dcea", 0, G - 21, W, 1);
        for (let x = -(off % 24); x < W; x += 24) R("rgba(160,170,195,.7)", x, G - 20, 1, 20);
      } else {                              // старый деревянный мост
        for (let x = -(off % 96) + 40; x < W + 96; x += 96) { R("#2f2a2a", x, G - 34, 1, 14); R("#2f2a2a", x - 2, G - 37, 5, 3); glow(x, G - 36, 12, "rgba(255,200,120,.8)"); }
        R("#6b4a2f", 0, G - 20, W, 2); R("#6b4a2f", 0, G - 5, W, 1);
        for (let x = -(off % 6); x < W; x += 6) R("#7d5836", x, G - 18, 2, 13);
      }
      R(past ? "#c9a47a" : "#d9c3b0", 0, G, W, 2);
      R(past ? "#8a6440" : "#8a7480", 0, G + 2, W, 6);
      for (let x = -(off % 10); x < W; x += 10) R(past ? "#6e4c2e" : "#6f5b68", x, G + 2, 1, 6);
      R("#3a2e47", 0, G + 8, W, H - G - 8);
      for (let x = -(off % 16); x < W; x += 16) { R("#4a3b5a", x, G + 10, 8, 2); R("#4a3b5a", x + 3, G + 12, 2, 10); }

      obs.forEach(drawObstacle);
      if (phase) {                          // Роберт с розой
        const bob = phase === "meet" || st === "won" ? Math.round(Math.sin(t * 3) * 0.6) : 0;
        const x = Math.round(rx), y = G - ROB.height + bob;
        c.drawImage(ROB, x, y);
        R("#4f9a5a", x + 1, y + 15, 1, 5); R("#e8456a", x, y + 12, 3, 3); R("#ff8aa5", x + 1, y + 12, 1, 1);
      }
      if (!(inv > 0 && Math.floor(inv * 12) % 2)) {   // Наталья
        let img;
        if (phase === "meet" || st === "won") img = NAT.stand;
        else if (!onGround) img = NAT.jump;
        else if (duck && !phase) img = NAT.duck[Math.floor(t * 10) % 2];
        else img = NAT.run[Math.floor(animT) % 2];
        c.drawImage(img, Math.round(nx), Math.round(G - img.height - ny));
      }
      if (phase === "meet" || st === "won") {
        const s = 2 + (Math.sin(t * 5) > 0 ? 1 : 0);
        c.drawImage(HEART, Math.round(nx + 15 - 3.5 * s), G - 52 - s * 3, 7 * s, 6 * s);
      }
      parts.forEach(p => { c.globalAlpha = Math.min(1, p.life); c.drawImage(MINI, Math.round(p.x), Math.round(p.y)); c.globalAlpha = 1; });

      if (past) { c.globalCompositeOperation = "multiply"; R("#f1cf9e", 0, 0, W, H); c.globalCompositeOperation = "source-over"; }
      if (flash > 0) R(`rgba(255,250,240,${flash.toFixed(2)})`, 0, 0, W, H);
      c.restore();

      if (st === "run" || st === "paused" || st === "over") {   // сердечки и путь
        for (let i = 0; i < 3; i++) c.drawImage(i < hearts ? HEART : HEART0, 6 + i * 9, 6);
        const x0 = 80, x1 = 236, p = Math.min(1, dist / GOAL);
        R("rgba(255,255,255,.35)", x0, 9, x1 - x0, 2); R("#f6b1c3", x0, 9, Math.round((x1 - x0) * p), 2);
        R("#3a2633", x0 + (x1 - x0) * p - 2, 7, 5, 5); R("#f3d68f", x0 + (x1 - x0) * p - 1, 8, 3, 3);
        c.drawImage(MINI, x1 + 3, 7);
      }
    }

    function frame(now) {
      if (!root.isConnected) return cleanup();
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 0; last = now;
      update(dt); updateParts(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    reset(); intro(); raf = requestAnimationFrame(frame);
    const api = {
      get state() { return {st, dist, hearts, phase, past}; },
      start, finish, setDist: d => { dist = d; }, setHearts: n => { hearts = n; }
    };
    mount.last = api;
    return api;
  }

  window.MostRunner = {mount};
})();
