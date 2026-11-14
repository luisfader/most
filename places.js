/* «Угадай место» — раздел романа «Мост»: карточки с векторными рисунками мест Москвы.
   Картинка сначала показана крупным планом; каждая ошибка отодвигает «камеру», верный ответ показывает место целиком.
   Карточки листаются в обе стороны: свайпом, стрелками или клавишами ← →.
   Подключение: window.MostPlaces.mount(el, {store}); прогресс хранится в store под ключом "places". */
(function(){
"use strict";

/* ───────── помощники для SVG (у каждого рисунка свой префикс id, чтобы градиенты не путались) ───────── */
const f1 = n => +n.toFixed(1);
const onionD = (cx, by, w, h) => `M${f1(cx - w * .34)},${by} C${f1(cx - w * .8)},${f1(by - h * .32)} ${f1(cx - w * .3)},${f1(by - h * .7)} ${cx},${f1(by - h)} C${f1(cx + w * .3)},${f1(by - h * .7)} ${f1(cx + w * .8)},${f1(by - h * .32)} ${f1(cx + w * .34)},${by} Z`;
const onion = (p, cx, by, w, h, fill) => `<path d="${onionD(cx, by, w, h)}" fill="${fill}"/><path d="${onionD(cx, by, w, h)}" fill="url(#${p}sh)"/>`;
const cross = (x, y, s, c) => `<g stroke="${c || "#e8c060"}" stroke-width="${f1(s * .24)}" stroke-linecap="round"><line x1="${x}" y1="${y}" x2="${x}" y2="${f1(y - s * 1.8)}"/><line x1="${f1(x - s * .55)}" y1="${f1(y - s * 1.25)}" x2="${f1(x + s * .55)}" y2="${f1(y - s * 1.25)}"/><line x1="${f1(x - s * .35)}" y1="${f1(y - s * .55)}" x2="${f1(x + s * .35)}" y2="${f1(y - s * .75)}"/></g>`;
const star = (cx, cy, r, fill, rim) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? "L" : "M") + f1(cx + Math.cos(a) * rr) + "," + f1(cy + Math.sin(a) * rr); } return `<path d="${d}Z" fill="${fill}"${rim ? ` stroke="${rim}" stroke-width="${f1(r * .16)}" stroke-linejoin="round"` : ""}/>`; };
const grid = (x0, y0, cols, rows, dx, dy, w, h, fill, arch) => { let s = ""; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = f1(x0 + i * dx), y = f1(y0 + j * dy); s += arch ? `<path d="M${x},${f1(y + h)} v-${f1(h - w / 2)} a${w / 2},${w / 2} 0 0 1 ${w},0 v${f1(h - w / 2)} z" fill="${fill}"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`; } return s; };
const defs = (p, extra) => `<defs>
  <linearGradient id="${p}sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
  <linearGradient id="${p}g" x1="0" x2="1"><stop offset="0" stop-color="#fbe7a2"/><stop offset=".4" stop-color="#e6bb4f"/><stop offset="1" stop-color="#9c6d1a"/></linearGradient>
  <linearGradient id="${p}cy" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>${extra || ""}</defs>`;
const sky = (p, stops) => `<linearGradient id="${p}sk" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${f1(i / (stops.length - 1))}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const bg = p => `<rect width="400" height="300" fill="url(#${p}sk)"/>`;
// кремлёвская стена с зубцами «ласточкин хвост»
const kwall = (x0, x1, y, h, fill, dark) => { let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${300 - y}" fill="${fill}"/><rect x="${x0}" y="${y}" width="${x1 - x0}" height="3" fill="${dark}"/>`; for (let x = x0 + 2; x < x1 - 6; x += 11) s += `<path d="M${x},${y} v-${h} l3.3,${f1(h * .32)} l3.3,-${f1(h * .32)} v${h} z" fill="${fill}"/>`; return s; };
// ряд кокошников
const kok = (x0, n, w, y, fill, line) => Array.from({length:n}, (_, i) => `<path d="M${f1(x0 + i * w)},${y} a${w / 2},${f1(w * .62)} 0 0 1 ${w},0 z" fill="${fill}" stroke="${line}" stroke-width="1.2"/>`).join("");
const waterD = (p, y, a, b, glint) => `<linearGradient id="${p}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const water = (p, y, glint) => `<rect y="${y}" width="400" height="${300 - y}" fill="url(#${p}w)"/>` + Array.from({length:22}, (_, i) => `<rect x="${(i * 61 + (i % 3) * 17) % 390}" y="${f1(y + 6 + ((i * 23) % (300 - y - 10)))}" width="${14 + (i * 11) % 30}" height="1.8" rx=".9" fill="${glint}"/>`).join("");
const tree = (x, y, r, a, b) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${a}"/><circle cx="${f1(x - r * .35)}" cy="${f1(y - r * .3)}" r="${f1(r * .55)}" fill="${b}"/>`;
const person = (x, y, s, body, head) => `<g transform="translate(${x},${y}) scale(${s})"><circle cx="0" cy="-17" r="3.4" fill="${head || "#3a2e28"}"/><path d="M-3.6,-13 h7.2 l1.4,9 h-2.4 l-.6,4 h-4 l-.6,-4 h-2.4 z" fill="${body}"/></g>`;
// конь в профиль, вставший на дыбы (смотрит вправо); для квадриги
const horseD = "M2,30 C1,24 4,19 10,18 C16,17 22,17 27,15 L33,6 C35,2 39,0 43,2 L47,6 C48,8 47,10 45,10 L41,9 L38,15 C42,17 44,21 43,26 L49,22 L52,25 L44,31 C41,33 37,33 34,32 L34,42 L31,42 L30,33 C24,34 18,34 14,33 L12,42 L9,42 L9,32 C6,32 4,33 2,36 C0,34 0,32 2,30 Z";
const horse = (x, y, s, fill, flip) => `<path d="${horseD}" transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" fill="${fill}"/>`;

