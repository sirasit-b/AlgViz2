# 🤝 คู่มือร่วมพัฒนา AlgoViz

ยินดีต้อนรับสู่ทีม AlgoViz! 🎉 เอกสารนี้สำหรับ **น้อง ๆ ฝึกงานและผู้ร่วมพัฒนาทุกคน** —
อ่านให้จบก่อนเริ่มเขียนโค้ด จะช่วยให้ทำงานถูกทางตั้งแต่ commit แรก

> อ่าน [README.md](README.md) คู่กันด้วยนะ — ตัวนี้เน้น **"ทำงานร่วมกันยังไง"** ส่วน README เน้น **"โปรเจกต์นี้คืออะไร"**

---

## 🧠 กฎเหล็กข้อเดียวที่ต้องจำ

> **`src/` คือต้นทางเดียว (source of truth) — แก้ที่นี่เท่านั้น**
> ไฟล์ใน `assets/`, `config/topics.php`, `preview.html` เป็นของที่ **build ออกมา (generated)** → **ห้ามแก้ด้วยมือ**
> ทุกครั้งที่แก้ `src/` ต้องรัน `node build/build.mjs` ใหม่เสมอ

แก้ผิดที่ = งานหาย เพราะ build ครั้งถัดไปจะเขียนทับไฟล์ที่แก้มือทันที

| แก้ตรงนี้ ✅ | อย่าแตะ (build ให้เอง) ❌ |
|---|---|
| `src/core.head.html` (CSS / design system) | `assets/algoviz.css` |
| `src/core.body.html` (markup + engine + หัวข้อ CS) | `assets/algoviz.js`, `assets/app.html` |
| `src/renderers/*.js` (renderer family เสริม) | `config/topics.php` |
| `src/content/**/*.js` (หัวข้อรายสาขา) | `preview.html` |
| `config/taxonomy.php`, `index.php`, `partials/*.php` (เขียนมือได้) | |

---

## 🛠️ เตรียมเครื่อง (ครั้งเดียว)

