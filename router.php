<?php
/* Local dev server router (not needed in production — .htaccess handles routing).
   Usage: php -S 127.0.0.1:8088 -t . router.php  */
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path !== '/' && is_file(__DIR__ . $path)) return false; // serve real assets as-is
require __DIR__ . '/index.php';
