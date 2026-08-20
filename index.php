<?php
/* ==========================================================================
   AlgoViz — standalone front controller (pretty URLs + per-topic SEO)
   Route:  /            → catalog
           /<topic-id>  → visualizer (SPA opens it; PHP sets <title>/OG)
   .htaccess sends every non-file request here. Client keeps navigating via
   the History API (see assets/algoviz.js); PHP handles the initial hit + SEO.
   ========================================================================== */
declare(strict_types=1);

function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

$topics = require __DIR__ . '/config/topics.php';
$tax    = require __DIR__ . '/config/taxonomy.php';

/* base path = folder containing index.php ("/algoviz", or "" at doc-root) */
$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
if ($base === '/') $base = '';

/* topic id = path after base */
$reqPath = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$rel = $reqPath;
if ($base !== '' && strpos($rel, $base) === 0) $rel = substr($rel, strlen($base));
$rel = trim($rel, '/');
if ($rel === 'index.php') $rel = '';
$topicId = $rel;

if ($topicId !== '' && !isset($topics[$topicId])) { http_response_code(404); $topicId = ''; }

/* absolute base url for canonical / OG */
$scheme  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host    = $_SERVER['HTTP_HOST'] ?? 'localhost';
$baseUrl = $scheme . '://' . $host . $base;
$ogImage = 'https://www.borntodev.com/wp-content/uploads/2018/09/Black_Yellow_white-12-re.png';
$SITE    = 'DevSpark by BorntoDev';

if ($topicId !== '' && isset($topics[$topicId])) {
  $t         = $topics[$topicId];
  $pageTitle = $t['th'] . ' | ' . $SITE;
  $pageDesc  = $t['blurb'] !== '' ? $t['blurb'] : ('เห็นภาพการทำงานของ ' . $t['en'] . ' ทีละสเต็ป');
  $canonical = $baseUrl . '/' . $topicId;
} else {
  $pageTitle = 'เห็นภาพอัลกอริทึม & โครงสร้างข้อมูล (CS/CPE/SE) | DevSpark by BorntoDev';
  $pageDesc  = 'เว็บ Visualize อัลกอริทึมและโครงสร้างข้อมูล เล่นได้จริง ทีละสเต็ป พร้อม Pseudocode และ Complexity — โดย borntoDev';
  $canonical = $baseUrl . '/';
}

/* cache-bust assets by mtime */
$ASSET_V = max(
  (int) (@filemtime(__DIR__ . '/assets/algoviz.css') ?: 0),
  (int) (@filemtime(__DIR__ . '/assets/algoviz.js')  ?: 0)
);

include __DIR__ . '/partials/head.php';

/* widget markup (built from src/) */
readfile(__DIR__ . '/assets/app.html');

/* crawlable / no-JS sitemap of every topic */
$domainHas = [];
foreach ($topics as $t) { $domainHas[$t['domain']] = true; }
?>
<noscript>
  <div style="max-width:1000px;margin:0 auto;padding:28px 20px;color:#ccc;font-family:'Noto Sans Thai',sans-serif">
    <h2 style="color:#FFC000">AlgoViz — สารบัญหัวข้อทั้งหมด</h2>
    <?php foreach ($tax['domains'] as $did => $d): if (empty($domainHas[$did]) || !empty($d['hidden'])) continue; ?>
      <h3 style="color:#fff"><?= e($d['th']) ?> · <?= e($d['en']) ?></h3>
      <?php foreach ($tax['fields'] as $fid => $f): if ($f['domain'] !== $did) continue;
        $list = array_filter($topics, fn($t) => $t['cat'] === $fid);
        if (!$list) continue; ?>
        <p><strong><?= e($f['th']) ?>:</strong>
          <?php foreach ($list as $id => $t): ?>
            <a href="<?= e($base) ?>/<?= e($id) ?>" style="color:#8FD4FF"><?= e($t['en']) ?></a> ·
          <?php endforeach; ?>
        </p>
      <?php endforeach; ?>
    <?php endforeach; ?>
  </div>
</noscript>
<?php
include __DIR__ . '/partials/footer.php';