- **PHP 8+** — สำหรับเสิร์ฟหน้าเว็บ ([ดาวน์โหลด](https://www.php.net/downloads))
- **Node 18+** — ใช้เฉพาะตอน build (สคริปต์ build ไม่มี dependency ต้อง `npm install`)

เช็กว่าพร้อม:

```bash
php --version    # ต้องขึ้น 8.x
node --version   # ต้องขึ้น v18 ขึ้นไป
```

---

## 🚀 รันบนเครื่องตัวเอง

```bash
# 1) build assets จาก src/  (ต้องรันทุกครั้งหลังแก้ src/)
node build/build.mjs

# 2) รัน dev server (pretty URL ทำงานผ่าน router.php)
php -S 127.0.0.1:8088 -t . router.php

# 3) เปิดเบราว์เซอร์
#    http://127.0.0.1:8088/            → catalog (หน้ารวมหัวข้อ)
#    http://127.0.0.1:8088/quick-sort  → หน้า visualizer
```

> อยากดูเร็ว ๆ ไม่ต้องมี PHP? เปิดไฟล์ **`preview.html`** ตรง ๆ ได้เลย (ใช้ hash routing แทน)
> — เหมาะกับเช็กหน้าตาไว ๆ แต่ URL/SEO จริงต้องทดสอบผ่าน `php -S`

---

## 🌿 Workflow การทำงานเป็นทีม (Branch)

เราแยก branch เป็น 2 ชั้น เพื่อให้ `main` เสถียรตลอด:

```
main   ← โค้ดที่เสถียร / พร้อม deploy (production)  ── อย่า push ตรง ๆ
  ▲
  │  merge เมื่อ dev นิ่งและทดสอบผ่านแล้ว
  │
dev    ← branch รวมงาน / ทดสอบ (integration)
  ▲
  │  เปิด Pull Request เข้า dev
  │
feat/<ชื่อ-งาน>   ← แต่ละคนแตก branch ของตัวเองจาก dev มาทำงาน
```

**ขั้นตอนสำหรับผู้ร่วมพัฒนาแต่ละคน:**

```bash
# 1) อัปเดต dev ให้ล่าสุดก่อนเริ่มงานเสมอ
git checkout dev
git pull origin dev

# 2) แตก branch ของตัวเองจาก dev
git checkout -b feat/insertion-sort      # ตั้งชื่อสื่อความ: feat/... fix/... docs/...

# 3) แก้โค้ดใน src/ → build → ทดสอบในเบราว์เซอร์

# 4) commit (ดู checklist ด้านล่างก่อน commit)
git add -A
git commit -m "feat: เพิ่ม visualizer สำหรับ Insertion Sort"

# 5) push branch ตัวเองขึ้น origin แล้วเปิด Pull Request → เข้า dev
git push -u origin feat/insertion-sort
```

**ชื่อ branch แนะนำ:** `feat/<ชื่อ>` (ฟีเจอร์ใหม่) · `fix/<ชื่อ>` (แก้บั๊ก) · `docs/<ชื่อ>` (เอกสาร)

**รูปแบบ commit message แนะนำ:** `feat: …` · `fix: …` · `docs: …` · `refactor: …` · `style: …`
(เขียนหัวข้อสั้น ๆ เป็นภาษาไทยหรืออังกฤษก็ได้ ขอให้สื่อความว่า "ทำอะไร")

> ❗ **ห้าม push ตรงเข้า `main`** — งานทุกอย่างผ่าน `dev` และ Pull Request ก่อนเสมอ

---

## ✅ Checklist ก่อนเปิด Pull Request

- [ ] แก้เฉพาะไฟล์ใน `src/` (และไฟล์ PHP ที่เขียนมือได้) — **ไม่แก้ `assets/*`, `config/topics.php`, `preview.html` ด้วยมือ**
- [ ] รัน `node build/build.mjs` แล้ว (build ต้อง **ผ่าน** ไม่มี error)
- [ ] commit ไฟล์ที่ build ออกมาไปด้วย (โปรเจกต์นี้ commit ผลลัพธ์ build ตั้งใจ เพื่อให้ clone แล้ว deploy ได้เลย)
- [ ] `git status` สะอาดหลัง build (ถ้ายังมีไฟล์ค้าง แปลว่าลืม commit ผล build — `git add -A` แล้ว commit)
- [ ] ทดสอบในเบราว์เซอร์จริงผ่าน `php -S …` — เล่น Play/Pause, เดินสเต็ป ◀ ▶, ลองใส่ข้อมูลเอง แล้วทำงานถูกต้อง
- [ ] หัวข้อใหม่โผล่ในหน้า catalog และเปิดผ่าน URL ของตัวเองได้ (เช่น `/my-algo`)

---

## ➕ วิธีเพิ่ม Visualizer หัวข้อใหม่

### 1) สร้างไฟล์ `.js` ใน `src/content/<domain>/`

`<domain>` = `cs` (Computer Science) · `cpe` (Computer Engineering) · `se` (Software Engineering)
เช่น `src/content/cs/algorithms.js` (จะแยกกี่ไฟล์ก็ได้ build จะรวมให้เอง)

### 2) ลงทะเบียนโมดูลด้วย `AlgoViz.register({...})`

```js
AlgoViz.register({
  id: 'my-algo',            // ← ใช้เป็น URL ด้วย (/my-algo) ต้องไม่ซ้ำใคร, ใช้ a-z 0-9 -
  cat: 'sort',              // ← field id (ดูค่าที่ใช้ได้ด้านล่าง)
  nameTh: 'ชื่อภาษาไทย', nameEn: 'My Algorithm',
  difficulty: 2,            // 1 = ง่าย, 2 = กลาง, 3 = ยาก
  time: 'O(n log n)', space: 'O(1)',
  renderer: 'bars',         // ← ตัววาดภาพ (ดูรายชื่อด้านล่าง)
  glyph: 'bars',            // ไอคอนบนการ์ด (มักใช้ค่าเดียวกับ renderer)
  blurb: 'คำอธิบายสั้น ๆ บนการ์ดในหน้า catalog',
  explain: 'คำอธิบายยาวใต้ภาพ (รองรับ <b>HTML</b>)',
  note: 'ข้อสังเกต/เกร็ดเพิ่มเติม',
  pseudocode: ['บรรทัดที่ 1', 'บรรทัดที่ 2', '…'],
  mountControls: function (host, ctx) {
    // host = กล่อง DOM สำหรับใส่ปุ่ม/อินพุตของหัวข้อนี้
    // สร้าง frames[] (สแนปช็อตของสถานะทีละสเต็ป) แล้วส่งเข้า player:
    var frames = [
      { note: 'อธิบายสเต็ปนี้', line: 0, stats: { 'เปรียบเทียบ': 0 } /* + state เฉพาะ renderer */ },
      // …
    ];
    ctx.load(frames);   // โหลดเฟรมเข้า Player กลาง (Play/Pause/เดินสเต็ปได้ฟรี)
  }
});
```

แต่ละ `frame` = สแนปช็อตหนึ่งสเต็ป มี key ร่วม `note` (คำอธิบาย), `line` (บรรทัด pseudocode ที่ไฮไลต์),
`stats` (ตัวเลขสถิติ) + **state เฉพาะของ renderer** (เช่น `bars` ต้องมี array ของค่าที่จะวาด)
ดูตัวอย่างจริงเต็ม ๆ ได้ที่ [src/content/cpe/networking.js](src/content/cpe/networking.js) และหัวข้อ CS ใน `src/core.body.html`

### 3) รัน build แล้วทดสอบ

```bash
node build/build.mjs        # เมนู, URL/SEO และ config/topics.php อัปเดตให้อัตโนมัติ
php -S 127.0.0.1:8088 -t . router.php
```

หัวข้อจะโผล่ในหน้า catalog + มี URL/SEO ของตัวเองทันที **ไม่ต้อง wiring เพิ่ม**

### ค่าที่ใช้ได้

**`cat` (field id — ต้องตรงกับ `config/taxonomy.php`):**

| domain | cat ที่ใช้ได้ |
|---|---|
| `cs`  | `sort` · `search` · `linear` · `tree` · `graph` · `recur` |
| `cpe` | `net` |

**`renderer` (ตัววาดภาพที่มีให้):**

`bars` · `array` · `stack` · `queue` · `linkedlist` · `hash` · `tree` · `graph` · `hanoi` · `calltree`
(core, อยู่ใน `src/core.body.html`) และ `sequence` · `statemachine` (net, อยู่ใน `src/renderers/net.js`)

> **อยากเพิ่มสาขา/หมวดใหม่ (เช่นเปิดสาย `se`)?** ต้องเพิ่ม 2 ที่ให้ตรงกัน:
> เพิ่ม field ใน `CATS` ที่ [src/core.body.html](src/core.body.html) **และ** ใน `fields` ที่ [config/taxonomy.php](config/taxonomy.php)
>
> **อยากเพิ่มวิธีวาดภาพแบบใหม่?** เพิ่ม `RENDERERS.<ชื่อ> = function(){…}` ใน `src/renderers/` (ไฟล์ใหม่ก็ได้ build รวมให้)

---

## 🙋 ติดปัญหา?

- หัวข้อไม่โผล่ในเมนู → ลืมรัน `node build/build.mjs` หรือ `id`/`cat` สะกดผิด
- แก้แล้วหน้าไม่เปลี่ยน → hard refresh (Ctrl/Cmd+Shift+R) หรือเช็กว่า build แล้วจริง
- ถามพี่ในทีมได้เสมอ หรือเปิด Issue ไว้ก็ได้ 🙌

ขอบคุณที่มาร่วมสร้างเครื่องมือช่วยให้คนไทย "เห็นภาพ" อัลกอริทึมกันนะ — ทีม **borntoDev** 💛
