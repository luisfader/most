/* «Угадай место» — раздел романа «Мост»: карточки с векторными рисунками мест Москвы.
   Картинка сначала показана крупным планом; каждая ошибка отодвигает «камеру», верный ответ показывает место целиком.
   Карточки листаются в обе стороны: свайпом, стрелками или клавишами ← →.
   Подключение: window.MostPlaces.mount(el, {store}); прогресс хранится в store под ключом "places". */
(function(){
"use strict";

/* ───────── помощники для SVG ───────── */
const onion = (cx, by, w, h, fill, stroke) => `<path d="M${cx - w * .36},${by} C${cx - w * .78},${by - h * .36} ${cx - w * .26},${by - h * .72} ${cx},${by - h} C${cx + w * .26},${by - h * .72} ${cx + w * .78},${by - h * .36} ${cx + w * .36},${by} Z" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1.5"` : ""}/>`;
const cross = (x, y, s, c) => `<g stroke="${c || "#e3b84e"}" stroke-width="${s * .22}" stroke-linecap="round"><line x1="${x}" y1="${y}" x2="${x}" y2="${y - s * 1.6}"/><line x1="${x - s * .5}" y1="${y - s * 1.1}" x2="${x + s * .5}" y2="${y - s * 1.1}"/></g>`;
const star = (cx, cy, r, fill, rim) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + "," + (cy + Math.sin(a) * rr).toFixed(1); } return `<path d="${d}Z" fill="${fill}"${rim ? ` stroke="${rim}" stroke-width="1.6" stroke-linejoin="round"` : ""}/>`; };
const windows = (x0, y0, cols, rows, dx, dy, w, h, fill) => { let s = ""; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) s += `<rect x="${x0 + i * dx}" y="${y0 + j * dy}" width="${w}" height="${h}" rx="${Math.min(w, h) * .25}" fill="${fill}"/>`; return s; };
const sky = (id, a, b, c) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".7" stop-color="${b}"/><stop offset="1" stop-color="${c || b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
const merlons = (x0, x1, y, h, fill) => { let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${300 - y}" fill="${fill}"/>`; for (let x = x0; x < x1; x += 12) s += `<path d="M${x + 1},${y} v-${h} l3,3 l3,-3 v${h} z" fill="${fill}"/>`; return s; };
const water = (y, a, b) => `<rect y="${y}" width="400" height="${300 - y}" fill="${a}"/>` + Array.from({length:14}, (_, i) => `<rect x="${(i * 53) % 380}" y="${y + 8 + (i * 17) % (300 - y - 12)}" width="${18 + (i * 7) % 26}" height="2" rx="1" fill="${b}"/>`).join("");
const horse = (x, y, s, f, flip) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" fill="${f}"><ellipse cx="0" cy="0" rx="14" ry="7" transform="rotate(-25)"/><path d="M8,-8 Q14,-22 20,-26 L25,-22 Q19,-16 14,-4 Z"/><path d="M-8,4 L-12,18 L-9,18 L-4,6 Z M4,3 L6,18 L9,18 L8,2 Z M10,-6 L20,-2 L22,1 L11,-1 Z M12,-9 L22,-12 L23,-9 L13,-5 Z"/><path d="M-13,-2 Q-24,2 -22,12 Q-17,4 -12,2 Z"/></g>`;

/* ───────── 12 мест Москвы. focus — стартовый крупный план [x, y, ширина] в координатах 400×300 ───────── */
const PLACES = [
  {id:"zaryadye", name:"Парящий мост в «Зарядье»", focus:[248, 116, 92],
   opts:["Парящий мост в «Зарядье»", "Пушкинский мост", "Мост «Багратион»", "Бородинский мост"],
   fact:"Мост в парке «Зарядье» открыли в 2017 году. Он выступает над Москвой-рекой, как буква V, и не опирается на воду. С него в романе всё и начинается.",
   svg:() => sky("z1", "#9cc6e8", "#f6dcc0") +
     merlons(0, 400, 158, 9, "#a8443a") + `<rect x="54" y="98" width="34" height="60" fill="#a8443a"/><path d="M50,98 L71,52 L92,98 Z" fill="#7a2f28"/>${star(71, 48, 6, "#c43a3a", "#e3b84e")}` +
     onion(150, 126, 22, 28, "#3f8a5a") + onion(170, 118, 24, 32, "#d8a33c") + onion(190, 128, 20, 26, "#4b76b9") + `<rect x="138" y="126" width="64" height="32" fill="#b9564c"/>` +
     water(190, "#5f86a8", "rgba(255,255,255,.35)") +
     `<path d="M-10,212 L318,152 Q326,151 326,158 L-10,252 Z" fill="#d9cdb8"/><path d="M-10,212 L318,152 L318,158 L-10,222 Z" fill="#b9ab95"/>
      <path d="M-10,212 L318,152 L318,128 Q324,127 326,131 L326,158 L318,152 L-10,212 L-10,186 Z" fill="rgba(210,236,255,.55)" stroke="#8fb8d8" stroke-width="1.5"/>
      ${Array.from({length:18}, (_, i) => { const x = i * 18; return `<line x1="${x}" y1="${210 - x * .18}" x2="${x}" y2="${184 - x * .17}" stroke="#8fb8d8" stroke-width="1"/>`; }).join("")}
      <circle cx="262" cy="148" r="3" fill="#2c2c34"/><rect x="259.5" y="150" width="5" height="13" rx="2" fill="#c0392b"/><circle cx="276" cy="145" r="3" fill="#2c2c34"/><rect x="273.5" y="147" width="5" height="13" rx="2" fill="#2e5a8a"/>`},
  {id:"basil", name:"Собор Василия Блаженного", focus:[84, 90, 70],
   opts:["Собор Василия Блаженного", "Храм Христа Спасителя", "Казанский собор", "Новодевичий монастырь"],
   fact:"Покровский собор построили в 1555–1561 годах по приказу Ивана Грозного в честь взятия Казани. У каждого купола свой узор. В романе Наталья видит его с Парящего моста.",
   svg:() => sky("b1", "#8fbde4", "#e8eef4") + `<defs>
      <pattern id="b2" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><rect width="12" height="12" fill="#c8342e"/><rect width="6" height="12" fill="#2e8a4e"/></pattern>
      <pattern id="b3" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="12" height="10" fill="#2e8a4e"/><path d="M0,10 L6,2 L12,10 Z" fill="#e3b84e"/></pattern>
      <pattern id="b4" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width="10" height="10" fill="#f2f0e6"/><rect width="5" height="10" fill="#2f5aa8"/></pattern>
      <pattern id="b5" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#e8c34a"/><circle cx="5" cy="5" r="3" fill="#3f8a5a"/></pattern></defs>
      <rect y="258" width="400" height="42" fill="#9a958e"/>
      <path d="M182,152 L200,46 L218,152 Z" fill="#b9463e"/><path d="M190,152 L200,60 L210,152 Z" fill="none" stroke="#f2eadc" stroke-width="2" stroke-dasharray="6 8"/>${onion(200, 50, 14, 16, "#e3b84e")}${cross(200, 34, 6)}
      <rect x="70" y="168" width="260" height="92" fill="#b9463e"/><rect x="70" y="168" width="260" height="6" fill="#f2eadc"/>
      ${[100, 140, 180, 220, 260, 300].map(x => `<path d="M${x - 12},260 v-36 a12,12 0 0 1 24,0 v36 z" fill="#8a2f2a"/>`).join("")}
      ${[[118, 148, 46, 54, "url(#b2)"], [156, 124, 44, 56, "url(#b3)"], [244, 124, 44, 56, "url(#b4)"], [282, 148, 46, 54, "url(#b5)"], [90, 174, 32, 36, "url(#b4)"], [310, 174, 32, 36, "url(#b2)"]].map(([x, by, w, h, f]) =>
        `<rect x="${x - w * .32}" y="${by}" width="${w * .64}" height="${174 - by + 4}" fill="#c9554a"/><rect x="${x - w * .32}" y="${by}" width="${w * .64}" height="4" fill="#f2eadc"/>` + onion(x, by, w, h, f, "rgba(0,0,0,.12)") + onion(x, by - h + 2, 8, 9, "#e3b84e") + cross(x, by - h - 6, 4.5)).join("")}`},
  {id:"spasskaya", name:"Спасская башня Кремля", focus:[166, 90, 68],
   opts:["Спасская башня Кремля", "Сухарева башня", "Боровицкая башня", "Исторический музей"],
   fact:"Главная башня Кремля с курантами. Рубиновая звезда на её шатре светится по ночам, а куранты слышно на всей Красной площади.",
   svg:() => sky("s1", "#2c3e6e", "#c9a7c2", "#f3d6c0") +
     merlons(0, 168, 200, 10, "#a33a32") + merlons(232, 400, 200, 10, "#a33a32") +
     `<rect x="158" y="140" width="84" height="160" fill="#b4433a"/><path d="M186,300 v-50 a14,14 0 0 1 28,0 v50 z" fill="#4a1c18"/>
      <rect x="158" y="140" width="84" height="5" fill="#f2eadc"/><rect x="168" y="94" width="64" height="48" fill="#b84a40"/><rect x="168" y="94" width="64" height="4" fill="#f2eadc"/>
      <circle cx="200" cy="118" r="18" fill="#1d2f5a" stroke="#e3b84e" stroke-width="3"/>${Array.from({length:12}, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${200 + Math.cos(a) * 12}" y1="${118 + Math.sin(a) * 12}" x2="${200 + Math.cos(a) * 15.5}" y2="${118 + Math.sin(a) * 15.5}" stroke="#e3b84e" stroke-width="2"/>`; }).join("")}
      <line x1="200" y1="118" x2="200" y2="106" stroke="#e3b84e" stroke-width="2.4" stroke-linecap="round"/><line x1="200" y1="118" x2="208" y2="122" stroke="#e3b84e" stroke-width="2.4" stroke-linecap="round"/>
      ${[164, 236].map(x => `<rect x="${x - 4}" y="78" width="8" height="18" fill="#f2eadc"/><path d="M${x - 5},78 L${x},64 L${x + 5},78 Z" fill="#2f6b4a"/>`).join("")}
      <rect x="178" y="70" width="44" height="26" fill="#b84a40"/><rect x="178" y="70" width="44" height="3" fill="#f2eadc"/>
      <path d="M180,72 L200,22 L220,72 Z" fill="#2f6b4a"/><path d="M180,72 L220,72" stroke="#e3b84e" stroke-width="2"/>${star(200, 15, 10, "#c8202a", "#e3b84e")}`},
  {id:"patriarshy", name:"Патриарший мост", focus:[30, 140, 62],
   opts:["Патриарший мост", "Крымский мост", "Большой Каменный мост", "Москворецкий мост"],
   fact:"Пешеходный мост ведёт от храма Христа Спасителя к Берсеневской набережной. Его открыли в 2004 году. В романе здесь происходит «Поцелуй на Патриаршем мосту».",
   svg:() => sky("p1", "#f2b48a", "#f8dcc0", "#e9c6a8") +
     `<rect x="226" y="118" width="128" height="84" fill="#f4f0e8"/><rect x="266" y="92" width="48" height="28" fill="#efe9de"/>
      <path d="M262,94 Q290,40 318,94 Z" fill="#e3b84e"/>${onion(290, 54, 10, 12, "#e3b84e")}${cross(290, 42, 5)}
      ${[236, 344].map(x => `<rect x="${x - 7}" y="104" width="14" height="16" fill="#efe9de"/><path d="M${x - 8},106 Q${x},84 ${x + 8},106 Z" fill="#e3b84e"/>${cross(x, 90, 3)}`).join("")}
      ${[244, 270, 296, 322].map(x => `<path d="M${x},202 v-40 a8,8 0 0 1 16,0 v40" fill="none" stroke="#d8cfbf" stroke-width="2"/>`).join("")}` +
     water(214, "#7a8fb0", "rgba(255,230,200,.45)") +
     `<rect x="0" y="198" width="400" height="12" fill="#5c6a66"/><rect x="0" y="190" width="400" height="3" fill="#3d4744"/>${Array.from({length:40}, (_, i) => `<rect x="${i * 10 + 2}" y="190" width="2" height="8" fill="#3d4744"/>`).join("")}
      ${[[0, 140], [140, 270], [270, 400]].map(([a, b]) => `<path d="M${a},208 Q${(a + b) / 2},262 ${b},208" fill="none" stroke="#5c6a66" stroke-width="6"/>${Array.from({length:6}, (_, i) => { const x = a + (b - a) * (i + 1) / 7, t = (x - a) / (b - a), y = 208 + 4 * 54 * t * (1 - t) * .5 * 2 / 2; return `<line x1="${x}" y1="210" x2="${x}" y2="${y}" stroke="#5c6a66" stroke-width="2"/>`; }).join("")}`).join("")}
      ${[60, 200, 340].map(x => `<rect x="${x - 2.5}" y="150" width="5" height="40" fill="#2f3634"/><path d="M${x - 16},158 Q${x},146 ${x + 16},158" fill="none" stroke="#2f3634" stroke-width="2.4"/>
        ${[x - 16, x, x + 16].map((lx, k) => `<circle cx="${lx}" cy="${k === 1 ? 144 : 160}" r="5" fill="#fff1c4" stroke="#2f3634" stroke-width="1.5"/>`).join("")}`).join("")}`},
  {id:"kotel", name:"Высотка на Котельнической набережной", focus:[166, 4, 68],
   opts:["Высотка на Котельнической набережной", "Гостиница «Украина»", "Здание МИД на Смоленской", "Главное здание МГУ"],
   fact:"Одна из семи сталинских высоток. Её достроили в 1952 году там, где Яуза впадает в Москву-реку. В романе есть глава «Крыша на Котельнической».",
   svg:() => sky("k1", "#c8a3c8", "#f2c9b0", "#f6dcc4") +
     `<rect x="60" y="160" width="100" height="84" fill="#d9c8a8"/><rect x="240" y="160" width="100" height="84" fill="#d9c8a8"/>
      ${[70, 330].map(x => `<rect x="${x - 10}" y="132" width="20" height="30" fill="#e4d5b8"/><path d="M${x - 10},132 L${x},104 L${x + 10},132 Z" fill="#cdb893"/><line x1="${x}" y1="104" x2="${x}" y2="88" stroke="#e3b84e" stroke-width="2"/>`).join("")}
      <rect x="156" y="118" width="88" height="126" fill="#e4d5b8"/><rect x="168" y="88" width="64" height="32" fill="#e9dcc2"/><rect x="180" y="66" width="40" height="24" fill="#eee2ca"/><rect x="189" y="50" width="22" height="18" fill="#f2e8d4"/>
      ${[[168, 88, 64], [180, 66, 40], [189, 50, 22], [156, 118, 88]].map(([x, y, w]) => `<rect x="${x - 2}" y="${y}" width="${w + 4}" height="3" fill="#bfa880"/>${[x, x + w - 6].map(px => `<rect x="${px}" y="${y - 8}" width="6" height="8" fill="#e9dcc2"/><path d="M${px},${y - 8} L${px + 3},${y - 14} L${px + 6},${y - 8} Z" fill="#cdb893"/>`).join("")}`).join("")}
      <path d="M196,50 L200,12 L204,50 Z" fill="#e3b84e"/>${star(200, 10, 6, "#c8202a", "#e3b84e")}
      ${windows(164, 126, 10, 9, 8, 13, 4, 7, "#8a7a63")}${windows(66, 168, 12, 6, 8, 12, 4, 6, "#8a7a63")}${windows(246, 168, 12, 6, 8, 12, 4, 6, "#8a7a63")}${windows(174, 96, 7, 2, 8, 12, 4, 6, "#8a7a63")}` +
     water(244, "#7b8fb0", "rgba(255,220,200,.4)")},
  {id:"pashkov", name:"Дом Пашкова", focus:[166, 58, 68],
   opts:["Дом Пашкова", "Большой театр", "Усадьба Кусково", "Царицыно"],
   fact:"Дворец конца XVIII века стоит на холме напротив Кремля. Сегодня это часть Российской государственной библиотеки. В романе есть глава «Бельведер», а с этого бельведера на крыше виден Кремль.",
   svg:() => sky("h1", "#a9cdea", "#eef2f2") +
     `<path d="M0,240 Q200,196 400,240 L400,300 L0,300 Z" fill="#7aa36a"/><path d="M0,262 Q200,232 400,262 L400,300 L0,300 Z" fill="#5f8a55"/>
      <rect x="88" y="168" width="64" height="54" fill="#f4f1ea"/><rect x="248" y="168" width="64" height="54" fill="#f4f1ea"/>
      ${[[70, 160], [330, 160]].map(([x, y]) => `<rect x="${x - 20}" y="${y}" width="40" height="62" fill="#f8f6f0"/><path d="M${x - 22},${y} L${x},${y - 14} L${x + 22},${y} Z" fill="#ece8de"/>${[x - 12, x - 4, x + 4, x + 12].map(c => `<rect x="${c - 1.5}" y="${y + 4}" width="3" height="50" fill="#e0dbcf"/>`).join("")}`).join("")}
      <rect x="148" y="128" width="104" height="94" fill="#f8f6f0"/><path d="M146,140 L200,112 L254,140 Z" fill="#ece8de"/><path d="M146,140 L254,140" stroke="#d6d0c2" stroke-width="2"/>
      ${[164, 186, 214, 236].map(c => `<rect x="${c - 3}" y="142" width="6" height="74" fill="#e4dfd3"/>`).join("")}
      ${windows(96, 178, 4, 2, 14, 20, 7, 12, "#8aa0b4")}${windows(256, 178, 4, 2, 14, 20, 7, 12, "#8aa0b4")}
      <rect x="178" y="88" width="44" height="26" fill="#f8f6f0"/>${[182, 190, 198, 206, 214].map(c => `<rect x="${c}" y="90" width="3" height="22" fill="#dcd6c8"/>`).join("")}
      <rect x="176" y="86" width="48" height="4" fill="#e0dbcf"/><path d="M178,86 Q200,58 222,86 Z" fill="#cfd8dc"/><line x1="200" y1="66" x2="200" y2="56" stroke="#9aa6aa" stroke-width="2"/>
      <rect x="0" y="262" width="400" height="4" fill="#e8e2d4"/>${Array.from({length:30}, (_, i) => `<rect x="${i * 14}" y="252" width="2.5" height="14" fill="#e8e2d4"/>`).join("")}`},
  {id:"sukhareva", name:"Сухарева башня", focus:[160, 24, 80],
   opts:["Сухарева башня", "Меншикова башня", "Боровицкая башня", "Северный речной вокзал"],
   fact:"Башню построили в конце XVII века при Петре I, в ней работала Школа математических и навигацких наук. В 1934 году её снесли, и увидеть её теперь можно только на старых картинках. В романе ей посвящена глава «Сухарева башня».",
   svg:() => sky("u1", "#d9c9a6", "#efe3c8") +
     `<rect y="262" width="400" height="38" fill="#b8a58a"/>
      <rect x="80" y="186" width="240" height="76" fill="#b5463c"/><rect x="80" y="186" width="240" height="5" fill="#f2eadc"/>
      ${[100, 132, 164, 236, 268, 300].map(x => `<path d="M${x - 10},262 v-34 a10,10 0 0 1 20,0 v34 z" fill="#f2eadc"/><path d="M${x - 7},262 v-32 a7,7 0 0 1 14,0 v32 z" fill="#6a2a24"/>`).join("")}
      <path d="M176,262 L184,226 L216,226 L224,262 Z" fill="#e9dcc4"/>
      <rect x="160" y="126" width="80" height="62" fill="#b84a40"/><rect x="160" y="126" width="80" height="4" fill="#f2eadc"/>${windows(168, 138, 4, 2, 18, 22, 10, 14, "#f2eadc")}${windows(170, 140, 4, 2, 18, 22, 6, 10, "#6a2a24")}
      <rect x="172" y="88" width="56" height="40" fill="#bc5046"/><rect x="172" y="88" width="56" height="4" fill="#f2eadc"/>
      <circle cx="200" cy="108" r="11" fill="#f4efe0" stroke="#3a2a20" stroke-width="1.5"/><line x1="200" y1="108" x2="200" y2="100" stroke="#3a2a20" stroke-width="1.6"/><line x1="200" y1="108" x2="205" y2="110" stroke="#3a2a20" stroke-width="1.6"/>
      <rect x="182" y="66" width="36" height="24" fill="#c0564b"/><rect x="182" y="66" width="36" height="3" fill="#f2eadc"/>
      <path d="M184,68 L200,26 L216,68 Z" fill="#3f6b4f"/><g fill="#d9a83a"><path d="M200,26 l-7,-6 l4,-1 l3,-5 l3,5 l4,1 z"/><circle cx="200" cy="15" r="2.4"/></g>`},
  {id:"luzhkov", name:"Лужков мост и «деревья любви»", focus:[96, 116, 72],
   opts:["Лужков мост и «деревья любви»", "Патриарший мост", "Пушкинский мост", "Андреевский мост"],
   fact:"Пешеходный мост через Водоотводный канал. Молодожёны вешают замки на его металлические «деревья любви». В романе есть главы «Замок на Лужковом мосту» и «Открытый замок».",
   svg:() => { const cols = ["#d8433a", "#e3b84e", "#3f7fbf", "#4caf6a", "#e07ab0", "#f08a2a", "#9a6ad6", "#c0c4c8"]; let locks = "";
     const tree = (x, s) => { let t = `<g stroke="#2b2b30" stroke-linecap="round" fill="none"><path d="M${x},226 L${x},${226 - 100 * s}" stroke-width="${6 * s}"/>`;
       const br = [[-1, .55, .9], [1, .62, .85], [-1, .82, .7], [1, .9, .6], [0, 1, .5]];
       for (const [d, h, l] of br) { const y = 226 - 100 * s * h, ex = x + d * 40 * s * l, ey = y - 24 * s * l; t += `<path d="M${x},${y} Q${(x + ex) / 2},${y - 4} ${ex},${ey}" stroke-width="${3 * s}"/>`;
         for (let k = 0; k < 7; k++) { const u = (k + 1) / 8, lx = x + (ex - x) * u + (k % 2 ? 4 : -3), ly = y + (ey - y) * u + (k % 3) * 3 + 2; locks += `<g><path d="M${lx - 2.6},${ly} v-3 a2.6,2.6 0 0 1 5.2,0 v3" fill="none" stroke="#777" stroke-width="1.2"/><rect x="${lx - 4}" y="${ly}" width="8" height="7" rx="1.6" fill="${cols[(k + x) % cols.length]}"/></g>`; } }
       return t + "</g>"; };
     return sky("l1", "#9ec3e4", "#f0e6d8") +
       `<rect x="0" y="150" width="70" height="80" fill="#e8d8b8"/><rect x="330" y="140" width="70" height="90" fill="#e8c8b0"/>${onion(370, 140, 20, 24, "#3f6b4f")}${cross(370, 116, 4)}${windows(8, 162, 4, 3, 16, 20, 8, 10, "#8aa0b4")}` +
       water(236, "#6f8cab", "rgba(255,255,255,.35)") +
       `<rect x="0" y="222" width="400" height="14" fill="#7a7d80"/><rect x="0" y="210" width="400" height="3" fill="#3a3c40"/>${Array.from({length:40}, (_, i) => `<rect x="${i * 10}" y="210" width="2" height="12" fill="#3a3c40"/>`).join("")}` +
       tree(120, 1.1) + tree(280, .95) + tree(200, .7) + locks; }},
  {id:"city", name:"Москва-Сити", focus:[108, 86, 68],
   opts:["Москва-Сити", "Новый Арбат", "Ленинский проспект", "Остров Мечты"],
   fact:"Деловой квартал на Пресненской набережной. Башня «Эволюция» закручена спиралью, а к Сити через реку ведёт крытый мост «Багратион». Сити мелькает и в романе.",
   svg:() => sky("c1", "#5f9ad6", "#bcd8ef", "#e6eef4") +
     `<defs><linearGradient id="c2" x1="0" x2="1"><stop offset="0" stop-color="#7fb0d8"/><stop offset=".5" stop-color="#c6e0f2"/><stop offset="1" stop-color="#5d8fbd"/></linearGradient>
      <linearGradient id="c3" x1="0" x2="1"><stop offset="0" stop-color="#b8894a"/><stop offset=".5" stop-color="#e8c890"/><stop offset="1" stop-color="#a87a40"/></linearGradient></defs>
      <rect x="40" y="120" width="40" height="120" fill="#6d8fb0"/><rect x="300" y="110" width="44" height="130" fill="#7fa2c4"/><rect x="340" y="140" width="36" height="100" fill="#5d7f9f"/>
      ${Array.from({length:14}, (_, i) => `<path d="M${118 + (i % 2) * 6},${236 - i * 11} h${34} l${i % 2 ? -6 : 6},-11 h-34 z" fill="${i % 2 ? "#9fc6e6" : "#6f9fca"}"/>`).join("")}
      <path d="M210,240 V44 L232,30 L232,240 Z" fill="url(#c2)"/><path d="M232,240 V30 L250,46 V240 Z" fill="#5d8fbd"/><line x1="232" y1="30" x2="232" y2="4" stroke="#cfd8e0" stroke-width="2"/>
      <rect x="182" y="96" width="26" height="144" fill="url(#c2)"/><rect x="262" y="70" width="32" height="170" fill="url(#c3)"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => `<line x1="182" y1="${100 + i * 11}" x2="208" y2="${100 + i * 11}" stroke="rgba(255,255,255,.35)"/><line x1="262" y1="${76 + i * 13}" x2="294" y2="${76 + i * 13}" stroke="rgba(255,255,255,.3)"/>`).join("")}` +
     water(240, "#5f7f9f", "rgba(255,255,255,.4)") +
     `<rect x="0" y="230" width="400" height="12" fill="#c9d3dc"/><path d="M60,232 Q200,206 340,232 Z" fill="rgba(190,225,245,.75)" stroke="#9fb6c8"/><rect x="0" y="242" width="400" height="4" fill="#8a9aa8"/>`},
  {id:"mgu", name:"Главное здание МГУ", focus:[178, 4, 44],
   opts:["Главное здание МГУ", "Высотка на Котельнической набережной", "Гостиница «Ленинградская»", "Дом на Кудринской площади"],
   fact:"Главное здание МГУ на Воробьёвых горах достроили в 1953 году. Это самая высокая из семи сталинских высоток.",
   svg:() => sky("m1", "#7fb4e2", "#e4eef6") +
     `<rect y="250" width="400" height="50" fill="#6f9a5c"/>${Array.from({length:16}, (_, i) => `<circle cx="${i * 26 + 8}" cy="${252 - (i % 3) * 3}" r="${12 + (i % 2) * 4}" fill="${i % 2 ? "#4f7f45" : "#5f8f50"}"/>`).join("")}
      <rect x="40" y="170" width="120" height="76" fill="#e6dccb"/><rect x="240" y="170" width="120" height="76" fill="#e6dccb"/>
      ${[86, 314].map(x => `<rect x="${x - 14}" y="128" width="28" height="44" fill="#ede4d4"/><path d="M${x - 14},128 L${x},104 L${x + 14},128 Z" fill="#d8ccb6"/><line x1="${x}" y1="104" x2="${x}" y2="84" stroke="#e3b84e" stroke-width="2.4"/>${star(x, 82, 4, "#e3b84e")}`).join("")}
      <rect x="160" y="104" width="80" height="142" fill="#ede4d4"/><rect x="172" y="80" width="56" height="26" fill="#f0e8da"/><rect x="184" y="62" width="32" height="20" fill="#f4ede0"/>
      <circle cx="200" cy="140" r="11" fill="#f8f4ea" stroke="#b8a480" stroke-width="2"/><line x1="200" y1="140" x2="200" y2="132" stroke="#4a3a2a" stroke-width="1.6"/><line x1="200" y1="140" x2="206" y2="142" stroke="#4a3a2a" stroke-width="1.6"/>
      ${windows(168, 162, 8, 6, 8, 13, 4, 7, "#9a8a70")}${windows(48, 180, 12, 5, 9, 12, 5, 6, "#9a8a70")}${windows(248, 180, 12, 5, 9, 12, 5, 6, "#9a8a70")}
      <path d="M196,62 L200,36 L204,62 Z" fill="#e3b84e"/>
      <circle cx="200" cy="24" r="12" fill="none" stroke="#e3b84e" stroke-width="3.4" stroke-dasharray="3 2"/>${star(200, 24, 8, "#e3b84e", "#b88a2a")}`},
  {id:"ostankino", name:"Останкинская телебашня", focus:[166, 66, 68],
   opts:["Останкинская телебашня", "Шуховская башня", "Башня «Федерация»", "Петербургская телебашня"],
   fact:"Телебашня высотой 540 метров построена в 1967 году. Несколько лет она была самым высоким сооружением в мире. Под самой верхней «тарелкой» работает ресторан «Седьмое небо».",
   svg:() => sky("o1", "#5d93d0", "#c6def0", "#eef3f6") +
     `<rect y="262" width="400" height="38" fill="#6f9a5c"/>${Array.from({length:12}, (_, i) => `<circle cx="${i * 36 + 10}" cy="262" r="${14 + (i % 3) * 4}" fill="#5a8a4c"/>`).join("")}
      <path d="M170,270 L186,224 L214,224 L230,270 Z" fill="#dcd8d2"/>${[176, 190, 204, 218].map(x => `<path d="M${x - 4},270 v-14 a5,5 0 0 1 10,0 v14 z" fill="#8a8782"/>`).join("")}
      <path d="M187,226 L196,104 L204,104 L213,226 Z" fill="#e8e5df"/><path d="M200,226 L200,104 L204,104 L213,226 Z" fill="#cfcac2"/>
      <rect x="194" y="150" width="12" height="4" fill="#bdb8af"/>
      <ellipse cx="200" cy="104" rx="22" ry="6" fill="#d6d2ca"/><rect x="180" y="90" width="40" height="14" rx="4" fill="#3d4a5a"/>${windows(183, 93, 9, 1, 4, 0, 2.6, 8, "#ffe7a8")}<ellipse cx="200" cy="90" rx="22" ry="5" fill="#e8e5df"/>
      <rect x="196" y="40" width="8" height="50" fill="#e8e5df"/>${[44, 54, 64, 74].map(y => `<rect x="196" y="${y}" width="8" height="5" fill="#d23a32"/>`).join("")}
      <rect x="198.5" y="6" width="3" height="36" fill="#cfcac2"/>${[10, 18, 26, 34].map(y => `<rect x="198.5" y="${y}" width="3" height="4" fill="#d23a32"/>`).join("")}`},
  {id:"bolshoi", name:"Большой театр", focus:[160, 52, 80],
   opts:["Большой театр", "Малый театр", "Дом Пашкова", "Пушкинский музей"],
   fact:"Над портиком — квадрига Аполлона работы Петра Клодта. Он же сделал коней Аничкова моста в Петербурге.",
   svg:() => sky("t1", "#9cc4e6", "#f2e6d4") +
     `<rect y="258" width="400" height="42" fill="#a9a29a"/>
      <rect x="60" y="140" width="280" height="118" fill="#efdcae"/>${windows(72, 156, 4, 3, 14, 30, 8, 16, "#8a7a5a")}${windows(278, 156, 4, 3, 14, 30, 8, 16, "#8a7a5a")}
      <rect x="116" y="150" width="168" height="108" fill="#f6eedb"/>${[124, 146, 168, 190, 210, 232, 254, 276].map(c => `<rect x="${c - 4}" y="152" width="8" height="98" fill="#fbf8ef"/><rect x="${c - 5.5}" y="150" width="11" height="4" fill="#e6dcc4"/>`).join("")}
      <rect x="112" y="250" width="176" height="8" fill="#e6dcc4"/><rect x="110" y="140" width="180" height="10" fill="#fbf8ef"/>
      <path d="M110,140 L200,104 L290,140 Z" fill="#fbf8ef"/><path d="M126,136 L200,110 L274,136 Z" fill="#efe6d0"/>
      <g transform="translate(0,-4)">${horse(176, 96, .9, "#4a3a2a", true)}${horse(188, 94, .95, "#3e3024", true)}${horse(212, 94, .95, "#3e3024")}${horse(224, 96, .9, "#4a3a2a")}
      <path d="M190,104 Q200,90 210,104 Z" fill="#3e3024"/><rect x="197" y="70" width="6" height="22" rx="3" fill="#3e3024"/><circle cx="200" cy="66" r="5" fill="#3e3024"/><path d="M203,74 L214,62" stroke="#3e3024" stroke-width="3" stroke-linecap="round"/></g>`}
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
