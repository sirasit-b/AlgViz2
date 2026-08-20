# AlgoViz · เห็นภาพอัลกอริทึม

> เว็บ **Visualize อัลกอริทึมและโครงสร้างข้อมูล** แบบ interactive เล่นได้จริง เดินทีละสเต็ป
> พร้อม Pseudocode และ Complexity อธิบายข้าง ๆ ทุกหัวข้อ — ครอบคลุมสาย **CS / CPE / SE**
> สไตล์ VisuAlgo แต่ดีไซน์ในแบบ **borntoDev** (ธีมดำ–ทอง)

<p>
  <img alt="stack" src="https://img.shields.io/badge/stack-Vanilla%20JS%20%2B%20PHP-FFC000">
  <img alt="deps" src="https://img.shields.io/badge/runtime%20deps-0-30D158">
  <img alt="topics" src="https://img.shields.io/badge/topics-23-0A84FF">
  <img alt="by" src="https://img.shields.io/badge/by-borntoDev-A86BFF">
</p>

เขียนด้วย **HTML / CSS / Vanilla JS** ล้วน ๆ เสริมด้วย **[anime.js](https://animejs.com/)** (motion)
และ **[three.js](https://threejs.org/)** (ฉากหลังหน้า catalog เท่านั้น) เสิร์ฟเป็นหน้า **PHP** เดี่ยว ๆ
พร้อม pretty URL และ SEO รายหัวข้อ — **ไม่มี framework ไม่มี bundler ไม่มี npm dependency**

---

## 📑 สารบัญ

- [จุดเด่น](#-จุดเด่น) · [หัวข้อที่มี](#-หัวข้อที่มี-23) · [เริ่มต้นใช้งาน](#-เริ่มต้นใช้งาน)
- [โครงสร้างโปรเจกต์](#️-โครงสร้างโปรเจกต์) · [สถาปัตยกรรม](#-สถาปัตยกรรมโดยย่อ) · [เพิ่มหัวข้อใหม่](#-เพิ่ม-visualizer-ใหม่) · [Deploy](#-deploy)

---

## ✨ จุดเด่น

| | |
|---|---|
| ▶️ **เล่นได้จริงทุกหัวข้อ** | Play / Pause, เดินทีละสเต็ป (◀ ▶), scrubber, ปรับความเร็ว, คีย์ลัด (`Space`, `←`/`→`) |
| ⌨️ **ใส่ข้อมูลของตัวเองได้** | สุ่ม / กรอกเอง / ทำ operation (insert, search, delete, enqueue…) แล้วดูอนิเมชันทันที |
| 📖 **อธิบายครบข้าง ๆ ภาพ** | Pseudocode ไฮไลต์ตามสเต็ป + คำอธิบายภาษาไทย + Time / Space Complexity ทุกหัวข้อ |
| 🗂️ **จัดหมวด 3 ศาสตร์** | CS / CPE / SE → สาขาย่อย → หัวข้อ พร้อมค้นหาและกรองตามระดับความยาก |
| 🔗 **Pretty URL + SEO** | ทุกหัวข้อมี URL / `<title>` / OG / canonical ของตัวเอง (เช่น `/dijkstra`) + สารบัญ `<noscript>` ให้บอตเก็บ |
| 🌐 **ทำงานฝั่ง browser 100%** | cache ง่าย รันได้บนโฮสต์ทั่วไป (LiteSpeed / Apache) และ progressive enhancement — CDN โหลดไม่ทันก็ยังแสดงผลได้ |

---

## 📚 หัวข้อที่มี (23)

### 🖥️ Computer Science (20)

| สาขา (`cat`) | หัวข้อ (URL = `id`) |
|------|--------|
| **การเรียงลำดับ** (`sort`) | `bubble-sort` · `selection-sort` · `insertion-sort` · `merge-sort` · `quick-sort` |
| **การค้นหา** (`search`) | `linear-search` · `binary-search` |
| **โครงสร้างข้อมูลเชิงเส้น** (`linear`) | `stack` · `queue` · `linked-list` · `hash-table` |
| **โครงสร้างข้อมูลแบบต้นไม้** (`tree`) | `bst` · `tree-traversal` · `binary-heap` · `heap-sort` |
| **กราฟและเส้นทาง** (`graph`) | `graph-bfs` · `graph-dfs` · `dijkstra` |
| **การเรียกซ้ำ** (`recur`) | `tower-of-hanoi` · `fibonacci-recursion` (+ Memoization) |

### 🔌 Computer Engineering (3)

| สาขา (`cat`) | หัวข้อ (URL = `id`) |
|------|--------|
| **เครือข่ายคอมพิวเตอร์** (`net`) | `tcp-handshake` · `tcp-states` · `stop-and-wait` |

> 🧩 **Software Engineering** — เตรียมโครง (`se`) ไว้แล้ว: design patterns, git, testing เพิ่มได้แบบ drop-in

---

## 🚀 เริ่มต้นใช้งาน

### 🐳 ทางที่ง่ายที่สุด — Docker (ไม่ต้องลง PHP เอง)

ต้องมี **Docker** อย่างเดียว ได้ **PHP 8.3 + Apache + mod_rewrite** เหมือน production จริง

```bash
docker compose run --rm build     # build assets จาก src/ (ใช้ node ใน container)
docker compose up -d --build      # ยกเว็บขึ้น → http://localhost:8088

docker compose logs -f web        # ดู log
docker compose down               # ปิด
```

โฟลเดอร์นี้ถูก bind mount เข้า `/var/www/html` → **แก้ไฟล์แล้ว refresh เห็นผลทันที ไม่ต้อง rebuild image**
(ถ้าแก้อะไรใน `src/` ให้รัน `docker compose run --rm build` ก่อน)

### 🐘 หรือรันตรง ๆ ด้วย PHP ในเครื่อง

ต้องมี **PHP 8+** (เสิร์ฟ) และ **Node 18+** (เฉพาะตอน build — สคริปต์ build ไม่มี dependency)

```bash
node build/build.mjs                      # 1) build assets จาก src/
php -S 127.0.0.1:8088 -t . router.php     # 2) dev server (pretty URL ผ่าน router.php)
```

### 👀 หรือดูเร็ว ๆ ไม่ต้องมีอะไรเลย

เปิดไฟล์ **`preview.html`** ตรง ๆ ในเบราว์เซอร์ (ใช้ hash routing แทน)
— เหมาะกับเช็กหน้าตาไว ๆ แต่ URL/SEO จริงต้องทดสอบผ่าน PHP

### ลองเปิดดู

| URL | หน้า |
|---|---|
| `http://localhost:8088/` | catalog — รวมทุกหัวข้อ |
| `http://localhost:8088/quick-sort` | visualizer |
| `http://localhost:8088/tcp-handshake` | visualizer (CPE) |

---

## 🗂️ โครงสร้างโปรเจกต์

```
algoviz/
├── index.php            # front controller — routing + per-topic SEO (title/OG/canonical) + 404
├── .htaccess            # rewrite ทุก request ที่ไม่ใช่ไฟล์จริง → index.php
├── router.php           # dev-only: ตัวช่วยรัน php -S (ไม่ต้องอัปขึ้น production)
├── Dockerfile           # dev-only: PHP 8.3 + Apache (mod_rewrite / mod_expires)
├── docker-compose.yml   # dev-only: service `web` (เสิร์ฟ) + `build` (node build)
├── partials/
│   ├── head.php         # <head> ไดนามิก + <link> CSS
│   └── footer.php       # inject window.AV_BASE / AV_INITIAL + CDN + <script> app
├── config/
│   ├── taxonomy.php     # ✍️ ป้ายชื่อ domain / field (แก้มือ)
│   └── topics.php       # ⚙️ metadata ของหัวข้อ — AUTO-GENERATED
├── assets/              # ⚙️ BUILT — อย่าแก้มือ
│   ├── algoviz.css      #    ← src/core.head.html
│   ├── algoviz.js       #    ← engine + renderers + modules
│   └── app.html         #    ← markup ของวิดเจ็ต
├── src/                 # ★ source of truth — แก้ที่นี่เท่านั้น
│   ├── core.head.html   #    CSS ทั้งหมด (design system)
│   ├── core.body.html   #    markup + engine (registry / Player / router / catalog) + หัวข้อสาย CS
│   ├── renderers/       #    renderer family เสริม
│   │   └── net.js       #      sequence (ladder) + statemachine
│   └── content/         #    หัวข้อรายสาขา (แยกกี่ไฟล์ก็ได้)
│       └── cpe/networking.js
├── build/build.mjs      # รวม src/ → assets/ + config/topics.php + preview.html
└── preview.html         # ⚙️ BUILT — standalone (hash routing) ไว้พรีวิวเร็ว ๆ
```

### ⚠️ แก้ตรงไหนได้บ้าง

| แก้ได้ ✅ | อย่าแตะ — build เขียนทับ ❌ |
|---|---|
| `src/**` (CSS, engine, หัวข้อ, renderer) | `assets/algoviz.css`, `assets/algoviz.js`, `assets/app.html` |
| `index.php`, `partials/*.php`, `.htaccess` | `config/topics.php` |
| `config/taxonomy.php` | `preview.html` |

> **กฎเหล็ก:** แก้ `src/` ทุกครั้ง → รัน build ใหม่เสมอ ไม่งั้นหน้าเว็บไม่เปลี่ยน

---

## 🧩 สถาปัตยกรรมโดยย่อ

**Step-generator + Player** — แต่ละหัวข้อสร้าง `frames[]` (สแนปช็อตของสถานะทีละสเต็ป) ล่วงหน้า
แล้วส่งให้ Player กลางเล่น → ได้ play / pause / เดินหน้า / ถอยหลัง / scrub **ฟรีทุกหัวข้อ**
โดยไม่ต้องเขียนเอง · **anime.js** ทำ tween ระหว่างเฟรม

```
AlgoViz.register({…})  →  mountControls()  →  frames[]  →  ctx.load()  →  Player  →  RENDERERS[renderer]
```

- **Renderers** — วาดด้วย SVG/DOM 2D แยกเป็น family
  `core` (bars · array · stack · queue · linkedlist · hash · tree · graph · hanoi · calltree) และ
  `net` (sequence · statemachine) — เพิ่ม family ใหม่ได้ (เช่น `sys` สำหรับ waveform / pipeline)
- **Router** — History API (pretty URL) เมื่อเสิร์ฟด้วย PHP และ fallback เป็น hash เมื่อเปิดแบบ `file://`
- **SEO** — PHP อ่าน `config/topics.php` ตอน request แรกเพื่อเซ็ต `<title>` / OG / canonical ให้ตรงหัวข้อ
  จากนั้น SPA รับช่วงต่อ · asset cache-bust ด้วย `?v=filemtime`
- **Design system** — โทน borntoDev: ดำ `#0A0A0A` + ทอง `#FFC000`, ฟอนต์ Noto Sans Thai + JetBrains Mono, สีประจำแต่ละ field

---

## ➕ เพิ่ม Visualizer ใหม่

1. สร้างไฟล์ `.js` ใน `src/content/<domain>/` (`cs` · `cpe` · `se`)
2. ลงทะเบียนโมดูล:

```js
AlgoViz.register({
  id: 'my-algo', cat: 'sort',            // id = URL (/my-algo) · cat = field id (ดู config/taxonomy.php)
  nameTh: 'ชื่อไทย', nameEn: 'My Algorithm',
  difficulty: 2,                          // 1 ง่าย · 2 กลาง · 3 ยาก
  time: 'O(n log n)', space: 'O(1)',
  renderer: 'bars',                       // ดูรายชื่อ renderer ในหัวข้อสถาปัตยกรรม
  blurb: 'คำอธิบายสั้น ๆ บนการ์ด',
  explain: '…', note: '…',
  pseudocode: ['line 1', 'line 2', '…'],
  mountControls: function (host, ctx) {
    // สร้างปุ่ม/อินพุตลงใน host แล้วส่ง frames เข้า Player
    // frame = { note, line, stats, ...state เฉพาะ renderer }
    ctx.load(frames);
  }
});
```

3. `node build/build.mjs` → เมนู catalog, URL, SEO และ `config/topics.php` อัปเดตให้อัตโนมัติ **ไม่ต้อง wiring เพิ่ม**

> **Single source of truth:** metadata ทุกหัวข้อดึงมาจาก `AlgoViz.register(...)` ในไฟล์ JS โดยตรง
> — `config/topics.php` ถูก generate ให้ ไม่ต้องกรอกซ้ำ

📘 รายละเอียดเต็ม (ค่าที่ใช้ได้, รูปแบบ frame, workflow branch/PR, checklist) → **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## 🌐 Deploy

อัปโฟลเดอร์นี้ขึ้นเว็บเซิร์ฟเวอร์ที่รัน PHP ได้เลย (วางที่ `/algoviz/` หรือ document root ก็ได้)

- **`.htaccess`** จัดการ URL rewrite ให้อัตโนมัติ (รองรับทั้ง **LiteSpeed** และ **Apache**) — ไม่ต้องตั้ง `RewriteBase`
- `index.php` คำนวณ base path จากตำแหน่งไฟล์เอง → ย้ายโฟลเดอร์ได้โดยไม่ต้องแก้โค้ด
- ไฟล์ build (`assets/*`, `config/topics.php`, `preview.html`) ถูก commit ไว้ตั้งใจ → **clone แล้ว deploy ได้เลย**
- ไม่ต้องอัป `router.php`, `Dockerfile`, `docker-compose.yml` ขึ้น production (ใช้เฉพาะตอน dev)

> **LiteSpeed Cache:** หน้านี้เป็น PHP ล้วน cache ทั้งหน้าได้สบาย — แนะนำ *exclude* หน้านี้จาก
> **“Remove Unused CSS (UCSS)”** เพราะ UI ถูกสร้างด้วย JS ตอน runtime (UCSS อาจตัด CSS ที่ยังไม่เห็น)

---

## 🤝 เครดิต

สร้างโดยทีม **[borntoDev](https://www.borntodev.com)** — เพื่อนคู่คิดสาย Tech
เพื่อช่วยให้ผู้เรียนไทย “เห็นภาพ” อัลกอริทึมและโครงสร้างข้อมูลได้ง่ายขึ้น

อยากช่วยพัฒนา? อ่าน **[CONTRIBUTING.md](CONTRIBUTING.md)** ได้เลย 💛

## 📄 License

© borntoDev — ปรับ License ตามการใช้งานจริงได้ตามต้องการ
