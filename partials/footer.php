<?php /* included by index.php — expects: $base,$topicId,$ASSET_V */ ?>
<script>window.AV_BASE=<?= json_encode($base) ?>;window.AV_INITIAL=<?= json_encode($topicId) ?>;</script>
<!-- anime.js (motion) + three.js (hero backdrop only) — CDN, progressive enhancement -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="<?= e($base) ?>/assets/algoviz.js?v=<?= (int)$ASSET_V ?>"></script>
</body>
</html>