/* ───────── 12 мест Москвы. focus — стартовый крупный план [x, y, ширина] в координатах 400×300 ───────── */
const PLACES = [
  {id:"zaryadye", name:"Парящий мост в «Зарядье»", focus:[238, 92, 96],
   opts:["Парящий мост в «Зарядье»", "Пушкинский мост", "Мост «Багратион»", "Бородинский мост"],
   fact:"Мост в парке «Зарядье» открыли в 2017 году. Он выступает над Москвой-рекой, как буква V, и не опирается на воду. С него в романе всё и начинается.",
   svg:() => { const p = "za"; return defs(p, sky(p, ["#8fc0ea", "#d6e7f2", "#f7dcc0"]) + waterD(p, 0, "#86a9c8", "#46698c")) + bg(p) +
     // Кремль вдали: соборы, колокольня Ивана Великого, стена и Беклемишевская башня
     `<g opacity=".92"><rect x="84" y="118" width="54" height="40" fill="#efe9dc"/>${onion(p, 96, 120, 12, 15, `url(#${p}g)`)}${onion(p, 111, 112, 17, 21, `url(#${p}g)`)}${onion(p, 126, 120, 12, 15, `url(#${p}g)`)}${cross(111, 91, 4)}
      <rect x="150" y="98" width="18" height="60" fill="#f4f0e6"/><rect x="152" y="78" width="14" height="20" fill="#f4f0e6"/><rect x="154" y="64" width="10" height="14" fill="#f4f0e6"/>${grid(153, 104, 2, 3, 8, 16, 4, 9, "#c9c1b0", true)}${onion(p, 159, 66, 14, 18, `url(#${p}g)`)}${cross(159, 47, 4)}</g>` +
     kwall(0, 330, 150, 9, "#b14a3f", "#8c342c") +
     `<rect x="252" y="96" width="34" height="58" fill="#b5493d"/><rect x="252" y="96" width="34" height="58" fill="url(#${p}cy)"/><rect x="249" y="96" width="40" height="6" fill="#9b3d33"/>${grid(252, 102, 6, 1, 6, 0, 3, 4, "#7a2c25")}
      <rect x="258" y="80" width="22" height="16" fill="#b5493d"/><path d="M256,82 L269,30 L282,82 Z" fill="#3e6b50"/><path d="M269,30 L282,82 L269,82 Z" fill="#2f5640"/><rect x="265" y="22" width="8" height="10" fill="#b5493d"/><path d="M264,23 L269,10 L274,23 Z" fill="#3e6b50"/><line x1="269" y1="10" x2="269" y2="3" stroke="#e8c060" stroke-width="1.4"/>
      <rect x="330" y="128" width="64" height="26" fill="#b5463c"/>${onion(p, 342, 130, 14, 18, "#3f8a5a")}${onion(p, 362, 120, 18, 24, "#e2b13d")}${onion(p, 382, 130, 14, 18, "#4b76b9")}<path d="M356,128 L362,96 L368,128 Z" fill="#b5463c"/>` +
     water(p, 154, "rgba(255,255,255,.35)") +
     // парк «Зарядье» и набережная
     `${[[10, 150, 18], [36, 142, 22], [66, 150, 18], [92, 146, 20], [120, 152, 16]].map(([x, y, r]) => tree(x, y, r, "#5d8f4f", "#7aab62")).join("")}<rect x="0" y="158" width="150" height="14" fill="#b9b3a6"/><rect x="0" y="158" width="150" height="3" fill="#d8d2c4"/>
      <path d="M70,170 C150,160 240,128 330,98 L338,104 C330,126 300,146 240,168 C190,184 120,190 70,190 Z" fill="#e9e5dc"/>
      <path d="M70,170 C150,160 240,128 330,98 L338,104 C258,134 168,170 70,180 Z" fill="#cfc9bc"/>
      ${Array.from({length:12}, (_, i) => { const t = i / 11, x = 90 + t * 230, y1 = 178 - t * 72, y2 = 188 - t * 46; return `<line x1="${f1(x)}" y1="${f1(y1)}" x2="${f1(x - 10)}" y2="${f1(y2)}" stroke="#d8d3c8" stroke-width="1.2"/>`; }).join("")}
      <path d="M70,170 C150,160 240,128 330,98 L330,84 C240,114 150,146 70,158 Z" fill="rgba(205,232,250,.55)" stroke="#9cc3df" stroke-width="1.4"/>
      ${Array.from({length:16}, (_, i) => { const t = i / 15, x = 70 + t * 260, y = 170 - t * 72 + Math.sin(t * 3) * -6; return `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y - 12)}" stroke="#9cc3df" stroke-width="1"/>`; }).join("")}
      ${person(286, 116, 1.05, "#c0392b")}${person(298, 112, 1.05, "#2e5a8a")}${person(312, 106, 1, "#e6b84a")}${person(250, 130, 1, "#5a4a8a")}`; }},
  {id:"basil", name:"Собор Василия Блаженного", focus:[74, 84, 72],
   opts:["Собор Василия Блаженного", "Храм Христа Спасителя", "Казанский собор", "Новодевичий монастырь"],
   fact:"Покровский собор построили в 1555–1561 годах по приказу Ивана Грозного в честь взятия Казани. У каждого купола свой узор. В романе Наталья видит его с Парящего моста.",
   svg:() => { const p = "ba"; return defs(p, sky(p, ["#7fb4e4", "#cfe2f2", "#eef2f4"]) + `
      <pattern id="${p}1" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="14" height="14" fill="#c9322c"/><rect width="7" height="14" fill="#2b8a4a"/></pattern>
      <pattern id="${p}2" width="12" height="9" patternUnits="userSpaceOnUse"><rect width="12" height="9" fill="#2b8a4a"/><path d="M0,9 L6,1 L12,9 Z" fill="#f0c446"/></pattern>
      <pattern id="${p}3" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><rect width="12" height="12" fill="#f4f1e6"/><rect width="6" height="12" fill="#2f5aa8"/></pattern>
      <pattern id="${p}4" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#2b8a4a"/><path d="M5,0 L10,5 L5,10 L0,5 Z" fill="#f0c446"/></pattern>
      <pattern id="${p}5" width="12" height="8" patternUnits="userSpaceOnUse"><rect width="12" height="8" fill="#f0c446"/><path d="M0,8 L6,0 L12,8" fill="none" stroke="#c9322c" stroke-width="2.4"/></pattern>
      <pattern id="${p}6" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(36)"><rect width="12" height="12" fill="#f0c446"/><rect width="6" height="12" fill="#2b8a4a"/></pattern>`) + bg(p) +
     `<rect y="262" width="400" height="38" fill="#a29c94"/>${Array.from({length:9}, (_, i) => `<line x1="0" y1="${266 + i * 4}" x2="400" y2="${266 + i * 4}" stroke="rgba(0,0,0,.08)"/>`).join("")}
      <path d="M180,150 L200,38 L220,150 Z" fill="#b8473d"/><path d="M200,38 L220,150 L200,150 Z" fill="#9c3a32"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(k => { const y = 56 + k * 14, hw = (y - 38) / 112 * 20; return `<path d="M${f1(200 - hw)},${y} L200,${y - 6} L${f1(200 + hw)},${y}" fill="none" stroke="#f3ead9" stroke-width="1.6"/>`; }).join("")}
      <rect x="194" y="30" width="12" height="10" fill="#c9554a"/>${onion(p, 200, 32, 13, 15, `url(#${p}g)`)}${cross(200, 17, 5)}
      <rect x="176" y="148" width="48" height="44" fill="#c2493f"/>${kok(176, 4, 12, 158, "#c2493f", "#f3ead9")}${kok(180, 3, 13.3, 148, "#c2493f", "#f3ead9")}
      <rect x="40" y="188" width="320" height="74" fill="#b8453b"/><rect x="40" y="188" width="320" height="74" fill="url(#${p}cy)" opacity=".35"/><rect x="40" y="188" width="320" height="5" fill="#f3ead9"/><rect x="40" y="214" width="320" height="2" fill="#f3ead9"/>
      ${grid(52, 226, 11, 1, 28, 0, 14, 36, "#7c2a24", true)}${grid(56, 196, 11, 1, 28, 0, 8, 14, "#f3ead9", true)}
      ${[[108, 154, 46, 58, `url(#${p}1)`, 52], [152, 132, 46, 60, `url(#${p}2)`, 58], [248, 132, 46, 60, `url(#${p}3)`, 58], [292, 154, 46, 58, `url(#${p}4)`, 52], [72, 176, 32, 38, `url(#${p}5)`, 16], [328, 176, 32, 38, `url(#${p}6)`, 16]].map(([x, by, w, h, f, dh]) => {
        const dw = w * .62; return `<rect x="${f1(x - dw / 2)}" y="${by}" width="${f1(dw)}" height="${dh}" fill="#c24c41"/><rect x="${f1(x - dw / 2)}" y="${by}" width="${f1(dw)}" height="${dh}" fill="url(#${p}cy)"/>${kok(x - dw / 2, 3, dw / 3, by + 12, "#c24c41", "#f3ead9")}<rect x="${f1(x - dw / 2 - 2)}" y="${by - 3}" width="${f1(dw + 4)}" height="4" fill="#f3ead9"/>` + onion(p, x, by - 2, w, h, f) + onion(p, x, by - h, 7, 8, `url(#${p}g)`) + cross(x, by - h - 7, 4.5); }).join("")}
      <rect x="352" y="120" width="28" height="70" fill="#c24c41"/><rect x="348" y="114" width="36" height="8" fill="#f3ead9"/><path d="M350,114 L366,64 L382,114 Z" fill="#2f6b4a"/>${onion(p, 366, 66, 9, 11, `url(#${p}g)`)}${grid(356, 130, 2, 2, 12, 22, 6, 14, "#7c2a24", true)}`; }},
  {id:"spasskaya", name:"Спасская башня Кремля", focus:[162, 86, 76],
   opts:["Спасская башня Кремля", "Сухарева башня", "Боровицкая башня", "Исторический музей"],
   fact:"Главная башня Кремля с курантами. Рубиновая звезда на её шатре светится по ночам, а бой курантов слышно на всей Красной площади.",
   svg:() => { const p = "sp"; return defs(p, sky(p, ["#25385f", "#7d6f9c", "#e2a99a", "#f4d2b8"])) + bg(p) + `<g transform="translate(0,10)">` +
     kwall(0, 162, 196, 14, "#a83c33", "#7e2b24") + kwall(238, 400, 196, 14, "#a83c33", "#7e2b24") +
     `<rect y="276" width="400" height="24" fill="#5a4a46"/>
      <rect x="156" y="148" width="88" height="152" fill="#b4453b"/><rect x="156" y="148" width="88" height="152" fill="url(#${p}cy)"/>
      <path d="M182,300 v-52 a18,18 0 0 1 36,0 v52 z" fill="#f2eadc"/><path d="M186,300 v-50 a14,14 0 0 1 28,0 v50 z" fill="#3e1814"/><rect x="192" y="218" width="16" height="12" fill="#f2eadc"/><rect x="194" y="220" width="12" height="8" fill="#6a5a3a"/>
      ${[160, 236].map(x => `<rect x="${x - 2}" y="152" width="8" height="148" fill="#f2eadc" opacity=".5"/>`).join("")}
      <rect x="152" y="144" width="96" height="6" fill="#f2eadc"/>
      ${[154, 246].map(x => `<rect x="${x - 6}" y="120" width="12" height="26" fill="#c24f44"/><rect x="${x - 7}" y="118" width="14" height="3" fill="#f2eadc"/><path d="M${x - 6},118 L${x},100 L${x + 6},118 Z" fill="#2f6b4a"/><circle cx="${x}" cy="97" r="2.2" fill="#e8c060"/>`).join("")}
      <rect x="166" y="112" width="68" height="34" fill="#bd4a40"/><rect x="166" y="112" width="68" height="34" fill="url(#${p}cy)"/>${grid(172, 122, 4, 1, 16, 0, 8, 18, "#f2eadc", true)}${grid(174, 125, 4, 1, 16, 0, 4, 14, "#5c2420", true)}
      <rect x="170" y="74" width="60" height="40" fill="#c24f44"/><rect x="170" y="74" width="60" height="40" fill="url(#${p}cy)"/><rect x="166" y="72" width="68" height="4" fill="#f2eadc"/><rect x="166" y="110" width="68" height="4" fill="#f2eadc"/>
      <circle cx="200" cy="93" r="16" fill="#1c2c56" stroke="#e8c060" stroke-width="3"/>${Array.from({length:12}, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${f1(200 + Math.cos(a) * 10.5)}" y1="${f1(93 + Math.sin(a) * 10.5)}" x2="${f1(200 + Math.cos(a) * 14)}" y2="${f1(93 + Math.sin(a) * 14)}" stroke="#e8c060" stroke-width="2"/>`; }).join("")}
      <line x1="200" y1="93" x2="200" y2="82" stroke="#e8c060" stroke-width="2.4" stroke-linecap="round"/><line x1="200" y1="93" x2="208" y2="97" stroke="#e8c060" stroke-width="2.4" stroke-linecap="round"/>
      ${[168, 232].map(x => `<rect x="${x - 4}" y="56" width="8" height="18" fill="#f2eadc"/><path d="M${x - 5},56 L${x},40 L${x + 5},56 Z" fill="#2f6b4a"/><circle cx="${x}" cy="38" r="1.8" fill="#e8c060"/>`).join("")}
      <rect x="178" y="56" width="44" height="18" fill="#c24f44"/>${grid(182, 59, 4, 1, 10, 0, 6, 13, "#3e1814", true)}<rect x="176" y="54" width="48" height="3" fill="#f2eadc"/>
      <path d="M180,56 L200,16 L220,56 Z" fill="#2f6b4a"/><path d="M200,16 L220,56 L200,56 Z" fill="#245639"/>${grid(193, 38, 2, 1, 9, 0, 5, 9, "#f2eadc", true)}<path d="M180,56 L220,56" stroke="#e8c060" stroke-width="2"/>
      <rect x="198.6" y="8" width="2.8" height="10" fill="#e8c060"/>${star(200, 7, 9, "#d81f2b", "#e8c060")}<circle cx="200" cy="7" r="16" fill="#ff4a4a" opacity=".12"/></g>`; }},
  {id:"patriarshy", name:"Патриарший мост", focus:[28, 126, 66],
   opts:["Патриарший мост", "Крымский мост", "Большой Каменный мост", "Москворецкий мост"],
   fact:"Пешеходный мост ведёт от храма Христа Спасителя к Берсеневской набережной. Его открыли в 2004 году. В романе здесь происходит «Поцелуй на Патриаршем мосту».",
   svg:() => { const p = "pa"; return defs(p, sky(p, ["#e9a07a", "#f4c9a4", "#f8e2c8"]) + waterD(p, 0, "#9a9cb8", "#5d6890")) + bg(p) +
     `<rect x="0" y="152" width="90" height="46" fill="#b8664f"/><rect x="8" y="138" width="40" height="16" fill="#a95a45"/>${grid(4, 160, 7, 2, 12, 16, 6, 9, "#7d3e30")}<rect x="62" y="120" width="8" height="34" fill="#a95a45"/>
      <rect x="196" y="112" width="186" height="90" fill="#f6f2ea"/><rect x="196" y="112" width="186" height="90" fill="url(#${p}cy)" opacity=".5"/>
      ${kok(196, 3, 62, 112, "#f6f2ea", "#e2d8c4")}<path d="M250,112 a39,48 0 0 1 78,0 z" fill="#f9f6ef" stroke="#e2d8c4" stroke-width="1.4"/>
      ${grid(216, 140, 3, 1, 62, 0, 12, 28, "#c9bfa9", true)}${grid(258, 136, 3, 1, 22, 0, 10, 34, "#c9bfa9", true)}<rect x="196" y="186" width="186" height="16" fill="#e8e0d0"/>
      ${[204, 374].map(x => `<rect x="${x - 10}" y="86" width="20" height="30" fill="#f6f2ea"/><rect x="${x - 10}" y="86" width="20" height="30" fill="url(#${p}cy)"/>${grid(x - 4, 92, 1, 1, 0, 0, 8, 14, "#c9bfa9", true)}<path d="M${x - 11},88 C${x - 11},70 ${x + 11},70 ${x + 11},88 Z" fill="url(#${p}g)"/>${cross(x, 72, 3.6)}`).join("")}
      <rect x="262" y="66" width="54" height="40" fill="#f6f2ea"/><rect x="262" y="66" width="54" height="40" fill="url(#${p}cy)"/>${grid(268, 74, 5, 1, 9.6, 0, 5, 22, "#c9bfa9", true)}<rect x="258" y="64" width="62" height="4" fill="#e2d8c4"/>
      <path d="M260,66 C258,36 276,18 289,10 C302,18 320,36 318,66 Z" fill="url(#${p}g)"/>${[270, 280, 298, 308].map(x => `<path d="M${x},66 Q${f1(x + (289 - x) * .3)},30 289,10" fill="none" stroke="rgba(150,100,20,.45)" stroke-width="1"/>`).join("")}
      ${onion(p, 289, 12, 9, 10, `url(#${p}g)`)}${cross(289, 1, 5)}` +
     water(p, 202, "rgba(255,226,200,.45)") +
     `${[[-6, 136], [136, 270], [270, 410]].map(([a, b]) => `<path d="M${a},202 Q${(a + b) / 2},256 ${b},202" fill="none" stroke="#56635f" stroke-width="7"/>${Array.from({length:7}, (_, i) => { const t = (i + 1) / 8, x = a + (b - a) * t, y = 202 + 108 * t * (1 - t) * .5; return `<line x1="${f1(x)}" y1="204" x2="${f1(x)}" y2="${f1(y + 2)}" stroke="#56635f" stroke-width="2"/>`; }).join("")}`).join("")}
      <rect x="0" y="192" width="400" height="12" fill="#6c7a76"/><rect x="0" y="178" width="400" height="3" fill="#2f3634"/>${Array.from({length:50}, (_, i) => `<path d="M${i * 8 + 1},192 v-11 m3,0 v11" stroke="#2f3634" stroke-width="1"/>`).join("")}
      ${[54, 200, 346].map(x => `<rect x="${x - 3}" y="122" width="6" height="70" fill="#262c2b"/><rect x="${x - 6}" y="184" width="12" height="8" fill="#262c2b"/>
        <path d="M${x},140 C${x - 8},132 ${x - 20},136 ${x - 22},126 M${x},140 C${x + 8},132 ${x + 20},136 ${x + 22},126 M${x},132 C${x - 6},124 ${x - 12},122 ${x - 12},114 M${x},132 C${x + 6},124 ${x + 12},122 ${x + 12},114" fill="none" stroke="#262c2b" stroke-width="2.2"/>
        ${[[x - 22, 122], [x + 22, 122], [x - 12, 110], [x + 12, 110], [x, 108]].map(([lx, ly]) => `<circle cx="${lx}" cy="${ly}" r="5.6" fill="#fff4cc" stroke="#262c2b" stroke-width="1.6"/><circle cx="${lx}" cy="${ly}" r="10" fill="#ffe8a0" opacity=".25"/>`).join("")}`).join("")}
      ${person(126, 192, 1.25, "#b8323a")}${person(131, 192, 1.3, "#2a2a34")}`; }},
  {id:"kotel", name:"Высотка на Котельнической набережной", focus:[160, 2, 80],
   opts:["Высотка на Котельнической набережной", "Гостиница «Украина»", "Здание МИД на Смоленской", "Главное здание МГУ"],
   fact:"Одна из семи сталинских высоток. Её достроили в 1952 году там, где Яуза впадает в Москву-реку. В романе есть глава «Крыша на Котельнической».",
   svg:() => { const p = "ko"; const tierT = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e6d8bd"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}cy)"/><rect x="${x - 2}" y="${y}" width="${w + 4}" height="3" fill="#c7b089"/>${[x, x + w - 6].map(px => `<rect x="${px}" y="${y - 10}" width="6" height="10" fill="#efe3cb"/><path d="M${px - 1},${y - 10} L${px + 3},${y - 18} L${px + 7},${y - 10} Z" fill="#c7b089"/><line x1="${px + 3}" y1="${y - 18}" x2="${px + 3}" y2="${y - 24}" stroke="#e8c060" stroke-width="1.2"/>`).join("")}`;
     return defs(p, sky(p, ["#b796c4", "#eab9a8", "#f6d8bc"]) + waterD(p, 0, "#8e97b8", "#57638e")) + bg(p) +
     `${[[40, 176, 70, 70], [290, 176, 70, 70]].map(([x, y, w, h]) => tierT(x, y, w, h) + grid(x + 6, y + 8, 7, 5, 9, 12, 4, 7, "#8a7656")).join("")}
      ${[[64, 158, 22, 18], [314, 158, 22, 18]].map(([x, y, w, h]) => tierT(x, y, w, h)).join("")}
      ${tierT(110, 140, 180, 106)}${grid(116, 150, 19, 7, 9.2, 13, 4.4, 7.5, "#8a7656")}
      ${tierT(146, 110, 108, 32)}${grid(152, 118, 11, 2, 9, 12, 4.4, 7, "#8a7656")}
      ${tierT(162, 84, 76, 28)}${grid(168, 90, 8, 2, 8.6, 11, 4, 6.5, "#8a7656")}
      ${tierT(174, 62, 52, 24)}${grid(180, 68, 6, 1, 8, 0, 4, 9, "#8a7656")}
      ${tierT(186, 44, 28, 20)}${grid(190, 50, 4, 1, 6, 0, 3, 8, "#6a5a40", true)}
      <path d="M193,44 L200,8 L207,44 Z" fill="url(#${p}g)"/><rect x="198.8" y="2" width="2.4" height="8" fill="#e8c060"/>${star(200, 3, 6, "#d81f2b", "#e8c060")}
      <rect x="0" y="244" width="400" height="10" fill="#9c9488"/><rect x="0" y="244" width="400" height="3" fill="#bfb7aa"/>` + water(p, 254, "rgba(255,220,200,.45)"); }},
  {id:"pashkov", name:"Дом Пашкова", focus:[160, 34, 80],
   opts:["Дом Пашкова", "Большой театр", "Усадьба Кусково", "Царицыно"],
   fact:"Дворец конца XVIII века стоит на холме напротив Кремля. Сегодня это часть Российской государственной библиотеки. В романе есть глава «Бельведер»: с бельведера на крыше виден Кремль.",
   svg:() => { const p = "pk"; const cols = (x0, n, dx, y, h, w) => Array.from({length:n}, (_, i) => `<rect x="${f1(x0 + i * dx)}" y="${y}" width="${w}" height="${h}" fill="#fbfaf6"/><rect x="${f1(x0 + i * dx + w * .6)}" y="${y}" width="${f1(w * .4)}" height="${h}" fill="#dedad0"/>`).join("");
     const urn = (x, y) => `<path d="M${x - 2.5},${y} h5 l-1,-3 a3,3 0 1 0 -3,0 z" fill="#ece8de"/>`;
     return defs(p, sky(p, ["#9cc8ec", "#dbeaf3", "#f4f1ea"])) + bg(p) +
     `<path d="M0,226 Q200,186 400,226 L400,300 L0,300 Z" fill="#7aa86a"/><path d="M0,252 Q200,226 400,252 L400,300 L0,300 Z" fill="#5f8f55"/>
      ${[[30, 214, 14], [370, 214, 14], [12, 230, 12], [388, 230, 12]].map(([x, y, r]) => tree(x, y, r, "#4f7f45", "#6a9a58")).join("")}
      ${[[60, 158], [340, 158]].map(([x, y]) => `<rect x="${x - 26}" y="${y}" width="52" height="56" fill="#f8f6f0"/><rect x="${x - 26}" y="${y}" width="52" height="16" fill="#e8e4da"/>${cols(x - 20, 4, 12, y + 18, 38, 5)}<path d="M${x - 28},${y} L${x},${y - 14} L${x + 28},${y} Z" fill="#f2efe6" stroke="#dcd6c8"/>`).join("")}
      <rect x="86" y="170" width="78" height="44" fill="#f4f1ea"/><rect x="236" y="170" width="78" height="44" fill="#f4f1ea"/>${grid(92, 178, 6, 2, 12.4, 18, 6, 11, "#9fb2c2")}${grid(242, 178, 6, 2, 12.4, 18, 6, 11, "#9fb2c2")}
      <rect x="140" y="168" width="120" height="48" fill="#d9d4c8"/>${Array.from({length:6}, (_, i) => `<line x1="140" y1="${174 + i * 7}" x2="260" y2="${174 + i * 7}" stroke="#c4bdae"/>`).join("")}${grid(150, 182, 6, 1, 18.6, 0, 9, 24, "#7d8a92", true)}
      <rect x="140" y="112" width="120" height="58" fill="#f8f6f0"/>${cols(156, 4, 25, 118, 50, 7)}<rect x="136" y="110" width="128" height="6" fill="#e8e4da"/>
      ${grid(144, 124, 1, 2, 0, 22, 7, 14, "#9fb2c2")}${grid(249, 124, 1, 2, 0, 22, 7, 14, "#9fb2c2")}
      <rect x="138" y="100" width="124" height="12" fill="#f2efe6"/>${Array.from({length:15}, (_, i) => `<rect x="${140 + i * 8.2}" y="102" width="3" height="8" fill="#ddd7c9"/>`).join("")}${[142, 158, 242, 258].map(x => `<rect x="${x - 2}" y="88" width="4" height="12" fill="#e9e4d8"/><circle cx="${x}" cy="85" r="3" fill="#e9e4d8"/>`).join("")}
      <rect x="168" y="62" width="64" height="40" fill="#f8f6f0"/>${cols(172, 8, 7.6, 66, 32, 3.4)}<rect x="164" y="60" width="72" height="5" fill="#e8e4da"/>
      ${[166, 178, 190, 210, 222, 234].map(x => urn(x, 60)).join("")}
      <path d="M172,60 C172,38 228,38 228,60 Z" fill="#c5d0d4"/><path d="M200,40 C214,41 226,48 228,60 L200,60 Z" fill="#a9b6bb"/>
      <rect x="192" y="28" width="16" height="12" fill="#f8f6f0"/>${cols(193, 4, 4, 30, 9, 1.6)}<path d="M190,28 C190,20 210,20 210,28 Z" fill="#c5d0d4"/><line x1="200" y1="21" x2="200" y2="10" stroke="#8a9599" stroke-width="1.6"/>
      <rect x="0" y="262" width="400" height="4" fill="#e9e3d4"/>${Array.from({length:40}, (_, i) => `<rect x="${i * 10}" y="250" width="2.2" height="14" fill="#e9e3d4"/>`).join("")}${[60, 200, 340].map(x => `<rect x="${x - 4}" y="244" width="8" height="22" fill="#ddd6c6"/>`).join("")}`; }},
  {id:"sukhareva", name:"Сухарева башня", focus:[156, 6, 88],
   opts:["Сухарева башня", "Меншикова башня", "Боровицкая башня", "Северный речной вокзал"],
   fact:"Башню построили в конце XVII века при Петре I, в ней работала Школа математических и навигацких наук. В 1934 году её снесли, и увидеть её теперь можно только на старых картинках. В романе ей посвящена глава «Сухарева башня».",
   svg:() => { const p = "su"; const wnd = (x, y, w, h) => `<path d="M${x - 3},${y + h + 3} v-${h + 2} l${w / 2 + 3},-6 l${w / 2 + 3},6 v${h + 2} z" fill="#f2e9d6"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5e2a22"/>`;
     return defs(p, sky(p, ["#cdb994", "#e8dcc0", "#f2e8d2"]) + `<radialGradient id="${p}vg" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a2a10" stop-opacity=".35"/></radialGradient>`) + bg(p) +
     `<rect y="262" width="400" height="38" fill="#b9a688"/>${Array.from({length:6}, (_, i) => `<line x1="0" y1="${268 + i * 6}" x2="400" y2="${268 + i * 6}" stroke="rgba(80,60,30,.12)"/>`).join("")}
      <rect x="54" y="190" width="292" height="72" fill="#b4473c"/><rect x="54" y="190" width="292" height="72" fill="url(#${p}cy)" opacity=".4"/><rect x="50" y="186" width="300" height="6" fill="#f2e9d6"/>
      ${[72, 104, 136, 264, 296, 328].map(x => `<path d="M${x - 12},262 v-30 a12,12 0 0 1 24,0 v30 z" fill="#f2e9d6"/><path d="M${x - 9},262 v-28 a9,9 0 0 1 18,0 v28 z" fill="#5e2a22"/>`).join("")}
      ${grid(64, 198, 9, 1, 32.5, 0, 10, 14, "#5e2a22")}
      <path d="M150,262 L170,214 L230,214 L250,262 Z" fill="#ece0c8"/>${Array.from({length:8}, (_, i) => `<line x1="${152 + i * 2.6}" y1="${258 - i * 6}" x2="${248 - i * 2.6}" y2="${258 - i * 6}" stroke="#c9b898"/>`).join("")}
      <rect x="150" y="124" width="100" height="64" fill="#b84c41"/><rect x="150" y="124" width="100" height="64" fill="url(#${p}cy)"/><rect x="146" y="120" width="108" height="6" fill="#f2e9d6"/>${wnd(160, 140, 12, 22)}${wnd(194, 140, 12, 22)}${wnd(228, 140, 12, 22)}
      ${[152, 248].map(x => `<rect x="${x - 4}" y="106" width="8" height="16" fill="#f2e9d6"/><path d="M${x - 5},106 L${x},94 L${x + 5},106 Z" fill="#3f6b4f"/>`).join("")}
      <rect x="164" y="84" width="72" height="38" fill="#bc5247"/><rect x="164" y="84" width="72" height="38" fill="url(#${p}cy)"/><rect x="160" y="80" width="80" height="5" fill="#f2e9d6"/>
      <circle cx="200" cy="103" r="13" fill="#f4efe0" stroke="#3a2a20" stroke-width="1.8"/>${Array.from({length:12}, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${f1(200 + Math.cos(a) * 10)}" cy="${f1(103 + Math.sin(a) * 10)}" r=".9" fill="#3a2a20"/>`; }).join("")}<line x1="200" y1="103" x2="200" y2="95" stroke="#3a2a20" stroke-width="1.8"/><line x1="200" y1="103" x2="206" y2="106" stroke="#3a2a20" stroke-width="1.8"/>
      <path d="M176,80 L184,60 L216,60 L224,80 Z" fill="#c0564b"/>${grid(186, 64, 3, 1, 10, 0, 6, 12, "#5e2a22", true)}<rect x="182" y="58" width="36" height="4" fill="#f2e9d6"/>
      <path d="M184,60 L200,16 L216,60 Z" fill="#3f6b4f"/><path d="M200,16 L216,60 L200,60 Z" fill="#2f5640"/>
      <g fill="#d9a83a"><rect x="199" y="8" width="2" height="10"/><path d="M200,6 l-9,-4 l3,-1 l-2,-3 l5,2 l3,-4 l3,4 l5,-2 l-2,3 l3,1 z"/></g>
      <rect width="400" height="300" fill="url(#${p}vg)"/>`; }},
  {id:"luzhkov", name:"Лужков мост и «деревья любви»", focus:[96, 92, 80],
   opts:["Лужков мост и «деревья любви»", "Патриарший мост", "Пушкинский мост", "Андреевский мост"],
   fact:"Пешеходный мост через Водоотводный канал. Молодожёны вешают замки на его металлические «деревья любви». В романе есть главы «Замок на Лужковом мосту» и «Открытый замок».",
   svg:() => { const p = "lu"; const cl = ["#d8433a", "#f0c446", "#3f7fbf", "#4caf6a", "#e07ab0", "#f08a2a", "#9a6ad6", "#c9ccd0", "#e8e0d0"]; let locks = "";
     const tr = (x, s) => { let t = `<g stroke="#2a2522" stroke-linecap="round" fill="none"><path d="M${x},212 C${x - 2},180 ${x + 2},160 ${x},${f1(212 - 96 * s)}" stroke-width="${f1(7 * s)}"/>`; let k = 0;
       for (const [a, h, l] of [[-.9, .45, 1], [.9, .5, 1], [-.6, .72, .85], [.65, .78, .8], [-.25, .95, .6], [.3, .98, .6], [0, 1.05, .4]]) {
         const y = 212 - 96 * s * h, ex = x + Math.sin(a) * 52 * s * l, ey = y - Math.cos(a) * 34 * s * l;
         t += `<path d="M${x},${f1(y)} Q${f1(x + (ex - x) * .5)},${f1(y - 10 * s)} ${f1(ex)},${f1(ey)}" stroke-width="${f1(3.4 * s)}"/>`;
         for (let q = 0; q < 9; q++) { const u = (q + 1) / 10, lx = f1(x + (ex - x) * u + ((q * 7 + k) % 5 - 2) * 1.6), ly = f1(y + (ey - y) * u - 10 * s * 2 * u * (1 - u) + 3 + (q % 3) * 2.4); k++;
           locks += `<path d="M${f1(lx - 2.4)},${ly} v-2.6 a2.4,2.4 0 0 1 4.8,0 v2.6" fill="none" stroke="#8a8d92" stroke-width="1.1"/><rect x="${f1(lx - 3.6)}" y="${ly}" width="7.2" height="6.2" rx="1.6" fill="${cl[(k * 5 + x) % cl.length]}"/>`; } }
       return t + "</g>"; };
     return defs(p, sky(p, ["#94c0e6", "#d4e6f2", "#f2e8da"]) + waterD(p, 0, "#7f9cbc", "#4c6b8c")) + bg(p) +
     `<g opacity=".85">${kwall(150, 300, 150, 7, "#b5584c", "#93463c")}<rect x="196" y="118" width="18" height="34" fill="#b5584c"/><path d="M194,120 L205,92 L216,120 Z" fill="#3e6b50"/>${onion(p, 250, 132, 12, 14, `url(#${p}g)`)}${onion(p, 266, 126, 16, 20, `url(#${p}g)`)}<rect x="242" y="130" width="34" height="20" fill="#efe9dc"/></g>
      <rect x="0" y="134" width="120" height="60" fill="#e6d4b4"/><rect x="0" y="130" width="120" height="5" fill="#c9b48e"/>${grid(8, 142, 7, 3, 16, 16, 7, 10, "#8aa0b4")}<rect x="300" y="128" width="100" height="66" fill="#d9b8a4"/><rect x="300" y="124" width="100" height="5" fill="#b9947c"/>${grid(308, 136, 6, 3, 16, 18, 7, 11, "#8aa0b4")}` +
     water(p, 194, "rgba(255,255,255,.35)") +
     `<rect x="0" y="212" width="400" height="16" fill="#8f9295"/><rect x="0" y="198" width="400" height="3" fill="#33363a"/>${Array.from({length:50}, (_, i) => `<rect x="${i * 8}" y="198" width="1.6" height="14" fill="#33363a"/>`).join("")}<rect x="0" y="228" width="400" height="72" fill="url(#${p}w)"/>` +
     tr(118, 1.12) + tr(286, 1.02) + locks +
     `<g transform="translate(196,212)"><path d="M-10,0 L-4,-26 L4,-26 L12,0 Z" fill="#fbfbf8"/><circle cx="0" cy="-30" r="4.4" fill="#e9c9ae"/><path d="M-4.6,-31 C-6,-38 6,-38 4.6,-31 C4,-34 -4,-34 -4.6,-31 Z" fill="#6a4a30"/><path d="M-5,-33 C-12,-30 -14,-14 -12,-4 L-8,-20 Z" fill="rgba(255,255,255,.75)"/>
        <rect x="11" y="-27" width="9" height="27" fill="#1f2228"/><circle cx="15.5" cy="-31" r="4.2" fill="#e3bfa2"/><path d="M11,-34 h9 v-2 h-9 z" fill="#2a2018"/><path d="M11,-24 L2,-38" stroke="#1f2228" stroke-width="3" stroke-linecap="round"/><rect x="-1" y="-42" width="6" height="5" rx="1.4" fill="#e3b84e"/></g>`; }},
  {id:"city", name:"Москва-Сити", focus:[96, 64, 76],
   opts:["Москва-Сити", "Новый Арбат", "Ленинский проспект", "Остров Мечты"],
   fact:"Деловой квартал на Пресненской набережной. Башня «Эволюция» закручена спиралью, а к Сити через реку ведёт крытый мост «Багратион». Сити мелькает и в романе.",
   svg:() => { const p = "ci"; let evo = ""; for (let i = 0; i < 18; i++) { const y = 230 - i * 9, o = Math.sin(i * .55) * 9; evo += `<path d="M${f1(104 + o)},${y} h40 l${f1(Math.sin((i + 1) * .55) * 9 - o)},-9 h-40 z" fill="${i % 2 ? "#a9cdea" : "#7fa9d0"}"/><path d="M${f1(104 + o)},${y} h40" stroke="rgba(255,255,255,.55)" stroke-width="1"/>`; }
     return defs(p, sky(p, ["#4f8fd4", "#a9cdee", "#e4eef5"]) + waterD(p, 0, "#6d8db0", "#3e5f84") + `
      <linearGradient id="${p}gl" x1="0" x2="1"><stop offset="0" stop-color="#7fb0d8"/><stop offset=".45" stop-color="#d4ebf8"/><stop offset="1" stop-color="#4f80b0"/></linearGradient>
      <linearGradient id="${p}br" x1="0" x2="1"><stop offset="0" stop-color="#9a6a32"/><stop offset=".45" stop-color="#e9c892"/><stop offset="1" stop-color="#8a5a28"/></linearGradient>
      <linearGradient id="${p}dk" x1="0" x2="1"><stop offset="0" stop-color="#2a3646"/><stop offset=".5" stop-color="#58708a"/><stop offset="1" stop-color="#202a38"/></linearGradient>`) + bg(p) +
     `<rect x="20" y="128" width="40" height="104" fill="#7894b2"/><rect x="330" y="120" width="30" height="112" fill="url(#${p}dk)"/><rect x="362" y="138" width="30" height="94" fill="url(#${p}dk)"/>
      <path d="M60,232 V112 Q80,98 100,112 V232 Z" fill="#8fb0cf"/>${grid(64, 120, 4, 9, 9, 12, 6, 1.4, "rgba(255,255,255,.45)")}
      ${evo}<path d="M104,68 h40 l-4,-6 h-32 z" fill="#d4ebf8"/>
      <path d="M196,232 V40 L222,22 V232 Z" fill="url(#${p}gl)"/><path d="M222,232 V22 L246,40 V232 Z" fill="#4f80b0"/><line x1="222" y1="22" x2="222" y2="0" stroke="#d0d8e0" stroke-width="2"/>
      <path d="M168,232 V92 L184,80 V232 Z" fill="url(#${p}gl)"/><path d="M184,232 V80 L196,92 V232 Z" fill="#4f80b0"/>
      <path d="M258,232 V74 h12 v-8 h10 v-8 h10 v174 Z" fill="url(#${p}br)"/>${Array.from({length:14}, (_, i) => `<line x1="258" y1="${84 + i * 11}" x2="290" y2="${84 + i * 11}" stroke="rgba(90,50,10,.25)"/>`).join("")}
      <rect x="296" y="96" width="28" height="136" fill="url(#${p}dk)"/>${Array.from({length:22}, (_, i) => `<line x1="296" y1="${100 + i * 6}" x2="324" y2="${100 + i * 6}" stroke="rgba(255,255,255,.12)"/>`).join("")}` +
     water(p, 240, "rgba(255,255,255,.4)") +
     `<rect x="0" y="232" width="400" height="10" fill="#c9d2da"/><path d="M40,236 Q200,208 360,236 Z" fill="rgba(190,226,246,.8)" stroke="#9fb6c8" stroke-width="1.4"/>${Array.from({length:15}, (_, i) => { const x = 60 + i * 20, y = 236 - 28 * 4 * ((x - 40) / 320) * (1 - (x - 40) / 320); return `<line x1="${x}" y1="236" x2="${x}" y2="${f1(y)}" stroke="#9fb6c8" stroke-width="1"/>`; }).join("")}
      <rect x="0" y="242" width="400" height="4" fill="#7b8a98"/>
      <g opacity=".35" transform="translate(0,486) scale(1,-1)"><rect x="196" y="244" width="50" height="40" fill="#bcd8ee"/><rect x="258" y="244" width="32" height="30" fill="#e2c08a"/></g>`; }},
  {id:"mgu", name:"Главное здание МГУ", focus:[172, 0, 56],
   opts:["Главное здание МГУ", "Высотка на Котельнической набережной", "Гостиница «Ленинградская»", "Дом на Кудринской площади"],
   fact:"Главное здание МГУ на Воробьёвых горах достроили в 1953 году. Это самая высокая из семи сталинских высоток.",
   svg:() => { const p = "mg"; const blk = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ede3d0"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}cy)"/><rect x="${x - 2}" y="${y}" width="${w + 4}" height="3" fill="#c8b48e"/>`;
     return defs(p, sky(p, ["#6aa6de", "#bcd9f0", "#eaf1f6"])) + bg(p) +
     `${blk(14, 176, 120, 64)}${blk(266, 176, 120, 64)}${grid(20, 184, 13, 4, 9, 13, 4.4, 7, "#9a8a70")}${grid(272, 184, 13, 4, 9, 13, 4.4, 7, "#9a8a70")}
      ${[[30, 150], [370, 150]].map(([x, y]) => blk(x - 12, y, 24, 28) + `<path d="M${x - 12},${y} L${x},${y - 26} L${x + 12},${y} Z" fill="#d8c8aa"/><line x1="${x}" y1="${y - 26}" x2="${x}" y2="${y - 44}" stroke="#e8c060" stroke-width="2"/>${star(x, y - 46, 4.4, "#e8c060")}`).join("")}
      ${[[118, 128], [282, 128]].map(([x, y]) => blk(x - 16, y, 32, 50) + grid(x - 12, y + 8, 4, 3, 7, 13, 3.4, 7, "#9a8a70") + `<path d="M${x - 16},${y} L${x},${y - 30} L${x + 16},${y} Z" fill="#d8c8aa"/><line x1="${x}" y1="${y - 30}" x2="${x}" y2="${y - 52}" stroke="#e8c060" stroke-width="2.2"/>${star(x, y - 55, 5.4, "#e8c060")}${[x - 16, x + 12].map(sx => `<rect x="${sx}" y="${y - 10}" width="4" height="10" fill="#efe3cc"/>`).join("")}`).join("")}
      ${blk(150, 110, 100, 132)}${grid(158, 156, 10, 6, 9, 13, 4.4, 7, "#9a8a70")}
      <circle cx="200" cy="134" r="13" fill="#faf6ec" stroke="#b39a6a" stroke-width="2.4"/>${Array.from({length:12}, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${f1(200 + Math.cos(a) * 9.5)}" cy="${f1(134 + Math.sin(a) * 9.5)}" r="1" fill="#4a3a2a"/>`; }).join("")}<line x1="200" y1="134" x2="200" y2="126" stroke="#4a3a2a" stroke-width="1.8"/><line x1="200" y1="134" x2="206" y2="137" stroke="#4a3a2a" stroke-width="1.8"/>
      ${[154, 242].map(x => `<rect x="${x - 2}" y="98" width="8" height="12" fill="#efe3cc"/><circle cx="${x + 2}" cy="95" r="3.4" fill="#d8c8aa"/>`).join("")}
      ${blk(164, 84, 72, 28)}${grid(170, 90, 7, 1, 9.6, 0, 4.6, 16, "#8a7a60", true)}${blk(176, 64, 48, 22)}${grid(181, 68, 5, 1, 8.6, 0, 4, 14, "#8a7a60", true)}
      <path d="M182,64 C182,52 218,52 218,64 Z" fill="#d8c8aa"/><path d="M194,58 L200,24 L206,58 Z" fill="url(#${p}g)"/>
      <circle cx="200" cy="16" r="11.5" fill="none" stroke="#e8c060" stroke-width="3.6" stroke-dasharray="2.6 1.6"/>${star(200, 16, 8.4, `url(#${p}g)`, "#b48a2a")}
      <rect y="240" width="400" height="60" fill="#6f9a5c"/><rect x="120" y="252" width="160" height="22" rx="11" fill="#9ec4e2"/><rect x="120" y="252" width="160" height="22" rx="11" fill="none" stroke="#e8e0d0" stroke-width="2"/>${[150, 200, 250].map(x => `<path d="M${x},264 q-4,-12 0,-16 q4,4 0,16" fill="#e6f2fb"/>`).join("")}
      ${Array.from({length:10}, (_, i) => { const x = i < 5 ? 10 + i * 22 : 290 + (i - 5) * 24; return tree(x, 246 + (i % 2) * 4, 14, "#4f7f45", "#6a9a58"); }).join("")}`; }},
  {id:"ostankino", name:"Останкинская телебашня", focus:[164, 52, 72],
   opts:["Останкинская телебашня", "Шуховская башня", "Башня «Федерация»", "Петербургская телебашня"],
   fact:"Телебашня высотой 540 метров построена в 1967 году. Несколько лет она была самым высоким сооружением в мире. На высоте больше трёхсот метров работает ресторан «Седьмое небо».",
   svg:() => { const p = "os"; return defs(p, sky(p, ["#4d86c8", "#a9cdec", "#eaf2f7"]) + `<linearGradient id="${p}c" x1="0" x2="1"><stop offset="0" stop-color="#f4f2ee"/><stop offset=".55" stop-color="#e4e0d8"/><stop offset="1" stop-color="#b9b3a8"/></linearGradient>`) + bg(p) +
     `<rect y="262" width="400" height="38" fill="#6f9a5c"/>${Array.from({length:14}, (_, i) => tree(i * 31 + 6, 258 + (i % 2) * 5, 14 + (i % 3) * 3, "#4f7f45", "#6a9a58")).join("")}
      <path d="M160,266 C170,250 180,232 188,214 L212,214 C220,232 230,250 240,266 Z" fill="url(#${p}c)"/>${[166, 180, 194, 208, 222].map((x, i) => `<path d="M${x + 2},266 v-14 a6,9 0 0 1 12,0 v14 z" fill="#8f8a82"/>`).join("")}
      <path d="M188,216 L195,98 L205,98 L212,216 Z" fill="url(#${p}c)"/>${[200, 180, 160, 140, 120].map(y => { const hw = 5 + (y - 98) / 118 * 7; return `<rect x="${f1(200 - hw)}" y="${y}" width="${f1(hw * 2)}" height="2.2" fill="#c6c0b6"/>`; }).join("")}
      <path d="M176,98 h48 l-4,-4 h-40 z" fill="#d8d4cc"/><rect x="178" y="74" width="44" height="20" rx="4" fill="#3b4656"/>${[78, 85].map(y => `<rect x="180" y="${y}" width="40" height="3.4" fill="#ffe7a8" opacity=".9"/>`).join("")}<path d="M174,74 h52 l-6,-5 h-40 z" fill="#ece9e3"/>
      <rect x="194" y="60" width="12" height="10" fill="#3b4656"/><rect x="195" y="38" width="10" height="22" fill="url(#${p}c)"/>${[42, 52].map(y => `<rect x="195" y="${y}" width="10" height="5" fill="#d23a32"/>`).join("")}
      <rect x="197.5" y="4" width="5" height="36" fill="#d9d4cb"/>${[6, 16, 26].map(y => `<rect x="197.5" y="${y}" width="5" height="5" fill="#d23a32"/>`).join("")}<circle cx="200" cy="3" r="2" fill="#ff5a4a"/>`; }},
  {id:"bolshoi", name:"Большой театр", focus:[150, 30, 100],
   opts:["Большой театр", "Малый театр", "Дом Пашкова", "Пушкинский музей"],
   fact:"Над портиком — квадрига Аполлона работы Петра Клодта. Он же сделал коней Аничкова моста в Петербурге.",
   svg:() => { const p = "bo"; return defs(p, sky(p, ["#8cbce4", "#d5e6f1", "#f3e7d5"]) + `<linearGradient id="${p}col" x1="0" x2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset=".6" stop-color="#f1ead9"/><stop offset="1" stop-color="#d6ccb4"/></linearGradient>`) + bg(p) +
     `<rect y="262" width="400" height="38" fill="#a9a29a"/>
      <rect x="30" y="134" width="340" height="128" fill="#eed9a6"/><rect x="30" y="134" width="340" height="128" fill="url(#${p}cy)" opacity=".35"/><rect x="26" y="130" width="348" height="6" fill="#fbf6ea"/>
      ${grid(40, 148, 4, 3, 16, 36, 8, 20, "#7b6a4c", true)}${grid(298, 148, 4, 3, 16, 36, 8, 20, "#7b6a4c", true)}
      <rect x="104" y="144" width="192" height="118" fill="#e9dcc0"/>${grid(118, 220, 8, 1, 22.6, 0, 10, 30, "#6a5a40", true)}
      ${Array.from({length:8}, (_, i) => { const x = 112 + i * 25.1; return `<rect x="${f1(x)}" y="150" width="11" height="102" fill="url(#${p}col)"/><rect x="${f1(x - 2)}" y="146" width="15" height="5" fill="#f6efe0"/><path d="M${f1(x - 2)},146 q3,-4 7.5,0 q4.5,-4 7.5,0" fill="none" stroke="#d6ccb4" stroke-width="1.4"/><rect x="${f1(x - 2)}" y="250" width="15" height="4" fill="#e6dcc6"/>`; }).join("")}
      <rect x="98" y="134" width="204" height="12" fill="#fbf8ef"/><path d="M98,134 L200,98 L302,134 Z" fill="#fbf8ef"/><path d="M116,131 L200,103 L284,131 Z" fill="#efe6d0"/>
      <g fill="#c8a24a" transform="translate(200,120)"><path d="M0,-10 l-3,4 h-8 l3,4 l-6,1 l5,3 h12 l5,-3 l-6,-1 l3,-4 h-8 z"/><circle cx="-5" cy="-11" r="2"/><circle cx="5" cy="-11" r="2"/></g>
      <rect x="160" y="92" width="80" height="8" fill="#f1e8d4"/>
      <g fill="#3a2e22">${horse(150, 52, .95, "#3a2e22", false)}${horse(166, 50, 1, "#463828", false)}${horse(250, 52, .95, "#3a2e22", true)}${horse(234, 50, 1, "#463828", true)}
        <path d="M184,92 Q200,70 216,92 Z"/><rect x="196" y="52" width="8" height="26" rx="3"/><circle cx="200" cy="47" r="5"/><path d="M203,58 L215,40" stroke="#3a2e22" stroke-width="3.4" stroke-linecap="round"/><path d="M196,62 L186,54 M186,54 l-4,-6 l8,2 z" stroke="#3a2e22" stroke-width="2.6" stroke-linecap="round"/></g>
      ${[60, 340].map(x => `<rect x="${x - 2}" y="226" width="4" height="36" fill="#2e2a26"/><circle cx="${x}" cy="222" r="6" fill="#fff4cc" stroke="#2e2a26" stroke-width="1.6"/>`).join("")}`; }}
];

const CSS = `
.pl{font-family:var(--sans,system-ui)}
.pl-top{display:flex;justify-content:space-between;align-items:center;gap:10px;font:600 13px var(--sans);color:var(--muted);margin:2px 0 10px;flex-wrap:wrap}
.pl-top b{color:var(--accent)}
.pl-reset{all:unset;cursor:pointer;color:var(--muted);text-decoration:underline;font:500 12px var(--sans)}
.pl-view{position:relative;overflow:hidden;touch-action:pan-y;padding:6px 0 10px;user-select:none;-webkit-user-select:none}
.pl-track{display:flex;gap:16px;will-change:transform;transition:transform .38s cubic-bezier(.2,.8,.2,1)}
.pl-track.drag{transition:none}
.pl-card{flex:none;background:var(--paper);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 8px 24px rgba(40,20,10,.14);transition:transform .38s,opacity .38s;opacity:.55;transform:scale(.93)}
.pl-card.on{opacity:1;transform:none}
.pl-pic{position:relative;aspect-ratio:4/3;background:#ddd;overflow:hidden}
.pl-pic svg{display:block;width:100%;height:100%}
.pl-zoom{position:absolute;left:10px;top:10px;font:700 11px var(--sans);letter-spacing:.06em;background:rgba(0,0,0,.55);color:#fff;border-radius:999px;padding:4px 9px}
.pl-num{position:absolute;right:10px;top:10px;font:700 11px var(--sans);background:rgba(255,255,255,.85);color:#2a2420;border-radius:999px;padding:4px 9px}
.pl-body{padding:12px 14px 14px}
.pl-q{font:600 14px var(--sans);color:var(--ink);margin:0 0 10px}
.pl-opts{display:grid;gap:7px}
.pl-opts button{appearance:none;text-align:left;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);border-radius:11px;padding:10px 12px;font:600 14px var(--sans);cursor:pointer;transition:border-color .12s,transform .12s}
.pl-opts button:hover:not([disabled]){border-color:var(--accent)}
.pl-opts button.ok{background:#e3f5e6;border-color:#3aa55a;color:#1f5a2c}.pl-opts button.bad{background:#fbe5e3;border-color:#d9534f;color:#7a2320;text-decoration:line-through}
.pl-opts button[disabled]{cursor:default}
.pl-ans h3{font-family:var(--display,Georgia,serif);font-weight:600;font-size:24px;line-height:1.15;margin:0 0 6px;color:var(--ink)}
.pl-ans p{margin:0;font:14px/1.55 var(--sans);color:var(--ink)}
.pl-pts{display:inline-block;font:700 12px var(--sans);border-radius:999px;padding:3px 9px;margin-bottom:8px;background:#e3f5e6;color:#1f5a2c}.pl-pts.zero{background:#fbe5e3;color:#7a2320}
.pl-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:6px}
.pl-arrow{appearance:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--paper);color:var(--ink);font:600 20px var(--sans);cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.08)}
.pl-arrow:disabled{opacity:.35;cursor:default}
.pl-dots{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;max-width:220px}
.pl-dots i{width:9px;height:9px;border-radius:50%;background:var(--line);cursor:pointer}.pl-dots i.ok{background:#3aa55a}.pl-dots i.bad{background:#d9534f}.pl-dots i.on{outline:2px solid var(--accent);outline-offset:2px}
.pl-hint{text-align:center;font:12px var(--sans);color:var(--muted);margin-top:8px}`;

function mount(el, opt){
  if (!document.getElementById("plCss")) { const s = document.createElement("style"); s.id = "plCss"; s.textContent = CSS; document.head.appendChild(s); }
  const store = opt.store, KEY = "places", N = PLACES.length;
  let st = store.get(KEY, null) || {cur:0, ans:{}};   // ans[id] = {bad:[индексы ошибок], ok:bool, done:bool}
  const save = () => store.set(KEY, st);
  // варианты перемешаны, но одинаково при каждом заходе
  const order = PLACES.map((p, i) => { const o = p.opts.map((_, j) => j); let h = i * 7 + 3; for (let j = o.length - 1; j > 0; j--) { h = (h * 9301 + 49297) % 233280; const k = h % (j + 1); [o[j], o[k]] = [o[k], o[j]]; } return o; });
  const pts = id => { const a = st.ans[id]; return a && a.ok ? 3 - a.bad.length : 0; };
  const total = () => PLACES.reduce((s, p) => s + pts(p.id), 0);
  const solved = () => PLACES.filter(p => st.ans[p.id] && st.ans[p.id].done).length;
  // «камера»: 0 — крупный план, 1 — дальше, 2 — всё место
  const stepOf = p => { const a = st.ans[p.id]; return !a ? 0 : a.done ? 2 : Math.min(2, a.bad.length); };
  const vb = (p, step) => { const [fx, fy, fw] = p.focus, k = step / 2, w = fw + (400 - fw) * k, h = w * .75, x = fx + (0 - fx) * k, y = fy + (0 - fy) * k; return [x, y, w, h]; };

  el.innerHTML = `<div class="pl">
    <div class="pl-top"><span>Москва крупным планом. Угадай место по детали — с каждой ошибкой картинка отдаляется.</span><span>Очки: <b class="pl-score"></b> · угадано <b class="pl-solved"></b> из ${N} <button class="pl-reset" type="button">заново</button></span></div>
    <div class="pl-view"><div class="pl-track">${PLACES.map((p, i) => `<div class="pl-card" data-i="${i}"><div class="pl-pic"><svg viewBox="${vb(p, stepOf(p)).join(" ")}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Место ${i + 1}">${p.svg()}</svg><span class="pl-zoom"></span><span class="pl-num">${i + 1} / ${N}</span></div><div class="pl-body"></div></div>`).join("")}</div></div>
    <div class="pl-nav"><button class="pl-arrow" data-d="-1" aria-label="Предыдущая карточка">‹</button><div class="pl-dots">${PLACES.map((_, i) => `<i data-i="${i}"></i>`).join("")}</div><button class="pl-arrow" data-d="1" aria-label="Следующая карточка">›</button></div>
    <div class="pl-hint">Листай карточки пальцем в любую сторону или стрелками.</div></div>`;
  const root = el.querySelector(".pl"), view = root.querySelector(".pl-view"), track = root.querySelector(".pl-track"), cards = [...track.children];

  function body(i){
    const p = PLACES[i], a = st.ans[p.id], b = cards[i].querySelector(".pl-body"), step = stepOf(p);
    cards[i].querySelector(".pl-zoom").textContent = step === 2 ? "Общий план" : step === 1 ? "Ближе к общему" : "Крупный план";
    if (a && a.done) {
      const s = pts(p.id);
      b.innerHTML = `<div class="pl-ans"><span class="pl-pts${s ? "" : " zero"}">${s ? `+${s} ${s === 1 ? "очко" : "очка"}` : "Не угадано"}</span><h3>${p.name}</h3><p>${p.fact}</p></div>`;
    } else {
      b.innerHTML = `<p class="pl-q">Что это за место?</p><div class="pl-opts">${order[i].map(j => `<button type="button" data-o="${j}"${a && a.bad.includes(j) ? ` class="bad" disabled` : ""}>${p.opts[j]}</button>`).join("")}</div>`;
      b.querySelectorAll("[data-o]").forEach(btn => btn.onclick = () => answer(i, +btn.dataset.o));
    }
  }
  function zoomTo(i, step){
    const p = PLACES[i], svg = cards[i].querySelector("svg"), from = svg.getAttribute("viewBox").split(" ").map(Number), to = vb(p, step), t0 = performance.now(), D = 900;
    const ease = t => 1 - Math.pow(1 - t, 3);
    (function f(now){ const t = Math.min(1, (now - t0) / D), e = ease(t); svg.setAttribute("viewBox", from.map((v, k) => (v + (to[k] - v) * e).toFixed(2)).join(" ")); if (t < 1) requestAnimationFrame(f); })(t0);
  }
  function answer(i, j){
    const p = PLACES[i], a = st.ans[p.id] || (st.ans[p.id] = {bad:[], ok:false, done:false});
    if (a.done) return;
    if (j === 0) { a.ok = true; a.done = true; } else { a.bad.push(j); if (a.bad.length >= 3) a.done = true; }
    save(); zoomTo(i, stepOf(p)); body(i); hud();
  }
  function hud(){
    root.querySelector(".pl-score").textContent = total() + " из " + N * 3;
    root.querySelector(".pl-solved").textContent = PLACES.filter(p => st.ans[p.id] && st.ans[p.id].ok).length;
    root.querySelectorAll(".pl-dots i").forEach((d, i) => { const a = st.ans[PLACES[i].id]; d.className = (a && a.done ? (a.ok ? "ok" : "bad") : "") + (i === st.cur ? " on" : ""); });
    root.querySelector("[data-d='-1']").disabled = st.cur === 0; root.querySelector("[data-d='1']").disabled = st.cur === N - 1;
  }
  // ── листание
  let W = 300, drag = null;
  function layout(){
    const vw = view.clientWidth; W = Math.min(360, vw - 56); cards.forEach(c => c.style.width = W + "px");
    go(st.cur, true);
  }
  function offset(i){ return (view.clientWidth - W) / 2 - i * (W + 16); }
  function go(i, instant){
    st.cur = Math.max(0, Math.min(N - 1, i)); save();
    if (instant) track.classList.add("drag");
    track.style.transform = `translateX(${offset(st.cur)}px)`;
    if (instant) { void track.offsetWidth; track.classList.remove("drag"); }
    cards.forEach((c, k) => c.classList.toggle("on", k === st.cur));
    hud();
  }
  view.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; drag = {x:e.clientX, y:e.clientY, dx:0, id:e.pointerId, on:false}; });
  view.addEventListener("pointermove", e => { if (!drag || e.pointerId !== drag.id) return; drag.dx = e.clientX - drag.x;
    if (!drag.on && Math.abs(drag.dx) > 8 && Math.abs(drag.dx) > Math.abs(e.clientY - drag.y)) { drag.on = true; track.classList.add("drag"); try { view.setPointerCapture(e.pointerId); } catch(_) {} }
    if (drag.on) { const edge = (st.cur === 0 && drag.dx > 0) || (st.cur === N - 1 && drag.dx < 0) ? .35 : 1; track.style.transform = `translateX(${offset(st.cur) + drag.dx * edge}px)`; } });
  const end = e => { if (!drag) return; const d = drag; drag = null; track.classList.remove("drag"); if (!d.on) return; const th = Math.min(80, W * .2); go(st.cur + (d.dx < -th ? 1 : d.dx > th ? -1 : 0)); };
  view.addEventListener("pointerup", end); view.addEventListener("pointercancel", end);
  view.addEventListener("click", e => { const c = e.target.closest(".pl-card"); if (c && !e.target.closest("button") && +c.dataset.i !== st.cur) go(+c.dataset.i); });
  root.querySelectorAll(".pl-arrow").forEach(b => b.onclick = () => go(st.cur + +b.dataset.d));
  root.querySelectorAll(".pl-dots i").forEach(d => d.onclick = () => go(+d.dataset.i));
  root.querySelector(".pl-reset").onclick = () => { st = {cur:0, ans:{}}; save(); PLACES.forEach((p, i) => { cards[i].querySelector("svg").setAttribute("viewBox", vb(p, 0).join(" ")); body(i); }); go(0); };
  const key = e => { if (!el.isConnected) return document.removeEventListener("keydown", key); if (e.target.closest && e.target.closest("input,textarea")) return; const r = view.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; if (e.key === "ArrowLeft") go(st.cur - 1); if (e.key === "ArrowRight") go(st.cur + 1); };
  document.addEventListener("keydown", key);
  const rs = () => { if (!el.isConnected) return window.removeEventListener("resize", rs); layout(); };
  window.addEventListener("resize", rs);
  PLACES.forEach((_, i) => body(i));
  layout();
}
window.MostPlaces = {mount, count:PLACES.length};
})();
